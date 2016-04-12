angular.module('cassetteApp', [])
.controller('cassetteController', function($scope){

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
    rec.click(function() {

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


        li.appendChild(hf); // i just want the link of the recorded audio to download

        recordingslist.appendChild(li);

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
        alert('No web audio support in this browser!');
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
          var y = noiseWave.map(noiseWave.noise(xoff, yoff), 0, 1, 100,400);

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
    };

    var myP5 = new p5(sketch);

});


	

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVaQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdjYXNzZXR0ZUFwcCcsIFtdKVxuLmNvbnRyb2xsZXIoJ2Nhc3NldHRlQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSl7XG5cbiAgdmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcbiAgICB4UmVjID0gZmFsc2UsXG4gICAgYmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcbiAgICBwbGF5UGF1c2UgPSBTbmFwKCcjcGxheVBhdXNlJyksXG4gICAgcGxheVN0YXRlID0gU25hcCgnI3BsYXlTdGF0ZScpLFxuICAgIHBhdXNlU3RhdGUgPSBTbmFwKCcjcGF1c2VTdGF0ZScpLFxuICAgIHBsYXlBY3RpdmUgPSBmYWxzZSxcbiAgICBmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcbiAgICB3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuICAgIHdoZWVsUiA9IFNuYXAoJyN3aGVlbC1yJyksXG4gICAgdGFwZSA9IFNuYXAoJyN0YXBlJyksXG4gICAgdGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcbiAgICB0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuICAgIGxvZ1RleHQgPSBTbmFwKCcjcmVjb3JkaW5nVGV4dCB0c3BhbicpLFxuICAgIHRyYWNrdGl0bGUgPSBTbmFwKCcjdHJhY2t0aXRsZSB0c3BhbicpLFxuICAgIGJ1dHRvbllwb3NpdGlvbiA9IDAuNjc5NDc3LFxuICAgIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuICAgIGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuICAgIGJib3hSID0gdGFwZVIuZ2V0QkJveCgpLFxuICAgIGF1ZGlvID0gbmV3IEF1ZGlvKCksXG4gICAgZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcbiAgICBwbGF5bGlzdCA9IFsnZGlydHlfc291dGhfbG9vcF84NWJwbScsICdwb3BfaGlwaG9wX2xvb3BfMTAwYnBtJ10sXG4gICAgZGlyID0gXCJhdWRpby9cIixcbiAgICBleHQgPSBcIi5tcDNcIixcbiAgICBpbnB1dCxcbiAgICBhbmFseXplcixcbiAgICBjdXJyZW50VHJhY2sgPSAwLFxuICAgIHNlZWtzbGlkZXIsXG4gICAgc2Vla2luZz1mYWxzZSxcbiAgICBhdWRpb19jb250ZXh0LFxuICAgIHJlY29yZGVyLFxuICAgIHNlZWt0bztcblxuICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXG4gICAgLy8gQXVkaW8gT2JqZWN0XG4gICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0WzBdK2V4dDtcblxuICAgIHNlZWtzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlZWtzbGlkZXJcIik7XG5cbiAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jdXJyZW50VGltZSA9IDA7XG4gICAgICB0aGlzLnBsYXkoKTtcbiAgICB9LCBmYWxzZSk7XG5cblxuICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7IHRpdGxlVXBkYXRlKCk7IH0pO1xuXG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICBmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG4gICAgICB3aGVlbEwuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDMwLDMwJ30sIDIwMDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uTCgpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcbiAgICAgIHdoZWVsUi5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMjcwLDMwJ30sIDIwMDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG4gICAgICAgICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG4gICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvbkwoKSB7XG4gICAgICB0YXBlTC5hbmltYXRlKHsgY3g6ICc5MC4zODkzJ30sIDUwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRhcGVMLmF0dHIoeyBjeDogJzkyLjM4OTMnfSk7XG4gICAgICAgICAgICB0YXBlQW5pbWF0aW9uTCgpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgIGZ1bmN0aW9uIHRhcGVBbmltYXRpb25SKCkge1xuICAgICAgdGFwZVIuYW5pbWF0ZSh7IGN4OiAnMzMwLjM4OSd9LCA1MDAsXG4gICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0YXBlUi5hdHRyKHsgY3g6ICczMjguMzg5J30pO1xuICAgICAgICAgICAgdGFwZUFuaW1hdGlvblIoKTtcbiAgICAgICAgICB9XG4gICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgd2hlZWxBbmltYXRpb25SKCk7XG4gICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICB0YXBlQW5pbWF0aW9uUigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0b3BXaGVlbEFuaW1hdGlvbigpIHtcbiAgICAgIHdoZWVsTC5zdG9wKCk7XG4gICAgICB3aGVlbFIuc3RvcCgpO1xuICAgICAgdGFwZUwuc3RvcCgpO1xuICAgICAgdGFwZVIuc3RvcCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG4gICAgICByZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgeFJlYyA9IGZhbHNlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZvcndhcmRTdG9wKCkge1xuICAgICAgZm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHN0b3BBbmltYXRpb24oKTtcbiAgICAgIFhGb3J3YXJkID0gZmFsc2U7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5leHRUcmFjayAoKSB7XG5cbiAgICAgIGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuICAgICAgICBjdXJyZW50VHJhY2sgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG5cbiAgICAgIGF1ZGlvLnBsYXkoKTtcblxuICAgIH1cblxuICAgIC8vIHBsYXkgZnVuY3Rpb25cbiAgICBwbGF5UGF1c2UuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIGlmKGF1ZGlvLnBhdXNlZCkge1xuXG4gICAgICAgIC8vIHBsYXkgc3RhdGVcblxuICAgICAgICBwbGF5QWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICBwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cbiAgICAgICAgLy9jb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuICAgICAgICBpZiAoIXhSZWMpIHsgLy8gaXMgbm90IHJlY29yZGluZ1xuICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cbiAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgICAgLy9hdWRpby5wbGF5KCk7XG4gICAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgLy8gcGF1c2Ugc3RhdGVcblxuICAgICAgICAgIHBsYXlBY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG4gICAgICAgICAgLy9jb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuICAgICAgICAgIGF1ZGlvLnBhdXNlKCk7XG5cbiAgICAgICAgICBpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcbiAgICAgICAgICAgIHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgcGxheSBmdW5jdGlvblxuXG4gICAgLy8gYmFja3dhcmQgZnVuY3Rpb25cbiAgICBiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgLy8gYnV0dG9uIGFuaW0xXG4gICAgICB2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuICAgICAgfTtcblxuICAgICAgdmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG4gICAgICB9O1xuXG4gICAgICBhbmltMSgpO1xuXG4gICAgICBpZihjdXJyZW50VHJhY2sgPiAwICkge1xuXG4gICAgICAgIGN1cnJlbnRUcmFjay0tO1xuXG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG4gICAgICB9XG5cbiAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgaWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICB9XG5cbiAgICB9KTtcbiAgICAvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblxuICAgIC8vIGZvcndhcmQgZnVuY3Rpb25cbiAgICBmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAvLyBidXR0b24gYW5pbTFcbiAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICB9O1xuXG4gICAgICB2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcbiAgICAgIH07XG5cbiAgICAgIGFuaW0xKCk7XG5cbiAgICAgIGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuICAgICAgICBjdXJyZW50VHJhY2sgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgIH1cblxuICAgICAgLy9jb25zb2xlLmxvZygnZncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cbiAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgaWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuICAgIGZ1bmN0aW9uIHRpdGxlVXBkYXRlKCl7XG4gICAgICB0cmFja3RpdGxlLm5vZGUuaW5uZXJIVE1MID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcbiAgICB9XG5cbiAgICAvLyAqKioqKioqKiBSZWNvcmRlciAqKioqKioqIC8vXG4gICAgZnVuY3Rpb24gX19sb2coZSwgZGF0YSkge1xuICAgICAgbG9nVGV4dC5ub2RlLmlubmVySFRNTCA9IFwiXFxuXCIgKyBlICsgXCIgXCIgKyAoZGF0YSB8fCAnJyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RhcnRVc2VyTWVkaWEoc3RyZWFtKSB7XG4gICAgICB2YXIgaW5wdXQgPSBhdWRpb19jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG4gICAgICBfX2xvZygnTWVkaWEgc3RyZWFtIGNyZWF0ZWQuJyk7XG4gICAgICAvLyBVbmNvbW1lbnQgaWYgeW91IHdhbnQgdGhlIGF1ZGlvIHRvIGZlZWRiYWNrIGRpcmVjdGx5XG4gICAgICAvL2lucHV0LmNvbm5lY3QoYXVkaW9fY29udGV4dC5kZXN0aW5hdGlvbik7XG4gICAgICAvL19fbG9nKCdJbnB1dCBjb25uZWN0ZWQgdG8gYXVkaW8gY29udGV4dCBkZXN0aW5hdGlvbi4nKTtcblxuICAgICAgcmVjb3JkZXIgPSBuZXcgUmVjb3JkZXIoaW5wdXQpO1xuICAgICAgX19sb2coJ1JlYWR5IScpO1xuICAgIH1cblxuICAgIC8vIHJlYyBmdW5jdGlvblxuICAgIHJlYy5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgaWYgKCF4UmVjKXsgLy9pcyBub3QgcmVjb3JkaW5nXG5cbiAgICAgICAgcmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuICAgICAgICAvLyB3aGVlbHMgZXZlbnRzXG5cbiAgICAgICAgaWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHhSZWMgPSB0cnVlO1xuXG4gICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnJlY29yZCgpO1xuXG4gICAgICAgIF9fbG9nKCdSZWNvcmRpbmcuLi4nKTtcblxuICAgICAgfSAgZWxzZSB7IC8vc3RvcCByZWNvcmRpbmdcbiAgICAgICAgcmVjU3RvcCgpO1xuXG4gICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG4gICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5zdG9wKCk7XG5cbiAgICAgICAgX19sb2coJ1N0b3BwZWQgcmVjb3JkaW5nLicpO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBXQVYgZG93bmxvYWQgbGluayB1c2luZyBhdWRpbyBkYXRhIGJsb2JcbiAgICAgICAgY3JlYXRlRG93bmxvYWRMaW5rKCk7XG5cbiAgICAgICAgcmVjb3JkZXIuY2xlYXIoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEb3dubG9hZExpbmsoKSB7XG4gICAgICByZWNvcmRlciAmJiByZWNvcmRlci5leHBvcnRXQVYoZnVuY3Rpb24oYmxvYikge1xuICAgICAgICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgdmFyIGF1ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcbiAgICAgICAgdmFyIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG5cbiAgICAgICAgYXUuY29udHJvbHMgPSB0cnVlO1xuICAgICAgICBhdS5zcmMgPSB1cmw7XG4gICAgICAgIGhmLmhyZWYgPSB1cmw7XG4gICAgICAgIGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuICAgICAgICBoZi5pbm5lckhUTUwgPSBoZi5kb3dubG9hZDtcbiAgICAgICAgLy9saS5hcHBlbmRDaGlsZChhdSk7IC8vIEkgZG9uJ3Qgd2FudCB0aGUgZGVmYXVsdCBicm93c2VyIHBsYXllci5cblxuXG4gICAgICAgIGxpLmFwcGVuZENoaWxkKGhmKTsgLy8gaSBqdXN0IHdhbnQgdGhlIGxpbmsgb2YgdGhlIHJlY29yZGVkIGF1ZGlvIHRvIGRvd25sb2FkXG5cbiAgICAgICAgcmVjb3JkaW5nc2xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIHdlYmtpdCBzaGltXG4gICAgICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPSAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhKTsgLy90aGlzIHdpbGwgc2V0IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgdG8gd2hhdGV2ZXIgaXQgZGV0ZWN0cyB0byBiZSB0aGUgcHJvcGVyIHByZWZpeGVkIHZlcnNpb24uXG4gICAgICAgIHdpbmRvdy5VUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkw7XG5cbiAgICAgICAgYXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG4gICAgICAgIF9fbG9nKCdBdWRpbyBjb250ZXh0IHNldCB1cC4nKTtcbiAgICAgICAgX19sb2coJ25hdmlnYXRvci5nZXRVc2VyTWVkaWEgJyArIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID8gJ2F2YWlsYWJsZS4nIDogJ25vdCBwcmVzZW50IScpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYWxlcnQoJ05vIHdlYiBhdWRpbyBzdXBwb3J0IGluIHRoaXMgYnJvd3NlciEnKTtcbiAgICAgIH1cblxuICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBfX2xvZygnTm8gbGl2ZSBhdWRpbyBpbnB1dDogJyArIGUpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBza2V0Y2ggPSBmdW5jdGlvbihub2lzZVdhdmUpIHtcblxuICAgICAgdmFyIHVybDtcbiAgXHRcdHZhciBteUNhbnZhcztcbiAgXHRcdHZhciBjb3VudGVyID0gMDtcbiAgXHRcdHZhciBzdGFydGluZ0FuZ2xlPTc7XG4gIFx0XHR2YXIgZ29SaWdodCA9IHRydWU7XG4gIFx0XHR2YXIgc3RhcnRVcCA9IHRydWU7XG4gIFx0XHR2YXIgbXlGcmFtZVJhdGUgPSAzMDtcbiAgXHRcdHZhciBydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgbm9pc2VXYXZlLnNldHVwID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgbXlDYW52YXMgPSBub2lzZVdhdmUuY3JlYXRlQ2FudmFzKHNjcmVlbi53aWR0aCwgNTAwKTtcbiAgICAgICAgbXlDYW52YXMucGFyZW50KCdjYXNzZXRlLXBsYXllci1jdCcpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBBdWRpbyBpbnB1dFxuICAgICAgICBtaWMgPSBuZXcgcDUuQXVkaW9JbigpO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSBBdWRpbyBJbnB1dC5cbiAgICAgICAgbWljLnN0YXJ0KCk7XG4gICAgICB9O1xuXG4gICAgICBub2lzZVdhdmUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciB5b2ZmID0gMC4wO1xuICAgICAgICAvLyBHZXQgdGhlIG92ZXJhbGwgdm9sdW1lIChiZXR3ZWVuIDAgYW5kIDEuMClcbiAgICAgICAgdmFyIHZvbCA9IG1pYy5nZXRMZXZlbCgpO1xuXG4gICAgICAgIC8vY29uc29sZS5sb2coJ3ZvbDogJyArIHZvbCk7XG5cbiAgICAgICAgbm9pc2VXYXZlLmJhY2tncm91bmQoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgIG5vaXNlV2F2ZS5zdHJva2UoMjUsIDIwMiwgMTQ0KTtcbiAgICAgICAgbm9pc2VXYXZlLmZpbGwoMjUsIDIwMiwgMTQ0KTtcblxuICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gZHJhdyBhIHBvbHlnb24gb3V0IG9mIHRoZSB3YXZlIHBvaW50c1xuICAgICAgICBub2lzZVdhdmUuYmVnaW5TaGFwZSgpO1xuXG4gICAgICAgIHZhciB4b2ZmID0gMDsgICAgICAgLy8gT3B0aW9uICMxOiAyRCBOb2lzZVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgb3ZlciBob3Jpem9udGFsIHBpeGVsc1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8PSBzY3JlZW4ud2lkdGg7IHggKz0gMTApIHtcbiAgICAgICAgICAvLyBDYWxjdWxhdGUgYSB5IHZhbHVlIGFjY29yZGluZyB0byBub2lzZSwgbWFwIHRvXG5cbiAgICAgICAgICAvLyBPcHRpb24gIzE6IDJEIE5vaXNlXG4gICAgICAgICAgLy9tYXAodmFsdWUsc3RhcnQxLHN0b3AxLHN0YXJ0MixzdG9wMilcbiAgICAgICAgICB2YXIgeSA9IG5vaXNlV2F2ZS5tYXAobm9pc2VXYXZlLm5vaXNlKHhvZmYsIHlvZmYpLCAwLCAxLCAxMDAsNDAwKTtcblxuICAgICAgICAgIC8vIFNldCB0aGUgdmVydGV4XG4gICAgICAgICAgbm9pc2VXYXZlLnZlcnRleCh4LCB5KTtcbiAgICAgICAgICAvLyBJbmNyZW1lbnQgeCBkaW1lbnNpb24gZm9yIG5vaXNlXG4gICAgICAgICAgeG9mZiArPSB2b2w7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5jcmVtZW50IHkgZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICB5b2ZmICs9IHZvbDtcbiAgICAgICAgbm9pc2VXYXZlLnZlcnRleChzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpO1xuICAgICAgICBub2lzZVdhdmUudmVydGV4KDAsIHNjcmVlbi5oZWlnaHQpO1xuICAgICAgICBub2lzZVdhdmUuZW5kU2hhcGUobm9pc2VXYXZlLkNMT1NFKTtcbiAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBteVA1ID0gbmV3IHA1KHNrZXRjaCk7XG5cbn0pO1xuIiwiXG5cdFxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9