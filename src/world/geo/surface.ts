import { Plane2 } from "../bi-geo/plane.js";
import { Quaternion } from "../quaternion.js";
import { Vec3 } from "../vector.js";

export const namedSurfaces: Map<string, (json: any) => Surface> = new Map()

export function NamedSurface(fromJson: (json: any) => Surface) {
    return function (constructor: { new(...args: any): Surface }) {
        namedSurfaces.set(constructor.name, fromJson)
    }
}

export abstract class Surface {

    abstract get vertices(): Vec3[]

    abstract get triangles(): number[][]

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
        public vertices: Vec3[] = [],
        public triangles: number[][] = []
    ) {
        super()
    }

    static fromJson(json: any): GeneralSurface {
        return new GeneralSurface(json.vertices.map((v: any) => Vec3.fromJson(v)), json.triangles)
    }

    addVertex(vertex: Vec3) {
        this.vertices.push(vertex)
    }

    addTriangle(v1: number, v2: number, v3: number) {
        this.triangles.push([v1, v2, v3])
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
        public plane: P,
        public z: number,
        public rotation: Quaternion = Quaternion.NORTH
    ) {
        super()
    }

    static fromJson(json: any): Plane3 {
        return new Plane3(Plane2.fromJson(json.plane), json.y, Quaternion.fromJson(json.rotation))
    }

    withPlane<P extends Plane2 = Plane2>(plane: P): Plane3<P> {
        return new Plane3(plane, this.z, this.rotation)
    }

    toNamedJson() {
        return {
            name: this.constructor.name,
            plane: this.plane.toNamedJson(),
            z: this.z,
            rotation: this.rotation.toJson()
        }
    }

    get pos(): Vec3 {
        // TODO
        return new Vec3(0, 0, this.z)
    }

    get vertices(): Vec3[] {
        return this.plane.edge.getVertices().map(vertex2D => {
            const vertex3D = new Vec3(vertex2D.x, vertex2D.y, this.z)
            return this.rotation.rotateVector(vertex3D)
        });
    }

    get triangles(): number[][] {
        return this.plane.edge.getTriangles()
    }
}