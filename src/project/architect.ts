//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ChildProcess, fork } from 'child_process';
import fs from 'fs';
import path from 'path';
import { architectsDir } from '../util/paths.js';
import { WebSocket } from 'ws';
import { registerProjectMessages } from '../project/project.js';
import { ArchitectSide } from '../connection/sides.js';
import { OnMessage, toSocketError } from '../connection/server.js';

export class Architect {

    readonly identifier: string
    readonly version: string
    readonly name: string

    settings = new Map<string, any>()

    readonly server: ArchitectSide

    constructor(
        private process: ChildProcess,
        data: ArchitectData,
        server: ArchitectSide
    ) {
        this.identifier = data.identifier
        this.name = data.name
        this.version = data.version
        this.server = server
    }

    get icon(): string {
        return path.join(architectsDir, this.identifier, 'resources', 'icon.svg')
    }

    get clientData(): {} {
        return {
            identifier: this.identifier,
            name: this.name,
            port: experimentalPort,
            icon: this.icon
        }
    }
}

export interface ArchitectData {
    identifier: string,
    version: string,
    name: string
}

const experimentalPort = 8225

export function loadArchitect(identifier: string, projectIdentifier: string): Promise<Architect> {
    return new Promise((resolve) => {
        const architectProcess = fork(path.join(architectsDir, identifier, 'src', 'index.js'), {
            cwd: path.join(architectsDir, identifier),
            stdio: 'inherit',
        })

        architectProcess.send(JSON.stringify({ identifier: projectIdentifier, port: experimentalPort }))
    
        architectProcess.on('message', async () => {
            const side = await new Promise<ArchitectSide>((resolve) => {
                const ws = new WebSocket(`ws://localhost:${experimentalPort}`)
    
                ws.onopen = () => {
                    console.log(`Project Server Connected to WebSocketServer ws://localhost:${experimentalPort}`)
                    resolve(new ArchitectSide(ws))
                }

                const onMessage: OnMessage = new Map()
                registerProjectMessages(onMessage)

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data.toString())
    
                        if (message.path) {
                            try {
                                const f = onMessage.get(message.path)
                                if (f) {
                                    f(message.data, side, message.id)
                                } else {
                                    console.error(`[ Socket ] |  GET   | Invalid Message Path : ${message.path}`)
                                }
                            } catch (error) {
                                side.respond(message.id ?? null, { path: message.path, data: message.data }, toSocketError(error))
                            }
                        } else {
                            if (message.err) {
                                console.error(`[ Socket ] |  GET   | Response Error : ${message.err.stack}`)
                            }
                            side.onResponse(message)
                        }
                    } catch (error) {
                        console.error(`[ Socket ] |  GET   | Invalid Message`)
                    }
                }
    
                ws.onclose = () => {
                    console.error('Connection WebSocket closed')
                }
    
                ws.onerror = (error) => {
                    console.error('WebSocket Error: ', error)
                }
            })
    
            await side.request('define', { side: 'server' })

            resolve(new Architect(architectProcess, JSON.parse(fs.readFileSync(path.join(architectsDir, identifier, 'architect.json'), 'utf8')), side))
        })
    })
}