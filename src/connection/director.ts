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
import { ServerOnMessage } from "./server.js";
import { ClientSide, HiddenSide, Side } from "./sides.js";

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

export type ClientDirectorExe = (director: ClientDirector) => Promise<void>

export class ClientDirector extends Director<ClientSide> {

    readonly exe: ClientDirectorExe
    readonly undo: ClientDirectorExe

    constructor(sender: ClientSide, exe: ClientDirectorExe, undo: ClientDirectorExe) {
        super(sender)
        this.exe = exe
        this.undo = undo
    }

    public static async execute(side: ClientSide, exe: ClientDirectorExe, undo: ClientDirectorExe) {
        const director = new ClientDirector(side, exe, undo)
        await director.do()
        director.send()
    }

    do(): Promise<void> {
        this.sender.do({
            undo: async () => {
                await this.undo(this)
                this.send()
            },
            redo: async () => {
                await this.exe(this)
                this.send()
            }
        })
        return this.exe(this)
    }
}

export class HiddenDirector extends Director<HiddenSide> {

}

export function registerDirectorMessages(onMessage: ServerOnMessage) {
    onMessage.set('client/undo', (data, client) => client.undo())
    onMessage.set('client/redo', (data, client) => client.redo())
}