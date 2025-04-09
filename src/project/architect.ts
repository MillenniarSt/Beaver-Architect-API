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
import { registerProjectMessages } from '../project/project.js';
import { ArchitectSide } from '../connection/sides.js';
import { type OnMessage, toSocketError } from '../connection/server.js';
import { PermissionLevel, PERMISSIONS } from '../connection/permission.js';
import { closeExceptArchitect, getProject } from '../instance.js';
import { ConstantRandom, Random } from '../builder/random/random.js';
import { ArchitectConstant, ArchitectRandom } from '../builder/random/architect.js';
import { RandomType } from '../builder/random/type.js';
import { BuilderType } from '../builder/collective.js';
import { ArchitectBuilder } from '../builder/generic/architect.js';
import { EmptyBuilder } from '../builder/generic/empty.js';
import { parseRecord } from '../util/util.js';
import { Option } from '../builder/option.js';

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
    const exePath = path.join(getProject().dir, 'architect', 'architect.exe')
    if(!getProject().exists(exePath)) {
        console.error(`Missing Architect: install an architect in '${exePath}'`)
        closeExceptArchitect()
    }

    /**
     * Open architect as a different process controlled by the server
     * and wait its setup
     */
    const process: ChildProcess = await new Promise((resolve) => {
        const architectProcess = spawn(exePath, [
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

    /**
     * Create Architect Side and connect to Architect Websocket server
     */
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

    /**
     * Architect Random registration
     *  - @param id: unique type id of RandomType
     *  - @param constant: json convertible to a registered ConstantRandom
     *  - @param randoms: record of possibles random creations, values must be convertible to Random
     */
    const architectRandomTypes: { id: string, constant: any, randoms: Record<string, any> }[] = await side.request('random/get')
    architectRandomTypes.forEach((randomType) => RandomType.register(
        randomType.id, 
        () => new ArchitectConstant(randomType.id, ConstantRandom.fromJson(randomType.constant)),
        parseRecord(randomType.randoms, (random) => () => new ArchitectRandom(randomType.id, Random.fromJson(random))),
        true
    ))

    /**
     * Architect Builders registration
     *  - @param id: unique type id of BuilderType
     *  - @param options: options supported by the builder, values are types of RandomType
     */
    const architectBuilderTypes: { id: string, options: Record<string, string> }[] = await side.request('builder/get')
    architectBuilderTypes.forEach((builderType) => {
        BuilderType.register(new BuilderType(
            builderType.id, 
            ArchitectBuilder.fromJson, 
            () => new ArchitectBuilder(builderType.id, EmptyBuilder.VOID, parseRecord(builderType.options, (random) => Option.random(RandomType.get(random).constant())))
        ))
    })

    return side
}