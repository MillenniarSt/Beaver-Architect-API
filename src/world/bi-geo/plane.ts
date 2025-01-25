import { Vec2 } from "../vector.js"
import { BezierCurve2, CloseLine2 } from "./line.js"

export class Plane2 {

    constructor(readonly edge: CloseLine2) { }

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
        return new Plane2(CloseLine2.fromJson(json))
    }

    toJson(): {} {
        return this.edge.toJson()
    }
}

export class Rect2 extends Plane2 {

    constructor(public pos: Vec2, public size: Vec2) {
        super(CloseLine2.fromPoints([
            pos,
            new Vec2(pos.x, pos.y + size.y),
            pos.add(size),
            new Vec2(pos.x + size.y, pos.y)
        ]))
    }

    static fromJson(json: any): Rect2 {
        return new Rect2(Vec2.fromJson(json.pos), Vec2.fromJson(json.size))
    }

    toJson() {
        return {
            pos: this.pos.toJson(),
            size: this.size.toJson()
        }
    }
}