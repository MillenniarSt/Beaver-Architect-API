//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import type { Side } from "../connection/sides"
import { AbstractCommand, Commander } from "./commander"

export class ConsoleCommander extends Commander {

    protected opened: boolean = false

    constructor(
        readonly identifier: string,
        side: Side,
        commands: AbstractCommand[]
    ) {
        super(side, commands)
    }

    log(...args: string[]) {
        this.side.info(...args)
    }
    info(...args: string[]) {
        this.side.info(...args)
    }
    warn(...args: string[]) {
        this.side.warn(...args)
    }
    error(...args: string[]) {
        this.side.error(...args)
    }

    _open() {
        this.side.openChannel(this.channelId, {}, (message) => this.execute(message as string))
    }

    _close() {
        this.side.closeChannel(this.channelId)
    }

    get channelId(): string {
        return `commander:${this.identifier}`
    }
}