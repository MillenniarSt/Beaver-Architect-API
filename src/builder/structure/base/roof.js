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

class RoofStyle {

    name;

    // List of preferred gadgets
    gadgets;

    model;

    constructor(json) {
        this.name = json.name;
        this.model = json.model;
        this.gadgets = json.gadgets ?? [];
    }
}

class Roof {

    style;

    biGeo;

    gadgets = [];

    constructor(style, biGeo, {y}) {
        this.style = style;
        this.biGeo = biGeo.to3D(y ?? 0);
    }
}

module.exports = { RoofStyle, Roof};