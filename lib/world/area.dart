import '../data/database.dart';
import 'world3D.dart';
import 'area2D.dart';

Area? jsonArea(Map<String, dynamic> json) {
  switch(json["type"]) {
    case "parallelepiped": return Parallelepiped.json(json);
    case "sphere": return Sphere.json(json);
    case "semi_sphere": return SemiSphere.json(json);
    case "prism": return Prism.json(json);
    case "cone": return Cone.json(json);
  }
  return null;
}

abstract class Area implements JsonMappable<Map<String, dynamic>> {

  Area();

  Area.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  Map<String, dynamic> toJson() => {
    "type": type
  };

  String get type;
}

abstract class RegularArea extends Area {

  late Dimension dimension;

  RegularArea(this.dimension);

  RegularArea.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    dimension = Dimension.json(json["dimension"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "type": type,
    "dimension": dimension.toJson()
  };
}

class Parallelepiped extends RegularArea {

  Parallelepiped(super.dimension);

  Parallelepiped.json(super.json) : super.json();

  @override
  String get type => "parallelepiped";
}

class Sphere extends RegularArea {

  Sphere(super.dimension);

  Sphere.json(super.json) : super.json();

  @override
  String get type => "sphere";
}

class Prism<A extends Area2D> extends Area {

  late final A root;
  late double height;

  Prism(this.root, double y, this.height) : super();

  Prism.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    root = jsonArea2d(json["root"]) as A;
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "root": root.toJson()
  });

  @override
  String get type => "prism";
}

class SemiSphere extends RegularArea {

  late RegularRotation3D face;

  SemiSphere(this.face, super.dimension);

  SemiSphere.json(super.json) : super.json();

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
  late double height;

  Cone(this.root, double y, this.height);

  Cone.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    root = jsonArea2d(json["root"]) as A;
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "root": root.toJson()
  });

  @override
  String get type => "cone";
}