var SudokuGrid, c, constants, sudokuVue;

c = console;

sudokuVue = null;

constants = {
  gridSize: 3,
  numSwaps: 10,
  numAnimFrames: 30
};

$(function() {
  var autoScaleGrid, parseUrlVars;
  parseUrlVars = function() {
    var queryMatch;
    queryMatch = location.search.match(/size=(\d)/);
    if (queryMatch && (queryMatch[1] === "2" || queryMatch[1] === "4")) {
      return constants.gridSize = parseInt(queryMatch[1]);
    }
  };
  autoScaleGrid = function() {
    var $container, $window, ch, cw, scale, wh, ww;
    $container = $("#sudoku-container");
    $window = $(window);
    cw = $container.outerWidth();
    ch = $container.outerHeight();
    ww = $window.width();
    wh = $window.height();
    scale = Math.min(ww / cw, wh / ch);
    return $container.css({
      transform: "scale(" + scale + ")",
      top: (wh - ch * scale) / 2
    });
  };
  sudokuVue = new Vue({
    el: "#sudoku-container",
    data: {
      showHints: false,
      sudoku: null,
      selectedCellPos: null
    },
    methods: {
      loop: function(size) {
        return _.range(0, size * size);
      },
      newGame: function() {
        this.sudoku = new SudokuGrid(constants.gridSize);
        return requestAnimationFrame(this.animateShuffle);
      },
      onCellClick: function(numContainer, numCell) {
        return c.log(numContainer, numCell);
      },
      onInputClick: function(numInput) {
        return c.log(numInput);
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
          var elem, i, l, len1, results;
          ++frameCounter;
          $cellValues.each(function(i, elem) {
            return elem.innerText = _.sample(chars);
          });
          if (frameCounter < constants.numAnimFrames) {
            return requestAnimationFrame(renderFrame);
          } else {
            results = [];
            for (i = l = 0, len1 = $cellValues.length; l < len1; i = ++l) {
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
  sudokuVue.newGame();
  $(window).on('resize', autoScaleGrid);
  return requestAnimationFrame(autoScaleGrid);
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
  		For a 2x2 sudoku they are 1...4
  		For a 3x3 sudoku these are just 1...9
  		for a 4x4 sudoku they are 0...9a...f
  
  	@hintTable
  		A hint table contains possible selectable options
  		It is always a valid sudoku if any of the selections are made
  		Rather than running a validation run on every move
  		we trim down the hint table as the user makes choices
  
  	@inputMask
  		2 dimensional table same size as grid generated randomly
  		0 means value cannot be edited by the user
  		1 means the value can be edited by the user
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
          var l, ref, ref1, results;
          results = [];
          for (i = l = ref = charA, ref1 = charA + 4; l < ref1; i = l += 1) {
            results.push(String.fromCharCode(i));
          }
          return results;
        })();
        this.gridChars = (function() {
          var l, results;
          results = [];
          for (i = l = 1; l < 5; i = l += 1) {
            results.push(i.toString());
          }
          return results;
        })();
        break;
      case 3:
        this.gridChars = (function() {
          var l, results;
          results = [];
          for (i = l = 1; l < 10; i = l += 1) {
            results.push(i.toString());
          }
          return results;
        })();
        break;
      case 4:
        this.gridChars = (function() {
          var l, results;
          results = [];
          for (i = l = 0; l < 10; i = l += 1) {
            results.push(i.toString());
          }
          return results;
        })();
        this.gridChars = this.gridChars.concat((function() {
          var l, ref, ref1, results;
          results = [];
          for (i = l = ref = charA, ref1 = charA + 6; l < ref1; i = l += 1) {
            results.push(String.fromCharCode(i));
          }
          return results;
        })());
    }
    this.gridSize = gridSize;
    this.gridLen = gridSize * gridSize;
    this.grid = this.createEmptyGrid();
    this.inputMask = this.createRandomInputMask();
    this.hintTable = this.createHintTable();
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
    var i, index, j, l, len, m, ref, ref1, row, size;
    this.grid = [];
    size = this.gridSize;
    len = this.gridLen;
    for (i = l = 0, ref = len; l < ref; i = l += 1) {
      row = [];
      for (j = m = 0, ref1 = len; m < ref1; j = m += 1) {
        index = (i * size + j + Math.floor(i / size)) % len;
        row.push(index);
      }
      this.grid.push(row);
    }
    return this.grid;
  };


  /*
  	Randomize by swapping rows and columns between a cell-container
  	We aren't currently using this method is it doesn't truly randomize the grid
   */

  SudokuGrid.prototype.shuffleGrid = function() {
    var grid, i, l, len, m, num1, num2, numCell, offset, ref, ref1, size, swap;
    grid = this.grid;
    size = this.gridSize;
    len = size * size;
    swap = function(num1, num2, rowMul, colMul) {
      var col1, col2, colAdd, i, l, ref, results, row1, row2, rowAdd, temp;
      row1 = row2 = col1 = col2 = 0;
      if (colMul === 1) {
        row1 = num1;
        row2 = num2;
      } else if (rowMul = 1) {
        col1 = num1;
        col2 = num2;
      }
      results = [];
      for (i = l = 0, ref = len; l < ref; i = l += 1) {
        rowAdd = i * rowMul;
        colAdd = i * colMul;
        temp = grid[row1 + rowAdd][col1 + colAdd];
        grid[row1 + rowAdd][col1 + colAdd] = grid[row2 + rowAdd][col2 + colAdd];
        results.push(grid[row2 + rowAdd][col2 + colAdd] = temp);
      }
      return results;
    };
    for (i = l = 0, ref = constants.numSwaps; l < ref; i = l += 1) {
      for (numCell = m = 0, ref1 = size; m < ref1; numCell = m += 1) {
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
  	Create an empty grid of size:size and set all values to null
   */

  SudokuGrid.prototype.createEmptyGrid = function() {
    var grid, i, j, l, len, m, ref, ref1, row;
    grid = [];
    len = this.gridLen;
    for (i = l = 0, ref = len; l < ref; i = l += 1) {
      row = [];
      for (j = m = 0, ref1 = len; m < ref1; j = m += 1) {
        row.push(null);
      }
      grid.push(row);
    }
    return grid;
  };


  /*
  	Create a blank hint table, inside each cell we store an hash map (object)
  	with keys as possible choices
   */

  SudokuGrid.prototype.createHintTable = function() {
    var hintTable, i, j, k, l, len, m, n, options, ref, ref1, ref2, row;
    hintTable = [];
    len = this.gridLen;
    for (i = l = 0, ref = len; l < ref; i = l += 1) {
      row = [];
      for (j = m = 0, ref1 = len; m < ref1; j = m += 1) {
        options = {};
        for (k = n = 0, ref2 = len; n < ref2; k = n += 1) {
          options[k] = true;
        }
        row.push(options);
      }
      hintTable.push(row);
    }
    return hintTable;
  };


  /*
  	Remove all other values apart from the passed value for the cell
  	Trim other cells by row, col and container
  	If in the process of trimming we encounter a naked singlet
  	then we add it to a queue and trim it in a another pass
   */

  SudokuGrid.prototype.trimHintTable = function(row, col, index) {
    var containerCol, containerRow, hintHash, hintTable, i, inputMask, j, key, l, len, len1, m, n, o, p, ref, ref1, ref2, ref3, ref4, removeHint, size;
    hintTable = this.hintTable;
    inputMask = this.inputMask;
    len = this.gridLen;
    size = this.gridSize;
    removeHint = (function(_this) {
      return function(row, col, index) {
        var hintHash, hints;
        hintHash = hintTable[row][col];
        delete hintHash[index];
        hints = Object.keys(hintHash);
        if (hints.length === 1 && _this.inputMask[row][col] === 1) {
          c.log("orphan", row, col, hints[0]);
          _this.trimHintTable(row, col, hints[0]);
        }
      };
    })(this);
    hintHash = hintTable[row][col];
    if (hintHash) {
      for (i = l = 0, ref = len; l < ref; i = l += 1) {
        removeHint(i, col, index);
      }
      for (j = m = 0, ref1 = len; m < ref1; j = m += 1) {
        removeHint(row, j, index);
      }
      containerRow = Math.floor(row / size);
      containerCol = Math.floor(col / size);
      for (i = n = 0, ref2 = size; n < ref2; i = n += 1) {
        for (j = o = 0, ref3 = size; o < ref3; j = o += 1) {
          removeHint(i, j, index);
        }
      }
      ref4 = Object.keys(hintHash);
      for (p = 0, len1 = ref4.length; p < len1; p++) {
        key = ref4[p];
        delete hintHash[key];
      }
      hintTable[row][col][index] = true;
      return true;
    }
    return false;
  };


  /*
  	Generates a size x size input mask with the same dimensions as the grid
   */

  SudokuGrid.prototype.createRandomInputMask = function() {
    var i, inputMask, j, l, len, m, ref, ref1, row, val;
    inputMask = [];
    len = this.gridLen;
    for (i = l = 0, ref = len; l < ref; i = l += 1) {
      row = [];
      for (j = m = 0, ref1 = len; m < ref1; j = m += 1) {
        if (Math.random() > 0.5) {
          val = 0;
        } else {
          val = 1;
        }
        row.push(val);
      }
      inputMask.push(row);
    }
    return inputMask;
  };


  /*
  	Set values in grid to null if input mask cell is set to 1
  	Randomly select the hint (index)
  	Running this function gives us a random sudoku
  	Although since this is electronic, the grids generated might 
  	have more than one solution. But we are fine with that
   */

  SudokuGrid.prototype.applyInputMask = function() {
    var hints, i, j, l, len, m, randomHint, ref, ref1;
    len = this.gridLen;
    for (i = l = 0, ref = len; l < ref; i = l += 1) {
      for (j = m = 0, ref1 = len; m < ref1; j = m += 1) {
        if (this.inputMask[i][j] === 0) {
          hints = Object.keys(this.hintTable[i][j]);
          randomHint = _.sample(hints);
          this.grid[i][j] = randomHint;
          this.trimHintTable(i, j, randomHint);
        }
      }
    }
    return this.inputMask;
  };


  /*
  	Coordinate and self explanatory access functions below
   */

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

  SudokuGrid.prototype.hintAt = function(numContainer, numCell, index) {
    var coords, hints;
    coords = this.rowColFromCell(numContainer, numCell);
    hints = this.hintTable[coords.row][coords.col];
    if (hints[index]) {
      return this.gridChars[index];
    } else {
      return "";
    }
  };

  SudokuGrid.prototype.isEditable = function(numContainer, numCell) {
    var coords;
    coords = this.rowColFromCell(numContainer, numCell);
    return this.inputMask[coords.row][coords.col] === 1;
  };

  return SudokuGrid;

})();
