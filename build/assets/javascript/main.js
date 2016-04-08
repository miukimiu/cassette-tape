
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

			//audio.addEventListener("timeupdate", function(){ timeUpdate(); });
			//audio.addEventListener("loadedmetadata", function(){ timeDurUpdate(); });
			audio.addEventListener("tracktitle", function(){ titleUpdate(); });

			//audio.addEventListener("ended", function(){ nextTrack(); });

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblx0XHR2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuXHRcdFx0eFJlYyA9IGZhbHNlLFxuXHRcdFx0YmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcblx0XHRcdHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcblx0XHRcdHBsYXlTdGF0ZSA9IFNuYXAoJyNwbGF5U3RhdGUnKSxcblx0XHRcdHBhdXNlU3RhdGUgPSBTbmFwKCcjcGF1c2VTdGF0ZScpLFxuXHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGUgPSBTbmFwKCcjdGFwZScpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRsb2dUZXh0ID0gU25hcCgnI3JlY29yZGluZ1RleHQgdHNwYW4nKSxcblx0XHRcdHRyYWNrdGl0bGUgPSBTbmFwKCcjdHJhY2t0aXRsZSB0c3BhbicpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG5cdFx0XHRhdWRpbyA9IG5ldyBBdWRpbygpLFxuXHRcdFx0ZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcblx0XHRcdHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcblx0XHRcdGRpciA9IFwiYXVkaW8vXCIsXG5cdFx0XHRleHQgPSBcIi5tcDNcIixcblx0XHRcdGN1cnJlbnRUcmFjayA9IDAsXG5cdFx0XHRzZWVrc2xpZGVyLFxuXHRcdFx0c2Vla2luZz1mYWxzZSxcblx0XHRcdGF1ZGlvX2NvbnRleHQsXG5cdFx0XHRyZWNvcmRlcixcblx0XHRcdHNlZWt0bztcblxuXHRcdFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cblx0XHRcdC8vIEF1ZGlvIE9iamVjdFxuXHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0WzBdK2V4dDtcblxuXHRcdFx0c2Vla3NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2Vla3NsaWRlclwiKTtcblxuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5jdXJyZW50VGltZSA9IDA7XG5cdFx0XHRcdHRoaXMucGxheSgpO1xuXHRcdFx0fSwgZmFsc2UpO1xuXG5cdFx0XHQvL2F1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIGZ1bmN0aW9uKCl7IHRpbWVVcGRhdGUoKTsgfSk7XG5cdFx0XHQvL2F1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkZWRtZXRhZGF0YVwiLCBmdW5jdGlvbigpeyB0aW1lRHVyVXBkYXRlKCk7IH0pO1xuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXsgdGl0bGVVcGRhdGUoKTsgfSk7XG5cblx0XHRcdC8vYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsIGZ1bmN0aW9uKCl7IG5leHRUcmFjaygpOyB9KTtcblxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcblx0XHRcdFx0d2hlZWxMLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwzMCwzMCd9LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRcdHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuXHRcdFx0XHR3aGVlbFIuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDI3MCwzMCd9LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRcdHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25SKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uTCgpIHtcblx0XHRcdFx0dGFwZUwuYW5pbWF0ZSh7IGN4OiAnOTAuMzg5Myd9LCA1MDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdFx0dGFwZUwuYXR0cih7IGN4OiAnOTIuMzg5Myd9KTtcblx0XHRcdFx0XHRcdFx0dGFwZUFuaW1hdGlvbkwoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvblIoKSB7XG5cdFx0XHRcdHRhcGVSLmFuaW1hdGUoeyBjeDogJzMzMC4zODknfSwgNTAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRcdHRhcGVSLmF0dHIoeyBjeDogJzMyOC4zODknfSk7XG5cdFx0XHRcdFx0XHRcdHRhcGVBbmltYXRpb25SKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdHRhcGVBbmltYXRpb25MKCk7XG5cdFx0XHRcdHRhcGVBbmltYXRpb25SKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHN0b3BXaGVlbEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxMLnN0b3AoKTtcblx0XHRcdFx0d2hlZWxSLnN0b3AoKTtcblx0XHRcdFx0dGFwZUwuc3RvcCgpO1xuXHRcdFx0XHR0YXBlUi5zdG9wKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG5cdFx0XHQgIFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0eFJlYyA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiBwbGF5U3RvcCgpIHtcblx0XHRcdCAgXHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHBsYXlBY3RpdmUgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGZvcndhcmRTdG9wKCkge1xuXHRcdFx0XHRmb3J3YXJkLnRyYW5zZm9ybSgndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFhGb3J3YXJkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBuZXh0VHJhY2sgKCkge1xuXG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuXHRcdFx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2srKztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuXHRcdFx0XHR0aXRsZVVwZGF0ZSgpO1xuXG5cblx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXG5cdFx0XHR9XG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0IFx0aWYoYXVkaW8ucGF1c2VkKSB7XG5cblx0XHRcdCBcdFx0Ly8gcGxheSBzdGF0ZVxuXG5cdFx0XHQgXHRcdHBsYXlBY3RpdmUgPSB0cnVlO1xuXG5cdFx0XHQgXHRcdHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cdFx0XHQgXHRcdHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuXHRcdFx0IFx0XHQvL2NvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG5cdFx0XHRcdFx0aWYgKCF4UmVjKSB7IC8vIGlzIG5vdCByZWNvcmRpbmdcblx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHQgXHRcdH1cblx0XHRcdFx0XHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblxuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblxuXHRcdFx0XHQgICAgLy9hdWRpby5wbGF5KCk7XG5cdFx0XHRcdCAgICB0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHQgICAgfSBlbHNlIHtcblxuXHRcdFx0ICAgIFx0Ly8gcGF1c2Ugc3RhdGVcblxuXHRcdFx0ICAgIFx0cGxheUFjdGl2ZSA9IGZhbHNlO1xuXG5cdFx0XHQgICAgXHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblx0XHRcdCAgICBcdHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG5cdFx0XHQgICAgXHQvL2NvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG5cdFx0XHRcdCAgICBhdWRpby5wYXVzZSgpO1xuXG5cdFx0XHRcdCAgXHRpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0ICBcdFx0c3RvcFdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdCAgXHR9XG5cdFx0XHRcdCAgXHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgICAgfVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcGxheSBmdW5jdGlvblxuXG5cdFx0XHQvLyBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0YmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuXHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjayA9IChwbGF5bGlzdC5sZW5ndGggLSAxKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXG5cdFx0XHQvLyBmb3J3YXJkIGZ1bmN0aW9uXG5cdFx0XHRmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRhbmltMSgpO1xuXG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuXHRcdFx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2srKztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2Z3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuXHRcdFx0XHR0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHRcdGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuXHRcdFx0ZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcblx0XHRcdFx0dHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cdFx0XHR9XG5cblx0XHRcdC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cblx0XHRcdGZ1bmN0aW9uIF9fbG9nKGUsIGRhdGEpIHtcblx0XHRcdFx0bG9nVGV4dC5ub2RlLmlubmVySFRNTCA9IFwiXFxuXCIgKyBlICsgXCIgXCIgKyAoZGF0YSB8fCAnJyk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHN0YXJ0VXNlck1lZGlhKHN0cmVhbSkge1xuXHRcdFx0XHR2YXIgaW5wdXQgPSBhdWRpb19jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG5cdFx0XHRcdF9fbG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcblx0XHRcdFx0Ly8gVW5jb21tZW50IGlmIHlvdSB3YW50IHRoZSBhdWRpbyB0byBmZWVkYmFjayBkaXJlY3RseVxuXHRcdFx0XHQvL2lucHV0LmNvbm5lY3QoYXVkaW9fY29udGV4dC5kZXN0aW5hdGlvbik7XG5cdFx0XHRcdC8vX19sb2coJ0lucHV0IGNvbm5lY3RlZCB0byBhdWRpbyBjb250ZXh0IGRlc3RpbmF0aW9uLicpO1xuXG5cdFx0XHRcdHJlY29yZGVyID0gbmV3IFJlY29yZGVyKGlucHV0KTtcblx0XHRcdFx0X19sb2coJ1JlYWR5IScpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyByZWMgZnVuY3Rpb25cblx0XHRcdHJlYy5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHRpZiAoIXhSZWMpeyAvL2lzIG5vdCByZWNvcmRpbmdcblxuXHRcdFx0XHRcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblx0XHRcdFx0XHQvLyB3aGVlbHMgZXZlbnRzXG5cblx0XHRcdFx0XHRpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0eFJlYyA9IHRydWU7XG5cblx0XHRcdFx0XHRyZWNvcmRlciAmJiByZWNvcmRlci5yZWNvcmQoKTtcblxuXHRcdFx0XHRcdF9fbG9nKCdSZWNvcmRpbmcuLi4nKTtcblxuXHRcdFx0XHR9ICBlbHNlIHsgLy9zdG9wIHJlY29yZGluZ1xuXHRcdFx0XHRcdHJlY1N0b3AoKTtcblxuXHRcdFx0XHRcdGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG5cdFx0XHRcdFx0XHRzdG9wV2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZWNvcmRlciAmJiByZWNvcmRlci5zdG9wKCk7XG5cblx0XHRcdFx0XHRfX2xvZygnU3RvcHBlZCByZWNvcmRpbmcuJyk7XG5cblx0XHRcdFx0XHQvLyBjcmVhdGUgV0FWIGRvd25sb2FkIGxpbmsgdXNpbmcgYXVkaW8gZGF0YSBibG9iXG5cdFx0XHRcdFx0Y3JlYXRlRG93bmxvYWRMaW5rKCk7XG5cblx0XHRcdFx0XHRyZWNvcmRlci5jbGVhcigpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCByZWMgZnVuY3Rpb25cblxuXHRcdFx0ZnVuY3Rpb24gY3JlYXRlRG93bmxvYWRMaW5rKCkge1xuXHRcdFx0XHRyZWNvcmRlciAmJiByZWNvcmRlci5leHBvcnRXQVYoZnVuY3Rpb24oYmxvYikge1xuXHRcdFx0XHRcdHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuXHRcdFx0XHRcdHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG5cdFx0XHRcdFx0dmFyIGF1ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYXVkaW8nKTtcblx0XHRcdFx0XHR2YXIgaGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cblx0XHRcdFx0XHRhdS5jb250cm9scyA9IHRydWU7XG5cdFx0XHRcdFx0YXUuc3JjID0gdXJsO1xuXHRcdFx0XHRcdGhmLmhyZWYgPSB1cmw7XG5cdFx0XHRcdFx0aGYuZG93bmxvYWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkgKyAnLndhdic7XG5cdFx0XHRcdFx0aGYuaW5uZXJIVE1MID0gaGYuZG93bmxvYWQ7XG5cdFx0XHRcdFx0Ly9saS5hcHBlbmRDaGlsZChhdSk7IC8vIEkgZG9uJ3Qgd2FudCB0aGUgZGVmYXVsdCBicm93c2VyIHBsYXllci5cblx0XHRcdFx0XHRsaS5hcHBlbmRDaGlsZChoZik7IC8vIGkganVzdCB3YW50IHRoZSBsaW5rIG9mIHRoZSByZWNvcmRlZCBhdWRpbyB0byBkb3dubG9hZFxuXHRcdFx0XHRcdHJlY29yZGluZ3NsaXN0LmFwcGVuZENoaWxkKGxpKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiBpbml0KCkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIHdlYmtpdCBzaGltXG5cdFx0XHRcdFx0d2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcblx0XHRcdFx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYSk7IC8vdGhpcyB3aWxsIHNldCBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHRvIHdoYXRldmVyIGl0IGRldGVjdHMgdG8gYmUgdGhlIHByb3BlciBwcmVmaXhlZCB2ZXJzaW9uLlxuXHRcdFx0XHRcdHdpbmRvdy5VUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkw7XG5cblx0XHRcdFx0XHRhdWRpb19jb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dDtcblx0XHRcdFx0XHRfX2xvZygnQXVkaW8gY29udGV4dCBzZXQgdXAuJyk7XG5cdFx0XHRcdFx0X19sb2coJ25hdmlnYXRvci5nZXRVc2VyTWVkaWEgJyArIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID8gJ2F2YWlsYWJsZS4nIDogJ25vdCBwcmVzZW50IScpKTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGFsZXJ0KCdObyB3ZWIgYXVkaW8gc3VwcG9ydCBpbiB0aGlzIGJyb3dzZXIhJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKHthdWRpbzogdHJ1ZX0sIHN0YXJ0VXNlck1lZGlhLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0X19sb2coJ05vIGxpdmUgYXVkaW8gaW5wdXQ6ICcgKyBlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9