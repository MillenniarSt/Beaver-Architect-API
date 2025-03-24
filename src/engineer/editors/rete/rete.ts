import { v4 } from "uuid";
import { Vec2 } from "../../../world/vector.js";
import { Editor } from "../../editor.js";
import { Engineer } from "../../engineer.js";
import { Equals, itemsOfMap, mapFromJson, mapToJson, ToJson, ToKey } from "../../../util/util.js";
import { InternalServerError } from "../../../connection/errors.js";

export abstract class ReteEditor<E extends Engineer> extends Editor<E> {

    abstract toClient(): {}
}

export type ReteNodeUpdate = {
    pos?: [number, number]
}

export abstract class ReteNode implements ToJson {

    constructor(
        public pos: Vec2,
        readonly id: string = v4()
    ) { }

    abstract toJson(): {}

    toClient(): {} {
        return this.toJson()
    }
}

export class ReteSocket implements ToJson, ToKey, Equals {

    static readonly UNDEFINED = new ReteSocket('undefined')

    constructor(
        readonly id: string
    ) { }

    static fromJson(json: any): ReteSocket {
        return new ReteSocket(json)
    }

    equals(other: ReteSocket): boolean {
        return this.id === other.id
    }

    toKey(): string {
        return this.id
    }

    toJson(): {} {
        return this.toKey()
    }
}

export class RetePortSocket extends ReteSocket {

    static readonly UNDEFINED = new RetePortSocket('undefined', 'undefined')

    constructor(
        id: string,
        readonly port: string
    ) {
        super(id)
    }

    static fromJson(json: any): RetePortSocket {
        const key = json.split('#')
        return new RetePortSocket(key[0], key[1])
    }

    equals(other: RetePortSocket): boolean {
        return this.id === other.id && this.port === other.port
    }

    toKey(): string {
        return `${this.id}#${this.port}`
    }
}

export class Connection<Parent extends ReteSocket = ReteSocket, Child extends ReteSocket = ReteSocket> implements ToJson, ToKey {

    constructor(
        readonly parent: Parent,
        readonly child: Child
    ) { }

    static fromJson(json: any): Connection {
        return new Connection(json.parent, json.child)
    }

    toKey(): string {
        return `${this.parent.toKey()}$${this.child.toKey()}`
    }

    toJson() {
        return {
            parent: this.parent.toJson(),
            child: this.child.toJson()
        }
    }
}

export class MappedConnections<Parent extends ReteSocket = ReteSocket, Child extends ReteSocket = ReteSocket> implements ToJson {

    protected constructor(
        protected readonly parents: Map<string, Parent>,
        protected readonly children: Map<string, Child>
    ) { }

    static empty<Parent extends ReteSocket = ReteSocket, Child extends ReteSocket = ReteSocket>(): MappedConnections<Parent, Child> {
        return new MappedConnections(new Map(), new Map())
    }

    static unsafe<Parent extends ReteSocket = ReteSocket, Child extends ReteSocket = ReteSocket>(parents: Map<string, Parent>, children: Map<string, Child>): MappedConnections<Parent, Child> {
        return new MappedConnections(parents, children)
    }

    static fromJson<Parent extends ReteSocket = ReteSocket, Child extends ReteSocket = ReteSocket>(json: any, parentFromJson: (json: any) => Parent, childFromJson: (json: any) => Child): MappedConnections<Parent, Child> {
        return new MappedConnections(mapFromJson(json, (connection) => parentFromJson(connection.parent)), mapFromJson(json, (connection) => childFromJson(connection.child)))
    }

    getAll(): Connection<Parent, Child>[] {
        return this.getAllParents().map((parent) => new Connection(parent, this.getByParent(parent)!))
    }

    getAllParents(): Parent[] {
        return itemsOfMap(this.parents)
    }

    getAllChildren(): Child[] {
        return itemsOfMap(this.children)
    }

    getByParent(parent: Parent): Child | undefined {
        return this.children.get(parent.toKey())
    }

    getByChild(child: Child): Parent | undefined {
        return this.parents.get(child.toKey())
    }

    has(connection: Connection<Parent, Child>): boolean {
        return this.hasParent(connection.parent) && this.hasChild(connection.child)
    }

    hasParent(parent: Parent): boolean {
        return this.parents.has(parent.toKey())
    }

    hasChild(child: Child): boolean {
        return this.children.has(child.toKey())
    }

    pushConnection(connection: Connection<Parent, Child>) {
        this.push(connection.parent, connection.child)
    }

    push(parent: Parent, child: Child) {
        this.parents.set(child.toKey(), parent)
        this.children.set(parent.toKey(), child)
    }

    remove(connection: Connection<Parent, Child>): Connection<Parent, Child> | undefined {
        if(this.getByParent(connection.parent)?.equals(connection.child)) {
            return this.removeByParent(connection.parent)
        }
    }

    removeByParent(parent: Parent): Connection<Parent, Child> | undefined {
        const child = this.getByParent(parent)
        if(child) {
            this.parents.delete(child.toKey())
            this.children.delete(parent.toKey())

            return new Connection(parent, child)
        }
    }

    removeByChild(child: Child): Connection<Parent, Child> | undefined {
        const parent = this.getByChild(child)
        if(parent) {
            this.parents.delete(child.toKey())
            this.children.delete(parent.toKey())

            return new Connection(parent, child)
        }
    }

    toJson() {
        return this.getAll().map((connection) => connection.toJson())
    }
}

export class ConnectionNotExists extends InternalServerError {

    constructor(readonly connection: Connection, groupA: string, groupB: string) {
        super(`Connection does not exists between ${groupA} and ${groupB}`)
    }
}