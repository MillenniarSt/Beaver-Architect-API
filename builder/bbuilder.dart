import 'dart:io';

import 'package:flutter/material.dart';

import '../engineer/components.dart';
import '../data/database.dart';
import 'area/area.dart';

final FileImage defaultBackground = FileImage(File("assets/background/default.png"));

abstract class Builder implements Savable {

  @override
  late final String id;

  late String name;
  File? image;
  int opacity = 50;

  Builder(this.name, {this.image, this.opacity = 30}) {
    id = uuid.v4();
  }

  Builder.map(Map<String, dynamic> map) {
    this.map(map);
  }

  @override
  void map(Map<String, dynamic> map) {
    id = map["id"];
    image = map["image"] == "#null" ? null : File(map["image"]);
    opacity = map["opacity"];
  }

  @override
  Map<String, dynamic> toMap() => {
    "id": id,
    "image": image == null ? "#null" : image!.path,
    "opacity": opacity
  };

  List<Builder> get childrenBuilders => [];
}

abstract class MainBuilder extends Builder {

  late Area area;

  MainBuilder(super.name, this.area, {super.image, super.opacity}) : super();

  MainBuilder.map(super.map) : super.map();

  List<Component> get components;

  String get type;
}