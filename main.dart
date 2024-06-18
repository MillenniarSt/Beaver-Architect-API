import 'dart:convert';
import 'dart:io';

import 'builder/area/area.dart';
import 'builder/area/area2D.dart';
import 'builder/project.dart';
import 'data/database.dart';
import 'engineer/engineer.dart';
import 'http/client.dart';
import 'http/common.dart';
import 'world/world3D.dart';

API api = API.localHost(2525)..connectClient(localClient);

Map<String, EngineerPlugin> plugins = {};

final Project project = Project("Project", Parallelepiped(AreaVisual.none, Dimension(Pos3D.zero, Size3D(100, 100, 100))));

void main() async {
  Map<String, dynamic> jsonPlugins = json.decode(await File("$appDir/engineers/plugins.json").readAsString());
  plugins = {
    for(String key in jsonPlugins.keys)
      key: EngineerPlugin.json(jsonPlugins[key])
  };

  await project.database.open();
  await project.database.load();
}