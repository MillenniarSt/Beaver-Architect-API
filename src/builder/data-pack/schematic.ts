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

import { loadedProjects, project } from "../../project.js"
import { Dimension3D, Pos3D, Size3D } from "../../world/world3D.js"
import { ResourceReference } from "../builder.js"
import { BuilderElementArchitect } from "./../elements/architect.js"
import { BuilderElement, elementUpdate } from "./../elements/elements.js"
import { BuilderElementGroup } from "./../elements/group.js"
import { BuilderElementsUpdate, RenderBuilder } from "../render-builder.js"
import { ServerOnMessage } from "../../connection/server.js"
import { ClientDirector } from "../../connection/director.js"
import { BuilderDirective, ListUpdate, ObjectUpdate } from "../../connection/directives/update.js"

export type SchematicUpdate = { 
    elements?: BuilderElementsUpdate[]
}

export const schematicUpdate = new ObjectUpdate<SchematicUpdate>({
    elements: new ListUpdate(elementUpdate)
})

export class SchematicReference extends ResourceReference<Schematic> {

    get folder(): string {
        return 'data_pack\\schematics'
    }

    protected _get(): Schematic | undefined {
        return loadedProjects[this.pack].dataPack.builders.schematics.get(this.location)
    }
}

export class Schematic extends RenderBuilder {

    constructor(ref: ResourceReference<Schematic>, dimension: Dimension3D, elements: BuilderElement[] = []) {
        super(ref, dimension, elements)
    }

    static loadFromRef(ref: ResourceReference<Schematic>): Schematic {
        const data = project.read(ref.path)
        return new Schematic(ref,
            Dimension3D.fromJson(data.dimension),
            data.elements.map((element: any) => BuilderElementGroup.getChildren[element.type](element))
        )
    }

    update(director: ClientDirector, update: SchematicUpdate): void {
        director.addDirective(BuilderDirective.update('data-pack/schematics/update', this.reference, schematicUpdate, update))
    }

    toJson(): {} {
        return {
            dimension: this.dimension.toJSON(),
            elements: this.elements.map((element) => element.toJson())
        }
    }
}

export function registerSchematicMessages(onMessage: ServerOnMessage) {
    onMessage.set('data-pack/schematics/create', (data, client, id) => {
        new Schematic(new SchematicReference(data.ref), new Dimension3D(Pos3D.ZERO, new Size3D(10, 10, 10))).save()
        client.respond(id, {})
    })

    onMessage.set('data-pack/schematics/get', (data, client, id) => {
        const schematic = new SchematicReference(data.ref).get()
        client.respond(id, {
            view: schematic.view(),
            tree: schematic.tree()
        })
    })
    onMessage.set('data-pack/schematics/view', (data, client, id) => {
        const schematic = new SchematicReference(data.ref).get()
        client.respond(id, schematic.view())
    })
    onMessage.set('data-pack/schematics/tree', (data, client, id) => {
        const schematic = new SchematicReference(data.ref).get()
        client.respond(id, schematic.tree())
    })

    onMessage.set('data-pack/schematics/selection-data', async (data, client, id) => {
        const schematic = new SchematicReference(data.ref).get()
        client.respond(id, await schematic.getSelectionData(data.selection, data.form, data.editGraph))
    })

    onMessage.set('data-pack/schematics/set-dimension', (data, client) => {
        const schematic = new SchematicReference(data.ref).get()
        const dimension = schematic.dimension
        ClientDirector.execute(client, 
            (director) => schematic.setDimension(director, Dimension3D.fromJson(data.dimension)),
            (director) => schematic.setDimension(director, dimension)
        )
    })
    onMessage.set('data-pack/schematics/update-form', (data, client) => {
        const schematic = new SchematicReference(data.ref).get()
        ClientDirector.execute(client, 
            (director) => schematic.updateForm(director, data.selection, data.updates),
            async (director) => undefined  // TODO
        )
    })

    onMessage.set('data-pack/schematics/push-group-element', (data, client) => {
        const schematic = new SchematicReference(data.ref).get()
        const group = BuilderElementGroup.generate(data.label ?? 'Group', schematic.elements.getByIds(data.elements))
        ClientDirector.execute(client, 
            (director) => schematic.pushElements(director, [group], data.parent),
            (director) => schematic.deleteElements(director, [group.id])  // TODO
        )
    })
    onMessage.set('data-pack/schematics/push-architect-elements', (data, client) => {
        const schematic = new SchematicReference(data.ref).get()
        const elements: BuilderElementArchitect[] = data.elements.map((element: any) => BuilderElementArchitect.fromJson(element))
        ClientDirector.execute(client, 
            (director) => schematic.pushElements(director, elements, data.parent),
            (director) => schematic.deleteElements(director, elements.map((element) => element.id))
        )
    })
    onMessage.set('data-pack/schematics/move-elements', (data, client) => {
        const schematic = new SchematicReference(data.ref).get()
        ClientDirector.execute(client, 
            (director) => schematic.moveElements(director, data.elements, data.parent),
            async (director) => undefined  // TODO
        )
    })
    onMessage.set('data-pack/schematics/delete-elements', (data, client) => {
        const schematic = new SchematicReference(data.ref).get()
        const elements = schematic.elements.getByIds(data.elements)
        ClientDirector.execute(client, 
            (director) => schematic.deleteElements(director, data.elements),
            (director) => schematic.pushElements(director, elements)
        )
    })
}