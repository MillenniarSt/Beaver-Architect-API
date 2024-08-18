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

class RoomStyle {

    static empty = new RoomStyle({
        name: "Empty"
    });

    name;

    // FloorStyle
    floor;
    ceiling;

    // WallStyle
    wall;

    // List of preferred gadgets
    gadgets;

    constructor(json) {
        this.name = json.name;
        this.floor = json.floor;
        this.ceiling = json.ceiling;
        this.wall = json.wall;
        this.gadgets = json.gadgets ?? [];
    }
}

class Room {

    // RoomStyle or RoomStyle.empty
    style;

    // Prism
    geo;

    // Floor
    floor;
    ceiling;

    // List of Gadget
    gadgets;

    // List of Wall
    walls;

    constructor(style, geo, {floor, ceiling, gadgets, walls}) {
        this.style = style;
        this.geo = geo;
        this.floor = floor ?? null;
        this.ceiling = ceiling ?? null;
        this.gadgets = gadgets ?? [];
        this.walls = walls ?? [];
    }
}

module.exports = { RoomStyle, Room };