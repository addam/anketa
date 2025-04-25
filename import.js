const fsp = require('fs').promises;
const { JSDOM: JsDom } = require('jsdom');
const { parse: parseCsv } = require('csv-parse');
const Database = require('better-sqlite3');

var db;

async function *fileWriter(filename) {
  const fd = await fsp.open(filename, 'w')
  yield fd
  await fd.close()
}

function splitKeySort(array, separator, ...keys) {
  array.sort((as, bs) => {
    const a = as.split(separator)
    const b = bs.split(separator)
    for (const k of keys) {
      if (a[k] < b[k]) {
        return -1
      } else if (a[k] > b[k]) {
        return 1
      }
    }
    return 0
  })
  return array
}

const headers = { }

async function login() {
  const { username, password } = require("./config.json")
  let response = await fetch("https://gymjs.bakalari.cz/login", {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    headers: { 'content-type': 'application/json' },
    redirect: 'manual'
  })
  headers.cookie = response.headers.get("set-cookie").split(", ").map(part => part.split(";")[0]).join("; ")
}

async function fetchHtml(url) {
  let response = await fetch(url, { headers, redirect: 'manual' })
  if ((response.headers.get("location") || "").startsWith("/login")) {
    console.error("Login failed, retrying...")
    await login()
		response = await fetch(url, { headers, redirect: 'manual' })
  }
  if ((response.headers.get("location") || "").startsWith("/login")) {
    console.error("Login failed again!")
    return null
  }
  const dom = new JsDom(await response.text())
  return dom.window.document
}

function ensureTeacher(name) {
  if (String(name) == 'null') {
    return null
  }
  const tid = db.prepare("SELECT id FROM teacher WHERE name = ?").pluck().get(name);
  if (tid !== undefined) {
    return tid;
  }
  return db.prepare("INSERT INTO teacher (name) VALUES (?) RETURNING id").pluck().get(name);
}

function classId(cname) {
  return db.prepare("SELECT id FROM class WHERE name = ?").pluck().get(cname);
}

function subjectId(teacherName, subjectName) {
  if (String(subjectName) == 'null') {
    if (String(teacherName) == 'null') {
      return null;
    }
    return db.prepare("SELECT s.id FROM subject s JOIN teacher t on s.teacher_id = t.id WHERE t.name = ?").pluck().get(teacherName);
  }
  if (String(teacherName) == 'null') {
    return db.prepare("SELECT s.id FROM subject s WHERE s.name = ?").pluck().get(subjectName);
  }
  return db.prepare("SELECT s.id FROM subject s JOIN teacher t on s.teacher_id = t.id WHERE s.name = ? AND t.name = ?").pluck().get(teacherName, subjectName);
}

function getSubject(detail) {
  return detail.subjecttext.split(" | ")[0]
}

function getTeacher(detail) {
  const regex = /^(?:(?:Bc|Ing\. arch|Ing|MgA|Mgr\. et Mgr|Mgr\.Bc|Mgr|PaedDr|RNDr|DiS)[. ]+)?(.+?)(?: Ph\.D\.| PhD\.)?$/
  return regex.exec(detail.teacher.split(",")[0])[1]
}

function getGroup(detail) {
  return detail.group
}

async function writePeople(filename) {
  const main = await fetchHtml("https://gymjs.bakalari.cz/Timetable/Public")
  const options = [...main.querySelector("#selectedClass").options].slice(1)
  const result = new Set()
  for (const opt of options) {
    const doc = await fetchHtml(`https://gymjs.bakalari.cz/Timetable/Public/Permanent/Class/${opt.value}`)
    for (const elem of doc.querySelectorAll(".day-item-hover")) {
      const detail = JSON.parse(elem.dataset["detail"])
      result.add(`${opt.text},"${getTeacher(detail)}","${getSubject(detail)}",${getGroup(detail)}`)
    }
  }
  for await (const fd of fileWriter(filename)) {
    const sorted = splitKeySort([...result], ",", 0, 2)
    fd.write(sorted.join("\n"))
  }
}

