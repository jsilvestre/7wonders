const WebSocket = require('ws');
const { createStore, applyMiddleware } = require('redux')
const createForwardMiddleware = require('./dispatchToWsMiddleware')
const createNodeLogger = require('redux-node-logger')

const DB = require('./db')
const gameApp = require('./reducer')
const { onPlayerJoin, onGameAdvance } = require('./game-engine')

const server = new WebSocket.Server({ port: 8080 });

function sendAction(action) {
  action = {
    ...action,
    from: 'server'
  }
  this.send(JSON.stringify(action))
}

server.dispatchToOtherClients = function broadcastToOthers(originClient, action) {
  this.clients.forEach(client => {
    if (client !== originClient && client.readyState === WebSocket.OPEN) {
      client.sendAction(action)
    }
  })
}

server.dispatchToAllClients = function broadcast(action) {
  this.dispatchToOtherClients(null, action)
}

const logger = createNodeLogger({})
const forward = createForwardMiddleware({
  forbiddenSource: 'client',
  send: server.dispatchToAllClients.bind(server)
})

let store;
if(process.env.NODE_ENV == 'debug') {
  store = createStore(
    gameApp,
    applyMiddleware(forward, logger)
  );
} else {
  store = createStore(
    gameApp,
    applyMiddleware(forward)
  );
}

// Forward the action to all but sender.
function onMessageFromClient(server, client, store, serializedAction) {
  let action = JSON.parse(serializedAction)
  console.log('received message of type %s from %s', action.type, client.playerId)
  store.dispatch(action)
  server.dispatchToOtherClients(client, action)
}

server.on('connection', function connection(client) {
  client.sendAction = sendAction.bind(client)

  // Handle client disconnection
  client.on('close', function() {
    // Don't remove the player from state if the game has started to handle
    // reconnection.
    if(!store.getState().isGameStarted) {
      store.dispatch(removePlayer(client.playerId))
    }
  })

  // Handle game play related stuff
  onPlayerJoin(server, client, store, onMessageFromClient.bind(null, server, client, store))
})

const onGameAdvanceWithStore = onGameAdvance.bind(null, store)
store.subscribe(onGameAdvanceWithStore)
