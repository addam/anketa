const qrImage = require('qr-image')
const fsp = require('fs').promises
const xml2js = require('xml2js');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const hb = require('handlebars')

const { Database } = require('./sqlite3');
const { syllable: getSyllable, generateToken } = require('./token');

function enumerate(array) {
  return array.map((x, i) => [i, x])
}

async function qr(text, transform) {
  const data = qrImage.imageSync(text, { type: 'svg', size: 10 });
  const xml = await xml2js.parseStringPromise(data)
  return {path: xml.svg.path[0], $: { transform }}
}

async function main() {
  const db = await Database.open('anketa.db')
  const file = await fsp.readFile("template.svg", { encoding: "utf-8" })
  const xml = await xml2js.parseStringPromise(file)
  const builder = new xml2js.Builder({ renderOpts: {pretty: false}});
  const pages = xml.svg.g
  const pagelist = xml.svg["sodipodi:namedview"][0]["inkscape:page"]
  const [pagelistTempl, _] = [pagelist.pop(), pagelist.pop()]
  const templ1 = hb.compile(JSON.stringify(pages[1].g.pop()))
  const templ2 = hb.compile(JSON.stringify(pages[0].g.pop()))
  const p1 = hb.compile(JSON.stringify(pages.pop()))
  const p2 = hb.compile(JSON.stringify(pages.pop()))
  for (const {syllable, name: trida} of await db.all("SELECT syllable, name FROM class")) {
    const userCount = 29
    const testCount = 1
    const tokens = Array(userCount + testCount).fill().map((_, i) => i < testCount ? `x${i+1}` : getSyllable(i - testCount)).map(s => generateToken(syllable, s))
    for (const [i, token] of enumerate(tokens)) {
      if (i % 10 == 0) {
        const j = pages.length
        const np = [JSON.parse(p1({ trida })), JSON.parse(p2({ trida }))]
        np[0].$.id = np[0].$["inkscape:label"] = `page${j}`
        np[0].$.transform = `translate(0,${320 * j})`
        np[1].$.id = np[1].$["inkscape:label"] = `page${j + 1}`
        np[1].$.transform = `translate(0,${320 * (j + 1)})`
        pages.unshift(...np)
        pagelist.push({$: {...pagelistTempl.$, x: 0, y: 320 * j}})
        pagelist.push({$: {...pagelistTempl.$, x: 0, y: 320 * (j + 1)}})
      }
      const data = { stres: "stres.gymjs.cz", vyuka: "vyuka.gymjs.cz", syllable, token };
      const x = i % 2
      const y = Math.floor(i / 2) % 5
      const d1 = JSON.parse(templ1(data));
      d1.$.transform = `translate(${21 + 85 * x},${11 + 55 * y})`
      d1.g[2] = await qr(`https://${data.stres}/s/${syllable}`, "translate(49,17)")
      pages[0].g.push(d1)
      const d2 = JSON.parse(templ2(data));
      if (token[2] == "x") {
        d2.rect[0].$.style = "fill:#fcc;stroke-width:3;stroke:white;"
      }
      d2.$.transform = `translate(${-6 - 85 * x},${-298 + 55 * y })`
      d2.g[2] = await qr(`https://${data.vyuka}/s/${token}`, "translate(160,326)")
      pages[1].g.push(d2)
    }
  }
  data = builder.buildObject(xml);
  await fsp.writeFile("export.svg", data)
  await exec('inkscape --file=export.svg --without-gui --export-pdf=export.pdf');
}

main()
