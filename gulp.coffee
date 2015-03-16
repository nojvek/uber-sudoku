c = console
gulp = require 'gulp'
gutil = require 'gulp-util'
jade = require 'gulp-jade'
coffee = require 'gulp-coffee'
stylus = require 'gulp-stylus'
nib = require 'nib'
sourcemaps = require 'gulp-sourcemaps'
debug = require 'gulp-debug'
express = require 'express'
livereload = require 'gulp-livereload'
connectLr = require 'connect-livereload'
exec = require('child_process').exec

###
	Build Settings should mostly work as they are
###
serverPort = 8080
buildDir = "dist"
srcDir = "src"


###
	We'd like to setup an environment where all our src files are watched
	and transpiled immedately on file save. Not only that but the browser
	is hot loaded with the latest code as we are making changes. 

	TODO: Run jasmine tests everytime any js files are modified.
###
gulp.task 'jade', ->
	gulp.src 'src/*.jade'
	.pipe jade(pretty: true)
	.on 'error', gutil.log
	.pipe gulp.dest buildDir

gulp.task 'styl', ->
	gulp.src 'src/*.styl'
	.pipe stylus(use: nib())
	.on 'error', gutil.log
	.pipe gulp.dest buildDir

gulp.task 'coffee', ->
	gulp.src 'src/*.coffee'
	.pipe coffee(bare: true)
	.on 'error', gutil.log
	.pipe gulp.dest buildDir

gulp.task 'assets', ->
	gulp.src 'src/assets/*'
	.pipe gulp.dest buildDir + "/assets"


###
	'You press a button and we do the rest'
###
gulp.task 'server',  ->
	app = express()
	app.use connectLr()
	app.use express.static __dirname + '/' + buildDir
	app.listen serverPort

gulp.task 'watch', ['server'], ->
	gulp.watch 'src/*.jade', ['jade']
	gulp.watch 'src/*.coffee', ['coffee']
	gulp.watch 'src/*.styl', ['styl']
	gulp.watch 'src/assets/*', ['assets']
	gulp.watch(buildDir + '/*').on('change', (e) -> livereload.changed(e.path))
	livereload.listen()

gulp.task 'gh-pages', ->
	logger = (err, stdout, stderr) ->
		gutil.log stdout if stdout
		gutil.log stderr if stderr

	exec "git subtree push --prefix dist dist gh-pages", logger

###
	Running "gulp" in command line will automatically setup src watching + live reload

	Running "gulp build" will build into the dist folder.
	
	Running "gulp deploy" will build and commit into the gh-pages branch.
		The site will be accessible at https://username.github.io/uber-sudoku
		Thanks to: http://spin.atomicobject.com/2014/03/28/deploy-git-subtrees/

	TODO: Add test runner in build code.
###

gulp.task 'build', ['jade', 'coffee', 'styl', 'assets']
gulp.task 'deploy', ['build', 'gh-pages']
gulp.task 'default', ['build', 'watch']