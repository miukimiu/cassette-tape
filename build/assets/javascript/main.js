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

    };// var sketch

    var myP5 = new p5(sketch);



});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2Nhc3NldHRlQXBwJywgW10pXG4uY29uZmlnKFsnJGNvbXBpbGVQcm92aWRlcicsIGZ1bmN0aW9uICgkY29tcGlsZVByb3ZpZGVyKSB7XG4gICAgJGNvbXBpbGVQcm92aWRlci5hSHJlZlNhbml0aXphdGlvbldoaXRlbGlzdCgvXlxccyoofGJsb2J8KTovKTtcbn1dKVxuXG4uY29udHJvbGxlcignY2Fzc2V0dGVDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkd2luZG93KXtcblxuICB2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuICAgIHhSZWMgPSBmYWxzZSxcbiAgICBiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuICAgIHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcbiAgICBwbGF5U3RhdGUgPSBTbmFwKCcjcGxheVN0YXRlJyksXG4gICAgcGF1c2VTdGF0ZSA9IFNuYXAoJyNwYXVzZVN0YXRlJyksXG4gICAgcGxheUFjdGl2ZSA9IGZhbHNlLFxuICAgIGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuICAgIHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG4gICAgd2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcbiAgICB0YXBlID0gU25hcCgnI3RhcGUnKSxcbiAgICB0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuICAgIHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG4gICAgbG9nVGV4dCA9IFNuYXAoJyNyZWNvcmRpbmdUZXh0IHRzcGFuJyksXG4gICAgdHJhY2t0aXRsZSA9IFNuYXAoJyN0cmFja3RpdGxlIHRzcGFuJyksXG4gICAgYnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG4gICAgYnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG4gICAgYmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG4gICAgYmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG4gICAgYXVkaW8gPSBuZXcgQXVkaW8oKSxcbiAgICBkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuICAgIHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcbiAgICBkaXIgPSBcImF1ZGlvL1wiLFxuICAgIGV4dCA9IFwiLm1wM1wiLFxuICAgIGlucHV0LFxuICAgIGFuYWx5emVyLFxuICAgIGN1cnJlbnRUcmFjayA9IDAsXG4gICAgc2Vla3NsaWRlcixcbiAgICBzZWVraW5nPWZhbHNlLFxuICAgIGF1ZGlvX2NvbnRleHQsXG4gICAgcmVjb3JkZXIsXG4gICAgc2Vla3RvO1xuXG4gICAgdmFyIG1pYywgc291bmRGaWxlO1xuXG4gICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cbiAgICAvLyBBdWRpbyBPYmplY3RcbiAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG4gICAgc2Vla3NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2Vla3NsaWRlclwiKTtcblxuICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgIHRoaXMucGxheSgpO1xuICAgIH0sIGZhbHNlKTtcblxuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXsgdGl0bGVVcGRhdGUoKTsgfSk7XG5cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcbiAgICAgIHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuICAgICAgICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuICAgICAgd2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uTCgpIHtcbiAgICAgIHRhcGVMLmFuaW1hdGUoeyBjeDogJzkwLjM4OTMnfSwgNTAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGFwZUwuYXR0cih7IGN4OiAnOTIuMzg5Myd9KTtcbiAgICAgICAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvblIoKSB7XG4gICAgICB0YXBlUi5hbmltYXRlKHsgY3g6ICczMzAuMzg5J30sIDUwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRhcGVSLmF0dHIoeyBjeDogJzMyOC4zODknfSk7XG4gICAgICAgICAgICB0YXBlQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG4gICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgIHdoZWVsQW5pbWF0aW9uTCgpO1xuICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgd2hlZWxMLnN0b3AoKTtcbiAgICAgIHdoZWVsUi5zdG9wKCk7XG4gICAgICB0YXBlTC5zdG9wKCk7XG4gICAgICB0YXBlUi5zdG9wKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVjU3RvcCgpIHtcbiAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICB4UmVjID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGxheVN0b3AoKSB7XG4gICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHBsYXlBY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG4gICAgICBmb3J3YXJkLnRyYW5zZm9ybSgndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgc3RvcEFuaW1hdGlvbigpO1xuICAgICAgWEZvcndhcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjaysrO1xuICAgICAgfVxuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cblxuICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgfVxuXG4gICAgLy8gcGxheSBmdW5jdGlvblxuICAgIHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgaWYoYXVkaW8ucGF1c2VkKSB7XG5cbiAgICAgICAgLy8gcGxheSBzdGF0ZVxuXG4gICAgICAgIHBsYXlBY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG4gICAgICAgIGlmICgheFJlYykgeyAvLyBpcyBub3QgcmVjb3JkaW5nXG4gICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblxuICAgICAgICBhdWRpby5wbGF5KCk7XG5cbiAgICAgICAgICAvL2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAvLyBwYXVzZSBzdGF0ZVxuXG4gICAgICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgcGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cbiAgICAgICAgICAvL2NvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG4gICAgICAgICAgYXVkaW8ucGF1c2UoKTtcblxuICAgICAgICAgIGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cbiAgICAvLyBiYWNrd2FyZCBmdW5jdGlvblxuICAgIGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAvLyBidXR0b24gYW5pbTFcbiAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICB9O1xuXG4gICAgICB2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcbiAgICAgIH07XG5cbiAgICAgIGFuaW0xKCk7XG5cbiAgICAgIGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG5cbiAgICAgICAgY3VycmVudFRyYWNrLS07XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG5cbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cblxuICAgIH0pO1xuICAgIC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXG4gICAgLy8gZm9yd2FyZCBmdW5jdGlvblxuICAgIGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgdmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgfTtcblxuICAgICAgYW5pbTEoKTtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjaysrO1xuICAgICAgfVxuXG4gICAgICAvL2NvbnNvbGUubG9nKCdmdyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG4gICAgZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcbiAgICAgIHRyYWNrdGl0bGUubm9kZS5pbm5lckhUTUwgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cbiAgICBmdW5jdGlvbiBfX2xvZyhlLCBkYXRhKSB7XG4gICAgICBsb2dUZXh0Lm5vZGUuaW5uZXJIVE1MID0gXCJcXG5cIiArIGUgKyBcIiBcIiArIChkYXRhIHx8ICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydFVzZXJNZWRpYShzdHJlYW0pIHtcbiAgICAgIHZhciBpbnB1dCA9IGF1ZGlvX2NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgICAgIF9fbG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcbiAgICAgIC8vIFVuY29tbWVudCBpZiB5b3Ugd2FudCB0aGUgYXVkaW8gdG8gZmVlZGJhY2sgZGlyZWN0bHlcbiAgICAgIC8vaW5wdXQuY29ubmVjdChhdWRpb19jb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgIC8vX19sb2coJ0lucHV0IGNvbm5lY3RlZCB0byBhdWRpbyBjb250ZXh0IGRlc3RpbmF0aW9uLicpO1xuXG4gICAgICByZWNvcmRlciA9IG5ldyBSZWNvcmRlcihpbnB1dCk7XG4gICAgICBfX2xvZygnUmVhZHkhJyk7XG4gICAgfVxuXG4gICAgLy8gcmVjIGZ1bmN0aW9uXG4gICAgcmVjLmNsaWNrKGZ1bmN0aW9uKG9rKSB7XG5cbiAgICAgIGlmICgheFJlYyl7IC8vaXMgbm90IHJlY29yZGluZ1xuXG4gICAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cbiAgICAgICAgLy8gd2hlZWxzIGV2ZW50c1xuXG4gICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgIH1cblxuICAgICAgICB4UmVjID0gdHJ1ZTtcblxuICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5yZWNvcmQoKTtcblxuICAgICAgICBfX2xvZygnUmVjb3JkaW5nLi4uJyk7XG5cbiAgICAgIH0gIGVsc2UgeyAvL3N0b3AgcmVjb3JkaW5nXG4gICAgICAgIHJlY1N0b3AoKTtcblxuICAgICAgICBpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblxuICAgICAgICAgIHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIuc3RvcCgpO1xuXG4gICAgICAgIF9fbG9nKCdTdG9wcGVkIHJlY29yZGluZy4nKTtcblxuICAgICAgICAvLyBjcmVhdGUgV0FWIGRvd25sb2FkIGxpbmsgdXNpbmcgYXVkaW8gZGF0YSBibG9iXG4gICAgICAgIGNyZWF0ZURvd25sb2FkTGluaygpO1xuXG4gICAgICAgIHJlY29yZGVyLmNsZWFyKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIHJlYyBmdW5jdGlvblxuXG5cbiAgICBmdW5jdGlvbiBjcmVhdGVEb3dubG9hZExpbmsoKSB7XG4gICAgICByZWNvcmRlciAmJiByZWNvcmRlci5leHBvcnRXQVYoZnVuY3Rpb24oYmxvYikge1xuICAgICAgICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgdmFyIGF1ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcbiAgICAgICAgdmFyIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG5cbiAgICAgICAgYXUuY29udHJvbHMgPSB0cnVlO1xuICAgICAgICBhdS5zcmMgPSB1cmw7XG4gICAgICAgIGhmLmhyZWYgPSB1cmw7XG4gICAgICAgIGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuICAgICAgICBoZi5pbm5lckhUTUwgPSBoZi5kb3dubG9hZDtcbiAgICAgICAgLy9saS5hcHBlbmRDaGlsZChhdSk7IC8vIEkgZG9uJ3Qgd2FudCB0aGUgZGVmYXVsdCBicm93c2VyIHBsYXllci5cblxuXG4gICAgICAgIHZhciB0cmFja1VSTCA9IGhmLmRvd25sb2FkO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHVybCk7XG4gICAgICAgIGxpLmFwcGVuZENoaWxkKGhmKTsgLy8gaSBqdXN0IHdhbnQgdGhlIGxpbmsgb2YgdGhlIHJlY29yZGVkIGF1ZGlvIHRvIGRvd25sb2FkXG5cbiAgICAgICAgLy9yZWNvcmRpbmdzbGlzdC5hcHBlbmRDaGlsZChsaSk7XG5cblxuICAgICAgICB2YXIgbXlFbGVtZW50ID0gYW5ndWxhci5lbGVtZW50KCc8bGkgY2xhc3M9XCJtZGwtbGlzdF9faXRlbVwiPjxzcGFuIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW0tcHJpbWFyeS1jb250ZW50XCIgPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMgbWRsLWxpc3RfX2l0ZW0taWNvblwiPm1pYzwvaT4nICsgdHJhY2tVUkwgKyAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW0tc2Vjb25kYXJ5LWFjdGlvblwiPjxhIGNsYXNzPVwibWRsLWJ1dHRvbiBtZGwtanMtYnV0dG9uIG1kbC1idXR0b24tLWFjY2VudFwiIGhyZWY9XCInICsgdXJsICsgJ1wiXCIgZG93bmxvYWQ+RG93bmxvYWQgPGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPmZpbGVfZG93bmxvYWQ8L2k+PC9hPjwvc3Bhbj48L2xpPicpO1xuXG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcmVjb3JkaW5nc2xpc3QnKSkuYXBwZW5kKG15RWxlbWVudCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIHdlYmtpdCBzaGltXG4gICAgICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPSAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhKTsgLy90aGlzIHdpbGwgc2V0IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgdG8gd2hhdGV2ZXIgaXQgZGV0ZWN0cyB0byBiZSB0aGUgcHJvcGVyIHByZWZpeGVkIHZlcnNpb24uXG4gICAgICAgIHdpbmRvdy5VUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkw7XG5cbiAgICAgICAgYXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG4gICAgICAgIF9fbG9nKCdBdWRpbyBjb250ZXh0IHNldCB1cC4nKTtcbiAgICAgICAgX19sb2coJ25hdmlnYXRvci5nZXRVc2VyTWVkaWEgJyArIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID8gJ2F2YWlsYWJsZS4nIDogJ25vdCBwcmVzZW50IScpKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgYWxlcnQoJ05vIHdlYiBhdWRpbyBzdXBwb3J0IGluIHRoaXMgYnJvd3NlciEnKTtcbiAgICAgIH1cblxuICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBfX2xvZygnTm8gbGl2ZSBhdWRpbyBpbnB1dDogJyArIGUpO1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBza2V0Y2ggPSBmdW5jdGlvbihub2lzZVdhdmUpIHtcblxuICAgICAgdmFyIHVybDtcbiAgXHRcdHZhciBteUNhbnZhcztcbiAgXHRcdHZhciBjb3VudGVyID0gMDtcbiAgXHRcdHZhciBzdGFydGluZ0FuZ2xlPTc7XG4gIFx0XHR2YXIgZ29SaWdodCA9IHRydWU7XG4gIFx0XHR2YXIgc3RhcnRVcCA9IHRydWU7XG4gIFx0XHR2YXIgbXlGcmFtZVJhdGUgPSAzMDtcbiAgXHRcdHZhciBydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgbm9pc2VXYXZlLnNldHVwID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgbXlDYW52YXMgPSBub2lzZVdhdmUuY3JlYXRlQ2FudmFzKHNjcmVlbi53aWR0aCwgNTAwKTtcbiAgICAgICAgbXlDYW52YXMucGFyZW50KCdjYXNzZXRlLXBsYXllci1jdCcpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBhbiBBdWRpbyBpbnB1dFxuICAgICAgICBtaWMgPSBuZXcgcDUuQXVkaW9JbigpO1xuXG4gICAgICAgIC8vIHN0YXJ0IHRoZSBBdWRpbyBJbnB1dC5cbiAgICAgICAgbWljLnN0YXJ0KCk7XG5cbiAgICAgICAgLy8gY3JlYXRlIGEgc291bmQgcmVjb3JkZXJcbiAgICAgICAgcmVjb3JkZXIgPSBuZXcgcDUuU291bmRSZWNvcmRlcigpO1xuXG4gICAgICAgIC8vIGNvbm5lY3QgdGhlIG1pYyB0byB0aGUgcmVjb3JkZXJcbiAgICAgICAgcmVjb3JkZXIuc2V0SW5wdXQobWljKTtcblxuICAgICAgICAvLyBjcmVhdGUgYW4gZW1wdHkgc291bmQgZmlsZSB0aGF0IHdlIHdpbGwgdXNlIHRvIHBsYXliYWNrIHRoZSByZWNvcmRpbmdcbiAgICAgICAgc291bmRGaWxlID0gbmV3IHA1LlNvdW5kRmlsZSgpO1xuICAgICAgfTtcblxuICAgICAgbm9pc2VXYXZlLmRyYXcgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgeW9mZiA9IDAuMDtcbiAgICAgICAgLy8gR2V0IHRoZSBvdmVyYWxsIHZvbHVtZSAoYmV0d2VlbiAwIGFuZCAxLjApXG4gICAgICAgIHZhciB2b2wgPSBtaWMuZ2V0TGV2ZWwoKTtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKCd2b2w6ICcgKyB2b2wpO1xuXG4gICAgICAgIG5vaXNlV2F2ZS5iYWNrZ3JvdW5kKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBub2lzZVdhdmUuc3Ryb2tlKDI1LCAyMDIsIDE0NCk7XG4gICAgICAgIG5vaXNlV2F2ZS5maWxsKDI1LCAyMDIsIDE0NCk7XG5cbiAgICAgICAgLy8gV2UgYXJlIGdvaW5nIHRvIGRyYXcgYSBwb2x5Z29uIG91dCBvZiB0aGUgd2F2ZSBwb2ludHNcbiAgICAgICAgbm9pc2VXYXZlLmJlZ2luU2hhcGUoKTtcblxuICAgICAgICB2YXIgeG9mZiA9IDA7ICAgICAgIC8vIE9wdGlvbiAjMTogMkQgTm9pc2VcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgaG9yaXpvbnRhbCBwaXhlbHNcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gc2NyZWVuLndpZHRoOyB4ICs9IDEwKSB7XG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIGEgeSB2YWx1ZSBhY2NvcmRpbmcgdG8gbm9pc2UsIG1hcCB0b1xuXG4gICAgICAgICAgLy8gT3B0aW9uICMxOiAyRCBOb2lzZVxuICAgICAgICAgIC8vbWFwKHZhbHVlLHN0YXJ0MSxzdG9wMSxzdGFydDIsc3RvcDIpXG4gICAgICAgICAgdmFyIHkgPSBub2lzZVdhdmUubWFwKG5vaXNlV2F2ZS5ub2lzZSh4b2ZmLCB5b2ZmKSwgMCwgMSwgMTAwLDQwMCk7XG5cbiAgICAgICAgICAvLyBTZXQgdGhlIHZlcnRleFxuICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoeCwgeSk7XG4gICAgICAgICAgLy8gSW5jcmVtZW50IHggZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICAgIHhvZmYgKz0gdm9sO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluY3JlbWVudCB5IGRpbWVuc2lvbiBmb3Igbm9pc2VcbiAgICAgICAgeW9mZiArPSB2b2w7XG4gICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLnZlcnRleCgwLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLmVuZFNoYXBlKG5vaXNlV2F2ZS5DTE9TRSk7XG4gICAgICB9O1xuXG4gICAgfTsvLyB2YXIgc2tldGNoXG5cbiAgICB2YXIgbXlQNSA9IG5ldyBwNShza2V0Y2gpO1xuXG5cblxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=