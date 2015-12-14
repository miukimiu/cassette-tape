
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
			  	playPause.transform('t169.344053, ' + buttonYposition);
				playActive = false;
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
				seekslider.value = nt;

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
			
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cdFx0dmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcblx0XHRcdHhSZWMgPSBmYWxzZSxcblx0XHRcdGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG5cdFx0XHRwbGF5UGF1c2UgPSBTbmFwKCcjcGxheVBhdXNlJyksXG5cdFx0XHRwbGF5U3RhdGUgPSBTbmFwKCcjcGxheVN0YXRlJyksXG5cdFx0XHRwYXVzZVN0YXRlID0gU25hcCgnI3BhdXNlU3RhdGUnKSxcblx0XHRcdHBsYXlBY3RpdmUgPSBmYWxzZSxcblx0XHRcdGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuXHRcdFx0d2hlZWxMID0gU25hcCgnI3doZWVsLWwnKSxcblx0XHRcdHdoZWVsUiA9IFNuYXAoJyN3aGVlbC1yJyksXG5cdFx0XHR0YXBlID0gU25hcCgnI3RhcGUnKSxcblx0XHRcdHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG5cdFx0XHR0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuXHRcdFx0Y3VydGltZXRleHQgPSBTbmFwKCcjY3VydGltZXRleHQgdHNwYW4nKSxcblx0XHRcdGR1cnRpbWV0ZXh0ID0gU25hcCgnI2R1cnRpbWV0ZXh0IHRzcGFuJyksXG5cdFx0XHR0cmFja3RpdGxlID0gU25hcCgnI3RyYWNrdGl0bGUgdHNwYW4nKSxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbiA9IDAuNjc5NDc3LFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG5cdFx0XHRiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcblx0XHRcdGJib3hSID0gdGFwZVIuZ2V0QkJveCgpLFxuXHRcdFx0YXVkaW8gPSBuZXcgQXVkaW8oKSxcblx0XHRcdGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG5cdFx0XHRwbGF5bGlzdCA9IFsnY2VzYXJpYScsICdub190cmVuZHMnLCAneW91X2dvdF9tZSddLFxuXHRcdFx0ZGlyID0gXCJhdWRpby9cIixcblx0XHRcdGV4dCA9IFwiLm1wM1wiLFxuXHRcdFx0Y3VycmVudFRyYWNrID0gMCxcblx0XHRcdHNlZWtzbGlkZXIsXG5cdFx0XHRzZWVraW5nPWZhbHNlLFxuXHRcdFx0c2Vla3RvO1xuXG5cdFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuXHRcdFx0Ly8gQXVkaW8gT2JqZWN0XG5cdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG5cdFx0XHQvL2N1cnRpbWV0ZXh0Lm5vZGUudGV4dENvbnRlbnQuID0gXCIwMDowM1wiO1xuXHRcdFx0Ly9jdXJ0aW1ldGV4dC5ub2RlLmlubmVySFRNTCA9IFwiTmV3XCI7XG5cdFx0XHQvL2N1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gJ3llcCdcblxuXHRcdFx0Y29uc29sZS5sb2coYXVkaW8uc3JjKTtcblxuXHRcdFx0c2Vla3NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2Vla3NsaWRlclwiKTtcblx0XHRcdFxuXHRcdFx0Ly9jdXJ0aW1ldGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY3VydGltZXRleHRcIik7XG5cdFx0XHQvL2R1cnRpbWV0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkdXJ0aW1ldGV4dFwiKTtcblx0XHRcdC8vIEFkZCBFdmVudCBIYW5kbGluZ1xuXHRcblx0XHRcdHNlZWtzbGlkZXIuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihldmVudCl7IHNlZWtpbmc9dHJ1ZTsgc2VlayhldmVudCk7IH0pO1xuXHRcdFx0c2Vla3NsaWRlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGZ1bmN0aW9uKGV2ZW50KXsgc2VlayhldmVudCk7IH0pO1xuXHRcdFx0c2Vla3NsaWRlci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLGZ1bmN0aW9uKCl7IHNlZWtpbmc9ZmFsc2U7IH0pO1xuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgZnVuY3Rpb24oKXsgdGltZVVwZGF0ZSgpOyB9KTtcblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7IHRpdGxlVXBkYXRlKCk7IH0pO1xuXG5cdFx0XHRjb25zb2xlLmxvZygndGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25MKCkge1xuXHRcdFx0XHR3aGVlbEwuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvblIoKSB7XG5cdFx0XHRcdHdoZWVsUi5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwyNzAsMzAnfVxuXHRcdFx0XHRcdCwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpeyBcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZ1bmN0aW9uIHN0b3BXaGVlbEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxMLnN0b3AoKTtcblx0XHRcdFx0d2hlZWxSLnN0b3AoKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gcmVjU3RvcCgpIHtcblx0XHRcdCAgXHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHR4UmVjID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuXHRcdFx0ICBcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG5cdFx0XHRcdGZvcndhcmQudHJhbnNmb3JtKCd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0WEZvcndhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRhcGVBbmltYXRpb25CYWNrd2FyZCgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0YXBlQW5pbWF0aW9uUGxheSgpIHtcblx0XHRcdFx0Ly90cmFuc2xhdGUoNDQuNzA5MTEwLCAwLjY4MDI5MSlcblx0XHRcdFx0dGFwZS5hbmltYXRlKCB7ICd0cmFuc2Zvcm0nIDogJ3Q4NC43MDkxMTAsIDAuNjgwMjkxJyB9LCAxNDAwMCk7XG5cdFx0XHR9XG5cdFx0XG5cdFx0XHQvLyByZWMgZnVuY3Rpb25cblx0XHRcdHJlYy5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYgKCF4UmVjKXtcblxuXHRcdFx0IFx0XHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHQgXHRcdC8vIHdoZWVscyBldmVudHNcblxuXHRcdFx0IFx0XHRpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHQgXHRcdH1cblxuXHRcdFx0XHRcdHhSZWMgPSB0cnVlO1xuXG5cdFx0XHRcdH0gIGVsc2Uge1xuXHRcdFx0XHRcdHJlY1N0b3AoKTtcblxuXHRcdFx0XHRcdGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0XG5cdFx0XHRcdFx0XHRzdG9wV2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHJlYyBmdW5jdGlvblxuXG5cdFx0XHQvLyBwbGF5IGZ1bmN0aW9uXG5cdFx0XHRwbGF5UGF1c2UuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmKGF1ZGlvLnBhdXNlZCkgeyBcblxuXHRcdFx0IFx0XHQvLyBwbGF5IHN0YXRlXG5cblx0XHRcdCBcdFx0cGxheUFjdGl2ZSA9IHRydWU7XG5cblx0XHRcdCBcdFx0cGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblx0XHRcdCBcdFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG5cdFx0XHQgXHRcdGNvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG5cdFx0XHRcdFx0aWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0IFx0XHR9XG5cdFx0XHRcdFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXHRcdFx0XHQgICAgYXVkaW8ucGxheSgpO1xuXHRcdFx0XHQgICAgdGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0ICAgIH0gZWxzZSB7XG5cblx0XHRcdCAgICBcdC8vIHBhdXNlIHN0YXRlXG5cblx0XHRcdCAgICBcdHBsYXlBY3RpdmUgPSBmYWxzZTtcblxuXHRcdFx0ICAgIFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cdFx0XHQgICAgXHRwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuXHRcdFx0ICAgIFx0Y29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cblx0XHRcdFx0ICAgIGF1ZGlvLnBhdXNlKCk7XG5cblx0XHRcdFx0ICBcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHQgIFx0XHRzdG9wV2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0ICBcdH1cblx0XHRcdFx0ICBcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgICB9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cblx0XHRcdC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHRiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YW5pbTEoKTtcblx0XHRcdFxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPiAwICkge1xuXG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrLS07XG5cblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG5cblx0XHRcdFx0ICAgIGNvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuXHRcdFx0XHR0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHRcdGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblx0XHRcdC8vIGZvcndhcmQgZnVuY3Rpb25cblx0XHRcdGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1x0XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmxvZygnZncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBmb3J3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdGZ1bmN0aW9uIHNlZWsoZXZlbnQpe1xuXHRcdFx0ICAgIGlmKHNlZWtpbmcpe1xuXHRcdFx0XHQgICAgdGFwZS50cmFuc2Zvcm0oJ3Q0My43MDkxMTAsIDAuNjgwMjkxJyk7XG5cdFx0XHQgICAgICAgIC8vc2Vla3RvID0gYXVkaW8uZHVyYXRpb24gKiAoc2Vla3NsaWRlci52YWx1ZSAvIDEwMCk7XG5cdFx0XHQgICAgICAgIC8vYXVkaW8uY3VycmVudFRpbWUgPSBzZWVrdG87XG5cdFx0XHQgICAgfVxuXHRcdCAgICB9XG4vL3RyYW5zZm9ybT1cInRyYW5zbGF0ZSg0My43MDkxMTAsIDAuNjgwMjkxKVwiXG5cdFx0ICAgIGZ1bmN0aW9uIHRpbWVVcGRhdGUoKXtcblx0XHRcdFx0dmFyIG50ID0gYXVkaW8uY3VycmVudFRpbWUgKiAoMTAwIC8gYXVkaW8uZHVyYXRpb24pO1xuXHRcdFx0XHRzZWVrc2xpZGVyLnZhbHVlID0gbnQ7XG5cblx0XHRcdFx0dmFyIHRhcGVYID0gNDMuNzA5MTEwICogKGF1ZGlvLmN1cnJlbnRUaW1lIC8gMTAwKTtcblx0XHRcdFx0dGFwZS50cmFuc2Zvcm0oJ3QnICsgdGFwZVggKycsIDAuNjgwMjkxJyk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2codGFwZVgpO1xuXG5cdFx0XHRcdC8vb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0dmFyIGN1cm1pbnMgPSBNYXRoLmZsb29yKGF1ZGlvLmN1cnJlbnRUaW1lIC8gNjApO1xuXHRcdFx0ICAgIHZhciBjdXJzZWNzID0gTWF0aC5mbG9vcihhdWRpby5jdXJyZW50VGltZSAtIGN1cm1pbnMgKiA2MCk7XG5cdFx0XHQgICAgdmFyIGR1cm1pbnMgPSBNYXRoLmZsb29yKGF1ZGlvLmR1cmF0aW9uIC8gNjApO1xuXHRcdFx0ICAgIHZhciBkdXJzZWNzID0gTWF0aC5mbG9vcihhdWRpby5kdXJhdGlvbiAtIGR1cm1pbnMgKiA2MCk7XG5cdFx0XHRcdGlmKGN1cnNlY3MgPCAxMCl7IGN1cnNlY3MgPSBcIjBcIitjdXJzZWNzOyB9XG5cdFx0XHQgICAgaWYoZHVyc2VjcyA8IDEwKXsgZHVyc2VjcyA9IFwiMFwiK2R1cnNlY3M7IH1cblx0XHRcdCAgICBpZihjdXJtaW5zIDwgMTApeyBjdXJtaW5zID0gXCIwXCIrY3VybWluczsgfVxuXHRcdFx0ICAgIGlmKGR1cm1pbnMgPCAxMCl7IGR1cm1pbnMgPSBcIjBcIitkdXJtaW5zOyB9XG5cdFx0XHRcdGN1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gY3VybWlucytcIjpcIitjdXJzZWNzO1xuXHRcdFx0ICAgIGR1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gZHVybWlucytcIjpcIitkdXJzZWNzO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcblx0XHRcdFx0dHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cdFx0XHR9XG5cdFx0XHQiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=