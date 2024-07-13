import 'dart:io';

import '../engineer/components.dart';
import '../world/area.dart';
import 'bbuilder.dart';
import '../data/database.dart';

class Layer extends Builder<Parallelepiped> {

  //Properties from the database, they will not be updated
  late final List<Room> rooms;
  late final List<Wall> walls;

  Layer(super.name, super.area) : rooms = [], walls = [];

  Layer.json(super.json) : super.json();

  @override
  Map<String, dynamic> toJson() => super.toJson()..addAll({
    "rooms": List.generate(rooms.length, (index) => rooms[index].toJson()),
    "walls": List.generate(walls.length, (index) => walls[index].toJson())
  });

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    rooms = List.generate(json["rooms"].length, (index) => Room.json(json["rooms"][index]));
    walls = List.generate(json["walls"].length, (index) => Wall.json(json["walls"][index]));
  }
}

class Room implements JsonMappable<Map<String, dynamic>> {

  late final Area area;

  late Floor floor;
  late Floor ceiling;
  List<Gadget> gadgets = [];

  late String name;
  late int color;
  File? image;

  Room(this.area, this.floor, this.ceiling);

  Room.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  Map<String, dynamic> toJson() => {
    "area": area.toJson(),
    "floor": floor.toJson(),
    "ceiling": ceiling.toJson(),
    "gadgets": List.generate(gadgets.length, (index) => gadgets[index].toJson()),
    "name": name,
    "color": color,
    if(image != null) "image": image!.path
  };

  @override
  void json(Map<String, dynamic> json) {
    area = jsonArea(json["area"])!;
    floor = Floor.json(json["floor"]);
    ceiling = Floor.json(json["ceiling"]);
    gadgets = List.generate(json["gadgets"].length, (index) => Gadget.json(json["gadgets"][index]));
    name = json["name"];
    color = json["color"];
    if(json.containsKey("image")) {
      image = File(json["image"]);
    }
  }
}