import { v4 } from "uuid";
import { Vec2 } from "../../world/vector.js";
import { Editor } from "../editor.js";
import { Engineer } from "../engineer.js";

export abstract class ReteEditor<E extends Engineer> extends Editor<E> {

    constructor(
        engineer: E
    ) {
        super('rete', engineer)
    }
}

export abstract class ReteNode {

    constructor(
        protected pos: Vec2,
        readonly id: string = v4()
    ) { }

    abstract toJson(): {}

    toClient(): {} {
        return this.toJson()
    }
}