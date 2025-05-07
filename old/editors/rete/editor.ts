//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ClientDirector } from "../../../../../connection/director.js";
import { Connection, ConnectionNotExists, MappedConnections, ReteEditor, ReteSocket } from "../../../../editors/rete/rete.js";
import { StructureEngineer } from "../../structure.js";
import { Builder } from "../../../../../builder/builder.js";
import { v4 } from "uuid";
import { Vec2 } from "../../../../../world/vector.js";
import { ClientSide } from "../../../../../connection/sides.js";
import { EditorDirective, ListUpdate, type ListUpdateObject, ObjectUpdate, VarUpdate } from "../../../../../connection/directives/update.js";
import { NamedEditor } from "../../../../../../temp/editor.js";
import { IdAlreadyExists, IdNotExists } from "../../../../../connection/errors.js";
import { type MessageFunction } from "../../../../../connection/server.js";
import { reteEngineerStructureMessages } from "./messages.js";
import { itemsOfMap, mapFromJson, mapToJson } from "../../../../../util/util.js";
import { RandomReteNode, randomReteNodeUpdate, type RandomReteNodeUpdate } from "../../../../editors/rete/nodes/random.js";
import { StructureEngineerReteNode, structureEngineerReteNodeUpdate, type StructureEngineerReteNodeUpdate } from "../../../../editors/rete/nodes/engineer.js";
import { BuilderReteNode, builderReteNodeUpdate, type BuilderReteNodeUpdate, getBuilderReteType, IncompatibleReteBuilderTypes } from "../../../../editors/rete/nodes/builder.js";
import { ReteMultiplePortSocket, ReteMultipleSocket, RetePortSocket } from "../../../../editors/rete/sockets/base.js";
import { Option } from "../../../../../builder/option.js";

export type StructureReteEditorUpdate = {
    base?: StructureEngineerReteNodeUpdate
    builders?: ListUpdateObject<BuilderReteNodeUpdate>[]
    randoms?: ListUpdateObject<RandomReteNodeUpdate>[]

    baseConnection?: string | null
    builderConnections?: ListUpdateObject<{ parent: {}, child: {} }>[]
    optionConnections?: ListUpdateObject<{ parent: {}, child: {} }>[]
}

export const structureReteEditorUpdate = new ObjectUpdate<StructureReteEditorUpdate>({
    base: structureEngineerReteNodeUpdate,
    builders: new ListUpdate(builderReteNodeUpdate),
    randoms: new ListUpdate(randomReteNodeUpdate),

    baseConnection: new VarUpdate(),
    builderConnections: new ListUpdate(new VarUpdate()),
    optionConnections: new ListUpdate(new VarUpdate())
})

@NamedEditor()
export class StructureReteEditor extends ReteEditor<StructureEngineer> {

    static extension = 'rete'

    constructor(
        engineer: StructureEngineer,

        readonly base: StructureEngineerReteNode,
        protected readonly builders: Map<string, BuilderReteNode>,
        protected readonly randoms: Map<string, RandomReteNode>,

        protected _baseConnection: ReteSocket | null,
        protected readonly builderConnections: MappedConnections<ReteMultiplePortSocket, ReteSocket>,
        protected readonly optionConnections: MappedConnections<RetePortSocket, ReteMultipleSocket>
    ) {
        super(engineer)
    }

    get baseConnection(): ReteSocket | null {
        return this._baseConnection
    }

