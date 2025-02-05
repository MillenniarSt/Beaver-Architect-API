//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Vec2, Vec3 } from "./vector.js"

export interface Geo2 {

    get vertices(): Vec2[]

    move(vec: Vec2): Geo2

    // rotate(rotation: number, vec: Vec2): Geo2

    // scale(vec: Vec2): Geo2

    toJson(): {}
}

export enum Geo3Type {
    LINE = 'line',
    SURFACE = 'surface',
    OBJECT = 'object'
}

export interface Geo3 {

    get type(): Geo3Type

    get vertices(): Vec3[]

    move(vec: Vec3): Geo3

    // rotate(rotation: Quaternion, vec: Vec3): Geo3

    // scale(vec: Vec3): Geo3

    toJson(): {}
}