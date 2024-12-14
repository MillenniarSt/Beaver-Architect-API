import { Directive } from "./directives/directive.js";
import { Side } from "./sides.js";

export class Director {

    protected directives: Map<string, Directive> = new Map()

    readonly sender: Side

    constructor(sender: Side) {
        this.sender = sender
    }

    public static async execute(side: Side, exe: (director: Director) => Promise<void>) {
        const director = new Director(side)
        await exe(director)
        director.send()
    }

    clear() {
        this.directives = new Map()
    }

    addDirective(directive: Directive) {
        const existing = this.directives.get(directive.path)
        if(existing) {
            existing.override(directive)
        } else {
            this.directives.set(directive.path, directive)
        }
    }

    send() {
        this.directives.forEach((directive) => directive.send())

        this.clear()
    }
}