var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Path = (function () {
    function Path() {
        this.territories = new Array();
        this.resistenceCount = 0;
    }
    return Path;
})();

var PathNode = (function () {
    function PathNode(parent, territory, resistence) {
        this.parent = parent;
        this.territory = territory;
        this.resistence = resistence;
    }
    return PathNode;
})();

var Pathfinding = (function () {
    function Pathfinding(territories) {
        this.territories = territories;
    }
    Pathfinding.prototype.findPath = function (start, goal) {
        this.checked = {};
        this.toCheck = new Array();
        this.touched = new Array(this.territories.length);
        for (var i = 0; i < this.territories.length; i++) {
            this.touched[i] = false;
            this.checked[i] = null;
        }
        this.touched[start.index] = true;
        this.toCheck.push(new PathNode(null, start, 0));

        while (true) {
            var current = this.toCheck.shift();
            this.checked[current.territory.index] = current;
            for (var i = 0; i < current.territory.neighbors.length; i++) {
                var neighbor = current.territory.neighbors[i];
                if (this.touched[neighbor.index] != true) {
                    if (neighbor.owner === start.owner) {
                        var resistence = current.resistence;
                    } else {
                        var resistence = current.resistence + neighbor.armyCount;
                    }

                    console.log(resistence, neighbor.name);
                    this.toCheck.push(new PathNode(current.territory.index, neighbor, resistence));
                    this.touched[neighbor.index] = true;

                    if (neighbor.index === goal.index) {
                        this.checked[neighbor.index] = new PathNode(current.territory.index, neighbor, resistence);
                        return this.recordFinalPath(neighbor.index);
                    }
                }
            }
            this.toCheck.sort(function (a, b) {
                return a.resistence - b.resistence;
            });
        }
    };

    Pathfinding.prototype.recordFinalPath = function (goalIndex) {
        var path = new Path();

        var index = this.checked[goalIndex].territory.index;
        path.territories.push(this.territories[index]);
        path.resistenceCount = this.checked[goalIndex].resistence;

        console.log('------------------');
        console.log('------------------');
        console.log('------------------');
        console.log('------------------');
        console.log('------------------', path.resistenceCount);

        while (this.checked[index].resistence !== 0) {
            index = this.checked[index].parent;
            path.territories.push(this.territories[index]);
            console.log(this.checked[index].resistence, this.territories[index].name);
        }
        path.territories.reverse();
        console.log("FINAL PATH", path, "FINAL RESISTENCE", path.resistenceCount);
        return path;
    };
    return Pathfinding;
})();

var AI = (function (_super) {
    __extends(AI, _super);
    function AI(name, color, index) {
        _super.call(this, name, color, index);
        this.goalContinent = null;
        this.territoriesOwnedInGoalContinent = null;
        this.continentsWeOwn = null;
    }
    AI.prototype.processAITurn = function (game) {
        this.calculateContinentsOwned(game);
        this.determineGoalContinent(game);
        this.assignStartOfTurnArmies(game);
        this.moveArmiesToGoalContinent(game);
        this.ensureCardEarnedThisTurn();
    };

    AI.prototype.determineGoalContinent = function (game) {
        var validContinents = new Array(game.map.continents.length);
        var armyCount = new Array(game.map.continents.length);
        for (var i = 0; i < armyCount.length; i++) {
            validContinents[i] = false;
            armyCount[i] = 0;
        }

        for (var i = 0; i < game.map.continents.length; i++) {
            for (var j = 0; j < game.map.continents[i].territories.length; j++) {
                if (game.map.continents[i].territories[j].owner !== this.index) {
                    armyCount[i] -= game.map.continents[i].territories[j].armyCount;
                } else {
                    armyCount[i] += game.map.continents[i].territories[j].armyCount;
                    validContinents[i] = true;
                }
            }
        }

        var best = 0;
        for (var i = 1; i < armyCount.length; i++) {
            if (((armyCount[i] >= armyCount[best]) && (validContinents[i])) || (validContinents[best] !== true)) {
                best = i;
            }
        }

        this.goalContinent = game.map.continents[best];
    };

    AI.prototype.getTerritoriesOwnedInGoalContinent = function (game) {
        var array = new Array();
        for (var i = 0; i < this.goalContinent.territories.length; i++) {
            if (this.goalContinent.territories[i].owner === this.index) {
                array.push(this.goalContinent.territories[i]);
            }
        }
        return array;
    };

    AI.prototype.assignStartOfTurnArmies = function (game) {
        this.ensureBorderTerritoriesAreCovered(game);
        this.assignArmiesToGoalContinent(game);

        game.mapDisplay.draw(game);
    };

    AI.prototype.ensureBorderTerritoriesAreCovered = function (game) {
        for (var i = 0; i < game.map.continents.length; i++) {
            if (this.doWeOwnContinent(game.map.continents[i].territories[0])) {
                for (var j = 0; j < game.map.continents[i].borderTerritories.length; j++) {
                    var territory = game.map.continents[i].borderTerritories[j];

                    if (territory.owner === this.index) {
                        while (territory.armyCount < 20) {
                            this.assignArmy(territory);
                            if (this.armiesToPlace === 0)
                                return;
                        }

                        for (var k = 0; k < territory.neighbors.length; k++) {
                            if (territory.neighbors[k].continentIndex !== game.map.continents[i].index) {
                                if (territory.neighbors[k].owner !== this.index) {
                                    while (territory.neighbors[k].armyCount * 1.3 > territory.armyCount) {
                                        this.assignArmy(territory);
                                        if (this.armiesToPlace === 0)
                                            return;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    AI.prototype.assignArmiesToGoalContinent = function (game) {
        this.territoriesOwnedInGoalContinent = this.getTerritoriesOwnedInGoalContinent(game);
        while (this.armiesToPlace > 0) {
            var territory = this.territoriesOwnedInGoalContinent[0, getRand(0, this.territoriesOwnedInGoalContinent.length - 1)];
            this.assignArmy(territory);
        }
    };

    AI.prototype.assignArmy = function (territory) {
        territory.armyCount += 1;
        this.armiesToPlace -= 1;
    };

    AI.prototype.ensureCardEarnedThisTurn = function () {
        if (this.cardGainedThisTurn !== true) {
            for (var i = 0; i < this.territories.length; i++) {
            }
        }
    };

    AI.prototype.moveArmiesToGoalContinent = function (game) {
        for (var i = 0; i < this.territories.length; i++) {
            if (this.territories[i].continentIndex !== this.goalContinent.index) {
                if (this.doWeOwnContinent(this.territories[i]) !== true) {
                    if (this.territories[i].armyCount > 0) {
                        for (var j = 0; j < this.territories[i].neighbors.length; j++) {
                            if (this.territories[i].neighbors[j].continentIndex === this.goalContinent.index) {
                                game.handleTerritorySelection(this.territories[i]);
                                game.handleTerritorySelection(this.territories[i].neighbors[j]);
                                if (this.territories[i].neighbors[j].owner === this.index) {
                                    game.moveArmies(1);
                                } else {
                                    game.attack(1);
                                }
                                game.deselectTerritories();
                            }
                        }
                    }
                }
            }
        }
    };

    AI.prototype.doWeOwnContinent = function (territory) {
        return this.continentsWeOwn[territory.continentIndex];
    };

    AI.prototype.calculateContinentsOwned = function (game) {
        this.continentsWeOwn = new Array(game.map.continents.length);
        for (var i = 0; i < this.continentsWeOwn.length; i++) {
            this.continentsWeOwn[i] = game.map.continents[i].doesNationOwnEntireContinent(this);
        }
    };
    return AI;
})(Nation);
