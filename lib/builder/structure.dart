import 'package:mongo_dart/mongo_dart.dart' as db;

import '../data/database.dart';
import 'bbuilder.dart';
import 'layer.dart';

class Structure extends Builder {

  List<String> _layers = [];

  Structure(super.name, super.area, {super.opacity}) : super();

  Structure.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "layers": _layers
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    _layers = json["layers"];
  }

  Future<void> addLayer(Database database, Layer layer) async {
    _layers.add(layer.id);
    await database.structures.modify(id, db.modify.push("layers", layer.id));
    await database.layers.add(layer);
  }

  Future<bool> removeLayer(Database database, String id) async {
    _layers.remove(id);
    await database.structures.modify(id, db.modify.pull("layers", id));
    return await database.layers.delete(id);
  }
}