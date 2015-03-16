c = console

constants =
	gridSize: 3

$ ->
	cells = $(".cell-value")
	nums = _.range(1, 10)
	counter = 0
	maxAnimationFrames = 50

	randomizeNumbers = ->
		++counter
		cells.each (i,elem) ->
			elem.innerText = _.sample(nums)
		requestAnimationFrame(randomizeNumbers) if counter < maxAnimationFrames

	#randomizeNumbers()

	sudokuGrid = new SudokuGrid(constants.gridSize)
	$("#sudoku-grid").addClass("grid" + constants.gridSize)

	sudokuGridView = new Vue
		el: "#sudoku-grid"
		data: sudokuGrid
		methods:
			loop: (size) -> _.range(0, size * size)

			getCellValue: (grid, numContainer, numCell) ->
				size = Math.sqrt(grid.length)
				containerX = numContainer % size
				containerY = Math.floor(numContainer / size)
				cellX = containerX * size + numCell % size
				cellY = containerY * size  + Math.floor(numCell / size)
				return grid[cellY][cellX]


###
SudokuGrid works on a datastructure of a 2 dimensional grid
and a 2 dimensional input mask of the same size.

It contains functions for grid generation, validation and hinting
###
class SudokuGrid
	###
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
	###
	constructor: (gridSize = 3) ->
		if not (gridSize >= 2 and gridSize <= 4)
			throw new Error("Grid Size should be between 2 and 4")

		charA = 97
		switch gridSize
			when 2
				@gridChars = (String.fromCharCode(i) for i in _.range(charA, charA + 4))
			when 3
				@gridChars = (i.toString() for i in _.range(1, 10))
			when 4
				@gridChars = (i.toString() for i in _.range(0, 10))
				@gridChars = @gridChars.concat (String.fromCharCode(i) for i in _.range(charA, charA + 6))
		
		@gridSize = gridSize
		@grid = @createIdentityGrid()


	###
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
	###
	createIdentityGrid: ->
		@grid = []
		len = @gridSize *  @gridSize
		size = @gridSize

		for i in _.range(0, len)
			row = []
			for j in _.range(0, len)
				index = ((i * size + j + Math.floor(i / size)) % len)
				row.push(@gridChars[index])
			@grid.push(row)
		
		return @grid

