import '../data/database.dart';
import '../world/world3D.dart';
import 'engineer.dart';
import 'style.dart';

abstract class Component<S extends ComponentStyle> implements Savable {

  @override
  late final String id;

  S style;
  Dimension dimension;

  Component(this.style, this.dimension) {
    id = uuid.v4();
  }

  void random(Style style, Engineer engineer) async {
    await engineer.plugin.http.randomComponent(this, style);
  }

  void build(Style style, Engineer engineer) async {
    await engineer.plugin.http.buildComponent(this, style);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    dimension = Dimension.json(json["dimension"]);
    style = jsonStyle(json["style"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "dimension": dimension.toJson(),
    "style": style.toJson()
  };

  S jsonStyle(Map<String, dynamic> json);
}

class Wall extends Component<WallStyle> {

  Wall(super.style, super.dimension);

  @override
  WallStyle jsonStyle(Map<String, dynamic> json) => WallStyle.json(json);
}

class Floor extends Component<FloorStyle> {

  Floor(super.style, super.dimension);

  @override
  FloorStyle jsonStyle(Map<String, dynamic> json) => FloorStyle.json(json);
}

class Roof extends Component<RoofStyle> {

  Roof(super.style, super.dimension);

  @override
  RoofStyle jsonStyle(Map<String, dynamic> json) => RoofStyle.json(json);
}

class Gadget extends Component<GadgetStyle> {

  Gadget(super.style, super.dimension);

  @override
  GadgetStyle jsonStyle(Map<String, dynamic> json) => GadgetStyle.json(json);
}