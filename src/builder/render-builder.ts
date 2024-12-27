//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { TreeUpdate } from "../connection/directives/update.js"
import { ClientDirector } from "../connection/director.js"
import { FormDataInput, FormDataOutput, MappedTree } from "../util.js"
import { Dimension3D } from "../world/world3D.js"
import { Builder, ResourceReference } from "./builder.js"
import { BuilderElement, BuilderElementNode, BuilderElementUpdate, EditGraph, ElementView } from "./elements/elements.js"

export type BuilderElementsUpdate = {
    id: string,
    mode?: 'push' | 'delete',
    data?: BuilderElementUpdate
}

export abstract class RenderBuilder extends Builder {

    dimension: Dimension3D
    elements: MappedTree<BuilderElement>

    constructor(reference: ResourceReference<RenderBuilder>, dimension: Dimension3D, elements: BuilderElement[] = []) {
        super(reference)
        this.dimension = dimension
        this.elements = new MappedTree(elements)
    }

    async init() {
        for (let i = 0; i < this.elements.nodes.length; i++) {
            await this.elements.nodes[i].init()
        }
    }

    tree(): BuilderElementNode[] {
        return this.elements.map((element) => element.node())
    }

    view(): ElementView[] {
        return this.elements.map((element) => element.view())
    }

    elementsForm(ids: string[]): Promise<FormDataInput[]> {
        return this.elements.getById(ids[0]).form()
    }

    elementsEditGraph(ids: string[]): Promise<EditGraph> {
        return this.elements.getById(ids[0]).editGraph()
    }

    async getSelectionData(ids: string[], form: boolean = true, editGraph: boolean = true): Promise<{ form?: FormDataInput[], editGraph?: EditGraph }> {
        return {
            form: form ? await this.elementsForm(ids) : undefined,
            editGraph: editGraph ? await this.elementsEditGraph(ids) : undefined
        }
    }

    async setDimension(director: ClientDirector, dimension: Dimension3D): Promise<void> {
        for (let i = 0; i < this.elements.nodes.length; i++) {
            const element = this.elements.nodes[i]
            this.update(director, {
                elements: [{
                    id: element.id,
                    data: await element.setDimension(element.anchor.update(this.dimension, dimension, element.getDimension()))
                }]
            })
        }
        this.dimension = dimension

        this.saveDirector(director)
    }

    async updateForm(director: ClientDirector, ids: string[], updates: FormDataOutput): Promise<void> {
        if (ids.length === 1) {
            this.saveDirector(director)
            this.update(director, { elements: [{
                id: ids[0],
                data: await this.elements.getById(ids[0]).updateForm(updates)
            }] })
        }
    }

    async pushElements(director: ClientDirector, elements: BuilderElement[], parent?: string): Promise<void> {
        for (let i = 0; i < elements.length; i++) {
            await elements[i].init()
        }
        this.elements.push(elements, parent)

        if (parent) {
            const parentElement = this.elements.getById(parent)
            this.update(director, {
                elements: [{
                    id: parent,
                    data: {
                        view: parentElement.view(),
                        node: parentElement.node()
                    }
                }]
            })
        } else {
            this.update(director, {
                elements: elements.map((element) => {
                    return {
                        id: element.id,
                        mode: 'push',
                        data: {
                            view: element.view(),
                            node: element.node()
                        }
                    }
                })
            })
        }
        this.saveDirector(director)
    }

    async deleteElements(director: ClientDirector, ids: string[]): Promise<void> {
        const deleted = this.elements.delete(ids)
        this.update(director, {
            elements: deleted.map((id) => {
                return {
                    id: id,
                    mode: 'delete'
                }
            })
        })
        this.saveDirector(director)
    }

    async moveElements(director: ClientDirector, ids: string[], parent?: string): Promise<void> {
        const elements = ids.map((id) => this.elements.getById(id))
        this.elements.move(ids, parent)

        this.update(director, {
            elements: [
                ...elements.map((element) => {
                    return {
                        id: element.id,
                        data: {
                            parent: parent ?? null
                        }
                    }
                })
            ]
        })
        this.saveDirector(director)
    }

    abstract update(director: ClientDirector, update: {
        elements?: BuilderElementsUpdate[]
    }): void
}