
import '../data/database.dart';
import 'util.dart';

abstract class ComponentStyle implements JsonMappable<Map<String, dynamic>> {

  late final Identifier identifier;
  late final String name;

  ComponentStyle(this.identifier, this.name);

  ComponentStyle.json(Map<String, dynamic> json) {
    this.json(json);
  }

  @override
  void json(Map<String, dynamic> json) {
    identifier = Identifier.string(json["identifier"] as String);
    name = json["name"];
  }

  @override
  Map<String, dynamic> toJson() => {
    "identifier": identifier.toJson(),
    "name": name
  };
}

abstract class Style extends ComponentStyle {

  Style(super.identifier, super.name);

  Style.json(super.json) : super.json();
}

abstract class WallStyle extends ComponentStyle {

  WallStyle(super.identifier, super.name);

  WallStyle.json(super.json) : super.json();
}

abstract class FloorStyle extends ComponentStyle {

  FloorStyle(super.identifier, super.name);

  FloorStyle.json(super.json) : super.json();
}

abstract class RoofStyle extends ComponentStyle {

  RoofStyle(super.identifier, super.name);

  RoofStyle.json(super.json) : super.json();
}

abstract class GadgetStyle extends ComponentStyle {

  late final SizeDependency size;

  GadgetStyle(super.identifier, super.name);

  GadgetStyle.json(super.json) : super.json();

  @override
  void json(Map<String, dynamic> json) {
    super.json(json);
    size = SizeDependency.json(json["size"]);
  }

  @override
  Map<String, dynamic> toJson() => super.toJson()..["size"] = size.toJson();
}