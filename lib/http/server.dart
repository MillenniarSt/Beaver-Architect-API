import 'dart:io';

import 'package:beaver_builder_api/data/database.dart';
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
      for(Map<String, dynamic> project in await mongo.beaver.projects.getAll(sort: data["sort"].map<String, bool>((key, value) => MapEntry(key as String, value as bool))))
        Project.json(project).toJsonTile()
    ]),
    "/projects/image": (data) async {
      File? image = (await getProject(data["id"])).image;
      return image != null ? Response.ok(await image.readAsBytes(), headers: {"Content-Type": "image/${image.path.substring(image.path.lastIndexOf(".") +1)}"}) : Response.ok(null);
    },
    "/projects/background": (data) async {
      File? image = (await getProject(data["id"])).background;
      return image != null ? Response.ok(await image.readAsBytes(), headers: {"Content-Type": "image/${image.path.substring(image.path.lastIndexOf(".") +1)}"}) : Response.ok(null);
    },
    "/projects/new": (_) async {
      Project project = Project("New Project", Parallelepiped(Dimension(Pos3D.zero, Size3D(1000, 1000, 1000))));
      await mongo.beaver.projects.add(project);
      return ok(project.toJson());
    },
    "/projects/get": (data) async => ok((await getProject(data["id"])).toJson()),
    "/projects/modify": (data) async {
      Project project = await getProject(data["id"]);
      await mongo.beaver.projects.modify(project.id, db.modify.set("name", data["name"]).set("simple_description", data["simple_description"]).set("description", data["description"]));
      return ok("Project modified successfully");
    },
    "/projects/delete": (data) async => (await mongo.beaver.projects.delete(db.ObjectId.fromHexString(data["name"]))) ? ok("Project deleted") : error("Project not Found"),
    "/projects/open": (data) async => ok(await (await getProject(data["id"])).open(host: data["host"])),
    "/projects/close": (data) async {
      await (await getProject(data["id"])).close(host: data["host"]);
      return ok("Disconnected project ${data["id"]}");
    },
    "close": (_) async {
      await close();
      return ok("Server closed");
    }
  };

  Map<String, Future<Response> Function(Request request)> get requests => {
    "/projects/change_image": (request) async {
      Project project = await getProject(request.url.queryParameters["id"]!);
      if(project.image != null) {
        await project.image!.delete();
      }
      if(request.url.queryParameters["remove"] != "true") {
        project.image = File("${project.dir}/image.${request.headers["content-type"]!.substring(6)}");
        await project.image!.create(recursive: true);
        await project.image!.writeAsBytes(await request.read().expand((element) => element).toList());
      }
      await mongo.beaver.projects.modify(project.id, db.modify.set("image", project.image != null ? project.image!.path : "#null"));
      return ok("Image loaded");
    },
    "/projects/change_background": (request) async {
      Project project = await getProject(request.url.queryParameters["id"]!);
      if(project.background != null) {
        await project.background!.delete();
      }
      if(request.url.queryParameters["remove"] != "true") {
        project.background = File("${project.dir}/background.${request.headers["content-type"]!.substring(6)}");
        await project.background!.create(recursive: true);
        await project.background!.writeAsBytes(await request.read().expand((element) => element).toList());
      }
      await mongo.beaver.projects.modify(project.id, db.modify.set("background", project.background != null ? project.background!.path : "#null"));
      return ok("Background loaded");
    }
  };

  Future<Project> getProject(String id) async => Project.json((await mongo.beaver.projects.getById(db.ObjectId.fromHexString(id)))!);
}