import { getProject } from "../instance";
import type { Terrain } from "../project/terrain";
import fs from 'fs'
import { GEOS } from "../register/geo";

export class CppTerrainExporter {

    constructor(
        readonly terrain: Terrain
    ) { }

    exportToCpp(dir: string = getProject().getFilePath('build/cpp')) {
        const baseSrc = 'C:\\Users\\Ange\\Desktop\\Developing\\JavaScript\\Beaver Architect\\server\\resources\\worksite\\src'

        const cppGeos = new CppFile('world/geos.h', [
            new CppFileInclude('world/geo.h'),
            ...GEOS.getAll().filter((geo) => geo.cppClass !== undefined).map((geo) => geo.cppClass!)
        ])

        fs.cpSync(baseSrc, dir, { recursive: true })
        fs.writeFileSync(`${dir}/${cppGeos.path}`, cppGeos.write())
    }
}

export class CppFile {

    constructor(
        readonly path: string,
        public commands: CppCommand[]
    ) { }

    write(): string {
        this.commands.sort((a, b) => a.priority)
        return this.commands.map((command) => command.write(this.path)).join('\n\n')
    }
}

export abstract class CppCommand {

    abstract get priority(): number

    abstract write(filePath: string): string
}

export class CppInclude extends CppCommand {

    constructor(readonly path: string) {
        super()
    }

    get priority(): number {
        return 0
    }

    write(filePath: string): string {
        return `#include <${this.path}>`
    }
}

export class CppFileInclude extends CppInclude {

    write(filePath: string): string {
        let lFilePath = filePath.split('/')
        let lPath = this.path.split('/')
        for(let i = 0; lFilePath[i] === lPath[i]; i++) {
            lPath[i] = '..'
        }
        return `#include "${lPath.join('/')}"`
    }
}

export class CppVar extends CppCommand {

    constructor(readonly type: string, readonly name: string, readonly value?: string) {
        super()
    }

    get priority(): number {
        return 1
    }

    write(): string {
        return `${this.type} ${this.name}${ this.value ? ` = ${this.value}` : ''};`
    }
}

export class CppFunction extends CppCommand {

    constructor(readonly returnType: string, readonly name: string, readonly args: CppVar[], readonly code: string[]) {
        super()
    }

    get priority(): number {
        return 3
    }

    write(): string {
        return `${this.returnType} ${this.name}(${this.args.map((arg) => `${arg.type} ${arg.name}`).join(', ')}) {\n    ${this.code.join(';\n    ')};\n};`
    }
}

export class CppClass extends CppCommand {

    constructor(readonly name: string, readonly parents: string[], readonly attributes: (CppVar | CppFunction)[]) {
        super()
    }

    get priority(): number {
        return 2
    }

    write(): string {
        return `class ${this.name}${this.parents.length === 0 ? '' : `: public ${this.parents.join(', public ')}`} {\n  public:\n    ${this.attributes.map((attribute) => attribute.write().replace('\n', '\n    ')).join('\n\n    ')}\n};`
    }
}