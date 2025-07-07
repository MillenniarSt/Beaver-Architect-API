//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { CauseError, NotTested, TODO } from "../dev/decorators.js"
import type { ToJson } from "../util/util.js"
import { Vec2, Vec3 } from "./vector.js"

export const AXIS_X = new Vec3(1, 0, 0)
export const AXIS_Y = new Vec3(0, 1, 0)
export const AXIS_Z = new Vec3(0, 0, 1)

export class Direction implements ToJson {

    static readonly NORTH: Direction = new Direction(0, Math.PI / -2)
    static readonly EAST: Direction = new Direction(0, 0)
    static readonly SOUTH: Direction = new Direction(0, Math.PI / 2)
    static readonly WEST: Direction = new Direction(0, Math.PI)
    static readonly UP: Direction = new Direction(Math.PI / 2, 0)
    static readonly DOWN: Direction = new Direction(Math.PI / -2, 0)

    constructor(readonly elevation: number, readonly azimuth: number) { }

    static pointing(pivot: Vec3, vec: Vec3): Direction {
        const dx = vec.x - pivot.x
        const dy = vec.y - pivot.y
        const dz = vec.z - pivot.z

        return new Direction(Math.atan2(dz, dx), Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)))
    }

    static fromJson(json: any): Direction {
        return new Direction(json[0], json[1])
    }

    add(direction: Direction): Direction {
        return new Direction(this.elevation + direction.elevation, this.azimuth + direction.azimuth)
    }

    subtract(direction: Direction): Direction {
        return new Direction(this.elevation - direction.elevation, this.azimuth - direction.azimuth)
    }

    rotateVec(vec: Vec3): Vec3 {
        const sinAz = Math.sin(this.azimuth)
        const cosAz = Math.cos(this.azimuth)
        const sinEl = Math.sin(this.elevation)
        const cosEl = Math.cos(this.elevation)

        const x1 = vec.x * cosAz + vec.z * sinAz
        const z1 = -vec.x * sinAz + vec.z * cosAz
        const y1 = vec.y

        const y2 = y1 * cosEl - z1 * sinEl
        const z2 = y1 * sinEl + z1 * cosEl
        const x2 = x1

        return new Vec3(x2, y2, z2)
    }

    toVec(length: number = 1): Vec3 {
        const x = length * Math.cos(this.elevation) * Math.cos(this.azimuth)
        const y = length * Math.sin(this.elevation)
        const z = length * Math.cos(this.elevation) * Math.sin(this.azimuth)
        return new Vec3(x, y, z)
    }

    toJson() {
        return [this.elevation, this.azimuth]
    }
}

/*export class Quaternion {

    static readonly NORTH: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(0))
    static readonly EAST: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(-90))
    static readonly SOUTH: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(180))
    static readonly WEST: Quaternion = Quaternion.fromAxisAngle(AXIS_Y, toRadiants(90))
    static readonly UP: Quaternion = Quaternion.fromAxisAngle(AXIS_X, toRadiants(-90))
    static readonly DOWN: Quaternion = Quaternion.fromAxisAngle(AXIS_X, toRadiants(90))

    constructor(readonly w: number, readonly x: number, readonly y: number, readonly z: number) { }

    static fromAxisAngle(axis: Vec3, angle: number): Quaternion {
        const halfAngle = angle / 2
        const s = Math.sin(halfAngle)
        const c = Math.cos(halfAngle)

        return new Quaternion(c, axis.x * s, axis.y * s, axis.z * s)
    }

    static lookAt(from: Vec3, to: Vec3, up: Vec3 = new Vec3(0, 1, 0)): Quaternion {
        const forward = to.subtract(from).normalize()
        const right = up.cross(forward).normalize()
        const newUp = forward.cross(right)

        const m00 = right.x, m01 = right.y, m02 = right.z
        const m10 = newUp.x, m11 = newUp.y, m12 = newUp.z
        const m20 = forward.x, m21 = forward.y, m22 = forward.z

        const trace = m00 + m11 + m22
        let w, x, y, z

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0)
            w = 0.25 / s
            x = (m21 - m12) * s
            y = (m02 - m20) * s
            z = (m10 - m01) * s
        } else if ((m00 > m11) && (m00 > m22)) {
            const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22)
            w = (m21 - m12) / s
            x = 0.25 * s
            y = (m01 + m10) / s
            z = (m02 + m20) / s
        } else if (m11 > m22) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22)
            w = (m02 - m20) / s
            x = (m01 + m10) / s
            y = 0.25 * s
            z = (m12 + m21) / s
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11)
            w = (m10 - m01) / s
            x = (m02 + m20) / s
            y = (m12 + m21) / s
            z = 0.25 * s
        }

        return new Quaternion(w, x, y, z)
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)
    }

    normalize(): Quaternion {
        const magnitude = this.length()
        return new Quaternion(this.w / magnitude, this.x / magnitude, this.y / magnitude, this.z / magnitude)
    }

    multiply(q: Quaternion): Quaternion {
        return new Quaternion(
            this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
            this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
            this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
            this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
        )
    }

    rotate(angle: number): Quaternion {
        return new Quaternion(Math.cos(angle / 2) + this.w, this.x, this.y, this.z)
    }

    withW(w: number): Quaternion {
        return new Quaternion(w, this.x, this.y, this.z)
    }

    rotateVec(v: Vec3): Vec3 {
        const qResult = this.multiply(new Quaternion(0, v.x, v.y, v.z)).multiply(this.conjugate())

        return new Vec3(qResult.x, qResult.y, qResult.z)
    }

    toVec(length: number = 1): Vec3 {
        return this.rotateVec(new Vec3(0, 0, -1)).normalize().scale(length)
    }

    conjugate(): Quaternion {
        return new Quaternion(this.w, -this.x, -this.y, -this.z)
    }

    inverse(): Quaternion {
        const lenSquared = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w

        const conjugate = this.conjugate()
        return new Quaternion(
            conjugate.w / lenSquared,
            conjugate.x / lenSquared,
            conjugate.y / lenSquared,
            conjugate.z / lenSquared
        )
    }

    static fromJson(json: any): Quaternion {
        return new Quaternion(json[0], json[1], json[2], json[3])
    }

    toJson(): number[] {
        return [this.w, this.x, this.y, this.z]
    }
}*/

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
        readonly direction: Direction,
        readonly pivot: Vec3 = Vec3.ZERO
    ) { }

    static fromJson(json: any): Rotation3 {
        return new Rotation3(Direction.fromJson(json.direction), Vec3.fromJson(json.pivot))
    }

    @NotTested()
    add(rotation: Rotation3): Rotation3 {
        return new Rotation3(this.direction.add(rotation.direction), this.getVec(rotation.pivot))
    }

    addAround(direction: Direction): Rotation3 {
        return new Rotation3(this.direction.add(direction), this.pivot)
    }

    getVec(vec: Vec3): Vec3 {
        return this.direction.rotateVec(vec.subtract(this.pivot)).add(this.pivot)
        /*const vecDirection = this.direction.add(Direction.pointing(this.pivot, vec))
        const radius = this.pivot.distanceTo(vec)
        return vecDirection.toVec(radius).add(this.pivot)*/
        //return this.direction.rotateVec(vec.subtract(this.pivot)).add(this.pivot)
    }

    toJson() {
        return {
            direction: this.direction.toJson(),
            pivot: this.pivot.toJson()
        }
    }
}