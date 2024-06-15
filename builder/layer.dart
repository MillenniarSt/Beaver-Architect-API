import 'area/area2D.dart';
import 'area/area_behavior.dart';
import 'bbuilder.dart';
import '../data/database.dart';
import 'wall/wall2D.dart';

class Layer extends Builder {

  List<Area2D> areas = [];
  List<Wall2D> walls = [];

  List<SubLayer> subLayers = [];

  Layer(super.name, super.area, {super.image, super.opacity}) {
    subLayers.add(SubLayer("Main", this));
  }

  Layer.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "areas": List.generate(areas.length, (index) => areas[index].toJson()),
    "walls": List.generate(walls.length, (index) => walls[index].toJson()),
    "subLayers": List.generate(subLayers.length, (index) => subLayers[index].toJson())
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    areas = List.generate(json["areas"].length, (index) => jsonArea2d(json["areas"][index])!);
    walls = List.generate(json["walls"].length, (index) => jsonWall2d(json["walls"][index])!);
    subLayers = List.generate(json["subLayers"].length, (index) => SubLayer.json(json["subLayers"][index]));
  }
}

class SubLayer implements Savable {

  @override
  late final String id;

  late String name;

  Map<String, AreaBehavior> _areaBehaviors = {};

  SubLayer(this.name, Layer layer) {
    id = uuid.v4();
    for(Area2D area in layer.areas) {
      _areaBehaviors[area.id] = AreaBehavior();
    }
  }

  SubLayer.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "behaviors": {
      for(String id in _areaBehaviors.keys)
        id: _areaBehaviors[id]!.toJson()
    }
  };

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    _areaBehaviors = Map.fromIterables(json["area_behaviors"].keys, List.generate(json["area_behaviors"].length, (index) => AreaBehavior.json(json["area_behaviors"][index])));
  }

  Map<String, AreaBehavior> get areaBehaviors => _areaBehaviors;
}