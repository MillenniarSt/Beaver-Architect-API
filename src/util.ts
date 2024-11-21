import { Size3D } from "./world/world3D.js"

export type FormDataInput = {
    id?: string,
    name: string,
    type: string,
    options?: any,
    value?: any
}

export type FormDataOutput = Record<string, any>

export type SceneObject = {
    position: number[],
    size?: number[],
    rotation?: number[],

    models: string[]
}

export function displayName(name: string): string {
    return name.charAt(0).toLocaleUpperCase() + name.substring(1).replace('_', ' ')
}

export class SizeLimitation {

    constructor(public min: Size3D | null, public max: Size3D | null) { }

    static unlimited(): SizeLimitation {
        return new SizeLimitation(null, null)
    }

    static block(size: Size3D | null): SizeLimitation {
        return new SizeLimitation(size, size)
    }

    static fromJson(json: any): SizeLimitation {
        if(!json) {
            return SizeLimitation.unlimited()
        } else if(Array.isArray(json)) {
            return SizeLimitation.block(Size3D.fromJson(json))
        } else {
            return new SizeLimitation(json.min ? Size3D.fromJson(json.min) : null, json.max ? Size3D.fromJson(json.max) : null)
        }
    }

    toJson(): {} {
        return {
            min: this.min?.toJSON(),
            max: this.max?.toJSON()
        }
    }
}

export class RelativeNumber {

    constructor(
        public value: number,
        public isRelative: boolean = false
    ) { }

    static fromJson(json: string): RelativeNumber {
        return json.charAt(json.length -1) === '%' ? new RelativeNumber(Number(json.substring(0, json.length -1)), true) : new RelativeNumber(Number(json))
    }

    get(dimension: number) {
        return this.isRelative ? this.value * dimension : this.value
    }

    toJson(): string {
        return `${this.value}${this.isRelative ? '%' : ''}`
    }

    toString(): string {
        return this.toJson()
    }
}

export class MappedTree<Node extends { id: string, children?: Node[] }> {

    nodes: Node[]
    protected nodesMap: Map<string, { element: Node, parent: string | null }>

    constructor(nodes: Node[] = []) {
        this.nodes = nodes
        this.nodesMap = new Map(this.buildMap(nodes, null))
    }

    protected buildMap(nodes: Node[], parent: string | null): [string, { element: Node, parent: string | null }][] {
        let entries: [string, { element: Node, parent: string | null }][] = []
        nodes.forEach((node) => {
            entries.push([node.id, { element: node, parent }], ...(node.children ? this.buildMap(node.children, node.id) : []))
        })
        return entries
    }

    push(nodes: Node[], parentId?: string) {
        this.buildMap(nodes, parentId ?? null).forEach((entry) => this.nodesMap.set(entry[0], entry[1]))
        if(parentId) {
            const parent = this.getById(parentId)
            if(parent && parent.children !== undefined) {
                parent.children.push(...nodes)
            }
        } else {
            this.nodes.push(...nodes)
        }
    }

    delete(ids: string[]): string[] {
        let deleted: string[] = []
        ids.forEach((id) => {
            const parent = this.getParentOf(id)
            if (parent && parent.children !== undefined) {
                parent.children.splice(parent.children.findIndex((child) => child.id === id), 1)
            } else if (parent === null) {
                this.nodes.splice(this.nodes.findIndex((node) => node.id === id), 1)
            }
            if (parent !== undefined) {
                const recursiveDelete = (node: Node) => {
                    deleted.push(node.id)
                    this.nodesMap.delete(node.id)
                    if(node.children !== undefined) {
                        node.children.forEach((child) => recursiveDelete(child))
                    }
                }
                recursiveDelete(this.getById(id))
            }
        })
        return deleted
    }

    move(ids: string[], parent?: string) {
        const nodes = ids.map((id) => this.getById(id))
        this.delete(ids)
        this.push(nodes, parent)
    }

    getById(id: string): Node {
        return this.nodesMap.get(id)!.element
    }

    getByIds(ids: string[]): Node[] {
        return ids.map((id) => this.getById(id))
    }

    getParentOf(id: string): Node | null | undefined {
        const data = this.nodesMap.get(id)
        if (data) {
            return data.parent ? this.getById(data.parent) : null
        }
        return undefined
    }

    forEach(callbackfn: (value: Node, index: number, array: Node[]) => void, thisArg?: any): void {
        this.nodes.forEach(callbackfn)
    }

    map<U>(callbackfn: (value: Node, index: number, array: Node[]) => U, thisArg?: any): U[] {
        return this.nodes.map(callbackfn)
    }
}