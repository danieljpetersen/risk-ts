﻿//temporary -- need to replace with good random num generator
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

        if (this.r > 255)
            this.r = 255;
        else if (this.r < 0)
            this.r = 0;

        if (this.g > 255)
            this.g = 255;
        else if (this.g < 0)
            this.g = 0;

        if (this.b > 255)
            this.b = 255;
        else if (this.b < 0)
            this.b = 0;
    }
}

class Territory {
    name: string;

    //pixels on the map image which belong to this territory
    pixels: Array<Point>;

    //for positioning army count text on canvas (as well as for initializing pixels in MapBuilder)
    position: Point;

    //needs to know what continent it's part of for the AI to easily determine continent border territories
    continentIndex: number;

    //the index of this territory in game.territories;  just because it helps out slightly with pathfinding
    index: number;

    continentBorder: boolean;

    color: Color;

    armyCount: number;

    owner: number;

    neighbors: Array<Territory>;

    constructor(name: string, point: Point) {
        this.name = name;
        this.pixels = new Array<Point>();
        this.position = point;
        this.continentIndex = -1;
        this.color = new Color(0, 0, 0, 0);
        this.armyCount = 0;
        this.owner = -1;
        this.neighbors = new Array<Territory>();
        this.continentBorder = false;
    }

    wasClicked(point: Point): boolean {
        for (var i = 0; i < this.pixels.length; i++) {
            if ((this.pixels[i].x === point.x) && (this.pixels[i].y === point.y)) {
                return true;
            }
        }
        return false;
    }

    isNeighbor(territory: Territory): boolean {
        for (var i = 0; i < this.neighbors.length; i++) {
            if (this.neighbors[i].name === territory.name)
                return true;
        }
        return false;
    }
}

class Continent {
    name: string;

    territories: Array<Territory>;

    index: number;

    //each continent gets unique color in case user wants to know which territory belongs to which continent
    color: Color;

    //if one nation owns entirety of continent, this is the troop bonus they get per turn
    incomeBonus: number;

    borderTerritories: Array<Territory>;

    constructor() {
        this.name = "";
        this.territories = new Array<Territory>();
        this.borderTerritories = new Array<Territory>();
        this.color = new Color(0, 0, 0, 0);
        this.index = -1;
        this.incomeBonus = 0;
    }

    hasSingleOwner(): boolean {
        for (var i = 0; i < this.territories.length - 1; i++) {
            if (this.territories[i].owner !== this.territories[i + 1].owner)
                return false;
        }
        return true;
    }

    doesNationOwnEntireContinent(nation: Nation): boolean {
        if (nation.index === this.territories[0].owner) {
            return this.hasSingleOwner();
        }
        return false;
    }

    calculateBorderTerritories() {
        for (var i = 0; i < this.territories.length; i++) {
            for (var j = 0; j < this.territories[i].neighbors.length; j++) {
                if (this.territories[i].neighbors[j].continentIndex !== this.index) {
                    this.borderTerritories.push(this.territories[i]);
                    this.territories[i].continentBorder = true;
                    break;
                }
            }
        }
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

    //push to screen
    draw(game: Game) {
        this.context.putImageData(this.image, 0, 0);
    
        for (var i = 0; i < game.map.territories.length; i++)
            this.drawText(game.map.territories[i]);
    }

    //modify image in memory
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
        if (territory.armyCount >= 1) {
            this.context.fillStyle = this.getTextColor(territory.color);
            var armyCount = Math.round(territory.armyCount*10)/10;
            this.context.fillText(armyCount.toString(), territory.position.x, territory.position.y);
        }
    }

    private getTextColor(color: Color): string {
        var greyscale = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
        if (greyscale < 186) {
            return "white";
        }
        return "black";
    }

    getCanvasPosition(event): Point {
        var rect = this.canvas.getBoundingClientRect();
        var x = event.pageX - rect.left;
        var y = event.pageY - rect.top;

        var windowLeft = window.pageXOffset || document.documentElement.scrollLeft;
        var windowTop = window.pageYOffset || document.documentElement.scrollTop;

        x -= windowLeft;
        y -= windowTop;

        return new Point(Math.round(x), Math.round(y));
    }
}

