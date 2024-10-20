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
import { add, DbCollection, getAll } from '../database.js'

export const settingsRouter = express.Router()

settingsRouter.get('/generate', (req, res) => {
    add(DbCollection.SETTINGS, {
        appearance: {
            name: 'Appearance',
            settings: {}
        },
        render: {
            name: 'Render',
            settings: {
                panSpeed: 1,
                rotateSpeed: 1,
                zoomSpeed: 1
            }
        }
    }, res, (settings) => success(res, settings[0]))
})

settingsRouter.get('/', (req, res) => {
    getAll(DbCollection.SETTINGS, {}, res, (settings) => success(res, settings[0]))
})