import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shelf/src/response.dart';

import '../data/database.dart';
import '../main.dart';
import 'common.dart';

ClientHttp localClient = ClientHttp("${api.url}/local_client");

class ClientHttp extends CommonHttp {

  ClientHttp(super.baseUrl);

  @override
  Map<String, Response Function(Map<String, String> data)> get listeners => {

  };

  @override
  void fail(http.Response response) {
    // TODO: implement fail
  }

  @override
  void notFound(http.Response response) {
    // TODO: implement notFound
  }
}