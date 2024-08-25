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
const db = require('../database');

router.get('/', (req, res) => {
    const query = req.query;

    db.getAll('projects', query, res, (result) => success(res, {projects: result}))
});

router.get('/:id', (req, res) => {
    const { id } = req.params;

    db.get('projects', id, res, (result) => success(res, {project: result}))
});

router.post('/', (req, res) => {
    const data = req.body;

    if(data.name === '') {
        unsuccess(res, { invalidName: true })
    } else {
        const project = new Project(
            data.name,
            data.authors,
            data.description,
            data.info,
            data.architect,
            data.type
        )
        const id = project._id

        fs.mkdirsSync(path.join(dir, id))

        fs.copy(data.image, path.join(dir, id, 'image.png'), (err) => {
            if(err) {
                errorCopyFile(res, err, data.image, path.join(dir, id, 'image.png'))
                return
            }
    
            fs.copy(data.background, path.join(dir, id, 'background.png'), (err) => {
                if(err) {
                    errorCopyFile(res, data.background, path.join(dir, id, 'background.png'))
                    return
                }
    
                db.add('projects', project, res, () => success(res, { project }))
            })
        })
    }
});

router.put('/:id', (req, res) => {
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

                db.modifySet('projects', id, {
                    name: changes.name,
                    authors: changes.authors,
                    description: changes.description,
                    info: changes.info
                }, res, () => success(res))
            })
        })
    }
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;

    fs.rmSync(path.join(dir, id), { recursive: true })
    db.remove('projects', id, res, () => success(res))
});

module.exports = router;