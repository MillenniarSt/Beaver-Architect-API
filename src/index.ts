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

import path from 'path'
import fs from 'fs-extra'
import { fileURLToPath } from 'url'
import { openDatabase } from './database.js'
import { architectsDir, dir, projectsDir } from './paths.js'
import { loadPlugins } from './plugins.js'

const log = console.log
console.log = (...args) => {
    log('[     Server     ] ', ...args)
}

console.log('Starting...')

// Initialization

const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

if (!fs.existsSync(dir)) {
    fs.mkdirsSync(projectsDir)

    fs.mkdirsSync(architectsDir)
    fs.mkdirSync(path.join(architectsDir, 'generic'))
    fs.writeFileSync(path.join(architectsDir, 'generic', 'architect.json'), JSON.stringify({
        identifier: 'generic',
        name: 'Generic'
    }, null, 4))
    fs.copyFileSync(path.join(__dirname, 'generation', 'generic_architect_icon.svg'), path.join(architectsDir, 'generic', 'icon.svg'))

    console.log('Generated default files and directories')
}

// Plugins

loadPlugins()

// Database

openDatabase()

// Http

import './http.js'
