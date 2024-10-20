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
import fs from 'fs'
import path from 'path'
import { success } from './util.js'
import { architectsDir } from '../paths.js'

export const architectsRouter = express.Router()

architectsRouter.get('/', (req, res) => {
    success(res, fs.readdirSync(architectsDir).map((dir: string) => JSON.parse(fs.readFileSync(path.join(architectsDir, dir, 'architect.json'), 'utf8'))))
})