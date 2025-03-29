import { ClientDirector } from "../../../../../connection/director.js";
import { InternalServerError } from "../../../../../connection/errors.js";
import { type MessageFunction } from "../../../../../connection/server.js";
import { ClientSide } from "../../../../../connection/sides.js";
import { Vec2 } from "../../../../../world/vector.js";
import { BuilderReteNode, getBuilderReteType } from "../../../../editors/rete/nodes/builder.js";
import { Connection, ReteSocket } from "../../../../editors/rete/rete.js";
import { ReteMultiplePortSocket } from "../../../../editors/rete/sockets/base.js";
import { StructureReference } from "../../structure.js";
import { StructureReteEditor } from "./editor.js";

/**
 * Sum up messages paths and their data types required
 */
type MessagesStructure = {
    'open': MessageFunction<ClientSide, { ref: string }>
    'close': MessageFunction<ClientSide, { ref: string }>
    'get': MessageFunction<ClientSide, { ref: string }>

    'base/connect-builder': MessageFunction<ClientSide, { ref: string, id: string | null }>

    'builder/push': MessageFunction<ClientSide, { ref: string, type: string, pos: Vec2 }>
    'builder/remove': MessageFunction<ClientSide, { ref: string, id: string }>
    'builder/connect': MessageFunction<ClientSide, { ref: string, parent: any, child: any }>
    'builder/disconnect': MessageFunction<ClientSide, { ref: string, parent: any, child: any }>
}

/**
 * Starts with 'data-pack/structures$rete/...'
*/
export function reteEngineerStructureMessages(): MessagesStructure {
    return {
        'open': (data: { ref: string }, client, id) => {
            const editor = client.openEditor(new StructureReference(data.ref), StructureReteEditor.extension) as StructureReteEditor
            client.respond(id, editor.toClient())
        },
        'close': (data, client, id) => {
            client.closeEditor(new StructureReference(data.ref), StructureReteEditor.extension)
        },
        'get': (data, client, id) => {
            client.respond(id, getEditor(client, data).toClient())
        },

        'base/connect-builder': simpleEdit(
            async (director, editor, data) => {
                const socketId = editor.baseConnection?.id ?? null
                editor.connectBaseBuilder(director, data.id)
                return socketId
            },
            async (director, editor, result) => editor.connectBaseBuilder(director, result)
        ),

        'builder/push': simpleEdit(
            async (director, editor, data) => {
                const type = getBuilderReteType(data.type)
                if (!type) {
                    throw new InternalServerError(`Can not add builder: type '${data.type}' does not exist`)
                }
                const builder = new BuilderReteNode(type, Vec2.fromJson(data.pos))
                editor.pushBuilder(director, builder)
                return builder.id
            },
            async (director, editor, result) => editor.removeBuilder(director, result)
        ),
        'builder/remove': simpleEdit(
            async (director, editor, data) => editor.removeBuilder(director, data.id),
            async (director, editor, result) => {
                editor.pushBuilder(director, result.builder)
                if (result.connections.base) {
                    editor.connectBaseBuilder(director, result.connections.base.id)
                }
                result.connections.builders.forEach((connection) => editor.connectBuilders(director, connection))
            }
        ),
        'builder/connect': simpleEdit(
            async (director, editor, data) => {
                const connection = new Connection(ReteMultiplePortSocket.fromJson(data.parent), ReteSocket.fromJson(data.child))
                editor.connectBuilders(director, connection)
                return connection
            },
            async (director, editor, result) => editor.disconnectBuilders(director, result)
        ),
        'builder/disconnect': simpleEdit(
            async (director, editor, data) => {
                const connection = new Connection(ReteMultiplePortSocket.fromJson(data.parent), ReteSocket.fromJson(data.child))
                editor.disconnectBuilders(director, connection)
                return connection
            },
            async (director, editor, result) => editor.connectBuilders(director, result)
        ),
    }
}

function simpleEdit<D extends { ref: string }, R>(
    exe: (director: ClientDirector, editor: StructureReteEditor, data: D, client: ClientSide) => Promise<R>,
    undo: (director: ClientDirector, editor: StructureReteEditor, result: R, data: D, client: ClientSide) => Promise<any>
): MessageFunction<ClientSide, D> {
    return (data, client) => {
        const editor = getEditor(client, data)
        ClientDirector.execute(client,
            (director) => exe(director, editor, data, client),
            (director, result) => undo(director, editor, result, data, client)
        )
    }
}

function edit<D extends { ref: string }>(f: (editor: StructureReteEditor, data: D, client: ClientSide, id: string | undefined) => any): MessageFunction<ClientSide, D> {
    return (data, client, id) => f(getEditor(client, data), data, client, id)
}

function getEditor(client: ClientSide, data: { ref: string }): StructureReteEditor {
    return client.getEditor(new StructureReference(data.ref), StructureReteEditor.extension) as StructureReteEditor
}