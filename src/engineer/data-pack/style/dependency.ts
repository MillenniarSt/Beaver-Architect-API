//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

export type MaterialDependency = {
    id: string
}

export type StyleOptionDependency = {
    id: string
}

export class StyleDependency {

    constructor(
        readonly materials: MaterialDependency[],
        readonly options: StyleOptionDependency[]
    ) { }

    static fromJson(json: any): StyleDependency {
        return new StyleDependency(json.materials, json.options)
    }

    static join(dependencies: StyleDependency[]): StyleDependency {
        if(dependencies.length === 0) {
            return new StyleDependency([], [])
        }
        return new StyleDependency(
            dependencies.map((dependence) => dependence.materials).reduce((p, c) => p.concat(c), dependencies[0].materials),
            dependencies.map((dependence) => dependence.options).reduce((p, c) => p.concat(c), dependencies[0].options)
        )
    }

    getMaterial(id: string): MaterialDependency {
        return this.materials.find((material) => material.id === id)!
    }

    getOption(id: string): StyleOptionDependency {
        return this.options.find((v) => v.id === id)!
    }

    toJson() {
        return {
            materials: this.materials,
            options: this.options
        }
    }
}