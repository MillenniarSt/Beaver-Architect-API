import { ChildProcess, fork } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { architectsDir } from './paths.js';

export class Architect {

    readonly identifier: string
    readonly name: string
    readonly port: number

    settings = new Map<string, any>()

    constructor(
        private process: ChildProcess,
        data: ArchitectData
    ) {
        this.identifier = data.identifier
        this.name = data.name
        this.port = data.port
    }

    get icon(): string {
        return path.join(architectsDir, this.identifier, 'resources', 'icon.svg')
    }

    get clientData(): {} {
        return {
            identifier: this.identifier,
            name: this.name,
            port: this.port,
            icon: this.icon
        }
    }
}

export interface ArchitectData {

    identifier: string,
    name: string,
    port: number
}

export let architects: Architect[] = []

export function loadPlugins() {
    fs.readdirSync(architectsDir).forEach((dir) => {
        const pluginProcess = fork(path.join(architectsDir, dir, 'src', 'index.js'), {
            cwd: path.join(architectsDir, dir),
            stdio: 'inherit',
        });

        pluginProcess.on('message', (data: ArchitectData) => {
            architects.push(new Architect(pluginProcess, data))
            console.log(`Loaded Plugin: ${data.identifier}`)
        });
    });
}