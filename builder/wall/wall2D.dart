import '../../data/database.dart';
import '../../world/world2D.dart';

Wall2D? jsonWall2d(Map<String, dynamic> json) {
  switch(json["type"]) {
    case "regular": return RegularWall2D.json(json);
    case "curved": return CurvedWall2D.json(json);
    case "composed": return ComposedWall2D.json(json);
    case "composed_curved": return CurvedComposedWall2D.json(json);
    case "mixed": return MixedWall2D.json(json);
  }
  return null;
}

abstract class Wall2D implements Savable {

  @override
  late final String id;

  int color = 0;

  late List<Pos2D> poss;
  late double thickness;

  Wall2D(this.poss, this.thickness) {
    id = uuid.v4();
  }

  Wall2D.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    color = json["color"];
    thickness = json["thickness"];
    poss = List.generate(json["poss"].length, (index) => Pos2D.json(json["poss"][index]));
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "type": type,
    "color": color,
    "thickness": thickness,
    "poss": List.generate(poss.length, (index) => poss[index].toJson())
  };

  String get type;
}

abstract class SingleLineWall2D extends Wall2D {

  SingleLineWall2D(Pos2D start, Pos2D end, double thickness) : super([start, end], thickness);

  SingleLineWall2D.json(super.json) : super.json();

  Pos2D get start => poss.first;

  Pos2D get end => poss.last;
}

class RegularWall2D extends SingleLineWall2D {

  RegularWall2D(super.start, super.end, super.thickness);

  RegularWall2D.json(super.json) : super.json();

  @override
  String get type => "regular";
}

class CurvedWall2D extends SingleLineWall2D {

  CurvedWall2D(super.start, super.end, super.thickness);

  CurvedWall2D.json(super.json) : super.json();

  @override
  String get type => "curved";
}

abstract class PathWall2D<W extends SingleLineWall2D> extends Wall2D {

  late List<W> children;

  PathWall2D(this.children, double thickness) : super(List.generate(children.length, (index) => children[index].start)..add(children.last.end), thickness);

  PathWall2D.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    // TODO: implement json
  }

  @override
  Map<String, dynamic> toJson() {
    return super.toJson();
    // TODO: implement toJson
  }
}

class ComposedWall2D extends PathWall2D<RegularWall2D> {

  ComposedWall2D(List<Pos2D> poss, double thickness) : super(List.generate(poss.length -1, (index) => RegularWall2D(poss[index], poss[index +1], thickness)), thickness);

  ComposedWall2D.json(super.json) : super.json();

  @override
  String get type => "composed";
}

class CurvedComposedWall2D extends PathWall2D<CurvedWall2D> {

  CurvedComposedWall2D(List<Pos2D> poss, double thickness) : super(List.generate(poss.length -1, (index) => CurvedWall2D(poss[index], poss[index +1], thickness)), thickness);

  CurvedComposedWall2D.json(super.json) : super.json();

  @override
  String get type => "curved_composed";
}

class MixedWall2D extends PathWall2D<SingleLineWall2D> {

  MixedWall2D(super.children, super.thickness);

  MixedWall2D.json(super.json) : super.json();

  @override
  String get type => "mixed";
}