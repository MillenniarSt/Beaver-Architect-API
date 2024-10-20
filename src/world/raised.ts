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

export class RaisedBiGeo<G extends BiGeo> {

    constructor(readonly root: G) { }

    static flat<G extends BiGeo>(root: G): RaisedBiGeo<G> {
        return new RaisedBiGeo<G>(root)
    }
}