import 'dart:io';

import '../data/database.dart';
import '../world/area.dart';

final File defaultBackground = File("assets/background/default.png");

abstract class Builder implements Savable {

  @override
  late final String id;

  late String name;
  int opacity = 50;

  late Area area;

  Builder(this.name, this.area, {this.opacity = 30}) {
    id = uuid.v4();
  }

  Builder.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    name = json["name"];
    opacity = json["opacity"];
    area = jsonArea(json)!;
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "name": name,
    "opacity": opacity,
    "area": area.toJson()
  };

  Map<String, dynamic> toJsonTile() => {
    "id": id,
    "name": name,
    "opacity": opacity,
    "area": area.toJson()
  };
}