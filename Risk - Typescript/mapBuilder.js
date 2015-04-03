var MapBuilder = (function () {
    function MapBuilder() {
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");
        this.imageData = null;
    }
    //the raw map file has one unique color per territory
    //each territory gets assigned an xy position which correlates to a pixel with one of these unique colors
    //for each territory we loop through the map image collecting all pixels associated with that territory (ie: that have that unique color)
    MapBuilder.prototype.assignPixels = function (territory) {
        var pixelData = this.context.getImageData(territory.position.x, territory.position.y, 1, 1);
        var pixel = pixelData.data;

        for (var i = 0; i < this.imageData.length; i += 4) {
            if (pixel[0] === this.imageData[i + 0]) {
                if (pixel[1] === this.imageData[i + 1]) {
                    if (pixel[2] === this.imageData[i + 2]) {
                        var x = (i / 4) % this.canvas.width;
                        var y = Math.floor((i / 4) / this.canvas.width);
                        territory.pixels.push(new Point(x, y));
                    }
                }
            }
        }
    };

    MapBuilder.prototype.createTerritory = function (name, point) {
        var territory = new Territory(name, point);
        this.assignPixels(territory);
        return territory;
    };

    MapBuilder.prototype.worldMap = function (onComplete) {
        var worldMap = new RiskMap("World Map");
        worldMap.image = new Image();
        worldMap.image.src = "maps/world_map.png";

        var that = this;
        worldMap.image.onload = function () {
            that.canvas.width = worldMap.image.width;
            that.canvas.height = worldMap.image.height;
            that.context.drawImage(worldMap.image, 0, 0);
            that.imageData = that.context.getImageData(0, 0, that.canvas.width, that.canvas.height).data;

            worldMap.continents.push(new Continent());
            var northAmerica = worldMap.continents.length - 1;
            worldMap.continents[northAmerica].name = "North America";
            worldMap.continents[northAmerica].color = new Color(20, 40, 60);
            worldMap.continents[northAmerica].incomeBonus = 5;

            worldMap.continents.push(new Continent());
            var southAmerica = worldMap.continents.length - 1;
            worldMap.continents[southAmerica].name = "South America";
            worldMap.continents[southAmerica].color = new Color(100, 100, 100);
            worldMap.continents[southAmerica].incomeBonus = 2;

            worldMap.continents.push(new Continent());
            var africa = worldMap.continents.length - 1;
            worldMap.continents[africa].name = "Africa";
            worldMap.continents[africa].color = new Color(200, 200, 200);
            worldMap.continents[africa].incomeBonus = 5;

            worldMap.continents.push(new Continent());
            var asia = worldMap.continents.length - 1;
            worldMap.continents[asia].name = "Asia";
            worldMap.continents[asia].color = new Color(40, 200, 140);
            worldMap.continents[asia].incomeBonus = 7;

            worldMap.continents.push(new Continent());
            var australia = worldMap.continents.length - 1;
            worldMap.continents[australia].name = "Australia";
            worldMap.continents[australia].color = new Color(90, 90, 50);
            worldMap.continents[australia].incomeBonus = 2;

            worldMap.continents.push(new Continent());
            var europe = worldMap.continents.length - 1;
            worldMap.continents[europe].name = "Europe";
            worldMap.continents[europe].color = new Color(200, 0, 0);
            worldMap.continents[europe].incomeBonus = 5;

            //perhaps there are better ways of doing all of this, but I'm only ever going to have
            //to do it once, and this was the quickest way to get up and running
            var eastUS = that.createTerritory("East U.S.", new Point(214, 206));
            var westUS = that.createTerritory("West U.S.", new Point(117, 178));
            var mexico = that.createTerritory("Mexico", new Point(132, 254));
            var southwestCanada = that.createTerritory("Southwest Canada", new Point(155, 122));
            var centralCanada = that.createTerritory("Central Canada", new Point(231, 125));
            var easternCanada = that.createTerritory("Eastern Canada", new Point(310, 124));
            var northwestCanada = that.createTerritory("Northwest Canada", new Point(184, 75));
            var alaska = that.createTerritory("Alaska", new Point(73, 73));
            var venezuela = that.createTerritory("Venezuela", new Point(254, 355));
            var brazil = that.createTerritory("Brazil", new Point(334, 400));
            var argentina = that.createTerritory("Argentina", new Point(300, 510));
            var peru = that.createTerritory("Peru", new Point(252, 414));
            var ukraine = that.createTerritory("Ukraine", new Point(688, 114));
            var spainFrance = that.createTerritory("Spain / France", new Point(538, 177));
            var greenland = that.createTerritory("Greenland", new Point(440, 33));
            var iceland = that.createTerritory("Iceland", new Point(507, 79));
            var uk = that.createTerritory("UK", new Point(550, 129));
            var italy = that.createTerritory("Italy", new Point(599, 159));
            var denmark = that.createTerritory("Denmark", new Point(594, 135));
            var norway = that.createTerritory("Norway", new Point(600, 92));
            var greece = that.createTerritory("Greece", new Point(639, 165));
            var northwestAfrica = that.createTerritory("Northwest Africa", new Point(541, 271));
            var egypt = that.createTerritory("Egypt", new Point(645, 245));
            var eastAfrica = that.createTerritory("East Africa", new Point(693, 311));
            var madagascar = that.createTerritory("Madagascar", new Point(744, 445));
            var southAfrica = that.createTerritory("South Africa", new Point(648, 456));
            var westAfrica = that.createTerritory("West Africa", new Point(626, 368));
            var middleEast = that.createTerritory("Middle East", new Point(717, 216));
            var afghanistan = that.createTerritory("Afghanistan", new Point(792, 156));
            var ural = that.createTerritory("Ural", new Point(802, 94));
            var siberia = that.createTerritory("Siberia", new Point(867, 77));
            var china = that.createTerritory("China", new Point(911, 204));
            var india = that.createTerritory("India", new Point(859, 248));
            var southAsia = that.createTerritory("South Asia", new Point(956, 280));
            var mongolia = that.createTerritory("Mongolia", new Point(941, 158));
            var japan = that.createTerritory("Japan", new Point(1098, 198));
            var eastAsia = that.createTerritory("East Asia", new Point(1064, 77));
            var yutusk = that.createTerritory("Yutusk", new Point(950, 73));
            var irkutsk = that.createTerritory("Irkutsk", new Point(928, 112));
            var westernAustralia = that.createTerritory("Western Australia", new Point(1039, 480));
            var easternAustralia = that.createTerritory("Eastern Australia", new Point(1112, 463));
            var newGuinea = that.createTerritory("New Guinea", new Point(1138, 387));
            var indonesia = that.createTerritory("Indonesia", new Point(1022, 366));

            eastUS.neighbors = [mexico, westUS, centralCanada, easternCanada];
            westUS.neighbors = [mexico, eastUS, southwestCanada, centralCanada];
            mexico.neighbors = [eastUS, westUS, venezuela];
            southwestCanada.neighbors = [alaska, northwestCanada, centralCanada, westUS];
            centralCanada.neighbors = [southwestCanada, northwestCanada, westUS, eastUS, easternCanada, greenland];
            easternCanada.neighbors = [eastUS, centralCanada, greenland];
            northwestCanada.neighbors = [alaska, greenland, centralCanada, southwestCanada];
            alaska.neighbors = [northwestCanada, southwestCanada, eastAsia];
            venezuela.neighbors = [mexico, peru, brazil];
            brazil.neighbors = [venezuela, argentina, peru, northwestAfrica];
            argentina.neighbors = [peru, brazil];
            peru.neighbors = [venezuela, brazil, argentina];
            ukraine.neighbors = [norway, denmark, greece, middleEast, afghanistan, ural];
            spainFrance.neighbors = [uk, italy, denmark, northwestAfrica];
            greenland.neighbors = [northwestCanada, centralCanada, iceland, easternCanada];
            iceland.neighbors = [greenland, uk, norway];
            uk.neighbors = [iceland, spainFrance, denmark, norway];
            italy.neighbors = [spainFrance, denmark, greece];
            denmark.neighbors = [uk, norway, spainFrance, italy, ukraine, greece];
            norway.neighbors = [iceland, uk, denmark, ukraine];
            greece.neighbors = [italy, denmark, ukraine, middleEast, egypt, middleEast];
            northwestAfrica.neighbors = [spainFrance, brazil, egypt, eastAfrica, westAfrica];
            egypt.neighbors = [greece, middleEast, eastAfrica, northwestAfrica];
            eastAfrica.neighbors = [egypt, middleEast, madagascar, southAfrica, westAfrica, northwestAfrica];
            madagascar.neighbors = [southAfrica, eastAfrica];
            southAfrica.neighbors = [westAfrica, eastAfrica, madagascar];
            westAfrica.neighbors = [eastAfrica, northwestAfrica, southAfrica];
            middleEast.neighbors = [eastAfrica, egypt, greece, ukraine, india, afghanistan];
            afghanistan.neighbors = [ukraine, ural, china, india, middleEast];
            ural.neighbors = [siberia, china, afghanistan, ukraine];
            siberia.neighbors = [ural, china, mongolia, irkutsk, yutusk];
            china.neighbors = [southAsia, india, afghanistan, siberia, ural, mongolia];
            india.neighbors = [middleEast, afghanistan, china, southAsia];
            southAsia.neighbors = [india, china, indonesia];
            mongolia.neighbors = [china, japan, eastAsia, irkutsk, siberia];
            japan.neighbors = [mongolia, eastAsia];
            eastAsia.neighbors = [mongolia, japan, irkutsk, yutusk, alaska];
            yutusk.neighbors = [siberia, irkutsk, eastAsia];
            irkutsk.neighbors = [mongolia, eastAsia, yutusk, siberia];
            westernAustralia.neighbors = [easternAustralia, indonesia, newGuinea];
            easternAustralia.neighbors = [westernAustralia, newGuinea];
            newGuinea.neighbors = [easternAustralia, westernAustralia, indonesia];
            indonesia.neighbors = [westernAustralia, newGuinea, southAsia];

            worldMap.continents[northAmerica].territories = [eastUS, westUS, mexico, southwestCanada, centralCanada, easternCanada, northwestCanada, alaska, greenland];
            worldMap.continents[southAmerica].territories = [venezuela, brazil, argentina, peru];
            worldMap.continents[europe].territories = [ukraine, spainFrance, iceland, uk, italy, denmark, norway, greece];
            worldMap.continents[africa].territories = [northwestAfrica, egypt, eastAfrica, madagascar, southAfrica, westAfrica];
            worldMap.continents[asia].territories = [middleEast, afghanistan, ural, siberia, china, india, southAsia, mongolia, japan, eastAsia, yutusk, irkutsk];
            worldMap.continents[australia].territories = [westernAustralia, easternAustralia, newGuinea, indonesia];

            for (var i = 0; i < worldMap.continents.length; i++) {
                worldMap.continents[i].index = i;
                for (var j = 0; j < worldMap.continents[i].territories.length; j++) {
                    var index = worldMap.territories.length;

                    worldMap.territories.push(worldMap.continents[i].territories[j]);
                    worldMap.territories[index].index = index;
                    worldMap.continents[i].territories[j].continentIndex = i;
                }
            }

            for (var i = 0; i < worldMap.continents.length; i++) {
                worldMap.continents[i].calculateBorderTerritories();
            }
            onComplete(worldMap);
        };
    };
    return MapBuilder;
})();
//# sourceMappingURL=mapBuilder.js.map
