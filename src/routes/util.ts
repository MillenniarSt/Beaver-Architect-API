//          _____
//      ___/     \___
//    |/  _.- _.-    \|
//   ||\\=_  '    _=//||
//   ||   \\\===///   ||
//   ||       |       ||
//   ||       |       ||
//   ||\___   |   ___/||
//         \__|__/
//
//      By Millenniar
//

import chalk from 'chalk'
import { NextFunction, Request, Response } from 'express'

export const resHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
}

function displayMethod(method: string): string {
    switch (method) {
        case 'GET': return ' GET  '
        case 'POST': return ' POST '
        case 'PUT': return ' PUT  '
        default: return method
    }
}

export function success(res: Response, data?: any): void {
    console.log(chalk.gray(`[ Routes ] | ${displayMethod(res.req.method)} | 200 | .${res.req.baseUrl} [${res.req.url.substring(1, res.req.url.length -1)}]`))
    res.status(200).json({ success: true, data })
}

export function unsuccess(res: Response, data?: any): void {
    console.log(chalk.yellow(`[ Routes ] | ${displayMethod(res.req.method)} | 200 | unsuccess .${res.req.baseUrl} [${res.req.url.substring(1, res.req.url.length -1)}]`))
    res.status(200).json({ success: false, data })
}

export function notFound(res: Response): void {
    console.log(chalk.redBright(`[ Routes ] | ${displayMethod(res.req.method)} | 404 | not found .${res.req.url}`))
    res.status(404).json({ success: false })
}

function _error(res: Response, status: number, type: string, err: any, data: any): void {
    console.log(chalk.red(`[ Routes ] | ${displayMethod(res.req.method)} | ${status} | ${type} Error - ${err.stack}`))

    res.status(status).json({
        success: false, err: {
            type,
            ...data,
            name: err.name,
            message: err.message,
            stack: err.stack,
            errno: err.errno,
            syscall: err.syscall
        }
    })
}

export function error(res: Response, err: any, status: number = 500): void {
    _error(res, status, 'Process', err, {})
}

export function errorMongo(res: Response, err: any, action: string): void {
    _error(res, 400, 'Mongo', err, { action })
}

export function errorReadFile(res: Response, err: any, file: string): void {
    _error(res, 500, 'ReadFile', err, { file })
}

export function errorReadDir(res: Response, err: any, file: string): void {
    _error(res, 500, 'ReadDir', err, { file })
}

export function errorWriteFile(res: Response, err: any, file: string): void {
    _error(res, 500, 'WriteFile', err, { file })
}

export function errorCopyFile(res: Response, err: any, file: string, dest: string): void {
    _error(res, 500, 'CopyFile', err, { file, dest })
}

export function errorDeleteFile(res: Response, err: any, file: string): void {
    _error(res, 500, 'DeleteFile', err, { file })
}