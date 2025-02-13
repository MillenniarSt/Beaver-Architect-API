//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Geo2 } from "../geo.js";
import { Rotation2 } from "../quaternion.js";
import { Vec2 } from "../vector.js";

export class Line2 implements Geo2 {

    constructor(
        readonly vertices: Vec2[]
    ) { }

    static fromJson(json: any): Line2 {
        return new Line2(json.map((vertex: any) => Vec2.fromJson(vertex)))
    }

    move(vec: Vec2): Line2 {
        return new Line2(this.vertices.map((vertex) => vertex.add(vec)))
    }

    rotate(rotation: Rotation2): Line2 {
        return new Line2(this.vertices.map((v) => rotation.getVec(v)))
    }

    get segments(): [Vec2, Vec2][] {
        let segments: [Vec2, Vec2][] = []
        for(let i = 1; i < this.vertices.length; i++) {
            segments.push([this.vertices[i -1], this.vertices[i]])
        }
        return segments
    }

    toJson(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

export class CloseLine2 extends Line2 {

    static fromJson(json: any): CloseLine2 {
        return new CloseLine2(json.map((vertex: any) => Vec2.fromJson(vertex)))
    }

    move(vec: Vec2): CloseLine2 {
        return new CloseLine2(this.vertices.map((vertex) => vertex.add(vec)))
    }

    rotate(rotation: Rotation2): CloseLine2 {
        return new CloseLine2(this.vertices.map((v) => rotation.getVec(v)))
    }

    get segments(): [Vec2, Vec2][] {
        return [...super.segments, [this.vertices[this.vertices.length -1], this.vertices[0]]]
    }
}