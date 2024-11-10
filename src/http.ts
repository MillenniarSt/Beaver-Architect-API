import express, { NextFunction, Request, Response } from 'express'
import { settingsRouter } from './routes/settings.js'
import { projectsRouter } from './routes/projects.js'
import { architectsRouter } from './routes/architects.js'
import { error, notFound } from './routes/util.js'
import { fileManagerRouter } from './routes/file-manager.js'

const app = express()

app.use(express.json())

app.use('/file', fileManagerRouter)
app.use('/architects', architectsRouter)
app.use('/projects', projectsRouter)
app.use('/settings', settingsRouter)

app.get('*', (req, res) => notFound(res))
app.post('*', (req, res) => notFound(res))
app.put('*', (req, res) => notFound(res))
app.delete('*', (req, res) => notFound(res))

app.use((err: any, req: Request, res: Response, next: NextFunction) => error(res, err))

app.listen(8025, () => console.log('Express open on http://localhost:8025/'))