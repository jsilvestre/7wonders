module.exports.POSSIBLE_ACTIONS = {
  BUILD: 'build',
  DISCARD: 'discard',
  WONDER_STEP: 'wonder_step'
}

module.exports.addNewPlayer = (playerId) => {
  return {
    type: 'ADD_NEW_PLAYER',
    value: playerId
  }
}

module.exports.setPlayerName = (playerId, name) => {
  return {
    type: 'SET_PLAYER_NAME',
    value: { playerId, name }
  }
}

module.exports.selectPlayerCard = (playerId, cardId) => {
  return {
    type: 'SELECT_PLAYER_CARD',
    value: { playerId, cardId }
  }
}

module.exports.removePlayer = (playerId) => {
  return {
    type: 'REMOVE_PLAYER',
    value: playerId
  }
}

module.exports.setPlayerWonder = (playerId, wonderId) => {
  return {
    type: 'SET_PLAYER_WONDER',
    value: { playerId, wonderId }
  }
}

module.exports.setPlayerGold = (playerId, gold) => {
  return {
    type: 'SET_PLAYER_GOLD',
    value: { playerId, gold }
  }
}

module.exports.setPlayerHand = (playerId, handId) => {
  return {
    type: 'SET_PLAYER_HAND',
    value: { playerId, handId }
  }
}

module.exports.setPlayerOrder = (newPlayerOrder) => {
  return {
    type: 'SET_PLAYER_ORDER',
    value: newPlayerOrder
  }
}

module.exports.setHands = (hands) => {
  return {
    type: 'SET_HANDS',
    value: hands
  }
}

module.exports.markGameAsStarted = () => {
  return {
    type: 'START_GAME'
  }
}

module.exports.markTurnAsBeingResolved = () => {
  return {
    type: 'RESOLVE_TURN'
  }
}

module.exports.addTurn = (allPlayersId) => {
  const turn = {}
  allPlayersId.forEach(playerId => {
    turn[playerId] = {
      action: null,
      cardId: null,
      hasSubmittedCard: false,
    }
  })

  return {
    type: 'ADD_TURN',
    value: turn
  }
}


module.exports.selectCard = (playerId, cardId, action) => {
  return {
    type: 'SELECT_PLAYER_CARD',
    value: { playerId, cardId, action }
  }
}

module.exports.confirmCard = (playerId) => {
  return {
    type: 'CONFIRM_PLAYER_CARD',
    value: playerId
  }
}

module.exports.discardCard = (handId, cardId) => {
  return {
    type: 'DISCARD_CARD',
    value: { handId, cardId }
  }
}

module.exports.setWonders = (wonders) => {
  return {
    type: 'SET_WONDERS',
    value: wonders
  }
}

module.exports.addCards = (cards) => {
  return {
    type: 'ADD_CARDS',
    value: cards
  }
}
