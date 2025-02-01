import { Plane2, Rect2 } from "../bi-geo/plane.js";
import { Quaternion } from "../quaternion.js";
import { Vec2, Vec3 } from "../vector.js";

export const namedObjects: Map<string, (json: any) => Object3> = new Map()

export function NamedObject(fromJson: (json: any) => Object3) {
    return function (constructor: { new(...args: any): Object3 }) {
        namedObjects.set(constructor.name, fromJson)
    }
}

export abstract class Object3 {

    constructor(
        public pos: Vec3,
        public rotation: Quaternion = Quaternion.NORTH,
        public scale: Vec3 = Vec3.UNIT
    ) { }

    abstract get vertices(): Vec3[]

    abstract get triangles(): number[][]

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
            triangles: this.triangles,
            pos: this.pos,
            rotation: this.rotation,
            scale: this.scale
        }
    }
}

@NamedObject(GeneralObject3.fromJson)
export class GeneralObject3 extends Object3 {

    constructor(
        public vertices: Vec3[],
        public triangles: number[][],
        pos: Vec3,
        rotation: Quaternion = Quaternion.NORTH,
        scale: Vec3 = Vec3.UNIT
    ) {
        super(pos, rotation, scale)
    }

    static fromJson(json: any): GeneralObject3 {
        return new GeneralObject3(json.vertices.map(Vec3.fromJson), json.triangles, Vec3.fromJson(json.position), Quaternion.fromJson(json.rotation), Vec3.fromJson(json.scale))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            vertices: this.vertices.map(v => v.toJson()),
            triangles: this.triangles,
            pos: this.pos,
            rotation: this.rotation,
            scale: this.scale
        }
    }
}

@NamedObject(Prism.fromJson)
export class Prism<P extends Plane2 = Plane2> extends Object3 {

    constructor(
        public plane: P,
        public height: number,
        pos: Vec3,
        rotation: Quaternion = Quaternion.NORTH,
        scale: Vec3 = Vec3.UNIT
    ) {
        super(pos, rotation, scale)
    }

    static fromJson(json: any): Prism {
        return new Prism(Plane2.fromJson(json.plane), json.height, Vec3.fromJson(json.position), Quaternion.fromJson(json.rotation), Vec3.fromJson(json.scale))
    }

    get vertices(): Vec3[] {
        const baseVertices = this.plane.edge.getVertices().map(v => new Vec3(v.x, this.pos.y, v.y))
        const topVertices = baseVertices.map(v => v.add(new Vec3(0, this.height, 0)))
        return [...baseVertices, ...topVertices]
    }

    get triangles(): number[][] {
        const baseCount = this.plane.edge.getVertices().length
        const triangles: number[][] = []
        for (const triangle of this.plane.edge.getTriangles()) {
            triangles.push(triangle)
        }
        for (const triangle of this.plane.edge.getTriangles()) {
            triangles.push(triangle.map(i => i + baseCount))
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
            plane: this.plane.toNamedJson(),
            height: this.height,
            pos: this.pos,
            rotation: this.rotation,
            scale: this.scale
        }
    }
}

@NamedObject(Rect3.fromJson)
export class Rect3 extends Prism<Rect2> {

    constructor(
        public size: Vec3,
        pos: Vec3,
        rotation: Quaternion = Quaternion.NORTH,
        scale: Vec3 = Vec3.UNIT
    ) {
        super(new Rect2(Vec2.ZERO, new Vec2(size.x, size.y)), size.z, pos, rotation, scale)
    }

    static fromJson(json: any): Rect3 {
        return new Rect3(Vec3.fromJson(json.size), Vec3.fromJson(json.position), Quaternion.fromJson(json.rotation), Vec3.fromJson(json.scale))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            size: this.size.toJson(),
            pos: this.pos,
            rotation: this.rotation,
            scale: this.scale
        }
    }
}