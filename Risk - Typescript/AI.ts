﻿class Path {
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

    touched: Array<boolean>;
    toCheck: Array<PathNode>;
    checked: {};

    constructor(territories: Array<Territory>) {
        this.territories = territories;
    }

    findPath(start: Territory, goal: Territory): Path {
        this.checked = {};
        this.toCheck = new Array<PathNode>();
        this.touched = new Array<boolean>(this.territories.length);
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
                    }
                    else {
                        var resistence = current.resistence + neighbor.armyCount;
                    }

                    this.toCheck.push(new PathNode(current.territory.index, neighbor, resistence));
                    this.touched[neighbor.index] = true;

                    if (neighbor.index === goal.index) {
                        this.checked[neighbor.index] = new PathNode(current.territory.index, neighbor, resistence);
                        return this.recordFinalPath(neighbor.index);
                    }
                }
            }    
            this.toCheck.sort(function (a, b) { return a.resistence - b.resistence; });
        }
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
        }
        path.territories.reverse();
        return path;
    }
}

class AI extends Nation {
    goalContinent: Continent;
    territoriesOwnedInGoalContinent: Array<Territory>;
    continentsWeOwn: Array<boolean>;
    borderTerritoryDistributions: any;

    constructor(name: string, color: Color, index: number) {
        super(name, color, index);
        this.goalContinent = null;
        this.territoriesOwnedInGoalContinent = null;
        this.continentsWeOwn = null;
        this.borderTerritoryDistributions = null;
    }