class Nation {
    name: string;
    color: Color;
    index: number;
    territories: Array<Territory>;
    armiesToPlace: number;
    cards: Array<number>;
    cardGainedThisTurn: boolean;
   
    constructor(name: string, color: Color, index: number) {
        this.name = name;
        this.color = color;
        this.index = index;
        this.territories = new Array<Territory>();
        this.armiesToPlace = 3;
    
        this.cards = new Array<number>();
        for (var i = 0; i < 3; i++) {
            this.cards.push(0);
        }
    }

    isAlive(): boolean {
        if (this.territories.length === 0)
            return false;
        return true;
    }

    addRandomCardIfApplicable() {
        if (this.cardGainedThisTurn !== true) {
            this.cards[0, getRand(0, 2)] += 1;
            this.cardGainedThisTurn = true;
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
        this.cardGainedThisTurn = false;
    }
}

class Game {
    map: RiskMap;
    mapDisplay: MapDisplay;
    nations: Array<any>;
    shiftKeyPressed: boolean; 
    aSelectedTerritory: Territory;
    bSelectedTerritory: Territory;
    pathfinder: Pathfinding;

    //(0-1):  when attacking / moving, whether to use entire army, 1/2 army, or 1/3rd army
    armyUsageMode: number;

    constructor(map: RiskMap) {
        this.map = map;
        this.mapDisplay = new MapDisplay();
        this.pathfinder = new Pathfinding(this.map.territories);
        this.shiftKeyPressed = false;
        this.aSelectedTerritory = null;
        this.bSelectedTerritory = null;
        this.armyUsageMode = 1;

        this.nations = new Array(7);
        this.nations[0] = new Nation("Player 1", new Color(0, 0, 255), 0);
        this.nations[1] = new AI("Player 2", new Color(200, 200, 200), 1);
        this.nations[2] = new AI("Player 3", new Color(140, 0, 0), 2);
        this.nations[3] = new AI("Player 4", new Color(0, 202, 10), 3);
        this.nations[4] = new AI("Player 5", new Color(0, 220, 120), 4);
        this.nations[5] = new AI("Player 6", new Color(0, 140, 140), 5);
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

        for (var i = 0; i < this.nations.length; i++) {
            this.calculateIncome(this.nations[i]);
        }
        this.syncArmiesToAssignWithDOM();
    }

    private changeTerritoryOwner(nation: Nation, territory: Territory) {
        //remove territory from current owner;
        if (territory.owner !== -1) {
            var array = [];

            for (var i = 0; i < this.nations[territory.owner].territories.length; i++) {
                if (this.nations[territory.owner].territories[i].name !== territory.name) {
                    array.push(this.nations[territory.owner].territories[i]);
                }
            }
            this.nations[territory.owner].territories = array;
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
            if (this.nations[i].isAlive()) {
                this.calculateIncome(this.nations[i]);
                this.nations[i].processAITurn(this);
            }
        }

        this.calculateIncome(this.nations[0]);
        this.syncArmiesToAssignWithDOM();
        this.syncCardsWithDOM();
    }

    private syncArmiesToAssignWithDOM() {
        if (this.nations[0].armiesToPlace > 0)
            document.getElementById("output-text").innerHTML = this.nations[0].armiesToPlace.toString() + " Armies Left To Assign";
        else
            this.syncSelectedTerritoriesWithDOM();
    }

    private syncSelectedTerritoriesWithDOM() {
        if (this.nations[0].armiesToPlace === 0) {
            if (this.aSelectedTerritory === null) {
                document.getElementById("output-text").innerHTML = "No Territory Selected";
            }
            else {
                var text = this.aSelectedTerritory.name;
                if (this.bSelectedTerritory !== null) {
                    text += ", " + this.bSelectedTerritory.name;

                    if (this.aSelectedTerritory.owner === this.bSelectedTerritory.owner)
                        text += " - Right click to Move";
                    else
                        text += " - Right click to Attack";
                }
                document.getElementById("output-text").innerHTML = text;
            }
        }
    }

    private syncCardsWithDOM() {
        var text = " -- Cards:  Red: " + this.nations[0].cards[0].toString();
        text += ", Blue: " + this.nations[0].cards[1].toString();
        text += ", Green: " + this.nations[0].cards[2].toString();
        text += " (1 of each card:  +15 income.  3 of a kind:  +7 income.  See help below)"
        
        document.getElementById("output-text").innerHTML += text;
    }

