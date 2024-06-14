import 'package:http/htttp.dart' as http;

import '../data/database.dart';

class EngineerHttp {

  final String id;
  final String baseUrl;

  EngineerHttp(this.id, this.baseUrl);

  Future<dynamic> post(String url, data) async {
    if(data is JsonWritable) {
      data = json.toJson();
    }
    return await http.post(
        Uri.parse("$baseUrl/$url"), 
        headers: {"Content-Type": "application/json"},
        body: json.encode(data)
    );
  }

  void listen(String url, Function(Response) onReceived) {
    //TODO
  }
}