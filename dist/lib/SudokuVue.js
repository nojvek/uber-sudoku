define(["jquery", "lodash", "vue", "constants", "SudokuGrid"], function($, _, Vue, constants, SudokuGrid) {
  return {
    createSudokuVue: function(gridSize) {
      var sudokuVue;
      sudokuVue = new Vue({
        el: "#sudoku-container",
        data: {
          showHints: false,
          sudoku: new SudokuGrid(gridSize),
          selectedIndex: null,
          gameOver: false
        },
        methods: {
          loop: function(size) {
            return _.range(0, size * size);
          },
          toIndex: function(numBlock, numCell) {
            var col, row, size;
            size = gridSize;
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
              this.gameOver = this.sudoku.isGridFilled();
              if (this.gameOver) {
                return this.selectedIndex = null;
              }
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
              var elem, i, j, len, results;
              ++frameCounter;
              $cellValues.each(function(i, elem) {
                return elem.innerText = _.sample(chars);
              });
              if (frameCounter < constants.numNewGameAnimFrames) {
                return requestAnimationFrame(renderFrame);
              } else {
                results = [];
                for (i = j = 0, len = $cellValues.length; j < len; i = ++j) {
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
      sudokuVue.newGame();
      return sudokuVue;
    }
  };
});
