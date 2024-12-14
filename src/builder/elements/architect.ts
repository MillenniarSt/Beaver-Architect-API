import { BaseUpdate, CheckUpdate, TreeUpdate } from "../../connection/directives/update.js";
import { project } from "../../project.js";
import { FormDataInput, FormDataOutput, SizeLimitation } from "../../util.js";
import { Dimension3D, Pos3D, Size3D } from "../../world/world3D.js";
import { Anchor, BuilderElement, BuilderElementNode, BuilderElementUpdate, EditGraph, ElementView } from "./elements.js";

type ArchitectUpdate = {
    data?: {},

    dimension?: Dimension3D,
    label?: string,
    children?: BuilderElementNode[],
    view?: ElementView,

    updates?: {
        id: string,
        mode?: 'push' | 'delete',
        parent?: string | null
    
        view?: ElementView,
        node?: BuilderElementNode,
        editGraph?: boolean,
        form?: boolean
    }[]
}

export class BuilderElementArchitect extends BuilderElement {

    private dimension: Dimension3D
    private label: string = 'Element'
    private nodeChildren: BuilderElementNode[] = []
    private savedView: ElementView = { id: this.id, objects: [] }

    private constructor(
        id: string,

        readonly shape: string,
        pos: Pos3D,
        private data: {} = {},

        limitation: SizeLimitation,
        anchor: Anchor
    ) {
        super(id, limitation, anchor)
        this.dimension = new Dimension3D(pos, Size3D.UNIT)
    }

    static fromJson(json: any): BuilderElementArchitect {
        return new BuilderElementArchitect(
            json.id,
            json.shape,
            Pos3D.fromJson(json.pos),
            json.data,
            SizeLimitation.fromJson(json.limitation),
            Anchor.fromJson(json.anchor)
        )
    }

    getDimension(): Dimension3D {
        return this.dimension
    }
    async setDimension(dimension: Dimension3D): Promise<TreeUpdate<BuilderElementUpdate>> {
        return this.setUpdate(await project.architect.server.request('elements/set-dimension', { element: this.toArchitectData(), dimension: dimension.toJSON() }))
    }

    async init() {
        this.setUpdate(await project.architect.server.request('elements/init', { element: this.toArchitectData() }))
    }

    node(): BuilderElementNode {
        return {
            id: this.id,
            label: this.label
        }
    }

    view(): ElementView {
        return this.savedView
    }

    form(): Promise<FormDataInput[]> {
        return project.architect.server.request('elements/form', { element: this.toArchitectData() })
    }

    editGraph(): Promise<EditGraph> {
        return project.architect.server.request('elements/edit-graph', { element: this.toArchitectData() })
    }

    async updateForm(updates: FormDataOutput): Promise<TreeUpdate<BuilderElementUpdate>> {
        console.debug('Form', updates)
        return this.setUpdate(await project.architect.server.request('elements/update-form', { element: this.toArchitectData(), updates: updates }))
    }

    protected setUpdate(update: ArchitectUpdate): TreeUpdate<BuilderElementUpdate> {
        this.data = update.data ?? this.data
        this.label = update.label ?? this.label
        this.nodeChildren = update.children ?? this.nodeChildren
        this.savedView = update.view ?? this.savedView
        this.dimension = update.dimension ? Dimension3D.fromJson(update.dimension) : this.dimension
        return new TreeUpdate(update.updates ? update.updates.map((update) => {
            return {
                id: update.id,
                mode: update.mode,
                data: {
                    parent: update.parent !== undefined ? new BaseUpdate(update.parent) : undefined,
                    view: update.view !== undefined ? new BaseUpdate(update.view) : undefined,
                    node: update.node !== undefined ? new BaseUpdate(update.node) : undefined,
                    editGraph: update.editGraph !== undefined ? new CheckUpdate(update.editGraph) : undefined,
                    form: update.form !== undefined ? new CheckUpdate(update.form) : undefined
                }
            }
        }) : [])
    }

    toJson(): {} {
        return {
            id: this.id,
            type: 'architect',
            pos: this.dimension.pos.toJSON(),
            shape: this.shape,
            data: this.data,
            limitation: this.limitation.toJson(),
            anchor: this.anchor.toJson()
        }
    }

    toArchitectData(): {} {
        return {
            id: this.id,
            pos: this.dimension.pos.toJSON(),
            shape: this.shape,
            data: this.data,
        }
    }
}