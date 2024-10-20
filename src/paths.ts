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

import getAppDataPath from 'appdata-path'
import path from 'path'

export const dir: string = getAppDataPath.default('Beaver Architect')

export const projectsDir: string = path.join(dir, 'projects')
export const pluginsDir: string = path.join(dir, 'plugins')
export const architectsDir: string = path.join(dir, 'architects')