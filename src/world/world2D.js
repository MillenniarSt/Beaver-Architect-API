class Pos2D {

    x; z;

    constructor(x, z) {
        this.x = x;
        this.z = z;
    }

    plus(pos) {
        return new Pos2D(this.x + pos.x, this.z + pos.z);
    }

    minus(pos) {
        return new Pos2D(this.x - pos.x, this.z - pos.z);
    }

    static fromJson(json) {
        return new Pos2D(json[0], json[1]);
    }

    toJSON() {
        return [this.x, this.z];
    }
}

class Size2D {

    width; length;

    constructor(width, length) {
        this.width = width;
        this.length = length;
    }

    plus(size) {
        return new Size2D(this.width + size.width, this.length + size.length);
    }

    minus(size) {
        return new Size2D(this.width - size.width, this.length - size.length);
    }

    static fromJson(json) {
        return new Size2D(json[0], json[1]);
    }

    toJSON() {
        return [this.width, this.length];
    }
}

class Dimension2D {

    pos;
    size;

    constructor(pos, size) {
        this.pos = pos;
        this.size = size;
    }

    static fromPoss(start, end) {
        return new Dimension2D(
            new Pos2D(Math.min(start.x, end.x), Math.min(start.z, end.z)),
            new Size2D(Math.abs(end.x - start.x) +1, Math.abs(end.z - start.z) +1)
        );
    }

    contains(pos) {
        return ((pos.x >= this.pos.x && pos.x <= this.pos.x + this.size.width -1) || this.size.width == 0) &&
                ((pos.z >= this.pos.z && pos.z <= this.pos.z + this.size.length -1) || this.size.length == 0);
    }
}

class Rotation2D {

    y;

    constructor(y) {
        this.y = y;
    }

    yToRadiants() {
        return this.y * 180 / pi;
    }

    static north() {
        return new Rotation2D(0);
    }

    static east() {
        return new Rotation2D(90);
    }

    static south() {
        return new Rotation2D(180);
    }

    static west() {
        return new Rotation2D(270);
    }
}

module.exports = { Pos2D, Size2D, Dimension2D, Rotation2D };