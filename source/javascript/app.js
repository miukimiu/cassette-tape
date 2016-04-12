angular.module('cassetteApp', [])
.config(['$compileProvider', function ($compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(|blob|):/);
}])

.controller('cassetteController', function($scope, $window){

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
    analyzer,
    currentTrack = 0,
    seekslider,
    seeking=false,
    audio_context,
    recorder,
    seekto;

    var mic, soundFile;

    pauseState.attr("display", "none");

    // Audio Object
    audio.src = dir+playlist[0]+ext;

    seekslider = document.getElementById("seekslider");

    audio.addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);


    audio.addEventListener("tracktitle", function(){ titleUpdate(); });

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

        //console.log(playActive);

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

          //console.log(playActive);

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

      //console.log('fw - the current track is: ' + currentTrack);

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
      __log('Media stream created.');
      // Uncomment if you want the audio to feedback directly
      //input.connect(audio_context.destination);
      //__log('Input connected to audio context destination.');

      recorder = new Recorder(input);
      __log('Ready!');
    }

    // rec function
    rec.click(function(ok) {

      if (!xRec){ //is not recording

        rec.transform('t0.344053, ' + buttonYpositionActive);

        // wheels events

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

        __log('Stopped recording.');

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
        //li.appendChild(au); // I don't want the default browser player.


        var trackURL = hf.download;

        console.log(url);
        li.appendChild(hf); // i just want the link of the recorded audio to download

        //recordingslist.appendChild(li);


        var myElement = angular.element('<li class="mdl-list__item"><span class="mdl-list__item-primary-content" ><i class="material-icons mdl-list__item-icon">mic</i>' + trackURL + '</span><span class="mdl-list__item-secondary-action"><a class="mdl-button mdl-js-button mdl-button--accent" href="' + url + '"" download>Download <i class="material-icons">file_download</i></a></span></li>');

        angular.element(document.querySelector('#recordingslist')).append(myElement);
      });
    }

    window.onload = function init() {
      try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia); //this will set navigator.getUserMedia to whatever it detects to be the proper prefixed version.
        window.URL = window.URL || window.webkitURL;

        audio_context = new AudioContext;
        __log('Audio context set up.');
        __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
      } catch (e) {
        __log('Just work in chrome!');
      }

      navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
        __log('No live audio input: ' + e);
      });
    };

    var sketch = function(noiseWave) {

      var url;
  		var myCanvas;
  		var counter = 0;
  		var startingAngle=7;
  		var goRight = true;
  		var startUp = true;
  		var myFrameRate = 30;
  		var running = true;

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

        //console.log('vol: ' + vol);

        noiseWave.background(255, 255, 255);
        noiseWave.stroke(25, 202, 144);
        noiseWave.fill(25, 202, 144);

        // We are going to draw a polygon out of the wave points
        noiseWave.beginShape();

        var xoff = 0;       // Option #1: 2D Noise

        // Iterate over horizontal pixels
        for (var x = 0; x <= screen.width; x += 10) {
          // Calculate a y value according to noise, map to

          // Option #1: 2D Noise
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
