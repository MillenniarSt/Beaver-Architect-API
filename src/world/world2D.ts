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

export class Pos2D {

    constructor(readonly x: number, readonly z: number) { }

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

    static fromJson(json: any) {
        return new Pos2D(json[0], json[1])
    }

    toJSON() {
        return [this.x, this.z]
    }
}

export class Size2D {

    constructor(readonly width: number, readonly length: number) { }

    plus(size: Size2D): Size2D {
        return new Size2D(this.width + size.width, this.length + size.length)
    }

    minus(size: Size2D): Size2D {
        return new Size2D(this.width - size.width, this.length - size.length)
    }

    static fromJson(json: any) {
        return new Size2D(json[0], json[1])
    }

    toJSON() {
        return [this.width, this.length]
    }
}

export class Dimension2D {

    constructor(readonly pos: Pos2D, readonly size: Size2D) { }

    static fromPoss(start: Pos2D, end: Pos2D) {
        return new Dimension2D(
            new Pos2D(Math.min(start.x, end.x), Math.min(start.z, end.z)),
            new Size2D(Math.abs(end.x - start.x) +1, Math.abs(end.z - start.z) +1)
        )
    }

    contains(pos: Pos2D) {
        return ((pos.x >= this.pos.x && pos.x <= this.pos.x + this.size.width -1) || this.size.width == 0) &&
                ((pos.z >= this.pos.z && pos.z <= this.pos.z + this.size.length -1) || this.size.length == 0)
    }
}

export class Rotation2D {

    constructor(readonly y: number) { }

    yToRadiants() {
        return this.y * 180 / Math.PI
    }

    static north() {
        return new Rotation2D(0)
    }

    static east() {
        return new Rotation2D(90)
    }

    static south() {
        return new Rotation2D(180)
    }

    static west() {
        return new Rotation2D(270)
    }
}