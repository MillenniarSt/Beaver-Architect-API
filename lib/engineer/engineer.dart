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
    id = json["_id"];
    identifier = json["identifier"];
    name = json["name"];
    description = json["description"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "_id": id,
    "identifier": identifier,
    "name": name,
    "description": description
  };

  Engineer get engineer => Engineer(id);

  String get dir => engineersPath + "\\" + id.oid;
}

class Engineer implements JsonMappable<Map<String, dynamic>> {

  late final ObjectId pluginId;

  Map<String, dynamic> options = {};

  Engineer(this.pluginId);

  Engineer.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    pluginId = json["plugin"];
    options = json["options"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "plugin": pluginId,
    "options": options
  };

  Future<EngineerPlugin> get plugin async => EngineerPlugin.json((await mongo.beaver.plugins.getById(pluginId))!);

  Future<void> load() async {
    EngineerPlugin plugin = await this.plugin;

    await plugin.http.loadConfig(Directory("$engineersPath/${plugin.identifier}/config"));
    for(FileSystemEntity package in Directory("$engineersPath/${plugin.identifier}/packages").listSync()) {
      if(package is Directory) {
        await plugin.http.loadPackage(package);
      }
    }
  }
}