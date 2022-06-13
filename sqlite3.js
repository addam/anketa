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
  const sentinel = new Error("end iteration")
  let innerStep
  let innerEnd
  const step = (err, data) => {
    if (err) {
      innerEnd(err)
    } else {
      innerStep(data)
    }
  }
  const end = (err, _) => {
    innerEnd(err || sentinel)
  }
  const asynchronous = () => new Promise((resolve, reject) => {
    // invert function flow back to reverse
    innerStep = resolve
    innerEnd = reject
  })
  async function* iterate(...args) {
    func(...args, step, end)
    try {
      while (1) {
        const res = await asynchronous()
        yield res
      }
    } catch (e) {
      if (e == sentinel) {
        return
      }
      throw e
    }
  }
  return iterate
}


function one(object) {
  console.log("one from", object)
  for (const key in object) {
    return object[key]
  }
}

class Database {
  constructor(sub) {
    this.get = promisify(sub.get.bind(sub))
    this.run = promisify(sub.run.bind(sub))
    this.all = promisify(sub.all.bind(sub))
    this.each = promisifyAsterisk(sub.each.bind(sub))
  }
  
  async getone(...args) {
    return one(await this.get(...args))
  }

  async allone(...args) {
    return (await this.all(...args)).map(it => one(it))
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
