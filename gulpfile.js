import gulp from 'gulp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import getAppDataPath from 'appdata-path'

export const __dirname = path.dirname(fileURLToPath(import.meta.url))

gulp.task('install-src', async () => {
    try {
        fs.cpSync(path.join(__dirname, 'dist'), path.join(getAppDataPath.default('Beaver Architect'), 'server', 'src'), {recursive: true})
        console.log('Server src Installed')
    } catch (err) {
        console.error('Error while copying server src', err)
    }
})

gulp.task('install-dependencies', async () => {
    try {
        fs.cpSync(path.join(__dirname, 'package.json'), path.join(getAppDataPath.default('Beaver Architect'), 'server', 'package.json'), {recursive: true})
        fs.cpSync(path.join(__dirname, 'node_modules'), path.join(getAppDataPath.default('Beaver Architect'), 'server', 'node_modules'), {recursive: true})
        console.log('Server dependencies Installed')
    } catch (err) {
        console.error('Error while copying server dependencies', err)
    }
})

gulp.task('clean', async () => {
    try {
        fs.rmSync(path.join(__dirname, 'dist'), {recursive: true})
        console.log('Delete dist folder')
    } catch (err) {
        console.error('Error while removing dist folder', err)
    }
})

gulp.task('compress', async () => {
    try {
        fs.rmSync(path.join(__dirname, 'dist'), {recursive: true})
        console.log('Delete dist folder')
        fs.rmSync(path.join(__dirname, 'node_modules'), {recursive: true})
        console.log('Delete node_modules folder')
    } catch (err) {
        console.error('Error while removing dist and node_modules folder', err)
    }
})

gulp.task('uninstall', async () => {
    try {
        fs.rmSync(path.join(getAppDataPath.default('Beaver Architect'), 'server'), {recursive: true})
        console.log('Uninstall Server')
    } catch (err) {
        console.error('Error while uninstalling server', err)
    }
})

gulp.task('install', gulp.series('install-src', 'install-dependencies'))
gulp.task('install-src', gulp.series('install-src'))
gulp.task('install-modules', gulp.series('install-dependencies'))

gulp.task('uninstall', gulp.series('uninstall'))

gulp.task('clean', gulp.series('clean'))
gulp.task('compress', gulp.series('compress'))