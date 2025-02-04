import { Plane2 } from "../bi-geo/plane.js";
import { Geo3 } from "../geo.js";
import { Quaternion } from "../quaternion.js";
import { Vec3 } from "../vector.js";

export const namedSurfaces: Map<string, (json: any) => Surface> = new Map()

export function NamedSurface(fromJson: (json: any) => Surface) {
    return function (constructor: { new(...args: any): Surface }) {
        namedSurfaces.set(constructor.name, fromJson)
    }
}

export abstract class Surface implements Geo3 {

    abstract get vertices(): Vec3[]

    abstract get triangles(): [number, number, number][]

    abstract move(vec: Vec3): Surface

    abstract toNamedJson(): {}

    static fromJson(json: any): Surface {
        const factory = namedSurfaces.get(json.name)
        if (!factory) {
            throw Error(`No Surface registered for name: ${json.name}`)
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

@NamedSurface(GeneralSurface.fromJson)
export class GeneralSurface extends Surface {

    constructor(
        readonly vertices: Vec3[] = [],
        readonly triangles: [number, number, number][] = []
    ) {
        super()
    }

    static fromJson(json: any): GeneralSurface {
        return new GeneralSurface(json.vertices.map((v: any) => Vec3.fromJson(v)), json.triangles)
    }

    move(vec: Vec3): GeneralSurface {
        return new GeneralSurface(this.vertices.map((v) => v.add(vec)))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map((v) => v.toJson()),
            triangles: this.triangles
        }
    }
}

@NamedSurface(Plane3.fromJson)
export class Plane3<P extends Plane2 = Plane2> extends Surface {

    constructor(
        readonly plane: P,
        readonly z: number,
        readonly rotation: Quaternion = Quaternion.NORTH
    ) {
        super()
    }

    static fromJson(json: any): Plane3 {
        return new Plane3(Plane2.fromJson(json.plane), json.y, Quaternion.fromJson(json.rotation))
    }

    withPlane<P extends Plane2 = Plane2>(plane: P): Plane3<P> {
        return new Plane3(plane, this.z, this.rotation)
    }

    move(vec: Vec3): Plane3<P> {
        return new Plane3(this.plane.move(vec.toVec2()) as P, this.z + vec.z, this.rotation)
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
        return this.plane.vertices.map(vertex2D => this.rotation.rotateVec(new Vec3(vertex2D.x, vertex2D.y, this.z)))
    }

    get triangles(): [number, number, number][] {
        return this.plane.triangles
    }
}