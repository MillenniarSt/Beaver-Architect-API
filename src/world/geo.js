class Geo {

    type;
}

class Parallelepiped extends Geo {

    type = "parallelepiped";

    dimension;

    constructor(dimension) {
        super();
        this.dimension = dimension;
    }
}

class Sphere extends Parallelepiped {

    constructor(dimension) {
        super(dimension);
    }

    type = "sphere";
}

class Prism extends Geo {

    type = "prism";

    root;

    y;
    height;

    constructor(root, y, height) {
        super();
        this.root = root;
        this.y = y;
        this.height = height;
    }
}

class Cone extends Prism {

    type = "cone";

    constructor(root, y, height) {
        super(root, y, height);
    }
}

module.exports = { Geo, Parallelepiped, Sphere, Prism, Cone };