//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import { Dimension3D } from "./world3D.js"

export class Pos2D {

    static readonly ZERO = new Pos2D(0, 0)

    constructor(readonly x: number, readonly z: number) { }

    equals(pos: Pos2D): boolean {
        return this.x === pos.x && this.z === pos.z
    }

    distance(pos: Pos2D): number {
        return Math.sqrt(Math.pow(this.x - pos.x, 2) + Math.pow(this.z - pos.z, 2))
    }

    moveX(x: number): Pos2D {
        return new Pos2D(this.x + x, this.z)
    }

    moveZ(z: number): Pos2D {
        return new Pos2D(this.x, this.z + z)
    }

    plus(pos: Pos2D): Pos2D {
        return new Pos2D(this.x + pos.x, this.z + pos.z)
    }

    minus(pos: Pos2D): Pos2D {
        return new Pos2D(this.x - pos.x, this.z - pos.z)
    }

    static fromJson(json: any): Pos2D {
        return new Pos2D(json[0], json[1])
    }
    toJSON(): number[] {
        return [this.x, this.z]
    }
}

export class Size2D {

    static readonly ZERO = new Size2D(0, 0)
    static readonly UNIT = new Size2D(1, 1)

    constructor(readonly width: number, readonly length: number) { }

    equals(pos: Size2D): boolean {
        return this.width === pos.width && this.length === pos.length
    }

    plus(size: Size2D): Size2D {
        return new Size2D(this.width + size.width, this.length + size.length)
    }

    minus(size: Size2D): Size2D {
        return new Size2D(this.width - size.width, this.length - size.length)
    }

    min(size: Size2D): Size2D {
        return new Size2D(Math.min(this.width, size.width), Math.min(this.length, size.length))
    }

    max(size: Size2D): Size2D {
        return new Size2D(Math.max(this.width, size.width), Math.max(this.length, size.length))
    }

    range(min: Size2D, max: Size2D): Size2D {
        return new Size2D(Math.max(min.width, Math.min(this.width, max.width)), Math.max(min.length, Math.min(this.length, max.length)))
    }

    static fromJson(json: any): Size2D {
        return new Size2D(json[0], json[1])
    }

    toJSON() {
        return [this.width, this.length]
    }
}

export class Dimension2D {

    static readonly ZERO = new Dimension2D(Pos2D.ZERO, Size2D.ZERO)

    constructor(readonly pos: Pos2D, readonly size: Size2D) { }

    static fromPoss(start: Pos2D, end: Pos2D) {
        return new Dimension2D(
            new Pos2D(Math.min(start.x, end.x), Math.min(start.z, end.z)),
            new Size2D(Math.abs(end.x - start.x), Math.abs(end.z - start.z))
        )
    }

    get extreme(): Pos2D {
        return new Pos2D(this.pos.x + this.size.width, this.pos.z + this.size.length)
    }

    equals(dimension: Dimension3D): boolean {
        return this.pos.equals(dimension.pos) && this.size.equals(dimension.size)
    }

    plus(dimension: Dimension2D): Dimension2D {
        return Dimension2D.fromPoss(
            new Pos2D(Math.min(this.pos.x, dimension.pos.x), Math.min(this.pos.z, dimension.pos.z)),
            new Pos2D(Math.max(this.extreme.x, dimension.extreme.x), Math.max(this.extreme.z, dimension.extreme.z))
        )
    }

    contains(pos: Pos2D) {
        return ((pos.x >= this.pos.x && pos.x <= this.pos.x + this.size.width -1) || this.size.width == 0) &&
                ((pos.z >= this.pos.z && pos.z <= this.pos.z + this.size.length -1) || this.size.length == 0)
    }

    center(): Pos2D {
        return new Pos2D(this.pos.x + (this.size.width / 2), this.pos.z + (this.size.length / 2))
    }

    static fromJson(json: any): Dimension2D {
        return new Dimension2D(Pos2D.fromJson(json.pos), Size2D.fromJson(json.size))
    }

    toJSON() {
        return {
            pos: this.pos.toJSON(),
            size: this.size.toJSON()
        }
    }
}

export function toRadiants(angle: number) {
    return angle / 180 * Math.PI
}

export function toGrades(angle: number) {
    return angle * 180 / Math.PI
}

export class Rotation2D {

    constructor(readonly y: number) { }

    plus(rotation: Rotation2D): Rotation2D {
        return new Rotation2D(this.y + rotation.y)
    }

    minus(rotation: Rotation2D): Rotation2D {
        return new Rotation2D(this.y - rotation.y)
    }

    static north() {
        return new Rotation2D(0)
    }

    static east() {
        return new Rotation2D(Math.PI * 0.5)
    }

    static south() {
        return new Rotation2D(Math.PI)
    }

    static west() {
        return new Rotation2D(Math.PI * 1.5)
    }

    static fromJson(json: any): Rotation2D {
        return new Rotation2D(json)
    }

    toJSON(): any {
        return this.y
    }
}