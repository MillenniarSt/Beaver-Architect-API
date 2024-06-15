import 'dart:io';

import '../../data/database.dart';
import '../../world/world2D.dart';

class AreaVisual implements JsonMappable<Map<String, dynamic>> {

  static final AreaVisual none = AreaVisual("none");

  late String name;

  late int color;
  File? image;

  AreaVisual(this.name);

  AreaVisual.color(this.name, this.color);

  AreaVisual.image(this.name, this.image);

  AreaVisual.json(Map<String, dynamic> map) {
    this.json(map);
  }

  @override
  void json(Map<String, dynamic> json) {
    name = json["name"];
    color = json["color"];
    image = json["image"] == "#null" ? null : File(json["image"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "name": name, "color": color, "image": image == null ? "#null" : image!.path
  };

  bool hasImage() {
    return image != null;
  }
}

Area2D? jsonArea2d(Map<String, dynamic> json) {
  switch(json["type"]) {
    case "rectangle": return Rectangle.json(json);
    case "ellipse": return Ellipse.json(json);
    case "polygon": return Polygon.json(json);
  }
  return null;
}

abstract class Area2D implements Savable {

  @override
  late final String id;

  late AreaVisual visual;

  late Pos2D pos;
  late Size2D size;

  Area2D(this.visual, this.pos, this.size) : super() {
    id = uuid.v4();
  }

  Area2D.late(this.visual);

  Area2D.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    visual = AreaVisual.json(json["visual"]);
    pos = Pos2D.json(json["pos"]);
    size = Size2D.json(json["size"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "visual": visual.toJson(),
    "type": type,
    "posX": pos.x, "posZ": pos.z,
    "width": size.width, "length": size.length
  };

  String get type;
}

class Rectangle extends Area2D {

  Rectangle(super.visual, super.pos, super.size);

  Rectangle.json(super.json) : super.json();

  @override
  String get type => "rectangle";
}

class Ellipse extends Area2D {

  Ellipse(super.visual, super._start, super._end) : super();

  Ellipse.json(super.json) : super.json();

  @override
  String get type => "ellipse";
}

class Polygon extends Area2D {

  List<Pos2D> _poss = [];

  Polygon(super.visual, this._poss) : super.late() {
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