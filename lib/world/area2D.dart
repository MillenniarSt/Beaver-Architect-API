import '../data/database.dart';
import 'line.dart';
import 'world2D.dart';

Area2D? jsonArea2d(Map<String, dynamic> json) {
  switch(json["type"]) {
    case "rectangle": return Rectangle.json(json);
    case "ellipse": return Ellipse.json(json);
    case "polygon": return Polygon.json(json);
  }
  return null;
}

abstract class Area2D implements JsonMappable<Map<String, dynamic>> {

  Area2D();

  Area2D.json(Map<String, dynamic> json) {
    this.json(json);
  }

  String get type;
}

abstract class RegularArea2D extends Area2D {

  late Pos2D pos;
  late Size2D size;

  RegularArea2D(this.pos, this.size);

  RegularArea2D.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    pos = Pos2D.json(json["pos"]);
    size = Size2D.json(json["size"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "type": type,
    "pos": pos.toJson(),
    "size": size.toJson()
  };
}

abstract class ComposedArea2D extends Area2D {

  late List<Line> lines;

  ComposedArea2D(this.lines);

  ComposedArea2D.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    lines = List.generate(json["poss"].length, (index) => jsonLine(json["poss"][index])!);
  }

  @override
  Map<String, dynamic> toJson() => {
    "type": type,
    "poss": List.generate(lines.length, (index) => lines[index].toJson())
  };
}

class Rectangle extends RegularArea2D {

  late double leftTopCorner, leftBottomCorner, rightBottomCorner, rightTopCorner;

  Rectangle(super.pos, super.size, {this.leftTopCorner = 0, this.leftBottomCorner = 0, this.rightBottomCorner = 0, this.rightTopCorner = 0});

  Rectangle.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    leftTopCorner = json["left_top_corner"];
    leftBottomCorner = json["left_bottom_corner"];
    rightBottomCorner = json["right_bottom_corner"];
    rightTopCorner = json["right_top_corner"];
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "left_top_corner": leftTopCorner,
    "left_bottom_corner": leftBottomCorner,
    "right_bottom_corner": rightBottomCorner,
    "right_top_corner": rightTopCorner
  });

  @override
  String get type => "rectangle";
}

class Ellipse extends RegularArea2D {

  Ellipse(super._start, super._end) : super();

  Ellipse.json(super.json) : super.json();

  @override
  String get type => "ellipse";
}

class Polygon extends ComposedArea2D {

  Polygon(super.lines);

  Polygon.json(super.json) : super.json();

  @override
  String get type => "polygon";
}