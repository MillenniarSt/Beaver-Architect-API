import { Plane2 } from "../bi-geo/plane.js";
import { Quaternion } from "../quaternion.js";

export class Plane3<P extends Plane2 = Plane2> {

    constructor(
        readonly plane: P, 
        readonly y: number, 
        readonly rotation: Quaternion = Quaternion.NORTH
    ) { }

    static fromJson(json: any): Plane3 {
        return new Plane3(Plane2.fromJson(json.plane), json.y, Quaternion.fromJson(json.rotation))
    }

    withPlane<P extends Plane2 = Plane2>(plane: P): Plane3<P> {
        return new Plane3(plane, this.y, this.rotation)
    }

    toJson() {
        return {
            plane: this.plane.toJson(),
            y: this.y,
            rotation: this.rotation.toJson()
        }
    }
}