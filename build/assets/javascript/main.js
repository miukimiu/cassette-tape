/**
 * @ngdoc overview
 * @name cassetteApp
 * @description
 * # cassetteApp
 *
 * Main module of the application.
 */

 angular
  .module('cassetteApp', [
    'ui.router'
  ])
  .config(function($stateProvider, $urlRouterProvider) {

    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/");

    $stateProvider
    .state('index', {
      url: '/',
      templateUrl: 'views/partial-index.html',
      controller: 'CassetteController',
    });
  })
  .run(['$rootScope', '$state',function($rootScope, $state){

    $rootScope.$on('$stateChangeSuccess',function(){
      console.log('rootScope yoo');
      angular.element(document.querySelector('#wave-spinner')).remove();
    });

  }]);

/**
 * @ngdoc function
 * @name cassetteApp.controller:CassetteController
 * @description
 * # CassetteController
 * Controller of the cassetteApp
 */

angular.module('cassetteApp')
.controller('CassetteController', function($scope, $window, $http) {

  var rec = Snap('#rec'),
    xRec = false,
    backward = Snap('#backward'),
    playPause = Snap('#playPause'),
    playState = Snap('#playState'),
    pauseState = Snap('#pauseState'),
    playActive = false,
    forward = Snap('#forward'),
    wheelL = Snap('#wheel-l'),
    wheelR = Snap('#wheel-r'),
    tape = Snap('#tape'),
    tapeL = Snap('#tapeL'),
    tapeR = Snap('#tapeR'),
    logText = Snap('#recordingText tspan'),
    tracktitle = Snap('#tracktitle tspan'),
    buttonYposition = 0.679477,
    buttonYpositionActive = 8.679477,
    bboxL = tapeL.getBBox(),
    bboxR = tapeR.getBBox(),
    audio = new Audio(),
    duration = audio.duration,
    playlist = ['dirty_south_loop_85bpm', 'pop_hiphop_loop_100bpm'],
    dir = "audio/",
    ext = ".mp3",
    input,
    currentTrack = 0,
    audio_context,
    recorder,
    mic,
    soundFile;

    pauseState.attr("display", "none");

    // Audio Object
    audio.src = dir+playlist[0]+ext;

    audio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);

    audio.addEventListener("tracktitle", function(){
      titleUpdate();
    });

    // wheel animation left
    function wheelAnimationL() {
      wheelL.animate({ transform: 'r-360,30,30'}, 2000,
        function(){
            wheelL.attr({ transform: 'rotate(0 30 30)'});
            wheelAnimationL();
          }
      );
    }
    // wheel animation right
    function wheelAnimationR() {
      wheelR.animate({ transform: 'r-360,270,30'}, 2000,
        function(){
            wheelR.attr({ transform: 'rotate(0 270 30)'});
            wheelAnimationR();
          }
      );
    }

    // wheel animation left
    function tapeAnimationL() {
      tapeL.animate({ cx: '90.3893'}, 500,
        function(){
            tapeL.attr({ cx: '92.3893'});
            tapeAnimationL();
          }
      );
    }
    // wheel animation right
    function tapeAnimationR() {
      tapeR.animate({ cx: '330.389'}, 500,
        function(){
            tapeR.attr({ cx: '328.389'});
            tapeAnimationR();
          }
      );
    }

    function wheelAnimation() {
      wheelAnimationR();
      wheelAnimationL();
      tapeAnimationL();
      tapeAnimationR();
    }

    function stopWheelAnimation() {
      wheelL.stop();
      wheelR.stop();
      tapeL.stop();
      tapeR.stop();
    }

    function recStop() {
      rec.transform('t0.344053, ' + buttonYposition);
      xRec = false;
    }

    function playStop() {
        playPause.transform('t169.344053, ' + buttonYposition);
      playActive = false;
    }
    function forwardStop() {
      forward.transform('t253.344053, ' + buttonYposition);
      stopAnimation();
      XForward = false;
    }
    function nextTrack () {

      if(currentTrack == (playlist.length - 1)){
        currentTrack = 0;
      } else {
          currentTrack++;
      }

      audio.src = dir+playlist[currentTrack]+ext;

      titleUpdate();

      audio.play();
    }

    // play function
    playPause.click(function() {

      if(audio.paused) {

        // play state
        playActive = true;

        playState.attr("display", "none");
        pauseState.attr("display", "block");

        if (!xRec) { // is not recording
          wheelAnimation();
        }
        playPause.transform('t169.344053, ' + buttonYpositionActive);


        audio.play();

          //audio.play();
          titleUpdate();

        } else {

          // pause state
          playActive = false;

          pauseState.attr("display", "none");
          playState.attr("display", "block");
          audio.pause();

          if (!xRec) { // is stopped or paused
            stopWheelAnimation();
          }
          playPause.transform('t169.344053, ' + buttonYposition);
        }
    });
    // end play function

    // backward function
    backward.click(function() {

      // button anim1
      var anim1 = function() {
          backward.animate({'transform' : 't85.344053, ' + buttonYpositionActive}, 200, mina.linear, anim2);
      };

      var anim2 = function() {
          backward.animate({'transform' : 't85.344053, ' + buttonYposition}, 200);
      };

      anim1();

      if(currentTrack > 0 ) {
        currentTrack--;
      } else {
          currentTrack = (playlist.length - 1);
      }

      audio.src = dir+playlist[currentTrack]+ext;

      titleUpdate();

      if (playActive) { // if is playing
        audio.play();
      }

    });
    // end backward function

    // forward function
    forward.click(function() {

      // button anim1
      var anim1 = function() {
          forward.animate({'transform' : 't253.344053, ' + buttonYpositionActive}, 200, mina.linear, anim2);
      };

      var anim2 = function() {
          forward.animate({'transform' : 't253.344053, ' + buttonYposition}, 200);
      };

      anim1();

      if(currentTrack == (playlist.length - 1)){
        currentTrack = 0;
      } else {
        currentTrack++;
      }

      audio.src = dir+playlist[currentTrack]+ext;

      titleUpdate();

      if (playActive) { // if is playing
        audio.play();
      }
    });
    // end forward function

    function titleUpdate(){
      tracktitle.node.innerHTML = playlist[currentTrack];
    }

    // ******** Recorder ******* //
    function __log(e, data) {
      logText.node.innerHTML = "\n" + e + " " + (data || '');
    }

    function startUserMedia(stream) {
      var input = audio_context.createMediaStreamSource(stream);
      console.log('Media stream created.');

      recorder = new Recorder(input);
      __log('Ready!');
    }

    // rec function
    rec.click(function(ok) {

      if (!xRec){ //is not recording

        rec.transform('t0.344053, ' + buttonYpositionActive);

        if (!playActive) { // is stopped or paused
          wheelAnimation();
        }

        xRec = true;

        recorder && recorder.record();

        __log('Recording...');

      }  else { //stop recording

        recStop();

        if (!playActive) { // is stopped or paused

          stopWheelAnimation();
        }

        recorder && recorder.stop();

        __log('Stopped rec.');

        // create WAV download link using audio data blob
        createDownloadLink();

        recorder.clear();
      }
    });
    // end rec function

    function createDownloadLink() {
      recorder && recorder.exportWAV(function(blob) {
        var url = URL.createObjectURL(blob);
        var li = document.createElement('li');
        var au = document.createElement('audio');
        var hf = document.createElement('a');


        au.controls = true;
        au.src = url;
        hf.href = url;
        hf.download = new Date().toISOString() + '.wav';
        hf.innerHTML = hf.download;

        var trackURL = hf.download;

        var recordingElement = angular.element('<li class="mdl-list__item"><span class="mdl-list__item-primary-content" ><i class="material-icons mdl-list__item-icon">mic</i>' + trackURL + '</span><span class="mdl-list__item-secondary-action"><a class="mdl-button mdl-js-button mdl-button--accent" href="' + url + '"" download>Download <i class="material-icons">file_download</i></a></span></li>');

        angular.element(document.querySelector('#recordingslist')).append(recordingElement);
      });
    }

    var sketch = function(noiseWave) {

      var url,
    		myCanvas,
    		counter = 0,
    		startingAngle=7,
    		goRight = true,
    		startUp = true,
    		myFrameRate = 30,
    		running = true;

      noiseWave.setup = function() {

        myCanvas = noiseWave.createCanvas(screen.width, 500);
        myCanvas.parent('cassete-player-ct');

        // Create an Audio input
        mic = new p5.AudioIn();

        // start the Audio Input.
        mic.start();

        // create a sound recorder
        recorder = new p5.SoundRecorder();

        // connect the mic to the recorder
        recorder.setInput(mic);

        // create an empty sound file that we will use to playback the recording
        soundFile = new p5.SoundFile();
      };

      noiseWave.draw = function() {

        var yoff = 0.0;
        // Get the overall volume (between 0 and 1.0)
        var vol = mic.getLevel();

        noiseWave.background(255, 255, 255);
        noiseWave.stroke(25, 202, 144);
        noiseWave.fill(25, 202, 144);

        // We are going to draw a polygon out of the wave points
        noiseWave.beginShape();

        var xoff = 0;       // Option #1: 2D Noise

        // Iterate over horizontal pixels
        for (var x = 0; x <= screen.width; x += 10) {
          // Calculate a y value according to noise, map to

          //map(value,start1,stop1,start2,stop2)
          var y = noiseWave.map(noiseWave.noise(xoff, yoff), 0, 1, 200,300);

          // Set the vertex
          noiseWave.vertex(x, y);
          // Increment x dimension for noise
          xoff += vol;
        }
        // increment y dimension for noise
        yoff += vol;
        noiseWave.vertex(screen.width, screen.height);
        noiseWave.vertex(0, screen.height);
        noiseWave.endShape(noiseWave.CLOSE);
      };

    };// var sketch

    var myP5 = new p5(sketch);

    // export recorded wav
    try {
      // webkit shim
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia); //this will set navigator.getUserMedia to whatever it detects to be the proper prefixed version.
      window.URL = window.URL || window.webkitURL;

      audio_context = new AudioContext;
      //console.log(('Audio context set up.');
      //console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
      __log('Just work on chrome!');
    }

    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
      __log('No live audio input: ' + e);
    });

});


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhc3NldHRlQ29udHJvbGxlci5qcyIsIm1haW4tcmVjb3JkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25aQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmdkb2Mgb3ZlcnZpZXdcbiAqIEBuYW1lIGNhc3NldHRlQXBwXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgY2Fzc2V0dGVBcHBcbiAqXG4gKiBNYWluIG1vZHVsZSBvZiB0aGUgYXBwbGljYXRpb24uXG4gKi9cblxuIGFuZ3VsYXJcbiAgLm1vZHVsZSgnY2Fzc2V0dGVBcHAnLCBbXG4gICAgJ3VpLnJvdXRlcidcbiAgXSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAvLyBGb3IgYW55IHVubWF0Y2hlZCB1cmwsIHJlZGlyZWN0IHRvIC9zdGF0ZTFcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwiL1wiKTtcblxuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdpbmRleCcsIHtcbiAgICAgIHVybDogJy8nLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9wYXJ0aWFsLWluZGV4Lmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ0Nhc3NldHRlQ29udHJvbGxlcicsXG4gICAgfSk7XG4gIH0pXG4gIC5ydW4oWyckcm9vdFNjb3BlJywgJyRzdGF0ZScsZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlKXtcblxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJyxmdW5jdGlvbigpe1xuICAgICAgY29uc29sZS5sb2coJ3Jvb3RTY29wZSB5b28nKTtcbiAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd2F2ZS1zcGlubmVyJykpLnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gIH1dKTtcbiIsIi8qKlxuICogQG5nZG9jIGZ1bmN0aW9uXG4gKiBAbmFtZSBjYXNzZXR0ZUFwcC5jb250cm9sbGVyOkNhc3NldHRlQ29udHJvbGxlclxuICogQGRlc2NyaXB0aW9uXG4gKiAjIENhc3NldHRlQ29udHJvbGxlclxuICogQ29udHJvbGxlciBvZiB0aGUgY2Fzc2V0dGVBcHBcbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSgnY2Fzc2V0dGVBcHAnKVxuLmNvbnRyb2xsZXIoJ0Nhc3NldHRlQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHdpbmRvdywgJGh0dHApIHtcblxuICB2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuICAgIHhSZWMgPSBmYWxzZSxcbiAgICBiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuICAgIHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcbiAgICBwbGF5U3RhdGUgPSBTbmFwKCcjcGxheVN0YXRlJyksXG4gICAgcGF1c2VTdGF0ZSA9IFNuYXAoJyNwYXVzZVN0YXRlJyksXG4gICAgcGxheUFjdGl2ZSA9IGZhbHNlLFxuICAgIGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuICAgIHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG4gICAgd2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcbiAgICB0YXBlID0gU25hcCgnI3RhcGUnKSxcbiAgICB0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuICAgIHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG4gICAgbG9nVGV4dCA9IFNuYXAoJyNyZWNvcmRpbmdUZXh0IHRzcGFuJyksXG4gICAgdHJhY2t0aXRsZSA9IFNuYXAoJyN0cmFja3RpdGxlIHRzcGFuJyksXG4gICAgYnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG4gICAgYnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG4gICAgYmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG4gICAgYmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG4gICAgYXVkaW8gPSBuZXcgQXVkaW8oKSxcbiAgICBkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuICAgIHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcbiAgICBkaXIgPSBcImF1ZGlvL1wiLFxuICAgIGV4dCA9IFwiLm1wM1wiLFxuICAgIGlucHV0LFxuICAgIGN1cnJlbnRUcmFjayA9IDAsXG4gICAgYXVkaW9fY29udGV4dCxcbiAgICByZWNvcmRlcixcbiAgICBtaWMsXG4gICAgc291bmRGaWxlO1xuXG4gICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cbiAgICAvLyBBdWRpbyBPYmplY3RcbiAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY3VycmVudFRpbWUgPSAwO1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfSwgZmFsc2UpO1xuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXtcbiAgICAgIHRpdGxlVXBkYXRlKCk7XG4gICAgfSk7XG5cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcbiAgICAgIHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuICAgICAgICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuICAgICAgd2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uTCgpIHtcbiAgICAgIHRhcGVMLmFuaW1hdGUoeyBjeDogJzkwLjM4OTMnfSwgNTAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGFwZUwuYXR0cih7IGN4OiAnOTIuMzg5Myd9KTtcbiAgICAgICAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvblIoKSB7XG4gICAgICB0YXBlUi5hbmltYXRlKHsgY3g6ICczMzAuMzg5J30sIDUwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRhcGVSLmF0dHIoeyBjeDogJzMyOC4zODknfSk7XG4gICAgICAgICAgICB0YXBlQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG4gICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgIHdoZWVsQW5pbWF0aW9uTCgpO1xuICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgd2hlZWxMLnN0b3AoKTtcbiAgICAgIHdoZWVsUi5zdG9wKCk7XG4gICAgICB0YXBlTC5zdG9wKCk7XG4gICAgICB0YXBlUi5zdG9wKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVjU3RvcCgpIHtcbiAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICB4UmVjID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGxheVN0b3AoKSB7XG4gICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHBsYXlBY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG4gICAgICBmb3J3YXJkLnRyYW5zZm9ybSgndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgc3RvcEFuaW1hdGlvbigpO1xuICAgICAgWEZvcndhcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjaysrO1xuICAgICAgfVxuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBwbGF5IGZ1bmN0aW9uXG4gICAgcGxheVBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZihhdWRpby5wYXVzZWQpIHtcblxuICAgICAgICAvLyBwbGF5IHN0YXRlXG4gICAgICAgIHBsYXlBY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuICAgICAgICBpZiAoIXhSZWMpIHsgLy8gaXMgbm90IHJlY29yZGluZ1xuICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cbiAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgICAgLy9hdWRpby5wbGF5KCk7XG4gICAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgLy8gcGF1c2Ugc3RhdGVcbiAgICAgICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgICBwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcbiAgICAgICAgICBhdWRpby5wYXVzZSgpO1xuXG4gICAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgICBzdG9wV2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIHBsYXkgZnVuY3Rpb25cblxuICAgIC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG4gICAgYmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgdmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgfTtcblxuICAgICAgYW5pbTEoKTtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID4gMCApIHtcbiAgICAgICAgY3VycmVudFRyYWNrLS07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjayA9IChwbGF5bGlzdC5sZW5ndGggLSAxKTtcbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cblxuICAgIH0pO1xuICAgIC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXG4gICAgLy8gZm9yd2FyZCBmdW5jdGlvblxuICAgIGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgdmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgfTtcblxuICAgICAgYW5pbTEoKTtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG4gICAgZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcbiAgICAgIHRyYWNrdGl0bGUubm9kZS5pbm5lckhUTUwgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cbiAgICBmdW5jdGlvbiBfX2xvZyhlLCBkYXRhKSB7XG4gICAgICBsb2dUZXh0Lm5vZGUuaW5uZXJIVE1MID0gXCJcXG5cIiArIGUgKyBcIiBcIiArIChkYXRhIHx8ICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydFVzZXJNZWRpYShzdHJlYW0pIHtcbiAgICAgIHZhciBpbnB1dCA9IGF1ZGlvX2NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgICAgIGNvbnNvbGUubG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcblxuICAgICAgcmVjb3JkZXIgPSBuZXcgUmVjb3JkZXIoaW5wdXQpO1xuICAgICAgX19sb2coJ1JlYWR5IScpO1xuICAgIH1cblxuICAgIC8vIHJlYyBmdW5jdGlvblxuICAgIHJlYy5jbGljayhmdW5jdGlvbihvaykge1xuXG4gICAgICBpZiAoIXhSZWMpeyAvL2lzIG5vdCByZWNvcmRpbmdcblxuICAgICAgICByZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG4gICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICB4UmVjID0gdHJ1ZTtcblxuICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5yZWNvcmQoKTtcblxuICAgICAgICBfX2xvZygnUmVjb3JkaW5nLi4uJyk7XG5cbiAgICAgIH0gIGVsc2UgeyAvL3N0b3AgcmVjb3JkaW5nXG5cbiAgICAgICAgcmVjU3RvcCgpO1xuXG4gICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG4gICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5zdG9wKCk7XG5cbiAgICAgICAgX19sb2coJ1N0b3BwZWQgcmVjLicpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBXQVYgZG93bmxvYWQgbGluayB1c2luZyBhdWRpbyBkYXRhIGJsb2JcbiAgICAgICAgY3JlYXRlRG93bmxvYWRMaW5rKCk7XG5cbiAgICAgICAgcmVjb3JkZXIuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEb3dubG9hZExpbmsoKSB7XG4gICAgICByZWNvcmRlciAmJiByZWNvcmRlci5leHBvcnRXQVYoZnVuY3Rpb24oYmxvYikge1xuICAgICAgICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgdmFyIGF1ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcbiAgICAgICAgdmFyIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG5cbiAgICAgICAgYXUuY29udHJvbHMgPSB0cnVlO1xuICAgICAgICBhdS5zcmMgPSB1cmw7XG4gICAgICAgIGhmLmhyZWYgPSB1cmw7XG4gICAgICAgIGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuICAgICAgICBoZi5pbm5lckhUTUwgPSBoZi5kb3dubG9hZDtcblxuICAgICAgICB2YXIgdHJhY2tVUkwgPSBoZi5kb3dubG9hZDtcblxuICAgICAgICB2YXIgcmVjb3JkaW5nRWxlbWVudCA9IGFuZ3VsYXIuZWxlbWVudCgnPGxpIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW1cIj48c3BhbiBjbGFzcz1cIm1kbC1saXN0X19pdGVtLXByaW1hcnktY29udGVudFwiID48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zIG1kbC1saXN0X19pdGVtLWljb25cIj5taWM8L2k+JyArIHRyYWNrVVJMICsgJzwvc3Bhbj48c3BhbiBjbGFzcz1cIm1kbC1saXN0X19pdGVtLXNlY29uZGFyeS1hY3Rpb25cIj48YSBjbGFzcz1cIm1kbC1idXR0b24gbWRsLWpzLWJ1dHRvbiBtZGwtYnV0dG9uLS1hY2NlbnRcIiBocmVmPVwiJyArIHVybCArICdcIlwiIGRvd25sb2FkPkRvd25sb2FkIDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5maWxlX2Rvd25sb2FkPC9pPjwvYT48L3NwYW4+PC9saT4nKTtcblxuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JlY29yZGluZ3NsaXN0JykpLmFwcGVuZChyZWNvcmRpbmdFbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBza2V0Y2ggPSBmdW5jdGlvbihub2lzZVdhdmUpIHtcblxuICAgICAgdmFyIHVybCxcbiAgICBcdFx0bXlDYW52YXMsXG4gICAgXHRcdGNvdW50ZXIgPSAwLFxuICAgIFx0XHRzdGFydGluZ0FuZ2xlPTcsXG4gICAgXHRcdGdvUmlnaHQgPSB0cnVlLFxuICAgIFx0XHRzdGFydFVwID0gdHJ1ZSxcbiAgICBcdFx0bXlGcmFtZVJhdGUgPSAzMCxcbiAgICBcdFx0cnVubmluZyA9IHRydWU7XG5cbiAgICAgIG5vaXNlV2F2ZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIG15Q2FudmFzID0gbm9pc2VXYXZlLmNyZWF0ZUNhbnZhcyhzY3JlZW4ud2lkdGgsIDUwMCk7XG4gICAgICAgIG15Q2FudmFzLnBhcmVudCgnY2Fzc2V0ZS1wbGF5ZXItY3QnKTtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gQXVkaW8gaW5wdXRcbiAgICAgICAgbWljID0gbmV3IHA1LkF1ZGlvSW4oKTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgQXVkaW8gSW5wdXQuXG4gICAgICAgIG1pYy5zdGFydCgpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIHNvdW5kIHJlY29yZGVyXG4gICAgICAgIHJlY29yZGVyID0gbmV3IHA1LlNvdW5kUmVjb3JkZXIoKTtcblxuICAgICAgICAvLyBjb25uZWN0IHRoZSBtaWMgdG8gdGhlIHJlY29yZGVyXG4gICAgICAgIHJlY29yZGVyLnNldElucHV0KG1pYyk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGVtcHR5IHNvdW5kIGZpbGUgdGhhdCB3ZSB3aWxsIHVzZSB0byBwbGF5YmFjayB0aGUgcmVjb3JkaW5nXG4gICAgICAgIHNvdW5kRmlsZSA9IG5ldyBwNS5Tb3VuZEZpbGUoKTtcbiAgICAgIH07XG5cbiAgICAgIG5vaXNlV2F2ZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIHlvZmYgPSAwLjA7XG4gICAgICAgIC8vIEdldCB0aGUgb3ZlcmFsbCB2b2x1bWUgKGJldHdlZW4gMCBhbmQgMS4wKVxuICAgICAgICB2YXIgdm9sID0gbWljLmdldExldmVsKCk7XG5cbiAgICAgICAgbm9pc2VXYXZlLmJhY2tncm91bmQoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIG5vaXNlV2F2ZS5zdHJva2UoMjUsIDIwMiwgMTQ0KTtcbiAgICAgICAgbm9pc2VXYXZlLmZpbGwoMjUsIDIwMiwgMTQ0KTtcblxuICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gZHJhdyBhIHBvbHlnb24gb3V0IG9mIHRoZSB3YXZlIHBvaW50c1xuICAgICAgICBub2lzZVdhdmUuYmVnaW5TaGFwZSgpO1xuXG4gICAgICAgIHZhciB4b2ZmID0gMDsgICAgICAgLy8gT3B0aW9uICMxOiAyRCBOb2lzZVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgb3ZlciBob3Jpem9udGFsIHBpeGVsc1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8PSBzY3JlZW4ud2lkdGg7IHggKz0gMTApIHtcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgYSB5IHZhbHVlIGFjY29yZGluZyB0byBub2lzZSwgbWFwIHRvXG5cbiAgICAgICAgICAvL21hcCh2YWx1ZSxzdGFydDEsc3RvcDEsc3RhcnQyLHN0b3AyKVxuICAgICAgICAgIHZhciB5ID0gbm9pc2VXYXZlLm1hcChub2lzZVdhdmUubm9pc2UoeG9mZiwgeW9mZiksIDAsIDEsIDIwMCwzMDApO1xuXG4gICAgICAgICAgLy8gU2V0IHRoZSB2ZXJ0ZXhcbiAgICAgICAgICBub2lzZVdhdmUudmVydGV4KHgsIHkpO1xuICAgICAgICAgIC8vIEluY3JlbWVudCB4IGRpbWVuc2lvbiBmb3Igbm9pc2VcbiAgICAgICAgICB4b2ZmICs9IHZvbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbmNyZW1lbnQgeSBkaW1lbnNpb24gZm9yIG5vaXNlXG4gICAgICAgIHlvZmYgKz0gdm9sO1xuICAgICAgICBub2lzZVdhdmUudmVydGV4KHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCk7XG4gICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoMCwgc2NyZWVuLmhlaWdodCk7XG4gICAgICAgIG5vaXNlV2F2ZS5lbmRTaGFwZShub2lzZVdhdmUuQ0xPU0UpO1xuICAgICAgfTtcblxuICAgIH07Ly8gdmFyIHNrZXRjaFxuXG4gICAgdmFyIG15UDUgPSBuZXcgcDUoc2tldGNoKTtcblxuICAgIC8vIGV4cG9ydCByZWNvcmRlZCB3YXZcbiAgICB0cnkge1xuICAgICAgLy8gd2Via2l0IHNoaW1cbiAgICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYSk7IC8vdGhpcyB3aWxsIHNldCBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHRvIHdoYXRldmVyIGl0IGRldGVjdHMgdG8gYmUgdGhlIHByb3BlciBwcmVmaXhlZCB2ZXJzaW9uLlxuICAgICAgd2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcblxuICAgICAgYXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG4gICAgICAvL2NvbnNvbGUubG9nKCgnQXVkaW8gY29udGV4dCBzZXQgdXAuJyk7XG4gICAgICAvL2NvbnNvbGUubG9nKCduYXZpZ2F0b3IuZ2V0VXNlck1lZGlhICcgKyAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSA/ICdhdmFpbGFibGUuJyA6ICdub3QgcHJlc2VudCEnKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgX19sb2coJ0p1c3Qgd29yayBvbiBjaHJvbWUhJyk7XG4gICAgfVxuXG4gICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuICAgICAgX19sb2coJ05vIGxpdmUgYXVkaW8gaW5wdXQ6ICcgKyBlKTtcbiAgICB9KTtcblxufSk7XG4iLCIiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=