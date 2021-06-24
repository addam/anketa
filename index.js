const express = require("express")
const assert = require("assert")
const handlebars = require("express-handlebars")
const bodyparser = require("body-parser")
const crypto = require("crypto")
const {tridy, questionStep} = require("./questions-disk")
const {answer} = require("./answers-disk")

var app = express()
app.engine("html", handlebars({
  extname: ".html",
  helpers: {
  }
}))
app.set("view engine", "html")
app.set("views", "views")
app.use("/static", express.static("static"))
app.use(bodyparser.urlencoded({ extended: true }))

const shem = "xy"
const salt = "L5eGYoHGScSz5o7X"

function forceInt(input) {
  const result = Math.round(input)
  return (Number.isFinite(result)) ? result : 0
}

function syllable(int) {
  const sa = "aeiu".split("")
  const su = "bdfghjklmnprstvz".split("")
  const alphabet = sa.flatMap(a => su.map(h => h+a))
  return alphabet[int % alphabet.length]
}

function readable(buffer) {
  return Array.from(buffer).map(syllable).join("")
}

function checksum(text) {
	const hmac = crypto.createHmac("sha256", salt)
	hmac.update(text)
  return readable(hmac.digest().slice(0, 3))
}

function generateToken(group, user) {
  const payload = group + user
  return payload + checksum(payload)
}

app.use(function(req, res, next){
  const token = (req.body.token || "").toLowerCase()
  if (token && token.length > 4) {
    const [payload, check] = [token.slice(0, 4), token.slice(4)]
    if (check === checksum(payload)) {
      req.group = payload.slice(0, 2)
      req.user = payload.slice(2, 4)
      req.step = forceInt(req.body.step)
    }
  }
  next()
})

app.get("/", function (req, res) {
	res.render("index", {})
})

app.post("/", async function (req, res) {
  if (req.group === shem) {
    const data = (req.user === shem)
      ? Object.entries(tridy).map(([tr, name]) => `${name};` + generateToken(req.group, tr))
      : Array(26).fill().map((_, i) => i ? syllable(i) : shem).map(s => generateToken(req.user, s))
    const filename = (req.user === shem) ? "tokens-admin" : `tokens-${req.user}`
    res.set("Content-Disposition", `attachment; filename=${filename}.csv`)
    res.set("Content-Type", "text/csv")
    res.send(data.join("\r\n"))
  } else if (req.group !== undefined) {
    const client = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    if (req.step) {
      answer(req.group, req.user, req.step, client, req.body)
    }
    const question = questionStep(req.group, req.step)
    res.render("formular", {...question, step: req.step + 1, token: req.body.token})
  } else {
    res.render("index", {invalidToken: req.body.token})
  }
})

var port = process.env.PORT || 5000
app.listen(port)
console.log(`Dotazníky běží na http://localhost:${port}. Šém: ${generateToken(shem, shem)}`)
