
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
			seekto,
			yoff = 0.0;

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

			function setup() {
			  createCanvas(710, 400);

			  // Create an Audio input
			  mic = new p5.AudioIn();

			  // start the Audio Input.
			  // By default, it does not .connect() (to the computer speakers)
			  mic.start();
			}

			function draw() {
			  background(200);

				fill(555);

			  // Get the overall volume (between 0 and 1.0)
			  var vol = mic.getLevel();

				console.log(vol);

				background(51);

				fill(255);
				// We are going to draw a polygon out of the wave points
				beginShape();

				var xoff = 0;       // Option #1: 2D Noise

				// Iterate over horizontal pixels
				for (var x = 0; x <= width; x += 10) {
					// Calculate a y value according to noise, map to

					// Option #1: 2D Noise
					var y = map(noise(xoff, yoff), 0, 1, 200,300);

					// Set the vertex
					vertex(x, y);
					// Increment x dimension for noise
					xoff += (0.05 + vol);
				}
				// increment y dimension for noise
				yoff += (0.1 + vol);
				vertex(width, height);
				vertex(0, height);
				endShape(CLOSE);
			}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblx0XHR2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuXHRcdFx0eFJlYyA9IGZhbHNlLFxuXHRcdFx0YmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcblx0XHRcdHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcblx0XHRcdHBsYXlTdGF0ZSA9IFNuYXAoJyNwbGF5U3RhdGUnKSxcblx0XHRcdHBhdXNlU3RhdGUgPSBTbmFwKCcjcGF1c2VTdGF0ZScpLFxuXHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGUgPSBTbmFwKCcjdGFwZScpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRsb2dUZXh0ID0gU25hcCgnI3JlY29yZGluZ1RleHQgdHNwYW4nKSxcblx0XHRcdHRyYWNrdGl0bGUgPSBTbmFwKCcjdHJhY2t0aXRsZSB0c3BhbicpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG5cdFx0XHRhdWRpbyA9IG5ldyBBdWRpbygpLFxuXHRcdFx0ZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcblx0XHRcdHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcblx0XHRcdGRpciA9IFwiYXVkaW8vXCIsXG5cdFx0XHRleHQgPSBcIi5tcDNcIixcblx0XHRcdGlucHV0LFxuXHRcdFx0YW5hbHl6ZXIsXG5cdFx0XHRjdXJyZW50VHJhY2sgPSAwLFxuXHRcdFx0c2Vla3NsaWRlcixcblx0XHRcdHNlZWtpbmc9ZmFsc2UsXG5cdFx0XHRhdWRpb19jb250ZXh0LFxuXHRcdFx0cmVjb3JkZXIsXG5cdFx0XHRzZWVrdG8sXG5cdFx0XHR5b2ZmID0gMC4wO1xuXG5cdFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuXHRcdFx0Ly8gQXVkaW8gT2JqZWN0XG5cdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG5cdFx0XHRzZWVrc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWVrc2xpZGVyXCIpO1xuXG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRUaW1lID0gMDtcblx0XHRcdFx0dGhpcy5wbGF5KCk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cblxuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXsgdGl0bGVVcGRhdGUoKTsgfSk7XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHRhcGVMLmFuaW1hdGUoeyBjeDogJzkwLjM4OTMnfSwgNTAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRcdHRhcGVMLmF0dHIoeyBjeDogJzkyLjM4OTMnfSk7XG5cdFx0XHRcdFx0XHRcdHRhcGVBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25SKCkge1xuXHRcdFx0XHR0YXBlUi5hbmltYXRlKHsgY3g6ICczMzAuMzg5J30sIDUwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR0YXBlUi5hdHRyKHsgY3g6ICczMjguMzg5J30pO1xuXHRcdFx0XHRcdFx0XHR0YXBlQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25SKCk7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHR0YXBlQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHR0YXBlQW5pbWF0aW9uUigpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBzdG9wV2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCk7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCk7XG5cdFx0XHRcdHRhcGVMLnN0b3AoKTtcblx0XHRcdFx0dGFwZVIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICBcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gcGxheVN0b3AoKSB7XG5cdFx0XHQgIFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcblx0XHRcdFx0Zm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHRYRm9yd2FyZCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXG5cdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblxuXHRcdFx0fVxuXG5cdFx0XHQvLyBwbGF5IGZ1bmN0aW9uXG5cdFx0XHRwbGF5UGF1c2UuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdCBcdGlmKGF1ZGlvLnBhdXNlZCkge1xuXG5cdFx0XHQgXHRcdC8vIHBsYXkgc3RhdGVcblxuXHRcdFx0IFx0XHRwbGF5QWN0aXZlID0gdHJ1ZTtcblxuXHRcdFx0IFx0XHRwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRcdFx0IFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cblx0XHRcdCBcdFx0Ly9jb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuXHRcdFx0XHRcdGlmICgheFJlYykgeyAvLyBpcyBub3QgcmVjb3JkaW5nXG5cdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0IFx0XHR9XG5cdFx0XHRcdFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cblx0XHRcdFx0ICAgIC8vYXVkaW8ucGxheSgpO1xuXHRcdFx0XHQgICAgdGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0ICAgIH0gZWxzZSB7XG5cblx0XHRcdCAgICBcdC8vIHBhdXNlIHN0YXRlXG5cblx0XHRcdCAgICBcdHBsYXlBY3RpdmUgPSBmYWxzZTtcblxuXHRcdFx0ICAgIFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cdFx0XHQgICAgXHRwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuXHRcdFx0ICAgIFx0Ly9jb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuXHRcdFx0XHQgICAgYXVkaW8ucGF1c2UoKTtcblxuXHRcdFx0XHQgIFx0aWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdCAgXHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHQgIFx0fVxuXHRcdFx0XHQgIFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0ICAgIH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHBsYXkgZnVuY3Rpb25cblxuXHRcdFx0Ly8gYmFja3dhcmQgZnVuY3Rpb25cblx0XHRcdGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRhbmltMSgpO1xuXG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG5cblx0XHRcdFx0XHRjdXJyZW50VHJhY2stLTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuXHRcdFx0XHR0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHRcdGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblxuXHRcdFx0Ly8gZm9yd2FyZCBmdW5jdGlvblxuXHRcdFx0Zm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0YW5pbTEoKTtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKCdmdyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0XHRpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBmb3J3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdGZ1bmN0aW9uIHRpdGxlVXBkYXRlKCl7XG5cdFx0XHRcdHRyYWNrdGl0bGUubm9kZS5pbm5lckhUTUwgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyAqKioqKioqKiBSZWNvcmRlciAqKioqKioqIC8vXG5cdFx0XHRmdW5jdGlvbiBfX2xvZyhlLCBkYXRhKSB7XG5cdFx0XHRcdGxvZ1RleHQubm9kZS5pbm5lckhUTUwgPSBcIlxcblwiICsgZSArIFwiIFwiICsgKGRhdGEgfHwgJycpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBzdGFydFVzZXJNZWRpYShzdHJlYW0pIHtcblx0XHRcdFx0dmFyIGlucHV0ID0gYXVkaW9fY29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShzdHJlYW0pO1xuXHRcdFx0XHRfX2xvZygnTWVkaWEgc3RyZWFtIGNyZWF0ZWQuJyk7XG5cdFx0XHRcdC8vIFVuY29tbWVudCBpZiB5b3Ugd2FudCB0aGUgYXVkaW8gdG8gZmVlZGJhY2sgZGlyZWN0bHlcblx0XHRcdFx0Ly9pbnB1dC5jb25uZWN0KGF1ZGlvX2NvbnRleHQuZGVzdGluYXRpb24pO1xuXHRcdFx0XHQvL19fbG9nKCdJbnB1dCBjb25uZWN0ZWQgdG8gYXVkaW8gY29udGV4dCBkZXN0aW5hdGlvbi4nKTtcblxuXHRcdFx0XHRyZWNvcmRlciA9IG5ldyBSZWNvcmRlcihpbnB1dCk7XG5cdFx0XHRcdF9fbG9nKCdSZWFkeSEnKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gcmVjIGZ1bmN0aW9uXG5cdFx0XHRyZWMuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0aWYgKCF4UmVjKXsgLy9pcyBub3QgcmVjb3JkaW5nXG5cblx0XHRcdFx0XHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHRcdFx0Ly8gd2hlZWxzIGV2ZW50c1xuXG5cdFx0XHRcdFx0aWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHhSZWMgPSB0cnVlO1xuXG5cdFx0XHRcdFx0cmVjb3JkZXIgJiYgcmVjb3JkZXIucmVjb3JkKCk7XG5cblx0XHRcdFx0XHRfX2xvZygnUmVjb3JkaW5nLi4uJyk7XG5cblx0XHRcdFx0fSAgZWxzZSB7IC8vc3RvcCByZWNvcmRpbmdcblx0XHRcdFx0XHRyZWNTdG9wKCk7XG5cblx0XHRcdFx0XHRpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblxuXHRcdFx0XHRcdFx0c3RvcFdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVjb3JkZXIgJiYgcmVjb3JkZXIuc3RvcCgpO1xuXG5cdFx0XHRcdFx0X19sb2coJ1N0b3BwZWQgcmVjb3JkaW5nLicpO1xuXG5cdFx0XHRcdFx0Ly8gY3JlYXRlIFdBViBkb3dubG9hZCBsaW5rIHVzaW5nIGF1ZGlvIGRhdGEgYmxvYlxuXHRcdFx0XHRcdGNyZWF0ZURvd25sb2FkTGluaygpO1xuXG5cdFx0XHRcdFx0cmVjb3JkZXIuY2xlYXIoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkTGluaygpIHtcblx0XHRcdFx0cmVjb3JkZXIgJiYgcmVjb3JkZXIuZXhwb3J0V0FWKGZ1bmN0aW9uKGJsb2IpIHtcblx0XHRcdFx0XHR2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0XHRcdFx0XHR2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXHRcdFx0XHRcdHZhciBhdSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG5cdFx0XHRcdFx0dmFyIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG5cdFx0XHRcdFx0YXUuY29udHJvbHMgPSB0cnVlO1xuXHRcdFx0XHRcdGF1LnNyYyA9IHVybDtcblx0XHRcdFx0XHRoZi5ocmVmID0gdXJsO1xuXHRcdFx0XHRcdGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuXHRcdFx0XHRcdGhmLmlubmVySFRNTCA9IGhmLmRvd25sb2FkO1xuXHRcdFx0XHRcdC8vbGkuYXBwZW5kQ2hpbGQoYXUpOyAvLyBJIGRvbid0IHdhbnQgdGhlIGRlZmF1bHQgYnJvd3NlciBwbGF5ZXIuXG5cdFx0XHRcdFx0bGkuYXBwZW5kQ2hpbGQoaGYpOyAvLyBpIGp1c3Qgd2FudCB0aGUgbGluayBvZiB0aGUgcmVjb3JkZWQgYXVkaW8gdG8gZG93bmxvYWRcblx0XHRcdFx0XHRyZWNvcmRpbmdzbGlzdC5hcHBlbmRDaGlsZChsaSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQvLyB3ZWJraXQgc2hpbVxuXHRcdFx0XHRcdHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG5cdFx0XHRcdFx0bmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubXNHZXRVc2VyTWVkaWEpOyAvL3RoaXMgd2lsbCBzZXQgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB0byB3aGF0ZXZlciBpdCBkZXRlY3RzIHRvIGJlIHRoZSBwcm9wZXIgcHJlZml4ZWQgdmVyc2lvbi5cblx0XHRcdFx0XHR3aW5kb3cuVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xuXG5cdFx0XHRcdFx0YXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG5cdFx0XHRcdFx0X19sb2coJ0F1ZGlvIGNvbnRleHQgc2V0IHVwLicpO1xuXHRcdFx0XHRcdF9fbG9nKCduYXZpZ2F0b3IuZ2V0VXNlck1lZGlhICcgKyAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSA/ICdhdmFpbGFibGUuJyA6ICdub3QgcHJlc2VudCEnKSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRhbGVydCgnTm8gd2ViIGF1ZGlvIHN1cHBvcnQgaW4gdGhpcyBicm93c2VyIScpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdF9fbG9nKCdObyBsaXZlIGF1ZGlvIGlucHV0OiAnICsgZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fTtcblxuXHRcdFx0ZnVuY3Rpb24gc2V0dXAoKSB7XG5cdFx0XHQgIGNyZWF0ZUNhbnZhcyg3MTAsIDQwMCk7XG5cblx0XHRcdCAgLy8gQ3JlYXRlIGFuIEF1ZGlvIGlucHV0XG5cdFx0XHQgIG1pYyA9IG5ldyBwNS5BdWRpb0luKCk7XG5cblx0XHRcdCAgLy8gc3RhcnQgdGhlIEF1ZGlvIElucHV0LlxuXHRcdFx0ICAvLyBCeSBkZWZhdWx0LCBpdCBkb2VzIG5vdCAuY29ubmVjdCgpICh0byB0aGUgY29tcHV0ZXIgc3BlYWtlcnMpXG5cdFx0XHQgIG1pYy5zdGFydCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBkcmF3KCkge1xuXHRcdFx0ICBiYWNrZ3JvdW5kKDIwMCk7XG5cblx0XHRcdFx0ZmlsbCg1NTUpO1xuXG5cdFx0XHQgIC8vIEdldCB0aGUgb3ZlcmFsbCB2b2x1bWUgKGJldHdlZW4gMCBhbmQgMS4wKVxuXHRcdFx0ICB2YXIgdm9sID0gbWljLmdldExldmVsKCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2codm9sKTtcblxuXHRcdFx0XHRiYWNrZ3JvdW5kKDUxKTtcblxuXHRcdFx0XHRmaWxsKDI1NSk7XG5cdFx0XHRcdC8vIFdlIGFyZSBnb2luZyB0byBkcmF3IGEgcG9seWdvbiBvdXQgb2YgdGhlIHdhdmUgcG9pbnRzXG5cdFx0XHRcdGJlZ2luU2hhcGUoKTtcblxuXHRcdFx0XHR2YXIgeG9mZiA9IDA7ICAgICAgIC8vIE9wdGlvbiAjMTogMkQgTm9pc2VcblxuXHRcdFx0XHQvLyBJdGVyYXRlIG92ZXIgaG9yaXpvbnRhbCBwaXhlbHNcblx0XHRcdFx0Zm9yICh2YXIgeCA9IDA7IHggPD0gd2lkdGg7IHggKz0gMTApIHtcblx0XHRcdFx0XHQvLyBDYWxjdWxhdGUgYSB5IHZhbHVlIGFjY29yZGluZyB0byBub2lzZSwgbWFwIHRvXG5cblx0XHRcdFx0XHQvLyBPcHRpb24gIzE6IDJEIE5vaXNlXG5cdFx0XHRcdFx0dmFyIHkgPSBtYXAobm9pc2UoeG9mZiwgeW9mZiksIDAsIDEsIDIwMCwzMDApO1xuXG5cdFx0XHRcdFx0Ly8gU2V0IHRoZSB2ZXJ0ZXhcblx0XHRcdFx0XHR2ZXJ0ZXgoeCwgeSk7XG5cdFx0XHRcdFx0Ly8gSW5jcmVtZW50IHggZGltZW5zaW9uIGZvciBub2lzZVxuXHRcdFx0XHRcdHhvZmYgKz0gKDAuMDUgKyB2b2wpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGluY3JlbWVudCB5IGRpbWVuc2lvbiBmb3Igbm9pc2Vcblx0XHRcdFx0eW9mZiArPSAoMC4xICsgdm9sKTtcblx0XHRcdFx0dmVydGV4KHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHR2ZXJ0ZXgoMCwgaGVpZ2h0KTtcblx0XHRcdFx0ZW5kU2hhcGUoQ0xPU0UpO1xuXHRcdFx0fVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9