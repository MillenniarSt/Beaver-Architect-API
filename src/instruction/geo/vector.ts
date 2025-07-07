import { BLOCK_INSTRUCTIONS, VarTypeRegistry } from "../../register/instruction";
import type { JsonFormat } from "../../util/util";
import { Vec2 } from "../../world/vector";
import { ConstantBlockInstruction } from "../abstract";
import { BlockInstruction, VarType } from "../instruction";
import type { ExecutionVariable, ManualContext, WriteCppVariable } from "../manual";

export const VEC2_TYPE = VarTypeRegistry.DOUBLE.array(2)

export class Vec2Instruction extends ConstantBlockInstruction<Vec2> {

    get type(): string { return 'vec2' }

    static fromJson(json: any): Vec2Instruction {
        return new Vec2Instruction(Vec2.fromJson(json))
    }

    outputType(context: ManualContext): VarType {
        return VEC2_TYPE
    }

    writeCpp(): string {
        return `{${this.value.x}, ${this.value.y}}`
    }

    toData(): JsonFormat {
        return this.value.toJson()
    }
}

export class NewVec2Instruction extends BlockInstruction<Vec2, [BlockInstruction<number>, BlockInstruction<number>]> {

    get type(): string { return 'new_vec2' }

    constructor(x: BlockInstruction<number>, y: BlockInstruction<number>) {
        super([x, y])
    }

    static fromJson(json: any): NewVec2Instruction {
        return new NewVec2Instruction(BLOCK_INSTRUCTIONS.fromJson(json[0]), BLOCK_INSTRUCTIONS.fromJson(json[1]))
    }

    outputType(context: ManualContext): VarType {
        return VEC2_TYPE
    }

    execute(context: ManualContext<ExecutionVariable>): Vec2 {
        return new Vec2(this.inputs[0].execute(context), this.inputs[1].execute(context))
    }

    getConstantValue(context: ManualContext<WriteCppVariable>): Vec2 | undefined {
        const constantX = this.inputs[0].getConstantValue(context)
        const constantY = this.inputs[1].getConstantValue(context)
        if(constantX !== undefined && constantY !== undefined) {
            return new Vec2(constantX, constantY)
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string {
        return `{${this.inputs[0].writeCpp(context)}, ${this.inputs[1].writeCpp(context)}}`
    }

    toData(): JsonFormat {
        return [this.inputs[0].toJson(), this.inputs[1].toJson()]
    }
}