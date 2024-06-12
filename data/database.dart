import 'dart:io';

import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../builder/area/area.dart';
import '../builder/area/area2D.dart';
import '../builder/layer.dart';
import '../builder/project.dart';
import '../builder/structure.dart';

String appDir = Platform.environment[Platform.isWindows ? "APPDATA" : "HOME"]! + "\\Beaver Architect\\";

const Uuid uuid = Uuid();

class BeaverArchitectDatabase {

  late final Database _database;
  final String path;
  final String name;

  late Project project;

  final Map<String, Savable> _loaded = {};

  BeaverArchitectDatabase(this.path, this.name);

  static _create(Database db) async {
    await db.execute("CREATE TABLE project(id TEXT PRIMARY KEY, name TEXT, image TEXT, opacity INTEGER, builders TEXT, centerX INTEGER, centerZ INTEGER, centerY INTEGER, posX INTEGER, posZ INTEGER, posY INTEGER, width INTEGER, length INTEGER, height INTEGER)");
    await db.execute("CREATE TABLE structures(id TEXT PRIMARY KEY, name TEXT, image TEXT, opacity INTEGER, layers TEXT)");
    await db.execute("CREATE TABLE layers(id TEXT PRIMARY KEY, name TEXT, image TEXT, opacity INTEGER, areas TEXT)");
    await db.execute("CREATE TABLE subLayers(id TEXT PRIMARY KEY, name TEXT, areas TEXT, behaviors TEXT)");
    await db.execute("CREATE TABLE areas(id TEXT PRIMARY KEY, type TEXT, name TEXT, color INTEGER, image TEXT, posX INTEGER, posZ INTEGER, posY INTEGER, width INTEGER, length INTEGER, height INTEGER, data TEXT)");
    await db.execute("CREATE TABLE areas2D(id TEXT PRIMARY KEY, type TEXT, name TEXT, color INTEGER, image TEXT, posX INTEGER, posZ INTEGER, width INTEGER, length INTEGER, data TEXT)");
  }

  open() async {
    _database = await openDatabase(
      join(path, name),
      onCreate: (db, version) async => await _create(db),
      version: 1,
    );
  }

  close() async {
    await save();
    await _database.close();
  }

  load() async {
    for(List<Registry> registries in Registry.registries.values) {
      for(Registry registry in registries) {
        List<Map<String, dynamic>> maps = await _database.query(registry.map);
        for(Map<String, dynamic> map in maps) {
          _loaded[map["id"]] = registry.getter[map["type"]]!.call(map);
        }
      }
    }
    List<Map<String, dynamic>> projectMap = await _database.query("project");
    project = projectMap.isEmpty ? Project("Project") : Project.map(projectMap.first);

    _loaded.clear();
  }

  save() async {
    await _database.delete("structures");
    await _database.delete("layers");
    await _database.delete("subLayers");
    await _database.delete("areas");
    await _database.delete("areas2D");
    await _create(_database);

    await _database.insert(project.mapId, project.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    for(Savable savable in project.childrenToMap) {
      await _saveChildren(savable);
    }
  }

  _saveChildren(Savable savable) async {
    await _database.insert(savable.mapId, savable.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    for(Savable child in savable.childrenToMap) {
      await _saveChildren(child);
    }
  }

  S getSavable<S extends Savable>(String id) => _loaded[id]! as S;
}

abstract class JsonReadable<T> {

  void json(T json);
}

abstract class JsonWritable<T> {

  T toJson();
}

abstract class JsonMappable<T> implements JsonReadable<T>, JsonWritable<T> {

}

abstract class Mappable {

  Map<String, dynamic> toMap();

  void map(Map<String, dynamic> map);
}

abstract class Savable extends Mappable {

  String get id;

  String get mapId;

  List<Savable> get childrenToMap;
}

class Registry<T extends Savable> {

  static final Map<int, List<Registry>> _registries = {
    12: [Registry<Area2D>.multiple("areas2D", {"rectangle": (map) => Rectangle.map(map), "ellipse": (map) => Ellipse.map(map), "polygon": (map) => Polygon.map(map)})],

    11: [Registry<Area>.multiple("areas", {"parallelepiped": (map) => Parallelepiped.map(map), "prism": (map) => Prism.map(map)})],

    2: [Registry<SubLayer>("subLayers", (map) => SubLayer.map(map))],

    1: [Registry<Layer>("layers", (map) => Layer.map(map))],

    0: [Registry<Structure>("structures", (map) => Structure.map(map))],
  };

  final String map;
  late final Map<String?, T Function(Map<String, dynamic> map)> getter;

  Registry(this.map, T Function(Map<String, dynamic> map) getter) {
    this.getter = {null: getter};
  }

  Registry.multiple(this.map, this.getter);

  void register(int weigh) {
    _registries.putIfAbsent(weigh, () => []);
    _registries[weigh]!.add(this);
  }

  static Map<int, List<Registry>> get registries => _registries;
}