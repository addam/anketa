const express = require("express")
const cookieParser = require('cookie-parser')
const assert = require("assert")
const handlebars = require("express-handlebars")
const crypto = require("crypto")
const db = require("./db-sqlite")

var app = express()
app.engine("html", handlebars({
  extname: ".html",
  helpers: {
    joinBy(data, field, delimiter) {
      return data.map(it=>it[field]).join(delimiter)
    },
    inc(num) {
      return num + 1
    }
  }
}))
app.set("view engine", "html")
app.set("views", "views")
app.use(express.static("static"))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
// TODO fix error handling
//app.use(errorHandler)

const shem = "xy"
const salt = "V5d4y2HfScSz5o7X"

function errorHandler (err, req, res, next) {
  console.error("errorHandler", err)
  res.status(500).send({ error: 'Something failed!' })
}

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
  const token = (req.body.token || req.cookies.token || "").toLowerCase()
  if (token && token.length > 4) {
    const [payload, check] = [token.slice(0, 4), token.slice(4)]
    if (check === checksum(payload)) {
      req.group = payload.slice(0, 2)
      req.user = payload.slice(2, 4)
    }
  }
  next()
})

app.get("/", function (req, res) {
	res.render("index", { title: "Studentské dotazníky" })
})

app.get("/ready", async function (req, res) {
  if (req.group == "xy") {
    res.redirect(303, "/tokens.csv")
  } else {
    const subjects = (await db.listSubjects(req.group)).filter(it => it.optional)
    res.render("nastaveni", { title: "Výběr předmětů", subjects })
  }
})

app.post("/ready", async function (req, res) {
  if (req.group && req.user) {
    await db.chooseSubjects(req.group, req.user, req.body)
    res.redirect(303, "/steady")
  } else {
    res.redirect(303, "/")
  }
})

app.get("/steady", async function (req, res) {
  const subjects = await db.chosenSubjects(req.group, req.user)
  res.render("prehled", { title: "Přehled dotazníku", subjects })
})

app.post("/steady", async function (req, res) {
  res.redirect(303, "/go/1")
})

app.get("/go/:step", async function (req, res) {
  const step = Number(req.params.step)
  if (req.group && req.user && step) {
    const subjects = await db.chosenSubjects(req.group, req.user)
    const teacher = subjects[step - 1]
    if (teacher) {
      await db.fillQuestions(req.group, teacher)
      res.render("formular", { title: teacher.teacherName, teacherSubjects: teacher.subjects, subjects })
    } else {
      res.render("konec", { title: "Konec dotazníku", subjects })
    }
  } else {
    console.log("missing data:", req.group, req.user, step)
    res.redirect(303, `/`)
  }
})

app.post("/go/:step", async function (req, res) {
  const step = Number(req.params.step)
  const client = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  await db.answer(req.group, req.user, step, client, req.body)
  res.redirect(303, `/go/${step + 1}`)
})

app.post("/", async function (req, res) {
  res.cookie('token', req.body.token, { secure: true })
  res.redirect(303, '/ready')
})

app.get("/tokens.csv", async function (req, res) {
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
  } else {
    res.render("index", { title: "Studentské dotazníky", invalidToken: req.body.token })
  }
})

var port = process.env.PORT || 5000
app.listen(port)
console.log(`Dotazníky běží na http://localhost:${port}. Šém: ${generateToken(shem, shem)}`)
