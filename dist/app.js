var SudokuGrid, constants, createSudokuVue, sudoku, sudokuVue;

sudokuVue = null;

sudoku = null;

constants = {
  blockSize: 3,
  numSwaps: 10,
  numAnimFrames: 30,
  editableProbability: 0.4
};

$(function() {
  var autoScaleGrid, parseUrlVars;
  parseUrlVars = function() {
    var queryMatch;
    queryMatch = location.search.match(/size=(\d)/);
    if (queryMatch && (queryMatch[1] === "2" || queryMatch[1] === "4")) {
      return constants.blockSize = parseInt(queryMatch[1]);
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
  parseUrlVars();
  sudokuVue = createSudokuVue();
  sudoku = sudokuVue.sudoku;
  $(window).on('resize', autoScaleGrid);
  return requestAnimationFrame(autoScaleGrid);
});

createSudokuVue = function() {
  sudokuVue = new Vue({
    el: "#sudoku-container",
    data: {
      showHints: false,
      sudoku: new SudokuGrid(constants.blockSize),
      selectedIndex: null,
      gameOver: false
    },
    methods: {
      loop: function(size) {
        return _.range(0, size * size);
      },
      toIndex: function(numBlock, numCell) {
        var col, row, size;
        size = constants.blockSize;
        col = numBlock % size;
        row = Math.floor(numBlock / size);
        col = col * size + numCell % size;
        row = row * size + Math.floor(numCell / size);
        return row * size * size + col;
      },
      newGame: function() {
        this.sudoku.newGame();
        this.selectedIndex = null;
        this.showHints = false;
        this.gameOver = false;
        return requestAnimationFrame(this.animateShuffle);
      },
      onCellClick: function(index) {
        if (sudoku.editableMask[index]) {
          return this.selectedIndex = index;
        }
      },
      onInputClick: function(val) {
        if (this.selectedIndex !== null) {
          this.sudoku.grid.$set(this.selectedIndex, val);
          this.sudoku.updateHintGrid();
          return this.gameOver = this.sudoku.isGridFilled();
        }
      },
      animateShuffle: function() {
        var $cellValues, chars, frameCounter, innerTexts, renderFrame;
        $cellValues = $(".cell > .cell-value");
        innerTexts = $.map($cellValues, function(elem) {
          return elem.innerText;
        });
        chars = this.sudoku.gridChars;
        frameCounter = 0;
        renderFrame = function() {
          var elem, i, k, len, results1;
          ++frameCounter;
          $cellValues.each(function(i, elem) {
            return elem.innerText = _.sample(chars);
          });
          if (frameCounter < constants.numAnimFrames) {
            return requestAnimationFrame(renderFrame);
          } else {
            results1 = [];
            for (i = k = 0, len = $cellValues.length; k < len; i = ++k) {
              elem = $cellValues[i];
              results1.push(elem.innerText = innerTexts[i]);
            }
            return results1;
          }
        };
        return requestAnimationFrame(renderFrame);
      }
    }
  });
  sudokuVue.newGame();
  return sudokuVue;
};


/*
SudokuGrid contains functions for grid generation, validation and hinting
 */

SudokuGrid = (function() {

  /*
  	@blockSize
  		We're trying not to hard code the grid size in code
  		blockSize can be change by using the url param ?size=2 or ?size=4
  		2x2 are cute, and 4x4 are quite a bit of fun
  
  	@grid
  		Store the sudoku grid in a dimensional array
  		null values in array means they haven't been filled
  
  	@gridChars
  		For a 2x2 sudoku they are 1...4
  		For a 3x3 sudoku these are just 1...9
  		for a 4x4 sudoku they are 0...9a...f
  
  	@hintGrid
  		A hint table contains possible selectable options
  		It is used when showHints is pressed
  		We also trim the hints as the user makes selections
  
  	@editableMask
  		An array the same size as the grid
  		0 means value cannot be edited by the user
  		1 means the value can be edited by the user
   */
  function SudokuGrid(blockSize) {
    var charA, charF, i;
    if (blockSize == null) {
      blockSize = 3;
    }
    if (!(blockSize >= 2 && blockSize <= 4)) {
      throw new Error("Grid Size should be between 2 and 4");
    }
    switch (blockSize) {
      case 2:
        this.gridChars = (function() {
          var k, results1;
          results1 = [];
          for (i = k = 1; k <= 4; i = k += 1) {
            results1.push(i.toString());
          }
          return results1;
        })();
        break;
      case 3:
        this.gridChars = (function() {
          var k, results1;
          results1 = [];
          for (i = k = 1; k <= 9; i = k += 1) {
            results1.push(i.toString());
          }
          return results1;
        })();
        break;
      case 4:
        charA = 97;
        charF = charA + 5;
        this.gridChars = (function() {
          var k, results1;
          results1 = [];
          for (i = k = 0; k <= 9; i = k += 1) {
            results1.push(i.toString());
          }
          return results1;
        })();
        this.gridChars = this.gridChars.concat((function() {
          var k, ref, ref1, results1;
          results1 = [];
          for (i = k = ref = charA, ref1 = charF; k <= ref1; i = k += 1) {
            results1.push(String.fromCharCode(i));
          }
          return results1;
        })());
    }
    this.blockSize = blockSize;
    this.numCells = blockSize * blockSize;
    this.grid = this.createIdentityGrid();
    this.editableMask = [];
    this.hintGrid = this.createHintGrid();
  }


  /*
  	Create a new sudoku layout
   */

  SudokuGrid.prototype.newGame = function() {
    this.grid = this.createIdentityGrid();
    this.randomizeGrid();
    this.editableMask = this.createRandomEditableMask();
    return this.updateHintGrid();
  };


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

  SudokuGrid.prototype.createIdentityGrid = function() {
    var grid, i, index, j, k, l, ref, ref1;
    grid = [];
    for (i = k = 0, ref = this.numCells; k < ref; i = k += 1) {
      for (j = l = 0, ref1 = this.numCells; l < ref1; j = l += 1) {
        index = (i * this.blockSize + j + Math.floor(i / this.blockSize)) % this.numCells;
        grid.push(this.gridChars[index]);
      }
    }
    return grid;
  };


  /*
  	Algorithm based on http://blog.forret.com/2006/08/a-sudoku-challenge-generator/
  	We do an substitute replace, swap between blocks, cols and rows
   */

  SudokuGrid.prototype.randomizeGrid = function() {
    var blockSize, c, col, grid, i, k, l, m, n, n1, n2, numCells, o, offset, p, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, replaceMap, row, shuffledGridChars, swap;
    grid = this.grid;
    shuffledGridChars = _.shuffle(this.gridChars);
    replaceMap = _.object(this.gridChars, shuffledGridChars);
    blockSize = this.blockSize;
    numCells = this.numCells;
    for (i = k = 0, ref = this.grid.length; k < ref; i = k += 1) {
      grid[i] = replaceMap[grid[i]];
    }
    swap = function(row1, col1, row2, col2) {
      var temp;
      temp = grid[row1 * numCells + col1];
      grid[row1 * numCells + col1] = grid[row2 * numCells + col2];
      return grid[row2 * numCells + col2] = temp;
    };
    for (c = l = 0, ref1 = constants.numSwaps; l < ref1; c = l += 1) {
      offset = c % blockSize;
      n1 = Math.floor(Math.random() * blockSize) * blockSize + offset;
      n2 = Math.floor(Math.random() * blockSize) * blockSize + offset;
      for (row = m = 0, ref2 = numCells; m < ref2; row = m += 1) {
        swap(row, n1, row, n2);
      }
    }
    for (c = n = 0, ref3 = constants.numSwaps; n < ref3; c = n += 1) {
      offset = (c % blockSize) * blockSize;
      n1 = Math.floor(Math.random() * blockSize) + offset;
      n2 = Math.floor(Math.random() * blockSize) + offset;
      for (row = o = 0, ref4 = numCells; o < ref4; row = o += 1) {
        swap(row, n1, row, n2);
      }
    }
    for (c = p = 0, ref5 = constants.numSwaps; p < ref5; c = p += 1) {
      offset = (c % blockSize) * blockSize;
      n1 = Math.floor(Math.random() * blockSize) + offset;
      n2 = Math.floor(Math.random() * blockSize) + offset;
      for (col = q = 0, ref6 = numCells; q < ref6; col = q += 1) {
        swap(n1, col, n2, col);
      }
    }
    this.logGrid(grid);
    return grid;
  };


  /*
  	Log the grid to console before we mask the editables
   */

  SudokuGrid.prototype.logGrid = function(grid) {
    var i, k, ref, str;
    str = "";
    for (i = k = 0, ref = grid.length; k < ref; i = k += 1) {
      if (i > 0) {
        if (i % this.blockSize === 0) {
          str += "  ";
        }
        if (i % this.numCells === 0) {
          str += "\n";
          if (Math.floor(i / this.numCells) % this.blockSize === 0) {
            str += "\n";
          }
        }
      }
      str += grid[i] + " ";
    }
    console.log("Correct Solution:");
    return console.log(str);
  };


  /*
  	Generates a size x size input mask with the same dimensions as the grid
   */

  SudokuGrid.prototype.createRandomEditableMask = function() {
    var editableMask, i, k, ref, val;
    editableMask = [];
    for (i = k = 0, ref = this.grid.length; k < ref; i = k += 1) {
      if (Math.random() > constants.editableProbability) {
        val = 0;
      } else {
        val = 1;
      }
      if (val === 1) {
        this.grid[i] = "";
      }
      editableMask.push(val);
    }
    return editableMask;
  };


  /*
  	Create a blank hint table, inside each cell we store an hash map (object)
  	with keys as possible choices. For cells that have vva
   */

  SudokuGrid.prototype.createHintGrid = function() {
    var char, hintGrid, hintMap, i, k, l, len, ref, ref1;
    hintGrid = [];
    for (i = k = 0, ref = this.grid.length; k < ref; i = k += 1) {
      hintMap = {};
      ref1 = this.gridChars;
      for (l = 0, len = ref1.length; l < len; l++) {
        char = ref1[l];
        hintMap[char] = char;
      }
      hintGrid.push(hintMap);
    }
    return hintGrid;
  };


  /*
  	For every blank cell in the grid we update the possible values it can have
  	We search through the column, row and block. Standard sudoku validation
  	If there is a dead lock then the user will see a cell with no hints
  	In that case he has to undo the most recent selection and chose another hint
   */

  SudokuGrid.prototype.updateHintGrid = function() {
    var blockSize, char, grid, hintGrid, hintMap, i, k, l, len, numCells, present, ref, ref1, scanCell;
    hintGrid = this.hintGrid;
    blockSize = this.blockSize;
    grid = this.grid;
    numCells = this.numCells;
    scanCell = (function(_this) {
      return function(row, col) {
        var blockCol, blockRow, i, j, k, l, m, n, ref, ref1, ref2, ref3, results;
        results = {};
        for (i = k = 0, ref = numCells; k < ref; i = k += 1) {
          results[grid[row * numCells + i]] = true;
        }
        for (i = l = 0, ref1 = numCells; l < ref1; i = l += 1) {
          results[grid[i * numCells + col]] = true;
        }
        blockRow = Math.floor(row / blockSize) * blockSize;
        blockCol = Math.floor(col / blockSize) * blockSize;
        for (i = m = 0, ref2 = blockSize; m < ref2; i = m += 1) {
          for (j = n = 0, ref3 = blockSize; n < ref3; j = n += 1) {
            results[grid[(i + blockRow) * numCells + j + blockCol]] = true;
          }
        }
        return results;
      };
    })(this);
    for (i = k = 0, ref = hintGrid.length; k < ref; i = k += 1) {
      hintMap = hintGrid[i];
      if (this.editableMask[i] === 1) {
        present = scanCell(Math.floor(i / numCells), i % numCells);
        ref1 = this.gridChars;
        for (l = 0, len = ref1.length; l < len; l++) {
          char = ref1[l];
          hintMap[char] = present[char] ? "" : char;
        }
      }
    }
    return hintGrid;
  };


  /*
  	Used for checking whether the game is finished.
  	If all cells in grid are filled then it returns true, otherwise false
   */

  SudokuGrid.prototype.isGridFilled = function() {
    return _.filter(this.grid, function(val) {
      return val === "";
    }).length === 0;
  };

  return SudokuGrid;

})();
