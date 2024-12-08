import { ChildProcess, fork } from 'child_process';
import fs from 'fs';
import path from 'path';
import { architectsDir } from './paths.js';
import { Connection, OnMessage } from './server.js';

export class Architect {

    readonly identifier: string
    readonly name: string
    readonly port: number

    settings = new Map<string, any>()

    readonly connection = new Connection()

    constructor(
        private process: ChildProcess,
        data: ArchitectData,
        port: number
    ) {
        this.identifier = data.identifier
        this.name = data.name
        this.port = port
    }

    async open(onMessage: OnMessage) {
        await this.connection.connectLocal(this.port, onMessage)
        await this.connection.request('define', { side: 'server' })
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
    name: string
}

export function loadArchitect(identifier: string, projectIdentifier: string): Promise<Architect> {
    return new Promise((resolve) => {
        const architectProcess = fork(path.join(architectsDir, identifier, 'src', 'index.js'), {
            cwd: path.join(architectsDir, identifier),
            stdio: 'inherit',
        })

        architectProcess.send(JSON.stringify({ identifier: projectIdentifier, port: 8225 }))
    
        architectProcess.on('message', () => {
            resolve(new Architect(architectProcess, JSON.parse(fs.readFileSync(path.join(architectsDir, identifier, 'architect.json'), 'utf8')), 8225))
        })
    })
}