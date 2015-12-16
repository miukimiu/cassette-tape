
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

		    function timeUpdate(){
				var nt = audio.currentTime * (100 / audio.duration);

				var tapeX = 43.709110 * (audio.currentTime / 100);
				//var teset = tapeL.ellipse(460,120,50,80);

				var tapeLValue = 40 + (audio.currentTime / 3);
				var tapeRValue = 40 + (audio.duration / 3) - (audio.currentTime / 3);

				console.log('duration ' + audio.duration);
				console.log('tapeRValue ' + tapeRValue);

				tapeL.animate({rx: tapeLValue, ry: tapeLValue}, 500, mina.linear)
				tapeR.animate({rx: tapeRValue, ry: tapeRValue}, 500, mina.linear)
			

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
			
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXHRcdHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG5cdFx0XHR4UmVjID0gZmFsc2UsXG5cdFx0XHRiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuXHRcdFx0cGxheVBhdXNlID0gU25hcCgnI3BsYXlQYXVzZScpLFxuXHRcdFx0cGxheVN0YXRlID0gU25hcCgnI3BsYXlTdGF0ZScpLFxuXHRcdFx0cGF1c2VTdGF0ZSA9IFNuYXAoJyNwYXVzZVN0YXRlJyksXG5cdFx0XHRwbGF5QWN0aXZlID0gZmFsc2UsXG5cdFx0XHRmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcblx0XHRcdHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG5cdFx0XHR3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuXHRcdFx0dGFwZSA9IFNuYXAoJyN0YXBlJyksXG5cdFx0XHR0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuXHRcdFx0dGFwZVIgPSBTbmFwKCcjdGFwZVInKSxcblx0XHRcdGN1cnRpbWV0ZXh0ID0gU25hcCgnI2N1cnRpbWV0ZXh0IHRzcGFuJyksXG5cdFx0XHRkdXJ0aW1ldGV4dCA9IFNuYXAoJyNkdXJ0aW1ldGV4dCB0c3BhbicpLFxuXHRcdFx0dHJhY2t0aXRsZSA9IFNuYXAoJyN0cmFja3RpdGxlIHRzcGFuJyksXG5cdFx0XHRidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3Nyxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuXHRcdFx0YmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG5cdFx0XHRiYm94UiA9IHRhcGVSLmdldEJCb3goKSxcblx0XHRcdGF1ZGlvID0gbmV3IEF1ZGlvKCksXG5cdFx0XHRkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuXHRcdFx0cGxheWxpc3QgPSBbJ2Nlc2FyaWEnLCAnbm9fdHJlbmRzJywgJ3lvdV9nb3RfbWUnXSxcblx0XHRcdGRpciA9IFwiYXVkaW8vXCIsXG5cdFx0XHRleHQgPSBcIi5tcDNcIixcblx0XHRcdGN1cnJlbnRUcmFjayA9IDAsXG5cdFx0XHRzZWVrc2xpZGVyLFxuXHRcdFx0c2Vla2luZz1mYWxzZSxcblx0XHRcdHNlZWt0bztcblxuXHRcdFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cblx0XHRcdC8vIEF1ZGlvIE9iamVjdFxuXHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0WzBdK2V4dDtcblxuXHRcdFx0Ly9jdXJ0aW1ldGV4dC5ub2RlLnRleHRDb250ZW50LiA9IFwiMDA6MDNcIjtcblx0XHRcdC8vY3VydGltZXRleHQubm9kZS5pbm5lckhUTUwgPSBcIk5ld1wiO1xuXHRcdFx0Ly9jdXJ0aW1ldGV4dC5ub2RlLmlubmVySFRNTCA9ICd5ZXAnXG5cblx0XHRcdGNvbnNvbGUubG9nKGF1ZGlvLnNyYyk7XG5cblx0XHRcdHNlZWtzbGlkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlZWtzbGlkZXJcIik7XG5cdFx0XHRcblx0XHRcdC8vY3VydGltZXRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImN1cnRpbWV0ZXh0XCIpO1xuXHRcdFx0Ly9kdXJ0aW1ldGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZHVydGltZXRleHRcIik7XG5cdFx0XHQvLyBBZGQgRXZlbnQgSGFuZGxpbmdcblx0XG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKXsgc3dpdGNoVHJhY2soKTsgfSk7XG5cdFxuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcInRpbWV1cGRhdGVcIiwgZnVuY3Rpb24oKXsgdGltZVVwZGF0ZSgpOyB9KTtcblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7IHRpdGxlVXBkYXRlKCk7IH0pO1xuXHRcdFx0XG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKXsgbmV4dFRyYWNrKCk7IH0pO1xuXG5cdFx0XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAncjM2MCwzMCwzMCd9LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyMzYwLDI3MCwzMCd9LCAyMDAwLFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCl7IFxuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpO1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICBcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0ZnVuY3Rpb24gcGxheVN0b3AoKSB7XG5cdFx0XHQgIFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcblx0XHRcdFx0Zm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTQuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHRYRm9yd2FyZCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblx0XHRcdFxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XHRcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuXHRcdFx0XHR0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHRcdFxuXHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcblx0XHRcdH1cblx0XHRcdFxuXHRcdFxuXHRcdFx0Ly8gcmVjIGZ1bmN0aW9uXG5cdFx0XHRyZWMuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdCBcdGlmICgheFJlYyl7XG5cblx0XHRcdCBcdFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXHRcdFx0IFx0XHQvLyB3aGVlbHMgZXZlbnRzXG5cblx0XHRcdCBcdFx0aWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0IFx0XHR9XG5cblx0XHRcdFx0XHR4UmVjID0gdHJ1ZTtcblxuXHRcdFx0XHR9ICBlbHNlIHtcblx0XHRcdFx0XHRyZWNTdG9wKCk7XG5cblx0XHRcdFx0XHRpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0XHRcdFxuXHRcdFx0XHRcdFx0c3RvcFdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCByZWMgZnVuY3Rpb25cblxuXHRcdFx0Ly8gcGxheSBmdW5jdGlvblxuXHRcdFx0cGxheVBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXHRcdFx0IFx0XG5cdFx0XHQgXHRpZihhdWRpby5wYXVzZWQpIHsgXG5cblx0XHRcdCBcdFx0Ly8gcGxheSBzdGF0ZVxuXG5cdFx0XHQgXHRcdHBsYXlBY3RpdmUgPSB0cnVlO1xuXG5cdFx0XHQgXHRcdHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cdFx0XHQgXHRcdHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuXHRcdFx0IFx0XHRjb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuXHRcdFx0XHRcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXHRcdFx0XHRcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblx0XHRcdFx0ICAgIGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0ICAgIHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdCAgICB9IGVsc2Uge1xuXG5cdFx0XHQgICAgXHQvLyBwYXVzZSBzdGF0ZVxuXG5cdFx0XHQgICAgXHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cblx0XHRcdCAgICBcdHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRcdFx0ICAgIFx0cGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cblx0XHRcdCAgICBcdGNvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG5cdFx0XHRcdCAgICBhdWRpby5wYXVzZSgpO1xuXG5cdFx0XHRcdCAgXHRpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0ICBcdFx0c3RvcFdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdCAgXHR9XG5cdFx0XHRcdCAgXHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgICAgfVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcGxheSBmdW5jdGlvblxuXG5cdFx0XHQvLyBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0YmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cdFx0XHQgXHRcblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHsgXG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFuaW0xKCk7XG5cdFx0XHRcblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuXHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdCAgICBjb25zb2xlLmxvZygnYncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0XHRpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHQvLyBmb3J3YXJkIGZ1bmN0aW9uXG5cdFx0XHRmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkgeyBcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7IFxuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjU0LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkgeyBcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YW5pbTEoKTtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XHRcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmdyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0XHRpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBmb3J3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdGZ1bmN0aW9uIHNlZWsoZXZlbnQpe1xuXHRcdFx0ICAgIGlmKHNlZWtpbmcpe1xuXHRcdFx0XHQgICAgdGFwZS50cmFuc2Zvcm0oJ3Q0My43MDkxMTAsIDAuNjgwMjkxJyk7XG5cdFx0XHQgICAgICAgIC8vc2Vla3RvID0gYXVkaW8uZHVyYXRpb24gKiAoc2Vla3NsaWRlci52YWx1ZSAvIDEwMCk7XG5cdFx0XHQgICAgICAgIC8vYXVkaW8uY3VycmVudFRpbWUgPSBzZWVrdG87XG5cdFx0XHQgICAgfVxuXHRcdCAgICB9XG5cblx0XHQgICAgZnVuY3Rpb24gdGltZVVwZGF0ZSgpe1xuXHRcdFx0XHR2YXIgbnQgPSBhdWRpby5jdXJyZW50VGltZSAqICgxMDAgLyBhdWRpby5kdXJhdGlvbik7XG5cblx0XHRcdFx0dmFyIHRhcGVYID0gNDMuNzA5MTEwICogKGF1ZGlvLmN1cnJlbnRUaW1lIC8gMTAwKTtcblx0XHRcdFx0Ly92YXIgdGVzZXQgPSB0YXBlTC5lbGxpcHNlKDQ2MCwxMjAsNTAsODApO1xuXG5cdFx0XHRcdHZhciB0YXBlTFZhbHVlID0gNDAgKyAoYXVkaW8uY3VycmVudFRpbWUgLyAzKTtcblx0XHRcdFx0dmFyIHRhcGVSVmFsdWUgPSA0MCArIChhdWRpby5kdXJhdGlvbiAvIDMpIC0gKGF1ZGlvLmN1cnJlbnRUaW1lIC8gMyk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coJ2R1cmF0aW9uICcgKyBhdWRpby5kdXJhdGlvbik7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCd0YXBlUlZhbHVlICcgKyB0YXBlUlZhbHVlKTtcblxuXHRcdFx0XHR0YXBlTC5hbmltYXRlKHtyeDogdGFwZUxWYWx1ZSwgcnk6IHRhcGVMVmFsdWV9LCA1MDAsIG1pbmEubGluZWFyKVxuXHRcdFx0XHR0YXBlUi5hbmltYXRlKHtyeDogdGFwZVJWYWx1ZSwgcnk6IHRhcGVSVmFsdWV9LCA1MDAsIG1pbmEubGluZWFyKVxuXHRcdFx0XG5cblx0XHRcdFx0Ly9vcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1NC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR2YXIgY3VybWlucyA9IE1hdGguZmxvb3IoYXVkaW8uY3VycmVudFRpbWUgLyA2MCk7XG5cdFx0XHQgICAgdmFyIGN1cnNlY3MgPSBNYXRoLmZsb29yKGF1ZGlvLmN1cnJlbnRUaW1lIC0gY3VybWlucyAqIDYwKTtcblx0XHRcdCAgICB2YXIgZHVybWlucyA9IE1hdGguZmxvb3IoYXVkaW8uZHVyYXRpb24gLyA2MCk7XG5cdFx0XHQgICAgdmFyIGR1cnNlY3MgPSBNYXRoLmZsb29yKGF1ZGlvLmR1cmF0aW9uIC0gZHVybWlucyAqIDYwKTtcblx0XHRcdFx0aWYoY3Vyc2VjcyA8IDEwKXsgY3Vyc2VjcyA9IFwiMFwiK2N1cnNlY3M7IH1cblx0XHRcdCAgICBpZihkdXJzZWNzIDwgMTApeyBkdXJzZWNzID0gXCIwXCIrZHVyc2VjczsgfVxuXHRcdFx0ICAgIGlmKGN1cm1pbnMgPCAxMCl7IGN1cm1pbnMgPSBcIjBcIitjdXJtaW5zOyB9XG5cdFx0XHQgICAgaWYoZHVybWlucyA8IDEwKXsgZHVybWlucyA9IFwiMFwiK2R1cm1pbnM7IH1cblx0XHRcdFx0Y3VydGltZXRleHQubm9kZS5pbm5lckhUTUwgPSBjdXJtaW5zK1wiOlwiK2N1cnNlY3M7XG5cdFx0XHQgICAgZHVydGltZXRleHQubm9kZS5pbm5lckhUTUwgPSBkdXJtaW5zK1wiOlwiK2R1cnNlY3M7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiB0aXRsZVVwZGF0ZSgpe1xuXHRcdFx0XHR0cmFja3RpdGxlLm5vZGUuaW5uZXJIVE1MID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcblx0XHRcdH1cblx0XHRcdCJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==