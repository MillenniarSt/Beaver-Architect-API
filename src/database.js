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

const mongo = require("mongodb")

const url = "mongodb://localhost:27017/beaver_architect"
const client = new mongo.MongoClient(url)

let db

async function open() {
  await client.connect()
  db = client.db("beaver_architect")
  console.log(`MongoDB open on ${url}`)
}

async function close() {
  await client.close()
}

function getAllProjects(query, callback) {
  db.collection('projects').find(query).toArray(callback)
}

function getProject(id, callback) {
  db.collection('projects').findOne({ _id: id }, callback)
}

function addProject(project, callback) {
  db.collection('projects').insertOne(project, callback)
}

function modifyProject(id, changes, callback) {
  db.collection('projects').updateOne({ _id: id }, changes, callback)
}

function deleteProject(id, callback) {
  db.collection('projects').deleteOne({ _id: id }, callback)
}

module.exports = { open, close, getAllProjects, getProject, addProject, modifyProject }