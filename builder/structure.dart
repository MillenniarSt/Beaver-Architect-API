import '../engineer/components.dart';
import '../main.dart';
import 'bbuilder.dart';
import '../data/database.dart';
import 'layer.dart';

class Structure extends MainBuilder {

  final List<Layer> layers = [];

  Structure(super.name, super.area, {super.image, super.opacity}) : super() {
    layers.add(Layer("Main Layer"));
  }

  Structure.map(super.map) : super.map();

  @override
  Map<String, dynamic> toMap() {
    List<String> layerIds = [];
    for(Layer layerCollection in layers) {
      layerIds.add(layerCollection.id);
    }
    return super.toMap()..addAll({
      "layers": layerIds.join(" ")
    });
  }

  @override
  void map(Map<String, dynamic> map) {
    super.map(map);
    for(String id in (map["layers"] as String).split(" ")) {
      layers.add(database.getSavable<Layer>(id));
    }
  }

  @override
  List<Component> get components {
    List<Component> components = [];
    for(Layer layer in layers) {
      //TODO
    }
    return components;
  }

  @override
  List<Builder> get childrenBuilders => layers;

  @override
  List<Savable> get childrenToMap => layers;

  @override
  String get mapId => "structures";

  @override
  String get type => "structure";
}