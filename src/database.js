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
const { errorMongo } = require("./routes/util")

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

function getAll(collection, query, res, success) {
  db.collection(collection).find(query).toArray().catch((err) => errorMongo(res, err, 'get')).then((result) => success(result))
}

function get(collection, id, res, success) {
  db.collection(collection).findOne({ _id: new mongo.ObjectId(id) }).catch((err) => errorMongo(res, err, 'get')).then((result) => success(result))
}

function add(collection, project, res, success) {
  db.collection(collection).insertOne(project).catch((err) => errorMongo(res, err, 'add')).then((result) => success(result))
}

function modify(collection, id, changes, res, success) {
  db.collection(collection).updateOne({ _id: new mongo.ObjectId(id) }, changes).catch((err) => errorMongo(res, err, 'modify')).then((result) => success(result))
}

function remove(collection, id, res, success) {
  db.collection(collection).deleteOne({ _id: new mongo.ObjectId(id) }).catch((err) => errorMongo(res, err, 'delete')).then((result) => success(result))
}

module.exports = { open, close, getAll, get, add, modify, remove }