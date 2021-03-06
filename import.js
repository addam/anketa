const fsp = require('fs').promises;
const got = require('got');
const { JSDOM: JsDom } = require('jsdom');
const { parse } = require('csv-parse');
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

async function teacherId(name) {
  if (String(name) == 'null') {
    return null
  }
  const { rowid } = await db.get("INSERT INTO teacher (name) VALUES (?) ON CONFLICT DO UPDATE SET name = name RETURNING rowid", [name])
  return rowid
}

async function classId(name) {
  if (String(name) == 'null') {
    return null
  }
  const { rowid } = await db.get("INSERT INTO class (name) VALUES (?) ON CONFLICT DO UPDATE SET name = name RETURNING rowid", [name])
  return rowid
}

async function ensureSubject(cls, teacher, subject) {
  const cid = await classId(cls)
  const tid = await teacherId(teacher)
  await db.run("REPLACE INTO subject (teacher_id, class_id, name) VALUES (?, ?, ?)", [tid, cid, subject])
  return [tid, cid, subject]
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

async function importPeople(filename) {
  const fd = await fsp.open(filename)
  const parser = fd.createReadStream().pipe(parse())
  for await (const record of parser) {
    await ensureSubject(...record)
  }
}

async function insertQuestion(teacher, cls, text) {
  const tid = await teacherId(teacher)
  const cid = await classId(cls)
  await db.run("REPLACE INTO question (teacher_id, class_id, question) VALUES (?, ?, ?)", [tid, cid, text])
}

async function importQuestions(filename) {
  const fd = await fsp.open(filename)
  const parser = fd.createReadStream().pipe(parse())
  for await (const record of parser) {
    await insertQuestion(...record)
  }
}

async function createTables() {
  const db = await Database.open('anketa.db');
  await db.run("CREATE TABLE IF NOT EXISTS teacher (name TEXT PRIMARY KEY)");
  await db.run("CREATE TABLE IF NOT EXISTS class (name TEXT PRIMARY KEY)");
  await db.run("CREATE TABLE IF NOT EXISTS subject (teacher_id INTEGER REFERENCES teacher, class_id INTEGER REFERENCES class, name TEXT)");
  await db.run("CREATE TABLE IF NOT EXISTS question (teacher_id REFERENCES teacher DEFAULT null, class_id REFERENCES class DEFAULT null, question TEXT)");
  return db;
}

async function main() {
  db = await createTables()  
  //await writePeople("uvazky.csv")
  await importPeople("uvazky.csv")
  await importQuestions("otazky.csv")
}

main()  
