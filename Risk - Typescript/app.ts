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

    //for positioning army count text on canvas (as well as for initializing pixels in MapBuilder)
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
        for (var i = 0; i < this.pixels.length; i++) {
            if ((this.pixels[i].x === point.x) && (this.pixels[i].y === point.y)) {
                return true;
            }
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
        for (var i = 0; i < this.territories.length; i++)
        {
            if (this.territories[i].wasClicked(point))
                return this.territories[i];
        }
        return false;
    }
}

class MapDisplay {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    image: ImageData;

    constructor() {
        this.canvas = <HTMLCanvasElement> document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");
        this.image = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    draw(game: Game) {
        this.context.putImageData(this.image, 0, 0);
    
        for (var i = 0; i < game.map.territories.length; i++)
            this.drawText(game.map.territories[i]);
    }

    fillPixels(pixels: Array<Point>, color: Color) {
        for (var i = 0; i < pixels.length; i++) {
            var index = (pixels[i].x + pixels[i].y * this.canvas.width)*4;

            this.image.data[index + 0] = color.r;
            this.image.data[index + 1] = color.g;
            this.image.data[index + 2] = color.b;
            this.image.data[index + 3] = color.a;
        }
    }

    private drawText(territory: Territory) {
        this.context.fillStyle = this.getTextColor(territory.color);
        this.context.fillText(territory.armyCount.toString(), territory.position.x, territory.position.y);
    }

    private getTextColor(color: Color): string {
        var greyscale = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
        if (greyscale < 186) {
            return "white";
        }
        return "black";
    }
}

class Nation {
    name: string;
    color: Color;
    index: number;
    territories: Array<Territory>;
    armiesToPlace: number;
    cards: Array<number>;
   
    constructor(name: string, color: Color, index: number) {
        this.name = name;
        this.color = color;
        this.index = index;
        this.territories = new Array<Territory>();
        this.armiesToPlace = 0;
    
        this.cards = new Array<number>();
        for (var i = 0; i < 3; i++) {
            this.cards.push(0);
        }
    }

    handInCards() {
        if ((this.cards[0] >= 1) && (this.cards[1] >= 1) && (this.cards[2] >= 1)) {
            this.cards[0] -= 1;
            this.cards[1] -= 1;
            this.cards[2] -= 1;

            this.armiesToPlace += 15;
        }

        else {
            for (var i = 0; i < this.cards.length; i++) {
                if (this.cards[i] >= 3) {
                    this.cards[i] -= 3;

                    this.armiesToPlace += 7;
                }
            }
        }
    }
}

class AI extends Nation {

    constructor(name: string, color: Color, index: number) {
        super(name, color, index);
    }

    processAITurn(game: Game) {
        this.assignInitialArmies(game);
    }

    private assignInitialArmies(game: Game) {
        while (this.armiesToPlace > 0) {
            this.territories[0, getRand(0, this.territories.length - 1)].armyCount += 1;
            this.armiesToPlace -= 1;
        }

        game.mapDisplay.draw(game);
    }
}

class Game {
    map: RiskMap;
    mapDisplay: MapDisplay;
    nations: Array<any>;
    
    constructor(map: RiskMap) {
        this.map = map;
        this.mapDisplay = new MapDisplay();

        this.nations = new Array(7);
        this.nations[0] = new Nation("Player 1", new Color(0, 220, 120), 0);
        this.nations[1] = new AI("Player 2", new Color(255, 255, 255), 1);
        this.nations[2] = new AI("Player 3", new Color(140, 0, 0), 2);
        this.nations[3] = new AI("Player 4", new Color(0, 202, 10), 3);
        this.nations[4] = new AI("Player 5", new Color(0, 0, 255), 4);
        this.nations[5] = new AI("Player 6", new Color(140, 140, 140), 5);
        this.nations[6] = new AI("Player 7", new Color(150, 150, 0), 6);
        
        this.assignInitialTerritories();
        this.assignInitialArmies();

        this.bindEvents();
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
        territory.color = nation.color;
        nation.territories.push(territory);

        this.mapDisplay.fillPixels(territory.pixels, nation.color);
        this.mapDisplay.draw(this);
    }

    private assignInitialArmies() {
        var numberOfArmiesToAssign = 20;
        for (var i = 0; i < numberOfArmiesToAssign; i++) {
            for (var j = 0; j < this.nations.length; j++) {
                var randomIndex = getRand(0, this.nations[j].territories.length-1);
                this.nations[j].territories[randomIndex].armyCount += 1;
            }
        }

        this.mapDisplay.draw(this);
    }

    endTurn() {
        for (var i = 1; i < this.nations.length; i++) {
            this.calculateIncome(this.nations[i]);
            this.nations[i].processAITurn(this);
        }

        this.calculateIncome(this.nations[0]);
    }

    private calculateIncome(nation: Nation) {
        var BASE_INCOME = 3;
        var ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES = 7;
        nation.armiesToPlace = BASE_INCOME;
        nation.armiesToPlace += nation.territories.length / ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES;           
    }

    private bindEvents() {
        var that = this;
        this.mapDisplay.canvas.addEventListener("click", function (event) {
            var rect = that.mapDisplay.canvas.getBoundingClientRect();
            var x = event.pageX - rect.left;
            var y = event.pageY - rect.top;

            var territory = that.map.territoryAtPoint(new Point(Math.round(x), Math.round(y)));
            if (territory) {
                that.mapDisplay.fillPixels(territory.pixels, new Color(0, 0, 0));
                that.mapDisplay.draw(that);
            }
        }, false);

        document.onkeydown = function (event) {
            if (event.keyCode === 13) {
         //       if (that.nations[0].armiesToPlace === 0) {
                    that.endTurn();
           //     }
            }
        };
    }
}

window.onload = () => {
    var mapBuilder = new MapBuilder();
    mapBuilder.worldMap(function (map) {
        var game = new Game(map);
    });
};