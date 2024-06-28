import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';

import '../data/database.dart';

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

abstract class ServerConnectionHttp extends CommonHttp {

  HttpServer? server;

  Map<String, ServerConnectionHttp> connected = {};

  ServerConnectionHttp(super.address, super.port);

  ServerConnectionHttp.localHost(super.port) : super.localHost();

  Future<void> open() async {
    final handler = const Pipeline()
        .addMiddleware(logRequests())
        .addHandler(router);

    server = await serve(handler, address, port);
    print('Server listening on port ${server!.port}');
  }

  Future<void> close() async {
    if(server != null) {
      await server!.close(force: true);
    }
  }

  void connect(ServerConnectionHttp server, String prefix) {
    connected[prefix] = server;
  }

  void disconnect(String prefix) {
    connected.remove(prefix);
  }

  Future<Response> router(Request request) async {
    String path = request.requestedUri.path;
    try {
      for(String prefix in connected.keys) {
        if(path.indexOf(prefix) == 0) {
          if(request.method == 'GET' || request.headers["content-type"]!.contains("application/json")) {
            final listener = connected[prefix]!.listeners[path.substring(prefix.length)];
            if(listener != null) {
              if(request.method == 'POST') {
                final data = json.decode(await request.readAsString());
                return await listener.call(data);
              } else {
                return await listener.call(request.url.queryParameters);
              }
            }
          } else {
            final listener = connected[prefix]!.requests[path.substring(prefix.length)];
            if(listener != null) {
              return await listener.call(request);
            }
          }
        }
      }

      if(request.method == 'GET' || request.headers["content-type"]!.contains("application/json")) {
        final listener = listeners[path];
        if(listener != null) {
          if(request.method == 'POST') {
            final data = json.decode(await request.readAsString());
            return await listener.call(data);
          } else {
            return await listener.call(request.url.queryParameters);
          }
        }
      } else {
        final listener = requests[path];
        if(listener != null) {
          return await listener.call(request);
        }
      }
    } catch(e, s) {
      return error("An error occurred on the server", error: e, stacktrace: s);
    }
    return Response.notFound(json.encode({"error_message": "Destination URL Not Found: ${request.requestedUri.path}"}), headers: {"Content-Type": "application/json"});
  }

  Response ok(body) => Response.ok(json.encode(body is JsonWritable ? body.toJson() : body), headers: {"Content-Type": "application/json"});

  Response error(String message, {Object? error, StackTrace? stacktrace}) => Response.badRequest(body: json.encode({
    "error_message": message,
    "error": error != null ? error.toString() : "Unspecified exception on the server",
    "stacktrace": stacktrace != null ? stacktrace.toString() : ""
  }), headers: {"Content-Type": "application/json"});

  Map<String, Future<Response> Function(Map<String, dynamic> data)> get listeners;

  Map<String, Future<Response> Function(Request request)> get requests;

  @override
  set port(int value) {
    super.port = value;
    open();
  }
}