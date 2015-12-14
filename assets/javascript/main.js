
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
	
			audio.addEventListener("ended", function(){ switchTrack(); });
	
			audio.addEventListener("timeupdate", function(){ timeUpdate(); });
			audio.addEventListener("tracktitle", function(){ titleUpdate(); });
			
			audio.addEventListener("ended", function(){ nextTrack(); });

		

			// wheel animation left
			function wheelAnimationL() {
				wheelL.animate({ transform: 'r360,30,30'}, 2000,
					function(){ 
							wheelL.attr({ transform: 'rotate(0 30 30)'});
							wheelAnimationL();
						}
				);
			}
			// wheel animation right
			function wheelAnimationR() {
				wheelR.animate({ transform: 'r360,270,30'}, 2000,
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
			function nextTrack () {

				if(currentTrack == (playlist.length - 1)){
					currentTrack = 0;
				} else {
				    currentTrack++;	
				}

				audio.src = dir+playlist[currentTrack]+ext;

				titleUpdate();

				audio.play();
			
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
			
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG5cdFx0dmFyIHJlYyA9IFNuYXAoJyNyZWMnKSxcblx0XHRcdHhSZWMgPSBmYWxzZSxcblx0XHRcdGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG5cdFx0XHRwbGF5UGF1c2UgPSBTbmFwKCcjcGxheVBhdXNlJyksXG5cdFx0XHRwbGF5U3RhdGUgPSBTbmFwKCcjcGxheVN0YXRlJyksXG5cdFx0XHRwYXVzZVN0YXRlID0gU25hcCgnI3BhdXNlU3RhdGUnKSxcblx0XHRcdHBsYXlBY3RpdmUgPSBmYWxzZSxcblx0XHRcdGZvcndhcmQgPSBTbmFwKCcjZm9yd2FyZCcpLFxuXHRcdFx0d2hlZWxMID0gU25hcCgnI3doZWVsLWwnKSxcblx0XHRcdHdoZWVsUiA9IFNuYXAoJyN3aGVlbC1yJyksXG5cdFx0XHR0YXBlID0gU25hcCgnI3RhcGUnKSxcblx0XHRcdHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG5cdFx0XHR0YXBlUiA9IFNuYXAoJyN0YXBlUicpLFxuXHRcdFx0Y3VydGltZXRleHQgPSBTbmFwKCcjY3VydGltZXRleHQgdHNwYW4nKSxcblx0XHRcdGR1cnRpbWV0ZXh0ID0gU25hcCgnI2R1cnRpbWV0ZXh0IHRzcGFuJyksXG5cdFx0XHR0cmFja3RpdGxlID0gU25hcCgnI3RyYWNrdGl0bGUgdHNwYW4nKSxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbiA9IDAuNjc5NDc3LFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uQWN0aXZlID0gOC42Nzk0NzcsXG5cdFx0XHRiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcblx0XHRcdGJib3hSID0gdGFwZVIuZ2V0QkJveCgpLFxuXHRcdFx0YXVkaW8gPSBuZXcgQXVkaW8oKSxcblx0XHRcdGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG5cdFx0XHRwbGF5bGlzdCA9IFsnY2VzYXJpYScsICdub190cmVuZHMnLCAneW91X2dvdF9tZSddLFxuXHRcdFx0ZGlyID0gXCJhdWRpby9cIixcblx0XHRcdGV4dCA9IFwiLm1wM1wiLFxuXHRcdFx0Y3VycmVudFRyYWNrID0gMCxcblx0XHRcdHNlZWtzbGlkZXIsXG5cdFx0XHRzZWVraW5nPWZhbHNlLFxuXHRcdFx0c2Vla3RvO1xuXG5cdFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuXHRcdFx0Ly8gQXVkaW8gT2JqZWN0XG5cdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG5cdFx0XHQvL2N1cnRpbWV0ZXh0Lm5vZGUudGV4dENvbnRlbnQuID0gXCIwMDowM1wiO1xuXHRcdFx0Ly9jdXJ0aW1ldGV4dC5ub2RlLmlubmVySFRNTCA9IFwiTmV3XCI7XG5cdFx0XHQvL2N1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gJ3llcCdcblxuXHRcdFx0Y29uc29sZS5sb2coYXVkaW8uc3JjKTtcblxuXHRcdFx0c2Vla3NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2Vla3NsaWRlclwiKTtcblx0XHRcdFxuXHRcdFx0Ly9jdXJ0aW1ldGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY3VydGltZXRleHRcIik7XG5cdFx0XHQvL2R1cnRpbWV0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkdXJ0aW1ldGV4dFwiKTtcblx0XHRcdC8vIEFkZCBFdmVudCBIYW5kbGluZ1xuXHRcblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpeyBzd2l0Y2hUcmFjaygpOyB9KTtcblx0XG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBmdW5jdGlvbigpeyB0aW1lVXBkYXRlKCk7IH0pO1xuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRyYWNrdGl0bGVcIiwgZnVuY3Rpb24oKXsgdGl0bGVVcGRhdGUoKTsgfSk7XG5cdFx0XHRcblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpeyBuZXh0VHJhY2soKTsgfSk7XG5cblx0XHRcblxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uTCgpIHtcblx0XHRcdFx0d2hlZWxMLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDMwLDMwJ30sIDIwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsTC5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuXHRcdFx0XHR3aGVlbFIuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3IzNjAsMjcwLDMwJ30sIDIwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXsgXG5cdFx0XHRcdFx0XHRcdHdoZWVsUi5hdHRyKHsgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25SKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25SKCk7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRmdW5jdGlvbiBzdG9wV2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsTC5zdG9wKCk7XG5cdFx0XHRcdHdoZWVsUi5zdG9wKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG5cdFx0XHQgIFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0eFJlYyA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRmdW5jdGlvbiBwbGF5U3RvcCgpIHtcblx0XHRcdCAgXHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHBsYXlBY3RpdmUgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIGZvcndhcmRTdG9wKCkge1xuXHRcdFx0XHRmb3J3YXJkLnRyYW5zZm9ybSgndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRzdG9wQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFhGb3J3YXJkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBuZXh0VHJhY2sgKCkge1xuXG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuXHRcdFx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2srKztcdFxuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcblx0XHRcdC8vIHJlYyBmdW5jdGlvblxuXHRcdFx0cmVjLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0IFx0XG5cdFx0XHQgXHRpZiAoIXhSZWMpe1xuXG5cdFx0XHQgXHRcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblx0XHRcdCBcdFx0Ly8gd2hlZWxzIGV2ZW50c1xuXG5cdFx0XHQgXHRcdGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXG5cdFx0XHRcdFx0eFJlYyA9IHRydWU7XG5cblx0XHRcdFx0fSAgZWxzZSB7XG5cdFx0XHRcdFx0cmVjU3RvcCgpO1xuXG5cdFx0XHRcdFx0aWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblx0XHRcdCBcdFxuXHRcdFx0IFx0aWYoYXVkaW8ucGF1c2VkKSB7IFxuXG5cdFx0XHQgXHRcdC8vIHBsYXkgc3RhdGVcblxuXHRcdFx0IFx0XHRwbGF5QWN0aXZlID0gdHJ1ZTtcblxuXHRcdFx0IFx0XHRwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRcdFx0IFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cblx0XHRcdCBcdFx0Y29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cblx0XHRcdFx0XHRpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHQgXHRcdH1cblx0XHRcdFx0XHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cdFx0XHRcdCAgICBhdWRpby5wbGF5KCk7XG5cdFx0XHRcdCAgICB0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHQgICAgfSBlbHNlIHtcblxuXHRcdFx0ICAgIFx0Ly8gcGF1c2Ugc3RhdGVcblxuXHRcdFx0ICAgIFx0cGxheUFjdGl2ZSA9IGZhbHNlO1xuXG5cdFx0XHQgICAgXHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblx0XHRcdCAgICBcdHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG5cdFx0XHQgICAgXHRjb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuXHRcdFx0XHQgICAgYXVkaW8ucGF1c2UoKTtcblxuXHRcdFx0XHQgIFx0aWYgKCF4UmVjKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdCAgXHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHQgIFx0fVxuXHRcdFx0XHQgIFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0ICAgIH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHBsYXkgZnVuY3Rpb25cblxuXHRcdFx0Ly8gYmFja3dhcmQgZnVuY3Rpb25cblx0XHRcdGJhY2t3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0IFx0XG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhbmltMSgpO1xuXHRcdFx0XG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA+IDAgKSB7XG5cblx0XHRcdFx0XHRjdXJyZW50VHJhY2stLTtcblxuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ2J3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjayA9IChwbGF5bGlzdC5sZW5ndGggLSAxKTtcblxuXHRcdFx0XHQgICAgY29uc29sZS5sb2coJ2J3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0Ly8gZm9yd2FyZCBmdW5jdGlvblxuXHRcdFx0Zm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHsgXG5cblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1x0XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjb25zb2xlLmxvZygnZncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG5cdFx0XHRmdW5jdGlvbiBzZWVrKGV2ZW50KXtcblx0XHRcdCAgICBpZihzZWVraW5nKXtcblx0XHRcdFx0ICAgIHRhcGUudHJhbnNmb3JtKCd0NDMuNzA5MTEwLCAwLjY4MDI5MScpO1xuXHRcdFx0ICAgICAgICAvL3NlZWt0byA9IGF1ZGlvLmR1cmF0aW9uICogKHNlZWtzbGlkZXIudmFsdWUgLyAxMDApO1xuXHRcdFx0ICAgICAgICAvL2F1ZGlvLmN1cnJlbnRUaW1lID0gc2Vla3RvO1xuXHRcdFx0ICAgIH1cblx0XHQgICAgfVxuLy90cmFuc2Zvcm09XCJ0cmFuc2xhdGUoNDMuNzA5MTEwLCAwLjY4MDI5MSlcIlxuXHRcdCAgICBmdW5jdGlvbiB0aW1lVXBkYXRlKCl7XG5cdFx0XHRcdHZhciBudCA9IGF1ZGlvLmN1cnJlbnRUaW1lICogKDEwMCAvIGF1ZGlvLmR1cmF0aW9uKTtcblx0XHRcdFx0c2Vla3NsaWRlci52YWx1ZSA9IG50O1xuXG5cdFx0XHRcdHZhciB0YXBlWCA9IDQzLjcwOTExMCAqIChhdWRpby5jdXJyZW50VGltZSAvIDEwMCk7XG5cdFx0XHRcdHRhcGUudHJhbnNmb3JtKCd0JyArIHRhcGVYICsnLCAwLjY4MDI5MScpO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKHRhcGVYKTtcblxuXHRcdFx0XHQvL29yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdHZhciBjdXJtaW5zID0gTWF0aC5mbG9vcihhdWRpby5jdXJyZW50VGltZSAvIDYwKTtcblx0XHRcdCAgICB2YXIgY3Vyc2VjcyA9IE1hdGguZmxvb3IoYXVkaW8uY3VycmVudFRpbWUgLSBjdXJtaW5zICogNjApO1xuXHRcdFx0ICAgIHZhciBkdXJtaW5zID0gTWF0aC5mbG9vcihhdWRpby5kdXJhdGlvbiAvIDYwKTtcblx0XHRcdCAgICB2YXIgZHVyc2VjcyA9IE1hdGguZmxvb3IoYXVkaW8uZHVyYXRpb24gLSBkdXJtaW5zICogNjApO1xuXHRcdFx0XHRpZihjdXJzZWNzIDwgMTApeyBjdXJzZWNzID0gXCIwXCIrY3Vyc2VjczsgfVxuXHRcdFx0ICAgIGlmKGR1cnNlY3MgPCAxMCl7IGR1cnNlY3MgPSBcIjBcIitkdXJzZWNzOyB9XG5cdFx0XHQgICAgaWYoY3VybWlucyA8IDEwKXsgY3VybWlucyA9IFwiMFwiK2N1cm1pbnM7IH1cblx0XHRcdCAgICBpZihkdXJtaW5zIDwgMTApeyBkdXJtaW5zID0gXCIwXCIrZHVybWluczsgfVxuXHRcdFx0XHRjdXJ0aW1ldGV4dC5ub2RlLmlubmVySFRNTCA9IGN1cm1pbnMrXCI6XCIrY3Vyc2Vjcztcblx0XHRcdCAgICBkdXJ0aW1ldGV4dC5ub2RlLmlubmVySFRNTCA9IGR1cm1pbnMrXCI6XCIrZHVyc2Vjcztcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRpdGxlVXBkYXRlKCl7XG5cdFx0XHRcdHRyYWNrdGl0bGUubm9kZS5pbm5lckhUTUwgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuXHRcdFx0fVxuXHRcdFx0Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9