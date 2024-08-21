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

const getAppDataPath = require('appdata-path')
const path = require('path')

const dir = getAppDataPath('Beaver Architect')
const projectsDir = path.join(dir, 'projects')
const architectsDir = path.join(dir, 'architects')

module.exports = { dir, projectsDir, architectsDir }