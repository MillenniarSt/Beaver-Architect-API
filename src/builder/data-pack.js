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

class DataPack {

    constructor() {
        this._id = generateID();
    }
}

module.exports = DataPack;