    static create(engineer: StructureEngineer): StructureReteEditor {
        let builders: Map<string, BuilderReteNode> = new Map()
        let randoms: Map<string, RandomReteNode> = new Map()
        let builderConnections: MappedConnections<ReteMultiplePortSocket, ReteSocket> = MappedConnections.empty()
        let optionConnections: MappedConnections<RetePortSocket, ReteMultipleSocket> = MappedConnections.empty()

        function recursive(builder: Builder, parent: RetePortSocket | null = null, pos: Vec2 = Vec2.ZERO): string {
            const id = v4()
            const type = getBuilderReteType(builder.type)!

            builders.set(id, new BuilderReteNode(type, pos, id))
            type.options.forEach((option) => {
                const node = new RandomReteNode(builder.options[option.id].getDefined()!, pos.add(new Vec2(50, 30))) // TODO add style compatibility
                randoms.set(node.id, node)
                optionConnections.push(new RetePortSocket(id, option.id), new ReteMultipleSocket(node.id))
            })
            Object.entries(type.outputs).forEach(([port, output], i) => output.getChildren(builder).forEach((child, j) => {
                const childId = recursive(child, new RetePortSocket(id, port), pos.add(new Vec2(120 * (i + 1), (i * 20) + (j * 100))))
                builderConnections.push(new ReteMultiplePortSocket(id, port, j), new ReteSocket(childId))
            }))

            return id
        }
        const baseBuilder = recursive(engineer.builder)

        return new StructureReteEditor(engineer, new StructureEngineerReteNode(new Vec2(-100, 0)), builders, randoms, new ReteSocket(baseBuilder), builderConnections, optionConnections)
    }

    static fromJson(json: any, engineer: StructureEngineer): StructureReteEditor {
        return new StructureReteEditor(engineer,
            StructureEngineerReteNode.fromJson(json.base),
            mapFromJson(json.builders, BuilderReteNode.fromJson),
            mapFromJson(json.randoms, RandomReteNode.fromJson),
            json.baseConnection ? ReteSocket.fromJson(json.baseConnection) : null,
            MappedConnections.fromJson(json.builderConnections, ReteMultiplePortSocket.fromJson, ReteSocket.fromJson),
            MappedConnections.fromJson(json.optionConnections, RetePortSocket.fromJson, ReteMultipleSocket.fromJson)
        )
    }

    static basePath = 'data-pack/structures'

    static messages(): Record<string, MessageFunction<ClientSide>> {
        return reteEngineerStructureMessages()
    }

    isValid(): boolean {
        return this.baseConnection !== null
    }

    apply(client: ClientSide): void {
        if (!this.isValid()) {
            client.warn('Connect a Builder to the Engineer')
        } else {
            const oldBuilder = this.engineer.builder
            ClientDirector.execute(client,
                async (director) => this.engineer.setBuilder(director, this.createBuilder(this.getBuilder(this.baseConnection!.id))),
                async (director) => this.engineer.setBuilder(director, oldBuilder)
            )
        }
    }

    createBuilder<B extends Builder>(node: BuilderReteNode<B>): B {
        return node.type.get(
            (output) => this.createBuilder(this.getBuilder(this.builderConnections.getByParent(new ReteMultiplePortSocket(node.id, output, 0))!.id)),
            (output) => this.builderConnections.getAllParents().filter((parent) => parent.id === node.id && parent.port === output).map((parent) => this.createBuilder(this.getBuilder(this.builderConnections.getByParent(parent)!.id))),
            (output) => Option.style('TODO')
        )
    }

    pushBuilder(director: ClientDirector, builder: BuilderReteNode) {
        if (this.builders.has(builder.id)) {
            throw new IdAlreadyExists(builder.id, this.constructor.name, 'builders')
        }
        this.builders.set(builder.id, builder)
        this.update(director, {
            builders: [{
                id: builder.id,
                mode: 'push',
                data: builder.toJson()
            }]
        })
    }

    removeBuilder(director: ClientDirector, id: string): {
        builder: BuilderReteNode,
        connections: {
            base: ReteSocket | undefined,
            builders: Connection<ReteMultiplePortSocket, ReteSocket>[]
        }
    } {
        let connectionsDeleted: { base: ReteSocket | undefined, builders: Connection<ReteMultiplePortSocket, ReteSocket>[] } = {
            base: undefined,
            builders: []
        }

        const builder = this.getBuilder(id)

        if (this.baseConnection?.id === id) {
            this.connectBaseBuilder(director, null)
            connectionsDeleted.base = new ReteSocket(id)
        }
        this.builderConnections.getAllParents().filter((c) => c.id === id).forEach((c) => {
            connectionsDeleted.builders.push(this.disconnectBuildersByParent(director, c))
        })
        if(this.builderConnections.hasChild(new ReteSocket(id))) {
            connectionsDeleted.builders.push(this.disconnectBuildersByChild(director, new ReteSocket(id)))
        }

        this.builders.delete(id)
        this.update(director, {
            builders: [{
                id: id,
                mode: 'delete'
            }]
        })

        return {
            builder: builder,
            connections: connectionsDeleted
        }
    }

