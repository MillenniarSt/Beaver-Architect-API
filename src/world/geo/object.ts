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
import { Plane2, Rect2 } from "../bi-geo/plane.js";
import { type Geo3, type Geo3Function, Geo3Type } from "../geo.js";
import { Quaternion, Rotation3 } from "../quaternion.js";
import { Vec2, Vec3 } from "../vector.js";
import { Plane3, Surface } from "./surface.js";

export const namedObjects: Map<string, Geo3Function<Object3>> = new Map()

export function NamedObject<G extends Object3>() {
    return function (constructor: Geo3Function<G>) {
        namedObjects.set(constructor.name, constructor)
    }
}

export abstract class Object3 implements Geo3 {

    get type(): Geo3Type {
        return Geo3Type.OBJECT
    }

    abstract get vertices(): Vec3[]

    abstract get triangles(): [number, number, number][]

    abstract move(vec: Vec3): Object3

    abstract rotate(rotation: Rotation3): Object3

    abstract toNamedJson(): {}

    static fromJson(json: any): Object3 {
        const factory = namedObjects.get(json.name)?.fromJson
        if (!factory) {
            throw new NameNotRegistered(json.name, 'Object3')
        }
        return factory(json)
    }

    toJson() {
        return {
            vertices: this.vertices.map(v => v.toJson()),
            triangles: this.triangles
        }
    }
}

@NamedObject()
export class GeneralObject3 extends Object3 {

    static readonly parents = null

    constructor(
        readonly vertices: Vec3[],
        readonly triangles: [number, number, number][]
    ) {
        super()
    }

    static fromJson(json: any): GeneralObject3 {
        return new GeneralObject3(json.vertices.map(Vec3.fromJson), json.triangles)
    }

    move(vec: Vec3): Object3 {
        return new GeneralObject3(this.vertices.map((v) => v.add(vec)), this.triangles)
    }

    rotate(rotation: Rotation3): GeneralObject3 {
        return new GeneralObject3(this.vertices.map((v) => rotation.getVec(v)), this.triangles)
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map(v => v.toJson()),
            triangles: this.triangles
        }
    }
}

@NamedObject()
export class Prism<P extends Plane2 = Plane2> extends Object3 {

    static readonly parents: Geo3Function[] = [GeneralObject3]

    constructor(
        readonly base: Plane3<P>,
        readonly height: number
    ) {
        super()
    }

    static fromJson(json: any): Prism {
        return new Prism(Surface.fromJson(json.base) as Plane3, json.height)
    }

    move(vec: Vec3): Prism<P> {
        return new Prism(this.base.move(vec), this.height)
    }

    rotate(rotation: Rotation3): Prism<P> {
        return new Prism(this.base.rotate(rotation), this.height)
    }

    get vertices(): Vec3[] {
        return [
            ...this.base.vertices, 
            ...this.base.plane.vertices.map(v => this.base.rotation.getVec(v.toVec3(this.height)))
        ]
    }

    get triangles(): [number, number, number][] {
        const baseCount = this.base.vertices.length
        const triangles: [number, number, number][] = []
        for (const triangle of this.base.triangles) {
            triangles.push(triangle)
        }
        for (const triangle of this.base.triangles) {
            triangles.push([triangle[0] + baseCount, triangle[1] + baseCount, triangle[2] + baseCount])
        }
        for (let i = 0; i < baseCount; i++) {
            const next = (i + 1) % baseCount
            triangles.push([i, next, baseCount + i])
            triangles.push([next, baseCount + next, baseCount + i])
        }

        return triangles
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            base: this.base.toNamedJson(),
            height: this.height
        }
    }
}

@NamedObject()
export class Rect3 extends Prism<Rect2> {

    static readonly parents: Geo3Function[] = [Prism]


    constructor(
        readonly pos: Vec3,
        readonly size: Vec3,
        readonly rotation: Rotation3 = new Rotation3(Quaternion.NORTH, pos)
    ) {
        super(new Plane3(new Rect2(new Vec2(pos.x, pos.y), new Vec2(size.x, size.y)), pos.z, rotation), size.z)
    }

    static fromJson(json: any): Rect3 {
        return new Rect3(Vec3.fromJson(json.pos), Vec3.fromJson(json.size), Rotation3.fromJson(json.rotation))
    }

    move(vec: Vec3): Rect3 {
        return new Rect3(this.pos.add(vec), this.size, this.rotation)
    }

    rotate(rotation: Rotation3): Rect3 {
        return new Rect3(this.pos, this.size, this.rotation.add(rotation))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            pos: this.pos.toJson(),
            size: this.size.toJson(),
            rotation: this.rotation.toJson()
        }
    }
}