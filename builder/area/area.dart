import '../../data/database.dart';
import '../../world/world3D.dart';
import 'area2D.dart';

Area? jsonArea(Map<String, dynamic> json) {
  switch(json["type"]) {
    case "parallelepiped": return Parallelepiped.json(json);
    case "prism": return Prism.json(json);
  }
  return null;
}

abstract class Area implements Savable {

  @override
  late final String id;

  late AreaVisual visual;

  late Dimension dimension = Dimension(Pos3D(0, 0, 0), Size3D(1, 1, 1));

  Area(this.visual) {
    id = uuid.v4();
  }

  Area.json(Map<String, dynamic> map) {
    this.json(map);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    visual = AreaVisual.json(json["visual"]);
    dimension = Dimension.json(json["dimension"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "type": type,
    "visual": visual.toJson(),
    "dimension": dimension.toJson()
  };

  String get type;
}

class Parallelepiped extends Area {

  Parallelepiped(super.visual, Dimension dimension) : super() {
    dimension = dimension;
  }

  Parallelepiped.json(Map<String, dynamic> map) : super.json(map);

  @override
  String get type => "parallelepiped";
}

class Prism<A extends Area2D> extends Area {

  late final Area2D root;

  Prism(super.visual, this.root, double y, double height) : super() {
    dimension.pos = Pos3D(root.pos.x, root.pos.z, y);
    dimension.size = Size3D(root.size.width, root.size.length, height);
  }

  Prism.json(Map<String, dynamic> map) : super.json(map);

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    //TODO
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    //TODO
  });

  @override
  String get type => "prism";
}