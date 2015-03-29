//temporary -- need to replace with good random num generator
function getRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    var counter = array.length, temp, index;

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

var Point = (function () {
    function Point(x, y) {
        if (typeof x === "undefined") { x = 0; }
        if (typeof y === "undefined") { y = 0; }
        this.x = x;
        this.y = y;
    }
    return Point;
})();

var Color = (function () {
    function Color(r, g, b, a) {
        if (typeof a === "undefined") { a = 255; }
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    return Color;
})();

var Territory = (function () {
    function Territory(name, point) {
        this.name = name;
        this.pixels = new Array();
        this.position = point;
        this.color = new Color(0, 0, 0, 0);
        this.armyCount = 0;
        this.owner = -1;
    }
    Territory.prototype.wasClicked = function (point) {
        for (var i = 0; i < this.pixels.length; i++) {
            if (this.pixels[i] == point)
                return true;
        }
        return false;
    };
    return Territory;
})();

var Continent = (function () {
    function Continent() {
        this.name = "";
        this.territories = new Array();
        this.color = new Color(0, 0, 0, 0);
        this.incomeBonus = 0;
    }
    Continent.prototype.hasSingleOwner = function () {
        for (var i = 0; i < this.territories.length - 1; i++) {
            if (this.territories[i].owner !== this.territories[i + 1].owner)
                return false;
        }
        return true;
    };
    return Continent;
})();

var RiskMap = (function () {
    function RiskMap(name) {
        this.name = name;
        this.continents = new Array();
        this.territories = new Array();
    }
    RiskMap.prototype.territoryAtPoint = function (point) {
        for (var i = 0; i < this.continents.length; i++) {
            for (var j = 0; j < this.continents[i].territories.length; j++) {
                if (this.continents[i].territories[j].wasClicked(point))
                    return this.continents[i].territories[j];
            }
        }
        return false;
    };
    return RiskMap;
})();

var MapDisplay = (function () {
    function MapDisplay() {
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");
    }
    MapDisplay.prototype.fillPixels = function (pixels, color) {
        var image = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        for (var i = 0; i < pixels.length; i++) {
            var index = (pixels[i].x + pixels[i].y * this.canvas.width) * 4;

            image.data[index + 0] = color.r;
            image.data[index + 1] = color.g;
            image.data[index + 2] = color.b;
            image.data[index + 3] = color.a;
        }
        this.context.putImageData(image, 0, 0);
    };

    MapDisplay.prototype.drawText = function (territory) {
        //to remove any old text
        this.fillPixels(territory.pixels, territory.color);
        this.context.fillStyle = this.getTextColor(territory.color);
        this.context.fillText(territory.armyCount.toString(), territory.position.x, territory.position.y);
    };

    MapDisplay.prototype.getTextColor = function (color) {
        var greyscale = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
        if (greyscale < 186) {
            return "white";
        }
        return "black";
    };
    return MapDisplay;
})();

var Nation = (function () {
    function Nation(name, color, index) {
        this.name = name;
        this.color = color;
        this.index = index;
        this.territories = new Array();
        this.cards = new Array();
        this.armiesToPlace = new Array();
    }
    Nation.prototype.handInCards = function () {
    };
    return Nation;
})();

var Game = (function () {
    function Game(map) {
        this.map = map;
        this.mapDisplay = new MapDisplay();

        this.nations = new Array(7);
        this.nations[0] = new Nation("Player 1", new Color(0, 220, 120), 0);
        this.nations[1] = new Nation("Player 2", new Color(255, 255, 255), 1);
        this.nations[2] = new Nation("Player 3", new Color(140, 0, 0), 2);
        this.nations[3] = new Nation("Player 4", new Color(0, 202, 10), 3);
        this.nations[4] = new Nation("Player 5", new Color(0, 0, 255), 4);
        this.nations[5] = new Nation("Player 6", new Color(140, 140, 140), 5);
        this.nations[6] = new Nation("Player 7", new Color(150, 150, 0), 6);

        this.assignInitialTerritories();
        this.assignInitialArmies();
    }
    Game.prototype.assignInitialTerritories = function () {
        var territoryIndexes = new Array(this.map.territories.length);
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
    };

    Game.prototype.changeTerritoryOwner = function (nation, territory) {
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
    };

    Game.prototype.assignInitialArmies = function () {
        var numberOfArmiesToAssign = 20;
        for (var i = 0; i < numberOfArmiesToAssign; i++) {
            for (var j = 0; j < this.nations.length; j++) {
                var randomIndex = getRand(0, this.nations[j].territories.length - 1);
                this.nations[j].territories[randomIndex].armyCount += 1;
            }
        }

        for (var i = 0; i < this.map.territories.length; i++) {
            this.mapDisplay.drawText(this.map.territories[i]);
        }
    };

    Game.prototype.endTurn = function () {
    };

    Game.prototype.calculateIncome = function (nation) {
    };
    return Game;
})();

window.onload = function () {
    var mapBuilder = new MapBuilder();
    mapBuilder.worldMap(function (map) {
        var game = new Game(map);
    });
};
//# sourceMappingURL=app.js.map
