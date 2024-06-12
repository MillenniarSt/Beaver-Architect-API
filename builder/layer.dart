import '../main.dart';
import 'area/area2D.dart';
import 'area/area_behavior.dart';
import 'bbuilder.dart';
import '../data/database.dart';
import 'wall/wall2D.dart';

class Layer extends Builder {

  final List<Area2D> areas = [];
  final List<Wall2D> walls = [];

  final List<SubLayer> subLayers = [];

  Layer(super.name, {super.image, super.opacity}) {
    subLayers.add(SubLayer("Main", this));
  }

  Layer.map(super.map) : super.map();

  @override
  Map<String, dynamic> toMap() {
    List<String> areaIds = [];
    for(Area2D area in areas) {
      areaIds.add(area.id);
    }
    List<String> wallIds = [];
    for(Wall2D wall in walls) {
      wallIds.add(wall.id);
    }
    return super.toMap()..addAll({
      "areas": areaIds.join(" "),
      "walls": wallIds.join(" ")
    });
  }

  @override
  void map(Map<String, dynamic> map) {
    super.map(map);
    List<String> areaIds = (map["areas"] as String).split(" ");
    for(String id in areaIds) {
      areas.add(database.getSavable<Area2D>(id));
    }
    List<String> wallIds = (map["walls"] as String).split(" ");
    for(String id in wallIds) {
      walls.add(database.getSavable<Wall2D>(id));
    }
  }

  @override
  List<Savable> get childrenToMap => (areas as List<Savable>)..addAll(walls)..addAll(subLayers);

  @override
  String get mapId => "layers";
}

class SubLayer implements Savable {

  @override
  late final String id;

  late String name;

  final Map<Area2D, AreaBehavior> _areaBehaviors = {};

  SubLayer(this.name, Layer layer) {
    id = uuid.v4();
    for(Area2D area in layer.areas) {
      _areaBehaviors[area] = AreaBehavior();
    }
  }

  SubLayer.map(Map<String, dynamic> map) {
    this.map(map);
  }

  @override
  Map<String, dynamic> toMap() {
    List<String> areas = [];
    for(Area2D area in _areaBehaviors.keys) {
      areas.add(area.id);
    }
    List<String> behaviors = [];
    for(AreaBehavior behavior in _areaBehaviors.values) {
      behaviors.add(behavior.id);
    }
    return {
      "id": id,
      "areas": areas.join(" "),
      "behaviors": behaviors.join(" ")
    };
  }

  @override
  void map(Map<String, dynamic> map) {
    id = map["id"];
    List<String> areas = (map["areas"] as String).split(" ");
    List<String> behaviors = (map["behaviors"] as String).split(" ");
    for(int i = 0; i < areas.length; i++) {
      _areaBehaviors[database.getSavable<Area2D>(areas[i])] = database.getSavable<AreaBehavior>(behaviors[i]);
    }
  }

  @override
  List<Savable> get childrenToMap => [];

  @override
  String get mapId => "subLayers";

  Map<Area2D, AreaBehavior> get areaBehaviors => _areaBehaviors;
}