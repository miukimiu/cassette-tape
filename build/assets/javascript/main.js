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


	

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdlpBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ2Nhc3NldHRlQXBwJywgW10pXG4uY29udHJvbGxlcignY2Fzc2V0dGVDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlKXtcblxuICB2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuICAgIHhSZWMgPSBmYWxzZSxcbiAgICBiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuICAgIHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcbiAgICBwbGF5U3RhdGUgPSBTbmFwKCcjcGxheVN0YXRlJyksXG4gICAgcGF1c2VTdGF0ZSA9IFNuYXAoJyNwYXVzZVN0YXRlJyksXG4gICAgcGxheUFjdGl2ZSA9IGZhbHNlLFxuICAgIGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuICAgIHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG4gICAgd2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcbiAgICB0YXBlID0gU25hcCgnI3RhcGUnKSxcbiAgICB0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuICAgIHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG4gICAgbG9nVGV4dCA9IFNuYXAoJyNyZWNvcmRpbmdUZXh0IHRzcGFuJyksXG4gICAgdHJhY2t0aXRsZSA9IFNuYXAoJyN0cmFja3RpdGxlIHRzcGFuJyksXG4gICAgYnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG4gICAgYnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG4gICAgYmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG4gICAgYmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG4gICAgYXVkaW8gPSBuZXcgQXVkaW8oKSxcbiAgICBkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuICAgIHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcbiAgICBkaXIgPSBcImF1ZGlvL1wiLFxuICAgIGV4dCA9IFwiLm1wM1wiLFxuICAgIGlucHV0LFxuICAgIGFuYWx5emVyLFxuICAgIGN1cnJlbnRUcmFjayA9IDAsXG4gICAgc2Vla3NsaWRlcixcbiAgICBzZWVraW5nPWZhbHNlLFxuICAgIGF1ZGlvX2NvbnRleHQsXG4gICAgcmVjb3JkZXIsXG4gICAgc2Vla3RvO1xuXG4gICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cbiAgICAvLyBBdWRpbyBPYmplY3RcbiAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG4gICAgc2Vla3NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2Vla3NsaWRlclwiKTtcblxuICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgIHRoaXMucGxheSgpO1xuICAgIH0sIGZhbHNlKTtcblxuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXsgdGl0bGVVcGRhdGUoKTsgfSk7XG5cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcbiAgICAgIHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuICAgICAgICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuICAgICAgd2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uTCgpIHtcbiAgICAgIHRhcGVMLmFuaW1hdGUoeyBjeDogJzkwLjM4OTMnfSwgNTAwLFxuICAgICAgICBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGFwZUwuYXR0cih7IGN4OiAnOTIuMzg5Myd9KTtcbiAgICAgICAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICAgICAgfVxuICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvblIoKSB7XG4gICAgICB0YXBlUi5hbmltYXRlKHsgY3g6ICczMzAuMzg5J30sIDUwMCxcbiAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRhcGVSLmF0dHIoeyBjeDogJzMyOC4zODknfSk7XG4gICAgICAgICAgICB0YXBlQW5pbWF0aW9uUigpO1xuICAgICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG4gICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgIHdoZWVsQW5pbWF0aW9uTCgpO1xuICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgd2hlZWxMLnN0b3AoKTtcbiAgICAgIHdoZWVsUi5zdG9wKCk7XG4gICAgICB0YXBlTC5zdG9wKCk7XG4gICAgICB0YXBlUi5zdG9wKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVjU3RvcCgpIHtcbiAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICB4UmVjID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGxheVN0b3AoKSB7XG4gICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgIHBsYXlBY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG4gICAgICBmb3J3YXJkLnRyYW5zZm9ybSgndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgc3RvcEFuaW1hdGlvbigpO1xuICAgICAgWEZvcndhcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjaysrO1xuICAgICAgfVxuXG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgIHRpdGxlVXBkYXRlKCk7XG5cblxuICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgfVxuXG4gICAgLy8gcGxheSBmdW5jdGlvblxuICAgIHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgaWYoYXVkaW8ucGF1c2VkKSB7XG5cbiAgICAgICAgLy8gcGxheSBzdGF0ZVxuXG4gICAgICAgIHBsYXlBY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgIHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG4gICAgICAgIGlmICgheFJlYykgeyAvLyBpcyBub3QgcmVjb3JkaW5nXG4gICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblxuICAgICAgICBhdWRpby5wbGF5KCk7XG5cbiAgICAgICAgICAvL2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAvLyBwYXVzZSBzdGF0ZVxuXG4gICAgICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgcGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cbiAgICAgICAgICAvL2NvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG4gICAgICAgICAgYXVkaW8ucGF1c2UoKTtcblxuICAgICAgICAgIGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cbiAgICAvLyBiYWNrd2FyZCBmdW5jdGlvblxuICAgIGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAvLyBidXR0b24gYW5pbTFcbiAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICB9O1xuXG4gICAgICB2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcbiAgICAgIH07XG5cbiAgICAgIGFuaW0xKCk7XG5cbiAgICAgIGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG5cbiAgICAgICAgY3VycmVudFRyYWNrLS07XG5cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG5cbiAgICAgIH1cblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cblxuICAgIH0pO1xuICAgIC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXG4gICAgLy8gZm9yd2FyZCBmdW5jdGlvblxuICAgIGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgdmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgIH07XG5cbiAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgfTtcblxuICAgICAgYW5pbTEoKTtcblxuICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRUcmFjaysrO1xuICAgICAgfVxuXG4gICAgICAvL2NvbnNvbGUubG9nKCdmdyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuICAgICAgYXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG4gICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgIGF1ZGlvLnBsYXkoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG4gICAgZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcbiAgICAgIHRyYWNrdGl0bGUubm9kZS5pbm5lckhUTUwgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cbiAgICBmdW5jdGlvbiBfX2xvZyhlLCBkYXRhKSB7XG4gICAgICBsb2dUZXh0Lm5vZGUuaW5uZXJIVE1MID0gXCJcXG5cIiArIGUgKyBcIiBcIiArIChkYXRhIHx8ICcnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdGFydFVzZXJNZWRpYShzdHJlYW0pIHtcbiAgICAgIHZhciBpbnB1dCA9IGF1ZGlvX2NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcbiAgICAgIF9fbG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcbiAgICAgIC8vIFVuY29tbWVudCBpZiB5b3Ugd2FudCB0aGUgYXVkaW8gdG8gZmVlZGJhY2sgZGlyZWN0bHlcbiAgICAgIC8vaW5wdXQuY29ubmVjdChhdWRpb19jb250ZXh0LmRlc3RpbmF0aW9uKTtcbiAgICAgIC8vX19sb2coJ0lucHV0IGNvbm5lY3RlZCB0byBhdWRpbyBjb250ZXh0IGRlc3RpbmF0aW9uLicpO1xuXG4gICAgICByZWNvcmRlciA9IG5ldyBSZWNvcmRlcihpbnB1dCk7XG4gICAgICBfX2xvZygnUmVhZHkhJyk7XG4gICAgfVxuXG4gICAgLy8gcmVjIGZ1bmN0aW9uXG4gICAgcmVjLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICBpZiAoIXhSZWMpeyAvL2lzIG5vdCByZWNvcmRpbmdcblxuICAgICAgICByZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG4gICAgICAgIC8vIHdoZWVscyBldmVudHNcblxuICAgICAgICBpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcbiAgICAgICAgICB3aGVlbEFuaW1hdGlvbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgeFJlYyA9IHRydWU7XG5cbiAgICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIucmVjb3JkKCk7XG5cbiAgICAgICAgX19sb2coJ1JlY29yZGluZy4uLicpO1xuXG4gICAgICB9ICBlbHNlIHsgLy9zdG9wIHJlY29yZGluZ1xuICAgICAgICByZWNTdG9wKCk7XG5cbiAgICAgICAgaWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cbiAgICAgICAgICBzdG9wV2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnN0b3AoKTtcblxuICAgICAgICBfX2xvZygnU3RvcHBlZCByZWNvcmRpbmcuJyk7XG5cbiAgICAgICAgLy8gY3JlYXRlIFdBViBkb3dubG9hZCBsaW5rIHVzaW5nIGF1ZGlvIGRhdGEgYmxvYlxuICAgICAgICBjcmVhdGVEb3dubG9hZExpbmsoKTtcblxuICAgICAgICByZWNvcmRlci5jbGVhcigpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCByZWMgZnVuY3Rpb25cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkTGluaygpIHtcbiAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLmV4cG9ydFdBVihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgIHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgICB2YXIgYXUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuICAgICAgICB2YXIgaGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cbiAgICAgICAgYXUuY29udHJvbHMgPSB0cnVlO1xuICAgICAgICBhdS5zcmMgPSB1cmw7XG4gICAgICAgIGhmLmhyZWYgPSB1cmw7XG4gICAgICAgIGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuICAgICAgICBoZi5pbm5lckhUTUwgPSBoZi5kb3dubG9hZDtcbiAgICAgICAgLy9saS5hcHBlbmRDaGlsZChhdSk7IC8vIEkgZG9uJ3Qgd2FudCB0aGUgZGVmYXVsdCBicm93c2VyIHBsYXllci5cbiAgICAgICAgbGkuYXBwZW5kQ2hpbGQoaGYpOyAvLyBpIGp1c3Qgd2FudCB0aGUgbGluayBvZiB0aGUgcmVjb3JkZWQgYXVkaW8gdG8gZG93bmxvYWRcbiAgICAgICAgcmVjb3JkaW5nc2xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uIGluaXQoKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyB3ZWJraXQgc2hpbVxuICAgICAgICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuICAgICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYSk7IC8vdGhpcyB3aWxsIHNldCBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHRvIHdoYXRldmVyIGl0IGRldGVjdHMgdG8gYmUgdGhlIHByb3BlciBwcmVmaXhlZCB2ZXJzaW9uLlxuICAgICAgICB3aW5kb3cuVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xuXG4gICAgICAgIGF1ZGlvX2NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0O1xuICAgICAgICBfX2xvZygnQXVkaW8gY29udGV4dCBzZXQgdXAuJyk7XG4gICAgICAgIF9fbG9nKCduYXZpZ2F0b3IuZ2V0VXNlck1lZGlhICcgKyAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSA/ICdhdmFpbGFibGUuJyA6ICdub3QgcHJlc2VudCEnKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGFsZXJ0KCdObyB3ZWIgYXVkaW8gc3VwcG9ydCBpbiB0aGlzIGJyb3dzZXIhJyk7XG4gICAgICB9XG5cbiAgICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoe2F1ZGlvOiB0cnVlfSwgc3RhcnRVc2VyTWVkaWEsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgX19sb2coJ05vIGxpdmUgYXVkaW8gaW5wdXQ6ICcgKyBlKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgc2tldGNoID0gZnVuY3Rpb24obm9pc2VXYXZlKSB7XG5cbiAgICAgIHZhciB1cmw7XG4gIFx0XHR2YXIgbXlDYW52YXM7XG4gIFx0XHR2YXIgY291bnRlciA9IDA7XG4gIFx0XHR2YXIgc3RhcnRpbmdBbmdsZT03O1xuICBcdFx0dmFyIGdvUmlnaHQgPSB0cnVlO1xuICBcdFx0dmFyIHN0YXJ0VXAgPSB0cnVlO1xuICBcdFx0dmFyIG15RnJhbWVSYXRlID0gMzA7XG4gIFx0XHR2YXIgcnVubmluZyA9IHRydWU7XG5cbiAgICAgIG5vaXNlV2F2ZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIG15Q2FudmFzID0gbm9pc2VXYXZlLmNyZWF0ZUNhbnZhcyhzY3JlZW4ud2lkdGgsIDUwMCk7XG4gICAgICAgIG15Q2FudmFzLnBhcmVudCgnY2Fzc2V0ZS1wbGF5ZXItY3QnKTtcblxuICAgICAgICAvLyBDcmVhdGUgYW4gQXVkaW8gaW5wdXRcbiAgICAgICAgbWljID0gbmV3IHA1LkF1ZGlvSW4oKTtcblxuICAgICAgICAvLyBzdGFydCB0aGUgQXVkaW8gSW5wdXQuXG4gICAgICAgIG1pYy5zdGFydCgpO1xuICAgICAgfTtcblxuICAgICAgbm9pc2VXYXZlLmRyYXcgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgeW9mZiA9IDAuMDtcbiAgICAgICAgLy8gR2V0IHRoZSBvdmVyYWxsIHZvbHVtZSAoYmV0d2VlbiAwIGFuZCAxLjApXG4gICAgICAgIHZhciB2b2wgPSBtaWMuZ2V0TGV2ZWwoKTtcblxuICAgICAgICAvL2NvbnNvbGUubG9nKCd2b2w6ICcgKyB2b2wpO1xuXG4gICAgICAgIG5vaXNlV2F2ZS5iYWNrZ3JvdW5kKDI1NSwgMjU1LCAyNTUpO1xuICAgICAgICBub2lzZVdhdmUuc3Ryb2tlKDI1LCAyMDIsIDE0NCk7XG4gICAgICAgIG5vaXNlV2F2ZS5maWxsKDI1LCAyMDIsIDE0NCk7XG5cbiAgICAgICAgLy8gV2UgYXJlIGdvaW5nIHRvIGRyYXcgYSBwb2x5Z29uIG91dCBvZiB0aGUgd2F2ZSBwb2ludHNcbiAgICAgICAgbm9pc2VXYXZlLmJlZ2luU2hhcGUoKTtcblxuICAgICAgICB2YXIgeG9mZiA9IDA7ICAgICAgIC8vIE9wdGlvbiAjMTogMkQgTm9pc2VcblxuICAgICAgICAvLyBJdGVyYXRlIG92ZXIgaG9yaXpvbnRhbCBwaXhlbHNcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gc2NyZWVuLndpZHRoOyB4ICs9IDEwKSB7XG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIGEgeSB2YWx1ZSBhY2NvcmRpbmcgdG8gbm9pc2UsIG1hcCB0b1xuXG4gICAgICAgICAgLy8gT3B0aW9uICMxOiAyRCBOb2lzZVxuICAgICAgICAgIC8vbWFwKHZhbHVlLHN0YXJ0MSxzdG9wMSxzdGFydDIsc3RvcDIpXG4gICAgICAgICAgdmFyIHkgPSBub2lzZVdhdmUubWFwKG5vaXNlV2F2ZS5ub2lzZSh4b2ZmLCB5b2ZmKSwgMCwgMSwgMTAwLDQwMCk7XG5cbiAgICAgICAgICAvLyBTZXQgdGhlIHZlcnRleFxuICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoeCwgeSk7XG4gICAgICAgICAgLy8gSW5jcmVtZW50IHggZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICAgIHhvZmYgKz0gdm9sO1xuICAgICAgICB9XG4gICAgICAgIC8vIGluY3JlbWVudCB5IGRpbWVuc2lvbiBmb3Igbm9pc2VcbiAgICAgICAgeW9mZiArPSB2b2w7XG4gICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLnZlcnRleCgwLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgbm9pc2VXYXZlLmVuZFNoYXBlKG5vaXNlV2F2ZS5DTE9TRSk7XG4gICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgbXlQNSA9IG5ldyBwNShza2V0Y2gpO1xuXG59KTtcbiIsIlxuXHRcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==