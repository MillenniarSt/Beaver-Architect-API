import Foundation

func requestAccessToHomeDirectory() {
    let fileManager = FileManager.default
    let homeDirectory = fileManager.homeDirectoryForCurrentUser

    do {
        let directoryContents = try fileManager.contentsOfDirectory(at: homeDirectory, includingPropertiesForKeys: nil)
        print("Directory contents: \(directoryContents)")
        let task = Process()
        task.launchPath = "/usr/bin/env"
        task.arguments = ["dart", "../lib/main.dart"]
        task.launch()
        task.waitUntilExit()
    } catch {
        print("Errore durante l'accesso alla directory Home: \(error)")
    }
}

requestAccessToHomeDirectory()