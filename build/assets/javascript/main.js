
		var rec = Snap('#rec'),
			xRec = false,
			backward = Snap('#backward'),
			play = Snap('#play'),
			xPlay = false,
			forward = Snap('#forward'),
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

			


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cdFx0dmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcblx0XHRcdHhSZWMgPSBmYWxzZSxcblx0XHRcdGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG5cdFx0XHRwbGF5ID0gU25hcCgnI3BsYXknKSxcblx0XHRcdHhQbGF5ID0gZmFsc2UsXG5cdFx0XHRmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcblx0XHRcdHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG5cdFx0XHR3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3Nyxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuXHRcdFx0YmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG5cdFx0XHRiYm94UiA9IHRhcGVSLmdldEJCb3goKSxcblx0XHRcdGF1ZGlvID0gbmV3IEF1ZGlvKCksXG5cdFx0XHRkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuXHRcdFx0cGxheWxpc3QgPSBuZXcgQXJyYXkoJ2F1ZGlvL2Nlc2FyaWEubXAzJywgJ2F1ZGlvL25vX3RyZW5kcy5tcDMnLCAnYXVkaW8veW91X2dvdF9tZS5tcDMnKSxcblx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cblx0XHRcdGNvbnNvbGUubG9nKCd0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblxuXG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25MKCkge1xuXHRcdFx0XHR3aGVlbEwuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvblIoKSB7XG5cdFx0XHRcdHdoZWVsUi5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwyNzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZ1bmN0aW9uIHN0b3BBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCk7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG5cdFx0XHQgIFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgXHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGJhY2t3YXJkU3RvcCgpIHtcblx0XHRcdFx0YmFja3dhcmQudHJhbnNmb3JtKCd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4QmFja3dhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuXHRcdFx0ICBcdHBsYXkudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgIFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4UGxheSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG5cdFx0XHRcdGZvcndhcmQudHJhbnNmb3JtKCd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0WEZvcndhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25CYWNrd2FyZCgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uUGxheSgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0dGFwZS5hbmltYXRlKCB7ICd0cmFuc2Zvcm0nIDogJ3Q4NC43MDkxMTAsIDAuNjgwMjkxJyB9LCAxNDAwMCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdC8vIHJlYyBmdW5jdGlvblxuXHRcdFx0cmVjLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0IFx0XG5cdFx0XHQgXHRpZiAoIXhSZWMpe1xuXG5cdFx0XHQgXHRcdHBsYXlTdG9wKCk7XG5cdFx0XHRcdFx0YmFja3dhcmRTdG9wKCk7XG5cdFx0XHRcdFx0Zm9yd2FyZFN0b3AoKTtcblxuXHRcdFx0IFx0XHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHQgXHRcdC8vIHdoZWVscyBldmVudHNcblx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0IFx0XHRcblx0XHRcdFx0XHR4UmVjID0gdHJ1ZTtcblxuXHRcdFx0XHR9ICBlbHNlIHtcblxuXHRcdFx0XHRcdHJlY1N0b3AoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHRiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YW5pbTEoKTtcblx0XHRcdFxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPiAwICkge1xuXG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrLS07XG5cblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG5cblx0XHRcdFx0ICAgIGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cblx0XHRcdFx0aWYgKHhQbGF5KSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblxuXHRcdFx0Ly8gcGxheSBmdW5jdGlvblxuXHRcdFx0cGxheS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UGxheSl7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cblx0XHRcdCBcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpO1xuXHRcdFx0XHRcdGZvcndhcmRTdG9wKCk7XG5cblx0XHRcdCBcdFx0cGxheS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXG5cdFx0XHRcdFx0eFBsYXkgPSB0cnVlO1xuXG5cdFx0XHRcdFx0YXVkaW8uc3JjID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHBsYXlsaXN0W2N1cnJlbnRUcmFja10pO1xuXG5cdCAgIFx0IFx0XHRcdGF1ZGlvLnBsYXkoKTtcblxuXHRcdFx0XHR9ICBlbHNlIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBhdXNlKCk7XG5cdFx0XHRcdCAgXHRwbGF5U3RvcCgpO1xuXG5cdFx0XHRcdCAgXHRjb25zb2xlLmxvZygncGxheSAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcGxheSBmdW5jdGlvblxuXG5cdFx0XHQvLyBmb3J3YXJkIGZ1bmN0aW9uXG5cdFx0XHRmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhbmltMSgpO1xuXG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuXHRcdFx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2srKztcdFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc29sZS5sb2coJ2Z3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cblxuXHRcdFx0XHRpZiAoeFBsYXkpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXHRcblxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG5cdFx0XHRcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9