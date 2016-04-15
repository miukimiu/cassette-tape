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
      //angular.element(document.querySelector('#wave-spinner')).remove();
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

    window.onload = function init() {
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
    };

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

});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhc3NldHRlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQG5nZG9jIG92ZXJ2aWV3XG4gKiBAbmFtZSBjYXNzZXR0ZUFwcFxuICogQGRlc2NyaXB0aW9uXG4gKiAjIGNhc3NldHRlQXBwXG4gKlxuICogTWFpbiBtb2R1bGUgb2YgdGhlIGFwcGxpY2F0aW9uLlxuICovXG5cbiBhbmd1bGFyXG4gIC5tb2R1bGUoJ2Nhc3NldHRlQXBwJywgW1xuICAgICd1aS5yb3V0ZXInXG4gIF0pXG4gIC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgLy8gRm9yIGFueSB1bm1hdGNoZWQgdXJsLCByZWRpcmVjdCB0byAvc3RhdGUxXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZShcIi9cIik7XG5cbiAgICAkc3RhdGVQcm92aWRlclxuICAgIC5zdGF0ZSgnaW5kZXgnLCB7XG4gICAgICB1cmw6ICcvJyxcbiAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvcGFydGlhbC1pbmRleC5odG1sJyxcbiAgICAgIGNvbnRyb2xsZXI6ICdDYXNzZXR0ZUNvbnRyb2xsZXInLFxuICAgIH0pO1xuICB9KVxuICAucnVuKFsnJHJvb3RTY29wZScsICckc3RhdGUnLGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZSl7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsZnVuY3Rpb24oKXtcbiAgICAgIGNvbnNvbGUubG9nKCdyb290U2NvcGUgeW9vJyk7XG4gICAgICAvL2FuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjd2F2ZS1zcGlubmVyJykpLnJlbW92ZSgpO1xuICAgIH0pO1xuXG4gIH1dKTtcbiIsIi8qKlxuICogQG5nZG9jIGZ1bmN0aW9uXG4gKiBAbmFtZSBjYXNzZXR0ZUFwcC5jb250cm9sbGVyOkNhc3NldHRlQ29udHJvbGxlclxuICogQGRlc2NyaXB0aW9uXG4gKiAjIENhc3NldHRlQ29udHJvbGxlclxuICogQ29udHJvbGxlciBvZiB0aGUgY2Fzc2V0dGVBcHBcbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSgnY2Fzc2V0dGVBcHAnKVxuLmNvbnRyb2xsZXIoJ0Nhc3NldHRlQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHdpbmRvdywgJGh0dHApIHtcblxuICB2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuICAgIHhSZWMgPSBmYWxzZSxcbiAgICBiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuICAgIHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcbiAgICBwbGF5U3RhdGUgPSBTbmFwKCcjcGxheVN0YXRlJyksXG4gICAgcGF1c2VTdGF0ZSA9IFNuYXAoJyNwYXVzZVN0YXRlJyksXG4gICAgcGxheUFjdGl2ZSA9IGZhbHNlLFxuICAgIGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuICAgIHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG4gICAgd2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcbiAgICB0YXBlID0gU25hcCgnI3RhcGUnKSxcbiAgICB0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuICAgIHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG4gICAgbG9nVGV4dCA9IFNuYXAoJyNyZWNvcmRpbmdUZXh0IHRzcGFuJyksXG4gICAgdHJhY2t0aXRsZSA9IFNuYXAoJyN0cmFja3RpdGxlIHRzcGFuJyksXG4gICAgYnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG4gICAgYnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG4gICAgYmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG4gICAgYmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG4gICAgYXVkaW8gPSBuZXcgQXVkaW8oKSxcbiAgICBkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuICAgIHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcbiAgICBkaXIgPSBcImF1ZGlvL1wiLFxuICAgIGV4dCA9IFwiLm1wM1wiLFxuICAgIGlucHV0LFxuICAgIGN1cnJlbnRUcmFjayA9IDAsXG4gICAgYXVkaW9fY29udGV4dCxcbiAgICByZWNvcmRlcixcbiAgICBtaWMsXG4gICAgc291bmRGaWxlO1xuXG4gICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cbiAgICAvLyBBdWRpbyBPYmplY3RcbiAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY3VycmVudFRpbWUgPSAwO1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfSwgZmFsc2UpO1xuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXtcbiAgICAgIHRpdGxlVXBkYXRlKCk7XG4gICAgfSk7XG5cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcbiAgICAgIHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuICAgICAgICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuICAgICAgd2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uTCgpIHtcbiAgICAgIHRhcGVMLmFuaW1hdGUoeyBjeDogJzkwLjM4OTMnfSwgNTAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGFwZUwuYXR0cih7IGN4OiAnOTIuMzg5Myd9KTtcbiAgICAgICAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvblIoKSB7XG4gICAgICB0YXBlUi5hbmltYXRlKHsgY3g6ICczMzAuMzg5J30sIDUwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRhcGVSLmF0dHIoeyBjeDogJzMyOC4zODknfSk7XG4gICAgICAgICAgICB0YXBlQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG4gICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgIHdoZWVsQW5pbWF0aW9uTCgpO1xuICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgd2hlZWxMLnN0b3AoKTtcbiAgICAgIHdoZWVsUi5zdG9wKCk7XG4gICAgICB0YXBlTC5zdG9wKCk7XG4gICAgICB0YXBlUi5zdG9wKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVjU3RvcCgpIHtcbiAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICB4UmVjID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGxheVN0b3AoKSB7XG4gICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHBsYXlBY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG4gICAgICBmb3J3YXJkLnRyYW5zZm9ybSgndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgc3RvcEFuaW1hdGlvbigpO1xuICAgICAgWEZvcndhcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjaysrO1xuICAgICAgfVxuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICB9XG5cbiAgICAvLyBwbGF5IGZ1bmN0aW9uXG4gICAgcGxheVBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZihhdWRpby5wYXVzZWQpIHtcblxuICAgICAgICAvLyBwbGF5IHN0YXRlXG4gICAgICAgIHBsYXlBY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuICAgICAgICBpZiAoIXhSZWMpIHsgLy8gaXMgbm90IHJlY29yZGluZ1xuICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cbiAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgICAgLy9hdWRpby5wbGF5KCk7XG4gICAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgLy8gcGF1c2Ugc3RhdGVcbiAgICAgICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgICBwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcbiAgICAgICAgICBhdWRpby5wYXVzZSgpO1xuXG4gICAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgICBzdG9wV2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIHBsYXkgZnVuY3Rpb25cblxuICAgIC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG4gICAgYmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgdmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgfTtcblxuICAgICAgYW5pbTEoKTtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID4gMCApIHtcbiAgICAgICAgY3VycmVudFRyYWNrLS07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjayA9IChwbGF5bGlzdC5sZW5ndGggLSAxKTtcbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cblxuICAgIH0pO1xuICAgIC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXG4gICAgLy8gZm9yd2FyZCBmdW5jdGlvblxuICAgIGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgdmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgfTtcblxuICAgICAgYW5pbTEoKTtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG4gICAgZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcbiAgICAgIHRyYWNrdGl0bGUubm9kZS5pbm5lckhUTUwgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cbiAgICBmdW5jdGlvbiBfX2xvZyhlLCBkYXRhKSB7XG4gICAgICBsb2dUZXh0Lm5vZGUuaW5uZXJIVE1MID0gXCJcXG5cIiArIGUgKyBcIiBcIiArIChkYXRhIHx8ICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydFVzZXJNZWRpYShzdHJlYW0pIHtcbiAgICAgIHZhciBpbnB1dCA9IGF1ZGlvX2NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgICAgIGNvbnNvbGUubG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcblxuICAgICAgcmVjb3JkZXIgPSBuZXcgUmVjb3JkZXIoaW5wdXQpO1xuICAgICAgX19sb2coJ1JlYWR5IScpO1xuICAgIH1cblxuICAgIC8vIHJlYyBmdW5jdGlvblxuICAgIHJlYy5jbGljayhmdW5jdGlvbihvaykge1xuXG4gICAgICBpZiAoIXhSZWMpeyAvL2lzIG5vdCByZWNvcmRpbmdcblxuICAgICAgICByZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG4gICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICB4UmVjID0gdHJ1ZTtcblxuICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5yZWNvcmQoKTtcblxuICAgICAgICBfX2xvZygnUmVjb3JkaW5nLi4uJyk7XG5cbiAgICAgIH0gIGVsc2UgeyAvL3N0b3AgcmVjb3JkaW5nXG5cbiAgICAgICAgcmVjU3RvcCgpO1xuXG4gICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG4gICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5zdG9wKCk7XG5cbiAgICAgICAgX19sb2coJ1N0b3BwZWQgcmVjLicpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBXQVYgZG93bmxvYWQgbGluayB1c2luZyBhdWRpbyBkYXRhIGJsb2JcbiAgICAgICAgY3JlYXRlRG93bmxvYWRMaW5rKCk7XG5cbiAgICAgICAgcmVjb3JkZXIuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEb3dubG9hZExpbmsoKSB7XG4gICAgICByZWNvcmRlciAmJiByZWNvcmRlci5leHBvcnRXQVYoZnVuY3Rpb24oYmxvYikge1xuICAgICAgICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgdmFyIGF1ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcbiAgICAgICAgdmFyIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG5cbiAgICAgICAgYXUuY29udHJvbHMgPSB0cnVlO1xuICAgICAgICBhdS5zcmMgPSB1cmw7XG4gICAgICAgIGhmLmhyZWYgPSB1cmw7XG4gICAgICAgIGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuICAgICAgICBoZi5pbm5lckhUTUwgPSBoZi5kb3dubG9hZDtcblxuICAgICAgICB2YXIgdHJhY2tVUkwgPSBoZi5kb3dubG9hZDtcblxuICAgICAgICB2YXIgcmVjb3JkaW5nRWxlbWVudCA9IGFuZ3VsYXIuZWxlbWVudCgnPGxpIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW1cIj48c3BhbiBjbGFzcz1cIm1kbC1saXN0X19pdGVtLXByaW1hcnktY29udGVudFwiID48aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zIG1kbC1saXN0X19pdGVtLWljb25cIj5taWM8L2k+JyArIHRyYWNrVVJMICsgJzwvc3Bhbj48c3BhbiBjbGFzcz1cIm1kbC1saXN0X19pdGVtLXNlY29uZGFyeS1hY3Rpb25cIj48YSBjbGFzcz1cIm1kbC1idXR0b24gbWRsLWpzLWJ1dHRvbiBtZGwtYnV0dG9uLS1hY2NlbnRcIiBocmVmPVwiJyArIHVybCArICdcIlwiIGRvd25sb2FkPkRvd25sb2FkIDxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnNcIj5maWxlX2Rvd25sb2FkPC9pPjwvYT48L3NwYW4+PC9saT4nKTtcblxuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3JlY29yZGluZ3NsaXN0JykpLmFwcGVuZChyZWNvcmRpbmdFbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gd2Via2l0IHNoaW1cbiAgICAgICAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcbiAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubXNHZXRVc2VyTWVkaWEpOyAvL3RoaXMgd2lsbCBzZXQgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB0byB3aGF0ZXZlciBpdCBkZXRlY3RzIHRvIGJlIHRoZSBwcm9wZXIgcHJlZml4ZWQgdmVyc2lvbi5cbiAgICAgICAgd2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcblxuICAgICAgICBhdWRpb19jb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dDtcbiAgICAgICAgLy9jb25zb2xlLmxvZygoJ0F1ZGlvIGNvbnRleHQgc2V0IHVwLicpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCduYXZpZ2F0b3IuZ2V0VXNlck1lZGlhICcgKyAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSA/ICdhdmFpbGFibGUuJyA6ICdub3QgcHJlc2VudCEnKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIF9fbG9nKCdKdXN0IHdvcmsgb24gY2hyb21lIScpO1xuICAgICAgfVxuXG4gICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKHthdWRpbzogdHJ1ZX0sIHN0YXJ0VXNlck1lZGlhLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIF9fbG9nKCdObyBsaXZlIGF1ZGlvIGlucHV0OiAnICsgZSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIHNrZXRjaCA9IGZ1bmN0aW9uKG5vaXNlV2F2ZSkge1xuXG4gICAgICB2YXIgdXJsLFxuICAgIFx0XHRteUNhbnZhcyxcbiAgICBcdFx0Y291bnRlciA9IDAsXG4gICAgXHRcdHN0YXJ0aW5nQW5nbGU9NyxcbiAgICBcdFx0Z29SaWdodCA9IHRydWUsXG4gICAgXHRcdHN0YXJ0VXAgPSB0cnVlLFxuICAgIFx0XHRteUZyYW1lUmF0ZSA9IDMwLFxuICAgIFx0XHRydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgbm9pc2VXYXZlLnNldHVwID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgbXlDYW52YXMgPSBub2lzZVdhdmUuY3JlYXRlQ2FudmFzKHNjcmVlbi53aWR0aCwgNTAwKTtcbiAgICAgICAgbXlDYW52YXMucGFyZW50KCdjYXNzZXRlLXBsYXllci1jdCcpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBBdWRpbyBpbnB1dFxuICAgICAgICBtaWMgPSBuZXcgcDUuQXVkaW9JbigpO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSBBdWRpbyBJbnB1dC5cbiAgICAgICAgbWljLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgc291bmQgcmVjb3JkZXJcbiAgICAgICAgcmVjb3JkZXIgPSBuZXcgcDUuU291bmRSZWNvcmRlcigpO1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdGhlIG1pYyB0byB0aGUgcmVjb3JkZXJcbiAgICAgICAgcmVjb3JkZXIuc2V0SW5wdXQobWljKTtcblxuICAgICAgICAvLyBjcmVhdGUgYW4gZW1wdHkgc291bmQgZmlsZSB0aGF0IHdlIHdpbGwgdXNlIHRvIHBsYXliYWNrIHRoZSByZWNvcmRpbmdcbiAgICAgICAgc291bmRGaWxlID0gbmV3IHA1LlNvdW5kRmlsZSgpO1xuICAgICAgfTtcblxuICAgICAgbm9pc2VXYXZlLmRyYXcgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgeW9mZiA9IDAuMDtcbiAgICAgICAgLy8gR2V0IHRoZSBvdmVyYWxsIHZvbHVtZSAoYmV0d2VlbiAwIGFuZCAxLjApXG4gICAgICAgIHZhciB2b2wgPSBtaWMuZ2V0TGV2ZWwoKTtcblxuICAgICAgICBub2lzZVdhdmUuYmFja2dyb3VuZCgyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgbm9pc2VXYXZlLnN0cm9rZSgyNSwgMjAyLCAxNDQpO1xuICAgICAgICBub2lzZVdhdmUuZmlsbCgyNSwgMjAyLCAxNDQpO1xuXG4gICAgICAgIC8vIFdlIGFyZSBnb2luZyB0byBkcmF3IGEgcG9seWdvbiBvdXQgb2YgdGhlIHdhdmUgcG9pbnRzXG4gICAgICAgIG5vaXNlV2F2ZS5iZWdpblNoYXBlKCk7XG5cbiAgICAgICAgdmFyIHhvZmYgPSAwOyAgICAgICAvLyBPcHRpb24gIzE6IDJEIE5vaXNlXG5cbiAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGhvcml6b250YWwgcGl4ZWxzXG4gICAgICAgIGZvciAodmFyIHggPSAwOyB4IDw9IHNjcmVlbi53aWR0aDsgeCArPSAxMCkge1xuICAgICAgICAgIC8vIENhbGN1bGF0ZSBhIHkgdmFsdWUgYWNjb3JkaW5nIHRvIG5vaXNlLCBtYXAgdG9cblxuICAgICAgICAgIC8vbWFwKHZhbHVlLHN0YXJ0MSxzdG9wMSxzdGFydDIsc3RvcDIpXG4gICAgICAgICAgdmFyIHkgPSBub2lzZVdhdmUubWFwKG5vaXNlV2F2ZS5ub2lzZSh4b2ZmLCB5b2ZmKSwgMCwgMSwgMjAwLDMwMCk7XG5cbiAgICAgICAgICAvLyBTZXQgdGhlIHZlcnRleFxuICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoeCwgeSk7XG4gICAgICAgICAgLy8gSW5jcmVtZW50IHggZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICAgIHhvZmYgKz0gdm9sO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluY3JlbWVudCB5IGRpbWVuc2lvbiBmb3Igbm9pc2VcbiAgICAgICAgeW9mZiArPSB2b2w7XG4gICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLnZlcnRleCgwLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLmVuZFNoYXBlKG5vaXNlV2F2ZS5DTE9TRSk7XG4gICAgICB9O1xuXG4gICAgfTsvLyB2YXIgc2tldGNoXG5cbiAgICB2YXIgbXlQNSA9IG5ldyBwNShza2V0Y2gpO1xuXG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==