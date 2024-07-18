import 'package:mongo_dart/mongo_dart.dart' as db;

import '../world/area.dart';
import 'bbuilder.dart';

class Structure extends Builder<Parallelepiped> {

  //Properties from the database, they will not be updated
  late final List<db.ObjectId> layers;

  Structure(super.name, super.area) : layers = [];

  Structure.json(super.json) : super.json();

  Structure.paste(Map<String, dynamic> json) : super.late() {
    paste(json);
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "layers": layers
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    layers = List.generate(json["layers"].length, (index) => json["layers"][index]);
  }

  void paste(Map<String, dynamic> json) {
    id = db.ObjectId.fromHexString(json["_id"]);
    name = json["name"];
    area = Parallelepiped.json(json["area"]);
    layers = List.generate(json["layers"].length, (index) => db.ObjectId.fromHexString(json["layers"][index]["_id"]));
  }
}