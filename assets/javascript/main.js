
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXHRcdHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG5cdFx0XHR4UmVjID0gZmFsc2UsXG5cdFx0XHRiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuXHRcdFx0eEJhY2t3YXJkID0gZmFsc2UsXG5cdFx0XHRwbGF5ID0gU25hcCgnI3BsYXknKSxcblx0XHRcdHhQbGF5ID0gZmFsc2UsXG5cdFx0XHRmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcblx0XHRcdFhGb3J3YXJkID0gZmFsc2UsXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG5cdFx0XHR0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpO1xuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCk7XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwzMCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDI3MCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdH1cblx0XHRcdC8vIHdoZWVsIHNwZWVkIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkZvcndhcmRMKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDMwLDMwJ31cblx0XHRcdFx0XHQsIDEwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmRMKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBzcGVlZCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uRm9yd2FyZFIoKSB7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCkuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMjcwLDMwJ31cblx0XHRcdFx0XHQsIDEwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25Gb3J3YXJkUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25Gb3J3YXJkKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkZvcndhcmRMKCk7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uRm9yd2FyZFIoKTtcblx0XHRcdH1cblx0XHRcdC8vIGxlZnQgd2hlZWwgYW5pbWF0aW9uIGJhY2t3YXJkXG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkJhY2t3YXJkTCgpIHtcblx0XHRcdFx0d2hlZWxMLnN0b3AoKS5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfVxuXHRcdFx0XHRcdCwgMTAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uQmFja3dhcmRMKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyByaWdodCB3aGVlbCBhbmltYXRpb24gYmFja3dhcmRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uQmFja3dhcmRSKCkge1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfVxuXHRcdFx0XHRcdCwgMTAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkJhY2t3YXJkUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25CYWNrd2FyZCgpIHtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZEwoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25CYWNrd2FyZFIoKTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHN0b3BBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCk7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG5cdFx0XHQgIFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgXHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGJhY2t3YXJkU3RvcCgpIHtcblx0XHRcdFx0YmFja3dhcmQudHJhbnNmb3JtKCd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4QmFja3dhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuXHRcdFx0ICBcdHBsYXkudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgIFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHR4UGxheSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG5cdFx0XHRcdGZvcndhcmQudHJhbnNmb3JtKCd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0WEZvcndhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25CYWNrd2FyZCgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uUGxheSgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0dGFwZS5hbmltYXRlKCB7ICd0cmFuc2Zvcm0nIDogJ3Q4NC43MDkxMTAsIDAuNjgwMjkxJyB9LCAxNDAwMCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uRm9yd2FyZCgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0Ly90YXBlLmFuaW1hdGUoIHsgJ3RyYW5zZm9ybScgOiAndCcgKyBiYm94LnggKyAnLCAwLjY4MDI5MScgfSwgMzAwMCk7XG5cdFx0XHRcdC8vdGFwZUwgOTAuMzg5MjUwOTk5OTk5OTlcblx0XHRcdFx0Ly90YXBlUiAzMzAuMzg5MjUxXG5cdFx0XHRcdHRhcGVMLmFuaW1hdGUoeyBjeDogYmJveEwuY3ggfSwgMjAwMCwgbWluYS5ib3VuY2UsIFxuXHRcdFx0XHRmdW5jdGlvbigpIHsgdGFwZUwuYW5pbWF0ZSh7IGN4OiAxMTAgfSwgMjAwMCkgfSk7XG5cblx0XHRcdFx0dGFwZVIuYW5pbWF0ZSh7IGN4OiBiYm94Ui5jeCB9LCAyMDAwLCBtaW5hLmJvdW5jZSwgXG5cdFx0XHRcdGZ1bmN0aW9uKCkgeyB0YXBlUi5hbmltYXRlKHsgY3g6IDM2MCB9LCAyMDAwKSB9KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Y29uc29sZS5sb2coJ2xlZnQ6ICcgKyBiYm94TC5jeCk7XG5cdFx0XHRjb25zb2xlLmxvZygncmlnaHQ6ICcgKyBiYm94Ui5jeCk7XG5cdFx0XHRcblx0XHRcdHRhcGVBbmltYXRpb25Gb3J3YXJkKCk7XG5cblx0XHRcdGZ1bmN0aW9uIHNldFdoZWVsQW5pbWF0aW9uKCBzcGVlZCwgbW9kZSApIHtcblx0XHRcdFx0aWYoIG1vZGUgPT09ICdwbGF5JyB8fCBtb2RlID09PSAnZm9yd2FyZCcgfHwgbW9kZSA9PT0gJ3JlYycpIHtcblx0XHRcdFx0XHRhbmltID0gJ3JvdGF0ZUxlZnQnO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYoIG1vZGUgPT09ICdiYWNrd2FyZCcgKSB7XG5cdFx0XHRcdFx0YW5pbSA9ICdyb3RhdGVSaWdodCc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0Ly8gcmVjIGZ1bmN0aW9uXG5cdFx0XHRyZWMuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFJlYyl7XG5cblx0XHRcdCBcdFx0cGxheVN0b3AoKTtcblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKTtcblx0XHRcdFx0XHRmb3J3YXJkU3RvcCgpO1xuXG5cdFx0XHQgXHRcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblx0XHRcdCBcdFx0Ly8gd2hlZWxzIGV2ZW50c1xuXHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHQgXHRcdFxuXHRcdFx0XHRcdHhSZWMgPSB0cnVlO1xuXG5cdFx0XHRcdH0gIGVsc2Uge1xuXG5cdFx0XHRcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCByZWMgZnVuY3Rpb25cblxuXHRcdFx0Ly8gYmFja3dhcmQgZnVuY3Rpb25cblx0XHRcdGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0IFx0XG5cdFx0XHQgXHRpZiAoIXhCYWNrd2FyZCl7XG5cblx0XHRcdCBcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHRcdHBsYXlTdG9wKCk7XG5cdFx0XHRcdFx0Zm9yd2FyZFN0b3AoKTtcblxuXHRcdFx0IFx0XHRiYWNrd2FyZC50cmFuc2Zvcm0oJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uQmFja3dhcmQoKTtcblxuXHRcdFx0XHRcdHhCYWNrd2FyZCA9IHRydWU7XG5cblx0XHRcdFx0fSAgZWxzZSB7XG5cblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKVxuXG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXkuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFBsYXkpe1xuXG5cdFx0XHQgXHRcdHJlY1N0b3AoKTtcblx0XHRcdFx0XHRiYWNrd2FyZFN0b3AoKTtcblx0XHRcdFx0XHRmb3J3YXJkU3RvcCgpO1xuXG5cdFx0XHQgXHRcdHBsYXkudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblxuXHRcdFx0XHRcdHhQbGF5ID0gdHJ1ZTtcblxuXHRcdFx0XHR9ICBlbHNlIHtcblxuXHRcdFx0XHQgIHBsYXlTdG9wKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHBsYXkgZnVuY3Rpb25cblxuXHRcdFx0Ly8gZm9yd2FyZCBmdW5jdGlvblxuXHRcdFx0Zm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCFYRm9yd2FyZCl7XG5cblx0XHRcdCBcdFx0cmVjU3RvcCgpO1xuXHRcdFx0XHRcdGJhY2t3YXJkU3RvcCgpO1xuXHRcdFx0XHRcdHBsYXlTdG9wKCk7XG5cblx0XHRcdCBcdFx0Zm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTQuMzQ0MDUzLCcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHQgXHRcdHdoZWVsQW5pbWF0aW9uRm9yd2FyZCgpO1xuXG5cdFx0XHRcdFx0WEZvcndhcmQgPSB0cnVlO1xuXHRcdFx0XHR9ICBlbHNlIHtcblxuXHRcdFx0XHRcdGZvcndhcmRTdG9wKCk7XG5cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgZm9yd2FyZCBmdW5jdGlvbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==