c = console
sudokuVue = null
sudoku = null

constants =
	gridSize: 3
	numSwaps: 10
	numAnimFrames: 30
	editableProbability: 0.7


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
			sudoku: null
			selectedCellPos: null

		methods:
			loop: (size) -> _.range(0, size * size)
			newGame: ->
				@sudoku = new SudokuGrid(constants.gridSize)
				requestAnimationFrame(@animateShuffle)	

			onCellClick: (numBlock, numCell) ->
				c.log numBlock, numCell

			onInputClick: (numInput) ->
				c.log numInput

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

	
	sudoku = sudokuVue.sudoku
	sudoku.trimHintTable 0, 1, 2 
	sudoku.trimHintTable 0, 2, 1 
	sudoku.trimHintTable 1, 0, 0 
	sudoku.trimHintTable 2, 1, 0 
	#sudoku.trimHintTable 3, 2, 2
	sudokuVue.sudoku = null; sudokuVue.sudoku = sudoku
	


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
		For a 2x2 sudoku they are 1...4
		For a 3x3 sudoku these are just 1...9
		for a 4x4 sudoku they are 0...9a...f

	@hintTable
		A hint table contains possible selectable options
		It is always a valid sudoku if any of the selections are made
		Rather than running a validation run on every move
		we trim down the hint table as the user makes choices

	@inputMask
		2 dimensional table same size as grid generated randomly
		0 means value cannot be edited by the user
		1 means the value can be edited by the user
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
		@grid = @createEmptyGrid()
		@inputMask = @createRandomInputMask()
		@hintTable = @createHintTable()
		#@applyInputMask()


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
	Randomize by swapping rows and columns between a block
	We aren't currently using this method is it doesn't truly randomize the grid
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
		return @grid

	###
	Create an empty grid of size:size and set all values to null
	###
	createEmptyGrid: ->
		grid = []
		len = @gridLen

		for i in [0...len] by 1
			row = []
			for j in [0...len] by 1
				row.push(null)
			grid.push(row)
		
		return grid


	###
	Create a blank hint table, inside each cell we store an hash map (object)
	with keys as possible choices
	###
	createHintTable: ->
		hintTable = []
		len = @gridLen

		for i in [0...len] by 1
			row = []
			for j in [0...len] by 1
				options = {}
				for k in [0...len] by 1
					options[k] = true
				row.push(options)
			hintTable.push(row)
		
		return hintTable

	###
	Remove all other values apart from the passed value for the cell
	Trim other cells by row, col and block
	If in the process of trimming we encounter a naked singlet
	then we add it to a queue and trim it in a another pass
	###
	trimHintTable: (row, col, index) ->
		c.log "sudoku.trimHintTable(", row, col, index, ")"
		hintTable = @hintTable
		inputMask = @inputMask
		len = @gridLen
		size = @gridSize
		trimQueue = [{row: row, col: col, index: index}]

		removeHint = (row, col, index) =>
			hintHash = hintTable[row][col]
			if hintHash[index]
				delete hintHash[index]
				hints = Object.keys(hintHash)
				if hints.length == 1
					c.log "orphan", row, col, hints
					trimQueue.push(row: row, col: col, index: hints[0])

			return

		processItem = (row, col, index) ->
			hintHash = hintTable[row][col]
			if hintHash
				hintTable[row][col] = {}
				hintTable[row][col][index] = true

				for i in [0...len] by 1
					if i != row
						removeHint(i, col, index)

				for j in [0...len] by 1
					if j != col
						removeHint(row, j, index)

				blockRow = Math.floor(row/size) * size
				blockCol = Math.floor(col/size) * size

				for i in [0...size] by 1
					cellRow = blockRow + i
					for j in [0...size] by 1
						cellCol = blockCol + j
						if cellCol != row and cellCol!= col
							removeHint(blockRow + i, blockCol + j, index)

				return true

		while trimQueue.length > 0
			item = trimQueue.shift()
			processItem(item.row, item.col, item.index)


		return false


	###
	Generates a size x size input mask with the same dimensions as the grid
	###
	createRandomInputMask: ->
		inputMask = []
		len = @gridLen

		for i in [0...len] by 1
			row = []
			for j in [0...len] by 1
				if Math.random() > constants.editableProbability then val = 0 else val = 1
				row.push(val)
			inputMask.push(row)
		
		return inputMask

	###
	Set values in grid to null if input mask cell is set to 1
	Randomly select the hint (index)
	Running this function gives us a random sudoku
	Although since this is electronic, the grids generated might 
	have more than one solution. But we are fine with that
	###
	applyInputMask:  ->
		len = @gridLen
		for i in [0...len] by 1
			for j in [0...len] by 1
				if @inputMask[i][j] == 0
					hints = Object.keys(@hintTable[i][j])
					randomHint = _.sample(hints)
					@grid[i][j] = randomHint
					if hints.length > 1
						@trimHintTable(i, j, randomHint)

		return @inputMask

	###
	Coordinate and self explanatory access functions below
	###
	rowColFromCell: (numBlock, numCell) ->
		size = @gridSize
		col = numBlock % size
		row = Math.floor(numBlock / size)
		col = col * size + numCell % size
		row = row * size + Math.floor(numCell / size)
		return row:row, col:col

	charAt: (numBlock, numCell) ->
		coords = @rowColFromCell(numBlock, numCell)
		val = @grid[coords.row][coords.col]
		return if val != null then @gridChars[val] else ""

	hintAt: (numBlock, numCell, index) ->
		coords = @rowColFromCell(numBlock, numCell)
		hints = @hintTable[coords.row][coords.col]
		return if hints[index] then @gridChars[index] else ""

	isEditable: (numBlock, numCell) ->
		coords = @rowColFromCell(numBlock, numCell)
		return @inputMask[coords.row][coords.col] == 1

