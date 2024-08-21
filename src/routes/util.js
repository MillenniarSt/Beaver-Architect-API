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

function success(res, data) {
    res.status(200).json({ success: true, ...data })
}

function unsuccess(res, data) {
    res.status(200).json({ success: false, ...data })
}

function notFound(res, url) {
    console.log(`[Routes] | 404 | not found "${url}"`)
    res.status(404).json({ success: false, url })
}

function _error(res, type, err, data) {
    console.log(`[Routes] | 400 | ${type} Error - ${err.stack}`)

    res.status(400).json({ success: false, err: {
        type,
        ...data,
        name: err.name,
        message: err.message,
        stack: err.stack,
        errno: err.errno,
        syscall: err.syscall
    }})
}

function error(res, err) {
    _error(res, 'Process', err, {})
}

function errorMongo(res, err, action) {
    _error(res, 'Mongo', err, { action })
}

function errorCopyFile(res, file, dest) {
    _error(res, 'CopyFile', err, {file, dest})
}

function errorDeleteFile(res, file) {
    _error(res, 'DeleteFile', err, {file})
}

module.exports = { success, unsuccess, error, notFound, errorMongo, errorCopyFile, errorDeleteFile };