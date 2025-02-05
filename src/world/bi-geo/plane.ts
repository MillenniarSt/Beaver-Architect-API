//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Geo2 } from "../geo.js"
import { Vec2 } from "../vector.js"
import { CloseLine2 } from "./line.js"

export const namedPlanes: Map<string, (json: any) => Plane2> = new Map()

export function NamedPlane(fromJson: (json: any) => Plane2) {
    return function (constructor: { new(...args: any): Plane2 }) {
        namedPlanes.set(constructor.name, fromJson)
    }
}

export abstract class Plane2 implements Geo2 {

    abstract get edge(): CloseLine2

    abstract move(vec: Vec2): Plane2

    abstract toNamedJson(): {}

    get vertices(): Vec2[] {
        return this.edge.vertices
    }

    get triangles(): [number, number, number][] {
        const vertices = this.vertices
        const triangles: [number, number, number][] = []
        for (let i = 1; i < vertices.length - 1; i++) {
            triangles.push([0, i, i + 1])
        }
        return triangles
    }

    static fromJson(json: any): Plane2 {
        const factory = namedPlanes.get(json.name)
        if (!factory) {
            throw Error(`No Plane2 registered for name: ${json.name}`)
        }
        return factory(json)
    }

    toJson(): {} {
        return this.edge.toJson()
    }
}

@NamedPlane(GeneralPlane2.fromJson)
export class GeneralPlane2 extends Plane2 {

    constructor(readonly edge: CloseLine2) {
        super()
    }

    static fromJson(json: any): GeneralPlane2 {
        return new GeneralPlane2(CloseLine2.fromJson(json))
    }

    move(vec: Vec2): GeneralPlane2 {
        return new GeneralPlane2(this.edge.move(vec))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            edge: this.edge.toJson()
        }
    }
}

@NamedPlane(Rect2.fromJson)
export class Rect2 extends Plane2 {

    constructor(readonly pos: Vec2, readonly size: Vec2) {
        super()
    }

    static fromJson(json: any): Rect2 {
        return new Rect2(Vec2.fromJson(json.pos), Vec2.fromJson(json.size))
    }

    move(vec: Vec2): Rect2 {
        return new Rect2(this.pos.add(vec), this.size)
    }

    get edge(): CloseLine2 {
        return new CloseLine2([
            this.pos,
            new Vec2(this.pos.x, this.pos.y + this.size.y),
            this.pos.add(this.size),
            new Vec2(this.pos.x + this.size.y, this.pos.y)
        ])
    }

    toNamedJson() {
        return {
            name: this.constructor.name,
            pos: this.pos.toJson(),
            size: this.size.toJson()
        }
    }
}