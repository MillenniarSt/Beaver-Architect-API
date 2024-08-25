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

const ObjectId = require('mongodb').ObjectId;

class Project {

    _id;

    name;
    authors;
    description;
    info;

    architect;

    type;
    builder;

    constructor(name, authors, description, info, architect, type) {
        this._id = new ObjectId().toHexString();
        this.name = name;
        this.authors = authors;
        this.description = description;
        this.info = info;
        this.architect = architect;
        this.type = type;
        this.builder = null
    }

    toJson() {
        return {
            _id: new ObjectId(_id),
            name: this.name,
            authors: this.authors,
            description: this.description,
            info: this.info,
            architect: this.architect,
            type: this.type,
            builder: this.builder
        }
    }
}

module.exports = Project;