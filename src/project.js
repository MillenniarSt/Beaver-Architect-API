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

const generateID = require('mongodb').UUID.generate;
const World = require('./builder/world');

class Project {

    _id;

    name;
    description;
    info;

    architect;

    type;
    builder;

    constructor(name, description, info, architect, type) {
        this._id = generateID();
        this.name = name;
        this.description = description;
        this.info = info;
        this.architect = architect;
        this.type = type;
        switch(type) {
            case 'world': builder = new World();
        }
    }
}

module.exports = Project;