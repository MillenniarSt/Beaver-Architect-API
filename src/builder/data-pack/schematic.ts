//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import { loadedProjects, project } from "../../project.js"
import { OnMessage, WsActions } from "../../server.js"
import { Dimension3D, Pos3D, Size3D } from "../../world/world3D.js"
import { ReferenceData, ResourceReference } from "../builder.js"
import { BuilderElementArchitect } from "./../elements/architect.js"
import { BuilderElement, BuilderElementUpdates } from "./../elements/elements.js"
import { BuilderElementGroup } from "./../elements/group.js"
import { RenderBuilder } from "../render-builder.js"

export class SchematicReference extends ResourceReference<Schematic> {

    get folder(): string {
        return 'data_pack\\schematics'
    }

    get(): Schematic {
        return loadedProjects[this.pack].dataPack.builders.schematics.get(this.location)!
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

    toJson(): {} {
        return {
            dimension: this.dimension.toJSON(),
            elements: this.elements.map((element) => element.toJson())
        }
    }
}

export function registerSchematicMessages(onMessage: OnMessage) {
    onMessage.set('data-pack/schematics/create', (data, ws) => {
        new Schematic(new SchematicReference(data.ref), new Dimension3D(Pos3D.ZERO, new Size3D(10, 10, 10))).save()
        ws.respond()
    })

    onMessage.set('data-pack/schematics/get', (data, ws) => ensureSchematic(data.ref, ws, (schematic) =>
        ws.respond({
            view: schematic.view(),
            tree: schematic.tree()
        })
    ))
    onMessage.set('data-pack/schematics/view', (data, ws) => ensureSchematic(data.ref, ws, (schematic) =>
        ws.respond(schematic.view())
    ))
    onMessage.set('data-pack/schematics/tree', (data, ws) => ensureSchematic(data.ref, ws, (schematic) =>
        ws.respond(schematic.tree())
    ))

    onMessage.set('data-pack/schematics/selection-data', (data, ws) => ensureSchematic(data.ref, ws, (schematic) => 
        schematic.getSelectionData(data.selection, data.form, data.editGraph)
    ))

    onMessage.set('data-pack/schematics/set-dimension', (data, ws) => ensureSchematic(data.ref, ws, (schematic) =>
        schematic.setDimension(Dimension3D.fromJson(data.dimension))
    ))
    onMessage.set('data-pack/schematics/update-form', (data, ws) => ensureSchematic(data.ref, ws, (schematic) =>
        schematic.updateForm(data.selection, data.updates)
    ))

    onMessage.set('data-pack/schematics/push-group-element', (data, ws) => ensureSchematic(data.ref, ws, async (schematic) => {
        return schematic.pushElements([BuilderElementGroup.generate(data.label ?? 'Group', schematic.elements.getByIds(data.elements))], data.parent)
    }))
    onMessage.set('data-pack/schematics/push-architect-elements', (data, ws) => ensureSchematic(data.ref, ws, async (schematic) => {
        return schematic.pushElements(data.elements.map((element: any) => BuilderElementArchitect.fromJson(element)), data.parent)
    }))
    onMessage.set('data-pack/schematics/move-elements', (data, ws) => ensureSchematic(data.ref, ws, async (schematic) => {
        return schematic.moveElements(data.elements, data.parent)
    }))
    onMessage.set('data-pack/schematics/delete-elements', (data, ws) => ensureSchematic(data.ref, ws, async (schematic) => {
        return schematic.deleteElements(data.elements)
    }))
}

async function ensureSchematic(ref: ReferenceData, ws: WsActions, callback: (schematic: Schematic) => Promise<BuilderElementUpdates> | Promise<void> | void) {
    const schematic = new SchematicReference(ref).get()
    if (schematic) {
        const updates = await callback(schematic)
        if (updates) {
            if (updates.save) {
                schematic.save()
            }
            if (updates.client) {
                ws.send('data-pack/schematics/update-client', { ref: ref, client: updates.client })
            }
            if (updates.updates) {
                ws.sendAll('data-pack/schematics/update', { ref: ref, updates: updates.updates })
            }
        }
    } else {
        throw new Error(`Can not access to Schematic '${ref}', it is not opened`)
    }
}