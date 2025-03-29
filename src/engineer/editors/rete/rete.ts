import { v4 } from "uuid";
import { Vec2 } from "../../../world/vector.js";
import { Editor } from "../../editor.js";
import { Engineer } from "../../engineer.js";
import { type Equals, itemsOfMap, type ToJson, type ToKey } from "../../../util/util.js";
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

export class Connection<Parent extends ReteSocket = ReteSocket, Child extends ReteSocket = ReteSocket> implements ToJson, ToKey {

    constructor(
        readonly parent: Parent,
        readonly child: Child
    ) { }

    static fromJson<Parent extends ReteSocket = ReteSocket, Child extends ReteSocket = ReteSocket>(json: any, parentFromJson: (json: any) => Parent, childFromJson: (json: any) => Child): Connection<Parent, Child> {
        return new Connection(parentFromJson(json.parent), childFromJson(json.child))
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
        const connections: Connection<Parent, Child>[] =  json.map((connection: any) => Connection.fromJson(connection, parentFromJson, childFromJson))
        return new MappedConnections(new Map(connections.map((connection) => [connection.child.toKey(), connection.parent])), new Map(connections.map((connection) => [connection.parent.toKey(), connection.child])))
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

    hasConnection(connection: Connection<Parent, Child>): boolean {
        return this.getByParent(connection.parent)?.equals(connection.child) ?? false
    }

    has(parent: Parent, child: Child): boolean {
        return this.getByParent(parent)?.equals(child) ?? false
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

    removeConnection(connection: Connection<Parent, Child>): Connection<Parent, Child> | undefined {
        return this.remove(connection.parent, connection.child)
    }

    remove(parent: Parent, child: Child): Connection<Parent, Child> | undefined {
        if(this.has(parent, child)) {
            return this.removeByParent(parent)
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