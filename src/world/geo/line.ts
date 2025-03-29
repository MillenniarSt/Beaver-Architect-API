//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { NameNotRegistered } from "../../connection/errors.js"
import { type Geo3Function, type Geo3, Geo3Type } from "../geo.js"
import { Rotation3 } from "../quaternion.js"
import { Vec3 } from "../vector.js"

export const namedLines3: Map<string, Geo3Function<Line3>> = new Map()

export function NamedLine3() {
    return function (constructor: Geo3Function<Line3>) {
        namedLines3.set(constructor.name, constructor)
    }
}

export abstract class Line3 implements Geo3 {

    get type(): Geo3Type {
        return Geo3Type.LINE
    }

    static fromJson(json: any): Line3 {
        const factory = namedLines3.get(json.name)?.fromJson
        if (!factory) {
            throw new NameNotRegistered(json.name, 'Line2')
        }
        return factory(json)
    }

    abstract move(vec: Vec3): Line3

    abstract rotate(rotation: Rotation3): Line3

    abstract get vertices(): Vec3[]

    get segments(): [Vec3, Vec3][] {
        let segments: [Vec3, Vec3][] = []
        for (let i = 1; i < this.vertices.length; i++) {
            segments.push([this.vertices[i - 1], this.vertices[i]])
        }
        return segments
    }

    abstract toNamedJson(): {}

    toJson(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

@NamedLine3()
export class GeneralLine3 extends Line3 {

    static readonly parents = null

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

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map((vertex) => vertex.toJson())
        }
    }
}

@NamedLine3()
export class CloseLine3 extends Line3 {

    static readonly parents: Geo3Function[] = [GeneralLine3]

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

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map((vertex) => vertex.toJson())
        }
    }
}