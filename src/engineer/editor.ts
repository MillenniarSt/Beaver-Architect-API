import { ClientDirector } from "../connection/director.js";
import { ClientSide } from "../connection/sides.js";
import { getProject } from "../instance.js";
import { Engineer } from "./engineer.js";

export abstract class Editor<E extends Engineer = Engineer> {

    constructor(
        readonly extension: string,
        readonly engineer: E
    ) { }

    abstract update(director: ClientDirector, update: {}): void

    abstract apply(client: ClientSide): void

    save() {
        getProject(this.engineer.reference.pack).write(this.engineer.reference.getEditorPath(this.extension), this.toJson())
    }

    abstract toJson(): {}
}