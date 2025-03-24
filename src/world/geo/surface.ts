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
import { Plane2 } from "../bi-geo/plane.js";
import { Geo3, Geo3Function, Geo3Type } from "../geo.js";
import { Quaternion, Rotation3 } from "../quaternion.js";
import { Vec3 } from "../vector.js";

export const namedSurfaces: Map<string, Geo3Function<Surface>> = new Map()

export function NamedSurface() {
    return function (constructor: Geo3Function<Surface>) {
        namedSurfaces.set(constructor.name, constructor)
    }
}

export abstract class Surface implements Geo3 {

    get type(): Geo3Type {
        return Geo3Type.SURFACE
    }

    abstract get vertices(): Vec3[]

    abstract get triangles(): [number, number, number][]

    abstract move(vec: Vec3): Surface

    abstract rotate(rotation: Rotation3): Surface

    abstract toNamedJson(): {}

    static fromJson(json: any): Surface {
        const factory = namedSurfaces.get(json.name)?.fromJson
        if (!factory) {
            throw new NameNotRegistered(json.name, 'Surface')
        }
        return factory(json)
    }

    toJson() {
        return {
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}

@NamedSurface()
export class GeneralSurface extends Surface {

    static readonly parents = null

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

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}

@NamedSurface()
export class Plane3<P extends Plane2 = Plane2> extends Surface {

    static readonly parents: Geo3Function[] = [GeneralSurface]

    constructor(
        readonly plane: P,
        readonly z: number,
        readonly rotation: Rotation3 = new Rotation3(Quaternion.NORTH, plane.edge.vertices[0].toVec3(z))
    ) {
        super()
    }

    static fromJson(json: any): Plane3 {
        return new Plane3(Plane2.fromJson(json.plane), json.y, Rotation3.fromJson(json.rotation))
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

    toNamedJson() {
        return {
            name: this.constructor.name,
            plane: this.plane.toNamedJson(),
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