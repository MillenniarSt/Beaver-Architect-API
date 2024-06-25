import 'dart:convert' as convert;
import 'dart:io';

import '../architect/architect.dart';
import '../data/database.dart';
import '../engineer/engineer.dart';
import '../engineer/style.dart';
import '../http/client.dart';
import 'bbuilder.dart';
import 'structure.dart';

class Project extends Builder {

  late final Database database = Database(name);

  late final Architect architect;

  File? image;
  File? background;
  String smallDescription = "";
  String description = "";
  List<String> _structures = [];

  Project(super.name, super.area, {super.opacity, File? image, File? background, this.description = "", this.smallDescription = ""}) : super() {
    architect = Architect([], Style.defaultStyle);
    Directory(dir).createSync(recursive: true);
    if(image != null) {
      this.image = image.copySync("$dir/image.${image.path.substring(image.path.lastIndexOf(".") +1)}");
    }
    if(background != null) {
      this.background = background.copySync("$dir/background.${background.path.substring(background.path.lastIndexOf(".") +1)}");
    }
  }

  Project.json(String name) : super.json(convert.json.decode(File("$appDir/projects/$name/project.json").readAsStringSync()));

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "image": image == null ? "#null" : image!.path,
    "background": background == null ? "#null" : background!.path,
    "architect": architect.toJson(),
    "smallDescription": smallDescription,
    "description": description,
    "structures": _structures
  });

  @override
  Map<String, dynamic> toJsonTile() => super.toJsonTile()..addAll({
    "engineer": architect.isEmpty ? "Generic" : architect.engineer!.plugin.name,
    "smallDescription": smallDescription,
    "description": description
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    smallDescription = json["smallDescription"];
    description = json["description"];
    architect = Architect.json(json["architect"]);
    image = json["image"] == "#null" ? null : File(json["image"]);
    background = json["background"] == "#null" ? null : File(json["background"]);
    _structures = json["structures"];
  }

  Future<void> addStructure(Structure structure) async {
    _structures.add(structure.id);
    await database.structures.add(structure);
  }

  Future<bool> removeStructure(String id) async {
    _structures.remove(id);
    return await database.structures.delete(id);
  }

  Future<void> build(ClientHttp client) async {
    await architect.build(client, database);
  }

  String get dir => "$appDir/projects/$name";
}