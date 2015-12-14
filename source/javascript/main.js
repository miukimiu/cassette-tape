
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
			curtimetext = Snap('#curtimetext tspan'),
			durtimetext = Snap('#durtimetext tspan'),
			tracktitle = Snap('#tracktitle tspan'),
			buttonYposition = 0.679477,
			buttonYpositionActive = 8.679477,
			bboxL = tapeL.getBBox(),
			bboxR = tapeR.getBBox(),
			audio = new Audio(),
			duration = audio.duration,
			playlist = ['cesaria', 'no_trends', 'you_got_me'],
			dir = "audio/",
			ext = ".mp3",
			currentTrack = 0,
			seekslider,
			seeking=false,
			seekto;

			pauseState.attr("display", "none");

			// Audio Object
			audio.src = dir+playlist[0]+ext;

			//curtimetext.node.textContent. = "00:03";
			//curtimetext.node.innerHTML = "New";
			//curtimetext.node.innerHTML = 'yep'

			console.log(audio.src);

			seekslider = document.getElementById("seekslider");
			
			//curtimetext = document.getElementById("curtimetext");
			//durtimetext = document.getElementById("durtimetext");
			// Add Event Handling
	
			audio.addEventListener("ended", function(){ switchTrack(); });
	
			audio.addEventListener("timeupdate", function(){ timeUpdate(); });
			audio.addEventListener("tracktitle", function(){ titleUpdate(); });
			
			audio.addEventListener("ended", function(){ nextTrack(); });

		

			// wheel animation left
			function wheelAnimationL() {
				wheelL.animate({ transform: 'r360,30,30'}, 2000,
					function(){ 
							wheelL.attr({ transform: 'rotate(0 30 30)'});
							wheelAnimationL();
						}
				);
			}
			// wheel animation right
			function wheelAnimationR() {
				wheelR.animate({ transform: 'r360,270,30'}, 2000,
					function(){ 
							wheelR.attr({ transform: 'rotate(0 270 30)'});
							wheelAnimationR();
						}
				);
			}
			function wheelAnimation() {
				wheelAnimationR();
				wheelAnimationL();
			}
			
			function stopWheelAnimation() {
				wheelL.stop();
				wheelR.stop();
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
				forward.transform('t254.344053, ' + buttonYposition);
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
			
		
			// rec function
			rec.click(function() {
			 	
			 	if (!xRec){

			 		rec.transform('t0.344053, ' + buttonYpositionActive);

			 		// wheels events

			 		if (!playActive) { // is stopped or paused
						wheelAnimation();
			 		}

					xRec = true;

				}  else {
					recStop();

					if (!playActive) { // is stopped or paused
						
						stopWheelAnimation();
					}
				}
			});
			// end rec function

			// play function
			playPause.click(function() {
			 	
			 	if(audio.paused) { 

			 		// play state

			 		playActive = true;

			 		playState.attr("display", "none");
			 		pauseState.attr("display", "block");

			 		console.log(playActive);

					if (!xRec) { // is stopped or paused
						wheelAnimation();
			 		}
					playPause.transform('t169.344053, ' + buttonYpositionActive);
				    audio.play();
				    titleUpdate();

			    } else {

			    	// pause state

			    	playActive = false;

			    	pauseState.attr("display", "none");
			    	playState.attr("display", "block");

			    	console.log(playActive);

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
				}

				var anim2 = function() { 
				    backward.animate({'transform' : 't85.344053, ' + buttonYposition}, 200);
				}

				anim1();
			
				if(currentTrack > 0 ) {

					currentTrack--;


					console.log('bw - the current track is: ' + currentTrack);

				} else {

				    currentTrack = (playlist.length - 1);

				    console.log('bw - the current track is: ' + currentTrack);
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
				    forward.animate({'transform' : 't254.344053, ' + buttonYpositionActive}, 200, mina.linear, anim2);
				}

				var anim2 = function() { 
				    forward.animate({'transform' : 't254.344053, ' + buttonYposition}, 200);
				}

				anim1();

				if(currentTrack == (playlist.length - 1)){
					currentTrack = 0;
				} else {
				    currentTrack++;	
				}

				console.log('fw - the current track is: ' + currentTrack);

				audio.src = dir+playlist[currentTrack]+ext;

				titleUpdate();

				if (playActive) { // if is playing
					audio.play();
				}
			});
			// end forward function

			function seek(event){
			    if(seeking){
				    tape.transform('t43.709110, 0.680291');
			        //seekto = audio.duration * (seekslider.value / 100);
			        //audio.currentTime = seekto;
			    }
		    }
//transform="translate(43.709110, 0.680291)"
		    function timeUpdate(){
				var nt = audio.currentTime * (100 / audio.duration);

				var tapeX = 43.709110 * (audio.currentTime / 100);
				tape.transform('t' + tapeX +', 0.680291');

				console.log(tapeX);

				//orward.animate({'transform' : 't254.344053, ' + buttonYposition}, 200);
				var curmins = Math.floor(audio.currentTime / 60);
			    var cursecs = Math.floor(audio.currentTime - curmins * 60);
			    var durmins = Math.floor(audio.duration / 60);
			    var dursecs = Math.floor(audio.duration - durmins * 60);
				if(cursecs < 10){ cursecs = "0"+cursecs; }
			    if(dursecs < 10){ dursecs = "0"+dursecs; }
			    if(curmins < 10){ curmins = "0"+curmins; }
			    if(durmins < 10){ durmins = "0"+durmins; }
				curtimetext.node.innerHTML = curmins+":"+cursecs;
			    durtimetext.node.innerHTML = durmins+":"+dursecs;
			}
			function titleUpdate(){
				tracktitle.node.innerHTML = playlist[currentTrack];
			}
			