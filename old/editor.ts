//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ClientDirector } from "../src/connection/director.js";
import { KeyNotRegistered } from "../src/connection/errors.js";
import { type MessageFunction, type ServerOnMessage } from "../src/connection/server.js";
import { ClientSide, Side } from "../src/connection/sides.js";
import { getProject } from "../src/instance.js";
import { type ToJson } from "../src/util/util.js";
import { Engineer, ResourceReference } from "../src/engineer/engineer.js";

export const namedEditors: Map<string, EditorFunction> = new Map()

export function NamedEditor<E extends Engineer>() {
    return function (constructor: EditorFunction<E>) {
        namedEditors.set(constructor.name, constructor)
    }
}

export interface EditorFunction<E extends Engineer = Engineer> extends Function {

    get extension(): string

    new(...args: any[]): Editor<E>

    create(engineer: E): Editor<E>

    fromJson(json: any, engineer: E): Editor<E>

    get basePath(): string

    messages(): Record<string, MessageFunction<ClientSide>>
}

export abstract class Editor<E extends Engineer = Engineer> implements ToJson {

    constructor(
        readonly engineer: E
    ) { }

    static get(ref: ResourceReference, extension: string): Editor {
        const factory = namedEditors.get(extension)
        if(!factory) {
            throw new KeyNotRegistered(extension, 'Editor')
        }
        const engineer = ref.get()
        try {
            return factory.fromJson(getProject().read(ref.getEditorPath('rete')), engineer)
        } catch (e) {
            return factory.create(engineer)
        }
    }

    get extension(): string {
        return (this.constructor as EditorFunction).extension
    }

    protected abstract update(director: ClientDirector, update: {}): void

    abstract apply(client: ClientSide): void

    abstract isValid(): boolean

    save() {
        getProject(this.engineer.reference.pack).write(this.engineer.reference.getEditorPath(this.extension), this.toJson())
    }

    abstract toJson(): {}
}

export function registerEditorMessages(onMessage: ServerOnMessage) {
    namedEditors.forEach((editorFunction) => Object.entries(editorFunction.messages()).forEach(([path, f]) => 
        onMessage.set(`${editorFunction.basePath}$${editorFunction.extension}/${path}`, f)
    ))
}