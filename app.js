var SudokuGrid, c, constants, sudokuVue;

c = console;

sudokuVue = null;

constants = {
  numSwaps: 10,
  numAnimFrames: 30
};

$(function() {
  var gridSize, parseUrlVars;
  gridSize = 3;
  parseUrlVars = function() {
    var queryMatch;
    queryMatch = location.search.match(/size=(\d)/);
    if (queryMatch && (queryMatch[1] === "2" || queryMatch[1] === "4")) {
      return gridSize = parseInt(queryMatch[1]);
    }
  };
  sudokuVue = new Vue({
    el: "#sudoku-container",
    data: {
      showHints: false,
      inputMask: [],
      sudoku: null
    },
    methods: {
      loop: function(size) {
        return _.range(0, size * size);
      },
      newGame: function() {
        this.sudoku = new SudokuGrid(gridSize);
        return requestAnimationFrame(this.animateShuffle);
      },
      onCellClick: function(numContainer, numCell) {
        return c.log(numContainer, numCell);
      },
      animateShuffle: function() {
        var $cellValues, chars, frameCounter, innerTexts, renderFrame;
        $cellValues = $(".cell:not(.editable) > .cell-value");
        innerTexts = $.map($cellValues, function(elem) {
          return elem.innerText;
        });
        chars = this.sudoku.gridChars;
        frameCounter = 0;
        renderFrame = function() {
          var elem, i, k, len1, results;
          ++frameCounter;
          $cellValues.each(function(i, elem) {
            return elem.innerText = _.sample(chars);
          });
          if (frameCounter < constants.numAnimFrames) {
            return requestAnimationFrame(renderFrame);
          } else {
            results = [];
            for (i = k = 0, len1 = $cellValues.length; k < len1; i = ++k) {
              elem = $cellValues[i];
              results.push(elem.innerText = innerTexts[i]);
            }
            return results;
          }
        };
        return requestAnimationFrame(renderFrame);
      }
    }
  });
  parseUrlVars();
  return sudokuVue.newGame();
});


/*
SudokuGrid works on a datastructure of a 2 dimensional grid
and a 2 dimensional input mask of the same size.

It contains functions for grid generation, validation and hinting
 */

