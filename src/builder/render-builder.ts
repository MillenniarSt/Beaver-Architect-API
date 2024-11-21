import { FormDataInput, FormDataOutput, MappedTree } from "../util.js"
import { Dimension3D } from "../world/world3D.js"
import { Builder, ResourceReference } from "./builder.js"
import { BuilderElement, BuilderElementNode, BuilderElementUpdate, BuilderElementUpdates, EditGraph, ElementView } from "./elements/elements.js"

export abstract class RenderBuilder extends Builder {

    dimension: Dimension3D
    elements: MappedTree<BuilderElement>

    constructor(reference: ResourceReference<RenderBuilder>, dimension: Dimension3D, elements: BuilderElement[] = []) {
        super(reference)
        this.dimension = dimension
        this.elements = new MappedTree(elements)
    }

    async init() {
        for(let i = 0; i < this.elements.nodes.length; i++) {
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

    async getSelectionData(ids: string[], form: boolean = true, editGraph: boolean = true): Promise<BuilderElementUpdates> {
        return {
            client: {
                form: form ? await this.elementsForm(ids) : undefined,
                editGraph: editGraph ? await this.elementsEditGraph(ids) : undefined
            }
        }
    }

    async setDimension(dimension: Dimension3D): Promise<BuilderElementUpdates> {
        for(let i = 0; i < this.elements.nodes.length; i++) {
            const element = this.elements.nodes[i]
            await element.setDimension(element.anchor.update(this.dimension, dimension, element.getDimension()))
        }
        this.dimension = dimension
        return {
            save: true,
            updates: this.elements.map((element) => {
                return {
                    id: element.id,
                    view: element.view(),
                    editGraph: true,
                    form: true
                }
            })
        }
    }

    async updateForm(ids: string[], updates: FormDataOutput): Promise<BuilderElementUpdates> {
        return {
            save: true,
            updates: await this.elements.getById(ids[0]).updateForm(updates)
        }
    }

    async pushElements(elements: BuilderElement[], parent?: string): Promise<BuilderElementUpdates> {
        for(let i = 0; i < elements.length; i++) {
            await elements[i].init()
        }
        this.elements.push(elements, parent)

        if (parent) {
            return {
                save: true,
                updates: [
                    {
                        id: parent,
                        view: this.elements.getById(parent).view()
                    },
                    {
                        id: parent,
                        mode: 'push',
                        node: this.elements.getById(parent).node()
                    }
                ]
            }
        } else {
            return {
                save: true,
                updates: elements.map((element) => {
                    return {
                        id: element.id,
                        mode: 'push',
                        node: element.node(),
                        view: element.view()
                    }
                })
            }
        }
    }

    deleteElements(ids: string[]): BuilderElementUpdates {
        const deleted = this.elements.delete(ids)
        return {
            save: true,
            updates: deleted.map((id) => {
                return {
                    id: id,
                    mode: 'delete'
                }
            })
        }
    }

    moveElements(ids: string[], parent?: string): BuilderElementUpdates {
        const elements = ids.map((id) => this.elements.getById(id))
        this.elements.move(ids, parent)

        let updates: BuilderElementUpdate[] = []
        updates.push(...elements.map((element) => {
            return {
                id: element.id,
                parent: parent ?? null
            }
        }))
        if (parent) {
            updates.push({
                id: parent,
                view: this.elements.getById(parent).view()
            })
        } else {
            updates.push(...elements.map((element) => {
                return {
                    id: element.id,
                    view: element.view()
                }
            }))
        }
        return {
            save: true,
            updates: updates
        }
    }
}