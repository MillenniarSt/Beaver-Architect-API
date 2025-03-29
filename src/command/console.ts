import type { Side } from "../connection/sides"
import { AbstractCommand, Commander } from "./commander"
import readline from 'readline'

export class ConsoleCommander extends Commander {

    protected opened: boolean = false

    constructor(
        protected readonly rl: readline.Interface,
        side: Side,
        commands: AbstractCommand[]
    ) {
        super(side, commands)
    }

    log(...args: string[]) {
        console.log(...args)
    }
    info(...args: string[]) {
        console.info(...args)
    }
    warn(...args: string[]) {
        console.warn(...args)
    }
    error(...args: string[]) {
        console.error(...args)
    }

    _open() {
        this.rl.on('line', (input) => this.execute(input))
    }

    _close() {
        this.opened = false
        this.rl.close()
    }
}