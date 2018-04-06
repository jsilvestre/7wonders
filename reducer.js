const initialState = {
  players: {
    /*
      id: int,
      name: <string>,
      wonderId: <id::wonder>,
      gold: <int>,
      handId: <id::hand>,
      cardsBuilt: [<id::card>]
    */
    byId: {},
    allIds: []
  },
  cards: {
    /*
      name: <string>,
      minPlayers: <int>,
      cost: <null|List of "resource: value">
      effect: <List of "resource: value">
    */
    byId: {},
    allIds: [],
    discarded: []
  },
  wonders: {
    /*
      name: <string>
      effect: <List of "resource: value">
    */
    byId: {}
  },
  hands: {
    // [[id::card]]
    byId: {},
  },
  turns: [],
    /*
    action: <string::DB.POSSIBLE_ACTIONS>,
    cardId: <id::cards>,
    hasSubmittedCard: <bool>,
    */
  game: {
    maxPlayers: 3,
    isStarted: false,
    currentAge: null,
    isTurnBeingResolved: false
  }
  //playerOrder: [],
  //nextPlayerId: 0,
  //maxPlayers: 3,
  //isGameStarted: false,
  //isTurnBeingResolved: false,
  //currentAge: null,
  //hands: null,
  //turns: [],
  //discardedCards: []
}

module.exports = function gameApp(state = initialState, action) {

  let playerId, wonderId, cardId, handId, gold, name;

  switch (action.type) {
    case 'ADD_NEW_PLAYER':
      const newPlayer = {
        id: action.value,
        name: null,
        wonderId: null,
        handId: null,
        gold: null,
        cardsBuilt: []
      }

      return {
        ...state,
        players: {
          ...state.players,
          byId: {
            ...state.players.byId,
            [newPlayer.id]: newPlayer
          },
          allIds: [
            ...state.players.allIds,
            newPlayer.id
          ]
        },
      }

    case 'REMOVE_PLAYER':
      const clonedPlayers = { ...state.players.byId }
      delete clonedPlayers[action.value]
      return {
        ...state,
        players: {
          ...state.players,
          byId: clonedPlayers,
          allIds: state.player.allIds.filter(id => id !== action.value)
        }
      }

    case 'SET_PLAYER_NAME':
      playerId = action.value.playerId
      name = action.value.name
      return {
        ...state,
        players : {
          ...state.players,
          byId: {
            ...state.players.byId,
            [playerId]: {
              ...state.players.byId[playerId],
              name
            }
          }
        }
      }

    case 'SET_PLAYER_WONDER':
      playerId = action.value.playerId
      wonderId = action.value.wonderId
      return {
        ...state,
        players : {
          ...state.players,
          byId: {
            ...state.players.byId,
            [playerId]: {
              ...state.players.byId[playerId],
              wonderId
            }
          }
        }
      }

    case 'SET_PLAYER_GOLD':
      playerId = action.value.playerId
      gold = action.value.gold
      return {
        ...state,
        players : {
          ...state.players,
          byId: {
            ...state.players.byId,
            [playerId]: {
              ...state.players.byId[playerId],
              gold
            }
          }
        }
      }

      case 'SET_PLAYER_HAND':
        playerId = action.value.playerId
        handId = action.value.handId
        return {
          ...state,
          players : {
            ...state.players,
            byId: {
              ...state.players.byId,
              [playerId]: {
                ...state.players.byId[playerId],
                handId
              }
            }
          }
        }

    case 'SET_PLAYER_ORDER':
      return {
        ...state,
        players: {
          ...state.players,
          allIds: action.value
        }
      }

    case 'SET_WONDERS':
      return {
        ...state,
        wonders: {
          ...state.wonders,
          byId: action.value
        }
      }

    case 'SET_HANDS':
      return {
        ...state,
        hands: {
          ...state.hands,
          byId: action.value
        }
      }

    case 'START_GAME':
      return {
        ...state,
        game: {
          ...state.game,
          isGameStarted: true,
          currentAge: 1
        }
      }

    case 'RESOLVE_TURN':
      return {
        ...state,
        game: {
          ...state.game,
          isTurnBeingResolved: true
        }
      }

    case 'ADD_TURN':
      return {
        ...state,
        turns: [...state.turns, action.value]
      }

    case 'ADD_CARDS':
      return {
        ...state,
        cards: {
          ...state.cards,
          byId: {
            ...state.cards.byId,
            ...action.value
          },
          allIds: state.cards.allIds.concat(Object.keys(action.value))
        }
      }

    case 'SELECT_PLAYER_CARD':
      return {
        ...state,
        turns: state.turns.map((turn, index) => {
          // only change latest turn
          if (index + 1 == state.turns.length) {
            return {
              ...turn,
              [action.value.playerId]: {
                ...turn[action.value.playerId],
                cardId: action.value.cardId,
                action: action.value.action
              }
            }
          }
          else {
            return turn
          }
        })
      }

    case 'CONFIRM_PLAYER_CARD':
      return {
        ...state,
        turns: state.turns.map((turn, index) => {
          if (index + 1 == state.turns.length) {
            return {
              ...turn,
              [action.value]: {
                ...turn[action.value],
                hasSubmittedCard: true
              }
            }
          }
          else {
            return turn
          }
        })
      }

    case 'DISCARD_CARD':
      cardId = action.value.cardId
      handId = action.value.handId
      return {
        ...state,
        cards: {
          ...state.cards,
          discarded: [...state.cards.discarded, cardId]
        },
        hands: {
          ...state.hands,
          byId: {
            ...state.hands.byId,
            [handId]: state.hands.byId[handId].filter(id => id != cardId)
          }
        }
      }

    default:
      console.log('No handler of action "%s"', action.type)
      return state
  }
}
