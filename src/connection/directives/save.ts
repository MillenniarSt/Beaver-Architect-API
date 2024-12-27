//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { ResourceReference } from "../../builder/builder.js";
import { Directive } from "./directive.js";

export class SaveDirective extends Directive {

    get path(): string {
        return 'save'
    }

    constructor(
        readonly references: ResourceReference<any>[]
    ) {
        super()
    }

    send() {
        this.references.forEach((reference) => reference.get().save())
    }

    async override(directive: SaveDirective): Promise<void> {
        directive.references.forEach((reference) => {
            if(!this.references.find((ref) => ref.equals(reference))) {
                this.references.push(reference)
            }
        })
    }
}