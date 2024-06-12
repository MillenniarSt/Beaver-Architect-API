import '../architect/architect.dart';
import '../world/world3D.dart';
import 'style.dart';

abstract class Component<C extends Architect, S extends ComponentStyle> {

  S style;
  Dimension dimension;

  Component(this.style, this.dimension);

  void random();

  void build(C converter);
}

abstract class Wall<C extends Architect, S extends WallStyle> extends Component<C, S> {

  Wall(super.style, super.dimension);
}

abstract class Floor<C extends Architect, S extends FloorStyle> extends Component<C, S> {

  Floor(super.style, super.dimension);
}

abstract class Roof<C extends Architect, S extends RoofStyle> extends Component<C, S> {

  Roof(super.style, super.dimension);
}

abstract class Gadget<C extends Architect, S extends GadgetStyle> extends Component<C, S> {

  Gadget(super.style, super.dimension);
}