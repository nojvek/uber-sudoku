# Uber Sudoku Challenge

This is my attempt at the Uber programming challenge. 

### Features
 * It looks beautiful, I spent quite a lot of time tweaking the CSS. At one point I had a dynamically blurred background but it was too slow on mobile devices, so I had to revert.
 * Auto scale to viewport. Renders great on my iphone, ipad and desktop. 
 * Dynamic grids. With url param, user can play 2x2, 3x3 or 4x4 sudoku. 4x4 with hints is quite fun.
 * Beautiful macro-blur background on the background. Leaf is visible on landscape orientation. Thanks to [www.desktoplounge.com](www.desktoplounge.com)
 * Tiny numbers are shown in the cells when "Show hints" is pressed.
 * Input are at the bottom show what values are possible. I wanted to make something that augments the user. No one likes red error boxes. 
 * When a new grid is generated, we run a little one second animation.
 * My friends think I should actually turn it into an app. They love it. There are some bugs that they've complained about that I'll resolve soon.

### Technologies
 * I used indentation languages such as **jade**, **stylus** and **coffeescript** for my html, css and javascript. With stylus mixins, I have pre-generated grids for 2x2x2, 3x3x3 and 4x4x4. Coffee is my favourite language to prototype with. Its very expressive.
 * **Jquery** and **Underscore**. I consider them standard web libs for most of my projects. 
 * **Vuejs**. I understand Uber asked me to refrain me from Backbone and similar libs. However I didn't want to write spaghetti view management code. I quite like vuejs for its simplicity and how it handles the view data binding. With coffeescript the code looks very elegant.
 * **Gulp**. The build system is quite magical. Running "gulp" fires up a tiny express server with live-reload. Any time a src file is changed, the files are automatically pre-processed and the browser is hot-loaded with the latest code within milli-seconds. I've used "gulp deploy" automatically update the gh-pages branch to master. the dist folder is setup is as an external-repo. I love how fast it is.

### What can be improved?
 * Tests. I was planning to use jasmine and integrate the tests with watch task, however I didn't get enough time.
 * Finish game animation. I wanted to use a css-3d animation makes the cells dance when complete. 
 * I could probably improve the initial loading perf and make it offline capable.
 * I've been wanting to try sharejs. Multiplayer would make it social.

### screenshots

Desktop

![](assets/screenshots/desktop.jpg?raw=true)

iPhone

![](assets/screenshots/iphone.jpg?raw=true)

iPad

![](assets/screenshots/ipad.jpg?raw=true)