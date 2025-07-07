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
import { Rotation2 } from "../quaternion.js"
import { Vec2 } from "../vector.js"
import { CloseLine2 } from "./line.js"

export abstract class Plane2<Edge extends CloseLine2 = CloseLine2> extends Geo2 {

    static readonly UNIVERSAL_BUFFER_SCHEME = CloseLine2.UNIVERSAL_BUFFER_SCHEME

    get form(): string {
        return 'plane'
    }

    abstract get edge(): Edge

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

    static fromUniversalJson(json: any): GeneralPlane2 {
        return new GeneralPlane2(CloseLine2.fromJson(json))
    }

    toUniversalData(): {} {
        return this.edge.toUniversalData()
    }
}

export class GeneralPlane2 extends Plane2 {

    get type(): string {
        return 'plane2'
    }

    constructor(readonly edge: CloseLine2) {
        super()
    }

    static fromJson(json: any): GeneralPlane2 {
        return new GeneralPlane2(CloseLine2.fromJson(json))
    }

    get pivot(): Vec2 {
        return Vec2.centerOf(this.vertices)
    }

    move(vec: Vec2): GeneralPlane2 {
        return new GeneralPlane2(this.edge.move(vec))
    }

    rotate(rotation: Rotation2): GeneralPlane2 {
        return new GeneralPlane2(this.edge.rotate(rotation))
    }

    rotateAround(angle: number): GeneralPlane2 {
        return this.rotate(new Rotation2(angle, this.pivot))
    }

    toData(): {} {
        return this.edge.toData()
    }
}

export class Rect2 extends Plane2 {

    get type(): string {
        return 'rect2'
    }

    constructor(
        readonly pos: Vec2,
        readonly size: Vec2,
        readonly rotation: number = 0
    ) {
        super()
    }

    static fromJson(json: any): Rect2 {
        return new Rect2(Vec2.fromJson(json.pos), Vec2.fromJson(json.size), json.rotation)
    }

    get pivot(): Vec2 {
        return this.pos.add(this.size.scale(0.5))
    }

    move(vec: Vec2): Rect2 {
        return new Rect2(this.pos.add(vec), this.size)
    }

    rotate(rotation: Rotation2): Rect2 {
        return new Rect2(rotation.getVec(this.pos), this.size, this.rotation).rotateAround(rotation.angle)
    }

    rotateAround(rotation: number): Rect2 {
        return new Rect2(this.pos, this.size, (this.rotation + rotation) % Math.PI)
    }

    get edge(): CloseLine2 {
        return new CloseLine2([
            this.pos,
            new Vec2(this.pos.x, this.pos.y + this.size.y),
            this.pos.add(this.size),
            new Vec2(this.pos.x + this.size.y, this.pos.y)
        ]).rotate(new Rotation2(this.rotation, this.pivot))
    }

    toData() {
        return {
            pos: this.pos.toJson(),
            size: this.size.toJson(),
            rotation: this.rotation
        }
    }
}