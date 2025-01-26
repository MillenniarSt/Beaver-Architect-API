import { Builder } from "../../builder/builder.js";
import { builderFromJson } from "../../builder/collective.js";
import { ClientDirector } from "../../connection/director.js";
import { getProject } from "../../instance.js";
import { Engineer, ResourceReference } from "../engineer.js";

export class StructureReference extends ResourceReference<StructureEngineer> {

    get folder(): string {
        return 'data_pack\\styles'
    }

    protected _get(): StructureEngineer | undefined {
        return getProject(this.pack).structures.get(this.location)
    }
}
export class StructureEngineer<T extends { toJson: () => {} } = any> extends Engineer {

    builder: Builder<T>

    constructor(ref: ResourceReference<StructureEngineer>, builder: Builder<T>) {
        super(ref)
        this.builder = builder
    }

    update(director: ClientDirector, update: {}): void {
        throw new Error("Method not implemented.");
    }

    static loadFromRef(ref: ResourceReference<StructureEngineer>): StructureEngineer {
        const data = getProject(ref.pack).read(ref.path)
        return new StructureEngineer(ref,
            builderFromJson(data.builder)
        )
    }

    toJson(): {} {
        return {
            builder: this.builder.toJson()
        }
    }
}