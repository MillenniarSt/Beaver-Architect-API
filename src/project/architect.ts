//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import { ChildProcess, spawn } from 'child_process';
import fs from 'fs';
import path, { resolve } from 'path';
import { WebSocket } from 'ws';
import { registerProjectMessages } from '../project/project.js';
import { ArchitectSide } from '../connection/sides.js';
import { type OnMessage, toSocketError } from '../connection/server.js';
import { PermissionLevel, PERMISSIONS } from '../connection/permission.js';
import { getProject } from '../instance.js';

export class Architect {

    readonly identifier: string
    readonly version: string
    readonly name: string
    readonly port: number

    settings = new Map<string, any>()

    readonly permissions: PermissionLevel

    constructor(
        readonly process: ChildProcess,
        data: ArchitectData,
        permissions: PermissionLevel
    ) {
        this.identifier = data.identifier
        this.name = data.name
        this.version = data.version
        this.port = data.port
        this.permissions = permissions
    }

    get icon(): string {
        return path.join(getProject().dir, 'architect', 'resources', 'icon.svg')
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
    version: string,
    port: number,
    name: string
}

export async function loadArchitect(data: ArchitectData, projectIdentifier: string): Promise<ArchitectSide> {
    const process: ChildProcess = await new Promise((resolve) => {
        const architectProcess = spawn(path.join(getProject().dir, 'architect', 'architect.exe'), [
            projectIdentifier,
            `${data.port}`,
            'false'
        ], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe']
        })

        architectProcess.stdout.on('data', (data) => {
            const line = `${data}`
            if(line.includes('Architect started')) {
                resolve(architectProcess)
            }
            console.debug(line.trim())
        })

        architectProcess.stderr.on('data', (data) => {
            console.error(`${data}`.trim())
        })

        architectProcess.on('exit', (code) => {
            console.error(`Closed Architect [Exit code: ${code}]`)
        })
    })
    process.stdout!.removeAllListeners('data')
    process.stdout!.on('data', (data) => {
        console.debug(`${data}`.trim())
    })

    const architect = new Architect(process, data, new PermissionLevel([PERMISSIONS.MANAGE_ARCHITECT_FILE]))

    const side = await new Promise<ArchitectSide>((resolve) => {
        const ws = new WebSocket(`ws://localhost:${data.port}`)

        ws.onopen = () => {
            console.log(`Project Server Connected to WebSocketServer ws://localhost:${data.port}`)
            resolve(new ArchitectSide(architect, ws))
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

    return side
}