    processAITurn(game: Game) {
        this.calculateContinentsOwned(game);
        this.determineGoalContinent(game);
        this.assignStartOfTurnArmies(game);
        this.moveArmiesToGoalContinent(game);
        this.conquerContinentIfApplicable(game);
        this.randomAttackForFun(game);
        this.ensureCardEarnedThisTurn(game);
        this.moveArmiesToContinentBorders(game);
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
        var weakestIndex = -1, weakestCount = 9999;
        for (var i = 0; i < game.map.continents.length; i++) {
            if (this.doWeOwnContinent(game.map.continents[i].territories[0])) {
                for (var j = 0; j < game.map.continents[i].borderTerritories.length; j++) {
                    var territory = game.map.continents[i].borderTerritories[j];
                    if (territory.owner === this.index) {

                        if (territory.armyCount < weakestCount) {
                            weakestCount = territory.armyCount;
                            weakestIndex = territory.index;
                        }

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

        if (getRand(0, 100) > 0) {
            if (weakestIndex !== -1) {
                var territory = game.map.territories[weakestIndex];
                while (this.armiesToPlace > 0) {
                    this.assignArmy(territory);
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
    ensureCardEarnedThisTurn(game: Game) {
        if (this.cardGainedThisTurn !== true) {

            var bestIndex = { i: null, j: null }, bestDifference = -9999;

            for (var i = 0; i < this.territories.length; i++) {
                for (var j = 0; j < this.territories[i].neighbors.length; j++) {
                    if (this.index !== this.territories[i].neighbors[j].owner) {
                        var difference = this.territories[i].armyCount - this.territories[i].neighbors[j].armyCount;
                        if (difference > bestDifference) {
                            bestDifference = difference;
                            bestIndex.i = i;
                            bestIndex.j = j;
                        }
                    }
                }
            }
            if (bestDifference > 1) {
                game.handleTerritorySelection(this.territories[bestIndex.i], this.territories[bestIndex.i].neighbors[bestIndex.j]);
                if (game.attack(1)) {
                    game.handleTerritorySelection(this.territories[bestIndex.i].neighbors[bestIndex.j], this.territories[bestIndex.i]);
                    game.moveArmies(1);
                }
            }
        }
    }

    moveArmiesToGoalContinent(game: Game) {
        for (var i = 0; i < this.territories.length; i++) {
            if (this.territories[i].continentIndex !== this.goalContinent.index) {
                if (this.doWeOwnContinent(this.territories[i]) !== true) {
                    if (this.territories[i].armyCount > 1) {
                        for (var j = 0; j < this.territories[i].neighbors.length; j++) {
                            if (this.territories[i].neighbors[j].continentIndex === this.goalContinent.index) {
                                if (this.territories[i].continentBorder !== true) {
                                    game.handleTerritorySelection(this.territories[i], this.territories[i].neighbors[j]);
                                    if (this.territories[i].neighbors[j].owner === this.index) {
                                        game.moveArmies(1);
                                    }
                                    else {
                                        game.attack(1);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    //very naive
    moveArmiesToContinentBorders(game: Game) {
        this.calculateDistributionOfArmiesInGoalContinent(game);

        var didWeMove = false;
        for (var i = 0; i < this.territories.length; i++) {
            if (this.territories[i].armyCount > 1) {
                for (var j = 0; j < this.territories[i].neighbors.length; j++) {
                    var neighbor = this.territories[i].neighbors[j];
                    if (neighbor.owner === this.index) {
                        if (neighbor.continentBorder === true) {
                            if (neighbor.continentIndex === this.goalContinent.index) {
                                var a = this.territories[i];
                                var b = this.territories[i].neighbors[j];
                                game.handleTerritorySelection(a, b);
                                didWeMove = true;
                                    
                                if (this.territories[i].continentBorder !== true) {
                                    game.moveArmies(1);
                                }
                                else {
                                    var numNeeded = this.borderTerritoryDistributions - this.territories[i].neighbors[j].armyCount;
                                    game.moveArmies(numNeeded, true);
                                }
                            }
                        }
                    }
                }
            }
        }

        if (didWeMove === false) {
            for (var i = 0; i < this.territories.length; i++) {
                if (this.territories[i].continentBorder !== true) {
                    for (var j = 0; j < this.territories[i].neighbors.length; j++) {
                        var neighbor = this.territories[i].neighbors[j];
                        if (neighbor.owner === this.index) {
                            var a = this.territories[i];
                            var b = this.territories[i].neighbors[j];
                            game.handleTerritorySelection(a, b);
                            game.moveArmies(1);
                            return;
                        }
                    }
                }
            }
        }
    }

    conquerContinentIfApplicable(game: Game) {
        while (this.conquerTerritoryInGoalContinent(game));
    }

    //super super inefficient but just trying to finish 
    conquerTerritoryInGoalContinent(game: Game): boolean {
        var myArmyCount = 0, enemyArmyCount = 0;
        for (var i = 0; i < this.goalContinent.territories.length; i++) {
            if (this.goalContinent.territories[i].owner === this.index) {
                myArmyCount += this.goalContinent.territories[i].armyCount;
            }
            else {
                enemyArmyCount += this.goalContinent.territories[i].armyCount;
            }
        }

        if (enemyArmyCount === 0) {
            return false;
        }

        if (myArmyCount > enemyArmyCount * 1.5) {
            for (var i = 0; i < this.goalContinent.territories.length; i++) {
                var territory = this.goalContinent.territories[i];
                if (territory.owner === this.index) {
                    for (var j = 0; j < territory.neighbors.length; j++) {
                        if (territory.neighbors[j].continentIndex === this.goalContinent.index) {
                            if (territory.neighbors[j].owner !== this.index) {
                                game.handleTerritorySelection(territory, territory.neighbors[j]);
                                if (game.attack(1)) {
                                    return true;
                                }
                                break;
                            }
                        } 
                    }
                }
            }

            var bestIndex = -1, best = 0;
            for (var i = 0; i < this.goalContinent.territories.length; i++) {
                if (this.goalContinent.territories[i].owner === this.index) {
                    if (this.goalContinent.territories[i].armyCount > best) {
                        best = this.goalContinent.territories[i].armyCount;
                        bestIndex = this.goalContinent.territories[i].index;
                    }
                }
            }
            if (bestIndex !== -1) {
                console.log('we try');
                for (var i = 0; i < this.goalContinent.territories.length; i++) {
                    if (this.goalContinent.territories[i].owner !== this.index) {
                        var path = game.pathfinder.findPath(game.map.territories[bestIndex], this.goalContinent.territories[i]);
                        while (true) {
                            var a = path.territories[0];
                            var b = path.territories[1];
                            game.handleTerritorySelection(a, b);
                            if (game.attack(1)) {
                                path.territories.shift();
                                if (path.territories.length <= 1) {
                                    return true;
                                }
                            }
                            else {
                                return false;
                            }
                        }
                    }
                }
            }
        }

        return false;
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

    calculateDistributionOfArmiesInGoalContinent(game: Game) {
        var myArmies = 0, numOfBorderTerritoriesOwned = 0;
        for (var i = 0; i < this.goalContinent.territories.length; i++) {
            if (this.goalContinent.territories[i].owner === this.index) {
                myArmies += this.goalContinent.territories[i].armyCount;
                numOfBorderTerritoriesOwned += 1;
            }
        }

        //ideally this would be more intelligent and figure out which territories need more based on # of surrounding enemy troop counts
        var numPerTerritory = myArmies / numOfBorderTerritoriesOwned;
        this.borderTerritoryDistributions = numPerTerritory;
    }

    randomAttackForFun(game: Game) {
        if (getRand(0, 100) > 87) {
            var index = getRand(0, this.territories.length - 1);
            if (this.territories[index].armyCount > 1) {
                for (var i = 0; i < this.territories[index].neighbors.length; i++) {
                    if (this.territories[index].neighbors[i].owner !== this.index) {
                        var a = this.territories[index];
                        var b = this.territories[index].neighbors[i];
                        game.handleTerritorySelection(a, b);
                        game.attack(1);

                        game.handleTerritorySelection(b, a);
                        game.moveArmies(1);
                        return;
                    }
                }
            }
        }
    }
} 