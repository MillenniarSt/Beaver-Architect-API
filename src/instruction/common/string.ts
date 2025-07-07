import { VarTypeRegistry } from "../../register/instruction";
import { ConstantBlockInstruction } from "../abstract";
import { VarType } from "../instruction";
import type { ManualContext } from "../manual";

export class StringInstruction extends ConstantBlockInstruction<string> {

    get type(): string { return 'string' }

    static fromJson(json: any): StringInstruction {
        return new StringInstruction(json)
    }

    outputType(context: ManualContext): VarType {
        return new VarType(VarTypeRegistry.STRING)
    }

    selfCppIncludes(): string[] {
        return ['<string>']
    }
}