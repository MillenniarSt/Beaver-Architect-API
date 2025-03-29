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
import { type Geo2, type Geo2Function } from "../geo.js"
import { Rotation2 } from "../quaternion.js"
import { Vec2 } from "../vector.js"
import { CloseLine2 } from "./line.js"

export const namedPlanes: Map<string, Geo2Function<Plane2>> = new Map()

export function NamedPlane() {
    return function (constructor: Geo2Function<Plane2>) {
        namedPlanes.set(constructor.name, constructor)
    }
}

export abstract class Plane2<Edge extends CloseLine2 = CloseLine2> implements Geo2 {

    abstract get edge(): Edge

    abstract move(vec: Vec2): Plane2

    abstract rotate(rotation: Rotation2): Plane2

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
        const factory = namedPlanes.get(json.name)?.fromJson
        if (!factory) {
            throw new NameNotRegistered(json.name, 'Plane2')
        }
        return factory(json)
    }

    toJson(): {} {
        return this.edge.toJson()
    }
}

@NamedPlane()
export class GeneralPlane2 extends Plane2 {

    static readonly parents = null

    constructor(readonly edge: CloseLine2) {
        super()
    }

    static fromJson(json: any): GeneralPlane2 {
        return new GeneralPlane2(CloseLine2.fromJson(json))
    }

    move(vec: Vec2): GeneralPlane2 {
        return new GeneralPlane2(this.edge.move(vec))
    }

    rotate(rotation: Rotation2): GeneralPlane2 {
        return new GeneralPlane2(this.edge.rotate(rotation))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            edge: this.edge.toJson()
        }
    }
}

@NamedPlane()
export class Rect2 extends Plane2 {

    static readonly parents: Geo2Function[] = [GeneralPlane2]

    constructor(
        readonly pos: Vec2, 
        readonly size: Vec2,
        readonly rotation: Rotation2 = new Rotation2(0, Vec2.ZERO)
    ) {
        super()
    }

    static fromJson(json: any): Rect2 {
        return new Rect2(Vec2.fromJson(json.pos), Vec2.fromJson(json.size), Rotation2.fromJson(json.rotation))
    }

    move(vec: Vec2): Rect2 {
        return new Rect2(this.pos.add(vec), this.size)
    }

    rotate(rotation: Rotation2): Rect2 {
        return new Rect2(this.pos, this.size, this.rotation.add(rotation))
    }

    get edge(): CloseLine2 {
        return new CloseLine2([
            this.pos,
            new Vec2(this.pos.x, this.pos.y + this.size.y),
            this.pos.add(this.size),
            new Vec2(this.pos.x + this.size.y, this.pos.y)
        ]).rotate(this.rotation)
    }

    toNamedJson() {
        return {
            name: this.constructor.name,
            pos: this.pos.toJson(),
            size: this.size.toJson(),
            rotation: this.rotation.toJson()
        }
    }
}