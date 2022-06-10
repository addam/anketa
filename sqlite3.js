const sqlite3 = require('sqlite3');

function promisify(func) {
  return (...args) => new Promise((resolve, reject) => {
    const result = func(...args, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data || result)
      }
    })
  })
}

function promisifyAsterisk(func) {
  return function*(...args) {
    func(...args, (err, row) => {
      if (err) {
        throw err
      } else {
        yield(row)
      }
    })
  }
}

class Database {
  constructor(sub) {
    this.get = promisify(sub.get.bind(sub))
    this.run = promisify(sub.run.bind(sub))
    this.whatever = () => { return "nazdar" }
    this.each = promisifyAsterisk(sub.each.bind(sub))
  }
}

Database.open = function(...args) {
  return new Promise((resolve, reject) => {
    const result = new sqlite3.Database(...args, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve(new Database(result))
      }
    })
  })
}

module.exports = { Database }
