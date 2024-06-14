abstract class CommonHttp {
  
  final String baseUrl;
  final Map<String, Response Function(Map<String, dynamic> data)> handler = [];

  CommonHttp(this.baseUrl);

  Future<dynamic> get(String url, {fail: Function(Response)?, notFound: Function(Response)?});

  Future<dynamic> post(String url, data, {fail: Function(Response)?, notFound: Function(Response)?});

  void listen(String url, Response Function(Map<String, dynamic> data) response) {
    handler[url] = Response;
  }
}