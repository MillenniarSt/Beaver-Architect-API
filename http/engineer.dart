import 'package:shelf/shelf.dart';

import '../data/database.dart';

class EngineerHttp {

  final String id;

  EngineerHttp(this.id);

  Future<void> send(String url, json) async {
    if(json is JsonWritable) {
      json = json.toJson();
    }
    //TODO
  }

  Future<dynamic> get(String url, json) async {
    if(json is JsonWritable) {
      json = json.toJson();
    }
    //TODO
    throw UnimplementedError();
  }

  void listen(String url, Function(Response) onReceived) {
    //TODO
  }
}