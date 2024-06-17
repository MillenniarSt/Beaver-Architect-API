import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';

import '../data/database.dart';
import 'client.dart';

abstract class CommonHttp {
  
  final String baseUrl;
  late final Map<String, Response Function(Map<String, String> data)> handler = listeners;

  CommonHttp(this.baseUrl);

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
        print("GET error 404 \"page not found\": $baseUrl/$url" + (arguments.isEmpty ? "" : "?${arguments.join("&")}"));
        this.notFound(response);
      }
    } else {
      if(fail != null) {
        return fail.call(response);
      } else {
        print("GET error ${response.statusCode}: $baseUrl/$url" + (arguments.isEmpty ? "" : "?${arguments.join("&")}"));
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
        print("POST error 404 \"page not found\": $baseUrl/$url\n" + response.body);
        this.notFound(response);
      }
    } else {
      if(fail != null) {
        return fail.call(response);
      } else {
        print("POST error ${response.statusCode}: $baseUrl/$url\n" + response.body);
        this.fail(response);
      }
    }
  }

  void listen(String url, Response Function(Map<String, String> data) response) {
    handler[url] = response;
  }

  void fail(http.Response response);

  void notFound(http.Response response);

  Map<String, Response Function(Map<String, String> data)> get listeners;
}

class API {

  final String address;
  int _port;

  final List<CommonHttp> https = [];
  final List<ClientHttp> clients = [];

  API(this.address, this._port);

  API.localHost(this._port) : address = "localhost";

  void open() async {
    final handler = const Pipeline()
        .addMiddleware(logRequests())
        .addHandler(_router);

    final server = await serve(handler, address, _port);
    print('Server listening on port ${server.port}');
  }

  Future<Response> _router(Request request) async {
    try {
      for(CommonHttp http in https) {
        for(String url in http.handler.keys) {
          if(request.requestedUri.path == url) {
            if(request.method == 'POST') {
              final data = json.decode(await request.readAsString());
              return http.handler[url]!.call(data);
            } else {
              return http.handler[url]!.call(request.url.queryParameters);
            }
          }
        }
      }
      if(request.requestedUri.path == "connect/client") {
        ClientHttp client = ClientHttp(request.url.queryParameters["url"]!);
        connectClient(client);
        return Response.ok({"message": "connect client successfully"});
      }
    } catch(e, s) {
      return Response.badRequest(body: {
        "message": "An error occurred on the server",
        "request": request.requestedUri.path,
        "error": e.toString(),
        "stacktrace": s.toString()
      });
    }
    return Response.notFound({"message": "Destination URL Not Found"});
  }

  void connectClient(ClientHttp client) {
    clients.add(client);
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

  String get url => address == "localhost" ? "http://$address:$port" : address;

  int get port => _port;

  set port(int value) {
    _port = value;
    open();
  }
}