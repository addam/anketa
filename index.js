const express = require("express")
const assert = require("assert")
const handlebars = require("express-handlebars")
const crypto = require("crypto")
const db = require("./db-sqlite")

var app = express()
app.engine("html", handlebars({
  extname: ".html",
  helpers: {
  }
}))
app.set("view engine", "html")
app.set("views", "views")
app.use(express.static("static"))
app.use(express.urlencoded({ extended: true }))

const shem = "xy"
const salt = "V5d4y2HfScSz5o7X"

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
  return readable(hmac.digest().slice(0, 4))
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
	res.render("index", { title: "Studentské dotazníky" })
})

app.post("/", async function (req, res) {
  if (req.group === shem) {
    if (req.user === shem) {
      const tridy = await db.listClasses()
      console.log(tridy)
      const data = tridy.map(({ name, syllable }) => `${name};` + generateToken(shem, syllable))
      res.attachment("tokens-admin.csv");
      res.send(data.join("\r\n"))
    } else {
      const userCount = 26
      const testCount = 4
      const group = req.user
      const data = Array(userCount + testCount).fill().map((_, i) => i < testCount ? `x${i+1}` : syllable(i - testCount)).map(s => generateToken(group, s))
      res.attachment(`tokens-${group}.csv`)
      res.send(data.join("\r\n"))
    }
  } else if (req.group !== undefined) {
    const client = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    const step = (req.step || 0) + 1
    const token = req.body.token
    if (step > 3) {
      await answer(req.group, req.user, req.step, client, req.body)
    }
    if (step == 1) {
      const subjects = (await db.listSubjects(req.group)).filter(it => it.optional)
      res.render("nastaveni", { title: "Výběr předmětů", subjects, token, step })
    } else if (step == 2) {
      const subjects = await db.listSubjects(req.group)
      res.render("prehled", { title: "Přehled dotazníku", subjects, token, step })
    } else {
      res.render("formular", { title: "Jméno Příjmení", token, step })
    }
  } else {
    res.render("index", { title: "Studentské dotazníky", invalidToken: req.body.token })
  }
})

var port = process.env.PORT || 5000
app.listen(port)
console.log(`Dotazníky běží na http://localhost:${port}. Šém: ${generateToken(shem, shem)}`)
