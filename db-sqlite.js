const { Database } = require('./sqlite3');
const fsp = require('fs').promises;

var db;

function questionStep(group, step) {
  if (step < obecne.length) {
    return { text: obecne[step], options: [1, 2, 3, 4, 5] }
  } else {
    step -= obecne.length
  }
  if (step < table[group].length) {
    const [personId, subjectId, subgroup] = table[group][step]
    const [name, gender] = people[personId]
    const subject = subjects[subjectId]
    return { name, subject, questions: jednoduche[gender], doubleQuestions: dvojite[gender], options: [1, 2, 3, 4, 5], subgroup }
  }
  return { done: true }
}

async function listClasses() {
  return await db.all("SELECT name, syllable FROM class")
}

async function listSubjects(classSyllable) {
  return await db.all(`SELECT subject.rowid id, teacher.name teacherName, subject.name subjectName, subject.optional
    FROM subject
    JOIN teacher ON teacher.rowid = subject.teacher_id
    WHERE subject.class_id = (SELECT rowid FROM class WHERE syllable = ?)
    ORDER BY subjectName, teacherName`, [classSyllable])
}

async function answer(group, user, step, client, content) {
  const time = new Date()
  const name = "otazka"
  const data = Object.keys(content).filter(k => k.startsWith(name)).sort().map(k => content[k].replace(/\r?\n|\r/g, "//"))
  const rowid = await db.run("INSERT INTO answer (teacher_id, question_id, class_id, user_id, answer, comment, date) VALUES (?, ?, ?, ?, ?, datetime('now','localtime')) RETURNING rowid", [tid, qid, cid, uid, answer, text])
  const result = [rowid, time.toJSON(), client, group, user, step, ...data]
  await fsp.appendFile("data.csv", result.join(",") + "\n", ()=>{})

}

async function init() {
  db = await Database.open('anketa.db');
}

init()
module.exports = { answer, listClasses, listSubjects, questionStep }
