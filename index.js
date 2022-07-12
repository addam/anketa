const express = require("express")
const cookieParser = require('cookie-parser')
const assert = require("assert")
const handlebars = require("express-handlebars")
const url = require("url")
const db = require("./db-sqlite")
const { checksum, generateToken } = require("./token")
const results = require("./results")

var app = express()
app.engine("html", handlebars({
  extname: ".html",
  helpers: {
    joinBy: (data, field, delimiter) => (data.map(it=>it[field]).join(delimiter)),
    inc: (num) => (num + 1),
    eq: (a, b) => (a == b),
    add: (...args) => (args.slice(0, args.length - 1).reduce((a, b) => a+b)),
    stringify: (data) => (JSON.stringify(data)),
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

function forceInt(input) {
  const result = Math.round(input)
  return (Number.isFinite(result)) ? result : 0
}

function errorHandler (err, req, res, next) {
  console.error("errorHandler", err)
  res.status(500).send({ error: 'Something failed!' })
}

function getClient(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress
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

async function login(req, res) {
  res.cookie('token', (req.body.token || req.cookies.token || ""), { secure: true })
  if (req.group == shem && req.user == shem) {
    res.redirect(303, '/admin')
  } else {
    res.redirect(303, '/ready')
  }
}
app.post("/", login)
app.get('/s/:token', login)

app.get('/admin', async function (req, res) {
  if (req.group == shem && req.user == shem) {
    const data = await db.summarize('2022-06-27 08:00:00')
    res.render('admin', { title: "Výsledky dotazníku", data })
  } else {
    res.redirect(403, '/')
  }
})

app.get('/ready', async function (req, res) {
  if (!req.group || !req.user) {
    res.redirect(303, "/")
  } else if (req.group == "xy") {
    res.redirect(303, "/tokens.csv")
  } else {
    const subjectOptions = await db.listOptionalSubjects(req.group, req.user)
    res.render('ready', { title: "Výběr předmětů", subjectOptions, current: 'ready' })
  }
})

app.post('/ready', async function (req, res) {
  if (req.group && req.user) {
    await db.chooseSubjects(req.group, req.user, req.body)
    res.redirect(303, "/steady")
  } else {
    res.redirect(303, "/")
  }
})

app.get('/steady', async function (req, res) {
  const subjects = await db.chosenSubjects(req.group, req.user)
  const filledEarly = (await db.isFilledEarly(req.group, req.user, "2022-06-30 08:47:51")) ? "true" : ""
  res.render('steady', { title: "Přehled dotazníku", subjects, current: 'steady', filledEarly })
})

app.post('/steady', async function (req, res) {
  res.redirect(303, "/go/1")
})

app.get('/go/:step', async function (req, res) {
  const step = Number(req.params.step)
  if (req.group && req.user && step) {
    const subjects = await db.chosenSubjects(req.group, req.user)
    const teacher = subjects[step - 1]
    if (teacher) {
      await db.fillQuestions(req.group, req.user, teacher)
      res.render('go', { title: teacher.teacherName, teacher, subjects, current: `go/${step}` })
    }
  } else {
    console.log("missing data:", req.group, req.user, step)
    res.redirect(303, '/')
  }
})

app.post('/go/:step', async function (req, res) {
  const step = Number(req.params.step)
  if (!req.group || !req.user) {
    res.redirect(303, `/go/${step}`)
    return
  }
  await db.answer(req.group, req.user, step, getClient(req), req.body)
  const subjects = await db.chosenSubjects(req.group, req.user)
  if (step < subjects.length) {
    res.redirect(303, `/go/${step + 1}`)
  } else {
    res.redirect(303, '/last')
  }
})

app.get('/last', async function (req, res) {
  if (req.group && req.user) {
    const questions = await db.lastQuestions(req.group, req.user)
    const subjects = await db.chosenSubjects(req.group, req.user)
    res.render('last', { title: "Závěr dotazníku", questions, subjects, current: 'last' })
  } else {
    res.redirect(303, '/')
  }
})

app.post('/last', async function (req, res) {
  if (req.group && req.user) {
    await db.lastAnswer(req.group, req.user, getClient(req), req.body)
    res.redirect(303, '/done')
  } else {
    res.redirect(303, '/')
  }
})

app.get('/done', async function (req, res) {
  res.render('done', { title: "Konec dotazníku", current: 'done' })
})

app.get("/tokens.csv", async function (req, res) {
  if (req.group === shem) {
    if (req.user === shem) {
      const tridy = await db.listClasses()
      console.log(tridy)
      //const data = tridy.map(({ name, syllable }) => `${name};` + generateToken(shem, syllable))
      const data = tridy.map(({ name, syllable }) => `${name};` + generateToken(syllable, "x3"))
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

app.get("/results.xlsx", async function (req, res) {
  if (req.group == shem && req.user == shem) {
    results(req, res, db)
  } else {
    res.redirect(403, '/')
  }
})

var port = process.env.PORT || 5000
app.listen(port)
console.log(`Dotazníky běží na http://localhost:${port}. Šém: ${generateToken(shem, shem)}`)
