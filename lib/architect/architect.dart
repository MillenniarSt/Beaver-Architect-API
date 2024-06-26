import '../builder/layer.dart';
import '../data/database.dart';
import '../engineer/components.dart';
import '../engineer/engineer.dart';
import '../engineer/style.dart';
import '../http/client.dart';
import '../http/engineer.dart';

class Architect implements JsonMappable<Map<String, dynamic>> {

  int selectEngineer = 0;

  List<Engineer> engineers = [];

  late Style style;

  Architect(this.engineers, this.style);

  Architect.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    engineers = List.generate(json["engineers"].length, (index) => Engineer.json(json["engineers"][index]));
    selectEngineer = json["select"];
    style = Style.json(json["style"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "engineers": List.generate(engineers.length, (index) => engineers[index].toJson()),
    "select": selectEngineer,
    "style": style.toJson()
  };

  bool get isEmpty => engineers.isEmpty;

  Engineer? get engineer => engineers[selectEngineer];

  Future<void> build(ClientHttp client, ProjectDatabase database) async {
    EngineerHttp http = engineer!.plugin.http;

    if(await http.openWorksite(client, style, engineer!.options) == "open") {
      for(Map<String, dynamic> jsonLayer in await (await database.layers.find()).toList()) {
        Layer layer = Layer.json(jsonLayer);
        for(Room room in layer.rooms) {
          for(Gadget gadget in room.gadgets) {
            http.buildComponent(gadget);
          }
          http.buildComponent(room.ceiling);
          http.buildComponent(room.floor);
        }
        for(Wall wall in layer.walls) {
          http.buildComponent(wall);
        }
      }

      await http.closeWorksite(client);
    } else {
      //TODO
    }
  }
}