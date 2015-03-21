define ["jquery", "lodash", "vue", "constants", "SudokuGrid"], ($, _, Vue, constants, SudokuGrid) ->

	# We are using a small library called vue that handles the view model binding.
	# We could have done it all with jquery but that would involve too much spagetti code.
	# Vue works really well with coffeescript and jade syntax. Very elegant and descriptive.
	createSudokuVue: (gridSize) ->
		sudokuVue =  new Vue
			el: "#sudoku-container"
			data:
				showHints: false
				sudoku: new SudokuGrid(gridSize)
				selectedIndex: null
				gameOver: false

			methods:
				loop: (size) -> _.range(0, size * size)

				toIndex: (numBlock, numCell) ->
					size = gridSize
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
						if frameCounter < constants.numNewGameAnimFrames
							requestAnimationFrame(renderFrame)
						else
							# On last frame add original innerText
							elem.innerText = innerTexts[i] for elem, i in $cellValues

					requestAnimationFrame(renderFrame)

		sudokuVue.newGame()
		return sudokuVue