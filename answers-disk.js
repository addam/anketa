const fs = require('fs');

function answer(group, user, step, client, content) {
  const time = new Date()
  const name = "otazka"
  const data = Object.keys(content).filter(k => k.startsWith(name)).sort().map(k => content[k].replace(/\r?\n|\r/g, "//"))
  const result = [Number(time), client, group, user, step, ...data]
  fs.appendFile("data.csv", result.join(",") + "\n", ()=>{})
}

module.exports = {answer}
