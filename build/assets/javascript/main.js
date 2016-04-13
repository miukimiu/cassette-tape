angular.module('cassetteApp', [])

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnY2Fzc2V0dGVBcHAnLCBbXSlcblxuLmNvbnRyb2xsZXIoJ2Nhc3NldHRlQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHdpbmRvdyl7XG5cbiAgdmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcbiAgICB4UmVjID0gZmFsc2UsXG4gICAgYmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcbiAgICBwbGF5UGF1c2UgPSBTbmFwKCcjcGxheVBhdXNlJyksXG4gICAgcGxheVN0YXRlID0gU25hcCgnI3BsYXlTdGF0ZScpLFxuICAgIHBhdXNlU3RhdGUgPSBTbmFwKCcjcGF1c2VTdGF0ZScpLFxuICAgIHBsYXlBY3RpdmUgPSBmYWxzZSxcbiAgICBmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcbiAgICB3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuICAgIHdoZWVsUiA9IFNuYXAoJyN3aGVlbC1yJyksXG4gICAgdGFwZSA9IFNuYXAoJyN0YXBlJyksXG4gICAgdGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcbiAgICB0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuICAgIGxvZ1RleHQgPSBTbmFwKCcjcmVjb3JkaW5nVGV4dCB0c3BhbicpLFxuICAgIHRyYWNrdGl0bGUgPSBTbmFwKCcjdHJhY2t0aXRsZSB0c3BhbicpLFxuICAgIGJ1dHRvbllwb3NpdGlvbiA9IDAuNjc5NDc3LFxuICAgIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuICAgIGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuICAgIGJib3hSID0gdGFwZVIuZ2V0QkJveCgpLFxuICAgIGF1ZGlvID0gbmV3IEF1ZGlvKCksXG4gICAgZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcbiAgICBwbGF5bGlzdCA9IFsnZGlydHlfc291dGhfbG9vcF84NWJwbScsICdwb3BfaGlwaG9wX2xvb3BfMTAwYnBtJ10sXG4gICAgZGlyID0gXCJhdWRpby9cIixcbiAgICBleHQgPSBcIi5tcDNcIixcbiAgICBpbnB1dCxcbiAgICBjdXJyZW50VHJhY2sgPSAwLFxuICAgIGF1ZGlvX2NvbnRleHQsXG4gICAgcmVjb3JkZXIsXG4gICAgbWljLFxuICAgIHNvdW5kRmlsZTtcblxuICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXG4gICAgLy8gQXVkaW8gT2JqZWN0XG4gICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0WzBdK2V4dDtcblxuICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgIHRoaXMucGxheSgpO1xuICAgIH0sIGZhbHNlKTtcblxuICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICBmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG4gICAgICB3aGVlbEwuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDMwLDMwJ30sIDIwMDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uTCgpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcbiAgICAgIHdoZWVsUi5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMjcwLDMwJ30sIDIwMDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG4gICAgICAgICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG4gICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvbkwoKSB7XG4gICAgICB0YXBlTC5hbmltYXRlKHsgY3g6ICc5MC4zODkzJ30sIDUwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRhcGVMLmF0dHIoeyBjeDogJzkyLjM4OTMnfSk7XG4gICAgICAgICAgICB0YXBlQW5pbWF0aW9uTCgpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgIGZ1bmN0aW9uIHRhcGVBbmltYXRpb25SKCkge1xuICAgICAgdGFwZVIuYW5pbWF0ZSh7IGN4OiAnMzMwLjM4OSd9LCA1MDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0YXBlUi5hdHRyKHsgY3g6ICczMjguMzg5J30pO1xuICAgICAgICAgICAgdGFwZUFuaW1hdGlvblIoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgd2hlZWxBbmltYXRpb25SKCk7XG4gICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICB0YXBlQW5pbWF0aW9uUigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0b3BXaGVlbEFuaW1hdGlvbigpIHtcbiAgICAgIHdoZWVsTC5zdG9wKCk7XG4gICAgICB3aGVlbFIuc3RvcCgpO1xuICAgICAgdGFwZUwuc3RvcCgpO1xuICAgICAgdGFwZVIuc3RvcCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG4gICAgICByZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgeFJlYyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZvcndhcmRTdG9wKCkge1xuICAgICAgZm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHN0b3BBbmltYXRpb24oKTtcbiAgICAgIFhGb3J3YXJkID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5leHRUcmFjayAoKSB7XG5cbiAgICAgIGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuICAgICAgICBjdXJyZW50VHJhY2sgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBhdWRpby5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gcGxheSBmdW5jdGlvblxuICAgIHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgaWYoYXVkaW8ucGF1c2VkKSB7XG5cbiAgICAgICAgLy8gcGxheSBzdGF0ZVxuICAgICAgICBwbGF5QWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICBwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cbiAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIG5vdCByZWNvcmRpbmdcbiAgICAgICAgICB3aGVlbEFuaW1hdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcblxuICAgICAgICAgIC8vYXVkaW8ucGxheSgpO1xuICAgICAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIHBhdXNlIHN0YXRlXG4gICAgICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgcGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG4gICAgICAgICAgYXVkaW8ucGF1c2UoKTtcblxuICAgICAgICAgIGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cbiAgICAvLyBiYWNrd2FyZCBmdW5jdGlvblxuICAgIGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAvLyBidXR0b24gYW5pbTFcbiAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICB9O1xuXG4gICAgICB2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcbiAgICAgIH07XG5cbiAgICAgIGFuaW0xKCk7XG5cbiAgICAgIGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG4gICAgICAgIGN1cnJlbnRUcmFjay0tO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICB9XG5cbiAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgaWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgICAvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblxuICAgIC8vIGZvcndhcmQgZnVuY3Rpb25cbiAgICBmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAvLyBidXR0b24gYW5pbTFcbiAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICB9O1xuXG4gICAgICB2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcbiAgICAgIH07XG5cbiAgICAgIGFuaW0xKCk7XG5cbiAgICAgIGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuICAgICAgICBjdXJyZW50VHJhY2sgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY3VycmVudFRyYWNrKys7XG4gICAgICB9XG5cbiAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgaWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuICAgIGZ1bmN0aW9uIHRpdGxlVXBkYXRlKCl7XG4gICAgICB0cmFja3RpdGxlLm5vZGUuaW5uZXJIVE1MID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcbiAgICB9XG5cbiAgICAvLyAqKioqKioqKiBSZWNvcmRlciAqKioqKioqIC8vXG4gICAgZnVuY3Rpb24gX19sb2coZSwgZGF0YSkge1xuICAgICAgbG9nVGV4dC5ub2RlLmlubmVySFRNTCA9IFwiXFxuXCIgKyBlICsgXCIgXCIgKyAoZGF0YSB8fCAnJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnRVc2VyTWVkaWEoc3RyZWFtKSB7XG4gICAgICB2YXIgaW5wdXQgPSBhdWRpb19jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG4gICAgICBjb25zb2xlLmxvZygnTWVkaWEgc3RyZWFtIGNyZWF0ZWQuJyk7XG5cbiAgICAgIHJlY29yZGVyID0gbmV3IFJlY29yZGVyKGlucHV0KTtcbiAgICAgIF9fbG9nKCdSZWFkeSEnKTtcbiAgICB9XG5cbiAgICAvLyByZWMgZnVuY3Rpb25cbiAgICByZWMuY2xpY2soZnVuY3Rpb24ob2spIHtcblxuICAgICAgaWYgKCF4UmVjKXsgLy9pcyBub3QgcmVjb3JkaW5nXG5cbiAgICAgICAgcmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuICAgICAgICBpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcbiAgICAgICAgICB3aGVlbEFuaW1hdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgeFJlYyA9IHRydWU7XG5cbiAgICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIucmVjb3JkKCk7XG5cbiAgICAgICAgX19sb2coJ1JlY29yZGluZy4uLicpO1xuXG4gICAgICB9ICBlbHNlIHsgLy9zdG9wIHJlY29yZGluZ1xuXG4gICAgICAgIHJlY1N0b3AoKTtcblxuICAgICAgICBpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblxuICAgICAgICAgIHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIuc3RvcCgpO1xuXG4gICAgICAgIF9fbG9nKCdTdG9wcGVkIHJlYy4nKTtcblxuICAgICAgICAvLyBjcmVhdGUgV0FWIGRvd25sb2FkIGxpbmsgdXNpbmcgYXVkaW8gZGF0YSBibG9iXG4gICAgICAgIGNyZWF0ZURvd25sb2FkTGluaygpO1xuXG4gICAgICAgIHJlY29yZGVyLmNsZWFyKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIHJlYyBmdW5jdGlvblxuXG4gICAgZnVuY3Rpb24gY3JlYXRlRG93bmxvYWRMaW5rKCkge1xuICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIuZXhwb3J0V0FWKGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgICAgdmFyIHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIHZhciBhdSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgICAgIHZhciBoZiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblxuXG4gICAgICAgIGF1LmNvbnRyb2xzID0gdHJ1ZTtcbiAgICAgICAgYXUuc3JjID0gdXJsO1xuICAgICAgICBoZi5ocmVmID0gdXJsO1xuICAgICAgICBoZi5kb3dubG9hZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSArICcud2F2JztcbiAgICAgICAgaGYuaW5uZXJIVE1MID0gaGYuZG93bmxvYWQ7XG5cbiAgICAgICAgdmFyIHRyYWNrVVJMID0gaGYuZG93bmxvYWQ7XG5cbiAgICAgICAgdmFyIHJlY29yZGluZ0VsZW1lbnQgPSBhbmd1bGFyLmVsZW1lbnQoJzxsaSBjbGFzcz1cIm1kbC1saXN0X19pdGVtXCI+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1wcmltYXJ5LWNvbnRlbnRcIiA+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBtZGwtbGlzdF9faXRlbS1pY29uXCI+bWljPC9pPicgKyB0cmFja1VSTCArICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1zZWNvbmRhcnktYWN0aW9uXCI+PGEgY2xhc3M9XCJtZGwtYnV0dG9uIG1kbC1qcy1idXR0b24gbWRsLWJ1dHRvbi0tYWNjZW50XCIgaHJlZj1cIicgKyB1cmwgKyAnXCJcIiBkb3dubG9hZD5Eb3dubG9hZCA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+ZmlsZV9kb3dubG9hZDwvaT48L2E+PC9zcGFuPjwvbGk+Jyk7XG5cbiAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZWNvcmRpbmdzbGlzdCcpKS5hcHBlbmQocmVjb3JkaW5nRWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIHdlYmtpdCBzaGltXG4gICAgICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPSAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhKTsgLy90aGlzIHdpbGwgc2V0IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgdG8gd2hhdGV2ZXIgaXQgZGV0ZWN0cyB0byBiZSB0aGUgcHJvcGVyIHByZWZpeGVkIHZlcnNpb24uXG4gICAgICAgIHdpbmRvdy5VUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkw7XG5cbiAgICAgICAgYXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG4gICAgICAgIC8vY29uc29sZS5sb2coKCdBdWRpbyBjb250ZXh0IHNldCB1cC4nKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbmF2aWdhdG9yLmdldFVzZXJNZWRpYSAnICsgKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPyAnYXZhaWxhYmxlLicgOiAnbm90IHByZXNlbnQhJykpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBfX2xvZygnSnVzdCB3b3JrIG9uIGNocm9tZSEnKTtcbiAgICAgIH1cblxuICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBfX2xvZygnTm8gbGl2ZSBhdWRpbyBpbnB1dDogJyArIGUpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBza2V0Y2ggPSBmdW5jdGlvbihub2lzZVdhdmUpIHtcblxuICAgICAgdmFyIHVybCxcbiAgICBcdFx0bXlDYW52YXMsXG4gICAgXHRcdGNvdW50ZXIgPSAwLFxuICAgIFx0XHRzdGFydGluZ0FuZ2xlPTcsXG4gICAgXHRcdGdvUmlnaHQgPSB0cnVlLFxuICAgIFx0XHRzdGFydFVwID0gdHJ1ZSxcbiAgICBcdFx0bXlGcmFtZVJhdGUgPSAzMCxcbiAgICBcdFx0cnVubmluZyA9IHRydWU7XG5cbiAgICAgIG5vaXNlV2F2ZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIG15Q2FudmFzID0gbm9pc2VXYXZlLmNyZWF0ZUNhbnZhcyhzY3JlZW4ud2lkdGgsIDUwMCk7XG4gICAgICAgIG15Q2FudmFzLnBhcmVudCgnY2Fzc2V0ZS1wbGF5ZXItY3QnKTtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gQXVkaW8gaW5wdXRcbiAgICAgICAgbWljID0gbmV3IHA1LkF1ZGlvSW4oKTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgQXVkaW8gSW5wdXQuXG4gICAgICAgIG1pYy5zdGFydCgpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIHNvdW5kIHJlY29yZGVyXG4gICAgICAgIHJlY29yZGVyID0gbmV3IHA1LlNvdW5kUmVjb3JkZXIoKTtcblxuICAgICAgICAvLyBjb25uZWN0IHRoZSBtaWMgdG8gdGhlIHJlY29yZGVyXG4gICAgICAgIHJlY29yZGVyLnNldElucHV0KG1pYyk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGFuIGVtcHR5IHNvdW5kIGZpbGUgdGhhdCB3ZSB3aWxsIHVzZSB0byBwbGF5YmFjayB0aGUgcmVjb3JkaW5nXG4gICAgICAgIHNvdW5kRmlsZSA9IG5ldyBwNS5Tb3VuZEZpbGUoKTtcbiAgICAgIH07XG5cbiAgICAgIG5vaXNlV2F2ZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIHlvZmYgPSAwLjA7XG4gICAgICAgIC8vIEdldCB0aGUgb3ZlcmFsbCB2b2x1bWUgKGJldHdlZW4gMCBhbmQgMS4wKVxuICAgICAgICB2YXIgdm9sID0gbWljLmdldExldmVsKCk7XG5cbiAgICAgICAgbm9pc2VXYXZlLmJhY2tncm91bmQoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIG5vaXNlV2F2ZS5zdHJva2UoMjUsIDIwMiwgMTQ0KTtcbiAgICAgICAgbm9pc2VXYXZlLmZpbGwoMjUsIDIwMiwgMTQ0KTtcblxuICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gZHJhdyBhIHBvbHlnb24gb3V0IG9mIHRoZSB3YXZlIHBvaW50c1xuICAgICAgICBub2lzZVdhdmUuYmVnaW5TaGFwZSgpO1xuXG4gICAgICAgIHZhciB4b2ZmID0gMDsgICAgICAgLy8gT3B0aW9uICMxOiAyRCBOb2lzZVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgb3ZlciBob3Jpem9udGFsIHBpeGVsc1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8PSBzY3JlZW4ud2lkdGg7IHggKz0gMTApIHtcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgYSB5IHZhbHVlIGFjY29yZGluZyB0byBub2lzZSwgbWFwIHRvXG5cbiAgICAgICAgICAvL21hcCh2YWx1ZSxzdGFydDEsc3RvcDEsc3RhcnQyLHN0b3AyKVxuICAgICAgICAgIHZhciB5ID0gbm9pc2VXYXZlLm1hcChub2lzZVdhdmUubm9pc2UoeG9mZiwgeW9mZiksIDAsIDEsIDIwMCwzMDApO1xuXG4gICAgICAgICAgLy8gU2V0IHRoZSB2ZXJ0ZXhcbiAgICAgICAgICBub2lzZVdhdmUudmVydGV4KHgsIHkpO1xuICAgICAgICAgIC8vIEluY3JlbWVudCB4IGRpbWVuc2lvbiBmb3Igbm9pc2VcbiAgICAgICAgICB4b2ZmICs9IHZvbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBpbmNyZW1lbnQgeSBkaW1lbnNpb24gZm9yIG5vaXNlXG4gICAgICAgIHlvZmYgKz0gdm9sO1xuICAgICAgICBub2lzZVdhdmUudmVydGV4KHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCk7XG4gICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoMCwgc2NyZWVuLmhlaWdodCk7XG4gICAgICAgIG5vaXNlV2F2ZS5lbmRTaGFwZShub2lzZVdhdmUuQ0xPU0UpO1xuICAgICAgfTtcblxuICAgIH07Ly8gdmFyIHNrZXRjaFxuXG4gICAgdmFyIG15UDUgPSBuZXcgcDUoc2tldGNoKTtcblxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=