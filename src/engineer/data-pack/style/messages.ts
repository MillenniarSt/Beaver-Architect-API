//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Seed } from "../../../builder/random/random.js"
import { ClientDirector } from "../../../connection/director.js"
import { InternalServerError, ServerProblem } from "../../../connection/errors.js"
import { PERMISSIONS } from "../../../connection/permission.js"
import { type MessageFunction, type ServerOnMessage } from "../../../connection/server.js"
import type { ClientSide } from "../../../connection/sides.js"
import { getAllProjects, getProject } from "../../../instance.js"
import { RANDOM_TYPES } from "../../../register/random.js"
import { ensureJson, joinBiLists } from "../../../util/util.js"
import { AbstractStyleRule, DefinedStyleRule } from "./rule.js"
import { Style, StyleReference, type StyleChanges } from "./style.js"

/**
 * Sum up messages paths and their data types required
 */
type MessagesStructure = {
    'create': MessageFunction<ClientSide, { ref: string, abstract?: boolean }>
    'delete': MessageFunction<ClientSide, { ref: string }>

    'get-all': MessageFunction<ClientSide, { project?: string }>
    'get': MessageFunction<ClientSide, { ref: string }>
    'exists': MessageFunction<ClientSide, { ref: string }>
    'possible-implementations': MessageFunction<ClientSide, { ref: string, research: string }>

    'edit': MessageFunction<ClientSide, { ref: string, changes: StyleChanges }>

    'push-implementation': MessageFunction<ClientSide, { ref: string, implementation: string }>
    'delete-implementation': MessageFunction<ClientSide, { ref: string, implementation: string }>

    'get-rule': MessageFunction<ClientSide, { ref: string, id: string }>
    'create-rule': MessageFunction<ClientSide, { ref: string, id: string, type: string, isAbstract?: boolean }>
    'delete-rule': MessageFunction<ClientSide, { ref: string, id: string }>
    'rename-rule': MessageFunction<ClientSide, { ref: string, id: string, newId: string }>
    'edit-rule': MessageFunction<ClientSide, { ref: string, id: string, changes: StyleRuleChanges }>
    'edit-rule-random': MessageFunction<ClientSide, { ref: string, id: string, data: any }>
    'evaluate-rule': MessageFunction<ClientSide, { ref: string, id: string, count?: number, seed?: number }>
}

export type StyleRuleChanges = { isAbstract?: boolean, type?: string, fixed?: boolean, random?: string }

export function registerStyleMessages(onMessage: ServerOnMessage) {
    Object.entries(styleMessages()).forEach(([key, f]) => onMessage.set(`data-pack/style/${key}`, f))
}

/**
 * Starts with 'data-pack/style/...'
*/
function styleMessages(): MessagesStructure {
    return {
        'create': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.MANAGE_STYLE)
            const style = new Style(new StyleReference(data.ref), data.abstract ?? false)
            ClientDirector.execute(client,
                async (director) => Style.create(director, style),
                async (director) => style.delete(director)
            )
        },
        'delete': simpleEdit(
            async (director, style) => style.delete(director),
            async (director, style) => Style.create(director, style)
        ),

        'get-all': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
            const projects = data.project ? [getProject(data.project)] : getAllProjects()
            client.respond(id, joinBiLists(projects.map((project) => Array.from(project.dataPack.styles.values()))).map((style) => style.reference.toJson()))
        },
        'get': read((style, data, client, id) => {
            client.respond(id, {
                isAbstract: style.isAbstract,
                implementations: style.implementations.map((implementation) => implementation.toJson()),
                rules: Object.fromEntries(style.rules.getAll().map(([id, rule]) => {
                    return [id, { type: rule.type.id, random: rule.random?.toJson(), fixed: rule.fixed, fromImplementations: style.implementationsOfRule(id).map((ref) => ref.toString()) }]
                }))
            })
        }),
        'exists': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
            client.respond(id, new StyleReference(data.ref).exists())
        },
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

        'get-rule': read((style, data, client, id) => {
            const rule = style.getRule(data.id)
            client.respond(id, {
                type: rule.type.id,
                fixed: rule.fixed,
                random: rule.random?.toJson(),
                fromImplementations: style.implementationsOfRule(data.id).map((ref) => ref.toJson())
            })
        }),
        'create-rule': simpleEdit(
            async (director, style, data) => {
                const type = RANDOM_TYPES.get(data.type)
                style.pushRule(director, data.id, data.isAbstract && style.isAbstract ?
                    new AbstractStyleRule(type) :
                    new DefinedStyleRule(type, type.constant.generate(type.defaultValue)))
            },
            async (director, style, result, data) => style.deleteRule(director, data.id)
        ),
        'delete-rule': simpleEdit(
            async (director, style, data) => style.deleteRule(director, data.id),
            async (director, style, result, data) => style.pushRule(director, data.id, result)
        ),
        'rename-rule': simpleEdit(
            async (director, style, data) => style.renameRule(director, data.id, data.newId),
            async (director, style, result, data) => style.renameRule(director, data.newId, data.id)
        ),
        'edit-rule': simpleEdit(
            async (director, style, data) => {
                const rule = style.getRule(data.id)
                return {
                    changes: style.editRule(director, data.id, data.changes),
                    randomData: rule.random?.toJson()
                }
            },
            async (director, style, result, data) => {
                style.editRule(director, data.id, result.changes)
                if(result.randomData) {
                    style.editRuleRandom(director, data.id, result.randomData)
                }
            }
        ),
        'edit-rule-random': simpleEdit(
            async (director, style, data) => style.editRuleRandom(director, data.id, data.data),
            async (director, style, result, data) => style.editRuleRandom(director, data.id, result)
        ),
        'evaluate-rule': read((style, data, side, id) => {
            const rule = style.getRule(data.id)
            if(rule instanceof DefinedStyleRule) {
                const seed = new Seed(data.seed)
                let values: any[] = []
                for(let i = 0; i < (data.count ?? 1); i++) {
                    values.push(ensureJson(rule.random.seeded(seed)))
                }
                side.respond(id, values)
            } else {
                throw new InternalServerError(`Can not evaluate an abstract rule [${data.id}]`).warn()
            }
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