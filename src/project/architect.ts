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
import path from 'path';
import { WebSocket } from 'ws';
import { registerProjectMessages, Version } from '../project/project.js';
import { ArchitectSide } from '../connection/sides.js';
import { getFreePort, type OnMessage, toSocketError } from '../connection/server.js';
import { PermissionLevel, PERMISSIONS } from '../connection/permission.js';
import { close, getProject } from '../instance.js';
import { RANDOM_TYPES, RandomRegistry, RANDOMS, RandomTypeRegistry, type RandomRegistryFromJson, type RandomTypeRegistryFromJson } from '../register/random.js';
import fs from 'fs'

export class Architect {

    readonly identifier: string
    readonly version: Version
    readonly name: string

    settings = new Map<string, any>()

    readonly permissions: PermissionLevel

    constructor(
        readonly process: ChildProcess,
        data: ArchitectData,
        permissions: PermissionLevel
    ) {
        this.identifier = data.identifier
        this.name = data.name
        this.version = new Version(data.version)
        this.permissions = permissions
    }

    toJson() {
        return {
            identifier: this.identifier,
            version: this.version.toJson(),
            name: this.name
        }
    }
}

export interface ArchitectData {
    identifier: string,
    version: string,
    name: string
}

export async function loadArchitect(data: ArchitectData, projectIdentifier: string, exePath: string): Promise<ArchitectSide> {
    if(!fs.existsSync(exePath)) {
        console.error(`Missing Architect: install an architect in '${exePath}'`)
        close()
    }

    const port = await getFreePort()

    /**
     * Open architect as a different process controlled by the server
     * and wait its setup
     */
    const process: ChildProcess = await new Promise((resolve) => {
        const architectProcess = spawn(exePath, [
            projectIdentifier,
            `${port}`,
            'false',
            path.join(getProject().dir, 'architect')
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
            console.debug(`${data}`.trim())
        })

        architectProcess.on('exit', (code) => {
            console.error(`Closed Architect [Exit code: ${code}]`)
            close()
        })
    })
    process.stdout!.removeAllListeners('data')
    process.stdout!.on('data', (data) => {
        console.debug(`${data}`.trim())
    })

    const architect = new Architect(process, data, new PermissionLevel([PERMISSIONS.MANAGE_ARCHITECT_FILE]))

    /**
     * Create Architect Side and connect to Architect Websocket server
     */
    const side = await new Promise<ArchitectSide>((resolve) => {
        const ws = new WebSocket(`ws://localhost:${port}`)

        ws.onopen = () => {
            console.log(`Project Server Connected to WebSocketServer ws://localhost:${port}`)
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

    /**
     * Registration of custom Architect Registries
     */

    // Randoms
    const architectRandoms: RandomRegistryFromJson[] = await side.request('random/get')
    architectRandoms.forEach((random) => {
        try {
            RANDOMS.register(RandomRegistry.fromJson(random))
        } catch(error) {
            console.error(`Can not register Architect Random Type ${random.id}: ${error}`)
        }
    })

    // Random Types
    const architectRandomTypes: RandomTypeRegistryFromJson[] = await side.request('random/get-types')
    architectRandomTypes.forEach((randomType) => {
        try {
            RANDOM_TYPES.register(RandomTypeRegistry.fromJson(randomType))
        } catch(error) {
            console.error(`Can not register Architect Random Type ${randomType.id}: ${error}`)
        }
    })

    return side
}