﻿class Point {
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

    //each continent gets unique color in case user wants to know which territory belongs to which continent
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
    territories: Array<Territory>;
    image: HTMLImageElement;

    constructor(name: string) {
        this.name = name;
        this.continents = new Array<Continent>();
        this.territories = new Array<Territory>();
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

class Nation {
    name: string;
    color: Color;
    index: number;
    territories: Array<Territory>;
    cards: Array<number>;
    armiesToPlace: Array<number>;

    constructor(name: string, color: Color, index: number) {
        this.name = name;
        this.color = color;
        this.index = index;
        this.territories = new Array<Territory>();
        this.cards = new Array<number>();
        this.armiesToPlace = new Array<number>();
    }

    handInCards() {

    }
}

declare module "mersenneTwister.js" {
    var noTypeInfoYet: any; // any var name here really
    export = noTypeInfoYet;
}

//temporary -- need to replace with good random num generator
function getRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

class Game {
    map: RiskMap;
    mapDisplay: MapDisplay;
    nations: Array<Nation>;
    
    constructor(map: RiskMap) {
        this.map = map;
        this.mapDisplay = new MapDisplay();

        this.nations = new Array<Nation>(7);
        this.nations[0] = new Nation("Player 1", new Color(0, 0, 0), 0);
        this.nations[1] = new Nation("Player 2", new Color(255, 255, 255), 1);
        this.nations[2] = new Nation("Player 3", new Color(255, 0, 0), 2);
        this.nations[3] = new Nation("Player 4", new Color(0, 255, 0), 3);
        this.nations[4] = new Nation("Player 5", new Color(0, 0, 255), 4);
        this.nations[5] = new Nation("Player 6", new Color(140, 140, 140), 5);
        this.nations[6] = new Nation("Player 7", new Color(150, 150, 0), 6);

        this.assignInitialTerritories();
    }

    private assignInitialTerritories() {
        var territoryIndexes = new Array<number>(this.map.territories.length);
        for (var i = 0; i < territoryIndexes.length; i++) {
            territoryIndexes[i] = i;
        }

        shuffleArray(territoryIndexes);

        var loop = true;
        while (loop) {
            for (var i = 0; i < this.nations.length; i++) {
                var territory = this.map.territories[territoryIndexes[0]];
                this.changeTerritoryOwner(this.nations[i], territory);

                territoryIndexes.shift();
                if (territoryIndexes.length === 0) {
                    loop = false;
                    break;
                }
            }
        }
    }

    private changeTerritoryOwner(nation: Nation, territory: Territory) {
        //remove territory from current owner;
        if (territory.owner !== -1) {
            for (var i = 0; i < this.nations[territory.owner].territories.length; i++) {
                if (this.nations[territory.owner].territories[i].name === territory.name) {
                    this.nations[territory.owner].territories.slice(i, 1);
                    break;
                }
            }
        }
        territory.owner = nation.index;
        nation.territories.push(territory);

        this.mapDisplay.fillPixels(territory.pixels, nation.color);
    }

    endTurn() {
    }

    calculateIncome(nation: Nation) {

    }
}

window.onload = () => {
    var mapBuilder = new MapBuilder();
    mapBuilder.worldMap(function (map) {
        var game = new Game(map);
    });
};