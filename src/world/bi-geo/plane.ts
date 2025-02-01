import { Vec2 } from "../vector.js"
import { CloseLine2 } from "./line.js"

export const namedPlanes: Map<string, (json: any) => Plane2> = new Map()

export function NamedPlane(fromJson: (json: any) => Plane2) {
    return function (constructor: { new(...args: any): Plane2 }) {
        namedPlanes.set(constructor.name, fromJson)
    }
}

export abstract class Plane2 {

    abstract get edge(): CloseLine2

    abstract toNamedJson(): {}

    containsPoint(point: Vec2): boolean {
        return this.edge.containsPoint(point) || this.rayCastingAlgorithm(point)
    }

    private rayCastingAlgorithm(point: Vec2): boolean {
        let crossings = 0

        this.edge.parts.forEach((part) => {
            if (part.intersectsRay(point)) {
                crossings++
            }
        })

        return crossings % 2 !== 0
    }

    static fromJson(json: any): Plane2 {
        const factory = namedPlanes.get(json.name)
        if (!factory) {
            throw Error(`No Plane2 registered for name: ${json.name}`)
        }
        return factory(json)
    }

    toJson(): {} {
        return this.edge.toJson()
    }
}

@NamedPlane(GeneralPlane2.fromJson)
export class GeneralPlane2 extends Plane2 {

    constructor(public edge: CloseLine2) {
        super()
    }

    static fromJson(json: any): GeneralPlane2 {
        return new GeneralPlane2(CloseLine2.fromJson(json))
    }

    toNamedJson(): {} {
        return {
            name: this.constructor.name,
            edge: this.edge.toJson()
        }
    }
}

@NamedPlane(Rect2.fromJson)
export class Rect2 extends Plane2 {

    constructor(public pos: Vec2, public size: Vec2) {
        super()
    }

    static fromJson(json: any): Rect2 {
        return new Rect2(Vec2.fromJson(json.pos), Vec2.fromJson(json.size))
    }

    get edge(): CloseLine2 {
        return CloseLine2.fromPoints([
            this.pos,
            new Vec2(this.pos.x, this.pos.y + this.size.y),
            this.pos.add(this.size),
            new Vec2(this.pos.x + this.size.y, this.pos.y)
        ])
    }

    toNamedJson() {
        return {
            name: this.constructor.name,
            pos: this.pos.toJson(),
            size: this.size.toJson()
        }
    }
}