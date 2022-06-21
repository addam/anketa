const crypto = require("crypto")
const { salt } = require("./config")

function syllable(int) {
  const sa = "aeiu".split("")
  const su = "bdfghjklmnprstvz".split("")
  const alphabet = sa.flatMap(a => su.map(h => h+a))
  return alphabet[int % alphabet.length]
}

function readable(buffer) {
  return Array.from(buffer).map(syllable).join("")
}

function checksum(text) {
	const hmac = crypto.createHmac("sha256", salt)
	hmac.update(text)
  return readable(hmac.digest().slice(0, 4))
}

function generateToken(group, user) {
  const payload = group + user
  return payload + checksum(payload)
}

module.exports = { checksum, generateToken, syllable }
