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

const generateID = require("mongodb").UUID.generate;

class Layer {

    _id;

    // Dimensio2D
    dimension;

    height;

    wallInside;
    wallOutside;

    rooms = [];

    constructor(geo, {height}) {
        this._id = generateID();
        this.geo = geo;
        this.height = height ?? 3;
        this.wallInside = style.wallInside;
        this.wallOutside = style.wallOutside;
    }
}

module.exports = Layer;