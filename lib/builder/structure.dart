import 'package:beaver_builder_api/builder/project.dart';
import 'package:beaver_builder_api/world/area.dart';
import 'package:mongo_dart/mongo_dart.dart' as db;

import '../data/database.dart';
import 'bbuilder.dart';
import 'layer.dart';

class Structure extends Builder<Parallelepiped> {

  //Properties from the database, they will not be updated
  late final List<db.ObjectId> layers;

  Structure(super.name, super.area) : layers = [];

  Structure.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "layers": layers
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    layers = List.generate(json["layers"].length, (index) => db.ObjectId.fromHexString(json["layers"][index]));
  }
}