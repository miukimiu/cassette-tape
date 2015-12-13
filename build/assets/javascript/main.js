
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
			curtimetext = Snap('#curtimetext tspan'),
			durtimetext = Snap('#durtimetext tspan'),
			tracktitle = Snap('#tracktitle tspan'),
			buttonYposition = 0.679477,
			buttonYpositionActive = 8.679477,
			bboxL = tapeL.getBBox(),
			bboxR = tapeR.getBBox(),
			audio = new Audio(),
			duration = audio.duration,
			playlist = new Array('audio/cesaria.mp3', 'audio/no_trends.mp3', 'audio/you_got_me.mp3'),
			currentTrack = 0,
			seekslider,
			seeking=false, 
			seekto;


			//curtimetext.node.textContent. = "00:03";
			//curtimetext.node.innerHTML = "New";
			//curtimetext.node.innerHTML = 'yep'

			console.log(durtimetext);

			seekslider = document.getElementById("seekslider");
			
			//curtimetext = document.getElementById("curtimetext");
			//durtimetext = document.getElementById("durtimetext");
			// Add Event Handling
	
			seekslider.addEventListener("mousedown", function(event){ seeking=true; seek(event); });
			seekslider.addEventListener("mousemove", function(event){ seek(event); });
			seekslider.addEventListener("mouseup",function(){ seeking=false; });
			audio.addEventListener("timeupdate", function(){ timeUpdate(); });
			audio.addEventListener("tracktitle", function(){ titleUpdate(); });

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
			
			function stopWheelAnimation() {
				wheelL.stop();
				wheelR.stop();
			}

			function recStop() {
			  	rec.transform('t0.344053, ' + buttonYposition);
				xRec = false;
			}
			
			function playStop() {
			  	play.transform('t169.344053, ' + buttonYposition);
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

			 		rec.transform('t0.344053, ' + buttonYpositionActive);

			 		// wheels events

			 		if (!xPlay) { // is stopped or paused
						wheelAnimation();
			 		}

					xRec = true;

				}  else {
					recStop();

					if (!xPlay) { // is stopped or paused
						
						stopWheelAnimation();
					}
				}
			});
			// end rec function

			// play function
			play.click(function() {
			 	
			 	if (!xPlay) { // is stopped or paused

			 		play.transform('t169.344053, ' + buttonYpositionActive);
					
					if (!xRec) { // is stopped or paused
						wheelAnimation();
			 		}
				
					xPlay = true;

					audio.src = playlist[currentTrack];

					titleUpdate();
					
					console.log(playlist[currentTrack]);

	   	 			audio.play();

				}  else { // if is playing
					audio.pause();

					// play stop
				  	playStop();

				  	if (!xRec) { // is stopped or paused
				  		stopWheelAnimation();
				  	}

				  	console.log('play - the current track is: ' + currentTrack);
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

				audio.src = playlist[currentTrack];

				titleUpdate();

				if (xPlay) { // if is playing
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

				audio.src = playlist[currentTrack];

				titleUpdate();

				if (xPlay) { // if is playing
					audio.play();
				}
	

			});
			// end forward function

			function seek(event){
			    if(seeking){
				    seekslider.value = event.clientX - seekslider.offsetLeft;
			        seekto = audio.duration * (seekslider.value / 100);
			        audio.currentTime = seekto;
			    }
		    }		
		    function timeUpdate(){
				var nt = audio.currentTime * (100 / audio.duration);
				seekslider.value = nt;
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
			
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXHRcdHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG5cdFx0XHR4UmVjID0gZmFsc2UsXG5cdFx0XHRiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuXHRcdFx0cGxheSA9IFNuYXAoJyNwbGF5JyksXG5cdFx0XHR4UGxheSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG5cdFx0XHR0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuXHRcdFx0Y3VydGltZXRleHQgPSBTbmFwKCcjY3VydGltZXRleHQgdHNwYW4nKSxcblx0XHRcdGR1cnRpbWV0ZXh0ID0gU25hcCgnI2R1cnRpbWV0ZXh0IHRzcGFuJyksXG5cdFx0XHR0cmFja3RpdGxlID0gU25hcCgnI3RyYWNrdGl0bGUgdHNwYW4nKSxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbiA9IDAuNjc5NDc3LFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG5cdFx0XHRiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcblx0XHRcdGJib3hSID0gdGFwZVIuZ2V0QkJveCgpLFxuXHRcdFx0YXVkaW8gPSBuZXcgQXVkaW8oKSxcblx0XHRcdGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG5cdFx0XHRwbGF5bGlzdCA9IG5ldyBBcnJheSgnYXVkaW8vY2VzYXJpYS5tcDMnLCAnYXVkaW8vbm9fdHJlbmRzLm1wMycsICdhdWRpby95b3VfZ290X21lLm1wMycpLFxuXHRcdFx0Y3VycmVudFRyYWNrID0gMCxcblx0XHRcdHNlZWtzbGlkZXIsXG5cdFx0XHRzZWVraW5nPWZhbHNlLCBcblx0XHRcdHNlZWt0bztcblxuXG5cdFx0XHQvL2N1cnRpbWV0ZXh0Lm5vZGUudGV4dENvbnRlbnQuID0gXCIwMDowM1wiO1xuXHRcdFx0Ly9jdXJ0aW1ldGV4dC5ub2RlLmlubmVySFRNTCA9IFwiTmV3XCI7XG5cdFx0XHQvL2N1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gJ3llcCdcblxuXHRcdFx0Y29uc29sZS5sb2coZHVydGltZXRleHQpO1xuXG5cdFx0XHRzZWVrc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWVrc2xpZGVyXCIpO1xuXHRcdFx0XG5cdFx0XHQvL2N1cnRpbWV0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjdXJ0aW1ldGV4dFwiKTtcblx0XHRcdC8vZHVydGltZXRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImR1cnRpbWV0ZXh0XCIpO1xuXHRcdFx0Ly8gQWRkIEV2ZW50IEhhbmRsaW5nXG5cdFxuXHRcdFx0c2Vla3NsaWRlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKGV2ZW50KXsgc2Vla2luZz10cnVlOyBzZWVrKGV2ZW50KTsgfSk7XG5cdFx0XHRzZWVrc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgZnVuY3Rpb24oZXZlbnQpeyBzZWVrKGV2ZW50KTsgfSk7XG5cdFx0XHRzZWVrc2xpZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsZnVuY3Rpb24oKXsgc2Vla2luZz1mYWxzZTsgfSk7XG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBmdW5jdGlvbigpeyB0aW1lVXBkYXRlKCk7IH0pO1xuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXsgdGl0bGVVcGRhdGUoKTsgfSk7XG5cblx0XHRcdGNvbnNvbGUubG9nKCd0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwzMCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDI3MCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpO1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICBcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gcGxheVN0b3AoKSB7XG5cdFx0XHQgIFx0cGxheS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0eFBsYXkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGZvcndhcmRTdG9wKCkge1xuXHRcdFx0XHRmb3J3YXJkLnRyYW5zZm9ybSgndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFhGb3J3YXJkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uQmFja3dhcmQoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvblBsYXkoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdHRhcGUuYW5pbWF0ZSggeyAndHJhbnNmb3JtJyA6ICd0ODQuNzA5MTEwLCAwLjY4MDI5MScgfSwgMTQwMDApO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyByZWMgZnVuY3Rpb25cblx0XHRcdHJlYy5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UmVjKXtcblxuXHRcdFx0IFx0XHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHQgXHRcdC8vIHdoZWVscyBldmVudHNcblxuXHRcdFx0IFx0XHRpZiAoIXhQbGF5KSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0IFx0XHR9XG5cblx0XHRcdFx0XHR4UmVjID0gdHJ1ZTtcblxuXHRcdFx0XHR9ICBlbHNlIHtcblx0XHRcdFx0XHRyZWNTdG9wKCk7XG5cblx0XHRcdFx0XHRpZiAoIXhQbGF5KSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXkuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFBsYXkpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblxuXHRcdFx0IFx0XHRwbGF5LnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0XHR4UGxheSA9IHRydWU7XG5cblx0XHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cdFx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhwbGF5bGlzdFtjdXJyZW50VHJhY2tdKTtcblxuXHQgICBcdCBcdFx0XHRhdWRpby5wbGF5KCk7XG5cblx0XHRcdFx0fSAgZWxzZSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wYXVzZSgpO1xuXG5cdFx0XHRcdFx0Ly8gcGxheSBzdG9wXG5cdFx0XHRcdCAgXHRwbGF5U3RvcCgpO1xuXG5cdFx0XHRcdCAgXHRpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0ICBcdFx0c3RvcFdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdCAgXHR9XG5cblx0XHRcdFx0ICBcdGNvbnNvbGUubG9nKCdwbGF5IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cblx0XHRcdC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHRiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YW5pbTEoKTtcblx0XHRcdFxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPiAwICkge1xuXG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrLS07XG5cblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG5cblx0XHRcdFx0ICAgIGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0XHRpZiAoeFBsYXkpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0Ly8gZm9yd2FyZCBmdW5jdGlvblxuXHRcdFx0Zm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YW5pbTEoKTtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XHRcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmdyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHhQbGF5KSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcdH1cblx0XG5cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuXHRcdFx0ZnVuY3Rpb24gc2VlayhldmVudCl7XG5cdFx0XHQgICAgaWYoc2Vla2luZyl7XG5cdFx0XHRcdCAgICBzZWVrc2xpZGVyLnZhbHVlID0gZXZlbnQuY2xpZW50WCAtIHNlZWtzbGlkZXIub2Zmc2V0TGVmdDtcblx0XHRcdCAgICAgICAgc2Vla3RvID0gYXVkaW8uZHVyYXRpb24gKiAoc2Vla3NsaWRlci52YWx1ZSAvIDEwMCk7XG5cdFx0XHQgICAgICAgIGF1ZGlvLmN1cnJlbnRUaW1lID0gc2Vla3RvO1xuXHRcdFx0ICAgIH1cblx0XHQgICAgfVx0XHRcblx0XHQgICAgZnVuY3Rpb24gdGltZVVwZGF0ZSgpe1xuXHRcdFx0XHR2YXIgbnQgPSBhdWRpby5jdXJyZW50VGltZSAqICgxMDAgLyBhdWRpby5kdXJhdGlvbik7XG5cdFx0XHRcdHNlZWtzbGlkZXIudmFsdWUgPSBudDtcblx0XHRcdFx0dmFyIGN1cm1pbnMgPSBNYXRoLmZsb29yKGF1ZGlvLmN1cnJlbnRUaW1lIC8gNjApO1xuXHRcdFx0ICAgIHZhciBjdXJzZWNzID0gTWF0aC5mbG9vcihhdWRpby5jdXJyZW50VGltZSAtIGN1cm1pbnMgKiA2MCk7XG5cdFx0XHQgICAgdmFyIGR1cm1pbnMgPSBNYXRoLmZsb29yKGF1ZGlvLmR1cmF0aW9uIC8gNjApO1xuXHRcdFx0ICAgIHZhciBkdXJzZWNzID0gTWF0aC5mbG9vcihhdWRpby5kdXJhdGlvbiAtIGR1cm1pbnMgKiA2MCk7XG5cdFx0XHRcdGlmKGN1cnNlY3MgPCAxMCl7IGN1cnNlY3MgPSBcIjBcIitjdXJzZWNzOyB9XG5cdFx0XHQgICAgaWYoZHVyc2VjcyA8IDEwKXsgZHVyc2VjcyA9IFwiMFwiK2R1cnNlY3M7IH1cblx0XHRcdCAgICBpZihjdXJtaW5zIDwgMTApeyBjdXJtaW5zID0gXCIwXCIrY3VybWluczsgfVxuXHRcdFx0ICAgIGlmKGR1cm1pbnMgPCAxMCl7IGR1cm1pbnMgPSBcIjBcIitkdXJtaW5zOyB9XG5cdFx0XHRcdGN1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gY3VybWlucytcIjpcIitjdXJzZWNzO1xuXHRcdFx0ICAgIGR1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gZHVybWlucytcIjpcIitkdXJzZWNzO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcblx0XHRcdFx0dHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cdFx0XHR9XG5cdFx0XHQiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=