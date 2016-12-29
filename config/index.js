/**
 * Created by hdumok on 2016/8/6.
 */

'use strict'

import fs from 'fs'
import path from 'path'

const configRoot = path.join(__dirname)
const configFile = fs.readdirSync(configRoot)
const configs = {}

for (let file of configFile) {
  if (file === 'index.js') continue

  configs[file.split('.')[0]] = require(path.join(configRoot, file))
}

module.exports = configs
