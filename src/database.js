//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//    |\___   |   ___/|
//         \__|__/
//
//      By Millenniar
//

const mongo = require("mongodb");

const url = "mongodb://localhost:27017/beaver_architect";
const client = new mongo.MongoClient(url);

let db;

async function open() {
  await client.connect();
  db = client.db("beaver_architect");
  console.log(`MongoDB open on ${url}`);
}

async function close() {
  await client.close();
}

module.exports = { open, close };