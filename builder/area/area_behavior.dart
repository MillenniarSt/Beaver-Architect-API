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

  AreaBehavior.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    name = json["name"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "name": name
  };
}