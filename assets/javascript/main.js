
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
			function playStop() {
			  	play.transform('t169.344053, ' + buttonYposition);
			  	stopAnimation();
				xPlay = false;
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

			


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXHRcdHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG5cdFx0XHR4UmVjID0gZmFsc2UsXG5cdFx0XHRiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuXHRcdFx0cGxheSA9IFNuYXAoJyNwbGF5JyksXG5cdFx0XHR4UGxheSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG5cdFx0XHR0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG5cdFx0XHRhdWRpbyA9IG5ldyBBdWRpbygpLFxuXHRcdFx0ZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcblx0XHRcdHBsYXlsaXN0ID0gbmV3IEFycmF5KCdhdWRpby9jZXNhcmlhLm1wMycsICdhdWRpby9ub190cmVuZHMubXAzJywgJ2F1ZGlvL3lvdV9nb3RfbWUubXAzJyksXG5cdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXG5cdFx0XHRjb25zb2xlLmxvZygndGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25MKCkge1xuXHRcdFx0XHR3aGVlbEwuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvblIoKSB7XG5cdFx0XHRcdHdoZWVsUi5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwyNzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZ1bmN0aW9uIHN0b3BBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCk7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG5cdFx0XHQgIFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgXHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuXHRcdFx0ICBcdHBsYXkudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgIFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4UGxheSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvblBsYXkoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdHRhcGUuYW5pbWF0ZSggeyAndHJhbnNmb3JtJyA6ICd0ODQuNzA5MTEwLCAwLjY4MDI5MScgfSwgMTQwMDApO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyByZWMgZnVuY3Rpb25cblx0XHRcdHJlYy5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UmVjKXtcblxuXHRcdFx0IFx0XHRwbGF5U3RvcCgpO1xuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpO1xuXHRcdFx0XHRcdGZvcndhcmRTdG9wKCk7XG5cblx0XHRcdCBcdFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXHRcdFx0IFx0XHQvLyB3aGVlbHMgZXZlbnRzXG5cdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0XG5cdFx0XHRcdFx0eFJlYyA9IHRydWU7XG5cblx0XHRcdFx0fSAgZWxzZSB7XG5cblx0XHRcdFx0XHRyZWNTdG9wKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHJlYyBmdW5jdGlvblxuXG5cdFx0XHQvLyBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0YmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFuaW0xKCk7XG5cdFx0XHRcblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuXHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdCAgICBjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cdFx0XHRcdGlmICh4UGxheSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXkuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFBsYXkpeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG5cdFx0XHQgXHRcdHJlY1N0b3AoKTtcblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKTtcblx0XHRcdFx0XHRmb3J3YXJkU3RvcCgpO1xuXG5cdFx0XHQgXHRcdHBsYXkudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblxuXHRcdFx0XHRcdHhQbGF5ID0gdHJ1ZTtcblxuXHRcdFx0XHRcdGF1ZGlvLnNyYyA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZyhwbGF5bGlzdFtjdXJyZW50VHJhY2tdKTtcblxuXHQgICBcdCBcdFx0XHRhdWRpby5wbGF5KCk7XG5cblx0XHRcdFx0fSAgZWxzZSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wYXVzZSgpO1xuXHRcdFx0XHQgIFx0cGxheVN0b3AoKTtcblxuXHRcdFx0XHQgIFx0Y29uc29sZS5sb2coJ3BsYXkgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHBsYXkgZnVuY3Rpb25cblxuXHRcdFx0Ly8gZm9yd2FyZCBmdW5jdGlvblxuXHRcdFx0Zm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YW5pbTEoKTtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XHRcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmdyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cblx0XHRcdFx0aWYgKHhQbGF5KSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcdH1cblx0XG5cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuXHRcdFx0XG5cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==