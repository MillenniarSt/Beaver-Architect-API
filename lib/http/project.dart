import 'package:beaver_builder_api/builder/structure.dart';
import 'package:beaver_builder_api/data/database.dart';
import 'package:beaver_builder_api/http/common.dart';
import 'package:beaver_builder_api/main.dart';
import 'package:beaver_builder_api/world/area.dart';
import 'package:beaver_builder_api/world/world3D.dart';
import 'package:mongo_dart/mongo_dart.dart' as db;
import 'package:shelf/shelf.dart';

import '../builder/layer.dart';
import '../builder/project.dart';
import 'client.dart';

class ProjectHttp extends ServerConnectionHttp {

  final Project project;

  final List<ClientHttp> clients = [];

  ProjectHttp(this.project) : super(server.address, server.port);

  ProjectHttp.localHost(this.project, super.port, ClientHttp local) : super.localHost() {
    clients.add(local);
  }

  void getToAllClient(String url, {Map<String, dynamic>? args}) {
    for(ClientHttp client in clients) {
      client.get(url, args: args ?? {});
    }
  }

  void postToAllClient(String url, data) {
    for(ClientHttp client in clients) {
      client.post(url, data);
    }
  }

  Map<String, Future<Response> Function(Map<String, dynamic> data)> get listeners => {
    "/connect": (data) async {
      if(isLocal) {
        //TODO
        return error("Unimplemented feature");
      } else {
        clients.add(ClientHttp(data["address"]));
        return ok("Connected client successfully");
      }
    },
    "/disconnect": (data) async {
      clients.remove(ClientHttp(data["address"]));
      if(clients.isEmpty) {
        await project.close(host: baseUrl);
      }
      return ok("Disconnected client successfully");
    },
    "/project/get": (data) async => ok(project),
    "/structure/list": (data) async => ok(await project.database.structures.getAll()),
    "/structure/get": (data) async => ok(await project.database.structures.getById(data["id"])),
    "/structure/new": (data) async {
      Structure structure = Structure("Structure", Parallelepiped(Dimension(Pos3D.json(data["pos"]), Size3D(10, 10, 10)).inside(project.area.dimension)!));
      await mongo.beaver.projects.modify(project.id, db.modify.push("structures", structure.id));
      await project.database.structures.add(structure);
      postToAllClient("structure/add", structure);
      return ok("Structure added");
    },
    "/structure/delete": (data) async {
      await mongo.beaver.projects.modify(project.id, db.modify.pull("structures", data["id"]));
      await project.database.structures.delete(data["id"]);
      getToAllClient("structure/remove", args: data);
      return ok("Structure deleted");
    },
    "/layer/list": (data) async => ok(await project.database.layers.getByIds(Structure.json((await project.database.structures.getById(data["structure"]))!).layers)),
    "/layer/get": (data) async => ok(await project.database.layers.getById(data["id"])),
    "/layer/new": (data) async {
      Layer layer = Layer("Layer", Parallelepiped(Dimension(Pos3D.json(data["pos"]), Size3D(10, 10, 10)).inside(project.area.dimension)!));
      await project.database.structures.modify(data["structure"], db.modify.push("layers", layer.id));
      await project.database.layers.add(layer);
      postToAllClient("layer/add", layer.toJson()..["structure"] = data["structure"]);
      return ok("Layer added");
    },
    "/layer/remove": (data) async {
      await project.database.structures.modify(data["structure"], db.modify.pull("layers", data["id"]));
      await project.database.layers.delete(data["id"]);
      getToAllClient("layer/remove", args: data);
      return ok("Layer deleted");
    },

    "/builder/get": (data) async {
      switch(data["type"]) {
        case "project": return ok(await mongo.beaver.projects.getById(data["id"]));
        case "structure": return ok(await project.database.structures.getById(data["id"]));
        case "layer": return ok(await project.database.layers.getById(data["id"]));
      }
      return error("Cannot get builder, invalid type: ${data["type"]}");
    },
    "/builder/new": (data) async {
      switch(data["parent_type"]) {
        case "project":
          if(data["type"] == "structure") {
            Structure structure = Structure("Structure", Parallelepiped(Dimension(Pos3D(0, 0, 0), Size3D(10, 10, 10))));
            return ok(structure.toJson());
          }
        case "structure": return ok(await project.database.layers.getById(data["id"]));
      }
      return error("Cannot get builder, invalid type: ${data["type"]}");
    },

  };

  @override
  Map<String, Future<Response> Function(Request request)> get requests => {

  };
}