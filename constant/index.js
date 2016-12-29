/**
 * Created by hdumok on 2016/8/6.
 */

'use strict'

import fs from 'fs'
import path from 'path'

const constantRoot = path.join(__dirname)
const constantFile = fs.readdirSync(constantRoot)
const constants = {}

for (var file of constantFile) {
    if (file === 'index.js') continue

    Object.assign(constants, require(path.join(constantRoot, file)))
}

module.exports = constants
