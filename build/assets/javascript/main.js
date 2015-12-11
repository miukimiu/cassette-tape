
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


				}  else {

					backwardStop();


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

				}  else {

					forwardStop();

				}
			});
			// end forward function

			


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cdFx0dmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcblx0XHRcdHhSZWMgPSBmYWxzZSxcblx0XHRcdGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG5cdFx0XHR4QmFja3dhcmQgPSBmYWxzZSxcblx0XHRcdHBsYXkgPSBTbmFwKCcjcGxheScpLFxuXHRcdFx0eFBsYXkgPSBmYWxzZSxcblx0XHRcdGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuXHRcdFx0WEZvcndhcmQgPSBmYWxzZSxcblx0XHRcdHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG5cdFx0XHR3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3Nyxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuXHRcdFx0YmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG5cdFx0XHRiYm94UiA9IHRhcGVSLmdldEJCb3goKSxcblx0XHRcdGF1ZGlvID0gbmV3IEF1ZGlvKCksXG5cdFx0XHRkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuXHRcdFx0cGxheWxpc3QgPSBuZXcgQXJyYXkoJ2F1ZGlvL2Nlc2FyaWEubXAzJywgJ2F1ZGlvL25vX3RyZW5kcy5tcDMnLCAnYXVkaW8veW91X2dvdF9tZS5tcDMnKSxcblx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cblx0XHRcdGNvbnNvbGUubG9nKCd0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblxuXG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25MKCkge1xuXHRcdFx0XHR3aGVlbEwuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvblIoKSB7XG5cdFx0XHRcdHdoZWVsUi5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwyNzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBzcGVlZCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25Gb3J3YXJkTCgpIHtcblx0XHRcdFx0d2hlZWxMLnN0b3AoKS5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwzMCwzMCd9XG5cdFx0XHRcdFx0LCAxMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25Gb3J3YXJkTCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gd2hlZWwgc3BlZWQgYW5pbWF0aW9uIHJpZ2h0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkZvcndhcmRSKCkge1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDI3MCwzMCd9XG5cdFx0XHRcdFx0LCAxMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uRm9yd2FyZFIoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uRm9yd2FyZCgpIHtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25Gb3J3YXJkTCgpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmRSKCk7XG5cdFx0XHR9XG5cdFx0XHQvLyBsZWZ0IHdoZWVsIGFuaW1hdGlvbiBiYWNrd2FyZFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25CYWNrd2FyZEwoKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCkuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDMwLDMwJ31cblx0XHRcdFx0XHQsIDEwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkJhY2t3YXJkTCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gcmlnaHQgd2hlZWwgYW5pbWF0aW9uIGJhY2t3YXJkXG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkJhY2t3YXJkUigpIHtcblx0XHRcdFx0d2hlZWxSLnN0b3AoKS5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMjcwLDMwJ31cblx0XHRcdFx0XHQsIDEwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZFIoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uQmFja3dhcmQoKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uQmFja3dhcmRMKCk7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uQmFja3dhcmRSKCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBzdG9wQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpO1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICBcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgIFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4UmVjID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBiYWNrd2FyZFN0b3AoKSB7XG5cdFx0XHRcdGJhY2t3YXJkLnRyYW5zZm9ybSgndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0eEJhY2t3YXJkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBwbGF5U3RvcCgpIHtcblx0XHRcdCAgXHRwbGF5LnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0ICBcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0eFBsYXkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGZvcndhcmRTdG9wKCkge1xuXHRcdFx0XHRmb3J3YXJkLnRyYW5zZm9ybSgndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFhGb3J3YXJkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uQmFja3dhcmQoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvblBsYXkoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdHRhcGUuYW5pbWF0ZSggeyAndHJhbnNmb3JtJyA6ICd0ODQuNzA5MTEwLCAwLjY4MDI5MScgfSwgMTQwMDApO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvbkZvcndhcmQoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdC8vdGFwZS5hbmltYXRlKCB7ICd0cmFuc2Zvcm0nIDogJ3QnICsgYmJveC54ICsgJywgMC42ODAyOTEnIH0sIDMwMDApO1xuXHRcdFx0XHQvL3RhcGVMIDkwLjM4OTI1MDk5OTk5OTk5XG5cdFx0XHRcdC8vdGFwZVIgMzMwLjM4OTI1MVxuXHRcdFx0XHR0YXBlTC5hbmltYXRlKHsgY3g6IGJib3hMLmN4IH0sIDIwMDAsIG1pbmEuYm91bmNlLCBcblx0XHRcdFx0ZnVuY3Rpb24oKSB7IHRhcGVMLmFuaW1hdGUoeyBjeDogMTEwIH0sIDIwMDApIH0pO1xuXG5cdFx0XHRcdHRhcGVSLmFuaW1hdGUoeyBjeDogYmJveFIuY3ggfSwgMjAwMCwgbWluYS5ib3VuY2UsIFxuXHRcdFx0XHRmdW5jdGlvbigpIHsgdGFwZVIuYW5pbWF0ZSh7IGN4OiAzNjAgfSwgMjAwMCkgfSk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGNvbnNvbGUubG9nKCdsZWZ0OiAnICsgYmJveEwuY3gpO1xuXHRcdFx0Y29uc29sZS5sb2coJ3JpZ2h0OiAnICsgYmJveFIuY3gpO1xuXHRcdFx0XG5cdFx0XHR0YXBlQW5pbWF0aW9uRm9yd2FyZCgpO1xuXG5cdFx0XHRmdW5jdGlvbiBzZXRXaGVlbEFuaW1hdGlvbiggc3BlZWQsIG1vZGUgKSB7XG5cdFx0XHRcdGlmKCBtb2RlID09PSAncGxheScgfHwgbW9kZSA9PT0gJ2ZvcndhcmQnIHx8IG1vZGUgPT09ICdyZWMnKSB7XG5cdFx0XHRcdFx0YW5pbSA9ICdyb3RhdGVMZWZ0Jztcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKCBtb2RlID09PSAnYmFja3dhcmQnICkge1xuXHRcdFx0XHRcdGFuaW0gPSAncm90YXRlUmlnaHQnO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIHJlYyBmdW5jdGlvblxuXHRcdFx0cmVjLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0IFx0XG5cdFx0XHQgXHRpZiAoIXhSZWMpe1xuXG5cdFx0XHQgXHRcdHBsYXlTdG9wKCk7XG5cdFx0XHRcdFx0YmFja3dhcmRTdG9wKCk7XG5cdFx0XHRcdFx0Zm9yd2FyZFN0b3AoKTtcblxuXHRcdFx0IFx0XHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHQgXHRcdC8vIHdoZWVscyBldmVudHNcblx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0IFx0XHRcblx0XHRcdFx0XHR4UmVjID0gdHJ1ZTtcblxuXHRcdFx0XHR9ICBlbHNlIHtcblxuXHRcdFx0XHRcdHJlY1N0b3AoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHRiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4QmFja3dhcmQpe1xuXG5cdFx0XHQgXHRcdHJlY1N0b3AoKTtcblx0XHRcdFx0XHRwbGF5U3RvcCgpO1xuXHRcdFx0XHRcdGZvcndhcmRTdG9wKCk7XG5cblx0XHRcdCBcdFx0Ly9iYWNrd2FyZC50cmFuc2Zvcm0oJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHRcdFx0XG5cdFx0XHQgXHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGFuaW0xKCk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZCgpO1xuXG5cdFx0XHRcdFx0eEJhY2t3YXJkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG5cblx0XHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHQgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdFx0ICAgIGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cblx0ICAgXHQgXHRcdFx0YXVkaW8ucGxheSgpO1xuXG5cblx0XHRcdFx0fSAgZWxzZSB7XG5cblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKTtcblxuXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXkuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFBsYXkpeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG5cdFx0XHQgXHRcdHJlY1N0b3AoKTtcblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKTtcblx0XHRcdFx0XHRmb3J3YXJkU3RvcCgpO1xuXG5cdFx0XHQgXHRcdHBsYXkudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblxuXHRcdFx0XHRcdHhQbGF5ID0gdHJ1ZTtcblxuXHRcdFx0XHRcdGF1ZGlvLnNyYyA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZyhwbGF5bGlzdFtjdXJyZW50VHJhY2tdKTtcblxuXHQgICBcdCBcdFx0XHRhdWRpby5wbGF5KCk7XG5cblx0XHRcdFx0fSAgZWxzZSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wYXVzZSgpO1xuXHRcdFx0XHQgIFx0cGxheVN0b3AoKTtcblxuXHRcdFx0XHQgIFx0Y29uc29sZS5sb2coJ3BsYXkgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHBsYXkgZnVuY3Rpb25cblxuXHRcdFx0Ly8gZm9yd2FyZCBmdW5jdGlvblxuXHRcdFx0Zm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCFYRm9yd2FyZCl7XG5cblx0XHRcdCBcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpO1xuXHRcdFx0XHRcdHBsYXlTdG9wKCk7XG5cblx0XHRcdCBcdFx0Ly9mb3J3YXJkLnRyYW5zZm9ybSgndDI1NC4zNDQwNTMsJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblx0XHRcdCBcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0YW5pbTEoKTtcblxuXHRcdFx0IFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmQoKTtcblxuXHRcdFx0XHRcdFhGb3J3YXJkID0gdHJ1ZTtcblxuXHRcdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuXHRcdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdCAgICBjdXJyZW50VHJhY2srKztcdFxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGF1ZGlvLnNyYyA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZyhwbGF5bGlzdFtjdXJyZW50VHJhY2tdKTtcblxuXHQgICBcdCBcdFx0XHRhdWRpby5wbGF5KCk7XG5cblx0ICAgXHQgXHRcdFx0Y29uc29sZS5sb2coJ2Z3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHRcdH0gIGVsc2Uge1xuXG5cdFx0XHRcdFx0Zm9yd2FyZFN0b3AoKTtcblxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBmb3J3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdFxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=