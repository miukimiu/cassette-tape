
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
			curtimetext = document.getElementById("curtimetext"),
			durtimetext = document.getElementById("durtimetext"),
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
			seekto, 
			curtimetext, 
			durtimetext;


			seekslider = document.getElementById("seekslider");
			
			curtimetext = document.getElementById("curtimetext");
			durtimetext = document.getElementById("durtimetext");
			// Add Event Handling
	
			seekslider.addEventListener("mousedown", function(event){ seeking=true; seek(event); });
			seekslider.addEventListener("mousemove", function(event){ seek(event); });
			seekslider.addEventListener("mouseup",function(){ seeking=false; });
			audio.addEventListener("timeupdate", function(){ seektimeupdate(); });

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
		    function seektimeupdate(){
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
				curtimetext.innerHTML = curmins+":"+cursecs;
			    durtimetext.innerHTML = durmins+":"+dursecs;
			}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXHRcdHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG5cdFx0XHR4UmVjID0gZmFsc2UsXG5cdFx0XHRiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuXHRcdFx0cGxheSA9IFNuYXAoJyNwbGF5JyksXG5cdFx0XHR4UGxheSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG5cdFx0XHR0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuXHRcdFx0Y3VydGltZXRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImN1cnRpbWV0ZXh0XCIpLFxuXHRcdFx0ZHVydGltZXRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImR1cnRpbWV0ZXh0XCIpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG5cdFx0XHRhdWRpbyA9IG5ldyBBdWRpbygpLFxuXHRcdFx0ZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcblx0XHRcdHBsYXlsaXN0ID0gbmV3IEFycmF5KCdhdWRpby9jZXNhcmlhLm1wMycsICdhdWRpby9ub190cmVuZHMubXAzJywgJ2F1ZGlvL3lvdV9nb3RfbWUubXAzJyksXG5cdFx0XHRjdXJyZW50VHJhY2sgPSAwLFxuXHRcdFx0c2Vla3NsaWRlcixcblx0XHRcdHNlZWtpbmc9ZmFsc2UsIFxuXHRcdFx0c2Vla3RvLCBcblx0XHRcdGN1cnRpbWV0ZXh0LCBcblx0XHRcdGR1cnRpbWV0ZXh0O1xuXG5cblx0XHRcdHNlZWtzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlZWtzbGlkZXJcIik7XG5cdFx0XHRcblx0XHRcdGN1cnRpbWV0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjdXJ0aW1ldGV4dFwiKTtcblx0XHRcdGR1cnRpbWV0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkdXJ0aW1ldGV4dFwiKTtcblx0XHRcdC8vIEFkZCBFdmVudCBIYW5kbGluZ1xuXHRcblx0XHRcdHNlZWtzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihldmVudCl7IHNlZWtpbmc9dHJ1ZTsgc2VlayhldmVudCk7IH0pO1xuXHRcdFx0c2Vla3NsaWRlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uKGV2ZW50KXsgc2VlayhldmVudCk7IH0pO1xuXHRcdFx0c2Vla3NsaWRlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLGZ1bmN0aW9uKCl7IHNlZWtpbmc9ZmFsc2U7IH0pO1xuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgZnVuY3Rpb24oKXsgc2Vla3RpbWV1cGRhdGUoKTsgfSk7XG5cblx0XHRcdGNvbnNvbGUubG9nKCd0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwzMCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDI3MCwzMCd9XG5cdFx0XHRcdFx0LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpO1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICBcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gcGxheVN0b3AoKSB7XG5cdFx0XHQgIFx0cGxheS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0eFBsYXkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGZvcndhcmRTdG9wKCkge1xuXHRcdFx0XHRmb3J3YXJkLnRyYW5zZm9ybSgndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFhGb3J3YXJkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uQmFja3dhcmQoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdFxuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGFwZUFuaW1hdGlvblBsYXkoKSB7XG5cdFx0XHRcdC8vdHJhbnNsYXRlKDQ0LjcwOTExMCwgMC42ODAyOTEpXG5cdFx0XHRcdHRhcGUuYW5pbWF0ZSggeyAndHJhbnNmb3JtJyA6ICd0ODQuNzA5MTEwLCAwLjY4MDI5MScgfSwgMTQwMDApO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHQvLyByZWMgZnVuY3Rpb25cblx0XHRcdHJlYy5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UmVjKXtcblxuXHRcdFx0IFx0XHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHQgXHRcdC8vIHdoZWVscyBldmVudHNcblxuXHRcdFx0IFx0XHRpZiAoIXhQbGF5KSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0IFx0XHR9XG5cblx0XHRcdFx0XHR4UmVjID0gdHJ1ZTtcblxuXHRcdFx0XHR9ICBlbHNlIHtcblx0XHRcdFx0XHRyZWNTdG9wKCk7XG5cblx0XHRcdFx0XHRpZiAoIXhQbGF5KSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXkuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFBsYXkpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblxuXHRcdFx0IFx0XHRwbGF5LnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXHRcdFx0XHRcblx0XHRcdFx0XHR4UGxheSA9IHRydWU7XG5cblx0XHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocGxheWxpc3RbY3VycmVudFRyYWNrXSk7XG5cblx0ICAgXHQgXHRcdFx0YXVkaW8ucGxheSgpO1xuXG5cdFx0XHRcdH0gIGVsc2UgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGF1c2UoKTtcblxuXHRcdFx0XHRcdC8vIHBsYXkgc3RvcFxuXHRcdFx0XHQgIFx0cGxheVN0b3AoKTtcblxuXHRcdFx0XHQgIFx0aWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdCAgXHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHQgIFx0fVxuXG5cdFx0XHRcdCAgXHRjb25zb2xlLmxvZygncGxheSAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcGxheSBmdW5jdGlvblxuXG5cdFx0XHQvLyBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0YmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFuaW0xKCk7XG5cdFx0XHRcblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuXHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdCAgICBjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXG5cdFx0XHRcdGlmICh4UGxheSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHQvLyBmb3J3YXJkIGZ1bmN0aW9uXG5cdFx0XHRmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhbmltMSgpO1xuXG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuXHRcdFx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2srKztcdFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y29uc29sZS5sb2coJ2Z3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cblxuXHRcdFx0XHRpZiAoeFBsYXkpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXHRcblxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG5cdFx0XHRmdW5jdGlvbiBzZWVrKGV2ZW50KXtcblx0XHRcdCAgICBpZihzZWVraW5nKXtcblx0XHRcdFx0ICAgIHNlZWtzbGlkZXIudmFsdWUgPSBldmVudC5jbGllbnRYIC0gc2Vla3NsaWRlci5vZmZzZXRMZWZ0O1xuXHRcdFx0ICAgICAgICBzZWVrdG8gPSBhdWRpby5kdXJhdGlvbiAqIChzZWVrc2xpZGVyLnZhbHVlIC8gMTAwKTtcblx0XHRcdCAgICAgICAgYXVkaW8uY3VycmVudFRpbWUgPSBzZWVrdG87XG5cdFx0XHQgICAgfVxuXHRcdCAgICB9XHRcdFxuXHRcdCAgICBmdW5jdGlvbiBzZWVrdGltZXVwZGF0ZSgpe1xuXHRcdFx0XHR2YXIgbnQgPSBhdWRpby5jdXJyZW50VGltZSAqICgxMDAgLyBhdWRpby5kdXJhdGlvbik7XG5cdFx0XHRcdHNlZWtzbGlkZXIudmFsdWUgPSBudDtcblx0XHRcdFx0dmFyIGN1cm1pbnMgPSBNYXRoLmZsb29yKGF1ZGlvLmN1cnJlbnRUaW1lIC8gNjApO1xuXHRcdFx0ICAgIHZhciBjdXJzZWNzID0gTWF0aC5mbG9vcihhdWRpby5jdXJyZW50VGltZSAtIGN1cm1pbnMgKiA2MCk7XG5cdFx0XHQgICAgdmFyIGR1cm1pbnMgPSBNYXRoLmZsb29yKGF1ZGlvLmR1cmF0aW9uIC8gNjApO1xuXHRcdFx0ICAgIHZhciBkdXJzZWNzID0gTWF0aC5mbG9vcihhdWRpby5kdXJhdGlvbiAtIGR1cm1pbnMgKiA2MCk7XG5cdFx0XHRcdGlmKGN1cnNlY3MgPCAxMCl7IGN1cnNlY3MgPSBcIjBcIitjdXJzZWNzOyB9XG5cdFx0XHQgICAgaWYoZHVyc2VjcyA8IDEwKXsgZHVyc2VjcyA9IFwiMFwiK2R1cnNlY3M7IH1cblx0XHRcdCAgICBpZihjdXJtaW5zIDwgMTApeyBjdXJtaW5zID0gXCIwXCIrY3VybWluczsgfVxuXHRcdFx0ICAgIGlmKGR1cm1pbnMgPCAxMCl7IGR1cm1pbnMgPSBcIjBcIitkdXJtaW5zOyB9XG5cdFx0XHRcdGN1cnRpbWV0ZXh0LmlubmVySFRNTCA9IGN1cm1pbnMrXCI6XCIrY3Vyc2Vjcztcblx0XHRcdCAgICBkdXJ0aW1ldGV4dC5pbm5lckhUTUwgPSBkdXJtaW5zK1wiOlwiK2R1cnNlY3M7XG5cdFx0XHR9Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9