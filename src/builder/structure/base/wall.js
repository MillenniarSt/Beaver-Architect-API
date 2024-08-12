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

const { Rectangle } = require('../../../world/bigeo');
const { Dimension2D, Size2D } = require('../../../world/world2D');

class WallStyle {

    name;

    // List of preferred windows
    windows;
    // List of preferred doors
    doors;
    // List of preferred gadgets
    gadgets;

    model;

    constructor(json) {
        this.name = json.name;
        this.windows = json.windows ?? [];
        this.doors = json.doors ?? [];
        this.gadgets = json.gadgets ?? [];
        this.model = json.model;
    }
}

class Wall {

    style;

    // Line with 3 dimensions
    line;

    // BiGeo
    shape;

    thickness;

    windows = [];
    doors = [];
    gadgets = [];

    constructor(style, line, {shape, height, y, thickness}) {
        this.style = style;
        this.line = line.to3D(y ?? 0);
        this.shape = shape ?? new Rectangle(new Dimension2D(line.start, new Size2D(line.length, height ?? 1)));
        this.thickness = thickness ?? 1;
    }
}

module.exports = { WallStyle, Wall };