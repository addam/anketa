const Database = require('better-sqlite3')
const fsp = require('fs').promises;

const db = Database('anketa.db');
db.pragma('journal_mode = WAL');

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

function setdefault(map, index, ...args) {
  if (args.length > 1) {
    let inner = map[index]
    if (!inner) {
      inner = {}
      map[index] = inner
    }
    setdefault(inner, ...args)
  } else {
    map[index] = args[0]
  }
}

function setdefaultlist(map, index, ...args) {
  if (args.length > 1) {
    let inner = map[index]
    if (!inner) {
      inner = {}
      map[index] = inner
    }
    setdefaultlist(inner, ...args)
  } else {
    let list = map[index]
    if (list === undefined) {
      list = []
      map[index] = list
    }
    if (args[0] != "null") {
      list.push(args[0])
    }
  }
}

function getDefault(map, key, type=Map) {
  return map.get(key) || (map.set(key, new type()).get(key))
}

function getDefaultMap(map, keys) {
  let result = map
  for (const key of keys) {
    result = getDefault(result, key)
  }
  return result
}

function getKeys(map, keys) {
  return 
}

module.exports = {

listClasses() {
  return db.prepare("SELECT name, id FROM class").all()
},

listOptionalSubjects(gid, uid) {
  const result = db.prepare(`SELECT subject.id, teacher.name teacherName, subject.name subjectName
    FROM subject
    JOIN teacher ON teacher.id = subject.teacher_id
    WHERE subject.class_id = ?
    AND subject.optional > 0
    ORDER BY subjectName, teacherName`).all(gid);
  const choice = new Set(db.prepare("SELECT subject_id id FROM subject_choice WHERE user_id = ?").pluck().all(uid))
  for (const subject of result) {
    subject.selected = choice.has(subject.id)
  }
  return result
},

chooseSubjects(gid, uid, body) {
  db.prepare("DELETE FROM subject_choice WHERE class_id = ? and user_id = ?").run(gid, uid);
  const insertQuery = db.prepare("INSERT INTO subject_choice (subject_id, class_id, user_id) VALUES (?, ?, ?)");
  for (const sid of db.prepare("SELECT id FROM subject WHERE optional = 1 AND class_id = ?").pluck().all(gid)) {
    if (body[`subject_${sid}`] == 1) {
      insertQuery.run(sid, gid, uid);
    }
  }
},

chosenSubjects(gid, uid) {
  const subjects = db.prepare(`SELECT subject.id, teacher.id teacherId, teacher.name teacherName, subject.name subjectName
    FROM subject
    JOIN teacher ON teacher.id = subject.teacher_id
    LEFT JOIN subject_choice sc ON sc.subject_id = subject.id
    WHERE subject.class_id = ? 
    AND (subject.optional = 0 OR sc.user_id = ?)`).all(gid, uid);
  const result = groupByTeacher(subjects)
  const salt = 17 * uid.charCodeAt(0) + 37 * uid.charCodeAt(1)
  shuffle(result, ({ teacherId }) => salt * teacherId)
  return result
},

isFilledEarly(group, user, time) {
  const count = db.prepare(`SELECT count(*) FROM answer WHERE class_id = ? AND user_id = ? AND date <= ?`).pluck().get(group, user, time);
  return count
},

// fill questions and existing answers to a `teacher` object (consisting of all subjects taught by the teacher)
fillQuestions(group, user, teacher) {
    if (!teacher) {
      return null
    }
    const questionsQuery = db.prepare(`SELECT q.id, q.question, a.answer, a.comment
        FROM question q
        LEFT JOIN answer a ON a.question_id = q.id AND a.user_id = ? AND a.subject_id = :subjectId
        WHERE (q.subject_id is null OR q.subject_id = :subjectId) -- global or personalized question
        AND (q.class_id = ? OR q.class_id IS null)`);
    for (const subject of teacher.subjects) {
      subject.questions = questionsQuery.all(user, group, { subjectId: subject.id });
      for (const question of subject.questions) {
        if (question.comment === null) {
          question.answer = undefined;
        }
      }
    }
    const tid = Number(teacher.teacherId)
    teacher.comment = db.prepare(`SELECT a.comment FROM answer a 
      JOIN subject s on s.id = a.subject_id
      WHERE a.question_id IS NULL 
      AND a.class_id = ? AND a.user_id = ?
      AND s.teacher_id = ?`).pluck().get(group, user, tid);
    return teacher
},

async answer(group, user, step, client, content) {
  const time = new Date()
  const regex = /^otazka_([0-9]+)_([0-9]+)$/
  let subjectId
  const answerQuery = db.prepare(`REPLACE INTO answer (subject_id, question_id, class_id, user_id, answer, comment, date)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime')) RETURNING id`);
  for (const key of Object.keys(content)) {
    const match = regex.exec(key)
    if (match === null) {
      continue
    }
    const [_, sid, qid] = match
    const num = Number(content[key])
    const comment = (content[`${key}_text`] || "").replace(/\r?\n|\r/g, "//")
    // basic questions are stored with correct keys: subject_id, question_id
    // custom questions are stored: subject_id = 0, question_id links to the teacher
    const { id: aid } = answerQuery.get(Number(sid), Number(qid), group, user, num, comment);
    subjectId = subjectId || Number(sid)
    const log = [aid, time.toJSON(), client, group, user, step, num, comment]
    await fsp.appendFile("data.csv", log.join(",") + "\n", ()=>{})
  }
  // teacher comment is stored: subject_id = (first subject teached), question_id = null
  if (subjectId && content.comment) {
    db.prepare(`DELETE FROM answer
      WHERE subject_id = ? AND question_id is null AND class_id = ? AND user_id = ? AND answer is null`).run(subjectId, group, user);
    const { id: aid } = answerQuery.get(subjectId, null, group, user, null, content.comment);
    const log = [aid, time.toJSON(), client, group, user, step, content.comment]
    await fsp.appendFile("data.csv", log.join(",") + "\n", ()=>{})
  }
},

generalQuestions(group, user, subjectName) {
  return db.prepare(`SELECT q.id, q.question, a.comment
    FROM question q
    LEFT JOIN answer a ON a.question_id = q.id AND a.class_id = ? AND a.user_id = ?
    WHERE q.subject_id = (select id from subject where name = ?)`).all(group, user, subjectName);
},

async generalAnswer(group, user, subjectName, client, content) {
  const time = new Date()
  const regex = /^otazka_([0-9]+)$/
  for (const key of Object.keys(content)) {
    const match = regex.exec(key)
    if (match === null) {
      continue
    }
    const [_, qid] = match
    const comment = (content[key] || "").replace(/\r?\n|\r/g, "//")
    const aid = db.prepare(`REPLACE INTO answer (subject_id, question_id, class_id, user_id, answer, comment, date)
      VALUES ((select id from subject where name = ?), ?, ?, ?, null, ?, datetime('now','localtime')) RETURNING id`).pluck()
      .get(subjectName, qid, group, user, comment);
    const log = [aid, time.toJSON(), client, group, user, comment]
    await fsp.appendFile("data.csv", log.join(",") + "\n", ()=>{})
  }
},

answersGrouped(grouping) {
  const query = db.prepare(`SELECT teacher.name t, subject.name s, class.name c, question.question q, avg(answer) avg, count(answer) count
    FROM answer
    JOIN subject ON subject.id = answer.subject_id
    JOIN class ON class.id = answer.class_id
    JOIN teacher ON teacher.id = subject.teacher_id
    JOIN question ON question.id = answer.question_id
    WHERE substr(user_id, 1, 1) != 'x'
    GROUP BY ${[...grouping]}`);
  const result = new Map()
  for (const row of query.iterate()) {
    const sub = getDefaultMap(result, [...grouping].map(it => row[it]));
    sub.set("avg", row.avg)
    sub.set("count", row.count)
  }
  return result
  //"tsc"->
  //{"Adam Dominec": {"Informatika a komunikační technika": {"4.": {"Její/jeho hodnocení (známky, slovní hodnocení, ústní komentáře atd.) mě vede k tomu, jak se zlepšovat.": 3.14, ...}, {"5.": {...}}}, "Programování - seminář": {...}}, "Alan Orr": {...}, ...}
},

comments() {
  const query = db.prepare(`SELECT subject.name s, class.name c, question.question q, teacher.name t, comment
    FROM answer
    LEFT JOIN subject ON answer.subject_id = subject.id
    LEFT JOIN class ON answer.class_id = class.id
    LEFT JOIN teacher ON subject.teacher_id = teacher.id
    LEFT JOIN question ON question_id = question.id
    WHERE substr(user_id, 1, 1) != 'x'`);
  result = {}
  for (const { t, s, c, q, comment } of query.iterate()) {
    if (comment != "") {
      setdefaultlist(result, t, s, c, q, comment)
    }
  }
  return result
},

answers() {
  const query = db.prepare(`SELECT subject.name s, class.name c, question.question q, teacher.name t, answer.answer a, count(answer) cnt
  FROM answer
  LEFT JOIN subject ON answer.subject_id = subject.id
  LEFT JOIN class ON answer.class_id = class.id
  LEFT JOIN teacher ON subject.teacher_id = teacher.id
  LEFT JOIN question ON question_id = question.id
  WHERE substr(user_id, 1, 1) != 'x' AND q is not null
  GROUP BY t, s, q, c, a`);
  result = {}
  for (const { t, s, q, c, a, cnt } of query.iterate()) {
    setdefault(result, t, s, q, c, a, cnt)
  }
  return result
}
}

