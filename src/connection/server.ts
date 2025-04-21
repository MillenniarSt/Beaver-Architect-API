//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/

import WebSocket, { WebSocketServer } from "ws"
import { ArchitectSide, ClientSide, Side } from "./sides.js"
import localtunnel from 'localtunnel'
import * as http from 'http'
import { ServerProblem } from "./errors.js"
import * as net from 'net'
import { User } from "./user.js"
import { Permission, PermissionLevel } from "./permission.js"

export type WebSocketMessage = {
    path: string,
    id?: string,
    data: {}
}

export type WebSocketResponse = {
    id: string,
    data?: {},
    err?: WebSocketError
}

export type WebSocketError = {
    severity: 'warn' | 'error' | 'fatal'
    name: string,
    message: string,
    stack?: string,
    errno?: string,
    syscall?: string
}

export type MessageFunction<S extends Side = Side, D = any> = (data: D, sender: S, id?: string) => void

export type OnMessage = Map<string, MessageFunction>

export type ServerOnMessage = Map<string, MessageFunction<ClientSide>>
export type ArchitectOnMessage = Map<string, MessageFunction<ArchitectSide>>

export class Server {

    private _wss: WebSocketServer | null = null
    private _server: http.Server | null = null

    readonly clients: ClientSide[] = []

    async open(port: number, isPublic: boolean, onMessage: ServerOnMessage): Promise<string | undefined> {
        this._server = http.createServer()

        this._wss = new WebSocketServer({ server: this.server })

        console.log(`[ Socket ] |  OPEN  | WebSocketServer opening on port ${port}...`)

        this.server.on('upgrade', (req, socket, head) => {
            console.log(`[ Socket ] | TUNNEL | Upgrade from: ${req.headers.host}`);
        })
        this._wss.on('connection', (ws, req) => {
            console.info(`[ Socket ] |  JOIN  | Client ${req.socket.remoteAddress} Connected on port ${port}`)

            // TODO set a security algorith for external clients
            const client = new ClientSide(new User('guest', {
                name: 'Guest',
                bio: 'TODO: add users sync in the server'
            }, new PermissionLevel(Permission.owner())), ws)
            this.clients.push(client)

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data.toString())

                    if (message.path) {
                        try {
                            const f = onMessage.get(message.path)
                            if (f) {
                                f(message.data, client, message.id)
                            } else {
                                console.error(`[ Socket ] |  GET   | Invalid Message Path : ${message.path}`)
                            }
                        } catch (error) {
                            const socketError = error instanceof ServerProblem ? error.toSocketError() : toSocketError(error)
                            client.respond(message.id ?? null, { path: message.path, data: message.data }, socketError)
                        }
                    } else {
                        if (message.err) {
                            console.error(`[ Socket ] |  GET   | Response Error : ${message.err.stack}`)
                        }
                        client.onResponse(message)
                    }
                } catch (error) {
                    console.error(`[ Socket ] |  GET   | Invalid Message`)
                    client.send('error', toSocketError(error))
                }
            })

            ws.on('close', (ws: WebSocket, code: number, reason: Buffer) => {
                console.info(`[ Socket ] | CLOSE  | Connection closed: ${reason} [code ${code}]`)
                this.clients.splice(this.clients.findIndex((c) => c.user.id === client.user.id), 1)
            })
        })
        this._wss.on('error', (err) => {
            console.error('[ Socket ] |  ERR   |', err)
        })

        return await new Promise((resolve) => {
            this.server.listen(port, async () => {
                console.info(`[ Socket ] |  OPEN  | Server opened on port: ${port}`)
                if (isPublic) {
                    const tunnel = await localtunnel({ port })

                    console.info(`[ Socket ] | TUNNEL | Tunnel opened with url: ${tunnel.url}`)

                    tunnel.on('close', () => {
                        console.warn('[ Socket ] | TUNNEL | Tunnel closed')
                    })

                    resolve(tunnel.url)
                } else {
                    resolve(undefined)
                }
            })
        })
    }

    sendAll(path: string, data?: {} | null) {
        this.clients.forEach((client) => {
            client.send(path, data)
        })
    }

    close(): Promise<void> {
        return new Promise((resolve) => {
            if (this._wss) {
                this._wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.close(1001, 'Server shutting down')
                    }
                })

                this._wss.close(() => {
                    console.info('[ Socket ] | CLOSE  | Closed WebSocket Server')
                    resolve()
                })
            } else {
                resolve()
            }
        })
    }

    get wss(): WebSocketServer {
        return this._wss!
    }

    get server(): http.Server {
        return this._server!
    }
}

export const server = new Server()

export function toSocketError(err: any): WebSocketError {
    return {
        severity: 'error',
        name: err.name,
        message: err.message,
        stack: err.stack,
        errno: err.errno,
        syscall: err.syscall
    }
}

export function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer()

        server.listen(0, () => {
            const address = server.address()
            if (address && typeof address === 'object') {
                const port = address.port;
                server.close(() => resolve(port))
            } else {
                reject(new Error('Impossibile ottenere la porta libera'))
            }
        })

        server.on('error', reject)
    });
}