import 'dart:convert';
import 'dart:io';

import 'data/database.dart';
import 'world/area.dart';
import 'builder/project.dart';
import 'engineer/engineer.dart';
import 'http/common.dart';
import 'world/world3D.dart';

ServerHttp server = ServerHttp.localHost(8225);

Map<String, EngineerPlugin> plugins = {};

final Project project = Project("Project", Parallelepiped(Dimension(Pos3D.zero, Size3D(100, 100, 100))),
    smallDescription: "A simple project for testing", image: File("C:\\Users\\Angelo\\Desktop\\Raccolta\\images\\Altro\\IMG_20230903_224511.png"),
    background: File("C:\\Users\\Angelo\\Desktop\\Raccolta\\images\\Altro\\IMG_20230903_224511.png"));

final Map<String, Project> projects = {project.name: project};

void main() async {
  /*
  File filePlugins = File("$appDir/engineers/plugins.json");
  if(!(await filePlugins.exists())) {
    await filePlugins.create(recursive: true);
    await filePlugins.writeAsString("{}");
  }
  Map<String, dynamic> jsonPlugins = json.decode(await filePlugins.readAsString());
  plugins = {
    for(String key in jsonPlugins.keys)
      key: EngineerPlugin.json(jsonPlugins[key])
  };
*/
  server.open();
}