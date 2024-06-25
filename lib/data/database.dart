import 'dart:convert';
import 'dart:io';

import 'package:mongo_dart/mongo_dart.dart';
import 'package:uuid/uuid.dart';

String appDir = Platform.environment[Platform.isWindows ? "APPDATA" : "HOME"]! + "\\Beaver Architect";

const Uuid uuid = Uuid();

class Database {

  final String projectName;

  final Db db;

  Database(String projectName) : projectName = projectName, db = Db("mongodb://localhost:8227/$projectName");

  String get dir => "$appDir\\projects\\$projectName";

  Future<void> create() async {
    final configFile = File('$dir\\mongod.conf');
    await configFile.create(recursive: true);
    await configFile.writeAsString('''
storage:
  dbPath: "$dir\\data"
''');
  }

  Future<void> open() async {
    if(!(await File("$dir/mongod.conf").exists())) {
      await create();
    }

    final result = await Process.start('mongod', ['--config', '$dir\\mongod.conf']);
    result.stdout.transform(utf8.decoder).listen((data) {
      print(data);
    });
    result.stderr.transform(utf8.decoder).listen((data) {
      print('stderr: $data');
    });
    await db.open();
  }

  close() async {
    await db.close();
    final stopResult = await Process.run('mongod', ['--shutdown', '--config', '$dir/mongod.conf']);
    print(stopResult.stdout);
    print(stopResult.stderr);
  }

  DbCollection get structures => db.collection("structures");

  DbCollection get layers => db.collection("layers");
}

extension DatabaseCollection on DbCollection {

  Future<Map<String, dynamic>?> getById(String id) async => findOne(where.id(ObjectId.fromHexString(id)));

  Future<List<Map<String, dynamic>>> getByIds(List<String> ids, {Map<String, bool> sort = const {}, int? limit}) async {
    SelectorBuilder builder = where.all("_id", ids);
    for(String key in sort.keys) {
      builder.sortBy(key, descending: !sort[key]!);
    }
    if(limit != null) {
      builder.limit(limit);
    }
    return (await find(builder)).toList();
  }

  Future<List<Map<String, dynamic>>> getAll({Map<String, bool> sort = const {}, int? limit}) async {
    SelectorBuilder builder = SelectorBuilder();
    for(String key in sort.keys) {
      builder.sortBy(key, descending: !sort[key]!);
    }
    if(limit != null) {
      builder.limit(limit);
    }
    return (await find(builder)).toList();
  }

  Future<void> add(Savable savable) async => await insertOne(savable.toJson());

  Future<void> addAll(List<Savable> savable) async => await insertMany(List.generate(savable.length, (index) => savable[index].toJson()));

  Future<void> modify(String id, ModifierBuilder builder) async => await updateOne(where.id(ObjectId.fromHexString(id)), builder);

  Future<void> modifyAll(List<String> ids, ModifierBuilder builder) async => await updateMany(where.all("_id", ids), builder);

  Future<bool> delete(String id) async => (await deleteOne(where.id(ObjectId.fromHexString(id)))).nRemoved > 0;

  Future<int> deleteAll(List<String> ids) async => (await deleteOne(where.all("_id", ids))).nRemoved;

  Future operator [](String id) async => await getById(id);
}

abstract class JsonReadable<T> {

  void json(T json);
}

abstract class JsonWritable<T> {

  T toJson();

  @override
  String toString() => toJson().toString();
}

abstract class JsonMappable<T> implements JsonReadable<T>, JsonWritable<T> { }

abstract class Savable implements JsonMappable<Map<String, dynamic>> {

  String get id;
}