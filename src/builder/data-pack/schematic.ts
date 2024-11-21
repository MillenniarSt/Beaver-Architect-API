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

import { project } from "../../project.js"
import { OnMessage, WsActions } from "../../server.js"
import { Dimension3D } from "../../world/world3D.js"
import { ResourceReference } from "../builder.js"
import { DataTypes } from "./data-pack.js"
import { BuilderElementArchitect } from "./../elements/architect.js"
import { BuilderElement, BuilderElementUpdates } from "./../elements/elements.js"
import { BuilderElementGroup } from "./../elements/group.js"
import { RenderBuilder } from "../render-builder.js"

export class Schematic extends RenderBuilder {

    constructor(pack: string, location: string, dimension: Dimension3D, elements: BuilderElement[] = []) {
        super(new ResourceReference(pack, DataTypes.SCHEMATICS, location), dimension, elements)
    }

    static fromRef(ref: ResourceReference<Schematic>): Schematic {
        const data = project.read(ref.path)
        return new Schematic(ref.pack, ref.location, 
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

let opened: Map<string, Schematic> = new Map()

export function registerSchematicMessages(onMessage: OnMessage) {
    onMessage.set('data-pack/schematics/open', async (data, ws) => {
        const ref = ResourceReference.fromString<Schematic>(data.ref, DataTypes.SCHEMATICS)
        let schematic = opened.get(ref.toJson())
        if(!schematic) {
            schematic = Schematic.fromRef(ref)
            await schematic.init()
            opened.set(ref.toJson(), schematic)
        }

        ws.respond({
            tree: schematic.tree(),
            view: schematic.view()
        })
    })
    onMessage.set('data-pack/schematics/close', (data) => {
        opened.delete(data.ref)
    })

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

async function ensureSchematic(ref: string, ws: WsActions, callback: (schematic: Schematic) => Promise<BuilderElementUpdates> | Promise<void> | void) {
    const schematic = opened.get(ref)
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