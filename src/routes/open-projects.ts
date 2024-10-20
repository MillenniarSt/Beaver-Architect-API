import express from 'express'
import path from 'path'
import { Project } from '../project.js'
import { DbCollection, get } from '../database.js'
import { success } from './util.js'
import { Builder } from '../builder/builder.js'
import { DataPack } from '../builder/data-pack/data-pack.js'
import { projectsDir } from '../paths.js'

export const openProjectsRouter = express.Router()

let openProjects: Record<string, OpenProject> = {}

export class OpenProject {

    builder?: Builder
    dataPack: DataPack

    constructor(readonly project: Project) {
        this.dataPack = new DataPack(project.identifier, project.name)
    }
}

// Open / Close Project

openProjectsRouter.get('/:identifier/open', (req, res) => {
    const { identifier } = req.params

    get(DbCollection.PROJECTS, { identifier }, res, (result) => {
        openProjects[identifier] = new OpenProject(result)
        success(res, result)
    })
})

openProjectsRouter.get('/:identifier/close', (req, res) => {
    const { identifier } = req.params

    delete openProjects[identifier]
    success(res)
})

// Project Structure

openProjectsRouter.get('/:identifier/structure', (req, res) => {
    const { identifier } = req.params

    success(res, openProjects[identifier].dataPack.getStructure(path.join(projectsDir, identifier, 'data_pack')))
})