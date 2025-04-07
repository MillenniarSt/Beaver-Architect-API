//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ClientDirector } from "../../../connection/director.js"
import { PERMISSIONS } from "../../../connection/permission.js"
import { type MessageFunction, type ServerOnMessage } from "../../../connection/server.js"
import type { ClientSide } from "../../../connection/sides.js"
import { getArchitectSide, getProject } from "../../../instance.js"
import type { FormOutput } from "../../../util/form.js"
import { Vec2 } from "../../../world/vector.js"
import { type Paint, Material } from "./material.js"
import { Style, StyleReference, type MaterialChanges, type StyleChanges } from "./style.js"

/**
 * Sum up messages paths and their data types required
 */
type MessagesStructure = {
    'create': MessageFunction<ClientSide, { ref: string, abstract?: boolean }>,

    'get': MessageFunction<ClientSide, { ref: string }>
    'preview': MessageFunction<ClientSide, { ref: string, material: string, size: any }>,
    'possible-implementations': MessageFunction<ClientSide, { ref: string, research: string }>,

    'edit': MessageFunction<ClientSide, { ref: string, changes: StyleChanges }>,

    'push-implementation': MessageFunction<ClientSide, { ref: string, implementation: string }>,
    'delete-implementation': MessageFunction<ClientSide, { ref: string, implementation: string }>,

    'create-material': MessageFunction<ClientSide, { ref: string, id: string }>,
    'edit-material': MessageFunction<ClientSide, { ref: string, id: string, changes: MaterialChanges }>,
    'delete-material': MessageFunction<ClientSide, { ref: string, id: string }>,
    'get-material': MessageFunction<ClientSide, { ref: string, id: string }>,

    'add-paint': MessageFunction<ClientSide, { ref: string, material: string, id?: string }>,
    'edit-paint': MessageFunction<ClientSide, { ref: string, material: string, index: number, changes: FormOutput }>,
    'delete-paint': MessageFunction<ClientSide, { ref: string, material: string, index: number }>,
}

export function registerStyleMessages(onMessage: ServerOnMessage) {
    Object.entries(styleMessages()).forEach(([key, f]) => onMessage.set(`data-pack/styles/${key}`, f))
}

