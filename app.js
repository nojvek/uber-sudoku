var SudokuGrid, c, constants;

c = console;

constants = {
  gridSize: 3
};

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
  $("#sudoku-grid").addClass("grid" + constants.gridSize);
  return c.log(sudokuGrid.grid);
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
  	@gridChars
  		For a 2x2 sudoku they are a..d
  		For a 3x3 sudoku these are just 1...9
  		for a 4x4 sudoku they are 0..9a..f
  	returns
  		2 dimensional identity grid. Its also stored in @grid variable
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
          var j, len, ref, results;
          ref = _.range(charA, charA + 4);
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            results.push(String.fromCharCode(i));
          }
          return results;
        })();
        break;
      case 3:
        this.gridChars = (function() {
          var j, len, ref, results;
          ref = _.range(1, 10);
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            results.push(i.toString());
          }
          return results;
        })();
        break;
      case 4:
        this.gridChars = (function() {
          var j, len, ref, results;
          ref = _.range(0, 10);
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            results.push(i.toString());
          }
          return results;
        })();
        this.gridChars = this.gridChars.concat((function() {
          var j, len, ref, results;
          ref = _.range(charA, charA + 6);
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            i = ref[j];
            results.push(String.fromCharCode(i));
          }
          return results;
        })());
    }
    this.gridSize = gridSize;
    this.grid = this.createIdentityGrid();
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
    var char, j, len, ref, row;
    this.grid = [];
    row = [];
    ref = this.gridChars;
    for (j = 0, len = ref.length; j < len; j++) {
      char = ref[j];
      row.push(char);
    }
    this.grid.push(row);
    return this.grid;
  };

  return SudokuGrid;

})();
