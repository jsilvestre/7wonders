const WebSocket = require('ws');
const { createStore, applyMiddleware } = require('redux')
const createNodeLogger = require('redux-node-logger')
const createForwardMiddleware = require('./dispatchToWsMiddleware')

const gameApp = require('./reducer')
const {
  setPlayerName, selectPlayerCard, selectCard, confirmCard, POSSIBLE_ACTIONS
} = require('./actions')

function sendAction(action) {
  action = {
    ...action,
    from: 'client'
  }
  this.send(JSON.stringify(action))
}

const client = new WebSocket('ws://localhost:8080');

const forward = createForwardMiddleware({
  forbiddenSource: 'server',
  send: sendAction.bind(client)
})

const logger = createNodeLogger({})
let store = null;

client.on('open', function open() {
  console.log('socket open and ready')
});

let action;
client.on('message', function incoming(serializedAction) {
  action = JSON.parse(serializedAction)
  console.log('received message of type %s', action.type)

  if (store !== null) {
    store.dispatch(action)
  } else if (action.type === 'INIT_CLIENT') {
    store = createStore(
     gameApp,
     action.value,
     applyMiddleware(forward, logger)
    )
    const playerId = store.getState().playerId
    store.dispatch(setPlayerName(playerId, `Joseph${playerId}`))
    store.subscribe(onStateChange.bind(null, store))
 } else {
   console.log('Store is not initialized, ignoring all action (received "%s")', action.type)
 }
})

function onStateChange(store) {
  const { playerId, turns } = store.getState()
  const { isGameStarted, isTurnBeingResolved } = store.getState().game
  const handsById = store.getState().hands.byId
  const playersById = store.getState().players.byId

  if (isGameStarted && turns.length > 0 && !isTurnBeingResolved) {
    let currentTurn = turns[turns.length - 1]
    let currentTurnPlayer = currentTurn[playerId]
    let currentPlayerHand = handsById[playersById[playerId].handId]

    if(currentTurnPlayer.cardId === null && currentTurnPlayer.action === null) {
      console.log('I randomly pick one card and one action to do')
      const randomCardIndex = Math.floor(Math.random() * (currentPlayerHand.length - 1))
      const cardId = currentPlayerHand[randomCardIndex]
      const actionsToPick = [
        POSSIBLE_ACTIONS.BUILD,
        POSSIBLE_ACTIONS.DISCARD,
        POSSIBLE_ACTIONS.WONDER_STEP
      ]
      const action = actionsToPick[Math.floor(Math.random() * 3)]
      store.dispatch(selectCard(playerId, cardId, action))
    } else if (!currentTurnPlayer.hasSubmittedCard){
      console.log('I submit this choice')
      store.dispatch(confirmCard(playerId))
    } else {
      console.log('I am waiting for other players and server')
    }
  }
}
