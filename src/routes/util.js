function success(res, data) {
    res.status(200).json({ success: true, ...data })
}

function unsuccess(res, data) {
    res.status(200).json({ success: false, ...data })
}

function error(res, err) {
    res.status(400).json({ success: false, err: {
        type: err.name,
        message: err.message,
        stack: err.stack,
        code: err.errno,
        system: err.syscall
    }})
}

function notFound(res) {
    res.status(404).json({ success: false })
}

function errorMongo(res, err, result) {
    res.status(400).json({ success: false, err: {
        type: 'MongoDB',
        message: err.message,
        stack: err.stack,
        code: err.errno,
        system: err.syscall
    }})
}

function errorCopyFile(res, file, dest) {
    res.status(400).json({ success: false, err: {
        type: 'CopyFile',
        file: file,
        dest: dest,
        message: err.message,
        stack: err.stack,
        code: err.errno,
        system: err.syscall
    }})
}

function errorDeleteFile(res, file) {
    res.status(400).json({ success: false, err: {
        type: 'DeleteFile',
        file: file,
        message: err.message,
        stack: err.stack,
        code: err.errno,
        system: err.syscall
    }})
}

module.exports = { success, unsuccess, error, notFound, errorMongo, errorCopyFile, errorDeleteFile };