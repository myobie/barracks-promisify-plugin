exports.every = function every (interval, cb) {
  return new Promise((resolve, reject) => {
    let intervalId

    function handle (promise) {
      Promise.resolve(promise).catch(e => {
        clearInterval(intervalId)
        reject(e)
      })
    }

    intervalId = setInterval(() => handle(cb()), interval)
    handle(cb()) // run immediately
  })
}
