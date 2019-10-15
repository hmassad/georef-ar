const fs = require('fs')

const load = file => JSON.parse(fs.readFileSync(file))

module.exports = {
    load
}