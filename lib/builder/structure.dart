import 'package:beaver_builder_api/builder/project.dart';
import 'package:mongo_dart/mongo_dart.dart' as db;

import '../data/database.dart';
import 'bbuilder.dart';
import 'layer.dart';

class Structure extends Builder {

  //Properties from the database, they will not be updated
  late final List<db.ObjectId> layers;

  Structure(super.name, super.area) : super();

  Structure.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "layers": layers
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    layers = json["layers"];
  }

  Future<void> addLayer(Project project, Layer layer) async {
    project.http.postToAllClient("layer/add", layer.toJson()..["structure"] = id);
    await project.database.structures.modify(id, db.modify.push("layers", layer.id));
    await project.database.layers.add(layer);
  }

  Future<bool> removeLayer(Project project, db.ObjectId id) async {
    project.http.getToAllClient("layer/remove", args: {"id": id, "structure": this.id});
    await project.database.structures.modify(id, db.modify.pull("layers", id));
    return await project.database.layers.delete(id);
  }
}