import 'dart:io';

import '../data/database.dart';
import '../http/engineer.dart';

final String engineersPath = "${appDir}engineers/";

class Engineer implements JsonWritable<Map<String, dynamic>> {

  late final EngineerHttp http = EngineerHttp(id);

  final String id;
  final String name;
  final File image;
  final File description;

  Engineer(this.id, this.name) : image = File(engineersPath + id + "image.png"), description = File(engineersPath + id + "description.md");

  @override
  Map<String, dynamic> toJson() => {
    "name": name,
    "image": image.path,
    "description": description.path
  };

  String get dir => engineersPath + id + "/";

  Future<void> load() async {
    await loadConfig(Directory("$engineersPath$id/config"));
    for(FileSystemEntity package in Directory("$engineersPath$id/packages").listSync()) {
      if(package is Directory) {
        await loadPackage(package);
      }
    }
  }

  Future<void> loadPackage(Directory package) async {
    await http.get("load", args: {"obj": "package", "dir": package.path});
  }

  Future<void> loadConfig(Directory config) async {
    await http.get("load", args: {"obj": "config", "dir": config.path});
  }
}