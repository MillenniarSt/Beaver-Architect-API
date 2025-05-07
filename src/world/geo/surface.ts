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
import { Plane2 } from "../bi-geo/plane.js";
import { Geo3 } from "../geo.js";
import { Quaternion, Rotation3 } from "../quaternion.js";
import { Vec3 } from "../vector.js";

export abstract class Surface extends Geo3 {

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

    move(vec: Vec3): GeneralSurface {
        return new GeneralSurface(this.vertices.map((v) => v.add(vec)), this.triangles)
    }

    rotate(rotation: Rotation3): GeneralSurface {
        return new GeneralSurface(this.vertices.map((v) => rotation.getVec(v)), this.triangles)
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
        readonly rotation: Rotation3 = new Rotation3(Quaternion.NORTH, plane.edge.vertices[0].toVec3(z))
    ) {
        super()
    }

    static fromJson(json: any): Plane3 {
        return new Plane3(GeoRegistry.PLANE2.fromJson(json.plane), json.y, Rotation3.fromJson(json.rotation))
    }

    withPlane<P extends Plane2 = Plane2>(plane: P): Plane3<P> {
        return new Plane3(plane, this.z, this.rotation)
    }

    move(vec: Vec3): Plane3<P> {
        return new Plane3(this.plane.move(vec.toVec2()) as P, this.z + vec.z, this.rotation)
    }

    rotate(rotation: Rotation3): Plane3<P> {
        return new Plane3(this.plane, this.z, this.rotation.add(rotation))
    }

    toData() {
        return {
            plane: this.plane.toJson(),
            z: this.z,
            rotation: this.rotation.toJson()
        }
    }

    get vertices(): Vec3[] {
        return this.plane.vertices.map((v) => this.rotation.getVec(v.toVec3(this.z)))
    }

    get triangles(): [number, number, number][] {
        return this.plane.triangles
    }
}