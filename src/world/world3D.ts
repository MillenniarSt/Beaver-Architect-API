//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { Dimension2D, Pos2D, Rotation2D, Size2D, toRadiants } from "./world2D.js"

export class Pos3D extends Pos2D {

    static readonly ZERO = new Pos3D(0, 0, 0)

    constructor(x: number, z: number, readonly y: number) {
        super(x, z)
    }

    equals(pos: Pos3D): boolean {
        return this.x === pos.x && this.z === pos.z && this.y === pos.y
    }

    distance(pos: Pos3D): number {
        return Math.sqrt(Math.pow(this.x - pos.x, 2) + Math.pow(this.z - pos.z, 2) + Math.pow(this.y - pos.y, 2))
    }

    moveX(x: number): Pos3D {
        return new Pos3D(this.x + x, this.z, this.y)
    }

    moveZ(z: number): Pos3D {
        return new Pos3D(this.x, this.z + z, this.y)
    }

    moveY(y: number): Pos3D {
        return new Pos3D(this.x, this.z, this.y + y)
    }

    plus(pos: Pos3D): Pos3D {
        return new Pos3D(this.x + pos.x, this.z + pos.z, this.y + pos.y)
    }

    minus(pos: Pos3D): Pos3D {
        return new Pos3D(this.x - pos.x, this.z - pos.z, this.y - pos.y)
    }

    static fromJson(json: any) {
        return new Pos3D(json[0], json[2], json[1])
    }

    toJSON(): number[] {
        return [this.x, this.y, this.z]
    }
}

export class Size3D extends Size2D {

    static readonly ZERO = new Size3D(0, 0, 0)
    static readonly UNIT = new Size3D(1, 1, 1)

    constructor(width: number, length: number, readonly height: number) {
        super(width, length)
    }

    equals(pos: Size3D): boolean {
        return this.width === pos.width && this.length === pos.length && this.height === pos.height
    }

    plus(size: Size3D): Size3D {
        return new Size3D(this.width + size.width, this.length + size.length, this.height + size.height)
    }

    minus(size: Size3D): Size3D {
        return new Size3D(this.width - size.width, this.length - size.length, this.height - size.height)
    }

    min(size: Size3D): Size3D {
        return new Size3D(Math.min(this.width, size.width), Math.min(this.length, size.length), Math.min(this.height, size.height))
    }

    max(size: Size3D): Size3D {
        return new Size3D(Math.max(this.width, size.width), Math.max(this.length, size.length), Math.max(this.height, size.height))
    }

    range(min: Size3D, max: Size3D): Size3D {
        return new Size3D(Math.max(min.width, Math.min(this.width, max.width)), Math.max(min.length, Math.min(this.length, max.length)), Math.max(min.height, Math.min(this.height, max.height)))
    }

    static fromJson(json: any) {
        return new Size3D(json[0], json[2], json[1])
    }

    toJSON() {
        return [this.width, this.height, this.length]
    }
}

export class Dimension3D extends Dimension2D {

    static readonly ZERO = new Dimension3D(Pos3D.ZERO, Size3D.ZERO)

    constructor(readonly pos: Pos3D, readonly size: Size3D) {
        super(pos, size)
    }

    static fromPoss(start: Pos3D, end: Pos3D) {
        return new Dimension3D(
            new Pos3D(Math.min(start.x, end.x), Math.min(start.z, end.z), Math.min(start.y, end.y)),
            new Size3D(Math.abs(end.x - start.x), Math.abs(end.z - start.z), Math.abs(end.y - start.y))
        )
    }

    get extreme(): Pos3D {
        return new Pos3D(this.pos.x + this.size.width, this.pos.z + this.size.length, this.pos.y + this.size.height)
    }

    plus(dimension: Dimension3D): Dimension3D {
        return Dimension3D.fromPoss(
            new Pos3D(Math.min(this.pos.x, dimension.pos.x), Math.min(this.pos.z, dimension.pos.z), Math.min(this.pos.y, dimension.pos.y)),
            new Pos3D(Math.max(this.extreme.x, dimension.extreme.x), Math.max(this.extreme.z, dimension.extreme.z), Math.max(this.extreme.y, dimension.extreme.y))
        )
    }

    contains(contain: Pos3D) {
        return ((contain.x >= this.pos.x && contain.x <= this.pos.x + this.size.width -1) || this.size.width == 0) &&
                ((contain.z >= this.pos.z && contain.z <= this.pos.z + this.size.length -1) || this.size.length == 0) &&
                ((contain.y >= this.pos.y && contain.y <= this.pos.y + this.size.height -1) || this.size.height == 0)
    }

    center(): Pos3D {
        return new Pos3D(this.pos.x + (this.size.width / 2), this.pos.z + (this.size.length / 2), this.pos.y + (this.size.height / 2))
    }

    static fromJson(json: any): Dimension3D {
        return new Dimension3D(Pos3D.fromJson(json.pos), Size3D.fromJson(json.size))
    }
}

export class Rotation3D extends Rotation2D {

    constructor(readonly x: number, y: number, readonly z: number) {
        super(y)
    }

    static axis(axis: string, angle: number): Rotation3D {
        switch(axis) {
            case 'x': return new Rotation3D(angle, 0, 0)
            case 'y': return new Rotation3D(0, angle, 0)
            case 'z': return new Rotation3D(0, 0, angle)
            default: return Rotation3D.north()
        }
    }

    static fromAxis(axis: any): Rotation3D {
        return new Rotation3D(axis.x ?? 0, axis.y ?? 0, axis.z ?? 0)
    }

    static fromGradeAxis(axis: any): Rotation3D {
        return new Rotation3D(toRadiants(axis.x ?? 0), toRadiants(axis.y ?? 0), toRadiants(axis.z ?? 0))
    }

    plus(rotation: Rotation3D): Rotation3D {
        return new Rotation3D(this.x + rotation.x, this.y + rotation.y, this.z + rotation.z)
    }

    minus(rotation: Rotation3D): Rotation3D {
        return new Rotation3D(this.x - rotation.x, this.y - rotation.y, this.z - rotation.z)
    }

    static north() {
        return new Rotation3D(0, 0, 0)
    }

    static east() {
        return new Rotation3D(0, Math.PI * 0.5, 0)
    }

    static south() {
        return new Rotation3D(0, Math.PI, 0)
    }

    static west() {
        return new Rotation3D(0, Math.PI * 1.5, 0)
    }

    static top() {
        return new Rotation3D(Math.PI * 1.5, 0, 0)
    }

    static bottom() {
        return new Rotation3D(Math.PI * 0.5, 0, 0)
    }

    static fromJson(json: any): Rotation3D {
        return new Rotation3D(json[0], json[1], json[2])
    }

    toJSON() {
        return [this.x, this.y, this.z]
    }
}