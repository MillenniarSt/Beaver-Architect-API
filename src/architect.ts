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

export class Architect {

    identifier: string

    settings = new Map<string, any>()

    constructor(identifier: string) {
        this.identifier = identifier
    }
}