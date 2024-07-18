import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:mongo_dart/mongo_dart.dart';
import 'package:uuid/uuid.dart';

String appDir = Platform.environment[Platform.isWindows ? "APPDATA" : "HOME"]! + "\\Beaver Architect";

const Uuid uuid = Uuid();

class BeaverMongo {

  final String path;

  final BeaverDatabase beaver = BeaverDatabase("beaver");

  BeaverMongo(this.path);

  Future<void> create() async {
    final configFile = File('$path\\mongod.conf');
    await configFile.create(recursive: true);
    await configFile.writeAsString('''
storage:
  dbPath: "${"$path\\data".replaceAll("\\", "\\\\")}"
net:
  bindIp: 127.0.0.1
  port: 8224
''');
    await Directory("$path\\data").create(recursive: true);
  }

  Future<void> open() async {
    if(!(await Directory("$path/data").exists())) {
      await create();
    }

    final result = await Process.start('mongod', ['--config', '$path\\mongod.conf']);
    result.stdout.transform(utf8.decoder).listen((data) {});
    result.stderr.transform(utf8.decoder).listen((data) {});

    await start();

    print("MongoDB started on port 8224");
  }

  Future<void> start({int timeoutSeconds = 30}) async {
    final completer = Completer<void>();
    final timeout = Duration(seconds: timeoutSeconds);
    final startTime = DateTime.now();

    Timer.periodic(Duration(seconds: 1), (timer) async {
      try {
        await beaver.open();

        timer.cancel();
        completer.complete();
      } catch (e) {
        if (DateTime.now().difference(startTime) > timeout) {
          timer.cancel();
          completer.completeError("Timeout while waiting for MongoDB to start");
        }
      }
    });

    return completer.future;
  }

  Future<void> close() async {
    final stopResult = await Process.run('mongod', ['--shutdown', '--config', '$path/mongod.conf']);
    print(stopResult.stdout);
    print(stopResult.stderr);
    print("MongoDB closed");
  }
}

abstract class Database {

  final String name;
  final String? prefix;

  final Db db;

  Database({required String name, String? prefix}) : name = name, prefix = prefix, db = Db("mongodb://localhost:8224/${prefix != null ? "$prefix-$name" : name}");

  String get path => prefix != null ? "$prefix#$name" : name;

  Future<void> open() async {
    await db.open();
  }

  Future<void> close() async {
    await db.close();
  }
}

class BeaverDatabase extends Database {

  BeaverDatabase(String name) : super(name: name);

  DbCollection get projects => db.collection("projects");

  DbCollection get plugins => db.collection("plugins");
}

class ProjectDatabase extends Database {

  ProjectDatabase(String name) : super(name: name, prefix: "project");

  DbCollection get structures => db.collection("structures");

  DbCollection get layers => db.collection("layers");
}

extension DatabaseCollection on DbCollection {

  Future<Map<String, dynamic>?> getById(id) async => findOne(where.id(id is String ? ObjectId.fromHexString(id) : id));

  Future<List<Map<String, dynamic>>> getByIds(List<ObjectId> ids, {Map<String, bool> sort = const {}, int? limit}) async {
    SelectorBuilder builder = where.oneFrom("_id", ids);
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

  Future<void> modify(id, ModifierBuilder builder) async => (await updateOne(where.id(id is String ? ObjectId.fromHexString(id) : id), builder));

  Future<void> modifyAll(List<ObjectId> ids, ModifierBuilder builder) async => await updateMany(where.all("_id", ids), builder);

  Future<bool> delete(id) async => (await deleteOne(where.id(id is String ? ObjectId.fromHexString(id) : id))).nRemoved > 0;

  Future<int> deleteAll(List<ObjectId> ids) async => (await deleteOne(where.all("_id", ids))).nRemoved;

  Future operator [](id) async => await getById(id);
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

  ObjectId get id;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
          other is Savable && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}