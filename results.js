const xl = require("excel4node")

function forEachSorted(map, callback) {
  const array = Array.from(map.entries()).sort(([ak, av], [bk, bv]) => (ak < bk) ? -1 : (bk < ak) ? 1 : 0)
  array.forEach(([k, v]) => callback(v, k))
}

function forEachIterated(map, depth, callback, keyCallback, prefix=[]) {
  if (depth > 0) {
    let total = 0
    forEachSorted(map, (value, key) => {
      prefix.push(key)
      const here = forEachIterated(value, depth - 1, callback, keyCallback, prefix)
      prefix.pop()
      if (keyCallback !== undefined) {
        keyCallback(prefix.length, here, key)
      }
      total += here
    })
    return total
  } else {
    callback(prefix, map)
    return 1
  }
}

// items: [column1, column2, ...], where each column is a compound key of [value1, ...]
// callback: (row, startCol, endCol, value) => void
function forEachGrouped(items, callback) {
  const previous = [] // list of last changed { value, column } on each level of the compound key
  items.forEach((key, column) => {
    key.forEach((value, row) => {
      const prev = previous[row] || [null, 0]
      if (value !== prev.value) {
        if (prev[0] !== null) {
          callback(row, prev.column, column, prev.value)
        }
        previous[row] = { value, column }
      }
    })
  })
  previous.forEach((prev, row) => {
    if (prev.column < items.length) {
      callback(row, prev.column, items.length, prev.value)
    }
  });
}

async function fillDataset(db) {
  const groupTypes = ["tsc", "ts", "t", "c"]
  const wb = new xl.Workbook()
  const bold = wb.createStyle({
    font: {
      bold: true,
    },
  });

  for (const grouping of groupTypes) {
    const ws = wb.addWorksheet(grouping)
    const data = db.answersGrouped(grouping + "q")
    const header = [...grouping]
    console.log("initial header:", header);
    let row = 2
    const leftMerger = [...grouping].map(it => [null, 0])
    forEachIterated(data, grouping.length, (prefix, rowData) => {
      row += 1
      prefix.forEach((value, index) => {
        if (value !== leftMerger[index][0]) {
          leftMerger[index] = [value, row]
        }
        const start = leftMerger[index][1]
      })
      forEachIterated(rowData, 2, (top, value) => {
        const colName = top.join("|")
        const column = (header.indexOf(colName) + 1) || header.push(colName)
        if (value !== null) {
          ws.cell(row, column).number(value)
        }
      })
    }, (column, height, value) => {
      ws.cell(row - height + 1, column + 1, row, column + 1, true).string(value).style(bold)
    })
    console.log("final header:", header);
    forEachGrouped(header.map(it => it.split("|")), (row, startCol, endCol, value) => {
      ws.cell(row + 1, startCol + 1, row + 1, endCol, true).string(value)
    })
    ws.row(2).freeze()
    ws.column(grouping.length).freeze()
  }
  return wb
}

module.exports = async (req, res, db) => {
  const wb = await fillDataset(db)
  return wb.write("combined.xlsx", res)
}
