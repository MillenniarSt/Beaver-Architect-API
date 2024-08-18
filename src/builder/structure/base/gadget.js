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

const { Size3D } = require("../../../world/world3D");

class GadgetStyle {

    name;

    // - Size3D
    // - Map {
    //     min: Size3D
    //     max: Size3D
    //   }
    size;

    model;

    constructor(json) {
        this.name = json.name;
        this.size = json.size instanceof Array ? {
            min: Size3D.fromJson(json.size),
            max: Size3D.fromJson(json.size)
        } : {
            min: Size3D.fromJson(json.size.min),
            max: Size3D.fromJson(json.size.max)
        }
        this.model = json.model;
    }
}

class Gadget {

    style;

    dimension;

    constructor(style, dimension) {
        this.style = style;
        this.dimension = dimension;
    }
}

module.exports = { GadgetStyle, Gadget };