var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
function getRand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(array) {
    var counter = array.length, temp, index;

    while (counter > 0) {
        index = Math.floor(Math.random() * counter);

        counter--;

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
        this.neighbors = new Array();
    }
    Territory.prototype.wasClicked = function (point) {
        for (var i = 0; i < this.pixels.length; i++) {
            if ((this.pixels[i].x === point.x) && (this.pixels[i].y === point.y)) {
                return true;
            }
        }
        return false;
    };

    Territory.prototype.isNeighbor = function (territory) {
        for (var i = 0; i < this.neighbors.length; i++) {
            if (this.neighbors[i].name === territory.name)
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

    Continent.prototype.doesNationOwnEntireContinent = function (nation) {
        if (nation.index === this.territories[0].owner) {
            return this.hasSingleOwner();
        }
        return false;
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
        for (var i = 0; i < this.territories.length; i++) {
            if (this.territories[i].wasClicked(point))
                return this.territories[i];
        }
        return false;
    };
    return RiskMap;
})();

var MapDisplay = (function () {
    function MapDisplay() {
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");
        this.image = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    MapDisplay.prototype.draw = function (game) {
        this.context.putImageData(this.image, 0, 0);

        for (var i = 0; i < game.map.territories.length; i++)
            this.drawText(game.map.territories[i]);
    };

    MapDisplay.prototype.fillPixels = function (pixels, color) {
        for (var i = 0; i < pixels.length; i++) {
            var index = (pixels[i].x + pixels[i].y * this.canvas.width) * 4;

            this.image.data[index + 0] = color.r;
            this.image.data[index + 1] = color.g;
            this.image.data[index + 2] = color.b;
            this.image.data[index + 3] = color.a;
        }
    };

    MapDisplay.prototype.drawText = function (territory) {
        if (territory.armyCount > 0) {
            this.context.fillStyle = this.getTextColor(territory.color);
            this.context.fillText(territory.armyCount.toString(), territory.position.x, territory.position.y);
        }
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
        this.armiesToPlace = 3;

        this.cards = new Array();
        for (var i = 0; i < 3; i++) {
            this.cards.push(0);
        }
    }
    Nation.prototype.isAlive = function () {
        if (this.territories.length === 0)
            return false;
        return true;
    };

    Nation.prototype.handInCards = function () {
        if ((this.cards[0] >= 1) && (this.cards[1] >= 1) && (this.cards[2] >= 1)) {
            this.cards[0] -= 1;
            this.cards[1] -= 1;
            this.cards[2] -= 1;

            this.armiesToPlace += 15;
        } else {
            for (var i = 0; i < this.cards.length; i++) {
                if (this.cards[i] >= 3) {
                    this.cards[i] -= 3;

                    this.armiesToPlace += 7;
                }
            }
        }
    };
    return Nation;
})();

var AI = (function (_super) {
    __extends(AI, _super);
    function AI(name, color, index) {
        _super.call(this, name, color, index);
    }
    AI.prototype.processAITurn = function (game) {
        this.assignStartOfTurnArmies(game);
    };

    AI.prototype.assignStartOfTurnArmies = function (game) {
        while (this.armiesToPlace > 0) {
            this.territories[0, getRand(0, this.territories.length - 1)].armyCount += 1;
            console.log(this.territories);
            this.armiesToPlace -= 1;
        }

        game.mapDisplay.draw(game);
    };
    return AI;
})(Nation);

var Game = (function () {
    function Game(map) {
        this.map = map;
        this.mapDisplay = new MapDisplay();
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
    };

    Game.prototype.assignInitialArmies = function () {
        var numberOfArmiesToAssign = 20;
        for (var i = 0; i < numberOfArmiesToAssign; i++) {
            for (var j = 0; j < this.nations.length; j++) {
                var randomIndex = getRand(0, this.nations[j].territories.length - 1);
                this.nations[j].territories[randomIndex].armyCount += 1;
            }
        }

        this.mapDisplay.draw(this);
    };

    Game.prototype.endTurn = function () {
        for (var i = 1; i < this.nations.length; i++) {
            if (this.nations[i].isAlive()) {
                this.calculateIncome(this.nations[i]);
                this.nations[i].processAITurn(this);
            }
        }

        this.calculateIncome(this.nations[0]);
        this.syncArmiesToAssignWithDOM();
    };

    Game.prototype.syncArmiesToAssignWithDOM = function () {
        if (this.nations[0].armiesToPlace > 0)
            document.getElementById("output-text").innerHTML = this.nations[0].armiesToPlace.toString() + " Armies Left To Assign";
        else
            this.syncSelectedTerritoriesWithDOM();
    };

    Game.prototype.syncSelectedTerritoriesWithDOM = function () {
        if (this.aSelectedTerritory === null) {
            document.getElementById("output-text").innerHTML = "No Territory Selected";
        } else {
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
    };

    Game.prototype.calculateIncome = function (nation) {
        var BASE_INCOME = 3;
        var ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES = 7;
        nation.armiesToPlace = BASE_INCOME;
        nation.armiesToPlace += Math.floor(nation.territories.length / ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES);

        for (var i = 0; i < this.map.continents.length; i++) {
            if (this.map.continents[i].doesNationOwnEntireContinent(nation)) {
                nation.armiesToPlace += this.map.continents[i].incomeBonus;
            }
        }
    };

    Game.prototype.handleTerritorySelection = function (territory) {
        var selectedColor = new Color(territory.color.r + 50, territory.color.g + 50, territory.color.b + 50);

        if (this.aSelectedTerritory === null) {
            if (territory.armyCount > 0) {
                this.mapDisplay.fillPixels(territory.pixels, selectedColor);
                this.aSelectedTerritory = territory;
            }
        } else if (this.aSelectedTerritory.name === territory.name) {
            this.aSelectedTerritory = null;
            this.mapDisplay.fillPixels(territory.pixels, territory.color);

            if (this.bSelectedTerritory !== null) {
                this.mapDisplay.fillPixels(this.bSelectedTerritory.pixels, this.bSelectedTerritory.color);
                this.bSelectedTerritory = null;
            }
        } else if (this.bSelectedTerritory === null) {
            if (this.aSelectedTerritory.isNeighbor(territory)) {
                this.bSelectedTerritory = territory;
                this.mapDisplay.fillPixels(territory.pixels, selectedColor);
            }
        } else if (this.bSelectedTerritory.name === territory.name) {
            this.mapDisplay.fillPixels(territory.pixels, territory.color);
            this.bSelectedTerritory = null;
        } else {
            this.deselectTerritories();
        }
        this.syncSelectedTerritoriesWithDOM();
        this.mapDisplay.draw(this);
    };

    Game.prototype.deselectTerritories = function () {
        if (this.aSelectedTerritory !== null) {
            this.mapDisplay.fillPixels(this.aSelectedTerritory.pixels, this.aSelectedTerritory.color);
            this.aSelectedTerritory = null;
        }
        if (this.bSelectedTerritory !== null) {
            this.mapDisplay.fillPixels(this.bSelectedTerritory.pixels, this.bSelectedTerritory.color);
            this.bSelectedTerritory = null;
        }
        this.syncSelectedTerritoriesWithDOM();
    };

    Game.prototype.moveArmies = function (armyUsage) {
        var aArmy = Math.round(this.aSelectedTerritory.armyCount * this.armyUsageMode * 10) / 10;
        this.aSelectedTerritory.armyCount -= aArmy;
        this.bSelectedTerritory.armyCount += aArmy;

        this.deselectTerritories();
        this.mapDisplay.draw(this);
    };

    Game.prototype.attack = function (armyUsage) {
        var aArmy = Math.round(this.aSelectedTerritory.armyCount * this.armyUsageMode * 10) / 10;
        if (aArmy >= 1) {
            var bArmy = this.bSelectedTerritory.armyCount;

            while ((aArmy > 0) && (bArmy > 0)) {
                var roll = getRand(0, 100);
                if (roll > 50) {
                    aArmy -= 1;
                    this.aSelectedTerritory.armyCount -= 1;
                } else {
                    bArmy -= 1;
                    this.bSelectedTerritory.armyCount -= 1;
                }
            }

            if (aArmy === 0) {
                this.deselectTerritories();
            } else if (bArmy === 0) {
                this.aSelectedTerritory.armyCount -= aArmy;

                aArmy -= 1;
                this.bSelectedTerritory.armyCount = aArmy;
                this.changeTerritoryOwner(this.nations[this.aSelectedTerritory.owner], this.bSelectedTerritory);
                this.deselectTerritories();
            }

            this.mapDisplay.draw(this);
        }
    };

    Game.prototype.bindEvents = function () {
        var that = this;

        this.mapDisplay.canvas.oncontextmenu = function (event) {
            event.preventDefault();

            if (that.nations[0].armiesToPlace > 0) {
                var rect = that.mapDisplay.canvas.getBoundingClientRect();
                var x = event.pageX - rect.left;
                var y = event.pageY - rect.top;

                var territory = that.map.territoryAtPoint(new Point(Math.round(x), Math.round(y)));
                if (territory) {
                    that.handleHumanArmyPlacement(territory, 10);
                }
            } else {
                if (that.aSelectedTerritory !== null) {
                    if (that.bSelectedTerritory !== null) {
                        if (that.aSelectedTerritory.owner === that.bSelectedTerritory.owner) {
                            that.moveArmies(that.armyUsageMode);
                        } else {
                            console.log(that.aSelectedTerritory.owner, that.bSelectedTerritory.owner);
                            that.attack(that.armyUsageMode);
                        }
                    }
                }
            }
        };
        this.mapDisplay.canvas.addEventListener("click", function (event) {
            var rect = that.mapDisplay.canvas.getBoundingClientRect();
            var x = event.pageX - rect.left;
            var y = event.pageY - rect.top;

            var territory = that.map.territoryAtPoint(new Point(Math.round(x), Math.round(y)));
            if (territory) {
                if (that.nations[0].armiesToPlace > 0) {
                    that.handleHumanArmyPlacement(territory, 1);
                } else {
                    if ((that.aSelectedTerritory === null) && (territory.owner !== 0)) {
                    } else {
                        that.handleTerritorySelection(territory);
                    }
                }
            }
        }, false);

        document.onkeydown = function (event) {
            if (event.keyCode === 13) {
                that.deselectTerritories();

                if (that.nations[0].armiesToPlace === 0) {
                    that.endTurn();
                }
            }

            if ((event.keyCode === 49) || (event.keyCode === 97)) {
                that.armyUsageMode = 1;
                document.getElementById("army-usage-mode").innerHTML = "Entire Army";
            }

            console.log(event.keyCode);

            if ((event.keyCode === 50) || (event.keyCode === 98)) {
                that.armyUsageMode = 0.5;
                document.getElementById("army-usage-mode").innerHTML = "Half Army";
            }

            if ((event.keyCode === 51) || (event.keyCode === 99)) {
                that.armyUsageMode = 0.3;
                document.getElementById("army-usage-mode").innerHTML = "1/3rd Army";
            }

            that.shiftKeyPressed = event.shiftKey;
        };

        document.onmouseup = function (event) {
            that.shiftKeyPressed = event.shiftKey;
        };
    };

    Game.prototype.handleHumanArmyPlacement = function (territory, armiesToPlace) {
        if (territory.owner === 0) {
            armiesToPlace = Math.min(armiesToPlace, this.nations[0].armiesToPlace);

            territory.armyCount += armiesToPlace;
            this.nations[0].armiesToPlace -= armiesToPlace;
            this.mapDisplay.draw(this);

            this.syncArmiesToAssignWithDOM();
        }
    };
    return Game;
})();

window.onload = function () {
    var mapBuilder = new MapBuilder();
    mapBuilder.worldMap(function (map) {
        var game = new Game(map);
    });
};
