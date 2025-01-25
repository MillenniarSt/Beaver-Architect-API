import { Plane2, Rect2 } from "../bi-geo/plane.js";
import { Vec2, Vec3 } from "../vector.js";
import { Plane3 } from "./plane.js";

export class Object3 {

    constructor(
        readonly faces: Plane3[]
    ) { }

    toJson() {
        return {
            faces: this.faces.map((face) => face.toJson())
        }
    }
}

export class Prism<P extends Plane2 = Plane2> extends Object3 {

    constructor(
        readonly plane: P,
        readonly y: number,
        readonly height: number
    ) {
        super([
            // TODO
        ])
    }
}

export class Rect3 extends Prism<Rect2> {

    constructor(
        readonly pos: Vec3,
        readonly size: Vec3
    ) {
        super(
            new Rect2(Vec2.ZERO, new Vec2(size.x, size.z)),
            pos.y,
            size.y
        )
    }
}