/**
 * Starts with 'data-pack/styles/...'
*/
function styleMessages(): MessagesStructure {
    return {
        'create': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.MANAGE_STYLE)
            const ref = new StyleReference(data.ref)
            const style = new Style(ref, data.abstract ?? false)
            getProject(ref.pack).dataPack.styles.set(style.reference.location, style)
            style.save()
            client.respond(id, {})
        },

        'get': read((style, data, client, id) => {
            client.respond(id, {
                isAbstract: style.isAbstract,
                implementations: style.implementations.map((implementation) => {
                    return { pack: implementation.relativePack, location: implementation.location }
                }),
                materials: style.mapMaterials((material, id) => {
                    return { id: id, type: material.type, fromImplementations: style.implementationsOfValue(id).map((ref) => ref.toString()) }
                })
            })
        }),
        'preview': read(async (style, data, client, id) => {
            client.respond(id, await getArchitectSide().request('materials/preview', { material: style.getValue(data.material), size: Vec2.fromJson(data.size) }))
        }),
        'possible-implementations': read(async (style, data, client, id) => {
            let implementations: any[] = []
            getProject().dataPack.styles.forEach((pStyle) => {
                if (!style.containsImplementation(pStyle.reference) && !pStyle.containsImplementation(style.reference)) {
                    if (data.research && !pStyle.reference.pack.includes(data.research) && !pStyle.reference.location.includes(data.research)) {
                        return
                    }
                    implementations.push({ pack: pStyle.reference.relativePack, location: pStyle.reference.location })
                }
            })
            client.respond(id, implementations)
        }),
        'edit': simpleEdit(
            async (director, style, data) => style.edit(director, data.changes),
            async (director, style, result) => style.edit(director, result)
        ),

        'push-implementation': simpleEdit(
            async (director, style, data) => style.pushImplementation(director, new StyleReference(data.implementation)),
            async (director, style, result, data) => style.deleteImplementation(director, new StyleReference(data.implementation))
        ),
        'delete-implementation': simpleEdit(
            async (director, style, data) => style.deleteImplementation(director, new StyleReference(data.implementation)),
            async (director, style, result, data) => style.pushImplementation(director, new StyleReference(data.implementation))
        ),

        'create-material': simpleEdit(
            async (director, style, data) => style.pushValue(director, data.id, Material.fromJson(await getArchitectSide().request('data-pack/materials/default', { addColors: !style.isAbstract }))),
            async (director, style, result, data) => style.deleteValue(director, data.id)
        ),
        'edit-material': simpleEdit(
            async (director, style, data) => style.editMaterial(director, data.id, data.changes),
            async (director, style, result, data) => style.editMaterial(director, data.id, result)
        ),
        'delete-material': simpleEdit(
            async (director, style, data) => style.deleteValue(director, data.id),
            async (director, style, result, data) => style.pushValue(director, data.id, result)
        ),
        'get-material': read((style, data, client, id) => {
            const material = style.getValue(data.id)
            client.respond(id, {
                type: material.type,
                paints: material.paints
            })
        }),

        'add-paint': edit(async (style, data, client) => {
            const material = style.getValue(data.material)
            const paint: Paint = await getArchitectSide().request('materials/default-paint')
            data.id = data.id ?? paint.id
            const index = material.paints.list.length
            ClientDirector.execute(client,
                async (director) => {
                    material.pushMaterial(data.id!, { additional: paint.additional })
                    style.updateMaterial(director, data.material)
                },
                async (director) => {
                    material.deleteMaterial(index)
                    style.updateMaterial(director, data.material)
                }
            )
        }),
        'edit-paint': edit(async (style, data, client) => {
            const material = style.getValue(data.material)
            const paint = material.copyMaterial(data.index)
            ClientDirector.execute(client,
                async (director) => {
                    material.editMaterial(data.index, data.changes)
                    style.updateMaterial(director, data.material)
                },
                async (director) => {
                    material.paints.list[data.index] = paint
                    style.updateMaterial(director, data.material)
                }
            )
        }),
        'delete-paint': edit(async (style, data, client) => {
            const material = style.getValue(data.material)
            const paint = material.paints.list[data.index]
            ClientDirector.execute(client,
                async (director) => {
                    material.deleteMaterial(data.index)
                    style.updateMaterial(director, data.material)
                },
                async (director) => {
                    material.paints.push(paint)
                    style.updateMaterial(director, data.material)
                }
            )
        })
    }
}

function simpleEdit<D extends { ref: string }, R>(
    exe: (director: ClientDirector, style: Style, data: D, client: ClientSide) => Promise<R>,
    undo: (director: ClientDirector, style: Style, result: R, data: D, client: ClientSide) => Promise<any>
): MessageFunction<ClientSide, D> {
    return (data, client) => {
        client.ensurePermission(PERMISSIONS.MANAGE_STYLE)
        const style = getStyle(data)
        ClientDirector.execute(client,
            (director) => exe(director, style, data, client),
            (director, result) => undo(director, style, result, data, client)
        )
    }
}

function edit<D extends { ref: string }>(f: (style: Style, data: D, client: ClientSide, id: string | undefined) => any): MessageFunction<ClientSide, D> {
    return (data, client, id) => {
        client.ensurePermission(PERMISSIONS.MANAGE_STYLE)
        f(getStyle(data), data, client, id)
    }
}

function read<D extends { ref: string }>(f: (style: Style, data: D, client: ClientSide, id: string | undefined) => any): MessageFunction<ClientSide, D> {
    return (data, client, id) => {
        client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
        f(getStyle(data), data, client, id)
    }
}

function getStyle(data: { ref: string }): Style {
    return new StyleReference(data.ref).get()
}