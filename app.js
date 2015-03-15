var c;

c = console;

$(function() {
  var cells, counter, maxAnimationFrames, nums, randomizeNumbers;
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
  return randomizeNumbers();
});
