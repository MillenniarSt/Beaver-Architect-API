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

import { v4 } from 'uuid'
import { WebSocket } from 'ws'

export type WebSocketMessage = {
    path: string,
    id?: string,
    data: {}
}

export let debugSocket = false

export class WebSocketConnection {

    private ws: WebSocket | null = null

    private waitingRequests: Map<string, (value: any) => void> = new Map()

    connectLocal(port: number): Promise<void> {
        return this.connect(`ws://localhost:${port}`)
    }

    connect(url: string): Promise<void> {
        return new Promise((resolve) => {
            this.ws = new WebSocket(url)

            this.ws.onopen = () => {
                console.log(`Project Server Connected to WebSocketServer ${url}`)
                resolve()
            }

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(String(event.data))
                    console.log('message', message)

                    if (message.err) {
                        console.error('Socket Error:', message.err)
                    }

                    if (message.id) {
                        const resolve = this.waitingRequests.get(message.id)
                        if (resolve) {
                            resolve(message.data)
                            this.waitingRequests.delete(message.id)
                        } else {
                            console.error('Invalid Response Id')
                        }
                    }
                } catch (error) {
                    console.error('Invalid socket message', error)
                }
            }

            this.ws.onclose = () => {
                console.warn('Connection WebSocket closed, trying to reconnect in 3s')
                setTimeout(() => this.connect(url), 3000)
            }

            this.ws.onerror = (error) => {
                console.error('WebSocket Error: ', error)
            }
        })
    }

    disconnect() {
        if (this.isOpen) {
            this.ws!.close()
        }
    }

    send(path: string, data: {}) {
        if (this.isOpen) {
            this.ws!.send(JSON.stringify({ path, data }))
        } else {
            console.error('WebSocket Server connection not available')
        }
    }

    request(path: string, data?: {}): Promise<any> {
        return new Promise((resolve) => {
            if (this.isOpen) {
                const id = v4()
                this.waitingRequests.set(id, resolve)
                this.ws!.send(JSON.stringify({ path: path, id: id, data: data ?? {} }))
            } else {
                console.error('WebSocket Server connection not available')
                resolve(undefined)
            }
        })
    }

    get isOpen(): boolean {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN
    }
}