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

const express = require('express');
const fs = require('fs-extra');
const Project = require('../project');
const router = express.Router()
const dir = require('../paths').projectsDir;
const path = require('path');
const { errorCopyFile, success, unsuccess } = require('./util');
const { add, modify, get, getAll } = require('../database');

let openProjects = {};

router.get('/', (req, res) => {
    const query = req.query;

    getAll('projects', query, res, (result) => success(res, {projects: result}))
});

router.get('/:id', (req, res) => {
    const { id } = req.params;

    get('projects', id, res, (result) => success(res, {project: result}))
});

router.post('/add', (req, res) => {
    const project = req.body;

    if(project.name === '') {
        unsuccess(res, { invalidFields: ['name'] })
    } else {
        success(res, { project: new Project(
            project.name,
            project.authors,
            project.description,
            project.info,
            new Architect(project.architect),
            project.type
        )})
    }
});

router.put('/:id/modify', (req, res) => {
    const { id } = req.params;
    const changes = req.body;

    if(changes.name === '') {
        unsuccess(res, { invalidFields: ['name'] })
    } else {
        fs.copyFile(changes.image, path.join(dir, id, 'image.png'), (err) => {
            if(err) {
                errorCopyFile(res, changes.image, path.join(dir, id, 'image.png'))
                return
            }

            fs.copyFile(changes.background, path.join(dir, id, 'background.png'), (err) => {
                if(err) {
                    errorCopyFile(res, changes.background, path.join(dir, id, 'background.png'))
                    return
                }

                modify('projects', id, {
                    name: changes.name,
                    authors: changes.authors,
                    description: changes.description,
                    info: changes.info
                }, res, () => success(res, { project: new Project(
                        changes.name,
                        changes.authors,
                        changes.description,
                        changes.info,
                        new Architect(changes.architect),
                        changes.type
                    )})
                )
            })
        })
    }
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;

    fs.remove(path.join(dir, id), res, () => success(res))
});

router.put('/:id/saveas', (req, res) => {
    const { id } = req.params;
    const path = req.body;
    const project = openProjects.get(id);

    fs.copyFile(changes.image, path.join(dir, id, 'image.png'), (err) => {
        if(err) {
            errorCopyFile(res, changes.image, path.join(dir, id, 'image.png'))
            return
        }

        fs.copyFile(changes.background, path.join(dir, id, 'background.png'), (err) => {
            if(err) {
                errorCopyFile(res, changes.background, path.join(dir, id, 'background.png'))
                return
            }

            project.location = path;
            add('projects', project, res, () => success())
        })
    })
})

module.exports = router;