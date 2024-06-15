import '../builder/project.dart';
import '../data/database.dart';

abstract class Architect implements Savable {

  @override
  late final String id;

  final D data;

  S style;

  Architect(this.data, this.style) {
    id = uuid.v4();
  }

  Architect.map(this.data, this.style, Map<String, dynamic> map) {
    this.map(map);
  }

  Future<void> build(Project project);

  @override
  String get mapId => "architect";

  @override
  void map(Map<String, dynamic> map) {
    id = map["id"];
  }

  @override
  Map<String, dynamic> toMap() => {
    "id": id
  };
}