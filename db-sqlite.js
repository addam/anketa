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
  const groups = {}
  for (const sub of subjects) {
    tid = sub.teacherId
    let list = groups[tid]
    if (!list) {
      list = []
      groups[tid] = list
    }
    list.push(sub)
  }
  return Object.entries(groups).map(([teacherId, subjects]) => ({ teacherId, subjects, teacherName: subjects[0].teacherName }))
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

async listOptionalSubjects(gid, uid) {
  const result = await db.all(`SELECT subject.rowid id, teacher.name teacherName, subject.name subjectName
    FROM subject
    JOIN teacher ON teacher.rowid = subject.teacher_id
    WHERE subject.class_id = ?
    AND subject.optional > 0
    ORDER BY subjectName, teacherName`, [gid])
  const choice = new Set(await db.allone("SELECT subject_id id FROM subject_choice WHERE user_id = ?", [uid]))
  for (const subject of result) {
    subject.selected = choice.has(subject.id)
  }
  return result
},

async chooseSubjects(gid, uid, body) {
  await db.run("DELETE FROM subject_choice WHERE class_id = ? and user_id = ?", [gid, uid])
  for await (const { rowid: sid } of db.each("SELECT rowid FROM subject WHERE optional = 1 AND class_id = ?", [gid])) {
    if (body[`subject_${sid}`] == 1) {
      // this run cannot be awaited because it does not return data. That actually sucks pretty bad.
      db.run("INSERT INTO subject_choice (subject_id, class_id, user_id) VALUES (?, ?, ?)", [sid, gid, uid])
    }
  }
},

async chosenSubjects(gid, uid) {
  const subjects = await db.all(`SELECT subject.rowid id, teacher.rowid teacherId, teacher.name teacherName, subject.name subjectName
    FROM subject
    JOIN teacher ON teacher.rowid = subject.teacher_id
    LEFT JOIN subject_choice sc ON sc.subject_id = subject.rowid
    WHERE subject.class_id = ? 
    AND (subject.optional = 0 OR sc.user_id = ?)`, [gid, uid])
  const result = groupByTeacher(subjects)
  const salt = 17 * uid.charCodeAt(0) + 37 * uid.charCodeAt(1)
  shuffle(result, ({ teacherId }) => salt * teacherId)
  return result
},

async isFilledEarly(group, user, time) {
  const count = await db.getone(`SELECT count(*) FROM answer WHERE class_id = ? AND user_id = ? AND date <= ?`, [group, user, time])
  return count
},

async fillQuestions(group, user, teacher) {
    if (!teacher) {
      return null
    }
    const tid = Number(teacher.teacherId)
    for (const sub of teacher.subjects) {
      sub.questions = await db.all(`SELECT q.rowid id, q.question, a.answer, a.comment
        FROM question q
        LEFT JOIN answer a ON a.question_id = q.rowid AND a.user_id = ? AND a.subject_id = ? AND a.class_id = ?
        WHERE (q.teacher_id = ? OR q.teacher_id IS null)
        AND (q.class_id = ? OR q.class_id IS null)`, [user, sub.id, group, tid, group])
    }
    teacher.comment = await db.getone(`SELECT a.comment
    FROM answer a 
    JOIN subject s on s.rowid = a.subject_id
    WHERE a.question_id IS NULL 
    AND a.class_id = ? AND a.user_id = ?
    AND s.teacher_id = ?`, [group, user, tid])
    return teacher
},

async answer(group, user, step, client, content) {
  const time = new Date()
  const regex = /^otazka_([0-9]+)_([0-9]+)$/
  let subjectId
  for (const key of Object.keys(content)) {
    const match = regex.exec(key)
    if (match === null) {
      continue
    }
    const [_, sid, qid] = match
    const num = Number(content[key])
    const comment = (content[`${key}_text`] || "").replace(/\r?\n|\r/g, "//")
    const rowid = await db.get("REPLACE INTO answer (subject_id, question_id, class_id, user_id, answer, comment, date) VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime')) RETURNING rowid", [Number(sid), Number(qid), group, user, num, comment])
    subjectId = Number(sid)
    const log = [rowid, time.toJSON(), client, group, user, step, num, comment]
    await fsp.appendFile("data.csv", log.join(",") + "\n", ()=>{})
  }
  if (subjectId && content.comment) {
    const rowid = await db.get("REPLACE INTO answer (subject_id, question_id, class_id, user_id, answer, comment, date) VALUES (?, null, ?, ?, null, ?, datetime('now','localtime')) RETURNING rowid", [subjectId, group, user, content.comment])
  }
},

async lastQuestions(group, user) {
  return await db.all(`SELECT q.rowid id, q.question, a.comment
  FROM question q
  LEFT JOIN answer a ON a.question_id = q.rowid AND a.class_id = ? AND a.user_id = ?
  WHERE q.teacher_id = 'last'`, [group, user])
},

async lastAnswer(group, user, client, content) {
  const time = new Date()
  const regex = /^otazka_([0-9]+)$/
  for (const key of Object.keys(content)) {
    const match = regex.exec(key)
    if (match === null) {
      continue
    }
    const [_, qid] = match
    const comment = (content[key] || "").replace(/\r?\n|\r/g, "//")
    const rowid = await db.getone("REPLACE INTO answer (subject_id, question_id, class_id, user_id, answer, comment, date) VALUES ('last', ?, ?, ?, null, ?, datetime('now','localtime')) RETURNING rowid", [qid, group, user, comment])
    const log = [rowid, time.toJSON(), client, group, user, comment]
    await fsp.appendFile("data.csv", log.join(",") + "\n", ()=>{})
  }
},

}

