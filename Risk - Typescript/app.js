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
    return MapDisplay;
})();

window.onload = function () {
    var mapBuilder = new MapBuilder();
    mapBuilder.worldMap(function (map) {
        var mapDisplay = new MapDisplay();
        for (var i = 0; i < map.continents[0].territories.length; i++)
            mapDisplay.fillPixels(map.continents[0].territories[i].pixels, new Color(20, 20, 20));
    });
};
//# sourceMappingURL=app.js.map
