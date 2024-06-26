import 'dart:io';

import 'package:mongo_dart/mongo_dart.dart';

import '../data/database.dart';
import '../world/area.dart';

final File defaultBackground = File("assets/background/default.png");

abstract class Builder implements Savable {

  @override
  late final ObjectId id;

  late String name;
  int opacity = 50;

  late Area area;

  Builder(this.name, this.area, {this.opacity = 30}) {
    id = ObjectId();
  }

  Builder.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["_id"];
    name = json["name"];
    opacity = json["opacity"];
    area = jsonArea(json["area"])!;
  }

  @override
  Map<String, dynamic> toJson() => {
    "_id": id,
    "name": name,
    "opacity": opacity,
    "area": area.toJson()
  };

  Map<String, dynamic> toJsonTile() => {
    "_id": id,
    "name": name,
    "opacity": opacity,
    "area": area.toJson()
  };
}