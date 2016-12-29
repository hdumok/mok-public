/**
 * Created by hdumok on 2016/12/5.
 */
require('babel-register')({
    'presets': ['es2015', 'stage-2'],
    'plugins': ['transform-runtime'],
    'comments': false
})

require('babel-polyfill')

global.NODE_ENV = process.env.NODE_ENV || 'development'
global.CONSTANTS = require('./constant')
global.CONFIG = require('./config')[NODE_ENV]
global.LOG_LEVEL = process.env.LOG_LEVEL || 'DEBUG'

let app = require('./app')
app.start()