import 'dart:convert' as convert;
import 'dart:io';

import 'package:mongo_dart/mongo_dart.dart' as db;

import '../architect/architect.dart';
import '../data/database.dart';
import '../engineer/style.dart';
import '../http/client.dart';
import '../http/project.dart';
import '../main.dart';
import 'bbuilder.dart';
import 'structure.dart';

class Project extends Builder {

  late final ProjectHttp http = ProjectHttp(name);

  late final ProjectDatabase database = ProjectDatabase(name);

  late final Architect architect;

  late DateTime lastOpen;
  File? image;
  File? background;
  String smallDescription = "";
  String description = "";
  List<db.ObjectId> _structures = [];

  Project(super.name, super.area, {super.opacity, File? image, File? background, this.description = "", this.smallDescription = ""}) {
    lastOpen = DateTime.now();
    architect = Architect([], Style.defaultStyle);
    Directory(dir).createSync(recursive: true);
    if(image != null) {
      this.image = image.copySync("$dir/image.${image.path.substring(image.path.lastIndexOf(".") +1)}");
    }
    if(background != null) {
      this.background = background.copySync("$dir/background.${background.path.substring(background.path.lastIndexOf(".") +1)}");
    }
  }

  Project.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "last_open": "${lastOpen.day}/${lastOpen.month}/${lastOpen.year}",
    "image": image == null ? "#null" : image!.path,
    "background": background == null ? "#null" : background!.path,
    "architect": architect.toJson(),
    "smallDescription": smallDescription,
    "description": description,
    "structures": _structures
  });

  @override
  Map<String, dynamic> toJsonTile() => super.toJsonTile()..addAll({
    "engineer": architect.isEmpty ? "Generic" : architect.engineer!.plugin,
    "smallDescription": smallDescription,
    "description": description
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    List<String> lastOpenData = json["last_open"].split("/");
    lastOpen = DateTime(int.parse(lastOpenData[2]), int.parse(lastOpenData[1]), int.parse(lastOpenData[0]));
    smallDescription = json["smallDescription"];
    description = json["description"];
    architect = Architect.json(json["architect"]);
    image = json["image"] == "#null" ? null : File(json["image"]);
    background = json["background"] == "#null" ? null : File(json["background"]);
    _structures = List.generate(json["structures"].length, (index) => json["structures"][index]);
  }

  Future<void> addStructure(Structure structure) async {
    _structures.add(structure.id);
    await database.structures.add(structure);
  }

  Future<bool> removeStructure(db.ObjectId id) async {
    _structures.remove(id);
    return await database.structures.delete(id);
  }

  Future<void> build(ClientHttp client) async {
    await architect.build(client, database);
  }

  String get dir => "$appDir/projects/$name";

  Future<void> open() async {
    lastOpen = DateTime.now();

    await database.open();

    server.connect(http, "/project/$name");
  }

  Future<void> close() async {
    lastOpen = DateTime.now();

    await database.close();

    server.disconnect("/project/$name");
  }
}