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
  db.collection(collection).find(query).toArray().then((result) => success(result)).catch((err) => errorMongo(res, err, 'get'))
}

function get(collection, id, res, success) {
  db.collection(collection).findOne({ _id: new mongo.ObjectId(id) }).then((result) => success(result)).catch((err) => errorMongo(res, err, 'get'))
}

function add(collection, object, res, success) {
  db.collection(collection).insertOne(object).then((result) => success(result)).catch((err) => errorMongo(res, err, 'add'))
}

function modify(collection, id, changes, res, success) {
  db.collection(collection).updateOne({ _id: new mongo.ObjectId(id) }, changes).then((result) => success(result)).catch((err) => errorMongo(res, err, 'modify'))
}

function modifySet(collection, id, changes, res, success) {
  modify(collection, id, { $set: changes}, res, success)
}

function remove(collection, id, res, success) {
  db.collection(collection).deleteOne({ _id: new mongo.ObjectId(id) }).then((result) => success(result)).catch((err) => errorMongo(res, err, 'delete'))
}

module.exports = { open, close, getAll, get, add, modify, modifySet, remove }