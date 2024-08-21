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

// Database

const db = require("./database")

db.open()

// Express

const express = require('express')
const app = express()
const projectsRouter = require('./routes/projects')
const settingsRouter = require('./routes/settings')

app.use(express.json())

app.use('/projects', projectsRouter)
app.use('/settings', settingsRouter)

app.listen(8025)

console.log('Express open on http://localhost:8025/')