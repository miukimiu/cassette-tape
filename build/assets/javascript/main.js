
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

			// *************** ok
			function setup() {
			  createCanvas(windowWidth, 500);

			  // Create an Audio input
			  mic = new p5.AudioIn();

			  // start the Audio Input.
			  mic.start();
			}

			function draw() {

			  // Get the overall volume (between 0 and 1.0)
			  var vol = mic.getLevel();

				console.log('vol: ' + vol);

				background(255, 255, 255);
				stroke(25, 202, 144);
				fill(25, 202, 144);

				// We are going to draw a polygon out of the wave points
				beginShape();

				var xoff = 0;       // Option #1: 2D Noise

				// Iterate over horizontal pixels
				for (var x = 0; x <= width; x += 10) {
					// Calculate a y value according to noise, map to

					// Option #1: 2D Noise
					//map(value,start1,stop1,start2,stop2)
					var y = map(noise(xoff, yoff), 0, 1, 100,350);

					// Set the vertex
					vertex(x, y);
					// Increment x dimension for noise
					xoff += vol;
				}
				// increment y dimension for noise
				yoff += vol;
				vertex(width, height);
				vertex(0, height);
				endShape(CLOSE);
			}

			function windowResized() {
			  resizeCanvas(windowWidth, 400);
			}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblx0XHR2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuXHRcdFx0eFJlYyA9IGZhbHNlLFxuXHRcdFx0YmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcblx0XHRcdHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcblx0XHRcdHBsYXlTdGF0ZSA9IFNuYXAoJyNwbGF5U3RhdGUnKSxcblx0XHRcdHBhdXNlU3RhdGUgPSBTbmFwKCcjcGF1c2VTdGF0ZScpLFxuXHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGUgPSBTbmFwKCcjdGFwZScpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRsb2dUZXh0ID0gU25hcCgnI3JlY29yZGluZ1RleHQgdHNwYW4nKSxcblx0XHRcdHRyYWNrdGl0bGUgPSBTbmFwKCcjdHJhY2t0aXRsZSB0c3BhbicpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG5cdFx0XHRhdWRpbyA9IG5ldyBBdWRpbygpLFxuXHRcdFx0ZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcblx0XHRcdHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcblx0XHRcdGRpciA9IFwiYXVkaW8vXCIsXG5cdFx0XHRleHQgPSBcIi5tcDNcIixcblx0XHRcdGlucHV0LFxuXHRcdFx0YW5hbHl6ZXIsXG5cdFx0XHRjdXJyZW50VHJhY2sgPSAwLFxuXHRcdFx0c2Vla3NsaWRlcixcblx0XHRcdHNlZWtpbmc9ZmFsc2UsXG5cdFx0XHRhdWRpb19jb250ZXh0LFxuXHRcdFx0cmVjb3JkZXIsXG5cdFx0XHRzZWVrdG8sXG5cdFx0XHR5b2ZmID0gMC4wO1xuXG5cdFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuXHRcdFx0Ly8gQXVkaW8gT2JqZWN0XG5cdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG5cdFx0XHRzZWVrc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWVrc2xpZGVyXCIpO1xuXG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRUaW1lID0gMDtcblx0XHRcdFx0dGhpcy5wbGF5KCk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cblxuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXsgdGl0bGVVcGRhdGUoKTsgfSk7XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHRhcGVMLmFuaW1hdGUoeyBjeDogJzkwLjM4OTMnfSwgNTAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRcdHRhcGVMLmF0dHIoeyBjeDogJzkyLjM4OTMnfSk7XG5cdFx0XHRcdFx0XHRcdHRhcGVBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25SKCkge1xuXHRcdFx0XHR0YXBlUi5hbmltYXRlKHsgY3g6ICczMzAuMzg5J30sIDUwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR0YXBlUi5hdHRyKHsgY3g6ICczMjguMzg5J30pO1xuXHRcdFx0XHRcdFx0XHR0YXBlQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25SKCk7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHR0YXBlQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHR0YXBlQW5pbWF0aW9uUigpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBzdG9wV2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCk7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCk7XG5cdFx0XHRcdHRhcGVMLnN0b3AoKTtcblx0XHRcdFx0dGFwZVIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICByZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHR4UmVjID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuXHRcdFx0ICBcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG5cdFx0XHRcdGZvcndhcmQudHJhbnNmb3JtKCd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0WEZvcndhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIG5leHRUcmFjayAoKSB7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblxuXHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cblx0XHRcdH1cblxuXHRcdFx0Ly8gcGxheSBmdW5jdGlvblxuXHRcdFx0cGxheVBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQgXHRpZihhdWRpby5wYXVzZWQpIHtcblxuXHRcdFx0IFx0XHQvLyBwbGF5IHN0YXRlXG5cblx0XHRcdCBcdFx0cGxheUFjdGl2ZSA9IHRydWU7XG5cblx0XHRcdCBcdFx0cGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblx0XHRcdCBcdFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG5cdFx0XHQgXHRcdC8vY29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cblx0XHRcdFx0XHRpZiAoIXhSZWMpIHsgLy8gaXMgbm90IHJlY29yZGluZ1xuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXHRcdFx0XHRcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXG5cdFx0XHRcdCAgICAvL2F1ZGlvLnBsYXkoKTtcblx0XHRcdFx0ICAgIHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdCAgICB9IGVsc2Uge1xuXG5cdFx0XHQgICAgXHQvLyBwYXVzZSBzdGF0ZVxuXG5cdFx0XHQgICAgXHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cblx0XHRcdCAgICBcdHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRcdFx0ICAgIFx0cGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cblx0XHRcdCAgICBcdC8vY29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cblx0XHRcdFx0ICAgIGF1ZGlvLnBhdXNlKCk7XG5cblx0XHRcdFx0ICBcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHQgIFx0XHRzdG9wV2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0ICBcdH1cblx0XHRcdFx0ICBcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgICB9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cblx0XHRcdC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHRiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0YW5pbTEoKTtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPiAwICkge1xuXG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrLS07XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0XHRpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdC8vIGZvcndhcmQgZnVuY3Rpb25cblx0XHRcdGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG5cdFx0XHRmdW5jdGlvbiB0aXRsZVVwZGF0ZSgpe1xuXHRcdFx0XHR0cmFja3RpdGxlLm5vZGUuaW5uZXJIVE1MID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gKioqKioqKiogUmVjb3JkZXIgKioqKioqKiAvL1xuXHRcdFx0ZnVuY3Rpb24gX19sb2coZSwgZGF0YSkge1xuXHRcdFx0XHRsb2dUZXh0Lm5vZGUuaW5uZXJIVE1MID0gXCJcXG5cIiArIGUgKyBcIiBcIiArIChkYXRhIHx8ICcnKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gc3RhcnRVc2VyTWVkaWEoc3RyZWFtKSB7XG5cdFx0XHRcdHZhciBpbnB1dCA9IGF1ZGlvX2NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcblx0XHRcdFx0X19sb2coJ01lZGlhIHN0cmVhbSBjcmVhdGVkLicpO1xuXHRcdFx0XHQvLyBVbmNvbW1lbnQgaWYgeW91IHdhbnQgdGhlIGF1ZGlvIHRvIGZlZWRiYWNrIGRpcmVjdGx5XG5cdFx0XHRcdC8vaW5wdXQuY29ubmVjdChhdWRpb19jb250ZXh0LmRlc3RpbmF0aW9uKTtcblx0XHRcdFx0Ly9fX2xvZygnSW5wdXQgY29ubmVjdGVkIHRvIGF1ZGlvIGNvbnRleHQgZGVzdGluYXRpb24uJyk7XG5cblx0XHRcdFx0cmVjb3JkZXIgPSBuZXcgUmVjb3JkZXIoaW5wdXQpO1xuXHRcdFx0XHRfX2xvZygnUmVhZHkhJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHJlYyBmdW5jdGlvblxuXHRcdFx0cmVjLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdGlmICgheFJlYyl7IC8vaXMgbm90IHJlY29yZGluZ1xuXG5cdFx0XHRcdFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXHRcdFx0XHRcdC8vIHdoZWVscyBldmVudHNcblxuXHRcdFx0XHRcdGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR4UmVjID0gdHJ1ZTtcblxuXHRcdFx0XHRcdHJlY29yZGVyICYmIHJlY29yZGVyLnJlY29yZCgpO1xuXG5cdFx0XHRcdFx0X19sb2coJ1JlY29yZGluZy4uLicpO1xuXG5cdFx0XHRcdH0gIGVsc2UgeyAvL3N0b3AgcmVjb3JkaW5nXG5cdFx0XHRcdFx0cmVjU3RvcCgpO1xuXG5cdFx0XHRcdFx0aWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cblx0XHRcdFx0XHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlY29yZGVyICYmIHJlY29yZGVyLnN0b3AoKTtcblxuXHRcdFx0XHRcdF9fbG9nKCdTdG9wcGVkIHJlY29yZGluZy4nKTtcblxuXHRcdFx0XHRcdC8vIGNyZWF0ZSBXQVYgZG93bmxvYWQgbGluayB1c2luZyBhdWRpbyBkYXRhIGJsb2Jcblx0XHRcdFx0XHRjcmVhdGVEb3dubG9hZExpbmsoKTtcblxuXHRcdFx0XHRcdHJlY29yZGVyLmNsZWFyKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHJlYyBmdW5jdGlvblxuXG5cdFx0XHRmdW5jdGlvbiBjcmVhdGVEb3dubG9hZExpbmsoKSB7XG5cdFx0XHRcdHJlY29yZGVyICYmIHJlY29yZGVyLmV4cG9ydFdBVihmdW5jdGlvbihibG9iKSB7XG5cdFx0XHRcdFx0dmFyIHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdFx0dmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0XHRcdFx0XHR2YXIgYXUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuXHRcdFx0XHRcdHZhciBoZiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblxuXHRcdFx0XHRcdGF1LmNvbnRyb2xzID0gdHJ1ZTtcblx0XHRcdFx0XHRhdS5zcmMgPSB1cmw7XG5cdFx0XHRcdFx0aGYuaHJlZiA9IHVybDtcblx0XHRcdFx0XHRoZi5kb3dubG9hZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSArICcud2F2Jztcblx0XHRcdFx0XHRoZi5pbm5lckhUTUwgPSBoZi5kb3dubG9hZDtcblx0XHRcdFx0XHQvL2xpLmFwcGVuZENoaWxkKGF1KTsgLy8gSSBkb24ndCB3YW50IHRoZSBkZWZhdWx0IGJyb3dzZXIgcGxheWVyLlxuXHRcdFx0XHRcdGxpLmFwcGVuZENoaWxkKGhmKTsgLy8gaSBqdXN0IHdhbnQgdGhlIGxpbmsgb2YgdGhlIHJlY29yZGVkIGF1ZGlvIHRvIGRvd25sb2FkXG5cdFx0XHRcdFx0cmVjb3JkaW5nc2xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdFx0d2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uIGluaXQoKSB7XG5cdFx0XHRcdHRyeSB7XG5cdFx0XHRcdFx0Ly8gd2Via2l0IHNoaW1cblx0XHRcdFx0XHR3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXHRcdFx0XHRcdG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPSAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1zR2V0VXNlck1lZGlhKTsgLy90aGlzIHdpbGwgc2V0IG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgdG8gd2hhdGV2ZXIgaXQgZGV0ZWN0cyB0byBiZSB0aGUgcHJvcGVyIHByZWZpeGVkIHZlcnNpb24uXG5cdFx0XHRcdFx0d2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcblxuXHRcdFx0XHRcdGF1ZGlvX2NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0O1xuXHRcdFx0XHRcdF9fbG9nKCdBdWRpbyBjb250ZXh0IHNldCB1cC4nKTtcblx0XHRcdFx0XHRfX2xvZygnbmF2aWdhdG9yLmdldFVzZXJNZWRpYSAnICsgKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgPyAnYXZhaWxhYmxlLicgOiAnbm90IHByZXNlbnQhJykpO1xuXHRcdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdFx0YWxlcnQoJ05vIHdlYiBhdWRpbyBzdXBwb3J0IGluIHRoaXMgYnJvd3NlciEnKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoe2F1ZGlvOiB0cnVlfSwgc3RhcnRVc2VyTWVkaWEsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0XHRfX2xvZygnTm8gbGl2ZSBhdWRpbyBpbnB1dDogJyArIGUpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH07XG5cblx0XHRcdC8vICoqKioqKioqKioqKioqKiBva1xuXHRcdFx0ZnVuY3Rpb24gc2V0dXAoKSB7XG5cdFx0XHQgIGNyZWF0ZUNhbnZhcyh3aW5kb3dXaWR0aCwgNTAwKTtcblxuXHRcdFx0ICAvLyBDcmVhdGUgYW4gQXVkaW8gaW5wdXRcblx0XHRcdCAgbWljID0gbmV3IHA1LkF1ZGlvSW4oKTtcblxuXHRcdFx0ICAvLyBzdGFydCB0aGUgQXVkaW8gSW5wdXQuXG5cdFx0XHQgIG1pYy5zdGFydCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBkcmF3KCkge1xuXG5cdFx0XHQgIC8vIEdldCB0aGUgb3ZlcmFsbCB2b2x1bWUgKGJldHdlZW4gMCBhbmQgMS4wKVxuXHRcdFx0ICB2YXIgdm9sID0gbWljLmdldExldmVsKCk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coJ3ZvbDogJyArIHZvbCk7XG5cblx0XHRcdFx0YmFja2dyb3VuZCgyNTUsIDI1NSwgMjU1KTtcblx0XHRcdFx0c3Ryb2tlKDI1LCAyMDIsIDE0NCk7XG5cdFx0XHRcdGZpbGwoMjUsIDIwMiwgMTQ0KTtcblxuXHRcdFx0XHQvLyBXZSBhcmUgZ29pbmcgdG8gZHJhdyBhIHBvbHlnb24gb3V0IG9mIHRoZSB3YXZlIHBvaW50c1xuXHRcdFx0XHRiZWdpblNoYXBlKCk7XG5cblx0XHRcdFx0dmFyIHhvZmYgPSAwOyAgICAgICAvLyBPcHRpb24gIzE6IDJEIE5vaXNlXG5cblx0XHRcdFx0Ly8gSXRlcmF0ZSBvdmVyIGhvcml6b250YWwgcGl4ZWxzXG5cdFx0XHRcdGZvciAodmFyIHggPSAwOyB4IDw9IHdpZHRoOyB4ICs9IDEwKSB7XG5cdFx0XHRcdFx0Ly8gQ2FsY3VsYXRlIGEgeSB2YWx1ZSBhY2NvcmRpbmcgdG8gbm9pc2UsIG1hcCB0b1xuXG5cdFx0XHRcdFx0Ly8gT3B0aW9uICMxOiAyRCBOb2lzZVxuXHRcdFx0XHRcdC8vbWFwKHZhbHVlLHN0YXJ0MSxzdG9wMSxzdGFydDIsc3RvcDIpXG5cdFx0XHRcdFx0dmFyIHkgPSBtYXAobm9pc2UoeG9mZiwgeW9mZiksIDAsIDEsIDEwMCwzNTApO1xuXG5cdFx0XHRcdFx0Ly8gU2V0IHRoZSB2ZXJ0ZXhcblx0XHRcdFx0XHR2ZXJ0ZXgoeCwgeSk7XG5cdFx0XHRcdFx0Ly8gSW5jcmVtZW50IHggZGltZW5zaW9uIGZvciBub2lzZVxuXHRcdFx0XHRcdHhvZmYgKz0gdm9sO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vIGluY3JlbWVudCB5IGRpbWVuc2lvbiBmb3Igbm9pc2Vcblx0XHRcdFx0eW9mZiArPSB2b2w7XG5cdFx0XHRcdHZlcnRleCh3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdFx0dmVydGV4KDAsIGhlaWdodCk7XG5cdFx0XHRcdGVuZFNoYXBlKENMT1NFKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gd2luZG93UmVzaXplZCgpIHtcblx0XHRcdCAgcmVzaXplQ2FudmFzKHdpbmRvd1dpZHRoLCA0MDApO1xuXHRcdFx0fVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9