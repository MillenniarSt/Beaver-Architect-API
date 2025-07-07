import { BLOCK_INSTRUCTIONS, LINEAR_INSTRUCTIONS, VarTypeRegistry } from "../../register/instruction";
import { joinBiLists, type JsonFormat } from "../../util/util";
import { BlockInstruction, LinearInstruction } from "../instruction";
import { type ManualContext, ExecutionVariable, WriteCppVariable } from "../manual";
import { IntInstruction, AdditionInstruction, LessInstruction } from "./math";
import { GetVarInstruction } from "./variables";

export class IfInstruction extends LinearInstruction<BlockInstruction<boolean>[]> {

    get type(): string { return 'if' }

    constructor(
        ifs: { condition: BlockInstruction<boolean>, block: LinearInstruction[] }[],
        elseInstructions?: LinearInstruction[]
    ) {
        super(ifs.map((ifM) => ifM.condition), [...ifs.map((ifM) => ifM.block), ...(elseInstructions ? [elseInstructions] : [])])
    }

    get hasElse(): boolean {
        return this.inputs.length < this.children.length
    }

    static fromJson(json: any): IfInstruction {
        return new IfInstruction(json.ifs.map((ifM: any) => { return { condition: BLOCK_INSTRUCTIONS.fromJson(ifM.condition), block: ifM.block.map((instruction: any) => LINEAR_INSTRUCTIONS.fromJson(instruction)) } }))
    }

    execute(context: ManualContext<ExecutionVariable>): {} | void {
        for (let i = 0; i < this.inputs.length; i++) {
            if (this.inputs[i].execute(context)) {
                return this.executeInSubScope(context, this.children[i])
            }
        }
        if (this.hasElse) {
            return this.executeInSubScope(context, this.children[-1])
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        let ifsToWrite: { condition: BlockInstruction<boolean>, block: LinearInstruction[] }[] = []
        let elseToWrite = this.hasElse ? this.children[-1] : undefined
        let isFirstCondition = true
        for (let i = 0; i < this.inputs.length; i++) {
            const constantCondition = this.inputs[i].getConstantValue(context)
            if (constantCondition !== undefined) {
                if (constantCondition) {
                    if (isFirstCondition) {
                        return joinBiLists(this.children[i].map((instruction) => instruction.writeCpp(context)))
                    } else {
                        elseToWrite = this.children[i]
                        break
                    }
                }
            } else {
                ifsToWrite.push({ condition: this.inputs[i], block: this.children[i] })
                isFirstCondition = false
            }
        }

        if (ifsToWrite.length === 0) {
            if (elseToWrite) {
                return joinBiLists(elseToWrite.map((instruction) => instruction.writeCpp(context)))
            }
            return []
        }

        return [
            ...joinBiLists(ifsToWrite.map((ifM, i) => [
                `${i === 0 ? '' : '} else '}if(${ifM.condition.writeCpp(context)}) {`,
                ...ifM.block.map((instruction) => `    ${instruction.writeCpp(context)}`)
            ])),
            ...(elseToWrite !== undefined ? [
                '} else {',
                ...elseToWrite.map((instruction) => `    ${instruction.writeCpp(context)}`)
            ] : []),
            '}'
        ]
    }

    toData(): JsonFormat {
        return {
            ifs: this.inputs.map((input, i) => { return { condition: input.toJson(), block: this.children[i].map((instruction) => instruction.toJson()) } }),
            elseInstructions: this.hasElse ? this.children[-1].map((instruction) => instruction.toJson()) : undefined
        }
    }
}

export class ForInstruction extends LinearInstruction<[BlockInstruction<number>, BlockInstruction<boolean>, BlockInstruction<number>]> {

    get type(): string { return 'for' }

    constructor(
        init: BlockInstruction<number>,
        condition: BlockInstruction<boolean>,
        modifier: BlockInstruction<number>,
        block: LinearInstruction[],
        public iteratorName: string = 'i'
    ) {
        super([init, condition, modifier], [block])
    }

    get init(): BlockInstruction<number> { return this.inputs[0] }
    get condition(): BlockInstruction<boolean> { return this.inputs[1] }
    get modifier(): BlockInstruction<number> { return this.inputs[2] }

