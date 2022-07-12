const xl = require("excel4node")

function forEachSorted(map, callback) {
  const array = Array.from(map.entries()).sort(([ak, av], [bk, bv]) => (ak < bk) ? -1 : (bk < ak) ? 1 : 0)
  array.forEach(([k, v]) => callback(v, k))
}

function forEachIterated(map, depth, callback, prefix=[]) {
  if (depth > 0) {
    forEachSorted(map, (value, key) => {
      prefix.push(key)
      forEachIterated(value, depth - 1, callback, prefix)
      prefix.pop()
    })
  } else {
    callback(prefix, map)
  }
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
    const data = await db.answersGrouped(grouping + "q")
    const header = [...grouping]
    let row = 3
    forEachIterated(data, grouping.length, (prefix, rowData) => {
      prefix.forEach((value, index) => {
        ws.cell(row, index + 1).string(value).style(bold)
      })
      forEachIterated(rowData, 2, (top, value) => {
        const colName = top.join("|")
        const column = (header.indexOf(colName) + 1) || header.push(colName)
        ws.cell(row, column).number(value)
      })
      row += 1
    })
    header.forEach((layers, index) => {
      layers.split("|").forEach((value, row) => {
        ws.cell(row + 1, index + 1).string(value)
      })
    })
  }
  return wb
}

module.exports = async (req, res, db) => {
  const wb = await fillDataset(db)
  return wb.write("combined.xlsx", res)
}
