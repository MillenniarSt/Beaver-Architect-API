import 'dart:math';

import '../data/database.dart';
import 'world2D.dart';

class Pos3D extends Pos2D {

  static final Pos3D zero = Pos3D(0, 0, 0);

  late final double y;

  Pos3D(super.x, super.z, this.y);

  Pos3D.json(super.json) : super.json();

  @override
  void json(List json) {
    x = json[0].toDouble();
    y = json[1].toDouble();
    z = json[2].toDouble();
  }

  @override
  List toJson() => [x, y, z];

  @override
  Pos3D operator -(Pos2D other) => Pos3D(x - other.x, z - other.z, y - (other as Pos3D).y);

  @override
  Pos3D operator +(Pos2D other) => Pos3D(x + other.x, z + other.z, y + (other as Pos3D).y);

  Pos3D rotate(Pos3D center, Rotation3D rotation) {
    double translatedX = x - center.x;
    double translatedY = y - center.y;
    double translatedZ = z - center.z;

    double cosX = cos(rotation.angleX);
    double sinX = sin(rotation.angleX);
    double y1 = cosX * translatedY - sinX * translatedZ;
    double z1 = sinX * translatedY + cosX * translatedZ;

    double cosY = cos(rotation.angleY);
    double sinY = sin(rotation.angleY);
    double x2 = cosY * translatedX + sinY * z1;
    double z2 = -sinY * translatedX + cosY * z1;

    double cosZ = cos(rotation.angleZ);
    double sinZ = sin(rotation.angleZ);
    double x3 = cosZ * x2 - sinZ * y1;
    double y3 = sinZ * x2 + cosZ * y1;

    return Pos3D(x3 + center.x, y3 + center.y, z2 + center.z);
  }

  static Pos3D findPos(Iterable<Pos3D> poss) {
    Pos3D found = Pos3D(double.maxFinite, double.maxFinite, double.maxFinite);
    for(Pos3D pos in poss) {
      if(pos.x < found.x) found = Pos3D(pos.x, found.z, found.y);
      if(pos.z < found.z) found = Pos3D(found.x, pos.z, found.y);
      if(pos.y < found.y) found = Pos3D(found.x, found.z, pos.y);
    }
    return found;
  }


  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      super == other &&
          other is Pos3D &&
          runtimeType == other.runtimeType &&
          y == other.y;

  @override
  int get hashCode => super.hashCode ^ y.hashCode;
}

class Size3D extends Size2D {

  late final double height;

  Size3D(super.width, super.length, this.height) : super();

  Size3D.json(super.json) : super.json();

  @override
  void json(List<double> json) {
    super.json(json);
    height = json[2];
  }

  @override
  List<double> toJson() => super.toJson()..add(height);

  static Size3D findSize(Pos3D pos, Iterable<Pos3D> poss) {
    Pos3D found = Pos3D(
        -0x8000000000000000, -0x8000000000000000, -0x8000000000000000);
    for (Pos3D pos in poss) {
      if (pos.x > found.x) found = Pos3D(pos.x, found.z, found.y);
      if (pos.z > found.z) found = Pos3D(found.x, pos.z, found.y);
      if (pos.y > found.y) found = Pos3D(found.x, found.z, pos.y);
    }
    return Size3D((found.x - pos.x).abs() + 1, (pos.z - found.z).abs() + 1, (pos.y - found.y).abs() + 1);
  }
}

class Dimension implements JsonMappable<Map<String, dynamic>> {

  late Pos3D pos;
  late Size3D size;

  Dimension(this.pos, this.size);

  Dimension.poss(Pos3D start, Pos3D end) {
    pos = Pos3D(min(start.x, end.x), min(start.z, end.z), min(start.y, end.y));
    size = Size3D((end.x - start.x).abs() +1, (end.z - start.z).abs() +1, (end.y - start.y).abs() +1);
  }

  Dimension.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    pos = Pos3D(json["pos"]["x"], json["pos"]["z"], json["pos"]["y"]);
    size = Size3D(json["size"]["width"], json["size"]["length"], json["size"]["height"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "pos": {"x": pos.x, "z": pos.z, "y": pos.y},
    "size": {"width": size.width, "length": size.length, "height": size.height}
  };

  static Dimension findDimension(Iterable<Pos3D> poss) {
    Pos3D pos = Pos3D.findPos(poss);
    return Dimension(pos, Size3D.findSize(pos, poss));
  }

  bool contains(Pos3D contain) =>
      ((contain.x > pos.x && contain.x < pos.x + size.width -1) || size.width == 0) &&
      ((contain.z > pos.z && contain.z < pos.z + size.length -1) || size.length == 0) &&
      ((contain.y > pos.y && contain.y < pos.y + size.height -1) || size.height == 0);

  Dimension? inside(Dimension dim) {
    if(dim.contains(pos)) {
      return Dimension(pos, Size3D(
          min(size.width, dim.pos.x + dim.size.width - pos.x),
          min(size.length, dim.pos.z + dim.size.length - pos.z),
          min(size.height, dim.pos.y + dim.size.height - pos.y)
      ));
    } else {
      return null;
    }
  }
}

class Rotation3D implements JsonMappable<Map<String, double>> {

  late final double angleY;
  late final double angleX;
  late final double angleZ;

  Rotation3D(this.angleY, this.angleX, this.angleZ);

  Rotation3D.json(Map<String, double> json) {
    this.json(json);
  }

  @override
  void json(Map<String, double> json) {
    angleY = json["y"] ?? 0;
    angleX = json["x"] ?? 0;
    angleZ = json["z"] ?? 0;
  }

  @override
  Map<String, double> toJson() => {"x": angleX, "y": angleY, "z": angleZ};

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Rotation3D &&
          runtimeType == other.runtimeType &&
          angleY == other.angleY &&
          angleX == other.angleX &&
          angleZ == other.angleZ;

  @override
  int get hashCode => angleY.hashCode ^ angleX.hashCode ^ angleZ.hashCode;
}

enum RegularRotation3D {

  north(pi + (pi / 2), 0), east(0, 0), south(pi / 2, 0), west(pi, 0), up(0, pi + (pi / 2)), down(0, pi / 2);

  final double angleY;
  final double angleX;

  const RegularRotation3D(this.angleY, this.angleX);

  Rotation3D get rotation => Rotation3D(angleY, angleX, 0);

  static RegularRotation3D? rotationOf(Rotation3D rotation) {
    if(rotation == north.rotation) {
      return north;
    } else if(rotation == east.rotation) {
      return east;
    } else if(rotation == south.rotation) {
      return south;
    } else if(rotation == west.rotation) {
      return west;
    } else if(rotation == up.rotation) {
      return up;
    } else if(rotation == down.rotation) {
      return down;
    }
    return null;
  }

  static RegularRotation3D? stringOf(String rotation) {
    switch(rotation) {
      case "north": return north;
      case "east": return east;
      case "south": return south;
      case "west": return west;
      case "up": return up;
      case "down": return down;
    }
    return null;
  }
}