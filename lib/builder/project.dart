import 'dart:io';

import 'package:beaver_builder_api/world/area.dart';
import 'package:mongo_dart/mongo_dart.dart' as db;

import '../architect/architect.dart';
import '../data/database.dart';
import '../engineer/style.dart';
import '../http/client.dart';
import '../http/project.dart';
import '../main.dart';
import 'bbuilder.dart';

class Project extends Builder<Parallelepiped> {

  ProjectHttp? http;

  late final ProjectDatabase database = ProjectDatabase(id.oid);

  //Properties from the database, they will not be updated
  late final Architect architect;

  late final DateTime lastOpen;
  late final  int opacity;
  late final File? image;
  late final File? background;
  late final String smallDescription;
  late final String description;
  late final List<db.ObjectId> structures;

  Project(super.name, super.area, {this.opacity = 30, File? image, File? background, this.description = "", this.smallDescription = ""}) {
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
    "opacity": opacity,
    "image": image == null ? "#null" : image!.path,
    "background": background == null ? "#null" : background!.path,
    "architect": architect.toJson(),
    "smallDescription": smallDescription,
    "description": description,
    "structures": structures
  });

  Map<String, dynamic> toJsonTile() => {
    "id": id,
    "name": name,
    "engineer": architect.isEmpty ? "Generic" : architect.engineer!.plugin,
    "smallDescription": smallDescription,
    "description": description
  };

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    List<String> lastOpenData = json["last_open"].split("/");
    lastOpen = DateTime(int.parse(lastOpenData[2]), int.parse(lastOpenData[1]), int.parse(lastOpenData[0]));
    smallDescription = json["smallDescription"];
    description = json["description"];
    architect = Architect.json(json["architect"]);
    opacity = json["opacity"];
    image = json["image"] == "#null" ? null : File(json["image"]);
    background = json["background"] == "#null" ? null : File(json["background"]);
    structures = List.generate(json["structures"].length, (index) => json["structures"][index]);
  }

  Future<void> build(ClientHttp client) async {
    await architect.build(client, database);
  }

  String get dir => "$appDir/projects/${id.oid}";

  Future<bool> open({String? host}) async {
    await database.open();

    DateTime now = DateTime.now();
    await mongo.beaver.projects.modify(id, db.modify.set("last_open", "${now.day}/${now.month}/${now.year}"));

    if(host == null || host == "null" || host.isEmpty) {
      http = ProjectHttp.localHost(this);
      server.connect(http!, "/project/${id.oid}");
      return true;
    } else {
      //TODO
      return false;
    }
  }

  Future<void> close({String? host}) async {
    DateTime now = DateTime.now();
    await mongo.beaver.projects.modify(id, db.modify.set("last_open", "${now.day}/${now.month}/${now.year}"));

    await database.close();

    if(host == null || host == "null" || host.isEmpty) {
      server.disconnect("/project/${id.oid}");
      http = null;
    } else {
      //TODO
    }
  }
}