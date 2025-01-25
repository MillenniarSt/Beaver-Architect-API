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