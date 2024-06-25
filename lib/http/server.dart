import 'dart:convert';
import 'dart:io';

import 'package:beaver_builder_api/http/project.dart';
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
    "/projects/list": (data) async => Response.ok(json.encode([for(Project project in projects.values) project.toJsonTile()]), headers: {"Content-Type": "application/json"}),
    "/projects/image": (data) async {
      File? image = projects[data["project"]]!.image;
      return image != null ? Response.ok(await image.readAsBytes(), headers: {"Content-Type": "image/${image.path.substring(image.path.lastIndexOf(".") +1)}"}) : Response.ok(null);
    },
    "/projects/background": (data) async {
      File? image = projects[data["project"]]!.background;
      return image != null ? Response.ok(await image.readAsBytes(), headers: {"Content-Type": "image/${image.path.substring(image.path.lastIndexOf(".") +1)}"}) : Response.ok(null);
    },
    "/projects/new": (_) async {
      Project? project;
      int i = 1;
      while(project == null) {
        if(!projects.containsKey("New Project${i == 1 ? "" : " $i"}")) {
          project = Project("New Project${i == 1 ? "" : " $i"}", Parallelepiped(Dimension(Pos3D.zero, Size3D(1000, 1000, 1000))));
        }
        i++;
      }
      projects[project.name] = project;
      return Response.ok(json.encode(project.toJsonTile()), headers: {"Content-Type": "application/json"});
    },
    "/projects/get": (data) async => projects[data["name"]] != null ? Response.ok(json.encode(projects[data["name"]]!.toJsonTile()), headers: {"Content-Type": "application/json"}) : Response.badRequest(body: "Project not Found"),
    "/projects/validate_name": (data) async => Response.ok(json.encode(projects[data["name"]] == null || projects[data["name"]]!.id == data["id"]), headers: {"Content-Type": "application/json"}),
    "/projects/open": (data) async {
      ProjectHttp http = ProjectHttp(projects[data["name"]]!, address, port);
      connect(http, "/project/${data["name"]}");
      await http.project.database.open();
      return Response.ok("Connected project ${http.project.name}");
    },
    "/projects/close": (data) async {
      ProjectHttp http = connected["/project/${data["name"]}"]! as ProjectHttp;
      await http.project.database.close();
      disconnect("/project/${data["name"]}");
      return Response.ok("Disconnected project ${http.project.name}");
    }
  };

  Map<String, Future<Response> Function(Request request)> get requests => {
    "/projects/change_image": (request) async {
      Project project = projects[request.url.queryParameters["project"]]!;
      if(project.image != null) {
        await project.image!.delete();
      }
      if(request.url.queryParameters["remove"] != "true") {
        project.image = File("${project.dir}/image.${request.headers["content-type"]!.substring(6)}");
        await project.image!.create(recursive: true);
        await project.image!.writeAsBytes(await request.read().expand((element) => element).toList());
      }
      return Response.ok("Image loaded");
    },
    "/projects/change_background": (request) async {
      Project project = projects[request.url.queryParameters["project"]]!;
      if(project.background != null) {
        await project.background!.delete();
      }
      if(request.url.queryParameters["remove"] != "true") {
        project.background = File("${project.dir}/background.${request.headers["content-type"]!.substring(6)}");
        await project.background!.create(recursive: true);
        await project.background!.writeAsBytes(await request.read().expand((element) => element).toList());
      }
      return Response.ok("Image loaded");
    }
  };
}