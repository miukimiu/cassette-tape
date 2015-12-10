# cassette-player

Cassete player is a html 5 music player created with SVG and manipulated with snap.svg and javascript.

You can design any svg player and you just need to give the right IDs. The javacript will find all the IDs and manipulate them.

These are the available player controls and IDs:

* #play - your play button should have this id
* #forward - your forward button should have this id
* #backward - your backward button should have this id
* #rec - your rec button should have this id

This project is in development. So, it means is not working properly.

### Install gulp and Bower

Building the player requires [node.js](http://nodejs.org/download/)

From the command line:

1. Install [gulp](http://gulpjs.com) and [Bower](http://bower.io/) globally with `npm install -g gulp bower`
2. Navigate to the theme directory, then run `npm install`
3. Run `bower install`

### Available gulp commands

* `gulp` — Compile and optimize the files in your assets directory and watch
* `gulp deploy` — Deploy build folder to gh-pages
