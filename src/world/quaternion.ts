//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Vec2, Vec3 } from "./vector.js"

export const AXIS_X = new Vec3(1, 0, 0)
export const AXIS_Y = new Vec3(0, 1, 0)
export const AXIS_Z = new Vec3(0, 0, 1)

export class Quaternion {

    static readonly NORTH: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(0))
    static readonly EAST: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(90))
    static readonly SOUTH: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(180))
    static readonly WEST: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(270))
    static readonly UP: Quaternion = Quaternion.fromAxisAngle(AXIS_X, toRadiants(-90))
    static readonly DOWN: Quaternion = Quaternion.fromAxisAngle(AXIS_X, toRadiants(90))

    constructor(readonly w: number, readonly x: number, readonly y: number, readonly z: number) { }

    static fromAxisAngle(axis: Vec3, angle: number): Quaternion {
        const halfAngle = angle / 2
        const s = Math.sin(halfAngle)
        const c = Math.cos(halfAngle)

        return new Quaternion(c, axis.x * s, axis.y * s, axis.z * s)
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)
    }

    normalize(): Quaternion {
        const magnitude = this.length()
        return new Quaternion(this.w / magnitude, this.x / magnitude, this.y / magnitude, this.z / magnitude)
    }

    add(q: Quaternion): Quaternion {
        const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
        const x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y
        const y = this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x
        const z = this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
        return new Quaternion(w, x, y, z)
    }

    toMatrix(): number[][] {
        const xx = this.x * this.x
        const xy = this.x * this.y
        const xz = this.x * this.z
        const yy = this.y * this.y
        const yz = this.y * this.z
        const zz = this.z * this.z
        const wx = this.w * this.x
        const wy = this.w * this.y
        const wz = this.w * this.z

        return [
            [1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy)],
            [2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx)],
            [2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy)],
        ]
    }

    rotate(angle: number): Quaternion {
        return new Quaternion(Math.cos(angle / 2) + this.w, this.x, this.y, this.z)
    }

    withW(w: number): Quaternion {
        return new Quaternion(w, this.x, this.y, this.z)
    }

    rotateVec(v: Vec3): Vec3 {
        const qv = new Quaternion(0, v.x, v.y, v.z)
        const qConjugate = new Quaternion(this.w, -this.x, -this.y, -this.z)
        const qResult = this.add(qv).add(qConjugate)

        return new Vec3(qResult.x, qResult.y, qResult.z)
    }

    conjugate(): Quaternion {
        return new Quaternion(-this.x, -this.y, -this.z, this.w)
    }

    inverse(): Quaternion {
        const lenSquared = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w

        const conjugate = this.conjugate()
        return new Quaternion(
            conjugate.x / lenSquared,
            conjugate.y / lenSquared,
            conjugate.z / lenSquared,
            conjugate.w / lenSquared
        );
    }

    static fromJson(json: any): Quaternion {
        return new Quaternion(json[0], json[1], json[2], json[3])
    }

    toJson(): number[] {
        return [this.w, this.x, this.y, this.z]
    }
}

export function toRadiants(angle: number) {
    return angle / 180 * Math.PI
}

export function toGrades(angle: number) {
    return angle * 180 / Math.PI
}

export class Rotation2 {

    constructor(
        readonly angle: number,
        readonly pivot: Vec2 = Vec2.ZERO
    ) { }

    static fromPoints(center: Vec2, vec1: Vec2, vec2: Vec2, pivot: Vec2 = center): Rotation2 {
        return new Rotation2(Math.acos((center.distance(vec1) ** 2 + center.distance(vec2) ** 2 - vec1.distance(vec2) ** 2) / (2 * center.distance(vec1) * center.distance(vec2))), pivot)
    }

    static fromJson(json: any): Rotation2 {
        return new Rotation2(json.angle, Vec2.fromJson(json.pivot))
    }

    add(rotation: Rotation2): Rotation2 {
        return new Rotation2(this.angle + rotation.angle, this.pivot)
    }

    getVec(vec: Vec2): Vec2 {
        const relativeVec = vec.subtract(this.pivot)
        const cosT = Math.cos(this.angle)
        const sinT = Math.sin(this.angle)

        return new Vec2(
            relativeVec.x * cosT - relativeVec.y * sinT,
            relativeVec.x * sinT + relativeVec.y * cosT
        ).add(this.pivot)
    }

    toJson() {
        return {
            angle: this.angle,
            pivot: this.pivot.toJson()
        }
    }
}

export class Rotation3 {

    constructor(
        readonly quaternion: Quaternion,
        readonly pivot: Vec3 = Vec3.ZERO
    ) { }

    static fromJson(json: any): Rotation3 {
        return new Rotation3(Quaternion.fromJson(json.angle), Vec3.fromJson(json.pivot))
    }

    add(rotation: Rotation3): Rotation3 {
        // TODO Fix for different Pivot
        return new Rotation3(this.quaternion.add(rotation.quaternion), this.pivot)
    }

    addQ(quaternion: Quaternion): Rotation3 {
        return new Rotation3(this.quaternion.add(quaternion), this.pivot)
    }

    getVec(vec: Vec3): Vec3 {
        return this.quaternion.rotateVec(vec.subtract(this.pivot)).add(this.pivot)
    }

    toJson() {
        return {
            angle: this.quaternion.toJson(),
            pivot: this.pivot.toJson()
        }
    }
}