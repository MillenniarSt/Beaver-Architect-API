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
import { plugins } from '../plugins.js'

export const pluginsRouter = express.Router()

pluginsRouter.get('/', (req, res) => {
    success(res, plugins.map((plugin) => plugin.data))
})