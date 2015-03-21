define ["jquery", "lodash", "constants", "SudokuVue" ], ($, _, constants, SudokuVue) ->

	# '$ ->' is the JQuery on ready call back. Coffeescript is neat isn't it.
	$ ->
		blockSize = constants.blockSize

		# If size url param is present then we override the block size accordingly
		parseUrlVars = ->
			queryMatch = location.search.match(/size=(\d)/)
			if queryMatch and (queryMatch[1] == "2" or queryMatch[1] == "4")
				blockSize = parseInt(queryMatch[1])

		# We add sudokuVue and sudoku to global scope for debugging purposes
		parseUrlVars()
		window.sudokuVue = SudokuVue.createSudokuVue(blockSize)
		window.sudoku = sudokuVue.sudoku


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

		$(window).on('resize', autoScaleGrid)
		requestAnimationFrame(autoScaleGrid)

