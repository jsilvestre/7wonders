const uuid = require('uuid/v4')
const shuffle = require('lodash/shuffle')

const {
  addNewPlayer, removePlayer, setPlayerName, setPlayerGold, setPlayerWonder,
  setPlayerHand, selectPlayerCard, setHands, markGameAsStarted, setPlayerOrder,
  addTurn, markTurnAsBeingResolved, setWonders, addCards, discardCard,
  POSSIBLE_ACTIONS
} = require('./actions')

const DB = require('./db')

module.exports.onPlayerJoin = function onPlayerJoin(server, client, store, onMessageFromClient) {
  const { maxPlayers, isGameStarted } = store.getState().game
  const allPlayersId = store.getState().players.allIds
  const numberOfPlayers = allPlayersId.length

  // Add new player to the game if there is room available and the game has not
  // started yet.
  if (numberOfPlayers < maxPlayers && !isGameStarted) {

    // Add a new player to the game
    const newPlayerId = uuid()
    const addPlayerAction = addNewPlayer(newPlayerId)
    client.playerId = newPlayerId
    console.log('dispatch to store')
    store.dispatch(addPlayerAction)

    // The client has no state yet, it must be initialized. A client's
    // state is the shared state plus its player id.
    const initClient = {
      type: 'INIT_CLIENT',
      value : {
        ...store.getState(),
        playerId: newPlayerId
      }
    }
    client.sendAction(initClient)

    // Handle message received from client when the player is initialized.
    client.on('message', onMessageFromClient)

    // if there is enough players, start the game
    const isTakingLastEmptySlot = numberOfPlayers + 1 === maxPlayers
    if(isTakingLastEmptySlot) {
      module.exports.startGame(store)
    }

  } else if (isGameStarted) {
    console.log('manage reconnection here')
  } else {
    console.log('no room for more players')
  }
}

module.exports.startGame = function startGame(store) {

  dispatchPlayers(store)
  distributeWonders(store)
  distributeGold(store)

  // Mark the game as started.
  store.dispatch(markGameAsStarted())

  prepareDeck(store)
  startTurn(store)
}

// Define who will be "sitting" next to who
function dispatchPlayers(store) {
  const allPlayersId = store.getState().players.allIds.slice()
  // Shuffle the player order so everyone's neighbour is random.
  const randomizedPlayersId = shuffle(allPlayersId)
  store.dispatch(setPlayerOrder(randomizedPlayersId))

  return randomizedPlayersId
}

// Pick randomly the right amount of wonders and save their data into state.
function distributeWonders(store) {
  const allPlayersId = store.getState().players.allIds
  const wonderIds = Object.keys(DB.wonders)

  const allWondersById = shuffle(wonderIds).splice(0, allPlayersId.length)
  const wonders = allWondersById.reduce((previous, wonderId) => {
    previous[wonderId] = DB.wonders[wonderId]
    return previous
  }, {})
  store.dispatch(setWonders(wonders))

  // Give each player a wonder.
  allPlayersId.forEach((playerId, index) => {
    store.dispatch(setPlayerWonder(playerId, allWondersById[index]))
  })
}

function distributeGold(store) {
  const allPlayersId = store.getState().players.allIds
  // Give each player the default amount of gold.
  allPlayersId.forEach((playerId, index) => {
    store.dispatch(setPlayerGold(playerId, DB.DEFAULT_GOLD))
  })
}

function prepareDeck(store) {

  const allPlayersId = store.getState().players.allIds
  const { currentAge } = store.getState().game

  // Filter cards by number of players.
  const cardsList = DB.age[currentAge].filter((card) => {
    return card.minPlayers <= allPlayersId.length
  })

  // Save their data into state.
  const cards = cardsList.reduce((previous, card, index) => {
    // For age 2 and 3, index must be summed with previous array length so there
    // is no collision between ids.
    previous[index] = card
    return previous
  }, {})
  store.dispatch(addCards(cards))

  // Shuffle the cards.
  let allCardsId = store.getState().cards.allIds
  allCardsId = shuffle(allCardsId)

  // Make hands of cards.
  let pivot = 0
  let nextPivot, result;
  const hands = allPlayersId.map((playerId, index) => {
    nextPivot = (index + 1) * 7
    result = allCardsId.slice(pivot, nextPivot)
    pivot = nextPivot
    return result;
  }).reduce((previous, hand, index) => {
    // Make it an object indexed by id
    previous[index] = hand
    return previous
  }, {})

  store.dispatch(setHands(hands))
}

function startTurn(store) {

  // Give each player a hand of cards.
  const allPlayersId = store.getState().players.allIds
  const allHandsId = Object.keys(store.getState().hands.byId)
  allPlayersId.forEach((playerId, index) => {
    store.dispatch(setPlayerHand(playerId, allHandsId[index]))
  })

  store.dispatch(addTurn(allPlayersId))
}

module.exports.onGameAdvance = function onGameAdvance(store) {
  const { turns } = store.getState()
  const { isGameStarted, isTurnBeingResolved } = store.getState().game

  // resolve a turn
  if (isGameStarted && turns.length > 0 && !isTurnBeingResolved) {
    const currentTurn = turns[turns.length - 1]
    const playerStatuses = Object.keys(currentTurn)
    const remaningPlayersToPlay = playerStatuses.filter(playerId => {
      return !currentTurn[playerId].hasSubmittedCard
    })

    if (remaningPlayersToPlay.length > 0) {
      console.log("waiting for players %s to pick card", remaningPlayersToPlay)
    } else {
      store.dispatch(markTurnAsBeingResolved())
      const playersById = store.getState().players.byId
      const allPlayersId = store.getState().players.allIds
      let cardId, playerHand, cardDetails;
      allPlayersId.forEach((playerId) => {
        const { cardId, action } = currentTurn[playerId]
        const { handId, gold } = playersById[playerId]
        const cardDetails = store.getState().cards.byId[cardId]
        console.log('player %s played card "%s" with action "%s"', playerId, cardDetails.name, action)

        if (action === POSSIBLE_ACTIONS.BUILD) {
          console.log('Action "%s" must be implemented.', POSSIBLE_ACTIONS.BUILD)
        } else if (action === POSSIBLE_ACTIONS.DISCARD) {
          store.dispatch(setPlayerGold(playerId, gold + DB.GOLD_FOR_DISCARD))
          store.dispatch(discardCard(handId, cardId))
        } else if (action === POSSIBLE_ACTIONS.WONDER_STEP) {
          console.log('Action "%s" must be implemented.', POSSIBLE_ACTIONS.WONDER_STEP)
        } else {
          console.log('Wrong action type: %s. Must be one of %s', action, Object.keys(POSSIBLE_ACTIONS))
        }
      })

      console.log('Hand switching must be implemented.')

    }
  }
}
