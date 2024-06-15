import '../main.dart';
import 'area/area.dart';
import 'area/area2D.dart';
import 'bbuilder.dart';
import '../world/world3D.dart';
import 'structure.dart';

class Project extends Builder {

  Pos3D center = Pos3D(0, 0, 0);

  final List<Builder> _builders = [Structure("Structure", Parallelepiped(AreaVisual.none, Dimension(Pos3D(0, 0, 0), Size3D(10, 10, 10))))];

  Project(super.name, super.area, {super.image, super.opacity}) : super();

  Project.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() {
    List<String> builderIds = [];
    for(MainBuilder builder in _builders) {
      builderIds.add(builder.id);
    }
    return super.toMap()..addAll({
      "builders": builderIds.join(" "),
      "centerX": center.x, "centerZ": center.z, "centerY": center.y
    })..addAll(dimension.toMap());
  }

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);

    center = Pos3D(map["centerX"], map["centerZ"], map["centerY"]);
    dimension = Dimension.map(map);

    List<String> builderId = (map["builders"] as String).split(" ");
    for(String id in builderId) {
      _builders.add(database.getSavable<MainBuilder>(id));
    }
  }

  @override
  List<Builder> get childrenBuilders => _builders;

  List<Builder> get builders => _builders;
}