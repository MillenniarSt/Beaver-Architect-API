import { ChildProcess, fork } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { pluginsDir } from './paths.js';

export class Plugin {

    constructor(
        private process: ChildProcess,
        readonly data: PluginData
    ) { }
}

export interface PluginData {

    identifier: string,
    port: number
}

export let plugins: Plugin[] = []

export function loadPlugins() {
    fs.readdirSync(pluginsDir).forEach((dir) => {
        const pluginProcess = fork(path.join(pluginsDir, dir, 'src', 'index.js'), {
            cwd: path.join(pluginsDir, dir),
            stdio: 'inherit',
        });

        pluginProcess.on('message', (data: PluginData) => {
            plugins.push(new Plugin(pluginProcess, data))
            console.log(`Loaded Plugin: ${data.identifier}`)
        });
    });
}