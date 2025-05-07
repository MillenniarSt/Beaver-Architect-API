//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { RandomTypeRegistry } from "../../../register/random"

export class StyleDependency {

    constructor(
        readonly randoms: Record<string, RandomTypeRegistry>
    ) { }

    static empty(): StyleDependency {
        return new StyleDependency({})
    }

    static fromJson(json: any): StyleDependency {
        return new StyleDependency(json.randoms)
    }

    join(dependency: StyleDependency): StyleDependency {
        return new StyleDependency({ ...this.randoms, ...dependency.randoms })
    }

    toJson() {
        return {
            randoms: this.randoms
        }
    }
}

export interface WithDependency {

	getStyleDependency(): StyleDependency
}