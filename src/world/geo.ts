//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Rotation2, Rotation3 } from "./quaternion.js"
import { Vec2, Vec3 } from "./vector.js"

export interface Geo2 {

    get vertices(): Vec2[]

    move(vec: Vec2): Geo2

    rotate(rotation: Rotation2): Geo2

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

    rotate(rotation: Rotation3): Geo3

    // scale(vec: Vec3): Geo3

    toJson(): {}
}

export interface Geo2Function<G extends Geo2 = any> extends Function {

    new (...args: any[]): G

    fromJson(json: any): G

    get parents(): Geo2Function[] | null
}

export interface Geo3Function<G extends Geo3 = any> extends Function {

    new (...args: any[]): G

    fromJson(json: any): G

    get parents(): Geo3Function[] | null
}

export function isGeoCompatible<F extends Geo2Function | Geo3Function>(parent: F, child: F): boolean {
    if(parent.parents === null) {
        return child.parents === null
    } else if(child.parents === null || parent === child) {
        return true
    }

    for(let i = 0; i < parent.parents.length; i++) {
        if(isGeoCompatible(parent.parents[i], child)) {
            return true
        }
    }

    return false
}