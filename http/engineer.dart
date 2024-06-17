import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shelf/src/response.dart';

import '../main.dart';
import 'common.dart';

class EngineerHttp extends CommonHttp {

  final String id;

  EngineerHttp(String id) : this.id = id, super("${api.url}/engineer/$id");

  Future<bool> updateOptions(String mode, Map<String, dynamic> options) async {
    return (await get("options", args: {"mode": mode, "value": options}))["status"];
  }

  Future<void> loadPackage(Directory package) async {
    await get("load", args: {"obj": "package", "dir": package.path});
  }

  Future<void> loadConfig(Directory config) async {
    await get("load", args: {"obj": "config", "dir": config.path});
  }

  @override
  Map<String, Response Function(Map<String, String> data)> get listeners => { };

  @override
  void fail(http.Response response) {
    // TODO: implement fail
  }

  @override
  void notFound(http.Response response) {
    // TODO: implement notFound
  }
}