import '../builder/project.dart';
import '../data/database.dart';
import '../engineer/engineer.dart';
import '../engineer/style.dart';

class Architect implements Savable {

  @override
  late final String id;

  List<Engineer> engineers = [];

  Style style;

  Architect(this.engineers, this.style) {
    id = uuid.v4();
  }

  Architect.json(this.engineers, this.style, Map<String, dynamic> json) {
    this.json(json);
  }

  Future<void> build(Project project, Engineer engineer) async {
    //TODO
  }

  @override
  void json(Map<String, dynamic> json) {
    id = json["id"];
    engineers = List.generate(json["engineers"].length, (index) => Engineer.json(json["engineers"][index]));
    style = Style.json(json["style"]);
  }

  @override
  Map<String, dynamic> toJson() => {
    "id": id,
    "engineers": List.generate(engineers.length, (index) => engineers[index].toJson()),
    "style": style.toJson()
  };
}