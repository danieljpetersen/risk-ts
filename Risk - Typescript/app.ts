class Point {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

class Color {
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(r: number, g: number, b: number, a = 255) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

class Territory {
    name: string;

    //pixels on the map image which belong to this territory
    pixels: Array<Point>;

    //for positioning army count text on canvas
    position: Point;

    color: Color;

    armyCount: number;

    owner: number;

    constructor(name: string, point: Point) {
        this.name = name;
        this.pixels = new Array<Point>();
        this.position = point;
        this.color = new Color(0, 0, 0, 0);
        this.armyCount = 0;
        this.owner = -1;
    }

    wasClicked(point: Point): boolean {
        //alternatively, probably better if we can keep a copy of the original image and compare this territories original color to that of the point clicked
        for (var i = 0; i < this.pixels.length; i++) {
            if (this.pixels[i] == point)
                return true;
        }
        return false;
    }
}

class Continent {
    name: string;

    territories: Array<Territory>;

    //each continent gets unique color in case user wants to which territory belongs to which continent
    color: Color;

    //if one nation owns entirety of continent, this is the troop bonus they get per turn
    incomeBonus: number;

    constructor() {
        this.name = "";
        this.territories = new Array<Territory>();
        this.color = new Color(0, 0, 0, 0);
        this.incomeBonus = 0;
    }

    hasSingleOwner(): boolean {
        for (var i = 0; i < this.territories.length - 1; i++) {
            if (this.territories[i].owner !== this.territories[i + 1].owner)
                return false;
        }
        return true;
    }
}

class RiskMap {
    name: string;
    continents: Array<Continent>;
    image: HTMLImageElement;

    constructor(name: string) {
        this.name = name;
        this.continents = new Array<Continent>();
    }

    territoryAtPoint(point: Point): any {
        for (var i = 0; i < this.continents.length; i++)
        {
            for (var j = 0; j < this.continents[i].territories.length; j++) {
                if (this.continents[i].territories[j].wasClicked(point))
                    return this.continents[i].territories[j];
            }
        }
        return false;
    }
}

class MapDisplay {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    constructor() {
        this.canvas = <HTMLCanvasElement> document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");
    }

    fillPixels(pixels: Array<Point>, color: Color) {
        var image = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        for (var i = 0; i < pixels.length; i++) {
            var index = (pixels[i].x + pixels[i].y * this.canvas.width)*4;

            image.data[index + 0] = color.r;
            image.data[index + 1] = color.g;
            image.data[index + 2] = color.b;
            image.data[index + 3] = color.a;
        } 
        this.context.putImageData(image, 0, 0);
    }
}

window.onload = () => {
    var mapBuilder = new MapBuilder();
    mapBuilder.worldMap(function (map) {
        var mapDisplay = new MapDisplay();
        for (var i = 0; i < map.continents[0].territories.length; i++)
            mapDisplay.fillPixels(map.continents[0].territories[i].pixels, new Color(20, 20, 20));
    });
};