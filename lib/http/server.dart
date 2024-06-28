import 'dart:io';

import 'package:beaver_builder_api/data/database.dart';
import 'package:beaver_builder_api/http/project.dart';
import 'package:mongo_dart/mongo_dart.dart' as db;
import 'package:shelf/shelf.dart';

import '../builder/project.dart';
import '../main.dart';
import '../world/area.dart';
import '../world/world3D.dart';
import 'common.dart';

class ServerHttp extends ServerConnectionHttp {

  ServerHttp(super.address, super.port);

  ServerHttp.localHost(super.port) : super.localHost();

  Map<String, Future<Response> Function(Map<String, dynamic> data)> get listeners => {
    "/projects/list": (data) async => ok([
      for(Map<String, dynamic> project in await mongo.beaver.projectsCollection.getAll(sort: data["sort"].map<String, bool>((key, value) => MapEntry(key as String, value as bool))))
        Project.json(project).toJsonTile()
    ]),
    "/projects/image": (data) async {
      File? image = mongo.beaver.projects[data["project"]]!.image;
      return image != null ? Response.ok(await image.readAsBytes(), headers: {"Content-Type": "image/${image.path.substring(image.path.lastIndexOf(".") +1)}"}) : Response.ok(null);
    },
    "/projects/background": (data) async {
      File? image = mongo.beaver.projects[data["project"]]!.background;
      return image != null ? Response.ok(await image.readAsBytes(), headers: {"Content-Type": "image/${image.path.substring(image.path.lastIndexOf(".") +1)}"}) : Response.ok(null);
    },
    "/projects/new": (_) async {
      Project? project;
      int i = 1;
      while(project == null) {
        if(!mongo.beaver.projects.containsKey("New Project${i == 1 ? "" : " $i"}")) {
          project = Project("New Project${i == 1 ? "" : " $i"}", Parallelepiped(Dimension(Pos3D.zero, Size3D(1000, 1000, 1000))));
        }
        i++;
      }
      await mongo.beaver.addProject(project);
      return ok(project.toJsonTile());
    },
    "/projects/get": (data) async => mongo.beaver.projects[data["name"]] != null ? ok(mongo.beaver.projects[data["name"]]!.toJson()) : Response.badRequest(body: "Project not Found"),
    "/projects/delete": (data) async => (await mongo.beaver.removeProject(data["name"])) != null ? ok("Project deleted") : error("Project not Found"),
    "/projects/validate_name": (data) async => ok(mongo.beaver.projects[data["name"]] == null || mongo.beaver.projects[data["name"]]!.id == data["id"]),
    "/projects/open": (data) async {
      await mongo.beaver.projects[data["name"]]!.open();
      return ok("Connected project ${data["name"]}");
    },
    "/projects/close": (data) async {
      ProjectHttp http = connected["/project/${data["name"]}"]! as ProjectHttp;
      await http.project.database.close();
      disconnect("/project/${data["name"]}");
      return ok("Disconnected project ${http.project.name}");
    }
  };

  Map<String, Future<Response> Function(Request request)> get requests => {
    "/projects/change_image": (request) async {
      Project project = mongo.beaver.projects[request.url.queryParameters["project"]]!;
      if(project.image != null) {
        await project.image!.delete();
      }
      if(request.url.queryParameters["remove"] != "true") {
        project.image = File("${project.dir}/image.${request.headers["content-type"]!.substring(6)}");
        await project.image!.create(recursive: true);
        await project.image!.writeAsBytes(await request.read().expand((element) => element).toList());
      }
      await mongo.beaver.updateProject(project.id, db.modify.set("image", project.image != null ? project.image!.path : "#null"));
      return ok("Image loaded");
    },
    "/projects/change_background": (request) async {
      Project project = mongo.beaver.projects[request.url.queryParameters["project"]]!;
      if(project.background != null) {
        await project.background!.delete();
      }
      if(request.url.queryParameters["remove"] != "true") {
        project.background = File("${project.dir}/background.${request.headers["content-type"]!.substring(6)}");
        await project.background!.create(recursive: true);
        await project.background!.writeAsBytes(await request.read().expand((element) => element).toList());
      }
      await mongo.beaver.updateProject(project.id, db.modify.set("background", project.background != null ? project.background!.path : "#null"));
      return ok("Background loaded");
    }
  };
}