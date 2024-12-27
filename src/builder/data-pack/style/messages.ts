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

import { ClientDirector } from "../../../connection/director.js"
import { ServerOnMessage } from "../../../connection/server.js"
import { project } from "../../../project.js"
import { Size3D } from "../../../world/world3D.js"
import { BasicMaterialPattern } from "./materials.js"
import { Style, StyleReference } from "./style.js"

export function registerStyleMessages(onMessage: ServerOnMessage) {
    onMessage.set('data-pack/styles/create', (data, client, id) => {
        const style = new Style(new StyleReference(data.ref), data.abstract ?? false)
        project.dataPack.builders.styles.set(style.reference.location, style)
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
            patterns: style.mapPatterns((pattern, id) => {
                return { id: id, type: pattern.type, fromImplementations: style.implementationsOfPattern(id).map((ref) => ref.toString()) }
            })
        })
    })
    onMessage.set('data-pack/styles/generate-pattern', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        client.respond(id, style.getPattern(data.pattern).generate(Size3D.fromJson(data.size)))
    })

    onMessage.set('data-pack/styles/possible-implementations', (data, client, id) => {
        const style = new StyleReference(data.ref).get()

        let implementations: any[] = []
        project.dataPack.builders.styles.forEach((pStyle) => {
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

    onMessage.set('data-pack/styles/create-pattern', (data, client) => {
        const style = new StyleReference(data.ref).get()
        ClientDirector.execute(client,
            async (director) => {
                const pattern = new BasicMaterialPattern([])
                if (!style.isAbstract) {
                    pattern.pushMaterial((await project.architect.server.request('data-pack/materials/default')).id)
                }
                style.pushPattern(director, data.id, pattern)
            },
            async (director) => style.deletePattern(director, data.id)
        )
    })
    onMessage.set('data-pack/styles/edit-pattern', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const undoChanges = style.patternUndoChanges(data.id, data.changes)
        ClientDirector.execute(client,
            async (director) => style.editPattern(director, data.id, data.changes),
            async (director) => style.editPattern(director, data.id, undoChanges)
        )
    })
    onMessage.set('data-pack/styles/delete-pattern', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.id)
        ClientDirector.execute(client,
            async (director) => style.deletePattern(director, data.id),
            async (director) => style.pushPattern(director, data.id, pattern)
        )
    })
    onMessage.set('data-pack/styles/get-pattern', (data, client, id) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.id)
        client.respond(id, {
            type: pattern.type,
            materials: pattern.materials
        })
    })

    onMessage.set('data-pack/styles/add-material', async (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.pattern)
        data.id = data.id ?? (await project.architect.server.request('data-pack/materials/default')).id
        const index = pattern.materials.length
        ClientDirector.execute(client,
            async (director) => {
                pattern.pushMaterial(data.id)
                style.updateMaterial(director, data.pattern)
            },
            async (director) => {
                pattern.deleteMaterial(index)
                style.updateMaterial(director, data.pattern)
            }
        )
    })
    onMessage.set('data-pack/styles/edit-material', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.pattern)
        const material = pattern.copyMaterial(data.index)
        ClientDirector.execute(client,
            async (director) => {
                pattern.editMaterial(data.index, data.changes)
                style.updateMaterial(director, data.pattern)
            },
            async (director) => {
                pattern.materials[data.index] = material
                style.updateMaterial(director, data.pattern)
            }
        )
    })
    onMessage.set('data-pack/styles/delete-material', (data, client) => {
        const style = new StyleReference(data.ref).get()
        const pattern = style.getPattern(data.pattern)
        const material = pattern.materials[data.index]
        ClientDirector.execute(client,
            async (director) => {
                pattern.deleteMaterial(data.index)
                style.updateMaterial(director, data.pattern)
            },
            async (director) => {
                pattern.materials.push(material)
                style.updateMaterial(director, data.pattern)
            }
        )
    })
}