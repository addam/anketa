const fsp = require('fs').promises;
const got = require('got');
const { JSDOM: JsDom } = require('jsdom');
const { parse: parseCsv } = require('csv-parse');
const { Database } = require('./sqlite3');

var db;

async function *fileWriter(filename) {
  const fd = await fsp.open(filename, 'w')
  yield fd
  await fd.close()
}

async function fetchHtml(url) {
  const response = await got(url)
  const dom = new JsDom(response.body)
  return dom.window.document
}

async function ensureTeacher(name) {
  if (String(name) == 'null') {
    return null
  }
  return await db.getone("INSERT INTO teacher (name) VALUES (?) ON CONFLICT DO UPDATE SET name = name RETURNING rowid", [name])
}

async function teacherId(name) {
  console.log("get teacher", name)
  if (name == "last") {
    return name
  }
  return await db.getone("SELECT rowid FROM teacher WHERE name = ?", [name])
}

async function classId(cname) {
  console.log("get class", cname)
  return await db.getone("SELECT syllable FROM class WHERE name = ?", [cname])
}

function getSubject(detail) {
  return detail.subjecttext.split(" | ")[0]
}

function getTeacher(detail) {
  const regex = /^(?:(?:Bc|Ing\. arch|Ing|MgA|Mgr\. et Mgr|Mgr\.Bc|Mgr|PaedDr|RNDr)[. ]+)?(.+?)(?: Ph\.D\.| PhD\.)?$/
  return regex.exec(detail.teacher.split(",")[0])[1]
}

async function writePeople(filename) {
  const main = await fetchHtml("https://gymjs.bakalari.cz/Timetable/Public")
  const options = [...main.querySelector("#selectedClass").options].slice(1)
  const result = new Set()
  for (const opt of options) {
    const doc = await fetchHtml(`https://gymjs.bakalari.cz/Timetable/Public/Permanent/Class/${opt.value}`)
    for (const elem of doc.querySelectorAll(".day-item-hover")) {
      const detail = JSON.parse(elem.dataset["detail"])
      result.add(`${opt.text},"${getTeacher(detail)}","${getSubject(detail)}"`)
    }
  }
  for await (const fd of fileWriter(filename)) {
    fd.write([...result].join("\n"))
  }
}

async function ensureClass(cname) {
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

  let syl = await db.getone("SELECT syllable FROM class WHERE name = ?", [cname])
  if (syl) {
    return syl
  }
  const guess = {"0": "nu", "1": "pi", "2": "su", "3": "te", "4": "ka", "5": "ki", "6": "sa", "7": "si", "8": "ko"}
  const existing = new Set(await db.allone("SELECT syllable FROM class"))
  const start = syl = guess[cname[0]]
  while (existing.has(syl)) {
    syl = next(syl, start)
  }
  await db.run("INSERT INTO class (syllable, name) VALUES (?, ?)", [syl, cname])
  return syl
}

async function ensureSubject(cname, teacher, subject, optional) {
  const gid = await ensureClass(cname)
  const tid = await ensureTeacher(teacher)
  optional = optional || 0
  await db.run("REPLACE INTO subject (teacher_id, class_id, name, optional) VALUES (?, ?, ?, ?)", [tid, gid, subject, optional])
  return [tid, gid, subject, optional]
}

async function importPeople(filename) {
  const fd = await fsp.open(filename)
  const parser = fd.createReadStream().pipe(parseCsv())
  for await (const record of parser) {
    await ensureSubject(...record)
  }
}

async function insertQuestion(teacher, cname, text) {
  const tid = await teacherId(teacher)
  const gid = await classId(cname)
  await db.run("REPLACE INTO question (teacher_id, class_id, question) VALUES (?, ?, ?)", [tid, gid, text])
}

async function importQuestions(filename) {
  const fd = await fsp.open(filename)
  const parser = fd.createReadStream().pipe(parseCsv())
  for await (const record of parser) {
    await insertQuestion(...record)
  }
}

async function createTables() {
  const db = await Database.open('anketa.db');
  await db.run("CREATE TABLE IF NOT EXISTS teacher (name TEXT PRIMARY KEY)");
  await db.run("CREATE TABLE IF NOT EXISTS class (syllable TEXT PRIMARY KEY, name TEXT)");
  await db.run("CREATE TABLE IF NOT EXISTS subject (teacher_id INTEGER REFERENCES teacher, class_id REFERENCES class, name TEXT, optional BOOL)");
  // FIXME question should be linked to "subject_id" rather than "teacher_id"
  await db.run("CREATE TABLE IF NOT EXISTS question (teacher_id REFERENCES teacher DEFAULT null, class_id REFERENCES class DEFAULT null, question TEXT)");
  await db.run("CREATE TABLE IF NOT EXISTS subject_choice (subject_id REFERENCES subject, class_id REFERENCES class, user_id TEXT, UNIQUE(subject_id, class_id, user_id))");
  await db.run("CREATE TABLE IF NOT EXISTS answer (subject_id REFERENCES subject, question_id REFERENCES question, class_id REFERENCES class, user_id TEXT, answer INTEGER, comment TEXT, date TEXT, UNIQUE(subject_id, question_id, class_id, user_id))");
  return db;
}

async function main() {
  db = await createTables()  
  //await writePeople("uvazky.csv")
  await importPeople("uvazky.csv")
  await importQuestions("otazky.csv")
}

main()  
