c = console
sudokuVue = null

constants =
	gridSize: 3
	numSwaps: 10
	numAnimFrames: 30


$ ->
	# If size url param is present then we change the grid size accordingly
	parseUrlVars = ->
		queryMatch = location.search.match(/size=(\d)/)
		if queryMatch and (queryMatch[1] == "2" or queryMatch[1] == "4")
			constants.gridSize = parseInt(queryMatch[1])

	autoScaleGrid = ->
		$container = $("#sudoku-container")
		$window = $(window)
		cw = $container.outerWidth()
		ch = $container.outerHeight()
		ww = $window.width()
		wh = $window.height()
		scale = Math.min(ww/cw, wh/ch)
		$container.css(transform: "scale(" + scale + ")", top: (wh - ch * scale)/2)

	
	sudokuVue = new Vue
		el: "#sudoku-container"
		data:
			showHints: false
			inputMask: []
			sudoku: null

		methods:
			loop: (size) -> _.range(0, size * size)
			newGame: ->
				@sudoku = new SudokuGrid(constants.gridSize)
				requestAnimationFrame(@animateShuffle)

			onCellClick: (numContainer, numCell) ->
				c.log numContainer, numCell

			# Do a fast fake animation when newGame is generated
			animateShuffle: ->
				$cellValues = $(".cell:not(.editable) > .cell-value")
				innerTexts = $.map($cellValues, (elem) -> elem.innerText)

				chars = @sudoku.gridChars
				frameCounter = 0

				renderFrame = ->
					++frameCounter

					$cellValues.each (i, elem) -> elem.innerText = _.sample(chars)
					if frameCounter < constants.numAnimFrames
						requestAnimationFrame(renderFrame)
					else
						# On last frame add original innerText
						for elem, i in $cellValues
							elem.innerText = innerTexts[i]

				requestAnimationFrame(renderFrame)


	parseUrlVars()
	sudokuVue.newGame()

	$(window).on('resize', autoScaleGrid)
	requestAnimationFrame(autoScaleGrid)



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
				@gridChars = (i.toString() for i in [1 ... 5] by 1)
			when 3
				@gridChars = (i.toString() for i in [1 ... 10] by 1)
			when 4
				@gridChars = (i.toString() for i in [0 ... 10] by 1)
				@gridChars = @gridChars.concat (String.fromCharCode(i) for i in [charA ... charA + 6] by 1)
		
		@gridSize = gridSize
		@gridLen = gridSize * gridSize
		@grid = @identity()
		@shuffleGrid()
		@inputMask = @randomInputMask()
		@applyInputMask()


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
		len = @gridLen

		for i in [0...len] by 1
			row = []
			for j in [0...len] by 1
				index = ((i * size + j + Math.floor(i / size)) % len)
				row.push(index)
			@grid.push(row)
		
		return @grid

	###
	Randomize by swapping rows and columns between a cell-container
	###
	shuffleGrid: ->
		grid = @grid
		size = @gridSize
		len = size * size

		swap = (num1, num2, rowMul, colMul) ->
			row1 = row2 = col1 = col2 = 0
			if colMul == 1
				row1 = num1
				row2 = num2
			else if rowMul = 1
				col1 = num1
				col2 = num2

			#c.log row1, row2, col1, col2, rowMul, colMul

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

	###
	Generates a size x size input mask with the same dimensions as the grid
	0 means value cannot be edited by the user
	1 means the value can be edited by the user
	###
	randomInputMask: ->
		@inputMask = []
		len = @gridLen

		for i in [0...len] by 1
			row = []
			for j in [0...len] by 1
				if Math.random() > 0.5 then val = 0 else val = 1
				row.push(val)
			@inputMask.push(row)
		
		return @inputMask

	###
	Set values in grid to null if input mask cell is set to 1
	We randomly set cells to be editable
	###
	applyInputMask:  ->
		len = @gridLen
		for i in [0...len] by 1
			for j in [0...len] by 1
				if @inputMask[i][j] == 1
					@grid[i][j] = null
		return @inputMask

	rowColFromCell: (numContainer, numCell) ->
		size = @gridSize
		col = numContainer % size
		row = Math.floor(numContainer / size)
		col = col * size + numCell % size
		row = row * size + Math.floor(numCell / size)
		return row:row, col:col

	charAt: (numContainer, numCell) ->
		coords = @rowColFromCell(numContainer, numCell)
		val = @grid[coords.row][coords.col]
		return if val != null then @gridChars[val] else ""

	hintAt: (numContainer, numCell, numHint) ->
		coords = @rowColFromCell(numContainer, numCell)
		return @gridChars[numHint]

	isEditable: (numContainer, numCell) ->
		coords = @rowColFromCell(numContainer, numCell)
		return @inputMask[coords.row][coords.col] == 1

