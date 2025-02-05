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
import { ServerOnMessage } from "../../../connection/server.js"
import { getArchitect, getProject } from "../../../instance.js"
import { Vec2 } from "../../../world/vector.js"
import { Paint, Material } from "./material.js"
import { Style, StyleReference } from "./style.js"

export function registerStyleMessages(onMessage: ServerOnMessage) {
    onMessage.set('data-pack/styles/create', (data, client, id) => {
        const style = new Style(new StyleReference(data.ref), data.abstract ?? false)
        getProject(data.identifier).dataPack.engineers.styles.set(style.reference.location, style)
        style.save()
        client.respond(id, {})
    })

    onMessage.set('data-pack/styles/get', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        client.respond(id, {
            isAbstract: style.isAbstract,
            implementations: style.implementations.map((implementation) => {
                return { pack: implementation.relativePack, location: implementation.location }
            }),
            materials: style.mapMaterials((material, id) => {
                return { id: id, type: material.type, fromImplementations: style.implementationsOfMaterial(id).map((ref) => ref.toString()) }
            })
        })
    })
    onMessage.set('data-pack/styles/preview', async (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        client.respond(id, await getArchitect().server.request('materials/preview', { material: style.getMaterial(data.material), size: Vec2.fromJson(data.size) }))
    })

    onMessage.set('data-pack/styles/possible-implementations', (data, client, id) => {
        const style = new StyleReference(data.ref).get()

        let implementations: any[] = []
        getProject().dataPack.engineers.styles.forEach((pStyle) => {
            if (!style.containsImplementation(pStyle.reference) && !pStyle.containsImplementation(style.reference)) {
                if (data.research && !pStyle.reference.pack.includes(data.research) && !pStyle.reference.location.includes(data.research)) {
                    return
                }
                implementations.push({ pack: pStyle.reference.relativePack, location: pStyle.reference.location })
            }
        })
        client.respond(id, implementations)
    })

    onMessage.set('data-pack/styles/edit', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const undoChanges = style.undoChanges(data.changes)
        ClientDirector.execute(client,
            async (director) => style.edit(director, data.changes),
            async (director) => style.edit(director, undoChanges)
        )
    })
    onMessage.set('data-pack/styles/push-implementation', (data, client) => {
        const style = new StyleReference(data.ref).get()
        ClientDirector.execute(client,
            async (director) => style.pushImplementation(director, new StyleReference(data.implementation)),
            async (director) => style.deleteImplementation(director, new StyleReference(data.implementation))
        )
    })
    onMessage.set('data-pack/styles/delete-implementation', (data, client) => {
        const style = new StyleReference(data.ref).get()
        ClientDirector.execute(client,
            async (director) => style.deleteImplementation(director, new StyleReference(data.implementation)),
            async (director) => style.pushImplementation(director, new StyleReference(data.implementation))
        )
    })

    onMessage.set('data-pack/styles/create-material', (data, client) => {
        const style = new StyleReference(data.ref).get()
        ClientDirector.execute(client,
            async (director) => {
                style.pushMaterial(director, data.id, Material.fromJson(await getArchitect().server.request('materials/default', { addColors: !style.isAbstract })))
            },
            async (director) => style.deleteMaterial(director, data.id)
        )
    })
    onMessage.set('data-pack/styles/edit-material', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const undoChanges = style.materialUndoChanges(data.id, data.changes)
        ClientDirector.execute(client,
            async (director) => style.editMaterial(director, data.id, data.changes),
            async (director) => style.editMaterial(director, data.id, undoChanges)
        )
    })
    onMessage.set('data-pack/styles/delete-material', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const material = style.getMaterial(data.id)
        ClientDirector.execute(client,
            async (director) => style.deleteMaterial(director, data.id),
            async (director) => style.pushMaterial(director, data.id, material)
        )
    })
    onMessage.set('data-pack/styles/get-material', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        const material = style.getMaterial(data.id)
        client.respond(id, {
            type: material.type,
            paints: material.paints
        })
    })

    onMessage.set('data-pack/styles/add-paint', async (data, client) => {
        const style = new StyleReference(data.ref).get()
        const material = style.getMaterial(data.material)
        const paint: Paint = await getArchitect().server.request('materials/default-paint')
        data.id = data.id ?? paint.id
        const index = material.paints.list.length
        ClientDirector.execute(client,
            async (director) => {
                material.pushMaterial(data.id, { additional: paint.additional })
                style.updateMaterial(director, data.material)
            },
            async (director) => {
                material.deleteMaterial(index)
                style.updateMaterial(director, data.material)
            }
        )
    })
    onMessage.set('data-pack/styles/edit-paint', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const material = style.getMaterial(data.material)
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
    })
    onMessage.set('data-pack/styles/delete-paint', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const material = style.getMaterial(data.material)
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