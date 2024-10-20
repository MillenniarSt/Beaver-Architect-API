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

import { BasicCurvedLine, Line } from "./line.js"
import { Dimension2D, Pos2D } from "./world2D.js"

export abstract class BiGeo {

    constructor(readonly type: string) { }

    abstract get perimeter(): Line<Pos2D>
}

export abstract class RegularBiGeo extends BiGeo {

    constructor(type: string, public dimension: Dimension2D) {
        super(type)
    }
}

export class Rectangle extends RegularBiGeo {

    constructor(dimension: Dimension2D) {
        super('rectangle', dimension)
    }

    get perimeter(): Line<Pos2D> {
        return Line.fromPoints<Pos2D>([
            this.dimension.pos,
            this.dimension.pos.moveX(this.dimension.size.width), 
            this.dimension.pos.moveX(this.dimension.size.width).moveZ(this.dimension.size.length),
            this.dimension.pos.moveZ(this.dimension.size.length) 
        ])
    }
}

export class Ellipse extends RegularBiGeo {

    constructor(dimension: Dimension2D) {
        super('ellipse', dimension)
    }

    get perimeter(): Line<Pos2D> {
        return Line.fromPoints<Pos2D>([
            this.dimension.pos,
            this.dimension.pos.moveX(this.dimension.size.width), 
            this.dimension.pos.moveX(this.dimension.size.width).moveZ(this.dimension.size.length),
            this.dimension.pos.moveZ(this.dimension.size.length) 
        ], (start, end) => new BasicCurvedLine(start, end))
    }
}

export class Polygon extends BiGeo {

    constructor(public line: Line<Pos2D>) {
        super('polygon')
    }

    get perimeter(): Line<Pos2D> {
        return this.line
    }
}