//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { GeoRegistry } from "../../register/geo.js";
import { BufferFixedListScheme, BufferIntScheme, BufferListScheme, BufferObjectScheme } from "../../util/buffer.js";
import { Plane2, Rect2 } from "../bi-geo/plane.js";
import { Geo3 } from "../geo.js";
import { Quaternion, Rotation3 } from "../quaternion.js";
import { Vec2, Vec3 } from "../vector.js";
import { Plane3 } from "./surface.js";

export abstract class Object3 extends Geo3 {

    static readonly UNIVERSAL_BUFFER_SCHEME = new BufferObjectScheme([
        ['vertices', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))],
        ['triangles', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))]
    ])

    get form(): string {
        return 'object'
    }

    abstract get vertices(): Vec3[]

    abstract get triangles(): [number, number, number][]

    static fromUniversalJson(json: any): GeneralObject3 {
        return new GeneralObject3(json.vertices.map((vertex: any) => Vec3.fromJson(vertex)), json.triangles)
    }

    toUniversalData() {
        return {
            vertices: this.vertices.map(v => v.toJson()),
            triangles: this.triangles
        }
    }
}

export class GeneralObject3 extends Object3 {

    get type(): string {
        return 'object3'
    }

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

    toData(): {} {
        return {
            vertices: this.vertices.map(v => v.toJson()),
            triangles: this.triangles
        }
    }
}

export class Prism<P extends Plane2 = Plane2> extends Object3 {

    get type(): string {
        return 'prism'
    }

    constructor(
        readonly base: Plane3<P>,
        readonly height: number
    ) {
        super()
    }

    static fromJson(json: any): Prism {
        return new Prism(GeoRegistry.PLANE3.fromTypedJson(json.base), json.height)
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

    toData(): {} {
        return {
            base: this.base.toJson(),
            height: this.height
        }
    }
}

export class Rect3 extends Prism<Rect2> {

    get type(): string {
        return 'rect3'
    }

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

    contains(pos: Vec3): boolean {
        return pos.x >= this.pos.x && pos.x <= this.pos.x + this.size.x && pos.y >= this.pos.y && pos.y <= this.pos.y + this.size.y && pos.z >= this.pos.z && pos.z <= this.pos.z + this.size.z
    }

    move(vec: Vec3): Rect3 {
        return new Rect3(this.pos.add(vec), this.size, this.rotation)
    }

    rotate(rotation: Rotation3): Rect3 {
        return new Rect3(this.pos, this.size, this.rotation.add(rotation))
    }

    toData(): {} {
        return {
            pos: this.pos.toJson(),
            size: this.size.toJson(),
            rotation: this.rotation.toJson()
        }
    }
}