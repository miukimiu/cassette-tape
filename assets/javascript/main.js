
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
			bboxL = tapeL.getBBox();
			bboxR = tapeR.getBBox();
			song = new Audio('audio/miukimiu-paro_quando_quiser_parar.mp3');

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

			 		backward.transform('t85.344053, ' + buttonYpositionActive);
					
					wheelAnimationBackward();

					xBackward = true;

				}  else {

					backwardStop()

				}
			});
			// end backward function

			// play function
			play.click(function() {
			 	
			 	if (!xPlay){

			 		recStop();
					backwardStop();
					forwardStop();

			 		play.transform('t169.344053, ' + buttonYpositionActive);
					
					wheelAnimation();

					xPlay = true;

					song.play();

					console.log(song.play());

				}  else {

				  playStop();
				}
			});
			// end play function

			// forward function
			forward.click(function() {
			 	
			 	if (!XForward){

			 		recStop();
					backwardStop();
					playStop();

			 		forward.transform('t254.344053,' + buttonYpositionActive);

			 		wheelAnimationForward();

					XForward = true;
				}  else {

					forwardStop();

				}
			});
			// end forward function

			var myaudio = new Audio('mysong.mp3');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cdFx0dmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcblx0XHRcdHhSZWMgPSBmYWxzZSxcblx0XHRcdGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG5cdFx0XHR4QmFja3dhcmQgPSBmYWxzZSxcblx0XHRcdHBsYXkgPSBTbmFwKCcjcGxheScpLFxuXHRcdFx0eFBsYXkgPSBmYWxzZSxcblx0XHRcdGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuXHRcdFx0WEZvcndhcmQgPSBmYWxzZSxcblx0XHRcdHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG5cdFx0XHR3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3Nyxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuXHRcdFx0YmJveEwgPSB0YXBlTC5nZXRCQm94KCk7XG5cdFx0XHRiYm94UiA9IHRhcGVSLmdldEJCb3goKTtcblx0XHRcdHNvbmcgPSBuZXcgQXVkaW8oJ2F1ZGlvL21pdWtpbWl1LXBhcm9fcXVhbmRvX3F1aXNlcl9wYXJhci5tcDMnKTtcblxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcblx0XHRcdFx0d2hlZWxMLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDMwLDMwJ31cblx0XHRcdFx0XHQsIDIwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuXHRcdFx0XHR3aGVlbFIuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMjcwLDMwJ31cblx0XHRcdFx0XHQsIDIwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25SKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25SKCk7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gd2hlZWwgc3BlZWQgYW5pbWF0aW9uIGxlZnRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uRm9yd2FyZEwoKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCkuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMzAsMzAnfVxuXHRcdFx0XHRcdCwgMTAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uRm9yd2FyZEwoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdC8vIHdoZWVsIHNwZWVkIGFuaW1hdGlvbiByaWdodFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25Gb3J3YXJkUigpIHtcblx0XHRcdFx0d2hlZWxSLnN0b3AoKS5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwyNzAsMzAnfVxuXHRcdFx0XHRcdCwgMTAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmRSKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkZvcndhcmQoKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uRm9yd2FyZEwoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25Gb3J3YXJkUigpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gbGVmdCB3aGVlbCBhbmltYXRpb24gYmFja3dhcmRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uQmFja3dhcmRMKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwzMCwzMCd9XG5cdFx0XHRcdFx0LCAxMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZEwoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdC8vIHJpZ2h0IHdoZWVsIGFuaW1hdGlvbiBiYWNrd2FyZFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25CYWNrd2FyZFIoKSB7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCkuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDI3MCwzMCd9XG5cdFx0XHRcdFx0LCAxMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uQmFja3dhcmRSKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkJhY2t3YXJkKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkJhY2t3YXJkTCgpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkJhY2t3YXJkUigpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gc3RvcEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxMLnN0b3AoKTtcblx0XHRcdFx0d2hlZWxSLnN0b3AoKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gcmVjU3RvcCgpIHtcblx0XHRcdCAgXHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0ICBcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0eFJlYyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gYmFja3dhcmRTdG9wKCkge1xuXHRcdFx0XHRiYWNrd2FyZC50cmFuc2Zvcm0oJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdHhCYWNrd2FyZCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gcGxheVN0b3AoKSB7XG5cdFx0XHQgIFx0cGxheS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgXHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdHhQbGF5ID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcblx0XHRcdFx0Zm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHRYRm9yd2FyZCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvbkJhY2t3YXJkKCkge1xuXHRcdFx0XHQvL3RyYW5zbGF0ZSg0NC43MDkxMTAsIDAuNjgwMjkxKVxuXHRcdFx0XHRcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25QbGF5KCkge1xuXHRcdFx0XHQvL3RyYW5zbGF0ZSg0NC43MDkxMTAsIDAuNjgwMjkxKVxuXHRcdFx0XHR0YXBlLmFuaW1hdGUoIHsgJ3RyYW5zZm9ybScgOiAndDg0LjcwOTExMCwgMC42ODAyOTEnIH0sIDE0MDAwKTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25Gb3J3YXJkKCkge1xuXHRcdFx0XHQvL3RyYW5zbGF0ZSg0NC43MDkxMTAsIDAuNjgwMjkxKVxuXHRcdFx0XHQvL3RhcGUuYW5pbWF0ZSggeyAndHJhbnNmb3JtJyA6ICd0JyArIGJib3gueCArICcsIDAuNjgwMjkxJyB9LCAzMDAwKTtcblx0XHRcdFx0Ly90YXBlTCA5MC4zODkyNTA5OTk5OTk5OVxuXHRcdFx0XHQvL3RhcGVSIDMzMC4zODkyNTFcblx0XHRcdFx0dGFwZUwuYW5pbWF0ZSh7IGN4OiBiYm94TC5jeCB9LCAyMDAwLCBtaW5hLmJvdW5jZSwgXG5cdFx0XHRcdGZ1bmN0aW9uKCkgeyB0YXBlTC5hbmltYXRlKHsgY3g6IDExMCB9LCAyMDAwKSB9KTtcblxuXHRcdFx0XHR0YXBlUi5hbmltYXRlKHsgY3g6IGJib3hSLmN4IH0sIDIwMDAsIG1pbmEuYm91bmNlLCBcblx0XHRcdFx0ZnVuY3Rpb24oKSB7IHRhcGVSLmFuaW1hdGUoeyBjeDogMzYwIH0sIDIwMDApIH0pO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRjb25zb2xlLmxvZygnbGVmdDogJyArIGJib3hMLmN4KTtcblx0XHRcdGNvbnNvbGUubG9nKCdyaWdodDogJyArIGJib3hSLmN4KTtcblx0XHRcdFxuXHRcdFx0dGFwZUFuaW1hdGlvbkZvcndhcmQoKTtcblxuXHRcdFx0ZnVuY3Rpb24gc2V0V2hlZWxBbmltYXRpb24oIHNwZWVkLCBtb2RlICkge1xuXHRcdFx0XHRpZiggbW9kZSA9PT0gJ3BsYXknIHx8IG1vZGUgPT09ICdmb3J3YXJkJyB8fCBtb2RlID09PSAncmVjJykge1xuXHRcdFx0XHRcdGFuaW0gPSAncm90YXRlTGVmdCc7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiggbW9kZSA9PT0gJ2JhY2t3YXJkJyApIHtcblx0XHRcdFx0XHRhbmltID0gJ3JvdGF0ZVJpZ2h0Jztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyByZWMgZnVuY3Rpb25cblx0XHRcdHJlYy5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UmVjKXtcblxuXHRcdFx0IFx0XHRwbGF5U3RvcCgpO1xuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpO1xuXHRcdFx0XHRcdGZvcndhcmRTdG9wKCk7XG5cblx0XHRcdCBcdFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXHRcdFx0IFx0XHQvLyB3aGVlbHMgZXZlbnRzXG5cdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0XG5cdFx0XHRcdFx0eFJlYyA9IHRydWU7XG5cblx0XHRcdFx0fSAgZWxzZSB7XG5cblx0XHRcdFx0XHRyZWNTdG9wKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHJlYyBmdW5jdGlvblxuXG5cdFx0XHQvLyBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0YmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheEJhY2t3YXJkKXtcblxuXHRcdFx0IFx0XHRyZWNTdG9wKCk7XG5cdFx0XHRcdFx0cGxheVN0b3AoKTtcblx0XHRcdFx0XHRmb3J3YXJkU3RvcCgpO1xuXG5cdFx0XHQgXHRcdGJhY2t3YXJkLnRyYW5zZm9ybSgndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZCgpO1xuXG5cdFx0XHRcdFx0eEJhY2t3YXJkID0gdHJ1ZTtcblxuXHRcdFx0XHR9ICBlbHNlIHtcblxuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpXG5cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblxuXHRcdFx0Ly8gcGxheSBmdW5jdGlvblxuXHRcdFx0cGxheS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UGxheSl7XG5cblx0XHRcdCBcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpO1xuXHRcdFx0XHRcdGZvcndhcmRTdG9wKCk7XG5cblx0XHRcdCBcdFx0cGxheS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXG5cdFx0XHRcdFx0eFBsYXkgPSB0cnVlO1xuXG5cdFx0XHRcdFx0c29uZy5wbGF5KCk7XG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZyhzb25nLnBsYXkoKSk7XG5cblx0XHRcdFx0fSAgZWxzZSB7XG5cblx0XHRcdFx0ICBwbGF5U3RvcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cblx0XHRcdC8vIGZvcndhcmQgZnVuY3Rpb25cblx0XHRcdGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICghWEZvcndhcmQpe1xuXG5cdFx0XHQgXHRcdHJlY1N0b3AoKTtcblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKTtcblx0XHRcdFx0XHRwbGF5U3RvcCgpO1xuXG5cdFx0XHQgXHRcdGZvcndhcmQudHJhbnNmb3JtKCd0MjU0LjM0NDA1MywnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXHRcdFx0IFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmQoKTtcblxuXHRcdFx0XHRcdFhGb3J3YXJkID0gdHJ1ZTtcblx0XHRcdFx0fSAgZWxzZSB7XG5cblx0XHRcdFx0XHRmb3J3YXJkU3RvcCgpO1xuXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuXHRcdFx0dmFyIG15YXVkaW8gPSBuZXcgQXVkaW8oJ215c29uZy5tcDMnKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=