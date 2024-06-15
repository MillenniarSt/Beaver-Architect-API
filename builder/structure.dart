import '../engineer/components.dart';
import '../main.dart';
import 'bbuilder.dart';
import 'layer.dart';

class Structure extends Builder {

  List<Layer> layers = [];

  Structure(super.name, super.area, {super.image, super.opacity}) : super() {
    layers.add(Layer("Main Layer", area));
  }

  Structure.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "layers": List.generate(layers.length, (index) => layers[index].id)
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    layers = List.generate(json["layers"].length, (index) => database.layers[json["layers"][index]]!);
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
}