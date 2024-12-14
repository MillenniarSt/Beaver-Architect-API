import { ResourceReference } from "../../builder/builder.js";
import { Directive } from "./directive.js";

export class SaveDirective extends Directive {

    get path(): string {
        return `${this.ref.pack}:${this.ref.folder}\\${this.ref.location}`
    }

    constructor(
        readonly ref: ResourceReference<any>
    ) {
        super()
    }

    send(): void {
        this.ref.get().save()
    }

    override(directive: Directive): void { }
}