$(function() {
  $("#wave-spinner").hide();
  $("#page").show();

  $("#button").click(function() {
    $('html, body').animate({
        scrollTop: $("#myDiv").offset().top
    }, 2000);
  });

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

        	recordingslist.insertAdjacentHTML('beforebegin', '<li class="mdl-list__item"><span class="mdl-list__item-primary-content" ><i class="material-icons mdl-list__item-icon">mic</i>' + hf.download + '</span><span class="mdl-list__item-secondary-action"><a class="mdl-button mdl-js-button mdl-button--accent" href="' + url + '"" download>Download <i class="material-icons">file_download</i></a></span></li>');
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
				//	__log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
				} catch (e) {
					alert('No web audio support!');
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

      navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
        __log('No live audio input: ' + e);
      });

}); // doc ready

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQoZnVuY3Rpb24oKSB7XG4gICQoXCIjd2F2ZS1zcGlubmVyXCIpLmhpZGUoKTtcbiAgJChcIiNwYWdlXCIpLnNob3coKTtcblxuICAkKFwiI2J1dHRvblwiKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAkKCdodG1sLCBib2R5JykuYW5pbWF0ZSh7XG4gICAgICAgIHNjcm9sbFRvcDogJChcIiNteURpdlwiKS5vZmZzZXQoKS50b3BcbiAgICB9LCAyMDAwKTtcbiAgfSk7XG5cbiAgdmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcbiAgICAgIHhSZWMgPSBmYWxzZSxcblx0XHRcdGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG5cdFx0XHRwbGF5UGF1c2UgPSBTbmFwKCcjcGxheVBhdXNlJyksXG5cdFx0XHRwbGF5U3RhdGUgPSBTbmFwKCcjcGxheVN0YXRlJyksXG5cdFx0XHRwYXVzZVN0YXRlID0gU25hcCgnI3BhdXNlU3RhdGUnKSxcblx0XHRcdHBsYXlBY3RpdmUgPSBmYWxzZSxcblx0XHRcdGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuXHRcdFx0d2hlZWxMID0gU25hcCgnI3doZWVsLWwnKSxcblx0XHRcdHdoZWVsUiA9IFNuYXAoJyN3aGVlbC1yJyksXG5cdFx0XHR0YXBlID0gU25hcCgnI3RhcGUnKSxcblx0XHRcdHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG5cdFx0XHR0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuXHRcdFx0bG9nVGV4dCA9IFNuYXAoJyNyZWNvcmRpbmdUZXh0IHRzcGFuJyksXG5cdFx0XHR0cmFja3RpdGxlID0gU25hcCgnI3RyYWNrdGl0bGUgdHNwYW4nKSxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbiA9IDAuNjc5NDc3LFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG5cdFx0XHRiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcblx0XHRcdGJib3hSID0gdGFwZVIuZ2V0QkJveCgpLFxuXHRcdFx0YXVkaW8gPSBuZXcgQXVkaW8oKSxcblx0XHRcdGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG5cdFx0XHRwbGF5bGlzdCA9IFsnZGlydHlfc291dGhfbG9vcF84NWJwbScsICdwb3BfaGlwaG9wX2xvb3BfMTAwYnBtJ10sXG5cdFx0XHRkaXIgPSBcImF1ZGlvL1wiLFxuXHRcdFx0ZXh0ID0gXCIubXAzXCIsXG5cdFx0XHRpbnB1dCxcblx0XHRcdGFuYWx5emVyLFxuXHRcdFx0Y3VycmVudFRyYWNrID0gMCxcblx0XHRcdHNlZWtzbGlkZXIsXG5cdFx0XHRzZWVraW5nPWZhbHNlLFxuXHRcdFx0YXVkaW9fY29udGV4dCxcblx0XHRcdHJlY29yZGVyLFxuICAgICAgbWljLFxuICAgICAgc291bmRGaWxlO1xuXG4gICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuICAgICAgLy8gQXVkaW8gT2JqZWN0XG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG4gICAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wbGF5KCk7XG4gICAgICB9LCBmYWxzZSk7XG5cbiAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRpdGxlVXBkYXRlKCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcbiAgICAgICAgd2hlZWxMLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwzMCwzMCd9LCAyMDAwLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuICAgICAgICAgICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuICAgICAgICB3aGVlbFIuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDI3MCwzMCd9LCAyMDAwLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcbiAgICAgICAgICAgICAgd2hlZWxBbmltYXRpb25SKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG4gICAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uTCgpIHtcbiAgICAgICAgdGFwZUwuYW5pbWF0ZSh7IGN4OiAnOTAuMzg5Myd9LCA1MDAsXG4gICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgdGFwZUwuYXR0cih7IGN4OiAnOTIuMzg5Myd9KTtcbiAgICAgICAgICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvblIoKSB7XG4gICAgICAgIHRhcGVSLmFuaW1hdGUoeyBjeDogJzMzMC4zODknfSwgNTAwLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHRhcGVSLmF0dHIoeyBjeDogJzMyOC4zODknfSk7XG4gICAgICAgICAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHN0b3BXaGVlbEFuaW1hdGlvbigpIHtcbiAgICAgICAgd2hlZWxMLnN0b3AoKTtcbiAgICAgICAgd2hlZWxSLnN0b3AoKTtcbiAgICAgICAgdGFwZUwuc3RvcCgpO1xuICAgICAgICB0YXBlUi5zdG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG4gICAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICAgIHhSZWMgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGxheVN0b3AoKSB7XG4gICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcbiAgICAgICAgZm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgICAgc3RvcEFuaW1hdGlvbigpO1xuICAgICAgICBYRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuICAgICAgICBpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcbiAgICAgICAgICBjdXJyZW50VHJhY2sgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudFRyYWNrKys7XG4gICAgICAgIH1cblxuICAgICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHBsYXkgZnVuY3Rpb25cbiAgICAgIHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgICBpZihhdWRpby5wYXVzZWQpIHtcblxuICAgICAgICAgIC8vIHBsYXkgc3RhdGVcbiAgICAgICAgICBwbGF5QWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG4gICAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIG5vdCByZWNvcmRpbmdcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXG4gICAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgICAgICAvL2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBwYXVzZSBzdGF0ZVxuICAgICAgICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuICAgICAgICAgICAgYXVkaW8ucGF1c2UoKTtcblxuICAgICAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgICAgIHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gZW5kIHBsYXkgZnVuY3Rpb25cblxuICAgICAgLy8gYmFja3dhcmQgZnVuY3Rpb25cbiAgICAgIGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgICB2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcbiAgICAgICAgfTtcblxuICAgICAgICBhbmltMSgpO1xuXG4gICAgICAgIGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG4gICAgICAgICAgY3VycmVudFRyYWNrLS07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgICB9XG5cbiAgICAgIH0pO1xuICAgICAgLy8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cbiAgICAgIC8vIGZvcndhcmQgZnVuY3Rpb25cbiAgICAgIGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLy8gYnV0dG9uIGFuaW0xXG4gICAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFuaW0xKCk7XG5cbiAgICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgICAgY3VycmVudFRyYWNrID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgICAgfVxuXG4gICAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICAgIGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcbiAgICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuICAgICAgZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcbiAgICAgICAgdHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG4gICAgICB9XG5cbiAgICAgIC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cbiAgICAgIGZ1bmN0aW9uIF9fbG9nKGUsIGRhdGEpIHtcbiAgICAgICAgbG9nVGV4dC5ub2RlLmlubmVySFRNTCA9IFwiXFxuXCIgKyBlICsgXCIgXCIgKyAoZGF0YSB8fCAnJyk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHN0YXJ0VXNlck1lZGlhKHN0cmVhbSkge1xuXHRcdFx0XHR2YXIgaW5wdXQgPSBhdWRpb19jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG5cdFx0XHRcdF9fbG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcblx0XHRcdFx0Ly8gVW5jb21tZW50IGlmIHlvdSB3YW50IHRoZSBhdWRpbyB0byBmZWVkYmFjayBkaXJlY3RseVxuXHRcdFx0XHQvL2lucHV0LmNvbm5lY3QoYXVkaW9fY29udGV4dC5kZXN0aW5hdGlvbik7XG5cdFx0XHRcdC8vX19sb2coJ0lucHV0IGNvbm5lY3RlZCB0byBhdWRpbyBjb250ZXh0IGRlc3RpbmF0aW9uLicpO1xuXG5cdFx0XHRcdHJlY29yZGVyID0gbmV3IFJlY29yZGVyKGlucHV0KTtcblx0XHRcdFx0X19sb2coJ1JlYWR5IScpO1xuXHRcdFx0fVxuXG5cbiAgICAgIC8vIHJlYyBmdW5jdGlvblxuICAgICAgcmVjLmNsaWNrKGZ1bmN0aW9uKG9rKSB7XG5cbiAgICAgICAgaWYgKCF4UmVjKXsgLy9pcyBub3QgcmVjb3JkaW5nXG5cbiAgICAgICAgICByZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG4gICAgICAgICAgaWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgICB3aGVlbEFuaW1hdGlvbigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHhSZWMgPSB0cnVlO1xuXG4gICAgICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIucmVjb3JkKCk7XG5cbiAgICAgICAgICBfX2xvZygnUmVjb3JkaW5nLi4uJyk7XG5cbiAgICAgICAgfSAgZWxzZSB7IC8vc3RvcCByZWNvcmRpbmdcblxuICAgICAgICAgIHJlY1N0b3AoKTtcblxuICAgICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG4gICAgICAgICAgICBzdG9wV2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZWNvcmRlciAmJiByZWNvcmRlci5zdG9wKCk7XG5cbiAgICAgICAgICBfX2xvZygnU3RvcHBlZCByZWMuJyk7XG5cbiAgICAgICAgICAvLyBjcmVhdGUgV0FWIGRvd25sb2FkIGxpbmsgdXNpbmcgYXVkaW8gZGF0YSBibG9iXG4gICAgICAgICAgY3JlYXRlRG93bmxvYWRMaW5rKCk7XG5cbiAgICAgICAgICByZWNvcmRlci5jbGVhcigpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIC8vIGVuZCByZWMgZnVuY3Rpb25cblxuICAgICAgZnVuY3Rpb24gY3JlYXRlRG93bmxvYWRMaW5rKCkge1xuXHRcdFx0XHRyZWNvcmRlciAmJiByZWNvcmRlci5leHBvcnRXQVYoZnVuY3Rpb24oYmxvYikge1xuXHRcdFx0XHRcdHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHRcdFx0XHRcdHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cdFx0XHRcdFx0dmFyIGF1ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0XHRcdFx0XHR2YXIgaGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cblx0XHRcdFx0XHRhdS5jb250cm9scyA9IHRydWU7XG5cdFx0XHRcdFx0YXUuc3JjID0gdXJsO1xuXHRcdFx0XHRcdGhmLmhyZWYgPSB1cmw7XG5cdFx0XHRcdFx0aGYuZG93bmxvYWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgKyAnLndhdic7XG5cdFx0XHRcdFx0aGYuaW5uZXJIVE1MID0gaGYuZG93bmxvYWQ7XG5cbiAgICAgICAgXHRyZWNvcmRpbmdzbGlzdC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWJlZ2luJywgJzxsaSBjbGFzcz1cIm1kbC1saXN0X19pdGVtXCI+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1wcmltYXJ5LWNvbnRlbnRcIiA+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBtZGwtbGlzdF9faXRlbS1pY29uXCI+bWljPC9pPicgKyBoZi5kb3dubG9hZCArICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1zZWNvbmRhcnktYWN0aW9uXCI+PGEgY2xhc3M9XCJtZGwtYnV0dG9uIG1kbC1qcy1idXR0b24gbWRsLWJ1dHRvbi0tYWNjZW50XCIgaHJlZj1cIicgKyB1cmwgKyAnXCJcIiBkb3dubG9hZD5Eb3dubG9hZCA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+ZmlsZV9kb3dubG9hZDwvaT48L2E+PC9zcGFuPjwvbGk+Jyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQvLyB3ZWJraXQgc2hpbVxuXHRcdFx0XHRcdHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG5cdFx0XHRcdFx0bmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubXNHZXRVc2VyTWVkaWEpOyAvL3RoaXMgd2lsbCBzZXQgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB0byB3aGF0ZXZlciBpdCBkZXRlY3RzIHRvIGJlIHRoZSBwcm9wZXIgcHJlZml4ZWQgdmVyc2lvbi5cblx0XHRcdFx0XHR3aW5kb3cuVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xuXG5cdFx0XHRcdFx0YXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG5cdFx0XHRcdFx0X19sb2coJ0F1ZGlvIGNvbnRleHQgc2V0IHVwLicpO1xuXHRcdFx0XHQvL1x0X19sb2coJ25hdmlnYXRvci5nZXRVc2VyTWVkaWEgJyArIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID8gJ2F2YWlsYWJsZS4nIDogJ25vdCBwcmVzZW50IScpKTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGFsZXJ0KCdObyB3ZWIgYXVkaW8gc3VwcG9ydCEnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoe2F1ZGlvOiB0cnVlfSwgc3RhcnRVc2VyTWVkaWEsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRfX2xvZygnTm8gbGl2ZSBhdWRpbyBpbnB1dDogJyArIGUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH07XG5cbiAgICAgIHZhciBza2V0Y2ggPSBmdW5jdGlvbihub2lzZVdhdmUpIHtcblxuICAgICAgICB2YXIgdXJsLFxuICAgICAgICAgIG15Q2FudmFzLFxuICAgICAgICAgIGNvdW50ZXIgPSAwLFxuICAgICAgICAgIHN0YXJ0aW5nQW5nbGU9NyxcbiAgICAgICAgICBnb1JpZ2h0ID0gdHJ1ZSxcbiAgICAgICAgICBzdGFydFVwID0gdHJ1ZSxcbiAgICAgICAgICBteUZyYW1lUmF0ZSA9IDMwLFxuICAgICAgICAgIHJ1bm5pbmcgPSB0cnVlO1xuXG4gICAgICAgIG5vaXNlV2F2ZS5zZXR1cCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgbXlDYW52YXMgPSBub2lzZVdhdmUuY3JlYXRlQ2FudmFzKHNjcmVlbi53aWR0aCwgNTAwKTtcblxuICAgICAgICAgIG15Q2FudmFzLnBhcmVudCgnY2Fzc2V0ZS1wbGF5ZXItY3QnKTtcblxuICAgICAgICAgIC8vIENyZWF0ZSBhbiBBdWRpbyBpbnB1dFxuICAgICAgICAgIG1pYyA9IG5ldyBwNS5BdWRpb0luKCk7XG5cbiAgICAgICAgICAvLyBzdGFydCB0aGUgQXVkaW8gSW5wdXQuXG4gICAgICAgICAgbWljLnN0YXJ0KCk7XG5cbiAgICAgICAgICAvLyBjcmVhdGUgYSBzb3VuZCByZWNvcmRlclxuICAgICAgICAgIHJlY29yZGVyID0gbmV3IHA1LlNvdW5kUmVjb3JkZXIoKTtcblxuICAgICAgICAgIC8vIGNvbm5lY3QgdGhlIG1pYyB0byB0aGUgcmVjb3JkZXJcbiAgICAgICAgICByZWNvcmRlci5zZXRJbnB1dChtaWMpO1xuXG4gICAgICAgICAgLy8gY3JlYXRlIGFuIGVtcHR5IHNvdW5kIGZpbGUgdGhhdCB3ZSB3aWxsIHVzZSB0byBwbGF5YmFjayB0aGUgcmVjb3JkaW5nXG4gICAgICAgICAgc291bmRGaWxlID0gbmV3IHA1LlNvdW5kRmlsZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIG5vaXNlV2F2ZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICB2YXIgeW9mZiA9IDAuMDtcbiAgICAgICAgICAvLyBHZXQgdGhlIG92ZXJhbGwgdm9sdW1lIChiZXR3ZWVuIDAgYW5kIDEuMClcbiAgICAgICAgICB2YXIgdm9sID0gbWljLmdldExldmVsKCk7XG5cbiAgICAgICAgICBub2lzZVdhdmUuYmFja2dyb3VuZCgyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgICBub2lzZVdhdmUuc3Ryb2tlKDI1LCAyMDIsIDE0NCk7XG4gICAgICAgICAgbm9pc2VXYXZlLmZpbGwoMjUsIDIwMiwgMTQ0KTtcblxuICAgICAgICAgIC8vIFdlIGFyZSBnb2luZyB0byBkcmF3IGEgcG9seWdvbiBvdXQgb2YgdGhlIHdhdmUgcG9pbnRzXG4gICAgICAgICAgbm9pc2VXYXZlLmJlZ2luU2hhcGUoKTtcblxuICAgICAgICAgIHZhciB4b2ZmID0gMDsgICAgICAgLy8gT3B0aW9uICMxOiAyRCBOb2lzZVxuXG4gICAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGhvcml6b250YWwgcGl4ZWxzXG4gICAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPD0gc2NyZWVuLndpZHRoOyB4ICs9IDEwKSB7XG4gICAgICAgICAgICAvLyBDYWxjdWxhdGUgYSB5IHZhbHVlIGFjY29yZGluZyB0byBub2lzZSwgbWFwIHRvXG5cbiAgICAgICAgICAgIC8vbWFwKHZhbHVlLHN0YXJ0MSxzdG9wMSxzdGFydDIsc3RvcDIpXG4gICAgICAgICAgICB2YXIgeSA9IG5vaXNlV2F2ZS5tYXAobm9pc2VXYXZlLm5vaXNlKHhvZmYsIHlvZmYpLCAwLCAxLCAyMDAsMzAwKTtcblxuICAgICAgICAgICAgLy8gU2V0IHRoZSB2ZXJ0ZXhcbiAgICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoeCwgeSk7XG4gICAgICAgICAgICAvLyBJbmNyZW1lbnQgeCBkaW1lbnNpb24gZm9yIG5vaXNlXG4gICAgICAgICAgICB4b2ZmICs9IHZvbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gaW5jcmVtZW50IHkgZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICAgIHlvZmYgKz0gdm9sO1xuICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgICBub2lzZVdhdmUudmVydGV4KDAsIHNjcmVlbi5oZWlnaHQpO1xuICAgICAgICAgIG5vaXNlV2F2ZS5lbmRTaGFwZShub2lzZVdhdmUuQ0xPU0UpO1xuICAgICAgICB9O1xuXG5cbiAgICAgIH07Ly8gdmFyIHNrZXRjaFxuXG4gICAgICB2YXIgbXlQNSA9IG5ldyBwNShza2V0Y2gpO1xuXG4gICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKHthdWRpbzogdHJ1ZX0sIHN0YXJ0VXNlck1lZGlhLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIF9fbG9nKCdObyBsaXZlIGF1ZGlvIGlucHV0OiAnICsgZSk7XG4gICAgICB9KTtcblxufSk7IC8vIGRvYyByZWFkeVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9