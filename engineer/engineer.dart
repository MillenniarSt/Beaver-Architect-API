import 'dart:io';

import '../data/database.dart';
import '../http/engineer.dart';
import '../main.dart';

final String engineersPath = "${appDir}\\engineers";

class EngineerPlugin implements Savable {

  late final EngineerHttp http = EngineerHttp(id);

  late final String id;
  late final String name;
  late final File image;
  late final File description;

  EngineerPlugin(this.id, this.name) : image = File(engineersPath + "\\" + id + "\\image.png"), description = File(engineersPath + "\\" + id + "\\description.md");

  EngineerPlugin.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    name = json["name"];
    image = File(engineersPath + "\\" + id + "\\image.png");
    description = File(engineersPath + "\\" + id + "\\description.md");
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "name": name
  };

  Engineer get engineer => Engineer(this);

  String get dir => engineersPath + "\\" + id;
}

class Engineer implements Savable {

  late final EngineerPlugin plugin;

  Map<String, dynamic> _options = {};

  Engineer(this.plugin);

  Engineer.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  String get id => plugin.id;

  @override
  void json(Map<String, dynamic> json) {
    plugin = database.engineers[json["plugin"]]!;
    _options = json["options"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "plugin": plugin.id,
    "options": _options
  };

  Future<void> load() async {
    await plugin.http.updateOptions("set", _options);
    await plugin.http.loadConfig(Directory("$engineersPath$id/config"));
    for(FileSystemEntity package in Directory("$engineersPath$id/packages").listSync()) {
      if(package is Directory) {
        await plugin.http.loadPackage(package);
      }
    }
  }

  operator [](String key) => _options[key];

  void operator []=(String key, value) {
    _options[key] = value;
    plugin.http.updateOptions("push", {key: value});
  }
}