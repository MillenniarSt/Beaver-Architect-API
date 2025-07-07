import { InternalServerError } from "../connection/errors";
import { LINEAR_INSTRUCTIONS, type VarTypeRegistry } from "../register/instruction";
import { recordToMap, type JsonFormat, type ToJson } from "../util/util";
import type { LinearInstruction, VarType } from "./instruction";

export class Manual<Output extends {} | void = any, RequiredVars extends string[] = []> implements ToJson {

    constructor(
        public instructions: LinearInstruction[]
    ) { }

    static fromJson(json: any): Manual {
        return new Manual(json.instructions.map((instruction: any) => LINEAR_INSTRUCTIONS.fromJson(instruction)))
    }

    execute(initialVars: { [K in RequiredVars[number]]: ExecutionVariable }): Output {
        let context = new ManualContext<ExecutionVariable>(recordToMap(initialVars))
        for(let i = 0; i < this.instructions.length; i++) {
            let returnValue = this.instructions[i].execute(context)
            if(returnValue !== undefined) {
                return returnValue as Output
            }
        }

        return undefined as Output
    }

    toJson(): JsonFormat {
        return {
            instructions: this.instructions.map((instruction) => instruction.toJson())
        }
    }
}

export class ManualContext<Var extends ManualVariable = ManualVariable> {

    constructor(
        readonly variables: Map<string, Var>
    ) { }

    addVar(name: string, variable: Var) {
        this.variables.set(name, variable)
    }

    getVar(name: string): Var {
        const variable = this.variables.get(name)
        if(!variable) {
            throw new VarNotExists(name)
        }
        return variable
    }

    clone(): ManualContext<Var> {
        return new ManualContext(new Map([...this.variables.entries()]))
    }
}

export abstract class ManualVariable {

    constructor(
        readonly type: VarType
    ) { }
}

export class ExecutionVariable extends ManualVariable {

    constructor(
        type: VarType,
        private _value: any
    ) {
        super(type)
    }

    get value(): any {
        return this._value
    }

    set(type: VarType, value: any) {
        if(!this.type.isCompatible(type)) {
            throw new VarIncompatibleTypes(this.type, type)
        }
        this._value = value
    }
}

export class WriteCppVariable extends ManualVariable {

    constructor(
        type: VarType,
        private _constantValue?: any
    ) {
        super(type)
    }

    get constantValue(): any | undefined {
        return this._constantValue
    }

    get isConstant(): boolean {
        return this._constantValue !== undefined
    }

    setConstant(type: VarType, constantValue: any) {
        if(!this.type.isCompatible(type)) {
            throw new VarIncompatibleTypes(this.type, type)
        }
        this._constantValue = constantValue
    }

    setNotConstant() {
        this._constantValue = undefined
    }
}

export class VarNotExists extends InternalServerError {

    constructor(readonly name: string) {
        super(`Can not access to variable ${name}: it does not exist`)
    }
}

export class VarIncompatibleTypes extends InternalServerError {

    constructor(readonly type1: VarType, readonly type2: VarType) {
        super(`Can not use type ${type1.type.id} as type ${type2.type.id}: types are incompatibles`)
    }
}