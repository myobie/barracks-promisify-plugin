exports.promisifySend = function (send) {
  return (action, data) => {
    return new Promise((resolve, reject) => {
      try {
        send(action, data, (err, res) => {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }
}