    connectBaseBuilder(director: ClientDirector, id: string | null) {
        if (id) {
            this.getBuilder(id)
            this._baseConnection = new ReteSocket(id)
        } else {
            this._baseConnection = null
        }
        this.update(director, { baseConnection: id })
    }

    connectBuilders(director: ClientDirector, connection: Connection<ReteMultiplePortSocket, ReteSocket>) {
        const parentNode = this.getBuilder(connection.parent.id)
        const childNode = this.getBuilder(connection.child.id)

        if (!parentNode.isValidChild(connection.parent.port, childNode.type)) {
            throw new IncompatibleReteBuilderTypes(parentNode.type, childNode.type, connection.parent.port)
        }

        if(this.builderConnections.hasChild(connection.child)) {
            this.disconnectBuildersByChild(director, connection.child)
        }
        if (this.builderConnections.hasParent(connection.parent) && parentNode.shouldReplaceChild(connection.parent.port)) {
            this.disconnectBuildersByParent(director, connection.parent)
        }
        this.builderConnections.pushConnection(connection)
        this.update(director, {
            builderConnections: [{
                id: connection.toKey(),
                mode: 'push',
                data: connection.toJson()
            }]
        })
    }

    disconnectBuildersByParent(director: ClientDirector, parent: ReteMultiplePortSocket): Connection<ReteMultiplePortSocket, ReteSocket> {
        const child = this.builderConnections.getByParent(parent)
        if (!child) {
            throw new ConnectionNotExists(new Connection(parent, ReteSocket.UNDEFINED), 'builder', 'builder')
        }
        return this.disconnectBuilders(director, new Connection(parent, child))
    }

    disconnectBuildersByChild(director: ClientDirector, child: ReteSocket): Connection<ReteMultiplePortSocket, ReteSocket> {
        const parent = this.builderConnections.getByChild(child)
        if (!parent) {
            throw new ConnectionNotExists(new Connection(RetePortSocket.UNDEFINED, child), 'builder', 'builder')
        }
        return this.disconnectBuilders(director, new Connection(parent, child))
    }

    disconnectBuilders(director: ClientDirector, connection: Connection<ReteMultiplePortSocket, ReteSocket>): Connection<ReteMultiplePortSocket, ReteSocket> {
        if (!this.builderConnections.removeConnection(connection)) {
            throw new ConnectionNotExists(connection, 'builder', 'builder')
        }
        this.update(director, {
            builderConnections: [{
                id: connection.toKey(),
                mode: 'delete'
            }]
        })
        return connection
    }

    protected update(director: ClientDirector, update: StructureReteEditorUpdate): void {
        director.addDirective(EditorDirective.update(this, structureReteEditorUpdate, update))
    }

    getBuilder(id: string): BuilderReteNode {
        const builder = this.builders.get(id)
        if (builder === undefined) {
            throw new IdNotExists(id, this.constructor.name, 'builders')
        }
        return builder
    }

    getRandom(id: string): RandomReteNode {
        const random = this.randoms.get(id)
        if (random === undefined) {
            throw new IdNotExists(id, this.constructor.name, 'randoms')
        }
        return random
    }

    toClient(): {} {
        return {
            nodes: {
                builders: itemsOfMap(this.builders).map((builder) => builder.toClient()),
                randoms: itemsOfMap(this.randoms).map((random) => random.toClient())
            },
            connections: {
                base: {
                    builder: this.baseConnection?.toJson()
                },
                builders: this.builderConnections.toJson(),
                options: this.optionConnections.toJson()
            }
        }
    }

    toJson(): {} {
        return {
            base: this.base.toJson(),
            builders: mapToJson(this.builders),
            randoms: mapToJson(this.randoms),

            baseConnection: this.baseConnection?.toJson(),
            builderConnections: this.builderConnections.toJson(),
            optionConnections: this.optionConnections.toJson()
        }
    }
}