    private calculateIncome(nation: Nation) {
        var BASE_INCOME = 3;
        var ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES = 7;
        nation.armiesToPlace = BASE_INCOME;
        nation.armiesToPlace += Math.floor(nation.territories.length / ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES);           

        for (var i = 0; i < this.map.continents.length; i++) {
            if (this.map.continents[i].doesNationOwnEntireContinent(nation)) {
                nation.armiesToPlace += this.map.continents[i].incomeBonus;
            }
        }
        nation.handInCards();
    }

    handleTerritorySelection(territory: Territory, bTerritory = null) {
        if (bTerritory !== null) {
            this.deselectTerritories();
            this.aSelectedTerritory = territory;
            this.bSelectedTerritory = bTerritory;
            return;
        }

        var selectedColor = new Color(territory.color.r + 50, territory.color.g + 50, territory.color.b + 50);

        if (this.aSelectedTerritory === null) {
            if (territory.armyCount > 0) {
                this.mapDisplay.fillPixels(territory.pixels, selectedColor);
                this.aSelectedTerritory = territory;
            }
        }
        else if (this.aSelectedTerritory.name === territory.name) {
            this.aSelectedTerritory = null;
            this.mapDisplay.fillPixels(territory.pixels, territory.color);

            if (this.bSelectedTerritory !== null) {
                this.mapDisplay.fillPixels(this.bSelectedTerritory.pixels, this.bSelectedTerritory.color);
                this.bSelectedTerritory = null;
            }
        }
        else if (this.bSelectedTerritory === null) {
            if (this.aSelectedTerritory.isNeighbor(territory)) {
                this.bSelectedTerritory = territory;
                this.mapDisplay.fillPixels(territory.pixels, selectedColor);
            }
            else {
                this.deselectTerritories();
            }
        }
        else if (this.bSelectedTerritory.name === territory.name) {
            this.mapDisplay.fillPixels(territory.pixels, territory.color);
            this.bSelectedTerritory = null;
        }
        else {
            this.deselectTerritories();
        }
        this.syncSelectedTerritoriesWithDOM();        
        this.mapDisplay.draw(this);
    }

    deselectTerritories() {
        if (this.aSelectedTerritory !== null) {
            this.mapDisplay.fillPixels(this.aSelectedTerritory.pixels, this.aSelectedTerritory.color);
            this.aSelectedTerritory = null;
        }
        if (this.bSelectedTerritory !== null) {
            this.mapDisplay.fillPixels(this.bSelectedTerritory.pixels, this.bSelectedTerritory.color);
            this.bSelectedTerritory = null;
        }
        this.syncSelectedTerritoriesWithDOM();
    }
    
    //always assumes aSelectedTerritory / bSelectedTerritory are not null
    moveArmies(armyUsage: number, nonRatio = false) {
        if (nonRatio) {
            var aArmy = armyUsage;
        }
        else {
            var aArmy = this.aSelectedTerritory.armyCount * this.armyUsageMode;
        }
        this.aSelectedTerritory.armyCount -= aArmy;
        this.bSelectedTerritory.armyCount += aArmy;

        this.deselectTerritories();
        this.mapDisplay.draw(this);
    }
    
    //always assumes aSelectedTerritory / bSelectedTerritory are not null
    attack(armyUsage): boolean {
        var aArmy = Math.round(this.aSelectedTerritory.armyCount * this.armyUsageMode);
        if (aArmy >= 1) {
            while ((aArmy > 0) && (this.bSelectedTerritory.armyCount > 0)) {
                var roll = getRand(0, 100);
                if (roll > 50) {
                    aArmy -= 1;
                    this.aSelectedTerritory.armyCount -= 1;
                }
                else {
                    this.bSelectedTerritory.armyCount -= 1;
                }
            }

            //attacker loses!
            if (aArmy <= 0) {
                this.deselectTerritories();
                var attackerWins = false;
            }

            //attacker wins!
            else if (this.bSelectedTerritory.armyCount <= 0) {
                var attackerWins = true;
                this.nations[this.aSelectedTerritory.owner].addRandomCardIfApplicable();
                this.aSelectedTerritory.armyCount -= aArmy;

                //penalty of 1 for taking over new territory
                aArmy -= 1
                this.bSelectedTerritory.armyCount = aArmy;
                this.changeTerritoryOwner(this.nations[this.aSelectedTerritory.owner], this.bSelectedTerritory);
                this.deselectTerritories();
            }

            this.mapDisplay.draw(this);
            return attackerWins;
        }
        else
            console.log('less than zero');

        return false;
    }

