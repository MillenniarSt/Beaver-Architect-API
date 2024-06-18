import 'dart:io';

import '../data/database.dart';
import 'area/area.dart';

final File defaultBackground = File("assets/background/default.png");

abstract class Builder implements Savable {

  @override
  late final String id;

  late String name;
  File? image;
  int opacity = 50;

  late Area area;

  Builder(this.name, this.area, {this.image, this.opacity = 30}) {
    id = uuid.v4();
  }

  Builder.json(Map<String, dynamic> json) {
    this.json(json);
  }

  Builder.late();

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    image = json["image"] == "#null" ? null : File(json["image"]);
    opacity = json["opacity"];
    area = jsonArea(json)!;
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "image": image == null ? "#null" : image!.path,
    "opacity": opacity,
    "area": area.toJson()
  };

  List<Builder> get childrenBuilders => [];
}