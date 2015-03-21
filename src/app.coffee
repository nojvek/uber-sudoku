c = console
sudokuVue = null
sudoku = null

constants =
	blockSize: 3
	numSwaps: 10
	numAnimFrames: 30
	editableProbability: 0.7

$ ->
	# If size url param is present then we change the grid size accordingly
	parseUrlVars = ->
		queryMatch = location.search.match(/size=(\d)/)
		if queryMatch and (queryMatch[1] == "2" or queryMatch[1] == "4")
			constants.blockSize = parseInt(queryMatch[1])

	# scale the sudoku container so it fits within the viewport vertically centered
	# if it is landscape view then the leaf background will show on the right
	autoScaleGrid = ->
		$container = $("#sudoku-container")
		$window = $(window)
		cw = $container.outerWidth()
		ch = $container.outerHeight()
		ww = $window.width()
		wh = $window.height()
		scale = Math.min(ww/cw, wh/ch)
		$container.css(transform: "scale(" + scale + ")", top: (wh - ch * scale)/2)


	# This acts as our main method
	sudokuVue = createSudokuVue()
	parseUrlVars()
	sudokuVue.newGame()
	sudoku = sudokuVue.sudoku #for debugging

	$(window).on('resize', autoScaleGrid)
	requestAnimationFrame(autoScaleGrid)


# We are using a small library called vue that handles the view model binding.
# We could have done it all with jquery but that would involve too spagetti code.
# Vue works really well with coffeescript and jade syntax.
# Uber said not to use backbone, so I'm iffy whether they'll approve of this.
# I think its very simple, elegant and descriptive code.
createSudokuVue = ->
	return new Vue
		el: "#sudoku-container"
		data:
			showHints: false
			sudoku: null
			selectedIndex: null

		methods:
			loop: (size) -> _.range(0, size * size)

			toIndex: (numBlock, numCell) ->
				size = constants.blockSize
				col = numBlock % size
				row = Math.floor(numBlock / size)
				col = col * size + numCell % size
				row = row * size + Math.floor(numCell / size)
				return row * size * size + col

			newGame: ->
				@sudoku = new SudokuGrid(constants.blockSize)
				@selectedIndex = null
				requestAnimationFrame(@animateShuffle)

			onCellClick: (index) ->
				console.log "cellClick", index
				if sudoku.editableMask[index]
					@selectedIndex = index

			onInputClick: (val) ->
				console.log "inputClick", val
				if @selectedIndex != null
					@sudoku.grid.$set(@selectedIndex, val)
					@sudoku.updateHintTable()

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

###
SudokuGrid contains functions for grid generation, validation and hinting
###
class SudokuGrid
	###
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

	@hintGrid
		A hint table contains possible selectable options
		It is used when showHints is pressed
		We also trim the hints as the user makes selections

	@editableMask
		An array the same size as the grid
		0 means value cannot be edited by the user
		1 means the value can be edited by the user
	###
	constructor: (blockSize = 3) ->
		if not (blockSize >= 2 and blockSize <= 4)
			throw new Error("Grid Size should be between 2 and 4")

		charA = 97
		switch blockSize
			when 2
				@gridChars = (i.toString() for i in [1 ... 5] by 1)
			when 3
				@gridChars = (i.toString() for i in [1 ... 10] by 1)
			when 4
				@gridChars = (i.toString() for i in [0 ... 10] by 1)
				@gridChars = @gridChars.concat (String.fromCharCode(i) for i in [charA ... charA + 6] by 1)
		
		@blockSize = blockSize
		@numCells = blockSize * blockSize
		@grid = @createIdentityGrid()
		@randomizeGrid()
		@editableMask = @createRandomEditableMask()
		@hintGrid = @createHintTable()


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
		grid = []

		for i in [0...@numCells] by 1
			for j in [0...@numCells] by 1
				index = ((i * @blockSize + j + Math.floor(i / @blockSize)) % @numCells)
				grid.push(@gridChars[index])
		
		return grid


	randomizeGrid: ->
		grid = @grid
		shuffledGridChars = _.shuffle(@gridChars)
		replaceMap = _.object(@gridChars, shuffledGridChars)
		blockSize = @blockSize
		numCells = @numCells

		# Think of this like an enigma cipher. 
		# We substitute one character with another
		#for i in [0...@grid.length] by 1
		#	grid[i] = replaceMap[grid[i]]

		# We swap between blocks, rows and cols
		# Algorithm based on http://blog.forret.com/2006/08/a-sudoku-challenge-generator/

		swap = (r1, c1, r2, c2) ->
			temp = grid[r1 * numCells + c1]
			grid[r1 * numCells + c1] = grid[r2 * numCells + c2]
			grid[r2 * numCells + c2] = temp

		for c in [0...constants.numSwaps] by 1
			offset = c % blockSize
			n1 = Math.floor(Math.random() * blockSize) * blockSize + offset
			n2 = Math.floor(Math.random() * blockSize) * blockSize + offset

			for row in [0...numCells] by 1
				swap(row, n1, row, n2)

		for c in [0...constants.numSwaps] by 1
			offset = (c % blockSize) * blockSize
			n1 = Math.floor(Math.random() * blockSize) + offset
			n2 = Math.floor(Math.random() * blockSize) + offset

			for row in [0...numCells] by 1
				swap(row, n1, row, n2)

		for c in [0...constants.numSwaps] by 1
			offset = (c % blockSize) * blockSize
			n1 = Math.floor(Math.random() * blockSize) + offset
			n2 = Math.floor(Math.random() * blockSize) + offset

			for col in [0...numCells] by 1
				swap(n1, col, n2, col)		

		return grid


	###
	Generates a size x size input mask with the same dimensions as the grid
	###
	createRandomEditableMask: ->
		editableMask = []

		for i in [0...@grid.length] by 1
			if Math.random() > constants.editableProbability then val = 0 else val = 1
			if val == 1 then @grid[i] = ""	
			editableMask.push(val)
		return editableMask


	###
	Create a blank hint table, inside each cell we store an hash map (object)
	with keys as possible choices
	###
	createHintTable: ->
		hintGrid = []
		for i in [0...@grid.length] by 1
			hintMap = {}
			if @editableMask[i] == 0
				hintMap[@grid[i]] = @grid[i]
			else 
				for char in @gridChars
					hintMap[char] = char
			hintGrid.push(hintMap)
		return hintGrid

	###
	Remove all other values apart from the passed value for the cell
	Trim other cells by row, col and block
	If in the process of trimming we encounter a naked singlet
	then we add it to a queue and trim it in a another pass
	###
	trimHintTable: (row, col, index) ->
		c.log "sudoku.trimHintTable(", row, col, index, ")"
		hintGrid = @hintGrid
		editableMask = @editableMask
		len = @numCells
		size = @blockSize
		trimQueue = [{row: row, col: col, index: index}]

		removeHint = (row, col, index) =>
			hintHash = hintGrid[row][col]
			if hintHash[index]
				delete hintHash[index]
				hints = Object.keys(hintHash)
				if hints.length == 1
					c.log "orphan", row, col, hints
					trimQueue.push(row: row, col: col, index: hints[0])

			return

		processItem = (row, col, index) ->
			hintHash = hintGrid[row][col]
			if hintHash
				hintGrid[row][col] = {}
				hintGrid[row][col][index] = true

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
