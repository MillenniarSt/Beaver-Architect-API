export class StyleDependence {

    constructor(
        readonly materials: string[]
    ) { }

    static fromJson(json: any): StyleDependence {
        return new StyleDependence(json.materials)
    }

    static join(dependencies: StyleDependence[]): StyleDependence {
        return new StyleDependence(dependencies.map((dependence) => dependence.materials).reduce((p, c) => p.concat(c), dependencies[0].materials))
    }

    toJson() {
        return {
            materials: this.materials
        }
    }
}