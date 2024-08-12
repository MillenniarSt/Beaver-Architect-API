const { Pos3D } = require("./world3D");

class BasicLine {

    start;
    end;

    constructor(start, end) {
        this.start = start;
        this.end = end;
    }

    get length() {
        if(this.start.y != undefined) {
            return Math.sqrt(Math.pow(this.start.x - this.end.x) + Math.pow(this.start.y - this.end.y) + Math.pow(this.start.z - this.end.z));
        } else {
            return Math.sqrt(Math.pow(this.start.x - this.end.x) + Math.pow(this.start.z - this.end.z));
        }
    }

    to3D(y) {
        return new BasicLine(new Pos3D(this.start.x, this.start.z, this.start.y ?? y), new Pos3D(this.end.x, this.end.z, this.end.y ?? y));
    }
}

//TODO
class CurvedLine extends BasicLine {

    constructor(start, end) {
        super(start, end);
    }

    get length() {
        
    }

    to3D() {
        
    }
}

class Line {

    //List of BasicLine
    lines;

    constructor(lines) {
        this.lines = lines;
    }

    to3D(y) {
        return new Line(lines.map((line) => line.to3D(y)));
    }

    get length() {
        let length = 0;
        this.lines.forEach(line => {
            length += line.length;
        });
        return length;
    }

    get start() {
        return this.lines[0].start;
    }

    get end() {
        return this.lines[this.lines.length -1].end;
    }
}

module.exports = { BasicLine, CurvedLine, Line };