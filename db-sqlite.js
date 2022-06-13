const { Database } = require('./sqlite3');
const fsp = require('fs').promises;

var db;

async function init() {
  db = await Database.open('anketa.db');
}

function shuffle(array, hash) {
  for (var i = array.length - 1; i > 0; i--) {
    const r = hash(array[i]) % i;
    [array[i], array[r]] = [array[r], array[i]]
  }
  return array
}

function groupByTeacher(subjects) {
  const result = {}
  for (const sub of subjects) {
    tid = sub.teacherId
    let list = result[tid]
    if (!list) {
      list = []
      result[tid] = list
    }
    list.push(sub)
  }
  return Object.entries(result).map(([teacherId, subjects]) => ({ teacherId, subjects }))
}

init()
module.exports = {

questionStep(group, step) {
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
},

async listClasses() {
  return await db.all("SELECT name, syllable FROM class")
},

async listSubjects(gid) {
  return await db.all(`SELECT subject.rowid id, teacher.name teacherName, subject.name subjectName, subject.optional
    FROM subject
    JOIN teacher ON teacher.rowid = subject.teacher_id
    WHERE subject.class_id = ?
    ORDER BY subjectName, teacherName`, [gid])
},

async chooseSubjects(gid, uid, body) {
  await db.run("DELETE FROM subject_choice WHERE class_id = ? and user_id = ?", [gid, uid])
  console.log(gid, uid, body)
  for await (const sid of db.each("SELECT rowid FROM subject WHERE optional = 1 AND class_id = ?", [gid])) {
    console.log(sid, `subject_${sid}`, body[`subject_${sid}`])
    if (body[`subject_${sid}`] == 1) {
      return await db.run("INSERT INTO subject_choice (subject_id, class_id, user_id) VALUES (?, ?, ?)", [sid, gid, uid])
    }
  }
},

async chosenSubjects(gid, uid, step) {
  const subjects = await db.all(`SELECT subject.rowid id, teacher.rowid teacherId, teacher.name teacherName, subject.name subjectName
    FROM subject
    JOIN teacher ON teacher.rowid = subject.teacher_id
    LEFT JOIN subject_choice sc ON sc.subject_id = subject.rowid
    WHERE subject.class_id = ? 
    AND (subject.optional = 0 OR sc.user_id = ?)`, [gid, uid])
  const list = groupByTeacher(subjects)
  const salt = 17 * uid.charCodeAt(0) + 37 * uid.charCodeAt(1)
  shuffle(list, ({ teacherId }) => salt * teacherId)
  const result = list[step]
  for (const sub of result.subjects) {
    sub.questions = await db.all(`SELECT question FROM question
      WHERE teacher_id IN (?, null)
      AND class_id IN (?, null)`, [sub.teacherId, gid])
    result.teacherName = sub.teacherName
  }
  return result
},

async answer(group, user, step, client, content) {
  const time = new Date()
  const name = "otazka"
  const data = Object.keys(content).filter(k => k.startsWith(name)).sort().map(k => content[k].replace(/\r?\n|\r/g, "//"))
  const rowid = await db.get("REPLACE INTO answer (teacher_id, question_id, class_id, user_id, answer, comment, date) VALUES (?, ?, ?, ?, ?, datetime('now','localtime')) RETURNING rowid", [tid, qid, cid, uid, answer, text])
  const result = [rowid, time.toJSON(), client, group, user, step, ...data]
  await fsp.appendFile("data.csv", result.join(",") + "\n", ()=>{})
},

}

