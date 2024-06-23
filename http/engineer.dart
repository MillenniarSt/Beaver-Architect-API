import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';
import 'package:shelf/src/response.dart';

import '../builder/project.dart';
import '../engineer/components.dart';
import '../engineer/engineer.dart';
import '../engineer/style.dart';
import '../main.dart';
import 'client.dart';
import 'common.dart';

class EngineerHttp extends ConnectionHttp {

  final String id;

  EngineerHttp(String id) : this.id = id, super("${server.baseUrl}/engineer/$id");

  Future<void> loadPackage(Directory package) async {
    await get("load", args: {"obj": "package", "dir": package.path});
  }

  Future<void> loadConfig(Directory config) async {
    await get("load", args: {"obj": "config", "dir": config.path});
  }

  Future<void> randomComponent(Component component, Style style) async {
    await post("component/random", {
      "component": component.toJson(),
      "style": style.toJson()
    });
  }

  Future<String> openWorksite(ClientHttp client, Style style, Map<String, dynamic> options) async {
    return (await post("worksite/open", {
      "client": client.baseUrl,
      "style": style.toJson(),
      "options": options
    }))["status"];
  }

  Future<void> closeWorksite(ClientHttp client) async {
    await post("worksite/close", {"client": client.baseUrl});
  }

  Future<void> buildComponent(Component component) async {
    await post("build", component.toJson());
  }

  @override
  void fail(http.Response response) {
    // TODO: implement fail
  }

  @override
  void notFound(http.Response response) {
    // TODO: implement notFound
  }
}