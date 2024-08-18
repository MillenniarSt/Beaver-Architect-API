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

const { Pos2D, Size2D, Dimension2D, Rotation2D } = require('./world2D');

class Pos3D extends Pos2D {

    y;

    constructor(x, z, y) {
        super(x, z);
        this.y = y;
    }

    plus(pos) {
        return new Pos3D(this.x + pos.x, this.z + pos.z, this.y + pos.y);
    }

    minus(pos) {
        return new Pos3D(this.x - pos.x, this.z - pos.z, this.y - pos.y);
    }

    static fromJson(json) {
        return new Pos3D(json[0], json[1], json[2]);
    }

    toJSON() {
        return [this.x, this.y, this.z];
    }
}

class Size3D extends Size2D {

    height;

    constructor(width, length, height) {
        super(width, length);
        this.height = height;
    }

    plus(size) {
        return new Size3D(this.width + size.width, this.length + size.length, this.height + size.height);
    }

    minus(size) {
        return new Size3D(this.width - size.width, this.length - size.length, this.height - size.height);
    }

    static fromJson(json) {
        return new Size2D(json[0], json[1], json[2]);
    }

    toJSON() {
        return [this.width, this.height, this.length];
    }
}

class Dimension3D extends Dimension2D {

    static fromPoss(start, end) {
        return new Dimension3D(
            new Pos3D(Math.min(start.x, end.x), Math.min(start.z, end.z), Math.min(start.y, end.y)),
            new Size3D(Math.abs(end.x - start.x) +1, Math.abs(end.z - start.z) +1, Math.abs(end.y - start.y) +1)
        );
    }

    contains(contain) {
        return ((contain.x >= this.pos.x && contain.x <= this.pos.x + this.size.width -1) || this.size.width == 0) &&
                ((contain.z >= this.pos.z && contain.z <= this.pos.z + this.size.length -1) || this.size.length == 0) &&
                ((contain.y >= this.pos.y && contain.y <= this.pos.y + this.size.height -1) || this.size.height == 0);
    }
}

class Rotation3D extends Rotation2D {

    x;
    z;

    constructor(x, y, z) {
        super(y);
        this.x = x;
        this.z = z;
    }

    xToRadiants() {
        return this.x * 180 / pi;
    }

    zToRadiants() {
        return this.z * 180 / pi;
    }

    static north() {
        return new Rotation3D(0, 0, 0);
    }

    static east() {
        return new Rotation3D(90, 0, 0);
    }

    static south() {
        return new Rotation3D(180, 0, 0);
    }

    static west() {
        return new Rotation3D(270, 0, 0);
    }

    static top() {
        return new Rotation3D(0, 270, 0);
    }

    static bottom() {
        return new Rotation3D(0, 90, 0);
    }
}

module.exports = { Pos3D, Size3D, Dimension3D, Rotation3D };