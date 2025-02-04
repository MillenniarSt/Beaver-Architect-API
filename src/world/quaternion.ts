import { Vec3 } from "./vector.js"

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

    multiply(q: Quaternion): Quaternion {
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

    rotateVec(v: Vec3): Vec3 {
        const qv = new Quaternion(0, v.x, v.y, v.z)
        const qConjugate = new Quaternion(this.w, -this.x, -this.y, -this.z)
        const qResult = this.multiply(qv).multiply(qConjugate)

        return new Vec3(qResult.x, qResult.y, qResult.z)
    }

    add(q: Quaternion): Quaternion {
        const x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y
        const y = this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x
        const z = this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
        const w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z

        return new Quaternion(x, y, z, w).normalize();
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