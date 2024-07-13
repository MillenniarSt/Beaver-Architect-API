import 'dart:math';

import '../data/database.dart';

class Pos2D implements JsonMappable<List> {

  late final double x;
  late final double z;

  Pos2D(this.x, this.z);

  Pos2D.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) {
    x = json[0].toDouble();
    z = json[1].toDouble();
  }

  @override
  List toJson() => [x, z];

  static Pos2D findPos(List<Pos2D> poss) {
    Pos2D found = Pos2D(double.maxFinite, -0x8000000000000000);
    for(Pos2D pos in poss) {
      if(pos.x < found.x) found = Pos2D(pos.x, found.z);
      if(pos.z > found.z) found = Pos2D(found.x, pos.z);
    }
    return found;
  }

  Pos2D operator -(Pos2D other) => Pos2D(x - other.x, z - other.z);

  Pos2D operator +(Pos2D other) => Pos2D(x + other.x, z + other.z);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
          other is Pos2D &&
              runtimeType == other.runtimeType &&
              x == other.x &&
              z == other.z;

  @override
  int get hashCode => x.hashCode ^ z.hashCode;
}

class Size2D implements JsonMappable<List> {

  late final double width;
  late final double length;

  Size2D(this.width, this.length);

  Size2D.json(List json) {
    this.json(json);
  }

  @override
  void json(List json) {
    width = json[0];
    length = json[1];
  }

  @override
  List<double> toJson() => [width, length];

  static Size2D findSize(Pos2D pos, List<Pos2D> poss) {
    Pos2D found = Pos2D(-0x8000000000000000, double.maxFinite);
    for(Pos2D pos in poss) {
      if(pos.x > found.x) found = Pos2D(pos.x, found.z);
      if(pos.z < found.z) found = Pos2D(found.x, pos.z);
    }
    return Size2D(found.x - pos.x, pos.z - found.z);
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
          other is Size2D &&
              runtimeType == other.runtimeType &&
              width == other.width &&
              length == other.length;

  @override
  int get hashCode => width.hashCode ^ length.hashCode;
}

class Rotation2D implements JsonMappable<double> {

  late final double angle;

  Rotation2D(this.angle);

  Rotation2D.json(double json) {
    this.json(json);
  }

  @override
  void json(double json) {
    angle = json * 180 / pi;
  }

  @override
  double toJson() => angle * pi / 180;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Rotation2D &&
          runtimeType == other.runtimeType &&
          angle == other.angle;

  @override
  int get hashCode => angle.hashCode;
}

enum RegularRotation2D {

  north(0), east(pi / 2), south(pi), west(pi + (pi / 2));

  final double angle;

  const RegularRotation2D(this.angle);

  static RegularRotation2D? indexOf(double rotation) {
    switch(rotation) {
      case 0: return north;
      case const (pi / 2): return east;
      case pi: return south;
      case const (pi + (pi / 2)): return west;
    }
    return null;
  }

  static RegularRotation2D? stringOf(String rotation) {
    switch(rotation) {
      case "north": return north;
      case "east": return east;
      case "south": return south;
      case "west": return west;
    }
    return null;
  }
}