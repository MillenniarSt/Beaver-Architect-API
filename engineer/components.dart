import '../architect/architect.dart';
import '../world/world3D.dart';
import 'style.dart';

abstract class Component<S extends ComponentStyle> {

  S style;
  Dimension dimension;

  Component(this.style, this.dimension);

  void random();

  void build(Architect architect);
}

class Wall extends Component<WallStyle> {

  Wall(super.style, super.dimension);

  @override
  void build(Architect architect) {
    // TODO: implement build
  }

  @override
  void random() {
    // TODO: implement random
  }
}

class Floor extends Component<FloorStyle> {

  Floor(super.style, super.dimension);

  @override
  void build(Architect architect) {
    // TODO: implement build
  }

  @override
  void random() {
    // TODO: implement random
  }
}

class Roof extends Component<RoofStyle> {

  Roof(super.style, super.dimension);

  @override
  void build(Architect architect) {
    // TODO: implement build
  }

  @override
  void random() {
    // TODO: implement random
  }
}

class Gadget extends Component<GadgetStyle> {

  Gadget(super.style, super.dimension);

  @override
  void build(Architect architect) {
    // TODO: implement build
  }

  @override
  void random() {
    // TODO: implement random
  }
}