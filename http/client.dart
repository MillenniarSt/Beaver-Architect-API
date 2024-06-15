import 'dart:convert';

import 'package:http/http.dart' as http;

import '../data/database.dart';
import '../main.dart';
import 'common.dart';

ClientHttp localClient = ClientHttp("${api.url}/local_client");

class ClientHttp extends CommonHttp {

  ClientHttp(super.baseUrl);

  @override
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
        //TODO
      }
    } else {
      if(fail != null) {
        return fail.call(response);
      } else {
        //TODO
      }
    }
  }

  @override
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
        //TODO
      }
    } else {
      if(fail != null) {
        return fail.call(response);
      } else {
        //TODO
      }
    }
  }
}