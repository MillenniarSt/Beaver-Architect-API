import '../../data/database.dart';
import '../../engineer/components.dart';

class AreaBehavior implements Savable {

  @override
  late final id;

  late String name;

  late Floor floor;
  late Floor ceiling;
  late List<Gadget> gadgets;

  AreaBehavior() {
    id = uuid.v4();
  }

  AreaBehavior.map(Map<String, dynamic> map) {
    this.map(map);
  }

  @override
  void map(Map<String, dynamic> map) {
    id = map["id"];
    name = map["name"];
  }

  @override
  Map<String, dynamic> toMap() => {
    "id": id,
    "name": name
  };

  @override
  List<Savable> get childrenToMap => [];

  @override
  String get mapId => "behaviors";
}