var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
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
            if ((this.pixels[i].x === point.x) && (this.pixels[i].y === point.y)) {
                return true;
            }
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
    //push to screen
    MapDisplay.prototype.draw = function (game) {
        this.context.putImageData(this.image, 0, 0);

        for (var i = 0; i < game.map.territories.length; i++)
            this.drawText(game.map.territories[i]);
    };

    //modify image in memory
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
        this.armiesToPlace = 3;

        this.cards = new Array();
        for (var i = 0; i < 3; i++) {
            this.cards.push(0);
        }
    }
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

        this.nations = new Array(7);
        this.nations[0] = new Nation("Player 1", new Color(0, 0, 255), 0);
        this.nations[1] = new AI("Player 2", new Color(255, 255, 255), 1);
        this.nations[2] = new AI("Player 3", new Color(140, 0, 0), 2);
        this.nations[3] = new AI("Player 4", new Color(0, 202, 10), 3);
        this.nations[4] = new AI("Player 5", new Color(0, 220, 120), 4);
        this.nations[5] = new AI("Player 6", new Color(140, 140, 140), 5);
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
            this.calculateIncome(this.nations[i]);
            this.nations[i].processAITurn(this);
        }

        this.calculateIncome(this.nations[0]);
        this.syncArmiesToAssignWithDOM();
    };

    Game.prototype.syncArmiesToAssignWithDOM = function () {
        console.log(this.nations[0].armiesToPlace);
        document.getElementById("output-text").innerHTML = this.nations[0].armiesToPlace.toString() + " Armies Left To Assign";
    };

    Game.prototype.calculateIncome = function (nation) {
        var BASE_INCOME = 3;
        var ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES = 7;
        nation.armiesToPlace = BASE_INCOME;
        nation.armiesToPlace += nation.territories.length / ADDITIONAL_ARMIES_PER_THIS_MANY_TERRITORIES;
    };

    Game.prototype.bindEvents = function () {
        var that = this;
        this.mapDisplay.canvas.addEventListener("click", function (event) {
            var rect = that.mapDisplay.canvas.getBoundingClientRect();
            var x = event.pageX - rect.left;
            var y = event.pageY - rect.top;

            var territory = that.map.territoryAtPoint(new Point(Math.round(x), Math.round(y)));
            if (territory) {
                var armiesToPlace = 1;
                if (that.shiftKeyPressed) {
                    armiesToPlace = 10;
                }

                territory.armyCount += armiesToPlace;
                that.nations[0].armiesToPlace -= armiesToPlace;
                that.mapDisplay.draw(that);

                that.syncArmiesToAssignWithDOM();
            }
        }, false);

        document.onkeydown = function (event) {
            //enter
            if (event.keyCode === 13) {
                if (that.nations[0].armiesToPlace === 0) {
                    that.endTurn();
                }
            }

            that.shiftKeyPressed = event.shiftKey;
        };

        document.onmouseup = function (event) {
            that.shiftKeyPressed = event.shiftKey;
        };
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
