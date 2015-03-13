c = console
gulp = require 'gulp'
gutil = require 'gulp-util'
jade = require 'gulp-jade'
coffee = require 'gulp-coffee'
stylus = require 'gulp-stylus'
sourcemaps = require 'gulp-sourcemaps'
debug = require 'gulp-debug'
livereload = require 'gulp-livereload'
staticserver = require 'st'
http = require 'http'


# tasks for languages
gulp.task 'jade', ->
	gulp.src 'src/*.jade'
	.pipe debug()
	.pipe jade(pretty: true)
	.on 'error', gutil.log
	.pipe gulp.dest 'www'
	.pipe livereload()

gulp.task 'stylus', ->
	gulp.src 'src/*.styl'
	.pipe debug()
	.pipe stylus()
	.on 'error', gutil.log
	.pipe gulp.dest 'www'
	.pipe livereload()

gulp.task 'coffee', ->
	gulp.src 'src/*.coffee'
	.pipe debug()
	.pipe coffee(bare: true)
	.on 'error', gutil.log
	.pipe gulp.dest 'www'
	.pipe livereload()


#tasks for watch, livereload and static server
gulp.task 'watch', ['server'], ->
	livereload.listen basePath: 'www', port:8081, reloadPage: "www/index.html"
	gulp.watch 'src/*', ['jade', 'coffee', 'stylus']


gulp.task 'server', (done) ->
	http.createServer(
		staticserver path: __dirname + '/www', index: 'index.html', cache: false
	).listen(8080, done);


# Default task call every tasks created so far.
gulp.task 'default', ['watch']