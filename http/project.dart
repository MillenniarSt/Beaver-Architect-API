import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';

import '../builder/project.dart';
import 'client.dart';

class ProjectHttp {

  final Project project;

  final List<ClientHttp> clients = [];

  ProjectHttp(this.project);

  void postToAllClient(String url, data, {Function(http.Response)? fail, Function(http.Response)? notFound}) {
    for(ClientHttp client in clients) {
      client.post(url, data, fail: fail, notFound: notFound);
    }
  }

  void getToAllClient(String url, {Map<String, dynamic>? args, Function(http.Response)? fail, Function(http.Response)? notFound}) {
    for(ClientHttp client in clients) {
      client.get(url, args: args ?? {}, fail: fail, notFound: notFound);
    }
  }

  Map<String, Future<Response> Function(Map<String, dynamic> data)> get listeners => {
    "/connect": (data) async {
      clients.add(ClientHttp(data["address"]));
      return Response.ok("Connected client successfully");
    },
    "/disconnect": (data) async {
      clients.remove(ClientHttp(data["address"]));
      return Response.ok("Disconnected client successfully");
    },
    "/image": (_) async => project.image != null ? Response.ok(await project.image!.readAsBytes(), headers: {"Content-Type": "image/png"}) : Response.ok(null),
    "/background": (_) async => project.background != null ? Response.ok(await project.background!.readAsBytes(), headers: {"Content-Type": "image/png"}) : Response.ok(null)
  };
}