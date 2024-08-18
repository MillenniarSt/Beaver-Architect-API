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

const { Dimension2D } = require("./world2D");
const { Pos3D } = require("./world3D");

class BiGeo {

    type;

    to3D(y) { }
}

class Rectangle extends BiGeo {

    type = "rectangle";

    dimension;

    constructor(dimension) {
        super();
        this.dimension = dimension;
    }

    to3D(y) {
        return new Rectangle(new Dimension2D(new Pos3D(this.dimension.pos.x, this.dimension.pos.z, this.dimension.pos.y ?? y), this.dimension.size));
    }
}

class Ellipse extends Rectangle {

    type = "ellipse";

    constructor(dimension) {
        super(dimension);
    }

    to3D(y) {
        return new Ellipse(new Dimension2D(new Pos3D(this.dimension.pos.x, this.dimension.pos.z, this.dimension.pos.y ?? y), this.dimension.size));
    }
}

class RoundedRectangle extends RegularBiGeo {

    type = "rounded_rectangle";

    radiusNorthWest; 
    radiusNorthEast;
    radiusSouthEast;
    radiusSouthWest;

    constructor(dimension, {radiusNorthWest, radiusNorthEast, radiusSouthEast, radiusSouthWest}) {
        super(dimension);
        this.radiusNorthWest = radiusNorthWest ?? 0;
        this.radiusNorthEast = radiusNorthEast ?? 0;
        this.radiusSouthEast = radiusSouthEast ?? 0;
        this.radiusSouthWest = radiusSouthWest ?? 0;
    }

    to3D(y) {
        return new RoundedRectangle(new Dimension2D(new Pos3D(this.dimension.pos.x, this.dimension.pos.z, this.dimension.pos.y ?? y), this.dimension.size));
    }
}

class Polygon extends BiGeo {

    line;

    constructor(line) {
        super();
        this.line = line;
    }

    to3D(y) {
        return new Polygon(line.to3D(y));
    }
}

module.exports = { BiGeo, Rectangle, Ellipse, RoundedRectangle, Polygon };