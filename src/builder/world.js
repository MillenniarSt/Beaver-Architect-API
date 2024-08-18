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

class World {

    _id;

    structures = [];

    constructor() {
        this._id = generateID();
    }
}

module.exports = World;