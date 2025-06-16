//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { BufferFixedListScheme, BufferIntScheme, BufferListScheme } from "../../util/buffer.js";
import { Geo2 } from "../geo.js";
import { Rotation2 } from "../quaternion.js";
import { Vec2 } from "../vector.js";

export abstract class Line2 extends Geo2 {

    static readonly UNIVERSAL_BUFFER_SCHEME = new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 2))

    get form(): string {
        return 'line2'
    }

    abstract get vertices(): Vec2[]

    get segments(): [Vec2, Vec2][] {
        let segments: [Vec2, Vec2][] = []
        for (let i = 1; i < this.vertices.length; i++) {
            segments.push([this.vertices[i - 1], this.vertices[i]])
        }
        return segments
    }

    static fromUniversalJson(json: any): GeneralLine2 {
        return new GeneralLine2(json.map((vertex: any) => Vec2.fromJson(vertex)))
    }

    toUniversalData(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

export class GeneralLine2 extends Line2 {

    get type(): string {
        return 'line2'
    }

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

    toData(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

export class CloseLine2 extends Line2 {

    get type(): string {
        return 'closed_line2'
    }

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

    toData(): {} {
        return this.vertices.map((vertex) => vertex.toJson())
    }
}

export class CurvedLine2 extends Line2 {

    get type(): string {
        return 'curved_line2'
    }

    constructor(
        readonly controls: {
            vec: Vec2,
            rotation: number
        }[]
    ) {
        super()
    }

    static fromJson(json: any): CurvedLine2 {
        return new CurvedLine2(json.map((control: any) => {
            return {
                vec: Vec2.fromJson(control.vec),
                rotation: control.rotation
            }
        }))
    }

    move(vec: Vec2): CurvedLine2 {
        return new CurvedLine2(this.controls.map((control) => {
            return {
                vec: control.vec.add(vec),
                rotation: control.rotation
            }
        }))
    }

    rotate(rotation: Rotation2): CurvedLine2 {
        return new CurvedLine2(this.controls.map((control) => {
            return {
                vec: rotation.getVec(control.vec),
                rotation: control.rotation + rotation.angle
            }
        }))
    }

    get vertices(): Vec2[] {
        return [] // TODO
    }

    toData(): {} {
        return this.controls.map((control) => {
            return {
                control: control.vec.toJson(),
                rotation: control.rotation
            }
        })
    }
}