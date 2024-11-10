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

import express from 'express'
import { success } from './util.js'
import { architects } from '../architects.js'

export const architectsRouter = express.Router()

architectsRouter.get('/', (req, res) => {
    success(res, architects.map((architect) => architect.clientData))
})