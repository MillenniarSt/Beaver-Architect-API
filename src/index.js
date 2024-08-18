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

const db = require("./database")

db.open()


const express = require('express')
const app = express()
const projectsRouter = require('./routes/projects')

app.use(express.json())

app.use('/projects', projectsRouter)

app.listen(8025)