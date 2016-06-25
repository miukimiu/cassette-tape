$(function() {
    $("#wave-spinner").fadeOut(1000);
    $("#page").fadeIn(2500);

    $("#button").click(function() {
        $('html, body').animate({
            scrollTop: $("#myDiv").offset().top
        }, 2000);
    });

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
        logText = Snap('#recordingText tspan'),
        tracktitle = Snap('#tracktitle tspan'),
        buttonYposition = 0.679477,
        buttonYpositionActive = 8.679477,
        bboxL = tapeL.getBBox(),
        bboxR = tapeR.getBBox(),
        audio = new Audio(),
        duration = audio.duration,
        playlist = ['dirty_south_loop_85bpm', 'pop_hiphop_loop_100bpm'],
        dir = "audio/",
        ext = ".mp3",
        input,
        analyzer,
        currentTrack = 0,
        seekslider,
        seeking = false,
        audio_context,
        recorder,
        mic,
        soundFile;

    pauseState.attr("display", "none");

    $('.mdl-navigation a').click(function() {

        $('.mdl-layout__content').stop().animate({
            scrollTop: $($(this).attr('href')).offset().top - 160
        }, 800);
        return false;
    });


    // Audio Object
    audio.src = dir + playlist[0] + ext;

    audio.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);

    audio.addEventListener("tracktitle", function() {
        titleUpdate();
    });

    // wheel animation left
    function wheelAnimationL() {
        wheelL.animate({
                transform: 'r-360,30,30'
            }, 2000,
            function() {
                wheelL.attr({
                    transform: 'rotate(0 30 30)'
                });
                wheelAnimationL();
            }
        );
    }
    // wheel animation right
    function wheelAnimationR() {
        wheelR.animate({
                transform: 'r-360,270,30'
            }, 2000,
            function() {
                wheelR.attr({
                    transform: 'rotate(0 270 30)'
                });
                wheelAnimationR();
            }
        );
    }

    // wheel animation left
    function tapeAnimationL() {
        tapeL.animate({
                cx: '90.3893'
            }, 500,
            function() {
                tapeL.attr({
                    cx: '92.3893'
                });
                tapeAnimationL();
            }
        );
    }
    // wheel animation right
    function tapeAnimationR() {
        tapeR.animate({
                cx: '330.389'
            }, 500,
            function() {
                tapeR.attr({
                    cx: '328.389'
                });
                tapeAnimationR();
            }
        );
    }

    function wheelAnimation() {
        wheelAnimationR();
        wheelAnimationL();
        tapeAnimationL();
        tapeAnimationR();
    }

    function stopWheelAnimation() {
        wheelL.stop();
        wheelR.stop();
        tapeL.stop();
        tapeR.stop();
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
        forward.transform('t253.344053, ' + buttonYposition);
        stopAnimation();
        XForward = false;
    }

    function nextTrack() {

        if (currentTrack == (playlist.length - 1)) {
            currentTrack = 0;
        } else {
            currentTrack++;
        }

        audio.src = dir + playlist[currentTrack] + ext;

        titleUpdate();

        audio.play();
    }

    // play function
    playPause.click(function() {

        if (audio.paused) {

            // play state
            playActive = true;

            playState.attr("display", "none");
            pauseState.attr("display", "block");

            if (!xRec) { // is not recording
                wheelAnimation();
            }
            playPause.transform('t169.344053, ' + buttonYpositionActive);


            audio.play();

            //audio.play();
            titleUpdate();

        } else {

            // pause state
            playActive = false;

            pauseState.attr("display", "none");
            playState.attr("display", "block");
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
            backward.animate({
                'transform': 't85.344053, ' + buttonYpositionActive
            }, 200, mina.linear, anim2);
        };

        var anim2 = function() {
            backward.animate({
                'transform': 't85.344053, ' + buttonYposition
            }, 200);
        };

        anim1();

        if (currentTrack > 0) {
            currentTrack--;
        } else {
            currentTrack = (playlist.length - 1);
        }

        audio.src = dir + playlist[currentTrack] + ext;

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
            forward.animate({
                'transform': 't253.344053, ' + buttonYpositionActive
            }, 200, mina.linear, anim2);
        };

        var anim2 = function() {
            forward.animate({
                'transform': 't253.344053, ' + buttonYposition
            }, 200);
        };

        anim1();

        if (currentTrack == (playlist.length - 1)) {
            currentTrack = 0;
        } else {
            currentTrack++;
        }

        audio.src = dir + playlist[currentTrack] + ext;

        titleUpdate();

        if (playActive) { // if is playing
            audio.play();
        }
    });
    // end forward function

    function titleUpdate() {
        tracktitle.node.innerHTML = playlist[currentTrack];
    }

    // ******** Recorder ******* //
    function __log(e, data) {
        logText.node.innerHTML = "\n" + e + " " + (data || '');
    }

    function startUserMedia(stream) {
        var input = audio_context.createMediaStreamSource(stream);
        __log('Media stream created.');

        recorder = new Recorder(input);
        __log('Ready!');
    }


    // rec function
    rec.click(function(ok) {

        if (!xRec) { //is not recording

            rec.transform('t0.344053, ' + buttonYpositionActive);

            if (!playActive) { // is stopped or paused
                wheelAnimation();
            }

            xRec = true;

            recorder && recorder.record();

            __log('Recording...');

        } else { //stop recording

            recStop();

            if (!playActive) { // is stopped or paused

                stopWheelAnimation();
            }

            recorder && recorder.stop();

            __log('Stopped rec.');

            // create WAV download link using audio data blob
            createDownloadLink();

            recorder.clear();
        }
    });
    // end rec function

    function createDownloadLink() {
        recorder && recorder.exportWAV(function(blob) {
            var url = URL.createObjectURL(blob);
            var li = document.createElement('li');
            var au = document.createElement('audio');
            var hf = document.createElement('a');

            au.controls = true;
            au.src = url;
            hf.href = url;
            hf.download = new Date().toISOString() + '.wav';
            hf.innerHTML = hf.download;

            recordingslist.insertAdjacentHTML('beforebegin', '<li class="mdl-list__item"><span class="mdl-list__item-primary-content" ><i class="material-icons mdl-list__item-icon">mic</i>' + hf.download + '</span><span class="mdl-list__item-secondary-action"><a class="mdl-button mdl-js-button mdl-button--accent" href="' + url + '"" download>Download <i class="material-icons">file_download</i></a></span></li>');
        });
    }

    window.onload = function init() {
        try {
            // webkit shim
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia); //this will set navigator.getUserMedia to whatever it detects to be the proper prefixed version.
            window.URL = window.URL || window.webkitURL;

            audio_context = new AudioContext;
            __log('Audio context set up.');
            //	__log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
        } catch (e) {
            alert('No web audio support!');
        }

        navigator.getUserMedia({
            audio: true
        }, startUserMedia, function(e) {
            __log('No live audio input: ' + e);
        });
    };

    var sketch = function(noiseWave) {

        var url,
            myCanvas,
            counter = 0,
            startingAngle = 7,
            goRight = true,
            startUp = true,
            myFrameRate = 30,
            running = true;

        noiseWave.setup = function() {

            myCanvas = noiseWave.createCanvas(screen.width, 500);

            myCanvas.parent('cassete-player-ct');

            // Create an Audio input
            mic = new p5.AudioIn();

            // start the Audio Input.
            mic.start();

            // create a sound recorder
            recorder = new p5.SoundRecorder();

            // connect the mic to the recorder
            recorder.setInput(mic);

            // create an empty sound file that we will use to playback the recording
            soundFile = new p5.SoundFile();
        };

        noiseWave.draw = function() {

            var yoff = 0.0;
            // Get the overall volume (between 0 and 1.0)
            var vol = mic.getLevel();

            noiseWave.background(255, 255, 255);
            noiseWave.stroke(25, 202, 144);
            noiseWave.fill(25, 202, 144);

            // We are going to draw a polygon out of the wave points
            noiseWave.beginShape();

            var xoff = 0; // Option #1: 2D Noise

            // Iterate over horizontal pixels
            for (var x = 0; x <= screen.width; x += 10) {
                // Calculate a y value according to noise, map to

                //map(value,start1,stop1,start2,stop2)
                var y = noiseWave.map(noiseWave.noise(xoff, yoff), 0, 1, 200, 300);

                // Set the vertex
                noiseWave.vertex(x, y);
                // Increment x dimension for noise
                xoff += vol;
            }
            // increment y dimension for noise
            yoff += vol;
            noiseWave.vertex(screen.width, screen.height);
            noiseWave.vertex(0, screen.height);
            noiseWave.endShape(noiseWave.CLOSE);
        };


    }; // var sketch

    var myP5 = new p5(sketch);

    navigator.getUserMedia({
        audio: true
    }, startUserMedia, function(e) {
        __log('No live audio input: ' + e);
    });

}); // doc ready

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiQoZnVuY3Rpb24oKSB7XG4gICAgJChcIiN3YXZlLXNwaW5uZXJcIikuZmFkZU91dCgxMDAwKTtcbiAgICAkKFwiI3BhZ2VcIikuZmFkZUluKDI1MDApO1xuXG4gICAgJChcIiNidXR0b25cIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJ2h0bWwsIGJvZHknKS5hbmltYXRlKHtcbiAgICAgICAgICAgIHNjcm9sbFRvcDogJChcIiNteURpdlwiKS5vZmZzZXQoKS50b3BcbiAgICAgICAgfSwgMjAwMCk7XG4gICAgfSk7XG5cbiAgICB2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuICAgICAgICB4UmVjID0gZmFsc2UsXG4gICAgICAgIGJhY2t3YXJkID0gU25hcCgnI2JhY2t3YXJkJyksXG4gICAgICAgIHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcbiAgICAgICAgcGxheVN0YXRlID0gU25hcCgnI3BsYXlTdGF0ZScpLFxuICAgICAgICBwYXVzZVN0YXRlID0gU25hcCgnI3BhdXNlU3RhdGUnKSxcbiAgICAgICAgcGxheUFjdGl2ZSA9IGZhbHNlLFxuICAgICAgICBmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcbiAgICAgICAgd2hlZWxMID0gU25hcCgnI3doZWVsLWwnKSxcbiAgICAgICAgd2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcbiAgICAgICAgdGFwZSA9IFNuYXAoJyN0YXBlJyksXG4gICAgICAgIHRhcGVMID0gU25hcCgnI3RhcGVMJyksXG4gICAgICAgIHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG4gICAgICAgIGxvZ1RleHQgPSBTbmFwKCcjcmVjb3JkaW5nVGV4dCB0c3BhbicpLFxuICAgICAgICB0cmFja3RpdGxlID0gU25hcCgnI3RyYWNrdGl0bGUgdHNwYW4nKSxcbiAgICAgICAgYnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG4gICAgICAgIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuICAgICAgICBiYm94TCA9IHRhcGVMLmdldEJCb3goKSxcbiAgICAgICAgYmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG4gICAgICAgIGF1ZGlvID0gbmV3IEF1ZGlvKCksXG4gICAgICAgIGR1cmF0aW9uID0gYXVkaW8uZHVyYXRpb24sXG4gICAgICAgIHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcbiAgICAgICAgZGlyID0gXCJhdWRpby9cIixcbiAgICAgICAgZXh0ID0gXCIubXAzXCIsXG4gICAgICAgIGlucHV0LFxuICAgICAgICBhbmFseXplcixcbiAgICAgICAgY3VycmVudFRyYWNrID0gMCxcbiAgICAgICAgc2Vla3NsaWRlcixcbiAgICAgICAgc2Vla2luZyA9IGZhbHNlLFxuICAgICAgICBhdWRpb19jb250ZXh0LFxuICAgICAgICByZWNvcmRlcixcbiAgICAgICAgbWljLFxuICAgICAgICBzb3VuZEZpbGU7XG5cbiAgICBwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuICAgICQoJy5tZGwtbmF2aWdhdGlvbiBhJykuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgJCgnLm1kbC1sYXlvdXRfX2NvbnRlbnQnKS5zdG9wKCkuYW5pbWF0ZSh7XG4gICAgICAgICAgICBzY3JvbGxUb3A6ICQoJCh0aGlzKS5hdHRyKCdocmVmJykpLm9mZnNldCgpLnRvcCAtIDE2MFxuICAgICAgICB9LCA4MDApO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cblxuICAgIC8vIEF1ZGlvIE9iamVjdFxuICAgIGF1ZGlvLnNyYyA9IGRpciArIHBsYXlsaXN0WzBdICsgZXh0O1xuXG4gICAgYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50VGltZSA9IDA7XG4gICAgICAgIHRoaXMucGxheSgpO1xuICAgIH0sIGZhbHNlKTtcblxuICAgIGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB0aXRsZVVwZGF0ZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIGxlZnRcbiAgICBmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG4gICAgICAgIHdoZWVsTC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06ICdyLTM2MCwzMCwzMCdcbiAgICAgICAgICAgIH0sIDIwMDAsXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB3aGVlbEwuYXR0cih7XG4gICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG4gICAgLy8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb25SKCkge1xuICAgICAgICB3aGVlbFIuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAnci0zNjAsMjcwLDMwJ1xuICAgICAgICAgICAgfSwgMjAwMCxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHdoZWVsUi5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtOiAncm90YXRlKDAgMjcwIDMwKSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB3aGVlbEFuaW1hdGlvblIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuICAgIGZ1bmN0aW9uIHRhcGVBbmltYXRpb25MKCkge1xuICAgICAgICB0YXBlTC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBjeDogJzkwLjM4OTMnXG4gICAgICAgICAgICB9LCA1MDAsXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0YXBlTC5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgY3g6ICc5Mi4zODkzJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRhcGVBbmltYXRpb25MKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuICAgIC8vIHdoZWVsIGFuaW1hdGlvbiByaWdodFxuICAgIGZ1bmN0aW9uIHRhcGVBbmltYXRpb25SKCkge1xuICAgICAgICB0YXBlUi5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICBjeDogJzMzMC4zODknXG4gICAgICAgICAgICB9LCA1MDAsXG4gICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0YXBlUi5hdHRyKHtcbiAgICAgICAgICAgICAgICAgICAgY3g6ICczMjguMzg5J1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRhcGVBbmltYXRpb25SKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG4gICAgICAgIHdoZWVsQW5pbWF0aW9uUigpO1xuICAgICAgICB3aGVlbEFuaW1hdGlvbkwoKTtcbiAgICAgICAgdGFwZUFuaW1hdGlvbkwoKTtcbiAgICAgICAgdGFwZUFuaW1hdGlvblIoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdG9wV2hlZWxBbmltYXRpb24oKSB7XG4gICAgICAgIHdoZWVsTC5zdG9wKCk7XG4gICAgICAgIHdoZWVsUi5zdG9wKCk7XG4gICAgICAgIHRhcGVMLnN0b3AoKTtcbiAgICAgICAgdGFwZVIuc3RvcCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlY1N0b3AoKSB7XG4gICAgICAgIHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICAgIHhSZWMgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwbGF5U3RvcCgpIHtcbiAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICBwbGF5QWN0aXZlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG4gICAgICAgIGZvcndhcmQudHJhbnNmb3JtKCd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG4gICAgICAgIHN0b3BBbmltYXRpb24oKTtcbiAgICAgICAgWEZvcndhcmQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXh0VHJhY2soKSB7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgICAgfVxuXG4gICAgICAgIGF1ZGlvLnNyYyA9IGRpciArIHBsYXlsaXN0W2N1cnJlbnRUcmFja10gKyBleHQ7XG5cbiAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgfVxuXG4gICAgLy8gcGxheSBmdW5jdGlvblxuICAgIHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoYXVkaW8ucGF1c2VkKSB7XG5cbiAgICAgICAgICAgIC8vIHBsYXkgc3RhdGVcbiAgICAgICAgICAgIHBsYXlBY3RpdmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuICAgICAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG4gICAgICAgICAgICBpZiAoIXhSZWMpIHsgLy8gaXMgbm90IHJlY29yZGluZ1xuICAgICAgICAgICAgICAgIHdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblxuICAgICAgICAgICAgYXVkaW8ucGxheSgpO1xuXG4gICAgICAgICAgICAvL2F1ZGlvLnBsYXkoKTtcbiAgICAgICAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgLy8gcGF1c2Ugc3RhdGVcbiAgICAgICAgICAgIHBsYXlBY3RpdmUgPSBmYWxzZTtcblxuICAgICAgICAgICAgcGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG4gICAgICAgICAgICBwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcbiAgICAgICAgICAgIGF1ZGlvLnBhdXNlKCk7XG5cbiAgICAgICAgICAgIGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuICAgICAgICAgICAgICAgIHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gZW5kIHBsYXkgZnVuY3Rpb25cblxuICAgIC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG4gICAgYmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLy8gYnV0dG9uIGFuaW0xXG4gICAgICAgIHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgYmFja3dhcmQuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgJ3RyYW5zZm9ybSc6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlXG4gICAgICAgICAgICB9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBiYWNrd2FyZC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAndHJhbnNmb3JtJzogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25cbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgYW5pbTEoKTtcblxuICAgICAgICBpZiAoY3VycmVudFRyYWNrID4gMCkge1xuICAgICAgICAgICAgY3VycmVudFRyYWNrLS07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICBhdWRpby5zcmMgPSBkaXIgKyBwbGF5bGlzdFtjdXJyZW50VHJhY2tdICsgZXh0O1xuXG4gICAgICAgIHRpdGxlVXBkYXRlKCk7XG5cbiAgICAgICAgaWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuICAgICAgICAgICAgYXVkaW8ucGxheSgpO1xuICAgICAgICB9XG5cbiAgICB9KTtcbiAgICAvLyBlbmQgYmFja3dhcmQgZnVuY3Rpb25cblxuICAgIC8vIGZvcndhcmQgZnVuY3Rpb25cbiAgICBmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIC8vIGJ1dHRvbiBhbmltMVxuICAgICAgICB2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGZvcndhcmQuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgJ3RyYW5zZm9ybSc6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZVxuICAgICAgICAgICAgfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm9yd2FyZC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAndHJhbnNmb3JtJzogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uXG4gICAgICAgICAgICB9LCAyMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFuaW0xKCk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpIHtcbiAgICAgICAgICAgIGN1cnJlbnRUcmFjayA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50VHJhY2srKztcbiAgICAgICAgfVxuXG4gICAgICAgIGF1ZGlvLnNyYyA9IGRpciArIHBsYXlsaXN0W2N1cnJlbnRUcmFja10gKyBleHQ7XG5cbiAgICAgICAgdGl0bGVVcGRhdGUoKTtcblxuICAgICAgICBpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG4gICAgICAgICAgICBhdWRpby5wbGF5KCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG4gICAgZnVuY3Rpb24gdGl0bGVVcGRhdGUoKSB7XG4gICAgICAgIHRyYWNrdGl0bGUubm9kZS5pbm5lckhUTUwgPSBwbGF5bGlzdFtjdXJyZW50VHJhY2tdO1xuICAgIH1cblxuICAgIC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cbiAgICBmdW5jdGlvbiBfX2xvZyhlLCBkYXRhKSB7XG4gICAgICAgIGxvZ1RleHQubm9kZS5pbm5lckhUTUwgPSBcIlxcblwiICsgZSArIFwiIFwiICsgKGRhdGEgfHwgJycpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0YXJ0VXNlck1lZGlhKHN0cmVhbSkge1xuICAgICAgICB2YXIgaW5wdXQgPSBhdWRpb19jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG4gICAgICAgIF9fbG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcblxuICAgICAgICByZWNvcmRlciA9IG5ldyBSZWNvcmRlcihpbnB1dCk7XG4gICAgICAgIF9fbG9nKCdSZWFkeSEnKTtcbiAgICB9XG5cblxuICAgIC8vIHJlYyBmdW5jdGlvblxuICAgIHJlYy5jbGljayhmdW5jdGlvbihvaykge1xuXG4gICAgICAgIGlmICgheFJlYykgeyAvL2lzIG5vdCByZWNvcmRpbmdcblxuICAgICAgICAgICAgcmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuICAgICAgICAgICAgaWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG4gICAgICAgICAgICAgICAgd2hlZWxBbmltYXRpb24oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgeFJlYyA9IHRydWU7XG5cbiAgICAgICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnJlY29yZCgpO1xuXG4gICAgICAgICAgICBfX2xvZygnUmVjb3JkaW5nLi4uJyk7XG5cbiAgICAgICAgfSBlbHNlIHsgLy9zdG9wIHJlY29yZGluZ1xuXG4gICAgICAgICAgICByZWNTdG9wKCk7XG5cbiAgICAgICAgICAgIGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXG4gICAgICAgICAgICAgICAgc3RvcFdoZWVsQW5pbWF0aW9uKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlY29yZGVyICYmIHJlY29yZGVyLnN0b3AoKTtcblxuICAgICAgICAgICAgX19sb2coJ1N0b3BwZWQgcmVjLicpO1xuXG4gICAgICAgICAgICAvLyBjcmVhdGUgV0FWIGRvd25sb2FkIGxpbmsgdXNpbmcgYXVkaW8gZGF0YSBibG9iXG4gICAgICAgICAgICBjcmVhdGVEb3dubG9hZExpbmsoKTtcblxuICAgICAgICAgICAgcmVjb3JkZXIuY2xlYXIoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIC8vIGVuZCByZWMgZnVuY3Rpb25cblxuICAgIGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkTGluaygpIHtcbiAgICAgICAgcmVjb3JkZXIgJiYgcmVjb3JkZXIuZXhwb3J0V0FWKGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgICAgICAgIHZhciBhdSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG4gICAgICAgICAgICB2YXIgaGYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cbiAgICAgICAgICAgIGF1LmNvbnRyb2xzID0gdHJ1ZTtcbiAgICAgICAgICAgIGF1LnNyYyA9IHVybDtcbiAgICAgICAgICAgIGhmLmhyZWYgPSB1cmw7XG4gICAgICAgICAgICBoZi5kb3dubG9hZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSArICcud2F2JztcbiAgICAgICAgICAgIGhmLmlubmVySFRNTCA9IGhmLmRvd25sb2FkO1xuXG4gICAgICAgICAgICByZWNvcmRpbmdzbGlzdC5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWJlZ2luJywgJzxsaSBjbGFzcz1cIm1kbC1saXN0X19pdGVtXCI+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1wcmltYXJ5LWNvbnRlbnRcIiA+PGkgY2xhc3M9XCJtYXRlcmlhbC1pY29ucyBtZGwtbGlzdF9faXRlbS1pY29uXCI+bWljPC9pPicgKyBoZi5kb3dubG9hZCArICc8L3NwYW4+PHNwYW4gY2xhc3M9XCJtZGwtbGlzdF9faXRlbS1zZWNvbmRhcnktYWN0aW9uXCI+PGEgY2xhc3M9XCJtZGwtYnV0dG9uIG1kbC1qcy1idXR0b24gbWRsLWJ1dHRvbi0tYWNjZW50XCIgaHJlZj1cIicgKyB1cmwgKyAnXCJcIiBkb3dubG9hZD5Eb3dubG9hZCA8aSBjbGFzcz1cIm1hdGVyaWFsLWljb25zXCI+ZmlsZV9kb3dubG9hZDwvaT48L2E+PC9zcGFuPjwvbGk+Jyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiBpbml0KCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gd2Via2l0IHNoaW1cbiAgICAgICAgICAgIHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG4gICAgICAgICAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gKG5hdmlnYXRvci5nZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci5tc0dldFVzZXJNZWRpYSk7IC8vdGhpcyB3aWxsIHNldCBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHRvIHdoYXRldmVyIGl0IGRldGVjdHMgdG8gYmUgdGhlIHByb3BlciBwcmVmaXhlZCB2ZXJzaW9uLlxuICAgICAgICAgICAgd2luZG93LlVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTDtcblxuICAgICAgICAgICAgYXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG4gICAgICAgICAgICBfX2xvZygnQXVkaW8gY29udGV4dCBzZXQgdXAuJyk7XG4gICAgICAgICAgICAvL1x0X19sb2coJ25hdmlnYXRvci5nZXRVc2VyTWVkaWEgJyArIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID8gJ2F2YWlsYWJsZS4nIDogJ25vdCBwcmVzZW50IScpKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgYWxlcnQoJ05vIHdlYiBhdWRpbyBzdXBwb3J0IScpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7XG4gICAgICAgICAgICBhdWRpbzogdHJ1ZVxuICAgICAgICB9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgX19sb2coJ05vIGxpdmUgYXVkaW8gaW5wdXQ6ICcgKyBlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBza2V0Y2ggPSBmdW5jdGlvbihub2lzZVdhdmUpIHtcblxuICAgICAgICB2YXIgdXJsLFxuICAgICAgICAgICAgbXlDYW52YXMsXG4gICAgICAgICAgICBjb3VudGVyID0gMCxcbiAgICAgICAgICAgIHN0YXJ0aW5nQW5nbGUgPSA3LFxuICAgICAgICAgICAgZ29SaWdodCA9IHRydWUsXG4gICAgICAgICAgICBzdGFydFVwID0gdHJ1ZSxcbiAgICAgICAgICAgIG15RnJhbWVSYXRlID0gMzAsXG4gICAgICAgICAgICBydW5uaW5nID0gdHJ1ZTtcblxuICAgICAgICBub2lzZVdhdmUuc2V0dXAgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgbXlDYW52YXMgPSBub2lzZVdhdmUuY3JlYXRlQ2FudmFzKHNjcmVlbi53aWR0aCwgNTAwKTtcblxuICAgICAgICAgICAgbXlDYW52YXMucGFyZW50KCdjYXNzZXRlLXBsYXllci1jdCcpO1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYW4gQXVkaW8gaW5wdXRcbiAgICAgICAgICAgIG1pYyA9IG5ldyBwNS5BdWRpb0luKCk7XG5cbiAgICAgICAgICAgIC8vIHN0YXJ0IHRoZSBBdWRpbyBJbnB1dC5cbiAgICAgICAgICAgIG1pYy5zdGFydCgpO1xuXG4gICAgICAgICAgICAvLyBjcmVhdGUgYSBzb3VuZCByZWNvcmRlclxuICAgICAgICAgICAgcmVjb3JkZXIgPSBuZXcgcDUuU291bmRSZWNvcmRlcigpO1xuXG4gICAgICAgICAgICAvLyBjb25uZWN0IHRoZSBtaWMgdG8gdGhlIHJlY29yZGVyXG4gICAgICAgICAgICByZWNvcmRlci5zZXRJbnB1dChtaWMpO1xuXG4gICAgICAgICAgICAvLyBjcmVhdGUgYW4gZW1wdHkgc291bmQgZmlsZSB0aGF0IHdlIHdpbGwgdXNlIHRvIHBsYXliYWNrIHRoZSByZWNvcmRpbmdcbiAgICAgICAgICAgIHNvdW5kRmlsZSA9IG5ldyBwNS5Tb3VuZEZpbGUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBub2lzZVdhdmUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICB2YXIgeW9mZiA9IDAuMDtcbiAgICAgICAgICAgIC8vIEdldCB0aGUgb3ZlcmFsbCB2b2x1bWUgKGJldHdlZW4gMCBhbmQgMS4wKVxuICAgICAgICAgICAgdmFyIHZvbCA9IG1pYy5nZXRMZXZlbCgpO1xuXG4gICAgICAgICAgICBub2lzZVdhdmUuYmFja2dyb3VuZCgyNTUsIDI1NSwgMjU1KTtcbiAgICAgICAgICAgIG5vaXNlV2F2ZS5zdHJva2UoMjUsIDIwMiwgMTQ0KTtcbiAgICAgICAgICAgIG5vaXNlV2F2ZS5maWxsKDI1LCAyMDIsIDE0NCk7XG5cbiAgICAgICAgICAgIC8vIFdlIGFyZSBnb2luZyB0byBkcmF3IGEgcG9seWdvbiBvdXQgb2YgdGhlIHdhdmUgcG9pbnRzXG4gICAgICAgICAgICBub2lzZVdhdmUuYmVnaW5TaGFwZSgpO1xuXG4gICAgICAgICAgICB2YXIgeG9mZiA9IDA7IC8vIE9wdGlvbiAjMTogMkQgTm9pc2VcblxuICAgICAgICAgICAgLy8gSXRlcmF0ZSBvdmVyIGhvcml6b250YWwgcGl4ZWxzXG4gICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8PSBzY3JlZW4ud2lkdGg7IHggKz0gMTApIHtcbiAgICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgYSB5IHZhbHVlIGFjY29yZGluZyB0byBub2lzZSwgbWFwIHRvXG5cbiAgICAgICAgICAgICAgICAvL21hcCh2YWx1ZSxzdGFydDEsc3RvcDEsc3RhcnQyLHN0b3AyKVxuICAgICAgICAgICAgICAgIHZhciB5ID0gbm9pc2VXYXZlLm1hcChub2lzZVdhdmUubm9pc2UoeG9mZiwgeW9mZiksIDAsIDEsIDIwMCwgMzAwKTtcblxuICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgdmVydGV4XG4gICAgICAgICAgICAgICAgbm9pc2VXYXZlLnZlcnRleCh4LCB5KTtcbiAgICAgICAgICAgICAgICAvLyBJbmNyZW1lbnQgeCBkaW1lbnNpb24gZm9yIG5vaXNlXG4gICAgICAgICAgICAgICAgeG9mZiArPSB2b2w7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpbmNyZW1lbnQgeSBkaW1lbnNpb24gZm9yIG5vaXNlXG4gICAgICAgICAgICB5b2ZmICs9IHZvbDtcbiAgICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KTtcbiAgICAgICAgICAgIG5vaXNlV2F2ZS52ZXJ0ZXgoMCwgc2NyZWVuLmhlaWdodCk7XG4gICAgICAgICAgICBub2lzZVdhdmUuZW5kU2hhcGUobm9pc2VXYXZlLkNMT1NFKTtcbiAgICAgICAgfTtcblxuXG4gICAgfTsgLy8gdmFyIHNrZXRjaFxuXG4gICAgdmFyIG15UDUgPSBuZXcgcDUoc2tldGNoKTtcblxuICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoe1xuICAgICAgICBhdWRpbzogdHJ1ZVxuICAgIH0sIHN0YXJ0VXNlck1lZGlhLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIF9fbG9nKCdObyBsaXZlIGF1ZGlvIGlucHV0OiAnICsgZSk7XG4gICAgfSk7XG5cbn0pOyAvLyBkb2MgcmVhZHlcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==