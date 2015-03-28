rough outline for a simple Risk web game

typescript
i don't think any external libraries are going to be needed

Territory
	name
	armyCount
	x, y (for positioning army count text)
	pixels [1, 22, 30, ...]
	owner (Nation Index)
	wasClicked(i -- pixel coordinate);
	neighboringTerritories [] -- indexes

Continent
	name
	territories
	incomeBonus
	hasSingleOwner();

Map 
	init(name, PNG, continents);
	name 
	image 
	continents 
	territory territoryAtPoint(i)
	{
		loop through continents
			loop through territories
				wasClicked(i);
	}

MapBuilder
	Map worldMap()
	{	
	}

	Map otherMap()
	{
	}
	. . .

MapDisplay
	canvas
	fillPixels(pixels, color);
	index convertPointToPixelIndex(x, y);

Nation
	name
	color
	territories [1, 2, 3, ...]
	cards [] (card is just an enum; 3 unique card types)

	armiesToPlace (for placing armies at beginning of turn; game.calculateIncome() and handInCards both modify this )
	handInCards(); (eligible to get armiesToPlace bonus if either 3 cards of same type; or 1 of each card type (bigger bonus); forced to hand in cards if player has reached 5 cards)

AI : Nation	
	executeTurn(game);

	pretty simple AI -- 
		-  will almost always make attack every turn in order to gain a card;
		-  will always immediately hand in 3 cards -- will rarely hand in 3 alike cards
		-  will pick a continent to attempt to capture -- based on evaluating all current continents, and determining which has the highest proporition of its own armies versus other armies
		-  will follow a strategy of having a stack of doom, and slowly leaving units behind at territories that have a neighboring territory which isn't in the same continent for the continent that it wants to capture
		-  will evaluate to see if it can eliminate any player this turn and attempt to do so -- one less competitor, and you get an income bonus for doing so
		-  will evaluate to see if it can do a mad dash to capture all territories in target continent
		-  brute force pathfinding?
		-  will attempt to capture territory in continent owned entirely by opponent if it has the numbers to do so
		-  will periodically reevaluate to see if it's still worth pursuing the current continent
Game
	Map	
	MapBuilder (temp?)
	MapDisplay

	Nations [] -- 0 assumed to be human player?

	calculateIncome(nation);

	endTurn();

	handleClick(x, y)
	{
		i = mapDisplay.convertPointToIndex(x, y);
		var territory = map.territoryAtPoint(i);

		select territory / deselect territory / attack / move / whatever
		
			something like mapDisplay.changePixelColors(territory.pixels, nationColor);
	}

	handleRightClick();

	handleArmyMovement(sourceTerritory, destinationTerritory, troopCount) 

	handleArmyAttack(sourceTerritory, destinationTerritory);