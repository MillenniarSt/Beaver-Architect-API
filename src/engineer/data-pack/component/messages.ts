//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ClientDirector } from "../../../connection/director.js";
import { PERMISSIONS } from "../../../connection/permission.js";
import { type MessageFunction, type ServerOnMessage } from "../../../connection/server.js";
import type { ClientSide } from "../../../connection/sides.js";
import { getAllProjects, getProject } from "../../../instance.js";
import { GeoRegistry } from "../../../register/geo.js";
import { RANDOM_TYPES } from "../../../register/random.js";
import { joinBiLists } from "../../../util/util.js";
import { GeneralObject3 } from "../../../world/geo/object.js";
import { AbstractStyleRule, DefinedStyleRule } from "../style/rule.js";
import { Component, ComponentReference } from "./component.js";

/**
 * Sum up messages paths and their data types required
 */
type MessagesStructure = {
    'create': MessageFunction<ClientSide, { ref: string }>
    'delete': MessageFunction<ClientSide, { ref: string }>

    'get-all': MessageFunction<ClientSide, { project?: string }>
    'get': MessageFunction<ClientSide, { ref: string }>
    'exists': MessageFunction<ClientSide, { ref: string }>

    'get-rule': MessageFunction<ClientSide, { ref: string, id: string }>
    'create-rule': MessageFunction<ClientSide, { ref: string, id: string, type: string, isAbstract?: boolean }>
    'delete-rule': MessageFunction<ClientSide, { ref: string, id: string }>
    'rename-rule': MessageFunction<ClientSide, { ref: string, id: string, newId: string }>
    'edit-rule': MessageFunction<ClientSide, { ref: string, id: string, changes: ComponentRuleChanges }>
    'edit-rule-random': MessageFunction<ClientSide, { ref: string, id: string, data: any }>
}

export type ComponentRuleChanges = { isAbstract?: boolean, type?: string, fixed?: boolean, random?: string }

export function registerComponentMessages(onMessage: ServerOnMessage) {
    Object.entries(componentMessages()).forEach(([key, f]) => onMessage.set(`data-pack/component/${key}`, f))
}

/**
 * Starts with 'data-pack/component/...'
*/
function componentMessages(): MessagesStructure {
    return {
        'create': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.MANAGE_STRUCTURE_ENGINEER)
            const component = new Component(new ComponentReference(data.ref), GeoRegistry.RECT2)
            ClientDirector.execute(client,
                async (director) => Component.create(director, component),
                async (director) => component.delete(director)
            )
        },
        'delete': simpleEdit(
            async (director, component) => component.delete(director),
            async (director, component) => Component.create(director, component)
        ),

        'get-all': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
            const projects = data.project ? [getProject(data.project)] : getAllProjects()
            client.respond(id, joinBiLists(projects.map((project) => Array.from(project.dataPack.components.values()))).map((component) => component.reference.toJson()))
        },
        'get': read((component, data, client, id) => {
            client.respond(id, {
                baseGeo: component.baseGeo.id,
                structure: component.getStructure().toJson(),
                parameters: component.parameters.toJson(),
                builder: component.builder.toJson()
            })
        }),
        'exists': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
            client.respond(id, new ComponentReference(data.ref).exists())
        },

        'get-rule': read((component, data, client, id) => {
            const rule = component.getRule(data.id)
            client.respond(id, {
                type: rule.type,
                fixed: rule.fixed,
                random: rule.random?.toJson()
            })
        }),
        'create-rule': simpleEdit(
            async (director, component, data) => {
                const type = RANDOM_TYPES.get(data.type)
                component.pushRule(director, data.id, data.isAbstract === false ?
                    new DefinedStyleRule(type, type.constant.generate()) :
                    new AbstractStyleRule(type)
                )
            },
            async (director, component, result, data) => component.deleteRule(director, data.id)
        ),
        'delete-rule': simpleEdit(
            async (director, component, data) => component.deleteRule(director, data.id),
            async (director, component, result, data) => component.pushRule(director, data.id, result)
        ),
        'rename-rule': simpleEdit(
            async (director, component, data) => component.renameRule(director, data.id, data.newId),
            async (director, component, result, data) => component.renameRule(director, data.newId, data.id)
        ),
        'edit-rule': simpleEdit(
            async (director, component, data) => {
                const rule = component.getRule(data.id)
                return {
                    changes: component.editRule(director, data.id, data.changes),
                    randomData: rule.random?.toJson()
                }
            },
            async (director, component, result, data) => {
                component.editRule(director, data.id, result.changes)
                if (result.randomData) {
                    component.editRuleRandom(director, data.id, result.randomData)
                }
            }
        ),
        'edit-rule-random': simpleEdit(
            async (director, component, data) => component.editRuleRandom(director, data.id, data.data),
            async (director, component, result, data) => component.editRuleRandom(director, data.id, result)
        )
    }
}

function simpleEdit<D extends { ref: string }, R>(
    exe: (director: ClientDirector, structure: Component, data: D, client: ClientSide) => Promise<R>,
    undo: (director: ClientDirector, structure: Component, result: R, data: D, client: ClientSide) => Promise<any>
): MessageFunction<ClientSide, D> {
    return (data, client) => {
        client.ensurePermission(PERMISSIONS.MANAGE_COMPONENT)
        const structure = getStructure(data)
        ClientDirector.execute(client,
            (director) => exe(director, structure, data, client),
            (director, result) => undo(director, structure, result, data, client)
        )
    }
}

function edit<D extends { ref: string }>(f: (structure: Component, data: D, client: ClientSide, id: string | undefined) => any): MessageFunction<ClientSide, D> {
    return (data, client, id) => {
        client.ensurePermission(PERMISSIONS.MANAGE_COMPONENT)
        f(getStructure(data), data, client, id)
    }
}

function read<D extends { ref: string }>(f: (structure: Component, data: D, client: ClientSide, id: string | undefined) => any): MessageFunction<ClientSide, D> {
    return (data, client, id) => {
        client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
        f(getStructure(data), data, client, id)
    }
}

function getStructure(data: { ref: string }): Component {
    return new ComponentReference(data.ref).get()
}