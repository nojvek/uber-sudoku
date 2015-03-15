c = console

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

	randomizeNumbers()