define(["jquery", "lodash", "constants", "SudokuVue"], function($, _, constants, SudokuVue) {
  return $(function() {
    var autoScaleGrid, blockSize, parseUrlVars;
    blockSize = constants.blockSize;
    parseUrlVars = function() {
      var queryMatch;
      queryMatch = location.search.match(/size=(\d)/);
      if (queryMatch && (queryMatch[1] === "2" || queryMatch[1] === "4")) {
        return blockSize = parseInt(queryMatch[1]);
      }
    };
    parseUrlVars();
    window.sudokuVue = SudokuVue.createSudokuVue(blockSize);
    window.sudoku = sudokuVue.sudoku;
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
    $(window).on('resize', autoScaleGrid);
    return requestAnimationFrame(autoScaleGrid);
  });
});