    private bindEvents() {
        var that = this;

        //right click
        this.mapDisplay.canvas.oncontextmenu = function (event) {
            event.preventDefault();
            that.handleMousePress('right', event);
        };
        this.mapDisplay.canvas.addEventListener("click", function (event) {
            that.handleMousePress('left', event);
        }, false);

        document.onkeydown = function (event) {
            //enter
            if (event.keyCode === 13) {
                that.deselectTerritories(); 

                if ((that.nations[0].armiesToPlace === 0) || (that.nations[0].isAlive() !== true)) {
                    that.endTurn();
                }
            }

            //1
            if ((event.keyCode === 49) || (event.keyCode === 97)) {
                that.armyUsageMode = 1;
                document.getElementById("army-usage-mode").innerHTML = "Entire Army";
            }

            //2
            if ((event.keyCode === 50) || (event.keyCode === 98)) {
                that.armyUsageMode = 0.5;
                document.getElementById("army-usage-mode").innerHTML = "Half Army";
            }

            //3
            if ((event.keyCode === 51) || (event.keyCode === 99)) {
                that.armyUsageMode = 0.333333333333333333333;
                document.getElementById("army-usage-mode").innerHTML = "1/3rd Army";
            }

            that.shiftKeyPressed = event.shiftKey;
        };

        document.onmouseup = function (event) {
            that.shiftKeyPressed = event.shiftKey;
        }
    }

    handleMousePress(button: string, event) {
        for (var i = 0; i < this.map.continents.length; i++) {
            for (var j = 0; j < this.map.continents[i].borderTerritories.length; j++) {
                var t = this.map.continents[i].borderTerritories[j];
         //       this.mapDisplay.fillPixels(t.pixels, new Color(0, 0, 0));
            }
          //  this.mapDisplay.draw(this);
        }
    

        var position = this.mapDisplay.getCanvasPosition(event);
        var territory = this.map.territoryAtPoint(position);
        if (territory) {
            if (this.nations[0].armiesToPlace > 0) {
                if (button === 'left') {
                    this.handleHumanArmyPlacement(territory, 1);
                }
                else {
                    this.handleHumanArmyPlacement(territory, 100);
                }
            }
            else {
                //can't do anything if we click on a territory that's not ours while we have nothing selected
                if ((this.aSelectedTerritory === null) && (territory.owner !== 0)) { }
                else {
                    this.handleTerritorySelection(territory);

                    if (this.aSelectedTerritory !== null) {
                        if (this.bSelectedTerritory !== null) {
                            if (this.aSelectedTerritory.owner === this.bSelectedTerritory.owner) {
                                this.moveArmies(this.armyUsageMode);
                            }
                            else {
                                this.attack(this.armyUsageMode);
                            }
                        }
                    }
                }
            }
        }
    }
 
    handleHumanArmyPlacement(territory: Territory, armiesToPlace: number) {
        if (territory.owner === 0) {
            //ensure we're not giving the player more armies than they have available
            armiesToPlace = Math.min(armiesToPlace, this.nations[0].armiesToPlace);

            territory.armyCount += armiesToPlace;
            this.nations[0].armiesToPlace -= armiesToPlace;
            this.mapDisplay.draw(this);

            this.syncArmiesToAssignWithDOM();
        }
    }
}

window.onload = () => {
    var mapBuilder = new MapBuilder();
    mapBuilder.worldMap(function (map) {
        var game = new Game(map);

        var pathfinder = new Pathfinding(game.map.territories);
        var a = game.map.territories[0];
        var b = game.map.territories[16];
        console.log(a.name, b.name);
        pathfinder.findPath(a, b);
    });
};