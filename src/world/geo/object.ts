//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Plane2, Rect2 } from "../bi-geo/plane.js";
import { Geo3, Geo3Type } from "../geo.js";
import { Quaternion } from "../quaternion.js";
import { Vec2, Vec3 } from "../vector.js";
import { Plane3, Surface } from "./surface.js";

export const namedObjects: Map<string, (json: any) => Object3> = new Map()

export function NamedObject(fromJson: (json: any) => Object3) {
    return function (constructor: { new(...args: any): Object3 }) {
        namedObjects.set(constructor.name, fromJson)
    }
}

export abstract class Object3 implements Geo3 {

    get type(): Geo3Type {
        return Geo3Type.OBJECT
    }

    abstract get vertices(): Vec3[]

    abstract get triangles(): [number, number, number][]

    abstract move(vec: Vec3): Object3

    abstract toNamedJson(): {}

    static fromJson(json: any): Object3 {
        const factory = namedObjects.get(json.name)
        if (!factory) {
            throw Error(`No Object registered for name: ${json.name}`)
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

@NamedObject(GeneralObject3.fromJson)
export class GeneralObject3 extends Object3 {

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

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map(v => v.toJson()),
            triangles: this.triangles
        }
    }
}

@NamedObject(Prism.fromJson)
export class Prism<P extends Plane2 = Plane2> extends Object3 {

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

    get vertices(): Vec3[] {
        const baseVertices = this.base.vertices
        const topVertices = baseVertices.map(v => v.add(new Vec3(0, 0, this.height)))
        return [...baseVertices, ...topVertices]
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

@NamedObject(Rect3.fromJson)
export class Rect3 extends Prism<Rect2> {

    constructor(
        readonly pos: Vec3,
        readonly size: Vec3,
        readonly rotation: Quaternion = Quaternion.NORTH
    ) {
        super(new Plane3(new Rect2(new Vec2(pos.x, pos.y), new Vec2(size.x, size.y)), pos.z, rotation), size.z)
    }

    static fromJson(json: any): Rect3 {
        return new Rect3(Vec3.fromJson(json.pos), Vec3.fromJson(json.size), Quaternion.fromJson(json.rotation))
    }

    move(vec: Vec3): Rect3 {
        return new Rect3(this.pos.add(vec), this.size, this.rotation)
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