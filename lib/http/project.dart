import 'package:beaver_builder_api/http/common.dart';
import 'package:beaver_builder_api/main.dart';
import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';

import '../builder/project.dart';
import 'client.dart';

class ProjectHttp extends ServerConnectionHttp {

  final String name;

  final List<ClientHttp> clients = [];

  ProjectHttp(this.name) : super(server.address, server.port);

  ProjectHttp.localHost(this.name, super.port, ClientHttp local) : super.localHost() {
    clients.add(local);
  }

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
      if(isLocal) {
        //TODO
        return error("Unimplemented feature");
      } else {
        clients.add(ClientHttp(data["address"]));
        return Response.ok("Connected client successfully");
      }
    },
    "/disconnect": (data) async {
      clients.remove(ClientHttp(data["address"]));
      return Response.ok("Disconnected client successfully");
    }
  };

  @override
  Map<String, Future<Response> Function(Request request)> get requests => {

  };

  Project get project => mongo.beaver.projects[name]!;
}