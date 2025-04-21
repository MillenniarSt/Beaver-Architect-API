//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { RandomType } from "../../../builder/random/type.js"
import { ClientDirector } from "../../../connection/director.js"
import { PERMISSIONS } from "../../../connection/permission.js"
import { type MessageFunction, type ServerOnMessage } from "../../../connection/server.js"
import type { ClientSide } from "../../../connection/sides.js"
import { getAllProjects, getProject } from "../../../instance.js"
import { joinBiLists } from "../../../util/util.js"
import { AbstractStyleRule, DefinedStyleRule, StyleRule } from "./rule.js"
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
    'edit-rule': MessageFunction<ClientSide, { ref: string, id: string, changes: RuleChanges }>
}

export type RuleChanges = { id?: string, isAbstract?: boolean, type?: string, constant?: boolean, random?: string }

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
            client.respond(id, joinBiLists(projects.map((project) => project.dataPack.styles.values().toArray())).map((style) => style.reference.toJson()))
        },
        'get': read((style, data, client, id) => {
            client.respond(id, {
                isAbstract: style.isAbstract,
                implementations: style.implementations.map((implementation) => implementation.toJson()),
                rules: Object.fromEntries(style.rules.getAll().map(([id, rule]) => {
                    return [id, { type: rule.type, constant: rule.constant }]
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
                type: rule.type,
                constant: rule.constant,
                random: rule.random?.toClient()
            })
        }),
        'create-rule': simpleEdit(
            async (director, style, data) => {
                const type = RandomType.get(data.type)
                style.pushRule(director, data.id, data.isAbstract && style.isAbstract ?
                    new AbstractStyleRule(data.type) :
                    new DefinedStyleRule(data.type, type.constant()))
            },
            async (director, style, result, data) => style.deleteRule(director, data.id)
        ),
        'delete-rule': simpleEdit(
            async (director, style, data) => style.deleteRule(director, data.id),
            async (director, style, result, data) => style.pushRule(director, data.id, result)
        ),
        'edit-rule': simpleEdit(
            async (director, style, data) => {
                const changes = data.changes
                const rule = style.getRule(data.id)

                let newRule: StyleRule
                if (changes.isAbstract) {
                    newRule = new AbstractStyleRule(changes.type ?? rule.type, changes.constant ?? rule.constant)
                } else if (!changes.random && (!changes.type || changes.type === rule.type) && rule.random) {
                    newRule = new DefinedStyleRule(changes.type ?? rule.type, rule.random, changes.constant ?? rule.constant)
                } else {
                    const randomType = RandomType.get(changes.type ?? rule.type)
                    newRule = new DefinedStyleRule(changes.type ?? rule.type, changes.random ? randomType.getRandom(changes.random) : randomType.constant(), changes.constant ?? rule.constant)
                }
                style.deleteRule(director, data.id)
                style.pushRule(director, data.changes.id ?? data.id, newRule)

                return rule
            },
            async (director, style, result, data) => {
                style.deleteRule(director, data.changes.id ?? data.id)
                style.pushRule(director, data.id, result)
            }
        )
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