    static simpleConditioned(start: number, condition: BlockInstruction<boolean>, modifier: number, block: LinearInstruction[], iteratorName: string = 'i'): ForInstruction {
        return new ForInstruction(new IntInstruction(start), condition, new AdditionInstruction(new GetVarInstruction(iteratorName), new IntInstruction(modifier)), block, iteratorName)
    }

    static simpleUp(start: number, upTo: number, block: LinearInstruction[], iteratorName: string = 'i'): ForInstruction {
        return this.simpleConditioned(start, new LessInstruction(new GetVarInstruction(iteratorName), new IntInstruction(upTo)), 1, block, iteratorName)
    }

    static simpleDown(start: number, upTo: number, block: LinearInstruction[], iteratorName: string = 'i'): ForInstruction {
        return this.simpleConditioned(start, new LessInstruction(new GetVarInstruction(iteratorName), new IntInstruction(upTo)), -1, block, iteratorName)
    }

    static count(c: number, block: LinearInstruction[], iteratorName?: string): ForInstruction {
        return this.simpleUp(0, c, block, iteratorName)
    }

    static fromJson(json: any): ForInstruction {
        return new ForInstruction(BLOCK_INSTRUCTIONS.fromJson(json.init), BLOCK_INSTRUCTIONS.fromJson(json.condition), BLOCK_INSTRUCTIONS.fromJson(json.modifier), json.block.map((instruction: any) => LINEAR_INSTRUCTIONS.fromJson(instruction)), json.iteratorName)
    }

    execute(context: ManualContext<ExecutionVariable>): {} | void {
        let startIndex = this.init.execute(context)
        context = context.clone()
        const iterator = new ExecutionVariable(this.init.outputType(context), startIndex)
        for (context.addVar(this.iteratorName, iterator); this.condition.execute(context); iterator.set(this.modifier.outputType(context), this.modifier.execute(context))) {
            const returnValue = this.executeBlock(context, this.children[0])
            if(returnValue !== undefined) {
                return returnValue
            }
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        context = context.clone()
        context.addVar(this.iteratorName, new WriteCppVariable(this.init.outputType(context), this.init.getConstantValue(context)))
        if (this.condition.getConstantValue(context) === false) {
            return []
        }
        context.getVar(this.iteratorName).setNotConstant()
        return [
            `for(${this.init.outputType(context).writeCpp()} ${this.iteratorName} = ${this.init.writeCpp(context)}; ${this.condition.writeCpp(context)}; ${this.iteratorName} = ${this.modifier.writeCpp(context)}) {`,
            ...this.children[0].map((instruction) => `    ${instruction.writeCpp(context)}`),
            '}'
        ]
    }

    toData(): JsonFormat {
        return {
            init: this.init.toJson(),
            condition: this.condition.toJson(),
            modifier: this.modifier.toJson(),
            block: this.children[0].map((instruction) => instruction.toJson()),
            iteratorName: this.iteratorName
        }
    }
}

export class WhileInstruction extends LinearInstruction<[BlockInstruction<boolean>]> {

    get type(): string { return 'while' }

    constructor(
        condition: BlockInstruction<boolean>,
        block: LinearInstruction[]
    ) {
        super([condition], [block])
    }

    static fromJson(json: any): WhileInstruction {
        return new WhileInstruction(BLOCK_INSTRUCTIONS.fromJson(json.condition), json.block.map((instruction: any) => LINEAR_INSTRUCTIONS.fromJson(instruction)))
    }

    execute(context: ManualContext<ExecutionVariable>): void | {} {
        while(this.inputs[0].execute(context)) {
            const returnValue = this.executeInSubScope(context, this.children[0])
            if(returnValue !== undefined) {
                return returnValue
            }
        }
    }

    writeCpp(context: ManualContext<WriteCppVariable>): string[] {
        const constantCondition = this.inputs[0].getConstantValue(context)
        if(constantCondition !== undefined) {
            if(constantCondition) {
                console.warn('Detected infinite loop while writing to cpp')
            } else {
                return []
            }
        }

        return [
            `while(${this.inputs[0].writeCpp(context)}) {`,
            ...this.children[0].map((instruction) => `    ${instruction.writeCpp(context)}`),
            '}'
        ]
    }

    toData(): JsonFormat {
        return {
            condition: this.inputs[0].toJson(),
            block: this.children[0].map((instruction) => instruction.toJson())
        }
    }
}