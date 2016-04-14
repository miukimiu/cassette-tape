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
    'ui.router',
    'angular-spinkit'
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

    $rootScope.$on('$stateChangeStart',function(){
        $rootScope.stateIsLoading = true;
        console.log($rootScope.stateIsLoading);
   });


    $rootScope.$on('$stateChangeSuccess',function(){
        $rootScope.stateIsLoading = false;
        console.log($rootScope.stateIsLoading);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNhc3NldHRlQ29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbmdkb2Mgb3ZlcnZpZXdcbiAqIEBuYW1lIGNhc3NldHRlQXBwXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgY2Fzc2V0dGVBcHBcbiAqXG4gKiBNYWluIG1vZHVsZSBvZiB0aGUgYXBwbGljYXRpb24uXG4gKi9cblxuIGFuZ3VsYXJcbiAgLm1vZHVsZSgnY2Fzc2V0dGVBcHAnLCBbXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ2FuZ3VsYXItc3BpbmtpdCdcbiAgXSlcbiAgLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAvLyBGb3IgYW55IHVubWF0Y2hlZCB1cmwsIHJlZGlyZWN0IHRvIC9zdGF0ZTFcbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKFwiL1wiKTtcblxuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgLnN0YXRlKCdpbmRleCcsIHtcbiAgICAgIHVybDogJy8nLFxuICAgICAgdGVtcGxhdGVVcmw6ICd2aWV3cy9wYXJ0aWFsLWluZGV4Lmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogJ0Nhc3NldHRlQ29udHJvbGxlcicsXG4gICAgfSk7XG4gIH0pXG4gIC5ydW4oWyckcm9vdFNjb3BlJywgJyRzdGF0ZScsZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlKXtcblxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS5zdGF0ZUlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgIGNvbnNvbGUubG9nKCRyb290U2NvcGUuc3RhdGVJc0xvYWRpbmcpO1xuICAgfSk7XG5cblxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJyxmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLnN0YXRlSXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICAgIGNvbnNvbGUubG9nKCRyb290U2NvcGUuc3RhdGVJc0xvYWRpbmcpO1xuICAgfSk7XG5cbiAgfV0pO1xuIiwiLyoqXG4gKiBAbmdkb2MgZnVuY3Rpb25cbiAqIEBuYW1lIGNhc3NldHRlQXBwLmNvbnRyb2xsZXI6Q2Fzc2V0dGVDb250cm9sbGVyXG4gKiBAZGVzY3JpcHRpb25cbiAqICMgQ2Fzc2V0dGVDb250cm9sbGVyXG4gKiBDb250cm9sbGVyIG9mIHRoZSBjYXNzZXR0ZUFwcFxuICovXG5cbmFuZ3VsYXIubW9kdWxlKCdjYXNzZXR0ZUFwcCcpXG4uY29udHJvbGxlcignQ2Fzc2V0dGVDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkd2luZG93LCAkaHR0cCkge1xuXG4gIHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG4gICAgeFJlYyA9IGZhbHNlLFxuICAgIGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG4gICAgcGxheVBhdXNlID0gU25hcCgnI3BsYXlQYXVzZScpLFxuICAgIHBsYXlTdGF0ZSA9IFNuYXAoJyNwbGF5U3RhdGUnKSxcbiAgICBwYXVzZVN0YXRlID0gU25hcCgnI3BhdXNlU3RhdGUnKSxcbiAgICBwbGF5QWN0aXZlID0gZmFsc2UsXG4gICAgZm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG4gICAgd2hlZWxMID0gU25hcCgnI3doZWVsLWwnKSxcbiAgICB3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuICAgIHRhcGUgPSBTbmFwKCcjdGFwZScpLFxuICAgIHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG4gICAgdGFwZVIgPSBTbmFwKCcjdGFwZVInKSxcbiAgICBsb2dUZXh0ID0gU25hcCgnI3JlY29yZGluZ1RleHQgdHNwYW4nKSxcbiAgICB0cmFja3RpdGxlID0gU25hcCgnI3RyYWNrdGl0bGUgdHNwYW4nKSxcbiAgICBidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3NyxcbiAgICBidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3NyxcbiAgICBiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcbiAgICBiYm94UiA9IHRhcGVSLmdldEJCb3goKSxcbiAgICBhdWRpbyA9IG5ldyBBdWRpbygpLFxuICAgIGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG4gICAgcGxheWxpc3QgPSBbJ2RpcnR5X3NvdXRoX2xvb3BfODVicG0nLCAncG9wX2hpcGhvcF9sb29wXzEwMGJwbSddLFxuICAgIGRpciA9IFwiYXVkaW8vXCIsXG4gICAgZXh0ID0gXCIubXAzXCIsXG4gICAgaW5wdXQsXG4gICAgY3VycmVudFRyYWNrID0gMCxcbiAgICBhdWRpb19jb250ZXh0LFxuICAgIHJlY29yZGVyLFxuICAgIG1pYyxcbiAgICBzb3VuZEZpbGU7XG5cbiAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuICAgIC8vIEF1ZGlvIE9iamVjdFxuICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFswXStleHQ7XG5cbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jdXJyZW50VGltZSA9IDA7XG4gICAgICB0aGlzLnBsYXkoKTtcbiAgICB9LCBmYWxzZSk7XG5cbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKFwidHJhY2t0aXRsZVwiLCBmdW5jdGlvbigpe1xuICAgICAgdGl0bGVVcGRhdGUoKTtcbiAgICB9KTtcblxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25MKCkge1xuICAgICAgd2hlZWxMLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwzMCwzMCd9LCAyMDAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgd2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG4gICAgICAgICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcbiAgICBmdW5jdGlvbiB3aGVlbEFuaW1hdGlvblIoKSB7XG4gICAgICB3aGVlbFIuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDI3MCwzMCd9LCAyMDAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgd2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuICAgICAgICAgICAgd2hlZWxBbmltYXRpb25SKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuICAgIGZ1bmN0aW9uIHRhcGVBbmltYXRpb25MKCkge1xuICAgICAgdGFwZUwuYW5pbWF0ZSh7IGN4OiAnOTAuMzg5Myd9LCA1MDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0YXBlTC5hdHRyKHsgY3g6ICc5Mi4zODkzJ30pO1xuICAgICAgICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcbiAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uUigpIHtcbiAgICAgIHRhcGVSLmFuaW1hdGUoeyBjeDogJzMzMC4zODknfSwgNTAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGFwZVIuYXR0cih7IGN4OiAnMzI4LjM4OSd9KTtcbiAgICAgICAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbigpIHtcbiAgICAgIHdoZWVsQW5pbWF0aW9uUigpO1xuICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICB0YXBlQW5pbWF0aW9uTCgpO1xuICAgICAgdGFwZUFuaW1hdGlvblIoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdG9wV2hlZWxBbmltYXRpb24oKSB7XG4gICAgICB3aGVlbEwuc3RvcCgpO1xuICAgICAgd2hlZWxSLnN0b3AoKTtcbiAgICAgIHRhcGVMLnN0b3AoKTtcbiAgICAgIHRhcGVSLnN0b3AoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWNTdG9wKCkge1xuICAgICAgcmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHhSZWMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwbGF5U3RvcCgpIHtcbiAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcbiAgICAgIGZvcndhcmQudHJhbnNmb3JtKCd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICBzdG9wQW5pbWF0aW9uKCk7XG4gICAgICBYRm9yd2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBuZXh0VHJhY2sgKCkge1xuXG4gICAgICBpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcbiAgICAgICAgY3VycmVudFRyYWNrID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFRyYWNrKys7XG4gICAgICB9XG5cbiAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgYXVkaW8ucGxheSgpO1xuICAgIH1cblxuICAgIC8vIHBsYXkgZnVuY3Rpb25cbiAgICBwbGF5UGF1c2UuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIGlmKGF1ZGlvLnBhdXNlZCkge1xuXG4gICAgICAgIC8vIHBsYXkgc3RhdGVcbiAgICAgICAgcGxheUFjdGl2ZSA9IHRydWU7XG5cbiAgICAgICAgcGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG4gICAgICAgIGlmICgheFJlYykgeyAvLyBpcyBub3QgcmVjb3JkaW5nXG4gICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblxuICAgICAgICBhdWRpby5wbGF5KCk7XG5cbiAgICAgICAgICAvL2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAvLyBwYXVzZSBzdGF0ZVxuICAgICAgICAgIHBsYXlBY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuICAgICAgICAgIGF1ZGlvLnBhdXNlKCk7XG5cbiAgICAgICAgICBpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcbiAgICAgICAgICAgIHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgcGxheSBmdW5jdGlvblxuXG4gICAgLy8gYmFja3dhcmQgZnVuY3Rpb25cbiAgICBiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgLy8gYnV0dG9uIGFuaW0xXG4gICAgICB2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG4gICAgICB9O1xuXG4gICAgICBhbmltMSgpO1xuXG4gICAgICBpZihjdXJyZW50VHJhY2sgPiAwICkge1xuICAgICAgICBjdXJyZW50VHJhY2stLTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuICAgICAgfVxuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgIGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcbiAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgfVxuXG4gICAgfSk7XG4gICAgLy8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cbiAgICAvLyBmb3J3YXJkIGZ1bmN0aW9uXG4gICAgZm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgLy8gYnV0dG9uIGFuaW0xXG4gICAgICB2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG4gICAgICB9O1xuXG4gICAgICBhbmltMSgpO1xuXG4gICAgICBpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcbiAgICAgICAgY3VycmVudFRyYWNrID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGN1cnJlbnRUcmFjaysrO1xuICAgICAgfVxuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgIGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcbiAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCBmb3J3YXJkIGZ1bmN0aW9uXG5cbiAgICBmdW5jdGlvbiB0aXRsZVVwZGF0ZSgpe1xuICAgICAgdHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG4gICAgfVxuXG4gICAgLy8gKioqKioqKiogUmVjb3JkZXIgKioqKioqKiAvL1xuICAgIGZ1bmN0aW9uIF9fbG9nKGUsIGRhdGEpIHtcbiAgICAgIGxvZ1RleHQubm9kZS5pbm5lckhUTUwgPSBcIlxcblwiICsgZSArIFwiIFwiICsgKGRhdGEgfHwgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0VXNlck1lZGlhKHN0cmVhbSkge1xuICAgICAgdmFyIGlucHV0ID0gYXVkaW9fY29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShzdHJlYW0pO1xuICAgICAgY29uc29sZS5sb2coJ01lZGlhIHN0cmVhbSBjcmVhdGVkLicpO1xuXG4gICAgICByZWNvcmRlciA9IG5ldyBSZWNvcmRlcihpbnB1dCk7XG4gICAgICBfX2xvZygnUmVhZHkhJyk7XG4gICAgfVxuXG4gICAgLy8gcmVjIGZ1bmN0aW9uXG4gICAgcmVjLmNsaWNrKGZ1bmN0aW9uKG9rKSB7XG5cbiAgICAgIGlmICgheFJlYyl7IC8vaXMgbm90IHJlY29yZGluZ1xuXG4gICAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHhSZWMgPSB0cnVlO1xuXG4gICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnJlY29yZCgpO1xuXG4gICAgICAgIF9fbG9nKCdSZWNvcmRpbmcuLi4nKTtcblxuICAgICAgfSAgZWxzZSB7IC8vc3RvcCByZWNvcmRpbmdcblxuICAgICAgICByZWNTdG9wKCk7XG5cbiAgICAgICAgaWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cbiAgICAgICAgICBzdG9wV2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnN0b3AoKTtcblxuICAgICAgICBfX2xvZygnU3RvcHBlZCByZWMuJyk7XG5cbiAgICAgICAgLy8gY3JlYXRlIFdBViBkb3dubG9hZCBsaW5rIHVzaW5nIGF1ZGlvIGRhdGEgYmxvYlxuICAgICAgICBjcmVhdGVEb3dubG9hZExpbmsoKTtcblxuICAgICAgICByZWNvcmRlci5jbGVhcigpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCByZWMgZnVuY3Rpb25cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkTGluaygpIHtcbiAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLmV4cG9ydFdBVihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgIHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICB2YXIgYXUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuICAgICAgICB2YXIgaGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cblxuICAgICAgICBhdS5jb250cm9scyA9IHRydWU7XG4gICAgICAgIGF1LnNyYyA9IHVybDtcbiAgICAgICAgaGYuaHJlZiA9IHVybDtcbiAgICAgICAgaGYuZG93bmxvYWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgKyAnLndhdic7XG4gICAgICAgIGhmLmlubmVySFRNTCA9IGhmLmRvd25sb2FkO1xuXG4gICAgICAgIHZhciB0cmFja1VSTCA9IGhmLmRvd25sb2FkO1xuXG4gICAgICAgIHZhciByZWNvcmRpbmdFbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KCc8bGkgY2xhc3M9XCJtZGwtbGlzdF9faXRlbVwiPjxzcGFuIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW0tcHJpbWFyeS1jb250ZW50XCIgPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMgbWRsLWxpc3RfX2l0ZW0taWNvblwiPm1pYzwvaT4nICsgdHJhY2tVUkwgKyAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW0tc2Vjb25kYXJ5LWFjdGlvblwiPjxhIGNsYXNzPVwibWRsLWJ1dHRvbiBtZGwtanMtYnV0dG9uIG1kbC1idXR0b24tLWFjY2VudFwiIGhyZWY9XCInICsgdXJsICsgJ1wiXCIgZG93bmxvYWQ+RG93bmxvYWQgPGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPmZpbGVfZG93bmxvYWQ8L2k+PC9hPjwvc3Bhbj48L2xpPicpO1xuXG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcmVjb3JkaW5nc2xpc3QnKSkuYXBwZW5kKHJlY29yZGluZ0VsZW1lbnQpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyB3ZWJraXQgc2hpbVxuICAgICAgICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuICAgICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYSk7IC8vdGhpcyB3aWxsIHNldCBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHRvIHdoYXRldmVyIGl0IGRldGVjdHMgdG8gYmUgdGhlIHByb3BlciBwcmVmaXhlZCB2ZXJzaW9uLlxuICAgICAgICB3aW5kb3cuVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xuXG4gICAgICAgIGF1ZGlvX2NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0O1xuICAgICAgICAvL2NvbnNvbGUubG9nKCgnQXVkaW8gY29udGV4dCBzZXQgdXAuJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25hdmlnYXRvci5nZXRVc2VyTWVkaWEgJyArIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID8gJ2F2YWlsYWJsZS4nIDogJ25vdCBwcmVzZW50IScpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgX19sb2coJ0p1c3Qgd29yayBvbiBjaHJvbWUhJyk7XG4gICAgICB9XG5cbiAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoe2F1ZGlvOiB0cnVlfSwgc3RhcnRVc2VyTWVkaWEsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgX19sb2coJ05vIGxpdmUgYXVkaW8gaW5wdXQ6ICcgKyBlKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgc2tldGNoID0gZnVuY3Rpb24obm9pc2VXYXZlKSB7XG5cbiAgICAgIHZhciB1cmwsXG4gICAgXHRcdG15Q2FudmFzLFxuICAgIFx0XHRjb3VudGVyID0gMCxcbiAgICBcdFx0c3RhcnRpbmdBbmdsZT03LFxuICAgIFx0XHRnb1JpZ2h0ID0gdHJ1ZSxcbiAgICBcdFx0c3RhcnRVcCA9IHRydWUsXG4gICAgXHRcdG15RnJhbWVSYXRlID0gMzAsXG4gICAgXHRcdHJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgICBub2lzZVdhdmUuc2V0dXAgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICBteUNhbnZhcyA9IG5vaXNlV2F2ZS5jcmVhdGVDYW52YXMoc2NyZWVuLndpZHRoLCA1MDApO1xuICAgICAgICBteUNhbnZhcy5wYXJlbnQoJ2Nhc3NldGUtcGxheWVyLWN0Jyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGFuIEF1ZGlvIGlucHV0XG4gICAgICAgIG1pYyA9IG5ldyBwNS5BdWRpb0luKCk7XG5cbiAgICAgICAgLy8gc3RhcnQgdGhlIEF1ZGlvIElucHV0LlxuICAgICAgICBtaWMuc3RhcnQoKTtcblxuICAgICAgICAvLyBjcmVhdGUgYSBzb3VuZCByZWNvcmRlclxuICAgICAgICByZWNvcmRlciA9IG5ldyBwNS5Tb3VuZFJlY29yZGVyKCk7XG5cbiAgICAgICAgLy8gY29ubmVjdCB0aGUgbWljIHRvIHRoZSByZWNvcmRlclxuICAgICAgICByZWNvcmRlci5zZXRJbnB1dChtaWMpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhbiBlbXB0eSBzb3VuZCBmaWxlIHRoYXQgd2Ugd2lsbCB1c2UgdG8gcGxheWJhY2sgdGhlIHJlY29yZGluZ1xuICAgICAgICBzb3VuZEZpbGUgPSBuZXcgcDUuU291bmRGaWxlKCk7XG4gICAgICB9O1xuXG4gICAgICBub2lzZVdhdmUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciB5b2ZmID0gMC4wO1xuICAgICAgICAvLyBHZXQgdGhlIG92ZXJhbGwgdm9sdW1lIChiZXR3ZWVuIDAgYW5kIDEuMClcbiAgICAgICAgdmFyIHZvbCA9IG1pYy5nZXRMZXZlbCgpO1xuXG4gICAgICAgIG5vaXNlV2F2ZS5iYWNrZ3JvdW5kKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBub2lzZVdhdmUuc3Ryb2tlKDI1LCAyMDIsIDE0NCk7XG4gICAgICAgIG5vaXNlV2F2ZS5maWxsKDI1LCAyMDIsIDE0NCk7XG5cbiAgICAgICAgLy8gV2UgYXJlIGdvaW5nIHRvIGRyYXcgYSBwb2x5Z29uIG91dCBvZiB0aGUgd2F2ZSBwb2ludHNcbiAgICAgICAgbm9pc2VXYXZlLmJlZ2luU2hhcGUoKTtcblxuICAgICAgICB2YXIgeG9mZiA9IDA7ICAgICAgIC8vIE9wdGlvbiAjMTogMkQgTm9pc2VcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgaG9yaXpvbnRhbCBwaXhlbHNcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gc2NyZWVuLndpZHRoOyB4ICs9IDEwKSB7XG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIGEgeSB2YWx1ZSBhY2NvcmRpbmcgdG8gbm9pc2UsIG1hcCB0b1xuXG4gICAgICAgICAgLy9tYXAodmFsdWUsc3RhcnQxLHN0b3AxLHN0YXJ0MixzdG9wMilcbiAgICAgICAgICB2YXIgeSA9IG5vaXNlV2F2ZS5tYXAobm9pc2VXYXZlLm5vaXNlKHhvZmYsIHlvZmYpLCAwLCAxLCAyMDAsMzAwKTtcblxuICAgICAgICAgIC8vIFNldCB0aGUgdmVydGV4XG4gICAgICAgICAgbm9pc2VXYXZlLnZlcnRleCh4LCB5KTtcbiAgICAgICAgICAvLyBJbmNyZW1lbnQgeCBkaW1lbnNpb24gZm9yIG5vaXNlXG4gICAgICAgICAgeG9mZiArPSB2b2w7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5jcmVtZW50IHkgZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICB5b2ZmICs9IHZvbDtcbiAgICAgICAgbm9pc2VXYXZlLnZlcnRleChzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpO1xuICAgICAgICBub2lzZVdhdmUudmVydGV4KDAsIHNjcmVlbi5oZWlnaHQpO1xuICAgICAgICBub2lzZVdhdmUuZW5kU2hhcGUobm9pc2VXYXZlLkNMT1NFKTtcbiAgICAgIH07XG5cbiAgICB9Oy8vIHZhciBza2V0Y2hcblxuICAgIHZhciBteVA1ID0gbmV3IHA1KHNrZXRjaCk7XG5cbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9