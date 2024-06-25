import '../data/database.dart';
import 'world3D.dart';
import 'area2D.dart';

Area? jsonArea(Map<String, dynamic> json) {
  switch(json["type"]) {
    case "parallelepiped": return Parallelepiped.json(json);
    case "prism": return Prism.json(json);
  }
  return null;
}

abstract class Area implements JsonMappable<Map<String, dynamic>> {

  late Dimension dimension;

  Area();

  Area.json(Map<String, dynamic> map) {
    this.json(map);
  }

  @override
  void json(Map<String, dynamic> json) {
    dimension = Dimension.json(json["dimension"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "type": type,
    "dimension": dimension.toJson()
  };

  String get type;
}

class Parallelepiped extends Area {

  Parallelepiped(Dimension dimension) {
    this.dimension = dimension;
  }

  Parallelepiped.json(Map<String, dynamic> map) : super.json(map);

  @override
  String get type => "parallelepiped";
}

class Prism<A extends Area2D> extends Area {

  late final A root;

  Prism(this.root, double y, double height) : super() {
    dimension.pos = Pos3D(root.pos.x, root.pos.z, y);
    dimension.size = Size3D(root.size.width, root.size.length, height);
  }

  Prism.json(Map<String, dynamic> map) : super.json(map);

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    root = jsonArea2d(json["root"]) as A;
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "root": root.toJson()
  });

  @override
  String get type => "prism";
}

class Sphere extends Area {

  Sphere.json(Map<String, dynamic> map) : super.json(map);

  @override
  String get type => "sphere";
}

class SemiSphere extends Area {

  late RegularRotation3D face;

  SemiSphere(this.face, Dimension dimension) {
    this.dimension = dimension;
  }

  SemiSphere.json(Map<String, dynamic> map) : super.json(map);

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    face = RegularRotation3D.stringOf(json["face"])!;
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "face": face.name
  });

  @override
  String get type => "semi_sphere";
}

class Cone<A extends Area2D> extends Area {

  late final A root;

  Cone(this.root, double y, double height) : super() {
    dimension.pos = Pos3D(root.pos.x, root.pos.z, y);
    dimension.size = Size3D(root.size.width, root.size.length, height);
  }

  Cone.json(Map<String, dynamic> map) : super.json(map);

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    root = jsonArea2d(json["root"]) as A;
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "root": root.toJson()
  });

  @override
  String get type => "cone";
}