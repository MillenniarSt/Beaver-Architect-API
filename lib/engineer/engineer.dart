import 'dart:io';

import 'package:mongo_dart/mongo_dart.dart';

import '../data/database.dart';
import '../http/engineer.dart';
import '../main.dart';

final String engineersPath = "${appDir}\\engineers";

class EngineerPlugin implements Savable {

  late final EngineerHttp http = EngineerHttp(identifier);

  late final ObjectId id;

  late final String identifier;
  late final String name;
  late final String description;

  EngineerPlugin(this.identifier, this.name, this.description) {
    id = ObjectId();
  }

  EngineerPlugin.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    identifier = json["identifier"];
    name = json["name"];
    description = json["description"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "identifier": identifier,
    "name": name,
    "description": description
  };

  Engineer get engineer => Engineer(this);

  String get dir => engineersPath + "\\" + id.oid;
}

class Engineer implements JsonMappable<Map<String, dynamic>> {

  late final EngineerPlugin plugin;

  Map<String, dynamic> options = {};

  Engineer(this.plugin);

  Engineer.json(Map<String, dynamic> json) {
    this.json(json);
  }

  ObjectId get id => plugin.id;

  @override
  void json(Map<String, dynamic> json) {
    plugin = mongo.beaver.plugins[json["plugin"]]!;
    options = json["options"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "plugin": plugin.id,
    "options": options
  };

  Future<void> load() async {
    await plugin.http.loadConfig(Directory("$engineersPath$id/config"));
    for(FileSystemEntity package in Directory("$engineersPath$id/packages").listSync()) {
      if(package is Directory) {
        await plugin.http.loadPackage(package);
      }
    }
  }
}