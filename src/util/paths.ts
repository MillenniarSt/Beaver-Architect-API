//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import getAppDataPath from 'appdata-path'
import path from 'path'

export const dir: string = getAppDataPath('Beaver Architect')

export const projectsDir: string = path.join(dir, 'projects')
export const architectsDir: string = path.join(dir, 'architects')
export const librariesDir: string = path.join(dir, 'libraries')