/* eslint no-var: "off" */

'use strict';
(function(exports) {
  // models of Tetris game

  // shape of block
  var Shape = function Shape(name, color, form) {
    var max = form.length - 1;
    var angle1 = form.map(function(line, y) {
      return line.map(function(e, x) {
        return form[max - x][y];
      });
    });
    var angle2 = form.map(function(line, y) {
      return line.map(function(e, x) {
        return form[max - y][max - x];
      });
    });
    var angle3 = form.map(function(line, y) {
      return line.map(function(e, x) {
        return form[x][max - y];
      });
    });

    return Object.create(Shape.prototype, {
      name: {
        value: name,
        enumerable: true
      },
      color: {
        value: color,
        enumerable: true
      },
      angle0: {
        value: form,
        enumerable: true
      },
      angle1: {
        value: angle1,
        enumerable: true
      },
      angle2: {
        value: angle2,
        enumerable: true
      },
      angle3: {
        value: angle3,
        enumerable: true
      }
    });
  };
  Shape.prototype.rotated = function(angle) {
    switch (((angle % 4) + 4) % 4) {
    case 0:
      return this.angle0;
    case 1:
      return this.angle1;
    case 2:
      return this.angle2;
    case 3:
      return this.angle3;
    }
  };

  // moving block
  var Block = function Block(x, y, angle, shape) {
    return Object.create(Block.prototype, {
      x: {
        value: x,
        enumerable: true
      },
      y: {
        value: y,
        enumerable: true
      },
      angle: {
        value: angle,
        enumerable: true
      },
      shape: {
        value: shape,
        enumerable: true
      }
    });
  };
  Block.prototype.left = function() {
    return new Block(this.x - 1, this.y, this.angle, this.shape);
  };
  Block.prototype.right = function() {
    return new Block(this.x + 1, this.y, this.angle, this.shape);
  };
  Block.prototype.fall = function() {
    return new Block(this.x, this.y + 1, this.angle, this.shape);
  };
  Block.prototype.rotate = function() {
    return new Block(this.x, this.y, this.angle + 1, this.shape);
  };
  Block.prototype.ok = function(stage) {
    var form = this.shape.rotated(this.angle);
    for (var fy = 0; fy < form.length; fy++) {
      for (var fx = 0; fx < form[fy].length; fx++) {
        if (form[fy][fx] === 0) continue;
        var x = this.x + fx;
        var y = this.y + fy;
        if (x < 0 || stage.width <= x || stage.height <= y ||
          (y >= 0 && stage.stones[y][x])) return false;
      }
    }
    return true;
  };
  Block.prototype.overflow = function() {
    var form = this.shape.rotated(this.angle);
    for (var fy = 0; fy < form.length; fy++) {
      for (var fx = 0; fx < form[fy].length; fx++) {
        if (form[fy][fx] === 0) continue;
        var y = this.y + fy;
        if (y < 0) return true;
      }
    }
    return false;
  };
  Block.prototype.put = function(stage) {
    // assert(this.ok(stage) && !this.overflow());
    var form = this.shape.rotated(this.angle);
    for (var fy = 0; fy < form.length; fy++) {
      for (var fx = 0; fx < form[fy].length; fx++) {
        if (form[fy][fx] === 0) continue;
        var x = this.x + fx;
        var y = this.y + fy;
        stage.stones[y][x] = this.shape.color;
      }
    }
  };
  Block.prototype.eachStone = function(callback) {
    var form = this.shape.rotated(this.angle);
    for (var fy = 0; fy < form.length; fy++) {
      for (var fx = 0; fx < form[fy].length; fx++) {
        if (form[fy][fx] === 0) continue;
        var x = this.x + fx;
        var y = this.y + fy;
        if (x >= 0 && y >= 0) callback(x, y, this.shape.color);
      }
    }
  };

  // game stage
  var Stage = function Stage(width, height) {
    var stones = [];
    for (var y = 0; y < height; y++) {
      var line = [];
      for (var x = 0; x < width; x++) {
        line.push(null);
      }
      stones.push(line);
    }
    return Object.create(Stage.prototype, {
      stones: {
        value: stones,
        enumerable: true
      },
      width: {
        value: width,
        enumerable: true
      },
      height: {
        value: height,
        enumerable: true
      }
    });
  };
  Stage.prototype.filledLines = function() {
    var lines = [];
    for (var y = 0; y < this.stones.length; y++) {
      if (this.stones[y].reduce(function(r, s) {
        return r && s !== null;
      }, true)) {
        lines.push(y);
      }
    }
    return lines;
  };
  Stage.prototype.shrink = function() {
    var shrinked = 0;
    for (var y = this.stones.length - 1; y >= 0; y--) {
      if (this.stones[y].reduce(function(r, s) {
        return r && s !== null;
      }, true)) {
        this.stones.splice(y, 1);
        shrinked++;
      }
    }
    for (var i = 0; i < shrinked; i++) {
      var line = [];
      for (var x = 0; x < this.width; x++) {
        line.push(null);
      }
      this.stones.unshift(line);
    }
    return shrinked;
  };
  Stage.prototype.reset = function() {
    for (var y = 0; y < this.stones.length; y++) {
      for (var x = 0; x < this.stones[y].length; x++) {
        this.stones[y][x] = null;
      }
    }
  };
  Stage.prototype.eachStone = function(callback) {
    for (var y = 0; y < this.stones.length; y++) {
      var line = this.stones[y];
      for (var x = 0; x < line.length; x++) {
        var color = line[x];
        if (color) callback(x, y, color);
      }
    }
  };

  // standard shapes
  var shapes = [
    Shape('I', '#ff5c58',
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
      ]),
    Shape('J', '#ff865e',
      [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0]
      ]),
    Shape('L', '#fee440',
      [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1]
      ]),
    Shape('T', '#6d8299',
      [
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0]
      ]),
    Shape('S', '#a2d2ff',
      [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ]),
    Shape('Z', '#63b4b8',
      [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
      ]),
    Shape('O', '#d5bfbf',
      [
        [1, 1],
        [1, 1]
      ])
  ];

  exports.Tetris = {
    shapes: shapes,
    Shape: Shape,
    Block: Block,
    Stage: Stage
  };
})(typeof module === 'undefined' ? this : module.exports);
