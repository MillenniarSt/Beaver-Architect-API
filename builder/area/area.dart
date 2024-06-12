import '../../data/database.dart';
import '../../world/world3D.dart';
import 'area2D.dart';

abstract class AbstractArea {

  Dimension dimension = Dimension(Pos3D(0, 0, 0), Size3D(1, 1, 1));
}

abstract class Area extends AbstractArea implements Savable {

  @override
  late final String id;

  late AreaVisual visual;

  Area(this.visual) {
    id = uuid.v4();
  }

  Area.map(Map<String, dynamic> map) {
    this.map(map);
  }

  @override
  void map(Map<String, dynamic> map) {
    visual = AreaVisual.map(map);
    dimension = Dimension.map(map);
  }

  @override
  Map<String, dynamic> toMap() => visual.toMap()..addAll(dimension.toMap());

  String get key;

  @override
  String get mapId => "areas";

  @override
  List<Savable> get childrenToMap => [];
}

class Parallelepiped extends Area {

  Parallelepiped(super.visual, Dimension dimension) : super() {
    dimension = dimension;
  }

  Parallelepiped.map(Map<String, dynamic> map) : super.map(map);

  @override
  String get key => "parallelepiped";
}

class Prism<A extends Area2D> extends Area {

  late final Area2D root;

  Prism(super.visual, this.root, double y, double height) : super() {
    dimension.pos = Pos3D(root.pos.x, root.pos.z, y);
    dimension.size = Size3D(root.size.width, root.size.length, height);
  }

  Prism.map(Map<String, dynamic> map) : super.map(map);

  @override
  String get key => "prism";
}