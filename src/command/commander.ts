import { ServerProblem } from '../connection/errors'
import { PermissionLevel } from '../connection/permission'
import type { Side } from '../connection/sides'

export abstract class Commander {

    protected opened: boolean = false
    protected readonly commands: Map<string, AbstractCommand>

    constructor(
        readonly side: Side,
        commands: AbstractCommand[]
    ) {
        this.commands = new Map(commands.map((command) => [command.id, command]))
    }

    get isOpen(): boolean {
        return this.opened
    }

    open() {
        if (!this.isOpen) {
            this.opened = true
            this._open()
            this.info('Opened Commander')
        } else {
            this.warn('Can not open the Commander: it is already opened')
        }
    }

    protected abstract _open(): void

    close() {
        this.opened = false
        this._close()
    }

    protected abstract _close(): void

    abstract log(...args: string[]): void

    abstract info(...args: string[]): void

    abstract warn(...args: string[]): void

    abstract error(...args: string[]): void

    execute(line: string) {
        const args = line.split(' ')
        const command = this.commands.get(args[0])
        if(command) {
            try {
                command.execute(this, args.slice(1))
            } catch(exc) {
                this.error(exc instanceof ServerProblem ? exc.print() : exc as any)
            }
        } else {
            this.error(`Invalid command '${args[0]}'`)
        }
    }
}

export abstract class AbstractCommand<C extends Commander = Commander> {

    constructor(
        readonly id: string
    ) { }

    abstract execute(commander: C, args: string[]): void
}

export class Command<C extends Commander = Commander> extends AbstractCommand<C> {

    constructor(
        id: string,
        readonly args: CommandArgs,
        protected readonly exe: (commander: C, args: string[]) => void
    ) {
        super(id)
    }

    execute(commander: C, args: string[]) {
        if(this.args.validate(args)) {
            this.exe(commander, this.args.get(args))
        } else {
            commander.error(`Invalid command arguments, missing: ${this.args.getMissing(args).join(', ')}`)
        }
    }
}

export class CommandParent<C extends Commander = Commander> extends AbstractCommand<C> {

    constructor(
        id: string,
        readonly children: AbstractCommand[]
    ) {
        super(id)
    }

    execute(commander: C, args: string[]) { 
        if(args.length >= 1) {
            const child = this.children.find((child) => child.id === args[0])
            if(child) {
                child.execute(commander, args.slice(1))
            } else {
                commander.error(`Invalid command argument, use one of these: ${this.children.map((child) => child.id).join(', ')}`)
            }
        } else {
            commander.error(`Missing command argument, use one of these: ${this.children.map((child) => child.id).join(', ')}`)
        }
    }
}

export class CommandArgs {

    constructor(
        readonly ids: string[], 
        readonly required: number = ids.length, 
        readonly fillLastArg: boolean = false
    ) { }

    static empty(): CommandArgs {
        return new CommandArgs([])
    }

    validate(args: string[]): boolean {
        return args.length >= this.required
    }

    getMissing(args: string[]): string[] {
        return this.ids.slice(args.length)
    }

    get(args: string[]): string[] {
        if(this.fillLastArg && args.length > this.ids.length) {
            args = [...args.slice(0, this.ids.length), args.slice(this.ids.length).join(' ')]
        }
        return args
    }
}