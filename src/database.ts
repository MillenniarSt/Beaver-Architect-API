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

import chalk from 'chalk'
import { Response } from 'express'
import { ObjectId, Db, MongoClient } from 'mongodb'
import { errorMongo } from './routes/util.js'

const url = "mongodb://localhost:27017/beaver_architect"
const client: MongoClient = new MongoClient(url)

let db: Db

export async function openDatabase() {
  await client.connect()
  db = client.db("beaver_architect")

  console.log(`MongoDB open on ${url}`)
}

export async function closeDatabase() {
  await client.close()

  console.log('MongoDB closed')
}

export type MongoSuccess = (data: any) => void

// GET

export type GetAllSuccess = (data: any[]) => void

export function getAll(collection: DbCollection, query: any, res: Response, success: GetAllSuccess) {
  handle('GET', db.collection(collection).find(query).toArray(), `${collection} ${query}`, res, success)
}

export type GetSuccess = (data: any) => void

export function get(collection: DbCollection, filter: any, res: Response, success: GetSuccess) {
  handle('GET', db.collection(collection).findOne(filter), `${collection} ${filter}`, res, success)
}

export function getById(collection: DbCollection, id: string, res: Response, success: GetSuccess) {
  get(collection, {_id: new ObjectId(id)}, res, success)
}

// INSERT

export function add(collection: DbCollection, object: any, res: Response, success: MongoSuccess) {
  handle('INSERT', db.collection(collection).insertOne(object), `${collection}`, res, success)
}

export function addWithId(collection: DbCollection, object: any, res: Response, success: MongoSuccess) {
  object._id = new ObjectId(object._id)
  add(collection, object, res, success)
}

// UPDATE

export function modify(collection: DbCollection, filter: any, changes: any, res: Response, success: MongoSuccess) {
  handle('UPDATE', db.collection(collection).updateOne(filter, changes), `${collection} ${filter}`, res, success)
}

export function modifyById(collection: DbCollection, id: string, changes: any, res: Response, success: MongoSuccess) {
  modify(collection, { _id: new ObjectId(id) }, changes, res, success)
}

export function set(collection: DbCollection, filter: any, changes: any, res: Response, success: MongoSuccess) {
  modify(collection, filter, { $set: changes}, res, success)
}

export function setById(collection: DbCollection, id: string, changes: any, res: Response, success: MongoSuccess) {
  modifyById(collection, id, { $set: changes}, res, success)
}

// DELETE

export function remove(collection: DbCollection, filter: any, res: Response, success: MongoSuccess) {
  handle('DELETE', db.collection(collection).deleteOne(filter), `${collection} ${filter}`, res, success)
}

export function removeById(collection: DbCollection, id: string, res: Response, success: MongoSuccess) {
  remove(collection, { _id: new ObjectId(id) }, res, success)
}

function handle(method: string, promise: Promise<any>, message: string, res: Response, success: (data: any) => void): void {
  promise.then((result: any) => {
    console.log(chalk.gray(`[Database] | ${method === 'GET' ? ' GET  ' : method} | 200 | ${message}`))
    success(result)
  }).catch((err: any) => {
    console.log(chalk.red(`[Database] | ${method === 'GET' ? ' GET  ' : method} | 400 | ${message}`))
    errorMongo(res, err, method)
  })
}

export enum DbCollection {

  PROJECTS = 'projects',
  SETTINGS = 'settings'
}