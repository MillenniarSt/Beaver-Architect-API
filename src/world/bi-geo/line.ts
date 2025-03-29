//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { NameNotRegistered } from "../../connection/errors.js";
import { type Geo2, type Geo2Function } from "../geo.js";
import { Rotation2 } from "../quaternion.js";
import { Vec2 } from "../vector.js";

export const namedLines2: Map<string, Geo2Function<Line2>> = new Map()

export function NamedLine2() {
    return function (constructor: Geo2Function<Line2>) {
        namedLines2.set(constructor.name, constructor)
    }
}

export abstract class Line2 implements Geo2 {

    static fromJson(json: any): Line2 {
        const factory = namedLines2.get(json.name)?.fromJson
        if (!factory) {
            throw new NameNotRegistered(json.name, 'Line2')
        }
        return factory(json)
    }

    abstract move(vec: Vec2): Line2

    abstract rotate(rotation: Rotation2): Line2

    abstract get vertices(): Vec2[]

    get segments(): [Vec2, Vec2][] {
        let segments: [Vec2, Vec2][] = []
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

@NamedLine2()
export class GeneralLine2 extends Line2 {

    static readonly parents = null

    constructor(
        readonly vertices: Vec2[]
    ) {
        super()
    }

    static fromJson(json: any): Line2 {
        return new GeneralLine2(json.map((vertex: any) => Vec2.fromJson(vertex)))
    }

    move(vec: Vec2): Line2 {
        return new GeneralLine2(this.vertices.map((vertex) => vertex.add(vec)))
    }

    rotate(rotation: Rotation2): Line2 {
        return new GeneralLine2(this.vertices.map((v) => rotation.getVec(v)))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map((vertex) => vertex.toJson())
        }
    }
}

@NamedLine2()
export class CloseLine2 extends Line2 {

    static readonly parents: Geo2Function[] = [GeneralLine2]

    constructor(
        readonly vertices: Vec2[]
    ) {
        super()
    }

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
        return [...super.segments, [this.vertices[this.vertices.length - 1], this.vertices[0]]]
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map((vertex) => vertex.toJson())
        }
    }
}