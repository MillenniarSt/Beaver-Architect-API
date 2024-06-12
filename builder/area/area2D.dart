import 'dart:io';
import 'dart:ui';

import '../../data/database.dart';
import '../../world/world2D.dart';

class AreaVisual implements Mappable {

  static final AreaVisual none = AreaVisual("none");

  late String name;

  late Color color;
  File? image;

  AreaVisual(this.name);

  AreaVisual.color(this.name, this.color);

  AreaVisual.image(this.name, this.image);

  AreaVisual.map(Map<String, dynamic> map) {
    this.map(map);
  }

  @override
  void map(Map<String, dynamic> map) {
    name = map["name"];
    color = Color(map["color"]);
    image = map["image"] == "#null" ? null : File(map["image"]);
  }

  @override
  Map<String, dynamic> toMap() {
    return {"name": name, "color": color.value, "image": image == null ? "#null" : image!.path};
  }

  bool hasImage() {
    return image != null;
  }
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

  Area2D.map(Map<String, dynamic> map) {
    this.map(map);
  }

  @override
  void map(Map<String, dynamic> map) {
    id = map["id"];
    visual = AreaVisual.map(map);
    pos = Pos2D(map["posX"], map["posZ"]);
    size = Size2D(map["width"], map["length"]);
    readData((map["data"] as String).split(" "));
  }

  @override
  Map<String, dynamic> toMap() => visual.toMap()..addAll({
    "id": id,
    "type": key,
    "posX": pos.x, "posZ": pos.z,
    "width": size.width, "length": size.length,
    "data": writeData().join(" ")
  });

  List<String> writeData() => [];

  void readData(List<String> data) { }

  @override
  String get mapId => "areas2D";

  String get key;

  @override
  List<Savable> get childrenToMap => [];
}

class Rectangle extends Area2D {

  Rectangle(super.visual, super.pos, super.size);

  Rectangle.map(super.map) : super.map();

  @override
  String get key => "rectangle";
}

class Ellipse extends Area2D {

  Ellipse(super.visual, super._start, super._end) : super();

  Ellipse.map(super.map) : super.map();

  @override
  String get key => "ellipse";
}

class Polygon extends Area2D {

  List<Pos2D> _poss = [];

  Polygon(super.visual, this._poss) : super.late() {
    update();
  }

  Polygon.map(super.map) : super.map();

  @override
  void readData(List<String> data) {
    for(int i = 0; i < data.length; i += 2) {
      _poss.add(Pos2D(double.parse(data[i]), double.parse(data[i + 1])));
    }
  }

  @override
  List<String> writeData() {
    List<String> posData = [];
    for(Pos2D pos in _poss) {
      posData.addAll([pos.x.toString(), pos.z.toString()]);
    }
    return posData;
  }

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
  String get key => "polygon";
}