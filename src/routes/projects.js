const express = require('express');
const { addProject } = require('../database');
const Project = require('../project');
const router = express.Router()

router.post('/add', (req, res) => {
    const project = req.body;

    if(project.name === '') {
        res.status(200).json({ success: false, invalidFields: ['name'] })
    } else {
        addProject(new Project(
            project.name,
            project.description,
            project.info,
            project.architect,
            project.type
        ));
        res.status(200).json({ success: true })
    }
});