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

class DoorStyle {

    name;

    // - Size3D
    // - Map {
    //     min: Size3D
    //     max: Size3D
    //   }
    size;

    spacing;

    // On Config use "model" to specify both
    modelOpen;
    modelClose;

    constructor(json) {
        this.name = json.name;
        this.size = json.size instanceof Array ? {
            min: Size3D.fromJson(json.size),
            max: Size3D.fromJson(json.size)
        } : {
            min: Size3D.fromJson(json.size.min),
            max: Size3D.fromJson(json.size.max)
        }
        this.spacing = json.spacing ?? 2;
        this.modelOpen = json.model_open ?? json.model;
        this.modelClose = json.model_close ?? json.model;
    }
}

class Door {

    style;

    dimension;
    isOpen = false;

    constructor(style, dimension) {
        this.style = style;
        this.dimension = dimension;
    }
}

module.exports = { DoorStyle, Door };