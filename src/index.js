//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

// Dir paths

const getAppDataPath = require('appdata-path')
const path = require('path')

const dir = getAppDataPath('Beaver Architect')
const projectsDir = path.join(dir, 'projects')
const architectsDir = path.join(dir, 'architects')

// Database

const db = require("./database")

db.open()

// Express

const express = require('express')
const app = express()
const projectsRouter = require('./routes/projects')

app.use(express.json())

app.use('/projects', projectsRouter)

app.listen(8025)


//Exports

module.exports = { dir, projectsDir, architectsDir }