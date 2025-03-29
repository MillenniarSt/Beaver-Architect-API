//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { Directive } from "./directives/directive.js";
import { type ServerOnMessage } from "./server.js";
import { ClientSide, ServerSide, Side } from "./sides.js";

export abstract class Director<S extends Side> {

    protected readonly directives: Map<string, Directive> = new Map()

    readonly sender: S

    constructor(sender: S) {
        this.sender = sender
    }

    clear() {
        this.directives.clear()
    }

    async addDirective(directive: Directive) {
        const existing = this.directives.get(directive.path)
        if(existing) {
            await existing.override(directive)
        } else {
            this.directives.set(directive.path, directive)
        }
    }

    send() {
        this.directives.forEach((directive) => directive.send())

        this.clear()
    }
}

export type ClientDirectorExe<T = any> = (director: ClientDirector) => Promise<T>
export type ClientDirectorUndo<T = any> = (director: ClientDirector, data: T) => Promise<any>

export class ClientDirector<T = any> extends Director<ClientSide> {

    readonly exe: ClientDirectorExe<T>
    readonly undo: ClientDirectorUndo<T>

    protected exeData!: T

    constructor(sender: ClientSide, exe: ClientDirectorExe<T>, undo: ClientDirectorUndo<T>) {
        super(sender)
        this.exe = exe
        this.undo = undo
    }

    public static async execute<T>(side: ClientSide, exe: ClientDirectorExe<T>, undo: ClientDirectorUndo<T>) {
        const director = new ClientDirector(side, exe, undo)
        await director.do()
        director.send()
    }

    async do(): Promise<T> {
        this.exeData = await this.exe(this)
        this.sender.do({
            undo: async () => {
                await this.undo(this, this.exeData!)
                this.send()
            },
            redo: async () => {
                await this.exe(this)
                this.send()
            }
        })
        return this.exeData
    }
}

export class HiddenDirector extends Director<ServerSide> {

}

export function registerDirectorMessages(onMessage: ServerOnMessage) {
    onMessage.set('client/undo', (data, client) => client.undo())
    onMessage.set('client/redo', (data, client) => client.redo())
}