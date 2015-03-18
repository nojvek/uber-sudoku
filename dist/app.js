var SudokuGrid, c, constants, sudokuGridView;

c = console;

constants = {
  gridSize: 3,
  numSwaps: 10
};

sudokuGridView = null;

$(function() {
  var cells, counter, maxAnimationFrames, nums, randomizeNumbers, sudokuGrid;
  cells = $(".cell-value");
  nums = _.range(1, 10);
  counter = 0;
  maxAnimationFrames = 50;
  randomizeNumbers = function() {
    ++counter;
    cells.each(function(i, elem) {
      return elem.innerText = _.sample(nums);
    });
    if (counter < maxAnimationFrames) {
      return requestAnimationFrame(randomizeNumbers);
    }
  };
  sudokuGrid = new SudokuGrid(constants.gridSize);
  sudokuGrid.randomize();
  return sudokuGridView = new Vue({
    el: "#sudoku-grid",
    data: sudokuGrid,
    methods: {
      loop: function(size) {
        return _.range(0, size * size);
      },
      getCellValue: function(grid, numContainer, numCell) {
        var cellX, cellY, containerX, containerY, size;
        size = Math.sqrt(grid.length);
        containerX = numContainer % size;
        containerY = Math.floor(numContainer / size);
        cellX = containerX * size + numCell % size;
        cellY = containerY * size + Math.floor(numCell / size);
        return grid[cellY][cellX];
      }
    }
  });
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
    this.grid = this.identity();
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
    len = size * size;
    for (i = k = 0, ref = len; k < ref; i = k += 1) {
      row = [];
      for (j = l = 0, ref1 = len; l < ref1; j = l += 1) {
        index = (i * size + j + Math.floor(i / size)) % len;
        row.push(this.gridChars[index]);
      }
      this.grid.push(row);
    }
    return this.grid;
  };


  /*
  	Randomize by swapping rows and columns between a cell-container
   */

  SudokuGrid.prototype.randomize = function() {
    var grid, i, k, l, len, num1, num2, numCell, offset, ref, ref1, size, swap;
    size = this.gridSize;
    len = size * size;
    grid = this.grid;
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
      c.log(row1, row2, col1, col2, rowMul, colMul);
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

  return SudokuGrid;

})();
