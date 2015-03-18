c = console

constants =
	gridSize: 3
	numSwaps: 10

sudokuGridView = null

$ ->

	#add View Port tag
	#containerWidth  = $(".sudoku-container").width()
	#$('head').append("<meta name='viewport' content=width='" + containerWidth + ", initial-scale=1.0, maximum-scale=1.0, user-scalable=0'>")



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
	sudokuGrid.randomize()
	#$("#sudoku-grid").addClass("grid" + constants.gridSize)

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
				@gridChars = (String.fromCharCode(i) for i in [charA ... charA + 4] by 1)
			when 3
				@gridChars = (i.toString() for i in [1 ... 10] by 1)
			when 4
				@gridChars = (i.toString() for i in [0 ... 10] by 1)
				@gridChars = @gridChars.concat (String.fromCharCode(i) for i in [charA ... charA + 6] by 1)
		
		@gridSize = gridSize
		@grid = @identity()


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
	identity: ->
		@grid = []
		size = @gridSize
		len = size * size

		for i in [0...len] by 1
			row = []
			for j in [0...len] by 1
				index = ((i * size + j + Math.floor(i / size)) % len)
				row.push(@gridChars[index])
			@grid.push(row)
		
		return @grid

	###
	Randomize by swapping rows and columns between a cell-container
	###
	randomize: ->
		size = @gridSize
		len = size * size
		grid = @grid

		swap = (num1, num2, rowMul, colMul) ->
			row1 = row2 = col1 = col2 = 0
			if colMul == 1
				row1 = num1
				row2 = num2
			else if rowMul = 1
				col1 = num1
				col2 = num2

			c.log row1, row2, col1, col2, rowMul, colMul

			for i in [0...len] by 1
				rowAdd = i * rowMul
				colAdd = i * colMul
				temp = grid[row1 + rowAdd][col1 + colAdd]
				grid[row1 + rowAdd][col1 + colAdd] = grid[row2 + rowAdd][col2 + colAdd]
				grid[row2 + rowAdd][col2 + colAdd] = temp


		for i in [0...constants.numSwaps] by 1
			for numCell in [0...size] by 1
				if Math.random() > 0.5 
					offset = numCell * size			
					num1 = Math.floor(Math.random() * size) + offset
					num2 = (num1 + 1) % size + offset

				if Math.random() > 0.5 
					num1 = Math.floor(Math.random() * size) + offset
					num2 = (num1 + 1) % size + offset
					swap(num1, num2, 1, 0)



		#swap cols
		return @grid

