const express = require("express")
const cookieParser = require('cookie-parser')
const handlebars = require("express-handlebars")
const db = require("./db-sqlite")
const { checksum, generateToken } = require("./token")
const results = require("./results")

var app = express()

function sum(a) {
  return a.length && a.reduce((a, b) => a+b)
}

function recursiveLength(a) {
  if (typeof a != "object") {
    return 1
  }
  return a.length || sum(Object.values(a).map(it => recursiveLength(it)))
}

function round(val, mul=100) {
  return Math.round(mul * val) / mul
}

function recursiveAvg(obj, mul) {
  let sum = 0
  let count = 0
  for (const suba of Object.values(obj)) {
    for (const [k, v] of Object.entries(suba)) {
      if (+k) {
        sum += k * v
        count += v
      }
    }
  }
  return round(sum / count, +mul || 100)
}

app.engine("html", handlebars({
  extname: ".html",
  helpers: {
    joinBy: (data, field, delimiter) => (data.map(it=>it[field]).join(delimiter)),
    inc: (num) => (num + 1),
    eq: (a, b) => (a === b),
    len: recursiveLength,
    sum,
    avg: recursiveAvg,
    add: (...args) => sum(args.slice(0, args.length - 1)),
    stringify: (data) => (JSON.stringify(data)),
  }
}))
app.set("view engine", "html")
app.set("views", "views")
app.use(express.static("static"))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

const shem = "xy"

function getClient(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress
}

app.use(function(req, res, next){
  const token = (req.params.token || req.body.token || req.cookies.token || "").toLowerCase()
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

function login(req, res) {
  res.cookie('token', (req.params.token || req.body.token || req.cookies.token || ""), { secure: true })
  if (req.group == shem && req.user == shem) {
    res.redirect(303, '/admin')
  } else {
    res.redirect(303, '/ready')
  }
}
app.post("/", login)
app.get('/s/:token', login)

app.get('/admin', function (req, res) {
  if (req.group == shem && req.user == shem) {
    res.render('admin', { title: "Výsledky dotazníku" })
  } else {
    res.redirect(403, '/')
  }
})

app.get('/admin-comments', function (req, res) {
  if (req.group == shem && req.user == shem) {
    const data = db.comments()
    res.render('admin-comments', { title: "Komentáře dotazníku", data })
  } else {
    res.redirect(403, '/')
  }
})

app.get('/admin-graphs', function (req, res) {
  if (req.group == shem && req.user == shem) {
    const data = db.answers()
    res.render('admin-graphs', { title: "Grafy dotazníku", data })
  } else {
    res.redirect(403, '/')
  }
})

app.get('/ready', function (req, res) {
  if (!req.group || !req.user) {
    res.redirect(303, "/")
  } else if (req.group == "xy") {
    res.redirect(303, "/tokens.csv")
  } else {
    const subjectOptions = db.listOptionalSubjects(req.group, req.user)
    res.render('ready', { title: "Výběr předmětů", subjectOptions, current: 'ready' })
  }
})

app.post('/ready', function (req, res) {
  if (req.group && req.user) {
    db.chooseSubjects(req.group, req.user, req.body)
    res.redirect(303, "/steady")
  } else {
    res.redirect(303, "/")
  }
})

app.get('/steady', function (req, res) {
  if (!req.group || !req.user) {
    res.redirect(303, "/")
    return
  }
  const subjects = db.chosenSubjects(req.group, req.user)
  res.render('steady', { title: "Přehled dotazníku", subjects, current: 'steady' })
})

app.post('/steady', function (req, res) {
  if (db.generalQuestions(req.group, req.user, 'first').length) {
    res.redirect(303, "/first");
  } else {
    res.redirect(303, '/go/1');
  }
})

app.get('/first', function (req, res) {
  if (req.group && req.user) {
    const questions = db.generalQuestions(req.group, req.user, 'first')
    const subjects = db.chosenSubjects(req.group, req.user)
    res.render('first', { title: "Úvod dotazníku", questions, subjects, current: 'first' })
  } else {
    res.redirect(303, '/')
  }
})

app.post('/first', async function (req, res) {
  if (req.group && req.user) {
    await db.generalAnswer(req.group, req.user, 'first', getClient(req), req.body)
    res.redirect(303, '/go/1')
  } else {
    res.redirect(303, '/')
  }
})

app.get('/go/:step', function (req, res) {
  const step = Number(req.params.step)
  if (req.group && req.user && step) {
    const subjects = db.chosenSubjects(req.group, req.user)
    const teacher = subjects[step - 1]
    if (teacher) {
      db.fillQuestions(req.group, req.user, teacher)
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
  const subjects = db.chosenSubjects(req.group, req.user)
  if (step < subjects.length) {
    res.redirect(303, `/go/${step + 1}`)
  } else if (db.generalQuestions(req.group, req.user, 'last').length) {
    res.redirect(303, '/last')
  } else {
    res.redirect(303, '/done')
  }
})

app.get('/last', function (req, res) {
  if (req.group && req.user) {
    const questions = db.generalQuestions(req.group, req.user, 'last')
    const subjects = db.chosenSubjects(req.group, req.user)
    res.render('last', { title: "Závěr dotazníku", questions, subjects, current: 'last' })
  } else {
    res.redirect(303, '/')
  }
})

app.post('/last', async function (req, res) {
  if (req.group && req.user) {
    await db.generalAnswer(req.group, req.user, 'last', getClient(req), req.body)
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
      const tridy = db.listClasses()
      console.log(tridy)
      const data = tridy.map(({ name, id }) => `${name};` + generateToken(id, "x3"))
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
