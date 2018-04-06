module.exports = options => store => next => action => {
  // Prevent action loop.
  if (action.from !== options.forbiddenSource) {
    console.log('forwarding action %s', action.type)
    options.send(action)
  }
  return next(action)
}
