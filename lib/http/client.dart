
import 'package:http/http.dart' as http;

import 'common.dart';

ClientHttp localClient = ClientHttp.localHost(8226);

class ClientHttp extends ConnectionHttp {

  ClientHttp(super.address);

  ClientHttp.localHost(super.port) : super.localHost();

  @override
  void fail(http.Response response) {
    // TODO: implement fail
  }

  @override
  void notFound(http.Response response) {
    // TODO: implement notFound
  }
}