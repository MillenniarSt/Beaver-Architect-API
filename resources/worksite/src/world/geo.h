class Geo {

};


class Geo2: public Geo {

    public:
        float** getVertices();
};

class Geo3: public Geo {

    public:
        float** getVertices();
};


class Line2: public Geo2 {

    public:
        float** getSegments();
};

class Plane2: public Geo2 {

    public:
        int** getTriangles();
};


class Line3: public Geo3 {

    public:
        float** getSegments();
};

class Surface: public Geo3 {

    public:
        int** getTriangles();
};

class Object3: public Geo3 {

    public:
        int** getTriangles();
};