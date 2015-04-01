class Path {
    //path of least resistence
    territories: Array<Territory>;

    //where resistence is the number of enemy troops we have to move through to reach our goal
    resistenceCount: number;

    constructor() {
        this.territories = new Array<Territory>();
        this.resistenceCount = 0;
    }
}

class PathNode {
    parent: number;
    territory: Territory;
    resistence: number;

    constructor(parent: number, territory: Territory, resistence: number) {
        this.parent = parent;
        this.territory = territory;
        this.resistence = resistence;
    }
}

//who needs a* when you have brute force.
//Actually, the interesting thing about this is that distance isn't a factor in finding our path.
//We really only care about how many troops we have to fight in order to reach our goal.  
//It would probably benefit from heuristics regardless, as I imagine the path of least
//resistence will often be that of the least distance, but I'm not even going to bother.
class Pathfinding {
    territories: Array<Territory>;
    onToCheckedList: Array<boolean>;
    toCheck: Array<PathNode>;
    checked: {};

    constructor(territories: Array<Territory>) {
        this.territories = territories;
    }

    findPath(start: Territory, goal: Territory): Path {
        this.checked = {};
        this.toCheck = new Array<PathNode>();
        this.toCheck.push(new PathNode(null, start, 0));
        this.onToCheckedList = new Array<boolean>(this.territories.length);
        for (var i = 0; i < this.onToCheckedList.length; i++) {
            this.onToCheckedList[i] = false;
            this.checked[i] = null;
        }
        this.onToCheckedList[start.index] = true;

        while (true) {
            var current = this.toCheck.shift();
            this.checked[current.territory.index] = current;
            console.log('current ===', current.territory.name, 'current resistence=', current.resistence);
            for (var i = 0; i < current.territory.neighbors.length; i++) {
                var neighbor = current.territory.neighbors[i];
                if (this.validTerritoryToCheck(neighbor)) {
                    if (neighbor.owner === start.owner) {
                        var resistence = current.resistence;
                    }
                    else {
                        var resistence = current.resistence + neighbor.armyCount;
                    }
                    console.log(neighbor.name, 'armycount=', neighbor.armyCount, 'resistence=', resistence);

                    this.toCheck.push(new PathNode(current.territory.index, neighbor, resistence));
                    this.onToCheckedList[neighbor.index] = true;

                    if (neighbor.index === goal.index) {
                        this.checked[neighbor.index] = new PathNode(current.territory.index, neighbor, resistence);
                        return this.recordFinalPath(neighbor.index);
                    }
                }
            }    
            console.log('---sortingbelow-');
            this.toCheck = this.toCheck.sort(function (a, b) { return a.resistence - b.resistence; });
        }
    }

    private validTerritoryToCheck(territory: Territory) {
        return ((this.checked[territory.index] === null) && (this.onToCheckedList[territory.index] !== true));
    }

    private recordFinalPath(goalIndex: number): Path {
        var path = new Path();

        var index = this.checked[goalIndex].territory.index;
        path.territories.push(this.territories[index]);
        path.resistenceCount = this.checked[goalIndex].resistence;

        //work backwards until we reach the start
        while (this.checked[index].resistence !== 0) {
            index = this.checked[index].parent;
            path.territories.push(this.territories[index]);
            console.log(path.resistenceCount, this.territories[index].name);
        }
        path.territories.reverse();
        console.log("FINAL PATH", path, "FINAL RESISTENCE", path.resistenceCount);
        return path;
    }
}

class AI extends Nation {
    goalContinent: Continent;
    territoriesOwnedInGoalContinent: Array<Territory>;
    continentsWeOwn: Array<boolean>;

    constructor(name: string, color: Color, index: number) {
        super(name, color, index);
        this.goalContinent = null;
        this.territoriesOwnedInGoalContinent = null;
        this.continentsWeOwn = null;
    }

    processAITurn(game: Game) {
        this.calculateContinentsOwned(game);
        this.determineGoalContinent(game);
        this.assignStartOfTurnArmies(game);
        this.moveArmiesToGoalContinent(game);
        this.ensureCardEarnedThisTurn();
    }

    private determineGoalContinent(game: Game) {
        var validContinents = new Array<boolean>(game.map.continents.length)
        var armyCount = new Array<number>(game.map.continents.length);
        for (var i = 0; i < armyCount.length; i++) {
            validContinents[i] = false;
            armyCount[i] = 0;
        }

        for (var i = 0; i < game.map.continents.length; i++) {
            for (var j = 0; j < game.map.continents[i].territories.length; j++) {
                if (game.map.continents[i].territories[j].owner !== this.index) {
                    armyCount[i] -= game.map.continents[i].territories[j].armyCount;
                }
                else {
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
    }


    private getTerritoriesOwnedInGoalContinent(game: Game): Array<Territory> {
        var array = new Array<Territory>();
        for (var i = 0; i < this.goalContinent.territories.length; i++) {
            if (this.goalContinent.territories[i].owner === this.index) {
                array.push(this.goalContinent.territories[i]);
            }
        }
        return array;
    }

    private assignStartOfTurnArmies(game: Game) {
        this.ensureBorderTerritoriesAreCovered(game);
        this.assignArmiesToGoalContinent(game);

        game.mapDisplay.draw(game);
    }

    ensureBorderTerritoriesAreCovered(game: Game) {
        for (var i = 0; i < game.map.continents.length; i++) {
            if (this.doWeOwnContinent(game.map.continents[i].territories[0])) {
                for (var j = 0; j < game.map.continents[i].borderTerritories.length; j++) {
                    var territory = game.map.continents[i].borderTerritories[j];

                    if (territory.owner === this.index) {
                        //we want our borders to have at least 20 armies
                        while (territory.armyCount < 20) {
                            this.assignArmy(territory);
                            if (this.armiesToPlace === 0)
                                return;
                        }

                        //we want our borders to have at least x (?) times more armies than the surrounding territories
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
    }

    assignArmiesToGoalContinent(game: Game) {
        this.territoriesOwnedInGoalContinent = this.getTerritoriesOwnedInGoalContinent(game);
        while (this.armiesToPlace > 0) {
            var territory = this.territoriesOwnedInGoalContinent[0, getRand(0, this.territoriesOwnedInGoalContinent.length - 1)];
            this.assignArmy(territory);
        }
    }

    assignArmy(territory: Territory) {
        territory.armyCount += 1;
        this.armiesToPlace -= 1;
    }

    //we get a card if we captured a territory 
    ensureCardEarnedThisTurn() {
        if (this.cardGainedThisTurn !== true) {
            for (var i = 0; i < this.territories.length; i++) {

            }
        }
    }

    moveArmiesToGoalContinent(game: Game) {
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
                                }
                                else {
                                    game.attack(1);
                                }
                                game.deselectTerritories();
                            }
                        }
                    }
                }
            }
        }
    }

    doWeOwnContinent(territory: Territory): boolean {
        return this.continentsWeOwn[territory.continentIndex];
    }

    //compute it once and just store it
    calculateContinentsOwned(game: Game) {
        this.continentsWeOwn = new Array<boolean>(game.map.continents.length);
        for (var i = 0; i < this.continentsWeOwn.length; i++) {
            this.continentsWeOwn[i] = game.map.continents[i].doesNationOwnEntireContinent(this);
        }
    }
} 