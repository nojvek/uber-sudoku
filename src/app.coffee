# Storing some variables in global access for easy debugging
sudokuVue = null
sudoku = null

# We define the app constants in an object rather than having them in global scope
constants =
	blockSize: 3
	numSwaps: 10
	numAnimFrames: 30
	editableProbability: 0.4


# '$ ->' is the Jquery on ready call back. Coffeescript is neat isn't it.
$ ->
	# If size url param is present then we change the block size accordingly
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
	parseUrlVars()
	sudokuVue = createSudokuVue()
	sudoku = sudokuVue.sudoku #for debugging

	$(window).on('resize', autoScaleGrid)
	requestAnimationFrame(autoScaleGrid)


# We are using a small library called vue that handles the view model binding.
# We could have done it all with jquery but that would involve too spagetti code.
# Vue works really well with coffeescript and jade syntax.
# Uber said not to use backbone, so I'm iffy whether they'll approve of this.
# I think its very simple, elegant and descriptive code.
createSudokuVue = ->
	sudokuVue =  new Vue
		el: "#sudoku-container"
		data:
			showHints: false
			sudoku: new SudokuGrid(constants.blockSize)
			selectedIndex: null
			gameOver: false

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
				@sudoku.newGame()
				@selectedIndex = null
				@showHints = false
				@gameOver = false
				requestAnimationFrame(@animateShuffle)

			onCellClick: (index) ->
				if sudoku.editableMask[index]
					@selectedIndex = index

			onInputClick: (val) ->
				if @selectedIndex != null
					@sudoku.grid.$set(@selectedIndex, val)
					@sudoku.updateHintGrid()
					@gameOver = @sudoku.isGridFilled()
					if @gameOver then @selectedIndex = null

			# Do a fast fake animation when newGame is generated
			animateShuffle: ->
				$cellValues = $(".cell > .cell-value")
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
						elem.innerText = innerTexts[i] for elem, i in $cellValues

				requestAnimationFrame(renderFrame)

	sudokuVue.newGame()
	return sudokuVue

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

		switch blockSize
			when 2
				@gridChars = (i.toString() for i in [1 .. 4] by 1)
			when 3
				@gridChars = (i.toString() for i in [1 .. 9] by 1)
			when 4
				charA = 97
				charF = charA + 5
				@gridChars = (i.toString() for i in [0 .. 9] by 1)
				@gridChars = @gridChars.concat (String.fromCharCode(i) for i in [charA .. charF] by 1)
		
		@blockSize = blockSize
		@numCells = blockSize * blockSize
		@grid = @createIdentityGrid()
		@editableMask = []
		@hintGrid = @createHintGrid()


	###
	Create a new sudoku layout
	###
	newGame: ->
		@grid = @createIdentityGrid()
		@randomizeGrid()
		@editableMask = @createRandomEditableMask()
		@updateHintGrid()


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


	###
	Algorithm based on http://blog.forret.com/2006/08/a-sudoku-challenge-generator/
	We do an substitute replace, swap between blocks, cols and rows
	###
	randomizeGrid: ->
		grid = @grid
		shuffledGridChars = _.shuffle(@gridChars)
		replaceMap = _.object(@gridChars, shuffledGridChars)
		blockSize = @blockSize
		numCells = @numCells

		# Think of this like an enigma cipher. 
		# We substitute one character with another
		grid[i] = replaceMap[grid[i]] for i in [0...@grid.length] by 1

		# We swap between blocks, rows and cols
		swap = (row1, col1, row2, col2) ->
			temp = grid[row1 * numCells + col1]
			grid[row1 * numCells + col1] = grid[row2 * numCells + col2]
			grid[row2 * numCells + col2] = temp

		for c in [0...constants.numSwaps] by 1
			offset = c % blockSize
			n1 = Math.floor(Math.random() * blockSize) * blockSize + offset
			n2 = Math.floor(Math.random() * blockSize) * blockSize + offset
			swap(row, n1, row, n2) for row in [0...numCells] by 1

		for c in [0...constants.numSwaps] by 1
			offset = (c % blockSize) * blockSize
			n1 = Math.floor(Math.random() * blockSize) + offset
			n2 = Math.floor(Math.random() * blockSize) + offset
			swap(row, n1, row, n2) for row in [0...numCells] by 1
				
		for c in [0...constants.numSwaps] by 1
			offset = (c % blockSize) * blockSize
			n1 = Math.floor(Math.random() * blockSize) + offset
			n2 = Math.floor(Math.random() * blockSize) + offset
			swap(n1, col, n2, col) for col in [0...numCells] by 1		

		@logGrid(grid) 
		return grid


	###
	Log the grid to console before we mask the editables
	###
	logGrid: (grid) ->
		str = ""
		for i in [0...grid.length] by 1
			if i > 0
				if i % @blockSize == 0 then str += "  "
				if i % @numCells == 0
					str += "\n"
					if Math.floor(i / @numCells) % @blockSize == 0 then str += "\n"

			str += grid[i] + " "

		console.log "Correct Solution:"
		console.log str


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
	with keys as possible choices. For cells that have vva
	###
	createHintGrid: ->
		hintGrid = []
		for i in [0...@grid.length] by 1
			hintMap = {}
			hintMap[char] = char for char in @gridChars
			hintGrid.push(hintMap)
		return hintGrid


	###
	For every blank cell in the grid we update the possible values it can have
	We search through the column, row and block. Standard sudoku validation
	If there is a dead lock then the user will see a cell with no hints
	In that case he has to undo the most recent selection and chose another hint 
	###
	updateHintGrid: ->
		hintGrid = @hintGrid
		blockSize = @blockSize
		grid = @grid
		numCells = @numCells

		scanCell = (row, col) =>
			results = {}
			for i in [0...numCells] by 1
				results[grid[row * numCells + i]] = true

			for i in [0...numCells] by 1
				results[grid[i * numCells + col]] = true

			blockRow = Math.floor(row / blockSize) * blockSize
			blockCol = Math.floor(col / blockSize) * blockSize

			for i in [0...blockSize] by 1
				for j in [0...blockSize] by 1
					results[grid[(i + blockRow) * numCells + j + blockCol]] = true

			return results

		for i in [0...hintGrid.length] by 1
			hintMap = hintGrid[i]

			# if cell has value then only that value is present as hint
			if @editableMask[i] == 1
				present = scanCell(Math.floor(i / numCells), i % numCells)
				for char in @gridChars
					hintMap[char] = if present[char] then "" else char

		return hintGrid

	###
	Used for checking whether the game is finished.
	If all cells in grid are filled then it returns true, otherwise false
	###
	isGridFilled: ->
		return _.filter(@grid, (val) -> val == "").length == 0
