
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

				if (xPlay) { // if is playing
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

				console.log('fw - the current track is: ' + currentTrack);

				audio.src = playlist[currentTrack];


				if (xPlay) { // if is playing
					audio.play();
				}
	

			});
			// end forward function

			


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblx0XHR2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuXHRcdFx0eFJlYyA9IGZhbHNlLFxuXHRcdFx0YmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcblx0XHRcdHhCYWNrd2FyZCA9IGZhbHNlLFxuXHRcdFx0cGxheSA9IFNuYXAoJyNwbGF5JyksXG5cdFx0XHR4UGxheSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHRYRm9yd2FyZCA9IGZhbHNlLFxuXHRcdFx0d2hlZWxMID0gU25hcCgnI3doZWVsLWwnKSxcblx0XHRcdHdoZWVsUiA9IFNuYXAoJyN3aGVlbC1yJyksXG5cdFx0XHR0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuXHRcdFx0dGFwZVIgPSBTbmFwKCcjdGFwZVInKSxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbiA9IDAuNjc5NDc3LFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG5cdFx0XHRiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcblx0XHRcdGJib3hSID0gdGFwZVIuZ2V0QkJveCgpLFxuXHRcdFx0YXVkaW8gPSBuZXcgQXVkaW8oKSxcblx0XHRcdGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG5cdFx0XHRwbGF5bGlzdCA9IG5ldyBBcnJheSgnYXVkaW8vY2VzYXJpYS5tcDMnLCAnYXVkaW8vbm9fdHJlbmRzLm1wMycsICdhdWRpby95b3VfZ290X21lLm1wMycpLFxuXHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblxuXHRcdFx0Y29uc29sZS5sb2coJ3RoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwzMCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDI3MCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdH1cblx0XHRcdC8vIHdoZWVsIHNwZWVkIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkZvcndhcmRMKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDMwLDMwJ31cblx0XHRcdFx0XHQsIDEwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmRMKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBzcGVlZCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uRm9yd2FyZFIoKSB7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCkuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMjcwLDMwJ31cblx0XHRcdFx0XHQsIDEwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25Gb3J3YXJkUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25Gb3J3YXJkKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmRMKCk7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uRm9yd2FyZFIoKTtcblx0XHRcdH1cblx0XHRcdC8vIGxlZnQgd2hlZWwgYW5pbWF0aW9uIGJhY2t3YXJkXG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkJhY2t3YXJkTCgpIHtcblx0XHRcdFx0d2hlZWxMLnN0b3AoKS5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfVxuXHRcdFx0XHRcdCwgMTAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uQmFja3dhcmRMKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyByaWdodCB3aGVlbCBhbmltYXRpb24gYmFja3dhcmRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uQmFja3dhcmRSKCkge1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfVxuXHRcdFx0XHRcdCwgMTAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkJhY2t3YXJkUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25CYWNrd2FyZCgpIHtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZEwoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZFIoKTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHN0b3BBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCk7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG5cdFx0XHQgIFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgXHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGJhY2t3YXJkU3RvcCgpIHtcblx0XHRcdFx0YmFja3dhcmQudHJhbnNmb3JtKCd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4QmFja3dhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuXHRcdFx0ICBcdHBsYXkudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgIFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4UGxheSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG5cdFx0XHRcdGZvcndhcmQudHJhbnNmb3JtKCd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0WEZvcndhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25CYWNrd2FyZCgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uUGxheSgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0dGFwZS5hbmltYXRlKCB7ICd0cmFuc2Zvcm0nIDogJ3Q4NC43MDkxMTAsIDAuNjgwMjkxJyB9LCAxNDAwMCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uRm9yd2FyZCgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0Ly90YXBlLmFuaW1hdGUoIHsgJ3RyYW5zZm9ybScgOiAndCcgKyBiYm94LnggKyAnLCAwLjY4MDI5MScgfSwgMzAwMCk7XG5cdFx0XHRcdC8vdGFwZUwgOTAuMzg5MjUwOTk5OTk5OTlcblx0XHRcdFx0Ly90YXBlUiAzMzAuMzg5MjUxXG5cdFx0XHRcdHRhcGVMLmFuaW1hdGUoeyBjeDogYmJveEwuY3ggfSwgMjAwMCwgbWluYS5ib3VuY2UsIFxuXHRcdFx0XHRmdW5jdGlvbigpIHsgdGFwZUwuYW5pbWF0ZSh7IGN4OiAxMTAgfSwgMjAwMCkgfSk7XG5cblx0XHRcdFx0dGFwZVIuYW5pbWF0ZSh7IGN4OiBiYm94Ui5jeCB9LCAyMDAwLCBtaW5hLmJvdW5jZSwgXG5cdFx0XHRcdGZ1bmN0aW9uKCkgeyB0YXBlUi5hbmltYXRlKHsgY3g6IDM2MCB9LCAyMDAwKSB9KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Y29uc29sZS5sb2coJ2xlZnQ6ICcgKyBiYm94TC5jeCk7XG5cdFx0XHRjb25zb2xlLmxvZygncmlnaHQ6ICcgKyBiYm94Ui5jeCk7XG5cdFx0XHRcblx0XHRcdHRhcGVBbmltYXRpb25Gb3J3YXJkKCk7XG5cblx0XHRcdGZ1bmN0aW9uIHNldFdoZWVsQW5pbWF0aW9uKCBzcGVlZCwgbW9kZSApIHtcblx0XHRcdFx0aWYoIG1vZGUgPT09ICdwbGF5JyB8fCBtb2RlID09PSAnZm9yd2FyZCcgfHwgbW9kZSA9PT0gJ3JlYycpIHtcblx0XHRcdFx0XHRhbmltID0gJ3JvdGF0ZUxlZnQnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYoIG1vZGUgPT09ICdiYWNrd2FyZCcgKSB7XG5cdFx0XHRcdFx0YW5pbSA9ICdyb3RhdGVSaWdodCc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gcmVjIGZ1bmN0aW9uXG5cdFx0XHRyZWMuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFJlYyl7XG5cblx0XHRcdCBcdFx0cGxheVN0b3AoKTtcblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKTtcblx0XHRcdFx0XHRmb3J3YXJkU3RvcCgpO1xuXG5cdFx0XHQgXHRcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblx0XHRcdCBcdFx0Ly8gd2hlZWxzIGV2ZW50c1xuXHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHQgXHRcdFxuXHRcdFx0XHRcdHhSZWMgPSB0cnVlO1xuXG5cdFx0XHRcdH0gIGVsc2Uge1xuXG5cdFx0XHRcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCByZWMgZnVuY3Rpb25cblxuXHRcdFx0Ly8gYmFja3dhcmQgZnVuY3Rpb25cblx0XHRcdGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0IFx0XG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhbmltMSgpO1xuXHRcdFx0XHRcblx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZCgpO1xuXG5cdFx0XHRcdHhCYWNrd2FyZCA9IHRydWU7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuXHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdCAgICBjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cdFx0XHRcdGlmICh4UGxheSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblxuXHRcdFx0Ly8gcGxheSBmdW5jdGlvblxuXHRcdFx0cGxheS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UGxheSl7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cblx0XHRcdCBcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpO1xuXHRcdFx0XHRcdGZvcndhcmRTdG9wKCk7XG5cblx0XHRcdCBcdFx0cGxheS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXG5cdFx0XHRcdFx0eFBsYXkgPSB0cnVlO1xuXG5cdFx0XHRcdFx0YXVkaW8uc3JjID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHBsYXlsaXN0W2N1cnJlbnRUcmFja10pO1xuXG5cdCAgIFx0IFx0XHRcdGF1ZGlvLnBsYXkoKTtcblxuXHRcdFx0XHR9ICBlbHNlIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBhdXNlKCk7XG5cdFx0XHRcdCAgXHRwbGF5U3RvcCgpO1xuXG5cdFx0XHRcdCAgXHRjb25zb2xlLmxvZygncGxheSAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcGxheSBmdW5jdGlvblxuXG5cdFx0XHQvLyBmb3J3YXJkIGZ1bmN0aW9uXG5cdFx0XHRmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhbmltMSgpO1xuXG5cdFx0IFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmQoKTtcblxuXHRcdFx0XHRYRm9yd2FyZCA9IHRydWU7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1x0XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmxvZygnZncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcblxuXG5cdFx0XHRcdGlmICh4UGxheSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cdFxuXG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBmb3J3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdFxuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=