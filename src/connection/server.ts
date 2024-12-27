//             _____
//         ___/     \___        |  |
//      ##/  _.- _.-    \##  -  |  |                       -
//      ##\#=_  '    _=#/##  |  |  |  /---\  |      |      |   ===\  |  __
//      ##   \\#####//   ##  |  |  |  |___/  |===\  |===\  |   ___|  |==/
//      ##       |       ##  |  |  |  |      |   |  |   |  |  /   |  |
//      ##       |       ##  |  \= \= \====  |   |  |   |  |  \___/  |
//      ##\___   |   ___/
//      ##    \__|__/
//

import { WebSocketServer, WebSocket } from "ws"
import { ArchitectSide, ClientSide, Side } from "./sides.js"
import localtunnel from 'localtunnel'
import * as http from 'http'

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
    name: string,
    message: string,
    stack: string,
    errno: string,
    syscall: string
}

export type OnMessage = Map<string, (data: any, sender: Side, id?: string) => void>

export type ServerOnMessage = Map<string, (data: any, client: ClientSide, id?: string) => void>
export type ArchitectOnMessage = Map<string, (data: any, client: ArchitectSide, id?: string) => void>

export class Server {

    private _wss: WebSocketServer | null = null

    private clients: ClientSide[] = []

    async open(port: number, isPublic: boolean, onMessage: ServerOnMessage): Promise<string | undefined> {
        const server = http.createServer()

        this._wss = new WebSocketServer({ server })

        console.log(`[ Socket ] |  OPEN  | WebSocketServer opening on port ${port}...`)

        server.on('upgrade', (req, socket, head) => {
            console.log(`[ Socket ] | TUNNEL | Upgrade from: ${req.headers.host}`);
        })
        this._wss.on('connection', (ws, req) => {
            console.info(`[ Socket ] |  JOIN  | Client ${req.socket.remoteAddress} Connected on port ${port}`)

            const client = new ClientSide(ws)
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
                            client.respond(message.id ?? null, { path: message.path, data: message.data }, toSocketError(error))
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
        })
        this._wss.on('error', (err) => {
            console.error('[ Socket ] |  ERR   |', err)
        })

        return await new Promise((resolve) => {
            server.listen(port, async () => {
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

    get wss(): WebSocketServer {
        return this._wss!
    }
}

export const server = new Server()

export function toSocketError(err: any): WebSocketError {
    return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        errno: err.errno,
        syscall: err.syscall
    }
}