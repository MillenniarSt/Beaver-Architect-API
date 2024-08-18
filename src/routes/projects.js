const express = require('express');
const fs = require('fs-extra');
const Project = require('../project');
const router = express.Router()
const dir = require('../index').projectsDir;
const path = require('path');
const { errorCopyFile, success, unsuccess, errorMongo, errorDeleteFile } = require('./util');
const { addProject, modifyProject, getProject, getAllProjects } = require('../database');

let openProjects = {};

router.get('/', (req, res) => {
    const query = req.body;

    getAllProjects(query, (err, result) => {
        if(err) {
            errorMongo(res, err, result)
            return
        }

        success({projects: result})
    })
});

router.get('/:id', (req, res) => {
    const { id } = req.params;

    getProject(id, (err, result) => {
        if(err) {
            errorMongo(res, err, result)
            return
        }

        success({project: result})
    })
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

                modifyProject(id, {
                    name: changes.name,
                    authors: changes.authors,
                    description: changes.description,
                    info: changes.info
                }, (err, result) => {
                    if(err) {
                        errorMongo(res, err, result)
                        return
                    }
    
                    success(res, { project: new Project(
                        changes.name,
                        changes.authors,
                        changes.description,
                        changes.info,
                        new Architect(changes.architect),
                        changes.type
                    )})
                })
            })
        })
    }
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;

    fs.remove(path.join(dir, id), (err) => {
        if(err) {
            errorDeleteFile(res, err, path.join(dir, id))
            return
        }

        success()
    })
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
            addProject(project, (err, result) => {
                if(err) {
                    errorMongo(res, err, result)
                    return
                }

                success()
            })
        })
    })
});