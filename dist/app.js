var SudokuGrid, c, constants, sudoku, sudokuVue;

c = console;

sudokuVue = null;

sudoku = null;

constants = {
  blockSize: 3,
  numSwaps: 42,
  numAnimFrames: 30,
  editableProbability: 0.7
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
  sudokuVue = new Vue({
    el: "#sudoku-container",
    data: {
      showHints: false,
      sudoku: null,
      selectedCellIndex: null
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
        this.sudoku = new SudokuGrid(constants.blockSize);
        return requestAnimationFrame(this.animateShuffle);
      },
      onCellClick: function(index) {
        console.log("cellClick", index);
        if (sudoku.editableMask[index]) {
          return this.selectedCellIndex = index;
        }
      },
      onInputClick: function(val) {
        console.log("inputClick", val);
        if (this.selectedCellIndex !== null) {
          return this.sudoku.grid.$set(this.selectedCellIndex, val);
        }
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
  sudokuVue.newGame();
  sudoku = sudokuVue.sudoku;
  $(window).on('resize', autoScaleGrid);
  return requestAnimationFrame(autoScaleGrid);
});


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
  
  	@hintTable
  		A hint table contains possible selectable options
  		It is used when showHints is pressed
  		We also trim the hints as the user makes selections
  
  	@editableMask
  		An array the same size as the grid
  		0 means value cannot be edited by the user
  		1 means the value can be edited by the user
   */
  function SudokuGrid(blockSize) {
    var charA, i;
    if (blockSize == null) {
      blockSize = 3;
    }
    if (!(blockSize >= 2 && blockSize <= 4)) {
      throw new Error("Grid Size should be between 2 and 4");
    }
    charA = 97;
    switch (blockSize) {
      case 2:
        this.gridChars = (function() {
          var k, results;
          results = [];
          for (i = k = 1; k < 5; i = k += 1) {
            results.push(i.toString());
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
    this.blockSize = blockSize;
    this.numCells = blockSize * blockSize;
    this.grid = this.createIdentityGrid();
    this.randomizeGrid();
    this.editableMask = this.createRandomEditableMask();
    this.hintTable = this.createHintTable();
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

  SudokuGrid.prototype.randomizeGrid = function() {
    var blockSize, col, grid, k, l, m, n, n1, n2, numCells, o, offset, p, ref, ref1, ref2, ref3, ref4, ref5, replaceMap, row, shuffledGridChars, swap;
    grid = this.grid;
    shuffledGridChars = _.shuffle(this.gridChars);
    replaceMap = _.object(this.gridChars, shuffledGridChars);
    blockSize = this.blockSize;
    numCells = this.numCells;
    swap = function(r1, c1, r2, c2) {
      var temp;
      temp = grid[r1 * numCells + c1];
      grid[r1 * numCells + c1] = grid[r2 * numCells + c2];
      return grid[r2 * numCells + c2] = temp;
    };
    for (c = k = 0, ref = constants.numSwaps; k < ref; c = k += 1) {
      offset = c % blockSize;
      n1 = Math.floor(Math.random() * blockSize) * blockSize + offset;
      n2 = Math.floor(Math.random() * blockSize) * blockSize + offset;
      for (row = l = 0, ref1 = numCells; l < ref1; row = l += 1) {
        swap(row, n1, row, n2);
      }
    }
    for (c = m = 0, ref2 = constants.numSwaps; m < ref2; c = m += 1) {
      offset = (c % blockSize) * blockSize;
      n1 = Math.floor(Math.random() * blockSize) + offset;
      n2 = Math.floor(Math.random() * blockSize) + offset;
      for (row = n = 0, ref3 = numCells; n < ref3; row = n += 1) {
        swap(row, n1, row, n2);
      }
    }
    for (c = o = 0, ref4 = constants.numSwaps; o < ref4; c = o += 1) {
      offset = (c % blockSize) * blockSize;
      n1 = Math.floor(Math.random() * blockSize) + offset;
      n2 = Math.floor(Math.random() * blockSize) + offset;
      for (col = p = 0, ref5 = numCells; p < ref5; col = p += 1) {
        swap(n1, col, n2, col);
      }
    }
    return grid;
  };


  /*
  	Create a blank hint table, inside each cell we store an hash map (object)
  	with keys as possible choices
   */

  SudokuGrid.prototype.createHintTable = function() {
    var char, hintMap, hintTable, i, k, l, len1, ref, ref1;
    hintTable = [];
    for (i = k = 0, ref = this.grid.length; k < ref; i = k += 1) {
      hintMap = {};
      if (this.editableMask[i] === 0) {
        hintMap[this.grid[i]] = this.grid[i];
      } else {
        ref1 = this.gridChars;
        for (l = 0, len1 = ref1.length; l < len1; l++) {
          char = ref1[l];
          hintMap[char] = char;
        }
      }
      hintTable.push(hintMap);
    }
    return hintTable;
  };


  /*
  	Remove all other values apart from the passed value for the cell
  	Trim other cells by row, col and block
  	If in the process of trimming we encounter a naked singlet
  	then we add it to a queue and trim it in a another pass
   */

  SudokuGrid.prototype.trimHintTable = function(row, col, index) {
    var editableMask, hintTable, item, len, processItem, removeHint, size, trimQueue;
    c.log("sudoku.trimHintTable(", row, col, index, ")");
    hintTable = this.hintTable;
    editableMask = this.editableMask;
    len = this.numCells;
    size = this.blockSize;
    trimQueue = [
      {
        row: row,
        col: col,
        index: index
      }
    ];
    removeHint = (function(_this) {
      return function(row, col, index) {
        var hintHash, hints;
        hintHash = hintTable[row][col];
        if (hintHash[index]) {
          delete hintHash[index];
          hints = Object.keys(hintHash);
          if (hints.length === 1) {
            c.log("orphan", row, col, hints);
            trimQueue.push({
              row: row,
              col: col,
              index: hints[0]
            });
          }
        }
      };
    })(this);
    processItem = function(row, col, index) {
      var blockCol, blockRow, cellCol, cellRow, hintHash, i, j, k, l, m, n, ref, ref1, ref2, ref3;
      hintHash = hintTable[row][col];
      if (hintHash) {
        hintTable[row][col] = {};
        hintTable[row][col][index] = true;
        for (i = k = 0, ref = len; k < ref; i = k += 1) {
          if (i !== row) {
            removeHint(i, col, index);
          }
        }
        for (j = l = 0, ref1 = len; l < ref1; j = l += 1) {
          if (j !== col) {
            removeHint(row, j, index);
          }
        }
        blockRow = Math.floor(row / size) * size;
        blockCol = Math.floor(col / size) * size;
        for (i = m = 0, ref2 = size; m < ref2; i = m += 1) {
          cellRow = blockRow + i;
          for (j = n = 0, ref3 = size; n < ref3; j = n += 1) {
            cellCol = blockCol + j;
            if (cellCol !== row && cellCol !== col) {
              removeHint(blockRow + i, blockCol + j, index);
            }
          }
        }
        return true;
      }
    };
    while (trimQueue.length > 0) {
      item = trimQueue.shift();
      processItem(item.row, item.col, item.index);
    }
    return false;
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

  return SudokuGrid;

})();
