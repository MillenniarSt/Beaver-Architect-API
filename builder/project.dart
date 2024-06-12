import '../main.dart';
import 'area/area.dart';
import 'area/area2D.dart';
import 'bbuilder.dart';
import '../data/database.dart';
import '../world/world3D.dart';
import 'structure.dart';

class Project extends Builder {

  Pos3D center = Pos3D(0, 0, 0);
  Dimension dimension = Dimension(Pos3D(-1000, -1000, -1280), Size3D(2000, 2000, 570));

  final List<MainBuilder> _builders = [Structure("Structure", Parallelepiped(AreaVisual.none, Dimension(Pos3D(0, 0, 0), Size3D(10, 10, 10))))];

  Project(super.name, {super.image, super.opacity}) : super();

  Project.map(super.map) : super.map();

  @override
  Map<String, dynamic> toMap() {
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
  void map(Map<String, dynamic> map) {
    super.map(map);

    center = Pos3D(map["centerX"], map["centerZ"], map["centerY"]);
    dimension = Dimension.map(map);

    List<String> builderId = (map["builders"] as String).split(" ");
    for(String id in builderId) {
      _builders.add(database.getSavable<MainBuilder>(id));
    }
  }

  @override
  List<Builder> get childrenBuilders => _builders;

  @override
  List<Savable> get childrenToMap => _builders;

  @override
  String get mapId => "project";

  List<MainBuilder> get builders => _builders;
}