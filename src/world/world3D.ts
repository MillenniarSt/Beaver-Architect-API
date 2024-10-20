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

import { Dimension2D, Pos2D, Rotation2D, Size2D } from "./world2D.js"

export class Pos3D extends Pos2D {

    constructor(x: number, z: number, readonly y: number) {
        super(x, z)
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
        return new Pos3D(json[0], json[1], json[2])
    }

    toJSON() {
        return [this.x, this.y, this.z]
    }
}

export class Size3D extends Size2D {

    constructor(width: number, length: number, readonly height: number) {
        super(width, length)
    }

    plus(size: Size3D): Size3D {
        return new Size3D(this.width + size.width, this.length + size.length, this.height + size.height)
    }

    minus(size: Size3D): Size3D {
        return new Size3D(this.width - size.width, this.length - size.length, this.height - size.height)
    }

    static fromJson(json: any) {
        return new Size3D(json[0], json[1], json[2])
    }

    toJSON() {
        return [this.width, this.height, this.length]
    }
}

export class Dimension3D extends Dimension2D {

    constructor(readonly pos: Pos3D, readonly size: Size3D) {
        super(pos, size)
    }

    static fromPoss(start: Pos3D, end: Pos3D) {
        return new Dimension3D(
            new Pos3D(Math.min(start.x, end.x), Math.min(start.z, end.z), Math.min(start.y, end.y)),
            new Size3D(Math.abs(end.x - start.x) +1, Math.abs(end.z - start.z) +1, Math.abs(end.y - start.y) +1)
        )
    }

    contains(contain: Pos3D) {
        return ((contain.x >= this.pos.x && contain.x <= this.pos.x + this.size.width -1) || this.size.width == 0) &&
                ((contain.z >= this.pos.z && contain.z <= this.pos.z + this.size.length -1) || this.size.length == 0) &&
                ((contain.y >= this.pos.y && contain.y <= this.pos.y + this.size.height -1) || this.size.height == 0)
    }
}

export class Rotation3D extends Rotation2D {

    constructor(readonly x: number, y: number, readonly z: number) {
        super(y)
    }

    xToRadiants() {
        return this.x * 180 / Math.PI
    }

    zToRadiants() {
        return this.z * 180 / Math.PI
    }

    static north() {
        return new Rotation3D(0, 0, 0)
    }

    static east() {
        return new Rotation3D(90, 0, 0)
    }

    static south() {
        return new Rotation3D(180, 0, 0)
    }

    static west() {
        return new Rotation3D(270, 0, 0)
    }

    static top() {
        return new Rotation3D(0, 270, 0)
    }

    static bottom() {
        return new Rotation3D(0, 90, 0)
    }
}