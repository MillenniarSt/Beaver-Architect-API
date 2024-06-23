import 'dart:io';

import '../data/database.dart';
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

  late Pos2D pos;
  late Size2D size;

  Area2D(this.pos, this.size);

  Area2D.late();

  Area2D.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    pos = Pos2D.json(json["pos"]);
    size = Size2D.json(json["size"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "type": type,
    "posX": pos.x, "posZ": pos.z,
    "width": size.width, "length": size.length
  };

  String get type;
}

class Rectangle extends Area2D {

  Rectangle(super.pos, super.size);

  Rectangle.json(super.json) : super.json();

  @override
  String get type => "rectangle";
}

class Ellipse extends Area2D {

  Ellipse(super._start, super._end) : super();

  Ellipse.json(super.json) : super.json();

  @override
  String get type => "ellipse";
}

class Polygon extends Area2D {

  List<Pos2D> _poss = [];

  Polygon(this._poss) : super.late() {
    update();
  }

  Polygon.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    for(int i = 0; i < json["poss"].length; i += 2) {
      _poss.add(Pos2D.json(json["poss"][i]));
    }
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..["poss"] = List.generate(_poss.length, (index) => _poss[index].toJson());

  @override
  set pos(Pos2D value) {
    Pos2D difPos = value - pos;
    for(int i = 0; i < _poss.length; i++) {
      _poss[i] += difPos;
    }
    super.pos = value;
  }

  @override
  set size(Size2D value) {
    for(int i = 0; i < _poss.length; i++) {
      Pos2D difPos = _poss[i] - pos;
      _poss[i] = Pos2D((difPos.x * value.width) / super.size.width, (difPos.z * value.length) / super.size.length) + pos;
    }
    super.size = value;
  }

  List<Pos2D> get poss => _poss;

  set poss(List<Pos2D> value) {
    _poss = value;
    update();
  }

  update() {
    super.pos = Pos2D.findPos(_poss);
    super.size = Size2D.findSize(pos, _poss);
  }

  @override
  String get type => "polygon";
}