import { Vec2, Vec3 } from "./vector.js"

export interface Geo2 {

    move(vec: Vec2): Geo2

    // rotate(rotation: number, vec: Vec2): Geo2

    // scale(vec: Vec2): Geo2

    toJson(): {}
}

export interface Geo3 {

    move(vec: Vec3): Geo3

    // rotate(rotation: Quaternion, vec: Vec3): Geo3

    // scale(vec: Vec3): Geo3

    toJson(): {}
}