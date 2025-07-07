//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { CauseError, NotTested, TODO } from "../../dev/decorators.js";
import { GeoRegistry } from "../../register/geo.js";
import { BufferFixedListScheme, BufferIntScheme, BufferListScheme, BufferObjectScheme } from "../../util/buffer.js";
import { Plane2 } from "../bi-geo/plane.js";
import { Geo3 } from "../geo.js";
import { Direction, Rotation3 } from "../quaternion.js";
import { Vec3 } from "../vector.js";

export abstract class Surface extends Geo3 {

    static readonly UNIVERSAL_BUFFER_SCHEME = new BufferObjectScheme([
        ['vertices', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))],
        ['triangles', new BufferListScheme(new BufferFixedListScheme(new BufferIntScheme(), 3))]
    ])

    get form(): string {
        return 'surface'
    }

    abstract get vertices(): Vec3[]

    abstract get triangles(): [number, number, number][]

    static fromUniversalJson(json: any): GeneralSurface {
        return new GeneralSurface(json.vertices.map((vertex: any) => Vec3.fromJson(vertex)), json.triangles)
    }

    toUniversalData() {
        return {
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}

export class GeneralSurface extends Surface {

    get type(): string {
        return 'surface'
    }

    constructor(
        readonly vertices: Vec3[],
        readonly triangles: [number, number, number][]
    ) {
        super()
    }

    static fromJson(json: any): GeneralSurface {
        return new GeneralSurface(json.vertices.map((v: any) => Vec3.fromJson(v)), json.triangles)
    }

    get pivot(): Vec3 {
        return Vec3.centerOf(this.vertices)
    }

    move(vec: Vec3): GeneralSurface {
        return new GeneralSurface(this.vertices.map((v) => v.add(vec)), this.triangles)
    }

    rotate(rotation: Rotation3): GeneralSurface {
        return new GeneralSurface(this.vertices.map((v) => rotation.getVec(v)), this.triangles)
    }

    rotateAround(direction: Direction): GeneralSurface {
        return this.rotate(new Rotation3(direction, this.pivot))
    }

    toData(): {} {
        return {
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}

export class Plane3<P extends Plane2 = Plane2> extends Surface {

    get type(): string {
        return 'plane3'
    }

    constructor(
        readonly plane: P,
        readonly z: number,
        readonly direction: Direction = Direction.SOUTH
    ) {
        super()
    }

    static fromJson(json: any): Plane3 {
        return new Plane3(GeoRegistry.PLANE2.fromTypedJson(json.plane), json.z, Direction.fromJson(json.direction))
    }

    get pivot(): Vec3 {
        return this.plane.pivot.toVec3(this.z)
    }

    withPlane<P extends Plane2 = Plane2>(plane: P): Plane3<P> {
        return new Plane3(plane.move(this.plane.pivot.subtract(plane.pivot)) as P, this.z, this.direction)
    }

    move(vec: Vec3): Plane3<P> {
        return new Plane3(this.plane.move(vec.toVec2()) as P, this.z + vec.z, this.direction)
    }

    translate(length: number): Plane3<P> {
        return this.move(this.direction.toVec(length))
    }

    @NotTested()
    rotate(rotation: Rotation3): Plane3<P> {
        return this.move(this.pivot.subtract(rotation.getVec(this.pivot))).rotateAround(rotation.direction)
    }

    rotateAround(direction: Direction): Plane3<P> {
        return new Plane3(this.plane, this.z, this.direction.add(direction))
    }

    toData() {
        return {
            plane: this.plane.toJson(),
            z: this.z,
            direction: this.direction.toJson()
        }
    }

    get vertices(): Vec3[] {
        const rotation = new Rotation3(this.direction, this.pivot)
        return this.plane.vertices.map((v) => rotation.getVec(v.toVec3(this.z)))
    }

    get triangles(): [number, number, number][] {
        return this.plane.triangles
    }
}