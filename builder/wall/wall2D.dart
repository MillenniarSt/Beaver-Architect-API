import 'dart:ui';

import '../../data/database.dart';
import '../../main.dart';
import '../../world/world2D.dart';

abstract class Wall2D implements Savable {

  @override
  late final String id;

  Color color = const Color.fromARGB(255, 204, 204, 204);

  late List<Pos2D> poss;
  late double thickness;

  Wall2D(this.poss, this.thickness) {
    id = uuid.v4();
  }

  Wall2D.map(Map<String, dynamic> map) {
    this.map(map);
  }

  @override
  void map(Map<String, dynamic> map) {
    id = map["id"];
    color = Color(map["color"]);
    thickness = map["thickness"];
    List<String> possData = (map["poss"] as String).split(" ");
    poss = List.generate(poss.length, (index) {
      List<String> pos = possData[index].split("-");
      return Pos2D(double.parse(pos[0]), double.parse(pos[1]));
    });
    readData((map["data"] as String).split(" "));
  }

  @override
  Map<String, dynamic> toMap() => {
    "id": id,
    "color": color.value,
    "thickness": thickness,
    "poss": List.generate(poss.length, (index) => "${poss[index].x}-${poss[index].z}").join(" "),
    "data": writeData().join(" ")
  };

  List<String> writeData() => [];

  void readData(List<String> data) { }

  @override
  String get mapId => "walls";
}

abstract class SingleLineWall2D extends Wall2D {

  SingleLineWall2D(Pos2D start, Pos2D end, double thickness) : super([start, end], thickness);

  SingleLineWall2D.map(super.map) : super.map();

  @override
  List<Savable> get childrenToMap => [];

  Pos2D get start => poss.first;

  Pos2D get end => poss.last;
}

class RegularWall2D extends SingleLineWall2D {

  RegularWall2D(super.start, super.end, super.thickness);

  RegularWall2D.map(super.map) : super.map();
}

class CurvedWall2D extends SingleLineWall2D {

  CurvedWall2D(super.start, super.end, super.thickness);

  CurvedWall2D.map(super.map) : super.map();
}

abstract class PathWall2D<W extends SingleLineWall2D> extends Wall2D {

  late List<W> children;

  PathWall2D(this.children, double thickness) : super(List.generate(children.length, (index) => children[index].start)..add(children.last.end), thickness);

  PathWall2D.map(super.map) : super.map();

  @override
  void readData(List<String> data) => children = List.generate(data.length, (index) => database.getSavable<W>(data[index]));

  @override
  List<String> writeData() => List.generate(children.length, (index) => children[index].id);

  @override
  List<Savable> get childrenToMap => children;
}

class ComposedWall2D extends PathWall2D<RegularWall2D> {

  ComposedWall2D(List<Pos2D> poss, double thickness) : super(List.generate(poss.length -1, (index) => RegularWall2D(poss[index], poss[index +1], thickness)), thickness);

  ComposedWall2D.map(super.map) : super.map();
}

class CurvedComposedWall2D extends PathWall2D<CurvedWall2D> {

  CurvedComposedWall2D(List<Pos2D> poss, double thickness) : super(List.generate(poss.length -1, (index) => CurvedWall2D(poss[index], poss[index +1], thickness)), thickness);

  CurvedComposedWall2D.map(super.map) : super.map();
}

class MixedWall2D extends PathWall2D<SingleLineWall2D> {

  MixedWall2D(super.children, super.thickness);

  MixedWall2D.map(super.map) : super.map();
}