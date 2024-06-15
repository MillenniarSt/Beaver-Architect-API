import 'dart:io';

import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'data/database.dart';
import 'http/client.dart';
import 'http/common.dart';

API api = API.localHost(2525)..connectClient(localClient);

final BeaverArchitectDatabase database = BeaverArchitectDatabase(File("$appDir/database.db"));

void main() async {
  if (Platform.isWindows || Platform.isLinux) {
    sqfliteFfiInit();
  }
  databaseFactory = databaseFactoryFfi;

  await database.open();
  await database.load();
}