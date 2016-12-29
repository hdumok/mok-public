/**
 * Created by hdumok on 2016/8/6.
 */

'use strict';

import fs from 'fs';
import util from 'util'
import moment from 'moment';
import log4js from 'log4js'
import redis from './redis'
import info from '../package.json'

if(!fs.existsSync('./logs')) fs.mkdirSync('./logs');

log4js.configure({ // 输出类型
    appenders: [
        {
            category: 'console',
            type: 'console'
        },
        {
            category: 'server',
            type: 'dateFile',
            filename: './logs/log',
            alwaysIncludePattern: true,
            pattern: '-yyyy-MM-dd.log'
        }
    ],
    replaceConsole: true,
    levels: {
        'console': LOG_LEVEL,
        'server': LOG_LEVEL
    }
})

let logServer = log4js.getLogger('server')

let consoleLog = console.log
console.log = function (...args) {
    consoleLog.apply(console, args)
    logServer.info.apply(logServer, args)
}

let consoleDebug = console.debug
console.debug = function (...args) {
    consoleDebug.apply(console, args)
    logServer.debug.apply(logServer, args)
}

let consoleError = console.error
console.error = function (...args) {
    consoleError.apply(console, args)
    logServer.error.apply(logServer, args)

    if(NODE_ENV === 'production'){
        let time = `\ntime: ${moment(Date.now()).format('GGGG年MM月DD日 HH:mm:ss')}`
        let serverInfo = `\nname: ${info.name}\nversion: ${info.version}\n\n`
        let message = time + serverInfo + util.format.apply(util, args)
        redis.lpush(CONSTANTS.CHANNEL_LOG, message)
    }
}

process.on('uncaughtException', function (err) {
    console.error('uncaughtException: \n' + err.stack)
})

let [log, debug, error] = [console.log, console.debug, console.error]

export {log, debug, error}

