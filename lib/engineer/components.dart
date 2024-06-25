import '../world/area2D.dart';
import '../world/line.dart';
import '../data/database.dart';
import '../world/world3D.dart';
import 'engineer.dart';
import 'style.dart';

abstract class Component<S extends ComponentStyle> implements JsonMappable<Map<String, dynamic>> {

  late S style;
  late Dimension dimension;

  Component(this.style, this.dimension);

  Component.json(Map<String, dynamic> json) {
    this.json(json);
  }

  void random(Style style, Engineer engineer) async {
    await engineer.plugin.http.randomComponent(this, style);
  }

  @override
  void json(Map<String, dynamic> json) {
    dimension = Dimension.json(json["dimension"]);
    style = jsonStyle(json["style"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "dimension": dimension.toJson(),
    "style": style.toJson()
  };

  S jsonStyle(Map<String, dynamic> json);
}

class Wall extends Component<WallStyle> {

  int color = 0;

  late final Line line;
  Area2D? shape;

  Wall(this.line, super.style, super.dimension);

  Wall.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "color": color,
    "line": line.toJson(),
    if(shape != null) "shape": shape!.toJson()
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    color = json["color"];
    line = jsonLine(json["line"])!;
    if(json.containsKey("shape")) {
      shape = jsonArea2d(json["shape"]);
    }
  }

  @override
  WallStyle jsonStyle(Map<String, dynamic> json) => WallStyle.json(json);
}

class Floor extends Component<FloorStyle> {

  Floor(super.style, super.dimension);

  Floor.json(super.json) : super.json();

  @override
  FloorStyle jsonStyle(Map<String, dynamic> json) => FloorStyle.json(json);
}

class Roof extends Component<RoofStyle> {

  Roof(super.style, super.dimension);

  Roof.json(super.json) : super.json();

  @override
  RoofStyle jsonStyle(Map<String, dynamic> json) => RoofStyle.json(json);
}

class Gadget extends Component<GadgetStyle> {

  Gadget(super.style, super.dimension);

  Gadget.json(super.json) : super.json();

  @override
  GadgetStyle jsonStyle(Map<String, dynamic> json) => GadgetStyle.json(json);
}