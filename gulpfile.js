import gulp from 'gulp'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

export const __dirname = path.dirname(fileURLToPath(import.meta.url))

gulp.task('copy-generation-folder', async () => {
    const sourceDir = path.join(__dirname, 'src', 'generation')
    const destinationDir = path.join(__dirname, 'dist', 'generation')

    try {
        await fs.copy(sourceDir, destinationDir)
        console.log('Copied generation resources')
    } catch (err) {
        console.error('Error while copying generation resources', err)
    }
})

gulp.task('clean', async () => {
    try {
        await fs.remove(path.join(__dirname, 'dist'))
        console.log('Clean dist folder')
    } catch (err) {
        console.error('Error while removing dist folder', err)
    }
})

gulp.task('build', gulp.series('copy-generation-folder'))

gulp.task('clean', gulp.series('clean'))