export class Object3Type {

    constructor(
        readonly id: string,
        readonly parents: string[] = [],
        readonly variants?: string
    ) { }

    isCompatibleWith(object: Object3Type | null, variant?: string): boolean {
        if(object === null || object.id === this.id || object.parents.length === 0) {
            return true
        }

        for(let i = 0; i < this.parents.length; i++) {
            if(objectTypes[this.parents[i]].isCompatibleWith(object)) {
                return true
            }
        }

        return false
    }

    toJson() {
        return { id: this.id, parents: this.parents }
    }
}

export const objectTypes: Record<string, Object3Type> = {
    // Lines

    line: new Object3Type('line', []),

    // Surfaces

    surface: new Object3Type('surface', []),
        plane: new Object3Type('plane', ['surface']),
            triangle: new Object3Type('triangle', ['plane']),
            rect: new Object3Type('rect', ['plane']),
                square: new Object3Type('cube', ['rect']),
            ellipse: new Object3Type('ellipse', ['plane']),
                circle: new Object3Type('circle', ['ellipse']),

    // Objects

    object: new Object3Type('object', []),
    prism: new Object3Type('prism', ['object'])
}