//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Geo3, Geo3Type } from "../geo.js"
import { Vec3 } from "../vector.js"

export class Line3 implements Geo3 {

    get type(): Geo3Type {
        return Geo3Type.LINE
    }

    constructor(
        readonly vertices: Vec3[]
    ) { }

    static fromJson(json: any): Line3 {
        return new Line3(json.map((vertex: any) => Vec3.fromJson(vertex)))
    }

    move(vec: Vec3): Line3 {
        return new Line3(this.vertices.map((vertex) => vertex.add(vec)))
    }

    toJson(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

export class CloseLine3 extends Line3 {

    static fromJson(json: any): CloseLine3 {
        return new CloseLine3(json.map((vertex: any) => Vec3.fromJson(vertex)))
    }

    move(vec: Vec3): CloseLine3 {
        return new CloseLine3(this.vertices.map((vertex) => vertex.add(vec)))
    }
}