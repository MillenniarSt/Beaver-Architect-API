import { ResourceReference } from "../../builder/builder.js";
import { project } from "../../project.js";
import { Directive } from "./directive.js";

export class UpdateDirective<U extends Update> extends Directive {

    constructor(
        readonly path: string,
        readonly update: U
    ) {
        super()
    }

    send(): void {
        project.server.sendAll(this.path, this.toJson())
    }

    override(directive: UpdateDirective<U>): void {
        this.update.override(directive.update)
    }

    toJson(): {} {
        return this.update.toJson() ?? {}
    }
}

export type BuilderDirectiveValue<U extends Update> = {
    ref: ResourceReference<any>
    update: U
}

export class BuilderDirective<U extends Update> extends Directive {

    constructor(
        readonly path: string,
        readonly builders: BuilderDirectiveValue<U>[]
    ) {
        super()
    }

    static update<U extends Update>(path: string, ref: ResourceReference<any>, update: U): BuilderDirective<U> {
        return new BuilderDirective(path, [{ ref: ref, update: update }])
    }

    send(): void {
        project.server.sendAll(this.path, this.toJson())
    }

    override(directive: BuilderDirective<U>): void {
        directive.builders.forEach((builder) => {
            const existing = this.builders.find((b) => b.ref.equals(builder.ref))
            if (existing) {
                existing.update.override(builder.update)
            } else {
                this.builders.push(builder)
            }
        })
    }

    toJson(): {} {
        return this.builders.map((builder) => {
            return {
                ref: builder.ref.toJson(),
                update: builder.update.toJson()
            }
        })
    }
}

export abstract class Update {

    abstract override(update: Update): void

    abstract toJson(): {} | null | undefined
}

export class BaseUpdate<T> extends Update {

    constructor(
        public value: T
    ) {
        super()
    }

    override(update: BaseUpdate<T>): void {
        this.value = update.value
    }

    toJson(): {} | null | undefined {
        return this.value
    }
}

export class CheckUpdate extends BaseUpdate<boolean> {

    constructor(
        value?: boolean
    ) {
        super(value ?? true)
    }

    override(update: BaseUpdate<boolean>): void {
        if (update.value) {
            this.value = update.value
        }
    }
}

export class BaseConditionedUpdate<T> extends BaseUpdate<T> {

    constructor(
        value: T,
        readonly condition: (update: BaseUpdate<T>) => boolean
    ) {
        super(value)
    }

    override(update: BaseUpdate<T>): void {
        if (this.condition(update)) {
            this.value = update.value
        }
    }
}

export class ArrayUpdate<T> extends BaseUpdate<T[]> {

    override(update: ArrayUpdate<T>): void {
        this.value.push(...update.value)
    }
}

export class ObjectUpdate<T extends Record<string, Update | undefined>> extends BaseUpdate<T> {

    constructor(
        value: T
    ) {
        super(value)
    }

    override(update: ObjectUpdate<T>): void {
        Object.entries(update.value).forEach((entry) => {
            if (entry[1]) {
                const existing = this.value[entry[0]]
                if (existing) {
                    existing.override(entry[1])
                } else {
                    (this.value as Record<string, Update>)[entry[0]] = entry[1]
                }
            }
        })
    }

    toJson(): {} | null | undefined {
        return Object.fromEntries(Object.entries(this.value).map((entry) => [entry[0], entry[1]?.toJson()]))
    }
}

export type ListUpdateObject<T> = {
    id: string,
    mode?: 'push' | 'delete',
    data?: T
}

export class ListUpdate<T> extends BaseUpdate<ListUpdateObject<T>[]> {

    override(update: ListUpdate<T>): void {
        update.value.forEach((v1) => {
            const index = this.value.findIndex((v2) => v2.id === v1.id)
            if (index < 0) {
                this.value.push(v1)
            } else {
                if (this.value[index].mode === 'push' && v1.mode !== 'delete') {
                    v1.mode = 'push'
                }
                this.set(index, v1)
            }
        })
    }

    protected set(index: number, v: ListUpdateObject<T>) {
        this.value[index] = v
    }
}

export class TreeUpdate<T extends Record<string, Update | undefined>> extends ListUpdate<T> {

    protected set(index: number, v: ListUpdateObject<T>) {
        if (v.mode === 'delete') {
            this.value[index] = v
        } else {
            this.value[index] = {
                id: v.id,
                mode: v.mode,
                data: Object.fromEntries(Object.entries(v.data ?? {}).map((entry) => {
                    this.value[index].data = {} as T
                    if (entry[1]) {
                        const existing = this.value[index].data[entry[0]]
                        if (existing) {
                            existing.override(entry[1])
                            return [entry[0], existing]
                        } else {
                            return [entry[0], entry[1]]
                        }
                    }
                    return [entry[0], this.value[index].data[entry[0]]]
                })) as T
            }
        }
    }

    toJson(): ListUpdateObject<{}>[] {
        return this.value.map((v) => {
            return {
                id: v.id,
                mode: v.mode,
                data: v.data ? Object.fromEntries(Object.entries(v.data).map((entry) => [entry[0], entry[1]?.toJson()])) : undefined
            }
        })
    }
}