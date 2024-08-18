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

class Project {

    _id;

    name;
    authors;
    description;
    info;

    architect;

    type;
    builder;

    location;

    constructor(name, authors, description, info, architect, type) {
        this._id = generateID();
        this.name = name;
        this.authors = authors;
        this.description = description;
        this.info = info;
        this.architect = architect;
        this.type = type;
        this.location = null;
        this.builder = null;
    }

    toJson() {
        return {
            _id: this._id, 
            name: this.name, 
            authors: this.authors,
            description: this.description,
            info: this.info,
            architect: this.architect.identifier,
            type: this.type,
            location: this.location
        };
    }
}

module.exports = Project;