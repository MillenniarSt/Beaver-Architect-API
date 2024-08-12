//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//    |\___   |   ___/|
//         \__|__/
//
//      By Millenniar
//

const generateID = require("mongodb").UUID.generate;

class Structure {

    _id;

    // Dimensio2D
    dimension;

    y;

    layers = [];

    constructor(geo, y) {
        this._id = generateID();
        this.geo = geo;
        this.y = y;
    }
}

module.exports = Structure;