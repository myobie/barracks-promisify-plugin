const { promisifySend } = require('./promisify-send')

module.exports = () => ({
  wrapSubscriptions: fn => {
    return (send, done) => {
      const newSend = promisifySend(send)
      return Promise.resolve(fn(newSend)).catch(err => done(err))
    }
  },
  wrapEffects: fn => {
    return (data, state, send, done) => {
      const newSend = promisifySend(send)
      return Promise.resolve(fn(data, state, newSend))
        .then(res => done(null, res))
        .catch(err => done(err))
    }
  }
})

module.exports.promisifySend = promisifySend
