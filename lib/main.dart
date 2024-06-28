import 'package:beaver_builder_api/data/database.dart';

import 'http/server.dart';

ServerHttp server = ServerHttp.localHost(8225);

BeaverMongo mongo = BeaverMongo(appDir);

void main() async {
  await start();
}

Future<void> start() async {
  await mongo.open();

  await server.open();
}

Future<void> stop() async {
  await mongo.close();

  await server.close();
}