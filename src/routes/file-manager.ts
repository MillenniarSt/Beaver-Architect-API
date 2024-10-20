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

import express from 'express'
import fs from 'fs-extra'
import path from 'path'
import { error, errorReadDir, errorReadFile, errorWriteFile, success } from './util.js'
import { dir } from '../paths.js'
import { Response } from 'express'

export const fileManagerRouter = express.Router()

fileManagerRouter.get('/read-text', (req, res) => {
    read(res, req.query.path, 'utf8')
})

fileManagerRouter.get('/read-json', (req, res) => {
    read(res, req.query.path, 'utf8', (data) => JSON.parse(data))
})

function read(res: Response, relPath: any, options: any, encode: (data: any) => any = (data) => data) {
    if(typeof relPath === 'string') {
        const filePath = path.join(dir, relPath)
        if(fs.existsSync(filePath)) {
            fs.readFile(filePath, options, (err, data) => {
                if(err) {
                    errorReadFile(res, err, filePath)
                } else {
                    success(res, encode(data))
                }
            })
        } else {
            errorReadFile(res, new Error('File does not exists'), filePath)
        }
    } else {
        errorReadFile(res, new Error('Undefined file path'), 'undefined')
    }
}

fileManagerRouter.post('/write-text', (req, res) => {
    write(res, req.body.path, req.body.data ?? '', 'utf8')
})

fileManagerRouter.post('/write-json', (req, res) => {
    write(res, req.body.path, JSON.stringify(req.body.data), 'utf8')
})

function write(res: Response, relPath: any, data: any, options: any) {
    if(typeof relPath === 'string') {
        const filePath = path.join(dir, relPath)
        try {
            fs.mkdirSync(path.dirname(filePath), { recursive: true })
            fs.writeFileSync(filePath, data, options)
            success(res)
        } catch(err) {
            errorWriteFile(res, err, filePath)
        }
    } else {
        errorWriteFile(res, new Error('Undefined file path'), 'undefined')
    }
}

fileManagerRouter.get('/exists', (req, res) => {
    const relPath = req.query.path
    if(typeof relPath === 'string') {
        success(res, fs.existsSync(path.join(dir, relPath)))
    }
    error(res, new Error('Undefined file path'))
})

fileManagerRouter.post('/mkdirs', (req, res) => {
    success(res, fs.mkdirsSync(path.join(dir, req.body.path)))
})

fileManagerRouter.get('/read-dir', (req, res) => {
    const relPath = req.query.path
    if(typeof relPath === 'string') {
        const dirPath = path.join(dir, relPath)
        if(fs.existsSync(dirPath)) {
            success(res, fs.readdirSync(dirPath))
        } else {
            errorReadDir(res, new Error('File does not exists'), dirPath)
        }
    } else {
        errorReadDir(res, new Error('Undefined file path'), 'undefined')
    }
})

fileManagerRouter.get('/read-all-dir', (req, res) => {
    const relPath = req.query.path
    if(typeof relPath === 'string') {
        const dirPath = path.join(dir, relPath)
        if(fs.existsSync(dirPath)) {
            success(res, readDirRecursive(dirPath))
        } else {
            errorReadDir(res, new Error('File does not exists'), dirPath)
        }
    } else {
        errorReadDir(res, new Error('Undefined file path'), 'undefined')
    }
})

type FileEntry = {
    name: string,
    path: string,
    children?: FileEntry[]
}

function readDirRecursive(dir: string): FileEntry[] {
    return fs.readdirSync(dir, { withFileTypes: true }).map((entry) => {
        const filePath = path.join(dir, entry.name)
        return {
            name: entry.name,
            path: filePath,
            children: entry.isDirectory() ? readDirRecursive(filePath) : undefined
        }
    })
}