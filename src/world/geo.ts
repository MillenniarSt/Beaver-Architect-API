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

import { BiGeo } from "./bigeo.js"
import { Dimension3D } from "./world3D.js"

export class Geo {

    constructor(readonly type: string) { }
}

export abstract class RegularGeo extends Geo {

    constructor(type: string, public dimension: Dimension3D) {
        super(type)
    }
}

export class Parallelepiped extends RegularGeo {

    constructor(dimension: Dimension3D) {
        super('parallelepiped', dimension)
    }
}

export class Sphere extends RegularGeo {

    constructor(dimension: Dimension3D) {
        super('ellipse', dimension)
    }
}

export abstract class BasedGeo<G extends BiGeo> extends Geo {

    constructor(type: string, readonly root: G) {
        super(type)
    }
}

export class Prism<G extends BiGeo> extends BasedGeo<G> {

    constructor(root: G, public y: number, public height: number) {
        super('prism', root)
    }
}

export class Cone<G extends BiGeo> extends BasedGeo<G> {

    constructor(root: G, public y: number, public height: number) {
        super('cone', root)
    }
}