SudokuGrid = (function() {

  /*
  	@gridSize
  		We're trying not to hard code the grid size in code
  		Ideally by changing gridSize here and app.styl variable
  		we can work with 4x4 sudokus
  	@grid
  		Stores the 2 dimensional grid. Constructor will create the 2 dimensional grid
  	@gridChars
  		For a 2x2 sudoku they are a..d
  		For a 3x3 sudoku these are just 1...9
  		for a 4x4 sudoku they are 0..9a..f
   */
  function SudokuGrid(gridSize) {
    var charA, i;
    if (gridSize == null) {
      gridSize = 3;
    }
    if (!(gridSize >= 2 && gridSize <= 4)) {
      throw new Error("Grid Size should be between 2 and 4");
    }
    charA = 97;
    switch (gridSize) {
      case 2:
        this.gridChars = (function() {
          var k, ref, ref1, results;
          results = [];
          for (i = k = ref = charA, ref1 = charA + 4; k < ref1; i = k += 1) {
            results.push(String.fromCharCode(i));
          }
          return results;
        })();
        break;
      case 3:
        this.gridChars = (function() {
          var k, results;
          results = [];
          for (i = k = 1; k < 10; i = k += 1) {
            results.push(i.toString());
          }
          return results;
        })();
        break;
      case 4:
        this.gridChars = (function() {
          var k, results;
          results = [];
          for (i = k = 0; k < 10; i = k += 1) {
            results.push(i.toString());
          }
          return results;
        })();
        this.gridChars = this.gridChars.concat((function() {
          var k, ref, ref1, results;
          results = [];
          for (i = k = ref = charA, ref1 = charA + 6; k < ref1; i = k += 1) {
            results.push(String.fromCharCode(i));
          }
          return results;
        })());
    }
    this.gridSize = gridSize;
    this.gridLen = gridSize * gridSize;
    this.grid = this.identity();
    this.shuffleGrid();
    this.inputMask = this.randomInputMask();
    this.applyInputMask();
  }


  /*
  	returns 
  		simple 123.. sudoku
  		Looks something like this for 3x3 grid
  		123456789
  		456789123
  		789123456
  		234567891
  		567891234
  		891234567
  		345678912
  		678912345
  		912345678
   */

  SudokuGrid.prototype.identity = function() {
    var i, index, j, k, l, len, ref, ref1, row, size;
    this.grid = [];
    size = this.gridSize;
    len = this.gridLen;
    for (i = k = 0, ref = len; k < ref; i = k += 1) {
      row = [];
      for (j = l = 0, ref1 = len; l < ref1; j = l += 1) {
        index = (i * size + j + Math.floor(i / size)) % len;
        row.push(index);
      }
      this.grid.push(row);
    }
    return this.grid;
  };


  /*
  	Randomize by swapping rows and columns between a cell-container
   */

  SudokuGrid.prototype.shuffleGrid = function() {
    var grid, i, k, l, len, num1, num2, numCell, offset, ref, ref1, size, swap;
    grid = this.grid;
    size = this.gridSize;
    len = size * size;
    swap = function(num1, num2, rowMul, colMul) {
      var col1, col2, colAdd, i, k, ref, results, row1, row2, rowAdd, temp;
      row1 = row2 = col1 = col2 = 0;
      if (colMul === 1) {
        row1 = num1;
        row2 = num2;
      } else if (rowMul = 1) {
        col1 = num1;
        col2 = num2;
      }
      results = [];
      for (i = k = 0, ref = len; k < ref; i = k += 1) {
        rowAdd = i * rowMul;
        colAdd = i * colMul;
        temp = grid[row1 + rowAdd][col1 + colAdd];
        grid[row1 + rowAdd][col1 + colAdd] = grid[row2 + rowAdd][col2 + colAdd];
        results.push(grid[row2 + rowAdd][col2 + colAdd] = temp);
      }
      return results;
    };
    for (i = k = 0, ref = constants.numSwaps; k < ref; i = k += 1) {
      for (numCell = l = 0, ref1 = size; l < ref1; numCell = l += 1) {
        if (Math.random() > 0.5) {
          offset = numCell * size;
          num1 = Math.floor(Math.random() * size) + offset;
          num2 = (num1 + 1) % size + offset;
        }
        if (Math.random() > 0.5) {
          num1 = Math.floor(Math.random() * size) + offset;
          num2 = (num1 + 1) % size + offset;
          swap(num1, num2, 1, 0);
        }
      }
    }
    return this.grid;
  };


  /*
  	Generates a size x size input mask with the same dimensions as the grid
  	0 means value cannot be edited by the user
  	1 means the value can be edited by the user
   */

  SudokuGrid.prototype.randomInputMask = function() {
    var i, j, k, l, len, ref, ref1, row, val;
    this.inputMask = [];
    len = this.gridLen;
    for (i = k = 0, ref = len; k < ref; i = k += 1) {
      row = [];
      for (j = l = 0, ref1 = len; l < ref1; j = l += 1) {
        if (Math.random() > 0.5) {
          val = 0;
        } else {
          val = 1;
        }
        row.push(val);
      }
      this.inputMask.push(row);
    }
    return this.inputMask;
  };


  /*
  	Set values in grid to null if input mask cell is set to 1
  	We randomly set cells to be editable
   */

  SudokuGrid.prototype.applyInputMask = function() {
    var i, j, k, l, len, ref, ref1;
    len = this.gridLen;
    for (i = k = 0, ref = len; k < ref; i = k += 1) {
      for (j = l = 0, ref1 = len; l < ref1; j = l += 1) {
        if (this.inputMask[i][j] === 1) {
          this.grid[i][j] = null;
        }
      }
    }
    return this.inputMask;
  };

  SudokuGrid.prototype.rowColFromCell = function(numContainer, numCell) {
    var col, row, size;
    size = this.gridSize;
    col = numContainer % size;
    row = Math.floor(numContainer / size);
    col = col * size + numCell % size;
    row = row * size + Math.floor(numCell / size);
    return {
      row: row,
      col: col
    };
  };

  SudokuGrid.prototype.charAt = function(numContainer, numCell) {
    var coords, val;
    coords = this.rowColFromCell(numContainer, numCell);
    val = this.grid[coords.row][coords.col];
    if (val !== null) {
      return this.gridChars[val];
    } else {
      return "";
    }
  };

  SudokuGrid.prototype.hintAt = function(numContainer, numCell, numHint) {
    var coords;
    coords = this.rowColFromCell(numContainer, numCell);
    return this.gridChars[numHint];
  };

  SudokuGrid.prototype.isEditable = function(numContainer, numCell) {
    var coords;
    coords = this.rowColFromCell(numContainer, numCell);
    return this.inputMask[coords.row][coords.col] === 1;
  };

  return SudokuGrid;

})();