function ensureClass(cname) {
  const rotate = (char, string) => {
    return string[(string.search(char) + 1) % string.length]
  }

  const next = (syl, start) => {
    const vow = "aeiu"
    const cons = ["bp", "dt", "gk", "mn", "sz", "lr", "fhjv", "cqw"]
    let [c, v] = syl.split("")
    const [sc, sv] = start.split("")
    if (c == sc) {
      const group = cons.find(it => it.search(c) >= 0)
      c = rotate(c, group)
    } else {
      v = rotate(v, vow)
    }
    if (c == sc && v == sv) {
      throw new Error(`Conflicting syllables on "${start}"`)
    }
    return `${c}${v}`
  }

  let syl = db.prepare("SELECT id FROM class WHERE name = ?").pluck().get(cname);
  if (syl) {
    return syl
  }
  const guess = {"0": "nu", "1": "pi", "2": "su", "3": "te", "4": "ka", "5": "ki", "6": "sa", "7": "si", "8": "ko"}
  const existing = new Set(db.prepare("SELECT id FROM class").pluck().all());
  const start = syl = guess[cname[0]] || "ba";
  while (existing.has(syl)) {
    syl = next(syl, start)
  }
  db.prepare("INSERT INTO class (id, name) VALUES (?, ?)").run(syl, cname);
  return syl
}

async function importPeople(filename) {
  const fd = await fsp.open(filename)
  const parser = fd.createReadStream().pipe(parseCsv({ relax_column_count: true }))
  const query = db.prepare("INSERT INTO subject (teacher_id, class_id, name, optional) VALUES (?, ?, ?, ?)");
  for await (const [cname, teacher, subject, optional] of parser) {
    const gid = ensureClass(cname)
    const tid = ensureTeacher(teacher)
    query.run(tid, gid, subject, optional || 0);
  }
  for (const gid of db.prepare("SELECT id FROM class").pluck().all()) {
    query.run(null, gid, "first", 0);
    query.run(null, gid, "last", 0);
  }
}

async function importQuestions(filename) {
  const fd = await fsp.open(filename)
  const parser = fd.createReadStream().pipe(parseCsv())
  for await (const [subject, teacher, cname, text] of parser) {
    const sid = subjectId(teacher, subject);
    const gid = classId(cname);
    db.prepare("INSERT INTO question (subject_id, class_id, question) VALUES (?, ?, ?)").run(sid, gid, text);
  }
}

function createTables() {
  const db = Database('anketa.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);
    CREATE TABLE IF NOT EXISTS class (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE IF NOT EXISTS subject (id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER REFERENCES teacher, class_id REFERENCES class, name TEXT, optional BOOL);
    CREATE TABLE IF NOT EXISTS question (id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id REFERENCES subject DEFAULT null, class_id REFERENCES class DEFAULT null, question TEXT);
    CREATE TABLE IF NOT EXISTS subject_choice (id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id REFERENCES subject, class_id REFERENCES class, user_id TEXT,
      UNIQUE(subject_id, class_id, user_id));
    CREATE TABLE IF NOT EXISTS answer (id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id REFERENCES subject, question_id REFERENCES question, class_id REFERENCES class,
      user_id TEXT, answer INTEGER, comment TEXT, date TEXT,
      UNIQUE(subject_id, question_id, class_id, user_id));
  `);
  return db;
}

async function main() {
  if (process.argv.includes("-g")) {
    await login()
    await writePeople("uvazky.csv")
  } else {
    db = createTables()  
    await importPeople("uvazky.csv")
    await importQuestions("otazky.csv")
  }
}

if (require.main == module) {
  main().then(process.exit)
}

module.exports = {
  fetchHtml,
  writePeople,
  importPeople,
  importQuestions,
}