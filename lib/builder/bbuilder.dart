import 'dart:io';

import 'package:mongo_dart/mongo_dart.dart';

import '../data/database.dart';
import '../world/area.dart';

final File defaultBackground = File("assets/background/default.png");

abstract class Builder<A extends Area> extends Savable {

  @override
  late final ObjectId id;

  late String name;

  late A area;

  Builder(this.name, this.area) {
    id = ObjectId();
  }

  Builder.late();

  Builder.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["_id"];
    name = json["name"];
    area = jsonArea(json["area"])! as A;
  }

  @override
  Map<String, dynamic> toJson() => {
    "_id": id,
    "name": name,
    "area": area.toJson()
  };
}