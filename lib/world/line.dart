import '../data/database.dart';
import 'world2D.dart';

Line? jsonLine(Map<String, dynamic> json) {
  switch(json["type"]) {
    case "regular": return RegularLine.json(json);
    case "curved": return CurvedLine.json(json);
  }
  return null;
}

abstract class Line implements JsonMappable<Map<String, dynamic>> {

  late Pos2D start;
  late Pos2D end;
  late double thickness;

  Line(this.start, this.end, this.thickness);

  Line.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    start = Pos2D.json(json["start"]);
    end = Pos2D.json(json["start"]);
    thickness = json["thickness"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "type": type,
    "start": start.toJson(),
    "end": end.toJson(),
    "thickness": thickness
  };

  String get type;
}

class RegularLine extends Line {

  RegularLine(super.start, super.end, super.thickness);

  RegularLine.json(super.json) : super.json();

  @override
  String get type => "regular";
}

class CurvedLine extends Line {

  CurvedLine(super.start, super.end, super.thickness);

  CurvedLine.json(super.json) : super.json();

  @override
  String get type => "curved";
}