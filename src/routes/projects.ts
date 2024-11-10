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

import express, { Request, Response } from 'express'
import path from 'path'
import fs from 'fs-extra'
import { __dirname } from '../index.js'
import { add, DbCollection, get, getAll, set, remove } from '../database.js'
import { success, unsuccess, errorCopyFile, resHandler } from './util.js'
import { Project, ProjectData, projectSocketPaths } from '../project.js'
import { projectsDir } from '../paths.js'
import { findPort, openSocketServer } from '../socket.js'
import { architects } from '../architects.js'

export const projectsRouter = express.Router()

projectsRouter.get('/', resHandler(async (req: Request, res: Response) => {
    const query = req.query

    getAll(DbCollection.PROJECTS, query, res, (result) => success(res, result))
}))

projectsRouter.get('/:identifier', (req, res) => {
    const { identifier } = req.params

    get(DbCollection.PROJECTS, { identifier }, res, (result) => success(res, result))
})

projectsRouter.post('/', (req, res) => {
    const data = req.body

    data.name.trim()
    data.identifier.trim()

    if(data.name === '') {
        unsuccess(res, { invalidFields: { name: 'empty' } })
    } else if(data.identifier === '') {
        unsuccess(res, { invalidFields: { identifier: 'empty' } })
    } else if(fs.existsSync(path.join(projectsDir, data.identifier))) {
        unsuccess(res, { invalidFields: { identifier: 'exists' } })
    } else {
        const project: ProjectData = {
            identifier: data.identifier,
            name: data.name,
            authors: data.authors,
            description: data.description,
            info: data.info,
            architect: data.architect,
            type: data.type,
            builder: null
        }
        const identifier = project.identifier

        fs.mkdirsSync(path.join(projectsDir, identifier))

        const image = data.image ?? path.join(__dirname, 'generation', 'image.png')
        fs.copy(image, path.join(projectsDir, identifier, 'image.png'), (err: any) => {
            if(err) {
                errorCopyFile(res, err, image, path.join(projectsDir, identifier, 'image.png'))
                return
            }
    
            const background = data.background ?? path.join(__dirname, 'generation', 'background.png')
            fs.copy(background, path.join(projectsDir, identifier, 'background.png'), (err: any) => {
                if(err) {
                    errorCopyFile(res, err, background, path.join(projectsDir, identifier, 'background.png'))
                    return
                }
    
                add(DbCollection.PROJECTS, project, res, () => success(res, project))
            })
        })
    }
})

projectsRouter.put('/:identifier', (req, res) => {
    const { identifier } = req.params
    const changes = req.body

    changes.name?.trim()
    changes.identifier?.trim()

    if(changes.name === '') {
        unsuccess(res, { invalidFields: { name: 'empty' } })
    } else if(changes.identifier === '') {
        unsuccess(res, { invalidFields: { identifier: 'empty' } })
    } else if(changes.identifier && identifier !== changes.identifier && fs.existsSync(path.join(projectsDir, changes.identifier))) {
        unsuccess(res, { invalidFields: { identifier: 'exists' } })
    } else {

        let fIdentifier = identifier

        if(changes.identifier && identifier !== changes.identifier) {
            fs.renameSync(path.join(projectsDir, identifier), path.join(projectsDir, changes.identifier))

            fIdentifier = changes.identifier
        }

        const image = changes.image ?? path.join(__dirname, 'generation', 'image.png')
        fs.copyFile(image, path.join(projectsDir, fIdentifier, 'image.png'), (err: any) => {
            if(err) {
                errorCopyFile(res, err, image, path.join(projectsDir, fIdentifier, 'image.png'))
                return
            }

            const background = changes.background ?? path.join(__dirname, 'generation', 'image.png')
            fs.copyFile(background, path.join(projectsDir, fIdentifier, 'background.png'), (err: any) => {
                if(err) {
                    errorCopyFile(res, err, background, path.join(projectsDir, fIdentifier, 'background.png'))
                    return
                }

                delete changes._id
                set(DbCollection.PROJECTS, { identifier }, changes, res, () => get(DbCollection.PROJECTS, { fIdentifier }, res, (project) => success(res, project)))
            })
        })
    }
})

projectsRouter.delete('/:identifier', (req, res) => {
    const { identifier } = req.params

    fs.removeSync(path.join(projectsDir, identifier))
    remove(DbCollection.PROJECTS, { identifier }, res, () => success(res))
})

projectsRouter.get('/:identifier/open-local', (req, res) => {
    const { identifier } = req.params

    get(DbCollection.PROJECTS, { identifier }, res, (result: ProjectData) => {

        const project = new Project(result)
        const port = findPort()

        openSocketServer(port, (message, ws) => {
            const f = projectSocketPaths.get(message.path)
            if(f) {
                f(project, message.data, ws)
                return true
            } else {
                return false
            }
        })
        
        success(res, {
            project: project,
            architect: architects.find((architect) => architect.identifier === project.architect)!.clientData,
            port: port
        })
    })
})