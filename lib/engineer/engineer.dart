import 'dart:io';

import '../data/database.dart';
import '../http/engineer.dart';
import '../main.dart';

final String engineersPath = "${appDir}\\engineers";

class EngineerPlugin implements JsonMappable<Map<String, dynamic>> {

  late final EngineerHttp http = EngineerHttp(id);

  late final String id;

  late final String name;
  late final String description;

  EngineerPlugin(this.id, this.name, this.description);

  EngineerPlugin.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    name = json["name"];
    description = json["description"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "name": name,
    "description": description
  };

  Engineer get engineer => Engineer(this);

  String get dir => engineersPath + "\\" + id;
}

class Engineer implements JsonMappable<Map<String, dynamic>> {

  late final EngineerPlugin plugin;

  Map<String, dynamic> options = {};

  Engineer(this.plugin);

  Engineer.json(Map<String, dynamic> json) {
    this.json(json);
  }

  String get id => plugin.id;

  @override
  void json(Map<String, dynamic> json) {
    plugin = plugins[json["plugin"]]!;
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