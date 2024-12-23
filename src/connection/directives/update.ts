import { ResourceReference } from "../../builder/builder.js";
import { server } from "../server.js";
import { Directive } from "./directive.js";

export class UpdateDirective<T> extends Directive {

    constructor(
        readonly path: string,
        readonly update: Update<T>,
        protected data?: T
    ) {
        super()
    }

    send() {
        server.sendAll(this.path, this.data)
    }

    async override(directive: UpdateDirective<T>): Promise<void> {
        this.data = await this.update.update(this.data, directive.data)
    }
}

export type BuilderDirectiveValue<T> = {
    ref: ResourceReference<any>
    update?: T
}

export class BuilderDirective<T> extends Directive {

    constructor(
        readonly path: string,
        readonly update: Update<T>,
        readonly builders: BuilderDirectiveValue<T>[]
    ) {
        super()
    }

    static update<T>(path: string, ref: ResourceReference<any>, update: Update<T>, data?: T): BuilderDirective<T> {
        return new BuilderDirective(path, update, [{ ref: ref, update: data }])
    }

    send() {
        server.sendAll(this.path, this.toJson())
    }

    async override(directive: BuilderDirective<T>): Promise<void> {
        for(let i = 0; i < directive.builders.length; i++) {
            const builder = directive.builders[i]
            const existing = this.builders.find((b) => b.ref.equals(builder.ref))
            if (existing) {
                existing.update = this.update.updateState(existing.update, builder.update)
            } else {
                this.builders.push(builder)
            }
        }
    }

    toJson(): {} {
        return this.builders.map((builder) => {
            return {
                ref: builder.ref.toJson(),
                update: builder.update
            }
        })
    }
}

export type UpdateListener<T> = (state: T) => Promise<void>

export abstract class Update<T> {

    constructor(
        public listeners: UpdateListener<Exclude<T, undefined>>[] = []
    ) { }

    async update(state: T | undefined, newState: T | undefined): Promise<T | undefined> {
        const updateState = this.updateState(state, newState)
        if(updateState != undefined) {
            for(let i = 0; i < this.listeners.length; i++) {
                await this.listeners[i](updateState as Exclude<T, undefined>)
            }
        }
        return updateState
    }

    abstract updateState(state: T | undefined, newState: T | undefined): T | undefined
}

export class VarUpdate<T> extends Update<T> {

    updateState(state: T | undefined, newState: T | undefined): T | undefined {
        if (newState != undefined) {
            return newState
        }
    }
}

export class CheckUpdate extends Update<boolean> {

    updateState(state: boolean | undefined, newState: boolean | undefined): boolean | undefined {
        return newState ?? state
    }
}

export class VarConditionedUpdate<T> extends Update<T> {

    constructor(
        readonly condition: (state: T | undefined, newState: T | undefined) => T | undefined
    ) {
        super()
    }

    updateState(state: T | undefined, newState: T | undefined): T | undefined {
        if (newState != undefined && this.condition(state, newState)) {
            return newState
        }
    }
}

export class ArrayUpdate<T> extends Update<T[]> {

    updateState(state: T[] | undefined, newState: T[] | undefined): T[] | undefined {
        if (state != undefined) {
            state.push(...newState ?? [])
        } else {
            return newState
        }
    }
}

export class ObjectUpdate<T extends Record<string, {} | null | undefined>> extends Update<T> {

    readonly updates: [string, Update<any>][]

    constructor(
        updates: { [K in keyof T]: Update<T[K]> }
    ) {
        super()
        this.updates = Object.entries(updates)
    }

    updateState(state: T | undefined, newState: T | undefined): T | undefined {
        if (newState) {
            if (!state) {
                return newState
            }

            return Object.fromEntries(this.updates.map((entry) => [entry[0], entry[1].updateState(state[entry[0]], newState[entry[0]])])) as T
        }
        return state
    }
}

export type ListUpdateObject<D> = {
    id: string
    mode?: 'push' | 'delete'
    data?: D
}

export abstract class AbstractListUpdate<D, T extends ListUpdateObject<D>> extends Update<T[]> {

    constructor(
        readonly objectUpdate: Update<D>,
        listeners: UpdateListener<T[]>[] = []
    ) {
        super(listeners)
    }

    updateState(state: T[] | undefined, newState: T[] | undefined): T[] | undefined {
        if(newState) {
            if(!state) {
                return newState
            }

            newState.forEach((object) => {
                const index = state.findIndex((obj) => obj.id === object.id)
                if (index < 0) {
                    state.push(object)
                } else {
                    if (state[index].mode === 'push' && object.mode !== 'delete') {
                        object.mode = 'push'
                    }
                    state[index] = this.set(state[index], object)
                }
            })
        }
        return state
    }

    abstract set(state: T, object: T): T
}

export class ListUpdate<T> extends AbstractListUpdate<T, ListUpdateObject<T>> {

    set(state: ListUpdateObject<T>, object: ListUpdateObject<T>): ListUpdateObject<T> {
        return {
            id: object.id,
            mode: object.mode,
            data: this.objectUpdate.updateState(state.data, object.data)
        }
    }
}

export type TreeUpdateNode<T> = {
    id: string
    mode?: 'push' | 'delete'
    children?: TreeUpdateNode<T>[]
    data?: T
}

export class TreeUpdate<T> extends AbstractListUpdate<T, TreeUpdateNode<T>> {

    set(state: TreeUpdateNode<T>, object: TreeUpdateNode<T>): TreeUpdateNode<T> {
        return {
            id: object.id,
            mode: object.mode,
            children: this.updateState(state.children, object.children),
            data: this.objectUpdate.updateState(state.data, object.data)
        }
    }
}