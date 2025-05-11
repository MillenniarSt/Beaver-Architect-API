//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { EmptyBuilder } from "../../../builder/generic/empty.js";
import { ClientDirector } from "../../../connection/director.js";
import { PERMISSIONS } from "../../../connection/permission.js";
import { type MessageFunction, type ServerOnMessage } from "../../../connection/server.js";
import type { ClientSide } from "../../../connection/sides.js";
import { getAllProjects, getProject } from "../../../instance.js";
import { joinBiLists } from "../../../util/util.js";
import { StructureEngineer, StructureReference } from "./structure.js";

/**
 * Sum up messages paths and their data types required
 */
type MessagesStructure = {
    'create': MessageFunction<ClientSide, { ref: string }>
    'delete': MessageFunction<ClientSide, { ref: string }>

    'get-all': MessageFunction<ClientSide, { project?: string }>
    'get': MessageFunction<ClientSide, { ref: string }>
    'exists': MessageFunction<ClientSide, { ref: string }>
}

export function registerEnStructureMessages(onMessage: ServerOnMessage) {
    Object.entries(structureMessages()).forEach(([key, f]) => onMessage.set(`data-pack/structure/${key}`, f))
}

/**
 * Starts with 'data-pack/structure/...'
*/
function structureMessages(): MessagesStructure {
    return {
        'create': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.MANAGE_STRUCTURE_ENGINEER)
            const structure = new StructureEngineer(new StructureReference(data.ref), EmptyBuilder.VOID)
            ClientDirector.execute(client,
                async (director) => StructureEngineer.create(director, structure),
                async (director) => structure.delete(director)
            )
        },
        'delete': simpleEdit(
            async (director, structure) => structure.delete(director),
            async (director, structure) => StructureEngineer.create(director, structure)
        ),

        'get-all': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
            const projects = data.project ? [getProject(data.project)] : getAllProjects()
            client.respond(id, joinBiLists(projects.map((project) => Array.from(project.dataPack.structures.values()))).map((structure) => structure.reference.toJson()))
        },
        'get': read((structure, data, client, id) => {
            client.respond(id, {
                builder: structure.builder.toJson()
            })
        }),
        'exists': (data, client, id) => {
            client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
            client.respond(id, new StructureReference(data.ref).exists())
        },
    }
}

function simpleEdit<D extends { ref: string }, R>(
    exe: (director: ClientDirector, structure: StructureEngineer, data: D, client: ClientSide) => Promise<R>,
    undo: (director: ClientDirector, structure: StructureEngineer, result: R, data: D, client: ClientSide) => Promise<any>
): MessageFunction<ClientSide, D> {
    return (data, client) => {
        client.ensurePermission(PERMISSIONS.MANAGE_STRUCTURE_ENGINEER)
        const structure = getStructure(data)
        ClientDirector.execute(client,
            (director) => exe(director, structure, data, client),
            (director, result) => undo(director, structure, result, data, client)
        )
    }
}

function edit<D extends { ref: string }>(f: (structure: StructureEngineer, data: D, client: ClientSide, id: string | undefined) => any): MessageFunction<ClientSide, D> {
    return (data, client, id) => {
        client.ensurePermission(PERMISSIONS.MANAGE_STRUCTURE_ENGINEER)
        f(getStructure(data), data, client, id)
    }
}

function read<D extends { ref: string }>(f: (structure: StructureEngineer, data: D, client: ClientSide, id: string | undefined) => any): MessageFunction<ClientSide, D> {
    return (data, client, id) => {
        client.ensurePermission(PERMISSIONS.ACCESS_DATAPACK)
        f(getStructure(data), data, client, id)
    }
}

function getStructure(data: { ref: string }): StructureEngineer {
    return new StructureReference(data.ref).get()
}