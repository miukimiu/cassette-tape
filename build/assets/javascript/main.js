$(function() {
  $("#wave-spinner").fadeOut(1000);
  $("#page").fadeIn(2500);

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

      $('.mdl-navigation a').click(function(){

        $('.mdl-layout__content').stop().animate({
            scrollTop: $( $(this).attr('href') ).offset().top - 160
        }, 800);
        return false;
    	});


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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQoZnVuY3Rpb24oKSB7XG4gICQoXCIjd2F2ZS1zcGlubmVyXCIpLmZhZGVPdXQoMTAwMCk7XG4gICQoXCIjcGFnZVwiKS5mYWRlSW4oMjUwMCk7XG5cbiAgJChcIiNidXR0b25cIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgJCgnaHRtbCwgYm9keScpLmFuaW1hdGUoe1xuICAgICAgICBzY3JvbGxUb3A6ICQoXCIjbXlEaXZcIikub2Zmc2V0KCkudG9wXG4gICAgfSwgMjAwMCk7XG4gIH0pO1xuXG4gIHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG4gICAgICB4UmVjID0gZmFsc2UsXG5cdFx0XHRiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuXHRcdFx0cGxheVBhdXNlID0gU25hcCgnI3BsYXlQYXVzZScpLFxuXHRcdFx0cGxheVN0YXRlID0gU25hcCgnI3BsYXlTdGF0ZScpLFxuXHRcdFx0cGF1c2VTdGF0ZSA9IFNuYXAoJyNwYXVzZVN0YXRlJyksXG5cdFx0XHRwbGF5QWN0aXZlID0gZmFsc2UsXG5cdFx0XHRmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcblx0XHRcdHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG5cdFx0XHR3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuXHRcdFx0dGFwZSA9IFNuYXAoJyN0YXBlJyksXG5cdFx0XHR0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuXHRcdFx0dGFwZVIgPSBTbmFwKCcjdGFwZVInKSxcblx0XHRcdGxvZ1RleHQgPSBTbmFwKCcjcmVjb3JkaW5nVGV4dCB0c3BhbicpLFxuXHRcdFx0dHJhY2t0aXRsZSA9IFNuYXAoJyN0cmFja3RpdGxlIHRzcGFuJyksXG5cdFx0XHRidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3Nyxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuXHRcdFx0YmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG5cdFx0XHRiYm94UiA9IHRhcGVSLmdldEJCb3goKSxcblx0XHRcdGF1ZGlvID0gbmV3IEF1ZGlvKCksXG5cdFx0XHRkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuXHRcdFx0cGxheWxpc3QgPSBbJ2RpcnR5X3NvdXRoX2xvb3BfODVicG0nLCAncG9wX2hpcGhvcF9sb29wXzEwMGJwbSddLFxuXHRcdFx0ZGlyID0gXCJhdWRpby9cIixcblx0XHRcdGV4dCA9IFwiLm1wM1wiLFxuXHRcdFx0aW5wdXQsXG5cdFx0XHRhbmFseXplcixcblx0XHRcdGN1cnJlbnRUcmFjayA9IDAsXG5cdFx0XHRzZWVrc2xpZGVyLFxuXHRcdFx0c2Vla2luZz1mYWxzZSxcblx0XHRcdGF1ZGlvX2NvbnRleHQsXG5cdFx0XHRyZWNvcmRlcixcbiAgICAgIG1pYyxcbiAgICAgIHNvdW5kRmlsZTtcblxuICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cbiAgICAgICQoJy5tZGwtbmF2aWdhdGlvbiBhJykuY2xpY2soZnVuY3Rpb24oKXtcblxuICAgICAgICAkKCcubWRsLWxheW91dF9fY29udGVudCcpLnN0b3AoKS5hbmltYXRlKHtcbiAgICAgICAgICAgIHNjcm9sbFRvcDogJCggJCh0aGlzKS5hdHRyKCdocmVmJykgKS5vZmZzZXQoKS50b3AgLSAxNjBcbiAgICAgICAgfSwgODAwKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIFx0fSk7XG5cblxuICAgICAgLy8gQXVkaW8gT2JqZWN0XG4gICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG4gICAgICBhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRUaW1lID0gMDtcbiAgICAgICAgdGhpcy5wbGF5KCk7XG4gICAgICB9LCBmYWxzZSk7XG5cbiAgICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7XG4gICAgICAgIHRpdGxlVXBkYXRlKCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcbiAgICAgICAgd2hlZWxMLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwzMCwzMCd9LCAyMDAwLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuICAgICAgICAgICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuICAgICAgICB3aGVlbFIuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDI3MCwzMCd9LCAyMDAwLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcbiAgICAgICAgICAgICAgd2hlZWxBbmltYXRpb25SKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG4gICAgICBmdW5jdGlvbiB0YXBlQW5pbWF0aW9uTCgpIHtcbiAgICAgICAgdGFwZUwuYW5pbWF0ZSh7IGN4OiAnOTAuMzg5Myd9LCA1MDAsXG4gICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgdGFwZUwuYXR0cih7IGN4OiAnOTIuMzg5Myd9KTtcbiAgICAgICAgICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgICAgZnVuY3Rpb24gdGFwZUFuaW1hdGlvblIoKSB7XG4gICAgICAgIHRhcGVSLmFuaW1hdGUoeyBjeDogJzMzMC4zODknfSwgNTAwLFxuICAgICAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgIHRhcGVSLmF0dHIoeyBjeDogJzMyOC4zODknfSk7XG4gICAgICAgICAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuICAgICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgICAgd2hlZWxBbmltYXRpb25MKCk7XG4gICAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHN0b3BXaGVlbEFuaW1hdGlvbigpIHtcbiAgICAgICAgd2hlZWxMLnN0b3AoKTtcbiAgICAgICAgd2hlZWxSLnN0b3AoKTtcbiAgICAgICAgdGFwZUwuc3RvcCgpO1xuICAgICAgICB0YXBlUi5zdG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG4gICAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICAgIHhSZWMgPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGxheVN0b3AoKSB7XG4gICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcbiAgICAgICAgZm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcbiAgICAgICAgc3RvcEFuaW1hdGlvbigpO1xuICAgICAgICBYRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuICAgICAgICBpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcbiAgICAgICAgICBjdXJyZW50VHJhY2sgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudFRyYWNrKys7XG4gICAgICAgIH1cblxuICAgICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHBsYXkgZnVuY3Rpb25cbiAgICAgIHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgICBpZihhdWRpby5wYXVzZWQpIHtcblxuICAgICAgICAgIC8vIHBsYXkgc3RhdGVcbiAgICAgICAgICBwbGF5QWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG4gICAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIG5vdCByZWNvcmRpbmdcbiAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXG4gICAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgICAgICAvL2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAvLyBwYXVzZSBzdGF0ZVxuICAgICAgICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgICAgICAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcbiAgICAgICAgICAgIHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuICAgICAgICAgICAgYXVkaW8ucGF1c2UoKTtcblxuICAgICAgICAgICAgaWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgICAgIHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gZW5kIHBsYXkgZnVuY3Rpb25cblxuICAgICAgLy8gYmFja3dhcmQgZnVuY3Rpb25cbiAgICAgIGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgICB2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcbiAgICAgICAgfTtcblxuICAgICAgICBhbmltMSgpO1xuXG4gICAgICAgIGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG4gICAgICAgICAgY3VycmVudFRyYWNrLS07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICBhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cbiAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgICB9XG5cbiAgICAgIH0pO1xuICAgICAgLy8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cbiAgICAgIC8vIGZvcndhcmQgZnVuY3Rpb25cbiAgICAgIGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLy8gYnV0dG9uIGFuaW0xXG4gICAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFuaW0xKCk7XG5cbiAgICAgICAgaWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG4gICAgICAgICAgY3VycmVudFRyYWNrID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgICAgfVxuXG4gICAgICAgIGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuICAgICAgICB0aXRsZVVwZGF0ZSgpO1xuXG4gICAgICAgIGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcbiAgICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuICAgICAgZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcbiAgICAgICAgdHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG4gICAgICB9XG5cbiAgICAgIC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cbiAgICAgIGZ1bmN0aW9uIF9fbG9nKGUsIGRhdGEpIHtcbiAgICAgICAgbG9nVGV4dC5ub2RlLmlubmVySFRNTCA9IFwiXFxuXCIgKyBlICsgXCIgXCIgKyAoZGF0YSB8fCAnJyk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHN0YXJ0VXNlck1lZGlhKHN0cmVhbSkge1xuXHRcdFx0XHR2YXIgaW5wdXQgPSBhdWRpb19jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG5cdFx0XHRcdF9fbG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcblxuXHRcdFx0XHRyZWNvcmRlciA9IG5ldyBSZWNvcmRlcihpbnB1dCk7XG5cdFx0XHRcdF9fbG9nKCdSZWFkeSEnKTtcblx0XHRcdH1cblxuXG4gICAgICAvLyByZWMgZnVuY3Rpb25cbiAgICAgIHJlYy5jbGljayhmdW5jdGlvbihvaykge1xuXG4gICAgICAgIGlmICgheFJlYyl7IC8vaXMgbm90IHJlY29yZGluZ1xuXG4gICAgICAgICAgcmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuICAgICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB4UmVjID0gdHJ1ZTtcblxuICAgICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnJlY29yZCgpO1xuXG4gICAgICAgICAgX19sb2coJ1JlY29yZGluZy4uLicpO1xuXG4gICAgICAgIH0gIGVsc2UgeyAvL3N0b3AgcmVjb3JkaW5nXG5cbiAgICAgICAgICByZWNTdG9wKCk7XG5cbiAgICAgICAgICBpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblxuICAgICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIuc3RvcCgpO1xuXG4gICAgICAgICAgX19sb2coJ1N0b3BwZWQgcmVjLicpO1xuXG4gICAgICAgICAgLy8gY3JlYXRlIFdBViBkb3dubG9hZCBsaW5rIHVzaW5nIGF1ZGlvIGRhdGEgYmxvYlxuICAgICAgICAgIGNyZWF0ZURvd25sb2FkTGluaygpO1xuXG4gICAgICAgICAgcmVjb3JkZXIuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cbiAgICAgIGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkTGluaygpIHtcblx0XHRcdFx0cmVjb3JkZXIgJiYgcmVjb3JkZXIuZXhwb3J0V0FWKGZ1bmN0aW9uKGJsb2IpIHtcblx0XHRcdFx0XHR2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0XHRcdFx0XHR2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXHRcdFx0XHRcdHZhciBhdSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG5cdFx0XHRcdFx0dmFyIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG5cdFx0XHRcdFx0YXUuY29udHJvbHMgPSB0cnVlO1xuXHRcdFx0XHRcdGF1LnNyYyA9IHVybDtcblx0XHRcdFx0XHRoZi5ocmVmID0gdXJsO1xuXHRcdFx0XHRcdGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuXHRcdFx0XHRcdGhmLmlubmVySFRNTCA9IGhmLmRvd25sb2FkO1xuXG4gICAgICAgIFx0cmVjb3JkaW5nc2xpc3QuaW5zZXJ0QWRqYWNlbnRIVE1MKCdiZWZvcmViZWdpbicsICc8bGkgY2xhc3M9XCJtZGwtbGlzdF9faXRlbVwiPjxzcGFuIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW0tcHJpbWFyeS1jb250ZW50XCIgPjxpIGNsYXNzPVwibWF0ZXJpYWwtaWNvbnMgbWRsLWxpc3RfX2l0ZW0taWNvblwiPm1pYzwvaT4nICsgaGYuZG93bmxvYWQgKyAnPC9zcGFuPjxzcGFuIGNsYXNzPVwibWRsLWxpc3RfX2l0ZW0tc2Vjb25kYXJ5LWFjdGlvblwiPjxhIGNsYXNzPVwibWRsLWJ1dHRvbiBtZGwtanMtYnV0dG9uIG1kbC1idXR0b24tLWFjY2VudFwiIGhyZWY9XCInICsgdXJsICsgJ1wiXCIgZG93bmxvYWQ+RG93bmxvYWQgPGkgY2xhc3M9XCJtYXRlcmlhbC1pY29uc1wiPmZpbGVfZG93bmxvYWQ8L2k+PC9hPjwvc3Bhbj48L2xpPicpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0d2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uIGluaXQoKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Ly8gd2Via2l0IHNoaW1cblx0XHRcdFx0XHR3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXHRcdFx0XHRcdG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPSAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhKTsgLy90aGlzIHdpbGwgc2V0IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgdG8gd2hhdGV2ZXIgaXQgZGV0ZWN0cyB0byBiZSB0aGUgcHJvcGVyIHByZWZpeGVkIHZlcnNpb24uXG5cdFx0XHRcdFx0d2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcblxuXHRcdFx0XHRcdGF1ZGlvX2NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0O1xuXHRcdFx0XHRcdF9fbG9nKCdBdWRpbyBjb250ZXh0IHNldCB1cC4nKTtcblx0XHRcdFx0Ly9cdF9fbG9nKCduYXZpZ2F0b3IuZ2V0VXNlck1lZGlhICcgKyAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSA/ICdhdmFpbGFibGUuJyA6ICdub3QgcHJlc2VudCEnKSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRhbGVydCgnTm8gd2ViIGF1ZGlvIHN1cHBvcnQhJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKHthdWRpbzogdHJ1ZX0sIHN0YXJ0VXNlck1lZGlhLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0X19sb2coJ05vIGxpdmUgYXVkaW8gaW5wdXQ6ICcgKyBlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXG4gICAgICB2YXIgc2tldGNoID0gZnVuY3Rpb24obm9pc2VXYXZlKSB7XG5cbiAgICAgICAgdmFyIHVybCxcbiAgICAgICAgICBteUNhbnZhcyxcbiAgICAgICAgICBjb3VudGVyID0gMCxcbiAgICAgICAgICBzdGFydGluZ0FuZ2xlPTcsXG4gICAgICAgICAgZ29SaWdodCA9IHRydWUsXG4gICAgICAgICAgc3RhcnRVcCA9IHRydWUsXG4gICAgICAgICAgbXlGcmFtZVJhdGUgPSAzMCxcbiAgICAgICAgICBydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgICBub2lzZVdhdmUuc2V0dXAgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgIG15Q2FudmFzID0gbm9pc2VXYXZlLmNyZWF0ZUNhbnZhcyhzY3JlZW4ud2lkdGgsIDUwMCk7XG5cbiAgICAgICAgICBteUNhbnZhcy5wYXJlbnQoJ2Nhc3NldGUtcGxheWVyLWN0Jyk7XG5cbiAgICAgICAgICAvLyBDcmVhdGUgYW4gQXVkaW8gaW5wdXRcbiAgICAgICAgICBtaWMgPSBuZXcgcDUuQXVkaW9JbigpO1xuXG4gICAgICAgICAgLy8gc3RhcnQgdGhlIEF1ZGlvIElucHV0LlxuICAgICAgICAgIG1pYy5zdGFydCgpO1xuXG4gICAgICAgICAgLy8gY3JlYXRlIGEgc291bmQgcmVjb3JkZXJcbiAgICAgICAgICByZWNvcmRlciA9IG5ldyBwNS5Tb3VuZFJlY29yZGVyKCk7XG5cbiAgICAgICAgICAvLyBjb25uZWN0IHRoZSBtaWMgdG8gdGhlIHJlY29yZGVyXG4gICAgICAgICAgcmVjb3JkZXIuc2V0SW5wdXQobWljKTtcblxuICAgICAgICAgIC8vIGNyZWF0ZSBhbiBlbXB0eSBzb3VuZCBmaWxlIHRoYXQgd2Ugd2lsbCB1c2UgdG8gcGxheWJhY2sgdGhlIHJlY29yZGluZ1xuICAgICAgICAgIHNvdW5kRmlsZSA9IG5ldyBwNS5Tb3VuZEZpbGUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBub2lzZVdhdmUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgdmFyIHlvZmYgPSAwLjA7XG4gICAgICAgICAgLy8gR2V0IHRoZSBvdmVyYWxsIHZvbHVtZSAoYmV0d2VlbiAwIGFuZCAxLjApXG4gICAgICAgICAgdmFyIHZvbCA9IG1pYy5nZXRMZXZlbCgpO1xuXG4gICAgICAgICAgbm9pc2VXYXZlLmJhY2tncm91bmQoMjU1LCAyNTUsIDI1NSk7XG4gICAgICAgICAgbm9pc2VXYXZlLnN0cm9rZSgyNSwgMjAyLCAxNDQpO1xuICAgICAgICAgIG5vaXNlV2F2ZS5maWxsKDI1LCAyMDIsIDE0NCk7XG5cbiAgICAgICAgICAvLyBXZSBhcmUgZ29pbmcgdG8gZHJhdyBhIHBvbHlnb24gb3V0IG9mIHRoZSB3YXZlIHBvaW50c1xuICAgICAgICAgIG5vaXNlV2F2ZS5iZWdpblNoYXBlKCk7XG5cbiAgICAgICAgICB2YXIgeG9mZiA9IDA7ICAgICAgIC8vIE9wdGlvbiAjMTogMkQgTm9pc2VcblxuICAgICAgICAgIC8vIEl0ZXJhdGUgb3ZlciBob3Jpem9udGFsIHBpeGVsc1xuICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDw9IHNjcmVlbi53aWR0aDsgeCArPSAxMCkge1xuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGEgeSB2YWx1ZSBhY2NvcmRpbmcgdG8gbm9pc2UsIG1hcCB0b1xuXG4gICAgICAgICAgICAvL21hcCh2YWx1ZSxzdGFydDEsc3RvcDEsc3RhcnQyLHN0b3AyKVxuICAgICAgICAgICAgdmFyIHkgPSBub2lzZVdhdmUubWFwKG5vaXNlV2F2ZS5ub2lzZSh4b2ZmLCB5b2ZmKSwgMCwgMSwgMjAwLDMwMCk7XG5cbiAgICAgICAgICAgIC8vIFNldCB0aGUgdmVydGV4XG4gICAgICAgICAgICBub2lzZVdhdmUudmVydGV4KHgsIHkpO1xuICAgICAgICAgICAgLy8gSW5jcmVtZW50IHggZGltZW5zaW9uIGZvciBub2lzZVxuICAgICAgICAgICAgeG9mZiArPSB2b2w7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGluY3JlbWVudCB5IGRpbWVuc2lvbiBmb3Igbm9pc2VcbiAgICAgICAgICB5b2ZmICs9IHZvbDtcbiAgICAgICAgICBub2lzZVdhdmUudmVydGV4KHNjcmVlbi53aWR0aCwgc2NyZWVuLmhlaWdodCk7XG4gICAgICAgICAgbm9pc2VXYXZlLnZlcnRleCgwLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgICBub2lzZVdhdmUuZW5kU2hhcGUobm9pc2VXYXZlLkNMT1NFKTtcbiAgICAgICAgfTtcblxuXG4gICAgICB9Oy8vIHZhciBza2V0Y2hcblxuICAgICAgdmFyIG15UDUgPSBuZXcgcDUoc2tldGNoKTtcblxuICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBfX2xvZygnTm8gbGl2ZSBhdWRpbyBpbnB1dDogJyArIGUpO1xuICAgICAgfSk7XG5cbn0pOyAvLyBkb2MgcmVhZHlcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==