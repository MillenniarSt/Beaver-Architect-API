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

class Terrain {

    constructor() {
        this._id = generateID();
    }
}

module.exports = Terrain;