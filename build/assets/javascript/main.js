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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2Nhc3NldHRlQXBwJywgW10pXG5cbi5jb250cm9sbGVyKCdjYXNzZXR0ZUNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICR3aW5kb3cpe1xuXG4gIHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG4gICAgeFJlYyA9IGZhbHNlLFxuICAgIGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG4gICAgcGxheVBhdXNlID0gU25hcCgnI3BsYXlQYXVzZScpLFxuICAgIHBsYXlTdGF0ZSA9IFNuYXAoJyNwbGF5U3RhdGUnKSxcbiAgICBwYXVzZVN0YXRlID0gU25hcCgnI3BhdXNlU3RhdGUnKSxcbiAgICBwbGF5QWN0aXZlID0gZmFsc2UsXG4gICAgZm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG4gICAgd2hlZWxMID0gU25hcCgnI3doZWVsLWwnKSxcbiAgICB3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuICAgIHRhcGUgPSBTbmFwKCcjdGFwZScpLFxuICAgIHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG4gICAgdGFwZVIgPSBTbmFwKCcjdGFwZVInKSxcbiAgICBsb2dUZXh0ID0gU25hcCgnI3JlY29yZGluZ1RleHQgdHNwYW4nKSxcbiAgICB0cmFja3RpdGxlID0gU25hcCgnI3RyYWNrdGl0bGUgdHNwYW4nKSxcbiAgICBidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3NyxcbiAgICBidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3NyxcbiAgICBiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcbiAgICBiYm94UiA9IHRhcGVSLmdldEJCb3goKSxcbiAgICBhdWRpbyA9IG5ldyBBdWRpbygpLFxuICAgIGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG4gICAgcGxheWxpc3QgPSBbJ2RpcnR5X3NvdXRoX2xvb3BfODVicG0nLCAncG9wX2hpcGhvcF9sb29wXzEwMGJwbSddLFxuICAgIGRpciA9IFwiYXVkaW8vXCIsXG4gICAgZXh0ID0gXCIubXAzXCIsXG4gICAgaW5wdXQsXG4gICAgYW5hbHl6ZXIsXG4gICAgY3VycmVudFRyYWNrID0gMCxcbiAgICBzZWVrc2xpZGVyLFxuICAgIHNlZWtpbmc9ZmFsc2UsXG4gICAgYXVkaW9fY29udGV4dCxcbiAgICByZWNvcmRlcixcbiAgICBzZWVrdG87XG5cbiAgICB2YXIgbWljLCBzb3VuZEZpbGU7XG5cbiAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuICAgIC8vIEF1ZGlvIE9iamVjdFxuICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFswXStleHQ7XG5cbiAgICBzZWVrc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWVrc2xpZGVyXCIpO1xuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY3VycmVudFRpbWUgPSAwO1xuICAgICAgdGhpcy5wbGF5KCk7XG4gICAgfSwgZmFsc2UpO1xuXG5cbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKFwidHJhY2t0aXRsZVwiLCBmdW5jdGlvbigpeyB0aXRsZVVwZGF0ZSgpOyB9KTtcblxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25MKCkge1xuICAgICAgd2hlZWxMLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwzMCwzMCd9LCAyMDAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgd2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG4gICAgICAgICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcbiAgICBmdW5jdGlvbiB3aGVlbEFuaW1hdGlvblIoKSB7XG4gICAgICB3aGVlbFIuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDI3MCwzMCd9LCAyMDAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgd2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuICAgICAgICAgICAgd2hlZWxBbmltYXRpb25SKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuICAgIGZ1bmN0aW9uIHRhcGVBbmltYXRpb25MKCkge1xuICAgICAgdGFwZUwuYW5pbWF0ZSh7IGN4OiAnOTAuMzg5Myd9LCA1MDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0YXBlTC5hdHRyKHsgY3g6ICc5Mi4zODkzJ30pO1xuICAgICAgICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcbiAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uUigpIHtcbiAgICAgIHRhcGVSLmFuaW1hdGUoeyBjeDogJzMzMC4zODknfSwgNTAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGFwZVIuYXR0cih7IGN4OiAnMzI4LjM4OSd9KTtcbiAgICAgICAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbigpIHtcbiAgICAgIHdoZWVsQW5pbWF0aW9uUigpO1xuICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICB0YXBlQW5pbWF0aW9uTCgpO1xuICAgICAgdGFwZUFuaW1hdGlvblIoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdG9wV2hlZWxBbmltYXRpb24oKSB7XG4gICAgICB3aGVlbEwuc3RvcCgpO1xuICAgICAgd2hlZWxSLnN0b3AoKTtcbiAgICAgIHRhcGVMLnN0b3AoKTtcbiAgICAgIHRhcGVSLnN0b3AoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWNTdG9wKCkge1xuICAgICAgcmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHhSZWMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwbGF5U3RvcCgpIHtcbiAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcbiAgICAgIGZvcndhcmQudHJhbnNmb3JtKCd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICBzdG9wQW5pbWF0aW9uKCk7XG4gICAgICBYRm9yd2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICBmdW5jdGlvbiBuZXh0VHJhY2sgKCkge1xuXG4gICAgICBpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcbiAgICAgICAgY3VycmVudFRyYWNrID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFRyYWNrKys7XG4gICAgICB9XG5cbiAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgdGl0bGVVcGRhdGUoKTtcblxuXG4gICAgICBhdWRpby5wbGF5KCk7XG5cbiAgICB9XG5cbiAgICAvLyBwbGF5IGZ1bmN0aW9uXG4gICAgcGxheVBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZihhdWRpby5wYXVzZWQpIHtcblxuICAgICAgICAvLyBwbGF5IHN0YXRlXG5cbiAgICAgICAgcGxheUFjdGl2ZSA9IHRydWU7XG5cbiAgICAgICAgcGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG4gICAgICAgIC8vY29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cbiAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIG5vdCByZWNvcmRpbmdcbiAgICAgICAgICB3aGVlbEFuaW1hdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcblxuICAgICAgICAgIC8vYXVkaW8ucGxheSgpO1xuICAgICAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vIHBhdXNlIHN0YXRlXG5cbiAgICAgICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG5cbiAgICAgICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgICBwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuICAgICAgICAgIC8vY29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cbiAgICAgICAgICBhdWRpby5wYXVzZSgpO1xuXG4gICAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgICBzdG9wV2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIHBsYXkgZnVuY3Rpb25cblxuICAgIC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG4gICAgYmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgdmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgfTtcblxuICAgICAgYW5pbTEoKTtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuICAgICAgICBjdXJyZW50VHJhY2stLTtcblxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIGN1cnJlbnRUcmFjayA9IChwbGF5bGlzdC5sZW5ndGggLSAxKTtcblxuICAgICAgfVxuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgIGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcbiAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgfVxuXG4gICAgfSk7XG4gICAgLy8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cbiAgICAvLyBmb3J3YXJkIGZ1bmN0aW9uXG4gICAgZm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgLy8gYnV0dG9uIGFuaW0xXG4gICAgICB2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG4gICAgICB9O1xuXG4gICAgICBhbmltMSgpO1xuXG4gICAgICBpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcbiAgICAgICAgY3VycmVudFRyYWNrID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFRyYWNrKys7XG4gICAgICB9XG5cbiAgICAgIC8vY29uc29sZS5sb2coJ2Z3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgIGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcbiAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCBmb3J3YXJkIGZ1bmN0aW9uXG5cbiAgICBmdW5jdGlvbiB0aXRsZVVwZGF0ZSgpe1xuICAgICAgdHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG4gICAgfVxuXG4gICAgLy8gKioqKioqKiogUmVjb3JkZXIgKioqKioqKiAvL1xuICAgIGZ1bmN0aW9uIF9fbG9nKGUsIGRhdGEpIHtcbiAgICAgIGxvZ1RleHQubm9kZS5pbm5lckhUTUwgPSBcIlxcblwiICsgZSArIFwiIFwiICsgKGRhdGEgfHwgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0VXNlck1lZGlhKHN0cmVhbSkge1xuICAgICAgdmFyIGlucHV0ID0gYXVkaW9fY29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShzdHJlYW0pO1xuICAgICAgX19sb2coJ01lZGlhIHN0cmVhbSBjcmVhdGVkLicpO1xuICAgICAgLy8gVW5jb21tZW50IGlmIHlvdSB3YW50IHRoZSBhdWRpbyB0byBmZWVkYmFjayBkaXJlY3RseVxuICAgICAgLy9pbnB1dC5jb25uZWN0KGF1ZGlvX2NvbnRleHQuZGVzdGluYXRpb24pO1xuICAgICAgLy9fX2xvZygnSW5wdXQgY29ubmVjdGVkIHRvIGF1ZGlvIGNvbnRleHQgZGVzdGluYXRpb24uJyk7XG5cbiAgICAgIHJlY29yZGVyID0gbmV3IFJlY29yZGVyKGlucHV0KTtcbiAgICAgIF9fbG9nKCdSZWFkeSEnKTtcbiAgICB9XG5cbiAgICAvLyByZWMgZnVuY3Rpb25cbiAgICByZWMuY2xpY2soZnVuY3Rpb24ob2spIHtcblxuICAgICAgaWYgKCF4UmVjKXsgLy9pcyBub3QgcmVjb3JkaW5nXG5cbiAgICAgICAgcmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuICAgICAgICAvLyB3aGVlbHMgZXZlbnRzXG5cbiAgICAgICAgaWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHhSZWMgPSB0cnVlO1xuXG4gICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnJlY29yZCgpO1xuXG4gICAgICAgIF9fbG9nKCdSZWNvcmRpbmcuLi4nKTtcblxuICAgICAgfSAgZWxzZSB7IC8vc3RvcCByZWNvcmRpbmdcbiAgICAgICAgcmVjU3RvcCgpO1xuXG4gICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG4gICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5zdG9wKCk7XG5cbiAgICAgICAgX19sb2coJ1N0b3BwZWQgcmVjb3JkaW5nLicpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBXQVYgZG93bmxvYWQgbGluayB1c2luZyBhdWRpbyBkYXRhIGJsb2JcbiAgICAgICAgY3JlYXRlRG93bmxvYWRMaW5rKCk7XG5cbiAgICAgICAgcmVjb3JkZXIuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkTGluaygpIHtcbiAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLmV4cG9ydFdBVihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgIHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICB2YXIgYXUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuICAgICAgICB2YXIgaGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cblxuICAgICAgICBhdS5jb250cm9scyA9IHRydWU7XG4gICAgICAgIGF1LnNyYyA9IHVybDtcbiAgICAgICAgaGYuaHJlZiA9IHVybDtcbiAgICAgICAgaGYuZG93bmxvYWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgKyAnLndhdic7XG4gICAgICAgIGhmLmlubmVySFRNTCA9IGhmLmRvd25sb2FkO1xuICAgICAgICAvL2xpLmFwcGVuZENoaWxkKGF1KTsgLy8gSSBkb24ndCB3YW50IHRoZSBkZWZhdWx0IGJyb3dzZXIgcGxheWVyLlxuXG5cbiAgICAgICAgdmFyIHRyYWNrVVJMID0gaGYuZG93bmxvYWQ7XG5cbiAgICAgICAgY29uc29sZS5sb2codXJsKTtcbiAgICAgICAgbGkuYXBwZW5kQ2hpbGQoaGYpOyAvLyBpIGp1c3Qgd2FudCB0aGUgbGluayBvZiB0aGUgcmVjb3JkZWQgYXVkaW8gdG8gZG93bmxvYWRcblxuICAgICAgICAvL3JlY29yZGluZ3NsaXN0LmFwcGVuZENoaWxkKGxpKTtcblxuXG4gICAgICAgIHZhciBteUVsZW1lbnQgPSBhbmd1bGFyLmVsZW1lbnQoJzxsaSBjbGFzcz1cIm1kbC1saXN0X19pdGVtXCI+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1wcmltYXJ5LWNvbnRlbnRcIiA+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBtZGwtbGlzdF9faXRlbS1pY29uXCI+bWljPC9pPicgKyB0cmFja1VSTCArICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1zZWNvbmRhcnktYWN0aW9uXCI+PGEgY2xhc3M9XCJtZGwtYnV0dG9uIG1kbC1qcy1idXR0b24gbWRsLWJ1dHRvbi0tYWNjZW50XCIgaHJlZj1cIicgKyB1cmwgKyAnXCJcIiBkb3dubG9hZD5Eb3dubG9hZCA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+ZmlsZV9kb3dubG9hZDwvaT48L2E+PC9zcGFuPjwvbGk+Jyk7XG5cbiAgICAgICAgYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyZWNvcmRpbmdzbGlzdCcpKS5hcHBlbmQobXlFbGVtZW50KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gd2Via2l0IHNoaW1cbiAgICAgICAgd2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcbiAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubXNHZXRVc2VyTWVkaWEpOyAvL3RoaXMgd2lsbCBzZXQgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB0byB3aGF0ZXZlciBpdCBkZXRlY3RzIHRvIGJlIHRoZSBwcm9wZXIgcHJlZml4ZWQgdmVyc2lvbi5cbiAgICAgICAgd2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcblxuICAgICAgICBhdWRpb19jb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dDtcbiAgICAgICAgX19sb2coJ0F1ZGlvIGNvbnRleHQgc2V0IHVwLicpO1xuICAgICAgICBfX2xvZygnbmF2aWdhdG9yLmdldFVzZXJNZWRpYSAnICsgKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPyAnYXZhaWxhYmxlLicgOiAnbm90IHByZXNlbnQhJykpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBfX2xvZygnSnVzdCB3b3JrIGluIGNocm9tZSEnKTtcbiAgICAgIH1cblxuICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBfX2xvZygnTm8gbGl2ZSBhdWRpbyBpbnB1dDogJyArIGUpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBza2V0Y2ggPSBmdW5jdGlvbihub2lzZVdhdmUpIHtcblxuICAgICAgdmFyIHVybDtcbiAgXHRcdHZhciBteUNhbnZhcztcbiAgXHRcdHZhciBjb3VudGVyID0gMDtcbiAgXHRcdHZhciBzdGFydGluZ0FuZ2xlPTc7XG4gIFx0XHR2YXIgZ29SaWdodCA9IHRydWU7XG4gIFx0XHR2YXIgc3RhcnRVcCA9IHRydWU7XG4gIFx0XHR2YXIgbXlGcmFtZVJhdGUgPSAzMDtcbiAgXHRcdHZhciBydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgbm9pc2VXYXZlLnNldHVwID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgbXlDYW52YXMgPSBub2lzZVdhdmUuY3JlYXRlQ2FudmFzKHNjcmVlbi53aWR0aCwgNTAwKTtcbiAgICAgICAgbXlDYW52YXMucGFyZW50KCdjYXNzZXRlLXBsYXllci1jdCcpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBBdWRpbyBpbnB1dFxuICAgICAgICBtaWMgPSBuZXcgcDUuQXVkaW9JbigpO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSBBdWRpbyBJbnB1dC5cbiAgICAgICAgbWljLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgc291bmQgcmVjb3JkZXJcbiAgICAgICAgcmVjb3JkZXIgPSBuZXcgcDUuU291bmRSZWNvcmRlcigpO1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdGhlIG1pYyB0byB0aGUgcmVjb3JkZXJcbiAgICAgICAgcmVjb3JkZXIuc2V0SW5wdXQobWljKTtcblxuICAgICAgICAvLyBjcmVhdGUgYW4gZW1wdHkgc291bmQgZmlsZSB0aGF0IHdlIHdpbGwgdXNlIHRvIHBsYXliYWNrIHRoZSByZWNvcmRpbmdcbiAgICAgICAgc291bmRGaWxlID0gbmV3IHA1LlNvdW5kRmlsZSgpO1xuICAgICAgfTtcblxuICAgICAgbm9pc2VXYXZlLmRyYXcgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgeW9mZiA9IDAuMDtcbiAgICAgICAgLy8gR2V0IHRoZSBvdmVyYWxsIHZvbHVtZSAoYmV0d2VlbiAwIGFuZCAxLjApXG4gICAgICAgIHZhciB2b2wgPSBtaWMuZ2V0TGV2ZWwoKTtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKCd2b2w6ICcgKyB2b2wpO1xuXG4gICAgICAgIG5vaXNlV2F2ZS5iYWNrZ3JvdW5kKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBub2lzZVdhdmUuc3Ryb2tlKDI1LCAyMDIsIDE0NCk7XG4gICAgICAgIG5vaXNlV2F2ZS5maWxsKDI1LCAyMDIsIDE0NCk7XG5cbiAgICAgICAgLy8gV2UgYXJlIGdvaW5nIHRvIGRyYXcgYSBwb2x5Z29uIG91dCBvZiB0aGUgd2F2ZSBwb2ludHNcbiAgICAgICAgbm9pc2VXYXZlLmJlZ2luU2hhcGUoKTtcblxuICAgICAgICB2YXIgeG9mZiA9IDA7ICAgICAgIC8vIE9wdGlvbiAjMTogMkQgTm9pc2VcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgaG9yaXpvbnRhbCBwaXhlbHNcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gc2NyZWVuLndpZHRoOyB4ICs9IDEwKSB7XG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIGEgeSB2YWx1ZSBhY2NvcmRpbmcgdG8gbm9pc2UsIG1hcCB0b1xuXG4gICAgICAgICAgLy8gT3B0aW9uICMxOiAyRCBOb2lzZVxuICAgICAgICAgIC8vbWFwKHZhbHVlLHN0YXJ0MSxzdG9wMSxzdGFydDIsc3RvcDIpXG4gICAgICAgICAgdmFyIHkgPSBub2lzZVdhdmUubWFwKG5vaXNlV2F2ZS5ub2lzZSh4b2ZmLCB5b2ZmKSwgMCwgMSwgMjAwLDMwMCk7XG5cbiAgICAgICAgICAvLyBTZXQgdGhlIHZlcnRleFxuICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoeCwgeSk7XG4gICAgICAgICAgLy8gSW5jcmVtZW50IHggZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICAgIHhvZmYgKz0gdm9sO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluY3JlbWVudCB5IGRpbWVuc2lvbiBmb3Igbm9pc2VcbiAgICAgICAgeW9mZiArPSB2b2w7XG4gICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLnZlcnRleCgwLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLmVuZFNoYXBlKG5vaXNlV2F2ZS5DTE9TRSk7XG4gICAgICB9O1xuXG4gICAgfTsvLyB2YXIgc2tldGNoXG5cbiAgICB2YXIgbXlQNSA9IG5ldyBwNShza2V0Y2gpO1xuXG5cblxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=