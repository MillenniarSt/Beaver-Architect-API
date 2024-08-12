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

class Project {

    _id;

    name;
    description;
    info;

    architect;

    builder;

    constructor(name, architect, builder) {
        this._id = generateID();
        this.name = name;
        this.description = "";
        this.info = "";
        this.architect = architect;
        this.builder = builder;
    }
}

module.exports = Project;