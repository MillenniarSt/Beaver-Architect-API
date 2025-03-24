import { ClientDirector } from "../../../../connection/director.js";
import { InternalServerError, InternalServerWarn } from "../../../../connection/errors.js";
import { MessageFunction } from "../../../../connection/server.js";
import { ClientSide } from "../../../../connection/sides.js";
import { Vec2 } from "../../../../world/vector.js";
import { BuilderReteNode, getBuilderReteType } from "../../../editors/rete/nodes/builder.js";
import { Connection, RetePortSocket, ReteSocket } from "../../../editors/rete/rete.js";
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

        'base/connect-builder': (data, client, id) => {
            const editor = getEditor(client, data)
            const socketId = editor.baseConnection?.id ?? null
            ClientDirector.execute(client,
                async (director) => editor.connectBaseBuilder(director, data.id),
                async (director) => editor.connectBaseBuilder(director, socketId)
            )
        },

        'builder/push': (data, client, id) => {
            const editor = getEditor(client, data)
            const type = getBuilderReteType(data.type)
            if (type) {
                const builder = new BuilderReteNode(type, Vec2.fromJson(data.pos))
                ClientDirector.execute(client,
                    async (director) => editor.pushBuilder(director, builder),
                    async (director) => editor.removeBuilder(director, builder.id)
                )
            } else {
                throw new InternalServerError(`Can not add builder: type '${data.type}' does not exist`)
            }
        },
        'builder/remove': (data, client, id) => {
            const editor = getEditor(client, data)
            ClientDirector.execute(client,
                async (director) => editor.removeBuilder(director, data.id),
                async (director, data) => {
                    editor.pushBuilder(director, data.builder)
                    if (data.connections.base) {
                        editor.connectBaseBuilder(director, data.connections.base.id)
                    }
                    data.connections.builders.forEach((connection) => editor.connectBuilders(director, connection))
                }
            )
        },
        'builder/connect': (data, client, id) => {
            const editor = getEditor(client, data)
            ClientDirector.execute(client,
                async (director) => editor.connectBuilders(director, new Connection(RetePortSocket.fromJson(data.parent), ReteSocket.fromJson(data.child))),
                async (director) => editor.disconnectBuilders(director, new Connection(RetePortSocket.fromJson(data.parent), ReteSocket.fromJson(data.child)))
            )
        },
        'builder/disconnect': (data, client, id) => {
            const editor = getEditor(client, data)
            ClientDirector.execute(client,
                async (director) => editor.disconnectBuilders(director, new Connection(RetePortSocket.fromJson(data.parent), ReteSocket.fromJson(data.child))),
                async (director) => editor.connectBuilders(director, new Connection(RetePortSocket.fromJson(data.parent), ReteSocket.fromJson(data.child)))
            )
        }
    }
}

function getEditor(client: ClientSide, data: { ref: string }): StructureReteEditor {
    return client.getEditor(new StructureReference(data.ref), StructureReteEditor.extension) as StructureReteEditor
}