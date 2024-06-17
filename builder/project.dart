import '../main.dart';
import 'area/area.dart';
import 'area/area2D.dart';
import 'bbuilder.dart';
import '../world/world3D.dart';
import 'structure.dart';

class Project extends Builder {

  List<Structure> structures = [Structure("Structure", Parallelepiped(AreaVisual.none, Dimension(Pos3D(0, 0, 0), Size3D(100, 100, 100))))];

  Project(super.name, super.area, {super.image, super.opacity}) : super();

  Project.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "structures": List.generate(structures.length, (index) => structures[index].id)
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    structures = List.generate(json["structures"], (index) => database.structures[json["structures"][index]]!);
  }

  @override
  List<Builder> get childrenBuilders => structures;
}