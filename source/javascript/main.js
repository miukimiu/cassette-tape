
		var rec = Snap('#rec'),
			xRec = false,
			backward = Snap('#backward'),
			xBackward = false,
			play = Snap('#play'),
			xPlay = false,
			forward = Snap('#forward'),
			XForward = false,
			wheelL = Snap('#wheel-l'),
			wheelR = Snap('#wheel-r'),
			tapeL = Snap('#tapeL'),
			tapeR = Snap('#tapeR'),
			buttonYposition = 0.679477,
			buttonYpositionActive = 8.679477,
			bboxL = tapeL.getBBox(),
			bboxR = tapeR.getBBox(),
			audio = new Audio(),
			duration = audio.duration,
			playlist = new Array('audio/cesaria.mp3', 'audio/no_trends.mp3', 'audio/you_got_me.mp3'),
			currentTrack = 0;

			console.log('the current track is: ' + currentTrack);



			// wheel animation left
			function wheelAnimationL() {
				wheelL.animate({ transform: 'r360,30,30'}
					, 2000,
					function(){ 
							wheelL.attr({ transform: 'rotate(0 30 30)'});
							wheelAnimationL();
						}
				);
			}
			// wheel animation right
			function wheelAnimationR() {
				wheelR.animate({ transform: 'r360,270,30'}
					, 2000,
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
			// wheel speed animation left
			function wheelAnimationForwardL() {
				wheelL.stop().animate({ transform: 'r360,30,30'}
					, 1000,
					function(){ 
							wheelL.attr({ transform: 'rotate(0 30 30)'});
							wheelAnimationForwardL();
						}
				);
			}
			// wheel speed animation right
			function wheelAnimationForwardR() {
				wheelR.stop().animate({ transform: 'r360,270,30'}
					, 1000,
					function(){ 
							wheelR.attr({ transform: 'rotate(0 270 30)'});
							wheelAnimationForwardR();
						}
				);
			}
			function wheelAnimationForward() {
				wheelAnimationForwardL();
				wheelAnimationForwardR();
			}
			// left wheel animation backward
			function wheelAnimationBackwardL() {
				wheelL.stop().animate({ transform: 'r-360,30,30'}
					, 1000,
					function(){ 
							wheelL.attr({ transform: 'rotate(0 30 30)'});
							wheelAnimationBackwardL();
						}
				);
			}
			// right wheel animation backward
			function wheelAnimationBackwardR() {
				wheelR.stop().animate({ transform: 'r-360,270,30'}
					, 1000,
					function(){ 
							wheelR.attr({ transform: 'rotate(0 270 30)'});
							wheelAnimationBackwardR();
						}
				);
			}
			function wheelAnimationBackward() {
				wheelAnimationBackwardL();
				wheelAnimationBackwardR();
			}
			function stopAnimation() {
				wheelL.stop();
				wheelR.stop();
			}

			function recStop() {
			  	rec.transform('t0.344053, ' + buttonYposition);
			  	stopAnimation();
				xRec = false;
			}
			function backwardStop() {
				backward.transform('t85.344053, ' + buttonYposition);
				stopAnimation();
				xBackward = false;
			}
			function playStop() {
			  	play.transform('t169.344053, ' + buttonYposition);
			  	stopAnimation();
				xPlay = false;
			}
			function forwardStop() {
				forward.transform('t254.344053, ' + buttonYposition);
				stopAnimation();
				XForward = false;
			}
			function tapeAnimationBackward() {
				//translate(44.709110, 0.680291)
				
			}
			function tapeAnimationPlay() {
				//translate(44.709110, 0.680291)
				tape.animate( { 'transform' : 't84.709110, 0.680291' }, 14000);
			}
			function tapeAnimationForward() {
				//translate(44.709110, 0.680291)
				//tape.animate( { 'transform' : 't' + bbox.x + ', 0.680291' }, 3000);
				//tapeL 90.38925099999999
				//tapeR 330.389251
				tapeL.animate({ cx: bboxL.cx }, 2000, mina.bounce, 
				function() { tapeL.animate({ cx: 110 }, 2000) });

				tapeR.animate({ cx: bboxR.cx }, 2000, mina.bounce, 
				function() { tapeR.animate({ cx: 360 }, 2000) });
			}
			
			console.log('left: ' + bboxL.cx);
			console.log('right: ' + bboxR.cx);
			
			tapeAnimationForward();

			function setWheelAnimation( speed, mode ) {
				if( mode === 'play' || mode === 'forward' || mode === 'rec') {
					anim = 'rotateLeft';
				}
				else if( mode === 'backward' ) {
					anim = 'rotateRight';
				}
			}
			
			// rec function
			rec.click(function() {
			 	
			 	if (!xRec){

			 		playStop();
					backwardStop();
					forwardStop();

			 		rec.transform('t0.344053, ' + buttonYpositionActive);

			 		// wheels events
					wheelAnimation();
			 		
					xRec = true;

				}  else {

					recStop();
				}
			});
			// end rec function

			// backward function
			backward.click(function() {
			 	
			 	if (!xBackward){

			 		recStop();
					playStop();
					forwardStop();

			 		//backward.transform('t85.344053, ' + buttonYpositionActive);

					
			 		// button anim1
					var anim1 = function() { 
					    backward.animate({'transform' : 't85.344053, ' + buttonYpositionActive}, 200, mina.linear, anim2);
					}

					var anim2 = function() { 
					    backward.animate({'transform' : 't85.344053, ' + buttonYposition}, 200);
					}

					anim1();
					
					wheelAnimationBackward();

					xBackward = true;

					if(currentTrack > 0 ) {

						currentTrack--;


						console.log('bw - the current track is: ' + currentTrack);

					} else {

					    currentTrack = (playlist.length - 1);

					    console.log('bw - the current track is: ' + currentTrack);
					}

					audio.src = playlist[currentTrack];


	   	 			audio.play();


				}  
			});
			// end backward function

			// play function
			play.click(function() {
			 	
			 	if (!xPlay){ // is stopped or paused

			 		recStop();
					backwardStop();
					forwardStop();

			 		play.transform('t169.344053, ' + buttonYpositionActive);
					
					wheelAnimation();

					xPlay = true;

					audio.src = playlist[currentTrack];

					console.log(playlist[currentTrack]);

	   	 			audio.play();

				}  else { // if is playing
					audio.pause();
				  	playStop();

				  	console.log('play - the current track is: ' + currentTrack);
				}
			});
			// end play function

			// forward function
			forward.click(function() {
			 	
			 	if (!XForward){

			 		recStop();
					backwardStop();
					playStop();

			 		//forward.transform('t254.344053,' + buttonYpositionActive);

			 		// button anim1
					var anim1 = function() { 
					    forward.animate({'transform' : 't254.344053, ' + buttonYpositionActive}, 200, mina.linear, anim2);
					}

					var anim2 = function() { 
					    forward.animate({'transform' : 't254.344053, ' + buttonYposition}, 200);
					}

					anim1();

			 		wheelAnimationForward();

					XForward = true;

					if(currentTrack == (playlist.length - 1)){
						currentTrack = 0;
					} else {
					    currentTrack++;	
					}

					audio.src = playlist[currentTrack];

					console.log(playlist[currentTrack]);

	   	 			audio.play();

	   	 			console.log('fw - the current track is: ' + currentTrack);

				}  
			});
			// end forward function

			

