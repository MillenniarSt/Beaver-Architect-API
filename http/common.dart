import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';

import '../builder/project.dart';
import '../data/database.dart';
import '../main.dart';
import '../world/area.dart';
import '../world/world3D.dart';
import 'project.dart';

abstract class CommonHttp {

  final String address;
  int port;

  CommonHttp(this.address, this.port);

  CommonHttp.url(this.address) : port = 8080;

  CommonHttp.localHost(this.port) : address = "localhost";

  bool get isLocal => address == "localhost";

  String get baseUrl => isLocal ? "http://$address:$port" : address;
}

abstract class ConnectionHttp extends CommonHttp {

  ConnectionHttp(super.address) : super.url();

  ConnectionHttp.localHost(super.port) : super.localHost();

  Future<dynamic> get(String url, {Map<String, dynamic> args = const {}, Function(http.Response)? fail, Function(http.Response)? notFound}) async {
    List<String> arguments = [];
    for(String key in args.keys) {
      arguments.add("$key=${args[key]}");
    }
    http.Response response = await http.get(Uri.parse("$baseUrl/$url" + (arguments.isEmpty ? "" : "?${arguments.join("&")}")));
    if(response.statusCode == 200) {
      return json.decode(response.body);
    } else if(response.statusCode == 404) {
      if(notFound != null) {
        return notFound.call(response);
      } else {
        this.notFound(response);
      }
    } else {
      if(fail != null) {
        return fail.call(response);
      } else {
        this.fail(response);
      }
    }
  }

  Future<dynamic> post(String url, data, {Function(http.Response)? fail, Function(http.Response)? notFound}) async {
    if(data is JsonWritable) {
      data = data.toJson();
    }
    http.Response response = await http.post(
        Uri.parse("$baseUrl/$url"),
        headers: {"Content-Type": "application/json"},
        body: json.encode(data)
    );
    if(response.statusCode == 200) {
      return json.decode(response.body);
    } else if(response.statusCode == 404) {
      if(notFound != null) {
        return notFound.call(response);
      } else {
        this.notFound(response);
      }
    } else {
      if(fail != null) {
        return fail.call(response);
      } else {
        this.fail(response);
      }
    }
  }

  void fail(http.Response response);

  void notFound(http.Response response);
}

class ServerHttp extends CommonHttp {

  final Map<String, ProjectHttp> https = {};

  ServerHttp(super.address, super.port);

  ServerHttp.localHost(super.port) : super.localHost();

  void open() async {
    final handler = const Pipeline()
        .addMiddleware(logRequests())
        .addHandler(_router);

    final server = await serve(handler, address, port);
    print('Server listening on port ${server.port}');
  }

  Future<Response> _router(Request request) async {
    try {
      if(request.requestedUri.path.substring(1, 9) == "project/") {
        for (ProjectHttp project in https.values) {
          final listener = project.listeners[request.requestedUri.path.substring(9 + project.project.name.length)];
          if (listener != null) {
            if (request.method == 'POST') {
              final data = json.decode(await request.readAsString());
              return await listener.call(data);
            } else {
              return await listener.call(request.url.queryParameters);
            }
          }
        }
      } else {
        final listener = listeners[request.requestedUri.path];
        if(listener != null) {
          if(request.method == 'POST') {
            final data = json.decode(await request.readAsString());
            return await listener.call(data);
          } else {
            return await listener.call(request.url.queryParameters);
          }
        }
      }
    } catch(e, s) {
      return Response.badRequest(body: {
        "message": "An error occurred on the server",
        "request": request.requestedUri.path,
        "error": e.toString(),
        "stacktrace": s.toString()
      });
    }
    return Response.notFound("Destination URL Not Found: ${request.requestedUri.path}");
  }

  Map<String, Future<Response> Function(Map<String, dynamic> data)> get listeners => {
    "/projects/list": (data) async => Response.ok(json.encode([for(Project project in projects.values) project.toJsonTile()]), headers: {"Content-Type": "application/json"}),
    "/projects/image": (data) async => projects[data["project"]]!.image != null ? Response.ok(await projects[data["project"]]!.image!.readAsBytes(), headers: {"Content-Type": "image/png"}) : Response.ok(null),
    "/projects/background": (data) async => projects[data["project"]]!.background != null ? Response.ok(await projects[data["project"]]!.background!.readAsBytes(), headers: {"Content-Type": "image/png"}) : Response.ok(null),
    "/projects/new": (_) async => Response.ok(json.encode(Project("New Project", Parallelepiped(Dimension(Pos3D.zero, Size3D(1000, 1000, 1000)))).toJsonTile()), headers: {"Content-Type": "application/json"}),
    "/projects/get": (data) async => projects[data["name"]] != null ? Response.ok(json.encode(projects[data["name"]]!.toJsonTile()), headers: {"Content-Type": "application/json"}) : Response.badRequest(body: "Project not Found"),
    "/projects/validate_name": (data) async => Response.ok(json.encode(projects[data["name"]] == null || projects[data["name"]]!.id == data["id"]), headers: {"Content-Type": "application/json"}),
    "/projects/open": (data) async {
      ProjectHttp http = ProjectHttp(projects[data["name"]]!);
      await http.project.database.open();
      https[http.project.name] = http;
      return Response.ok("Connected project ${http.project.name}");
    },
    "/projects/close": (data) async {
      ProjectHttp http = https.remove(data["name"])!;
      await http.project.database.close();
      return Response.ok("Disconnected project ${http.project.name}");
    }
  };

  @override
  set port(int value) {
    super.port = value;
    open();
  }
}