import 'dart:io';

import 'package:uuid/uuid.dart';

import '../builder/layer.dart';
import '../builder/project.dart';
import '../builder/structure.dart';
import '../engineer/engineer.dart';

String appDir = Platform.environment[Platform.isWindows ? "APPDATA" : "HOME"]! + "\\Beaver Architect";

const Uuid uuid = Uuid();

class BeaverArchitectDatabase {

  final File file;

  BeaverArchitectDatabase(this.file);

  Map<String, EngineerPlugin> engineers = {};

  late Project project;

  Map<String, Structure> structures = {};
  Map<String, Layer> layers = {};

  open() async {
    //TODO
  }

  close() async {
    await save();
    //TODO
  }

  load() async {
    //TODO
  }

  save() async {
    //TODO
  }
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

abstract class Savable extends JsonMappable<Map<String, dynamic>> {

  String get id;
}