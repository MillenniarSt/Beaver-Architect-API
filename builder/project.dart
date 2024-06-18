import 'dart:convert';
import 'dart:io';

import '../data/database.dart';
import 'area/area.dart';
import 'area/area2D.dart';
import 'bbuilder.dart';
import '../world/world3D.dart';
import 'structure.dart';

class Project extends Builder {

  late final Database database = Database(File("$appDir/projects/$name/database.db"));

  List<Structure> structures = [Structure("Structure", Parallelepiped(AreaVisual.none, Dimension(Pos3D(0, 0, 0), Size3D(100, 100, 100))))];

  Project(super.name, super.area, {super.image, super.opacity}) : super();

  Project._json(super.json) : super.json();

  static Future<Project> load(String name) async {
    Map<String, dynamic> map = json.decode(await File("$appDir/projects/$name/project.json").readAsString());
    Project project = Project._json(map);
    await project.database.open();
    await project.database.load();

    project.structures = List.generate(map["structures"], (index) => project.database.structures[map["structures"][index]]!);

    return project;
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "structures": List.generate(structures.length, (index) => structures[index].id)
  });

  @override
  List<Builder> get childrenBuilders => structures;
}