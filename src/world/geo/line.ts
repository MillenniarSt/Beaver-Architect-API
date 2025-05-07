//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Geo3 } from "../geo.js"
import { Rotation3 } from "../quaternion.js"
import { Vec3 } from "../vector.js"

export abstract class Line3 extends Geo3 {

    get form(): string {
        return 'line3'
    }

    abstract get vertices(): Vec3[]

    get segments(): [Vec3, Vec3][] {
        let segments: [Vec3, Vec3][] = []
        for (let i = 1; i < this.vertices.length; i++) {
            segments.push([this.vertices[i - 1], this.vertices[i]])
        }
        return segments
    }

    static fromUniversalJson(json: any): GeneralLine3 {
        return new GeneralLine3(json.map((vertex: any) => Vec3.fromJson(vertex)))
    }

    toUniversalData(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

export class GeneralLine3 extends Line3 {

    get type(): string {
        return 'line3'
    }

    constructor(
        readonly vertices: Vec3[]
    ) {
        super()
    }

    static fromJson(json: any): Line3 {
        return new GeneralLine3(json.map((vertex: any) => Vec3.fromJson(vertex)))
    }

    move(vec: Vec3): Line3 {
        return new GeneralLine3(this.vertices.map((vertex) => vertex.add(vec)))
    }

    rotate(rotation: Rotation3): Line3 {
        return new GeneralLine3(this.vertices.map((v) => rotation.getVec(v)))
    }

    toData(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

export class CloseLine3 extends Line3 {

    get type(): string {
        return 'closed_line3'
    }

    constructor(
        readonly vertices: Vec3[]
    ) {
        super()
    }

    static fromJson(json: any): CloseLine3 {
        return new CloseLine3(json.map((vertex: any) => Vec3.fromJson(vertex)))
    }

    move(vec: Vec3): CloseLine3 {
        return new CloseLine3(this.vertices.map((vertex) => vertex.add(vec)))
    }

    rotate(rotation: Rotation3): CloseLine3 {
        return new CloseLine3(this.vertices.map((v) => rotation.getVec(v)))
    }

    get segments(): [Vec3, Vec3][] {
        return [...super.segments, [this.vertices[this.vertices.length - 1], this.vertices[0]]]
    }

    toData(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}