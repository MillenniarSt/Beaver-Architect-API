import { WebSocketServer } from 'ws'
import chalk from 'chalk'

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

export let debugSocket = false

export function findPort(): number {
    return 8026
}

export type OnMessage = (message: WebSocketMessage, ws: WsActions) => boolean

export type WsActions = {
    respond: (data: {}, err?: WebSocketError) => void,
    send: (path: string, data?: {}) => void, 
    sendAll: (path: string, data?: {}) => void
}

export function openSocketServer(port: number, onMessage: OnMessage): WebSocketServer {
    const wss = new WebSocketServer({ port })

    console.log(`[ Socket ] |  OPEN  | WebSocketServer open on port ${port}`)

    const sendAll = (path: string, data?: {}) => {
        debugSendMessage(path)
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ path, data }));
            }
        })
    }

    wss.on('connection', (ws) => {
        console.log(`[ Socket ] |  JOIN  | Client Connected on port ${port}`)

        const send = (path: string, data?: {}) => {
            debugSendMessage(path)
            ws.send(JSON.stringify({ path, data }))
        }

        const respond = (id: string | undefined | null, data: {}, err?: WebSocketError) => {
            if(id === undefined) {
                console.log(chalk.red(`[ Socket ] |  RES   | ERR | Trying to respond without a response id`))
            } else {
                debugRespondMessage(err)
                ws.send(JSON.stringify({ id: id, data: data, err: err }))
            }
        }

        ws.on('message', (data) => {
            try {
                const message: WebSocketMessage = JSON.parse(data.toString())
                debugGetMessage(message.path)

                try {
                    if(!onMessage(message, { respond: (data, err) => respond(message.id, data, err), send, sendAll })) {
                        console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message Path : ${message.path}`))
                    }
                } catch(error) {
                    respond(message.id ?? null, { path: message.path, data: message.data }, toSocketError(error))
                }
            } catch (error) {
                console.log(chalk.redBright(`[ Socket ] |  GET   | ERR | Invalid Message`))

                respond(null, {}, toSocketError(error))
            }
        })
    })

    return wss
}

export function toSocketError(err: any): WebSocketError {
    return {
        name: err.name,
        message: err.message,
        stack: err.stack,
        errno: err.errno,
        syscall: err.syscall
    }
}

function debugGetMessage(path: string) {
    if (debugSocket) {
        console.log(chalk.gray(`[ Socket ] |  GET   | SUC | Message [${path}]`))
    }
}

function debugSendMessage(path: string) {
    if (debugSocket) {
        console.log(chalk.gray(`[ Socket ] |  SEND  | SUC | Message [${path}]`))
    }
}

function debugRespondMessage(err?: WebSocketError) {
    if (err) {
        console.log(chalk.red(`[ Socket ] |  RES   | ERR | Internal Error ${err.stack}`))
    }
}