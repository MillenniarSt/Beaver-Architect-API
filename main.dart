import 'dart:io';

import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'data/database.dart';

final BeaverArchitectDatabase database = BeaverArchitectDatabase(appDir, "database.db");

void main() async {
  if (Platform.isWindows || Platform.isLinux) {
    sqfliteFfiInit();
  }
  databaseFactory = databaseFactoryFfi;

  await database.open();
  await database.load();
}