
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
			currentTrack = 0,
			seekslider,
			seeking=false,
			audio_context,
			recorder,
			seekto;

			pauseState.attr("display", "none");

			// Audio Object
			audio.src = dir+playlist[0]+ext;

			// reel sizes
			var tapeRValue = 0;
			var tapeLValue = 90;

			tapeL.animate({rx: tapeLValue, ry: tapeLValue}, 500, mina.linear);
			tapeR.animate({rx: tapeRValue, ry: tapeRValue}, 500, mina.linear);

			seekslider = document.getElementById("seekslider");

			audio.addEventListener('ended', function() {
				this.currentTime = 0;
				this.play();
			}, false);

			audio.addEventListener("timeupdate", function(){ timeUpdate(); });
			audio.addEventListener("loadedmetadata", function(){ timeDurUpdate(); });
			audio.addEventListener("tracktitle", function(){ titleUpdate(); });

			//audio.addEventListener("ended", function(){ nextTrack(); });

			// wheel animation left
			function wheelAnimationL() {
				wheelL.animate({ transform: 'r-360,30,30'}, 2000,
					function(){
							wheelL.attr({ transform: 'rotate(0 30 30)'});
							wheelAnimationL();
						}
				);
			}
			// wheel animation right
			function wheelAnimationR() {
				wheelR.animate({ transform: 'r-360,270,30'}, 2000,
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
				forward.transform('t253.344053, ' + buttonYposition);
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

			// play function
			playPause.click(function() {

			 	if(audio.paused) {

			 		// play state

			 		playActive = true;

			 		playState.attr("display", "none");
			 		pauseState.attr("display", "block");

			 		//console.log(playActive);

					if (!xRec) { // is stopped or paused
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

			    	//console.log(playActive);

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
				};

				var anim2 = function() {
				    backward.animate({'transform' : 't85.344053, ' + buttonYposition}, 200);
				};

				anim1();

				if(currentTrack > 0 ) {

					currentTrack--;

				} else {

				    currentTrack = (playlist.length - 1);

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
				    forward.animate({'transform' : 't253.344053, ' + buttonYpositionActive}, 200, mina.linear, anim2);
				};

				var anim2 = function() {
				    forward.animate({'transform' : 't253.344053, ' + buttonYposition}, 200);
				};

				anim1();

				if(currentTrack == (playlist.length - 1)){
					currentTrack = 0;
				} else {
				    currentTrack++;
				}

				//console.log('fw - the current track is: ' + currentTrack);

				audio.src = dir+playlist[currentTrack]+ext;

				titleUpdate();

				if (playActive) { // if is playing
					audio.play();
				}
			});
			// end forward function

			function titleUpdate(){
				tracktitle.node.innerHTML = playlist[currentTrack];
			}

			// ******** Recorder ******* //
			function __log(e, data) {
				logText.node.innerHTML = "\n" + e + " " + (data || '');
			}

			function startUserMedia(stream) {
				var input = audio_context.createMediaStreamSource(stream);
				__log('Media stream created.');
				// Uncomment if you want the audio to feedback directly
				//input.connect(audio_context.destination);
				//__log('Input connected to audio context destination.');

				recorder = new Recorder(input);
				__log('Recorder initialised.');
			}

			// rec function
			rec.click(function() {

				if (!xRec){ //start recording

					rec.transform('t0.344053, ' + buttonYpositionActive);

					// wheels events

					if (!playActive) { // is stopped or paused
						wheelAnimation();
					}

					xRec = true;

					recorder && recorder.record();

					__log('Recording...');

				}  else { //stop recording
					recStop();

					if (!playActive) { // is stopped or paused

						stopWheelAnimation();
					}

					recorder && recorder.stop();

					__log('Stopped recording.');

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
					//li.appendChild(au); // I don't want the default browser player.
					li.appendChild(hf); // i just want the link of the recorded audio to download
					recordingslist.appendChild(li);
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
					__log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
				} catch (e) {
					alert('No web audio support in this browser!');
				}

				navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
					__log('No live audio input: ' + e);
				});
			};

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Recorder = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

module.exports = require("./recorder").Recorder;

},{"./recorder":2}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Recorder = undefined;

var _inlineWorker = require('inline-worker');

var _inlineWorker2 = _interopRequireDefault(_inlineWorker);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Recorder = exports.Recorder = (function () {
    function Recorder(source, cfg) {
        var _this = this;

        _classCallCheck(this, Recorder);

        this.config = {
            bufferLen: 4096,
            numChannels: 2,
            mimeType: 'audio/wav'
        };
        this.recording = false;
        this.callbacks = {
            getBuffer: [],
            exportWAV: []
        };

        Object.assign(this.config, cfg);
        this.context = source.context;
        this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, this.config.bufferLen, this.config.numChannels, this.config.numChannels);

        this.node.onaudioprocess = function (e) {
            if (!_this.recording) return;

            var buffer = [];
            for (var channel = 0; channel < _this.config.numChannels; channel++) {
                buffer.push(e.inputBuffer.getChannelData(channel));
            }
            _this.worker.postMessage({
                command: 'record',
                buffer: buffer
            });
        };

        source.connect(this.node);
        this.node.connect(this.context.destination); //this should not be necessary

        var self = {};
        this.worker = new _inlineWorker2.default(function () {
            var recLength = 0,
                recBuffers = [],
                sampleRate = undefined,
                numChannels = undefined;

            self.onmessage = function (e) {
                switch (e.data.command) {
                    case 'init':
                        init(e.data.config);
                        break;
                    case 'record':
                        record(e.data.buffer);
                        break;
                    case 'exportWAV':
                        exportWAV(e.data.type);
                        break;
                    case 'getBuffer':
                        getBuffer();
                        break;
                    case 'clear':
                        clear();
                        break;
                }
            };

            function init(config) {
                sampleRate = config.sampleRate;
                numChannels = config.numChannels;
                initBuffers();
            }

            function record(inputBuffer) {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel].push(inputBuffer[channel]);
                }
                recLength += inputBuffer[0].length;
            }

            function exportWAV(type) {
                var buffers = [];
                for (var channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                var interleaved = undefined;
                if (numChannels === 2) {
                    interleaved = interleave(buffers[0], buffers[1]);
                } else {
                    interleaved = buffers[0];
                }
                var dataview = encodeWAV(interleaved);
                var audioBlob = new Blob([dataview], { type: type });

                self.postMessage({ command: 'exportWAV', data: audioBlob });
            }

            function getBuffer() {
                var buffers = [];
                for (var channel = 0; channel < numChannels; channel++) {
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                }
                self.postMessage({ command: 'getBuffer', data: buffers });
            }

            function clear() {
                recLength = 0;
                recBuffers = [];
                initBuffers();
            }

            function initBuffers() {
                for (var channel = 0; channel < numChannels; channel++) {
                    recBuffers[channel] = [];
                }
            }

            function mergeBuffers(recBuffers, recLength) {
                var result = new Float32Array(recLength);
                var offset = 0;
                for (var i = 0; i < recBuffers.length; i++) {
                    result.set(recBuffers[i], offset);
                    offset += recBuffers[i].length;
                }
                return result;
            }

            function interleave(inputL, inputR) {
                var length = inputL.length + inputR.length;
                var result = new Float32Array(length);

                var index = 0,
                    inputIndex = 0;

                while (index < length) {
                    result[index++] = inputL[inputIndex];
                    result[index++] = inputR[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function floatTo16BitPCM(output, offset, input) {
                for (var i = 0; i < input.length; i++, offset += 2) {
                    var s = Math.max(-1, Math.min(1, input[i]));
                    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
            }

            function writeString(view, offset, string) {
                for (var i = 0; i < string.length; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            function encodeWAV(samples) {
                var buffer = new ArrayBuffer(44 + samples.length * 2);
                var view = new DataView(buffer);

                /* RIFF identifier */
                writeString(view, 0, 'RIFF');
                /* RIFF chunk length */
                view.setUint32(4, 36 + samples.length * 2, true);
                /* RIFF type */
                writeString(view, 8, 'WAVE');
                /* format chunk identifier */
                writeString(view, 12, 'fmt ');
                /* format chunk length */
                view.setUint32(16, 16, true);
                /* sample format (raw) */
                view.setUint16(20, 1, true);
                /* channel count */
                view.setUint16(22, numChannels, true);
                /* sample rate */
                view.setUint32(24, sampleRate, true);
                /* byte rate (sample rate * block align) */
                view.setUint32(28, sampleRate * 4, true);
                /* block align (channel count * bytes per sample) */
                view.setUint16(32, numChannels * 2, true);
                /* bits per sample */
                view.setUint16(34, 16, true);
                /* data chunk identifier */
                writeString(view, 36, 'data');
                /* data chunk length */
                view.setUint32(40, samples.length * 2, true);

                floatTo16BitPCM(view, 44, samples);

                return view;
            }
        }, self);

        this.worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.context.sampleRate,
                numChannels: this.config.numChannels
            }
        });

        this.worker.onmessage = function (e) {
            var cb = _this.callbacks[e.data.command].pop();
            if (typeof cb == 'function') {
                cb(e.data.data);
            }
        };
    }

    _createClass(Recorder, [{
        key: 'record',
        value: function record() {
            this.recording = true;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.recording = false;
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.worker.postMessage({ command: 'clear' });
        }
    }, {
        key: 'getBuffer',
        value: function getBuffer(cb) {
            cb = cb || this.config.callback;
            if (!cb) throw new Error('Callback not set');

            this.callbacks.getBuffer.push(cb);

            this.worker.postMessage({ command: 'getBuffer' });
        }
    }, {
        key: 'exportWAV',
        value: function exportWAV(cb, mimeType) {
            mimeType = mimeType || this.config.mimeType;
            cb = cb || this.config.callback;
            if (!cb) throw new Error('Callback not set');

            this.callbacks.exportWAV.push(cb);

            this.worker.postMessage({
                command: 'exportWAV',
                type: mimeType
            });
        }
    }], [{
        key: 'forceDownload',
        value: function forceDownload(blob, filename) {
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            var link = window.document.createElement('a');
            link.href = url;
            link.download = filename || 'output.wav';
            var click = document.createEvent("Event");
            click.initEvent("click", true, true);
            link.dispatchEvent(click);
        }
    }]);

    return Recorder;
})();

exports.default = Recorder;

},{"inline-worker":3}],3:[function(require,module,exports){
"use strict";

module.exports = require("./inline-worker");
},{"./inline-worker":4}],4:[function(require,module,exports){
(function (global){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

var InlineWorker = (function () {
  function InlineWorker(func, self) {
    var _this = this;

    _classCallCheck(this, InlineWorker);

    if (WORKER_ENABLED) {
      var functionBody = func.toString().trim().match(/^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/)[1];
      var url = global.URL.createObjectURL(new global.Blob([functionBody], { type: "text/javascript" }));

      return new global.Worker(url);
    }

    this.self = self;
    this.self.postMessage = function (data) {
      setTimeout(function () {
        _this.onmessage({ data: data });
      }, 0);
    };

    setTimeout(function () {
      func.call(self);
    }, 0);
  }

  _createClass(InlineWorker, {
    postMessage: {
      value: function postMessage(data) {
        var _this = this;

        setTimeout(function () {
          _this.self.onmessage({ data: data });
        }, 0);
      }
    }
  });

  return InlineWorker;
})();

module.exports = InlineWorker;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJyZWNvcmRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxuXHRcdHZhciByZWMgPSBTbmFwKCcjcmVjJyksXG5cdFx0XHR4UmVjID0gZmFsc2UsXG5cdFx0XHRiYWNrd2FyZCA9IFNuYXAoJyNiYWNrd2FyZCcpLFxuXHRcdFx0cGxheVBhdXNlID0gU25hcCgnI3BsYXlQYXVzZScpLFxuXHRcdFx0cGxheVN0YXRlID0gU25hcCgnI3BsYXlTdGF0ZScpLFxuXHRcdFx0cGF1c2VTdGF0ZSA9IFNuYXAoJyNwYXVzZVN0YXRlJyksXG5cdFx0XHRwbGF5QWN0aXZlID0gZmFsc2UsXG5cdFx0XHRmb3J3YXJkID0gU25hcCgnI2ZvcndhcmQnKSxcblx0XHRcdHdoZWVsTCA9IFNuYXAoJyN3aGVlbC1sJyksXG5cdFx0XHR3aGVlbFIgPSBTbmFwKCcjd2hlZWwtcicpLFxuXHRcdFx0dGFwZSA9IFNuYXAoJyN0YXBlJyksXG5cdFx0XHR0YXBlTCA9IFNuYXAoJyN0YXBlTCcpLFxuXHRcdFx0dGFwZVIgPSBTbmFwKCcjdGFwZVInKSxcblx0XHRcdGxvZ1RleHQgPSBTbmFwKCcjcmVjb3JkaW5nVGV4dCB0c3BhbicpLFxuXHRcdFx0dHJhY2t0aXRsZSA9IFNuYXAoJyN0cmFja3RpdGxlIHRzcGFuJyksXG5cdFx0XHRidXR0b25ZcG9zaXRpb24gPSAwLjY3OTQ3Nyxcblx0XHRcdGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSA9IDguNjc5NDc3LFxuXHRcdFx0YmJveEwgPSB0YXBlTC5nZXRCQm94KCksXG5cdFx0XHRiYm94UiA9IHRhcGVSLmdldEJCb3goKSxcblx0XHRcdGF1ZGlvID0gbmV3IEF1ZGlvKCksXG5cdFx0XHRkdXJhdGlvbiA9IGF1ZGlvLmR1cmF0aW9uLFxuXHRcdFx0cGxheWxpc3QgPSBbJ2RpcnR5X3NvdXRoX2xvb3BfODVicG0nLCAncG9wX2hpcGhvcF9sb29wXzEwMGJwbSddLFxuXHRcdFx0ZGlyID0gXCJhdWRpby9cIixcblx0XHRcdGV4dCA9IFwiLm1wM1wiLFxuXHRcdFx0Y3VycmVudFRyYWNrID0gMCxcblx0XHRcdHNlZWtzbGlkZXIsXG5cdFx0XHRzZWVraW5nPWZhbHNlLFxuXHRcdFx0YXVkaW9fY29udGV4dCxcblx0XHRcdHJlY29yZGVyLFxuXHRcdFx0c2Vla3RvO1xuXG5cdFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblxuXHRcdFx0Ly8gQXVkaW8gT2JqZWN0XG5cdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbMF0rZXh0O1xuXG5cdFx0XHQvLyByZWVsIHNpemVzXG5cdFx0XHR2YXIgdGFwZVJWYWx1ZSA9IDA7XG5cdFx0XHR2YXIgdGFwZUxWYWx1ZSA9IDkwO1xuXG5cdFx0XHR0YXBlTC5hbmltYXRlKHtyeDogdGFwZUxWYWx1ZSwgcnk6IHRhcGVMVmFsdWV9LCA1MDAsIG1pbmEubGluZWFyKTtcblx0XHRcdHRhcGVSLmFuaW1hdGUoe3J4OiB0YXBlUlZhbHVlLCByeTogdGFwZVJWYWx1ZX0sIDUwMCwgbWluYS5saW5lYXIpO1xuXG5cdFx0XHRzZWVrc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWVrc2xpZGVyXCIpO1xuXG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRUaW1lID0gMDtcblx0XHRcdFx0dGhpcy5wbGF5KCk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIGZ1bmN0aW9uKCl7IHRpbWVVcGRhdGUoKTsgfSk7XG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkbWV0YWRhdGFcIiwgZnVuY3Rpb24oKXsgdGltZUR1clVwZGF0ZSgpOyB9KTtcblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7IHRpdGxlVXBkYXRlKCk7IH0pO1xuXG5cdFx0XHQvL2F1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpeyBuZXh0VHJhY2soKTsgfSk7XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpO1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICBcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gcGxheVN0b3AoKSB7XG5cdFx0XHQgIFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcblx0XHRcdFx0Zm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHRYRm9yd2FyZCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXG5cdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblxuXHRcdFx0fVxuXG5cdFx0XHQvLyBwbGF5IGZ1bmN0aW9uXG5cdFx0XHRwbGF5UGF1c2UuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdCBcdGlmKGF1ZGlvLnBhdXNlZCkge1xuXG5cdFx0XHQgXHRcdC8vIHBsYXkgc3RhdGVcblxuXHRcdFx0IFx0XHRwbGF5QWN0aXZlID0gdHJ1ZTtcblxuXHRcdFx0IFx0XHRwbGF5U3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRcdFx0IFx0XHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cblx0XHRcdCBcdFx0Ly9jb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuXHRcdFx0XHRcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXHRcdFx0XHRcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXG5cdFx0XHRcdCAgICAvL2F1ZGlvLnBsYXkoKTtcblx0XHRcdFx0ICAgIHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdCAgICB9IGVsc2Uge1xuXG5cdFx0XHQgICAgXHQvLyBwYXVzZSBzdGF0ZVxuXG5cdFx0XHQgICAgXHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cblx0XHRcdCAgICBcdHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRcdFx0ICAgIFx0cGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cblx0XHRcdCAgICBcdC8vY29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cblx0XHRcdFx0ICAgIGF1ZGlvLnBhdXNlKCk7XG5cblx0XHRcdFx0ICBcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHQgIFx0XHRzdG9wV2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0ICBcdH1cblx0XHRcdFx0ICBcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgICB9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cblx0XHRcdC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHRiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciBhbmltMiA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbn0sIDIwMCk7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0YW5pbTEoKTtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPiAwICkge1xuXG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrLS07XG5cblx0XHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrID0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXHRcdFx0XHRpZiAocGxheUFjdGl2ZSkgeyAvLyBpZiBpcyBwbGF5aW5nXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGJhY2t3YXJkIGZ1bmN0aW9uXG5cblx0XHRcdC8vIGZvcndhcmQgZnVuY3Rpb25cblx0XHRcdGZvcndhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgZm9yd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG5cdFx0XHRmdW5jdGlvbiB0aXRsZVVwZGF0ZSgpe1xuXHRcdFx0XHR0cmFja3RpdGxlLm5vZGUuaW5uZXJIVE1MID0gcGxheWxpc3RbY3VycmVudFRyYWNrXTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gKioqKioqKiogUmVjb3JkZXIgKioqKioqKiAvL1xuXHRcdFx0ZnVuY3Rpb24gX19sb2coZSwgZGF0YSkge1xuXHRcdFx0XHRsb2dUZXh0Lm5vZGUuaW5uZXJIVE1MID0gXCJcXG5cIiArIGUgKyBcIiBcIiArIChkYXRhIHx8ICcnKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gc3RhcnRVc2VyTWVkaWEoc3RyZWFtKSB7XG5cdFx0XHRcdHZhciBpbnB1dCA9IGF1ZGlvX2NvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2Uoc3RyZWFtKTtcblx0XHRcdFx0X19sb2coJ01lZGlhIHN0cmVhbSBjcmVhdGVkLicpO1xuXHRcdFx0XHQvLyBVbmNvbW1lbnQgaWYgeW91IHdhbnQgdGhlIGF1ZGlvIHRvIGZlZWRiYWNrIGRpcmVjdGx5XG5cdFx0XHRcdC8vaW5wdXQuY29ubmVjdChhdWRpb19jb250ZXh0LmRlc3RpbmF0aW9uKTtcblx0XHRcdFx0Ly9fX2xvZygnSW5wdXQgY29ubmVjdGVkIHRvIGF1ZGlvIGNvbnRleHQgZGVzdGluYXRpb24uJyk7XG5cblx0XHRcdFx0cmVjb3JkZXIgPSBuZXcgUmVjb3JkZXIoaW5wdXQpO1xuXHRcdFx0XHRfX2xvZygnUmVjb3JkZXIgaW5pdGlhbGlzZWQuJyk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIHJlYyBmdW5jdGlvblxuXHRcdFx0cmVjLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdGlmICgheFJlYyl7IC8vc3RhcnQgcmVjb3JkaW5nXG5cblx0XHRcdFx0XHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmUpO1xuXG5cdFx0XHRcdFx0Ly8gd2hlZWxzIGV2ZW50c1xuXG5cdFx0XHRcdFx0aWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHhSZWMgPSB0cnVlO1xuXG5cdFx0XHRcdFx0cmVjb3JkZXIgJiYgcmVjb3JkZXIucmVjb3JkKCk7XG5cblx0XHRcdFx0XHRfX2xvZygnUmVjb3JkaW5nLi4uJyk7XG5cblx0XHRcdFx0fSAgZWxzZSB7IC8vc3RvcCByZWNvcmRpbmdcblx0XHRcdFx0XHRyZWNTdG9wKCk7XG5cblx0XHRcdFx0XHRpZiAoIXBsYXlBY3RpdmUpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblxuXHRcdFx0XHRcdFx0c3RvcFdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmVjb3JkZXIgJiYgcmVjb3JkZXIuc3RvcCgpO1xuXG5cdFx0XHRcdFx0X19sb2coJ1N0b3BwZWQgcmVjb3JkaW5nLicpO1xuXG5cdFx0XHRcdFx0Ly8gY3JlYXRlIFdBViBkb3dubG9hZCBsaW5rIHVzaW5nIGF1ZGlvIGRhdGEgYmxvYlxuXHRcdFx0XHRcdGNyZWF0ZURvd25sb2FkTGluaygpO1xuXG5cdFx0XHRcdFx0cmVjb3JkZXIuY2xlYXIoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdGZ1bmN0aW9uIGNyZWF0ZURvd25sb2FkTGluaygpIHtcblx0XHRcdFx0cmVjb3JkZXIgJiYgcmVjb3JkZXIuZXhwb3J0V0FWKGZ1bmN0aW9uKGJsb2IpIHtcblx0XHRcdFx0XHR2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcblx0XHRcdFx0XHR2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuXHRcdFx0XHRcdHZhciBhdSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2F1ZGlvJyk7XG5cdFx0XHRcdFx0dmFyIGhmID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuXG5cdFx0XHRcdFx0YXUuY29udHJvbHMgPSB0cnVlO1xuXHRcdFx0XHRcdGF1LnNyYyA9IHVybDtcblx0XHRcdFx0XHRoZi5ocmVmID0gdXJsO1xuXHRcdFx0XHRcdGhmLmRvd25sb2FkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpICsgJy53YXYnO1xuXHRcdFx0XHRcdGhmLmlubmVySFRNTCA9IGhmLmRvd25sb2FkO1xuXHRcdFx0XHRcdC8vbGkuYXBwZW5kQ2hpbGQoYXUpOyAvLyBJIGRvbid0IHdhbnQgdGhlIGRlZmF1bHQgYnJvd3NlciBwbGF5ZXIuXG5cdFx0XHRcdFx0bGkuYXBwZW5kQ2hpbGQoaGYpOyAvLyBpIGp1c3Qgd2FudCB0aGUgbGluayBvZiB0aGUgcmVjb3JkZWQgYXVkaW8gdG8gZG93bmxvYWRcblx0XHRcdFx0XHRyZWNvcmRpbmdzbGlzdC5hcHBlbmRDaGlsZChsaSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR3aW5kb3cub25sb2FkID0gZnVuY3Rpb24gaW5pdCgpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHQvLyB3ZWJraXQgc2hpbVxuXHRcdFx0XHRcdHdpbmRvdy5BdWRpb0NvbnRleHQgPSB3aW5kb3cuQXVkaW9Db250ZXh0IHx8IHdpbmRvdy53ZWJraXRBdWRpb0NvbnRleHQ7XG5cdFx0XHRcdFx0bmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhIHx8IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3IubXNHZXRVc2VyTWVkaWEpOyAvL3RoaXMgd2lsbCBzZXQgbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB0byB3aGF0ZXZlciBpdCBkZXRlY3RzIHRvIGJlIHRoZSBwcm9wZXIgcHJlZml4ZWQgdmVyc2lvbi5cblx0XHRcdFx0XHR3aW5kb3cuVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xuXG5cdFx0XHRcdFx0YXVkaW9fY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQ7XG5cdFx0XHRcdFx0X19sb2coJ0F1ZGlvIGNvbnRleHQgc2V0IHVwLicpO1xuXHRcdFx0XHRcdF9fbG9nKCduYXZpZ2F0b3IuZ2V0VXNlck1lZGlhICcgKyAobmF2aWdhdG9yLmdldFVzZXJNZWRpYSA/ICdhdmFpbGFibGUuJyA6ICdub3QgcHJlc2VudCEnKSk7XG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0XHRhbGVydCgnTm8gd2ViIGF1ZGlvIHN1cHBvcnQgaW4gdGhpcyBicm93c2VyIScpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bmF2aWdhdG9yLmdldFVzZXJNZWRpYSh7YXVkaW86IHRydWV9LCBzdGFydFVzZXJNZWRpYSwgZnVuY3Rpb24oZSkge1xuXHRcdFx0XHRcdF9fbG9nKCdObyBsaXZlIGF1ZGlvIGlucHV0OiAnICsgZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fTtcbiIsIihmdW5jdGlvbihmKXtpZih0eXBlb2YgZXhwb3J0cz09PVwib2JqZWN0XCImJnR5cGVvZiBtb2R1bGUhPT1cInVuZGVmaW5lZFwiKXttb2R1bGUuZXhwb3J0cz1mKCl9ZWxzZSBpZih0eXBlb2YgZGVmaW5lPT09XCJmdW5jdGlvblwiJiZkZWZpbmUuYW1kKXtkZWZpbmUoW10sZil9ZWxzZXt2YXIgZztpZih0eXBlb2Ygd2luZG93IT09XCJ1bmRlZmluZWRcIil7Zz13aW5kb3d9ZWxzZSBpZih0eXBlb2YgZ2xvYmFsIT09XCJ1bmRlZmluZWRcIil7Zz1nbG9iYWx9ZWxzZSBpZih0eXBlb2Ygc2VsZiE9PVwidW5kZWZpbmVkXCIpe2c9c2VsZn1lbHNle2c9dGhpc31nLlJlY29yZGVyID0gZigpfX0pKGZ1bmN0aW9uKCl7dmFyIGRlZmluZSxtb2R1bGUsZXhwb3J0cztyZXR1cm4gKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkoezE6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vcmVjb3JkZXJcIikuUmVjb3JkZXI7XG5cbn0se1wiLi9yZWNvcmRlclwiOjJ9XSwyOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbid1c2Ugc3RyaWN0JztcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07ZGVzY3JpcHRvci5lbnVtZXJhYmxlID0gZGVzY3JpcHRvci5lbnVtZXJhYmxlIHx8IGZhbHNlO2Rlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlO09iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGRlc2NyaXB0b3Iua2V5LCBkZXNjcmlwdG9yKTtcbiAgICAgICAgfVxuICAgIH1yZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICAgICAgICBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpO2lmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpO3JldHVybiBDb25zdHJ1Y3RvcjtcbiAgICB9O1xufSkoKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gICAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5SZWNvcmRlciA9IHVuZGVmaW5lZDtcblxudmFyIF9pbmxpbmVXb3JrZXIgPSByZXF1aXJlKCdpbmxpbmUtd29ya2VyJyk7XG5cbnZhciBfaW5saW5lV29ya2VyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2lubGluZVdvcmtlcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7XG4gICAgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07XG59XG5cbmZ1bmN0aW9uIF9jbGFzc0NhbGxDaGVjayhpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHtcbiAgICBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpO1xuICAgIH1cbn1cblxudmFyIFJlY29yZGVyID0gZXhwb3J0cy5SZWNvcmRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVjb3JkZXIoc291cmNlLCBjZmcpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgUmVjb3JkZXIpO1xuXG4gICAgICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgICAgICAgYnVmZmVyTGVuOiA0MDk2LFxuICAgICAgICAgICAgbnVtQ2hhbm5lbHM6IDIsXG4gICAgICAgICAgICBtaW1lVHlwZTogJ2F1ZGlvL3dhdidcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MgPSB7XG4gICAgICAgICAgICBnZXRCdWZmZXI6IFtdLFxuICAgICAgICAgICAgZXhwb3J0V0FWOiBbXVxuICAgICAgICB9O1xuXG4gICAgICAgIE9iamVjdC5hc3NpZ24odGhpcy5jb25maWcsIGNmZyk7XG4gICAgICAgIHRoaXMuY29udGV4dCA9IHNvdXJjZS5jb250ZXh0O1xuICAgICAgICB0aGlzLm5vZGUgPSAodGhpcy5jb250ZXh0LmNyZWF0ZVNjcmlwdFByb2Nlc3NvciB8fCB0aGlzLmNvbnRleHQuY3JlYXRlSmF2YVNjcmlwdE5vZGUpLmNhbGwodGhpcy5jb250ZXh0LCB0aGlzLmNvbmZpZy5idWZmZXJMZW4sIHRoaXMuY29uZmlnLm51bUNoYW5uZWxzLCB0aGlzLmNvbmZpZy5udW1DaGFubmVscyk7XG5cbiAgICAgICAgdGhpcy5ub2RlLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGlmICghX3RoaXMucmVjb3JkaW5nKSByZXR1cm47XG5cbiAgICAgICAgICAgIHZhciBidWZmZXIgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgX3RoaXMuY29uZmlnLm51bUNoYW5uZWxzOyBjaGFubmVsKyspIHtcbiAgICAgICAgICAgICAgICBidWZmZXIucHVzaChlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKGNoYW5uZWwpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF90aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgY29tbWFuZDogJ3JlY29yZCcsXG4gICAgICAgICAgICAgICAgYnVmZmVyOiBidWZmZXJcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNvdXJjZS5jb25uZWN0KHRoaXMubm9kZSk7XG4gICAgICAgIHRoaXMubm9kZS5jb25uZWN0KHRoaXMuY29udGV4dC5kZXN0aW5hdGlvbik7IC8vdGhpcyBzaG91bGQgbm90IGJlIG5lY2Vzc2FyeVxuXG4gICAgICAgIHZhciBzZWxmID0ge307XG4gICAgICAgIHRoaXMud29ya2VyID0gbmV3IF9pbmxpbmVXb3JrZXIyLmRlZmF1bHQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlY0xlbmd0aCA9IDAsXG4gICAgICAgICAgICAgICAgcmVjQnVmZmVycyA9IFtdLFxuICAgICAgICAgICAgICAgIHNhbXBsZVJhdGUgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgbnVtQ2hhbm5lbHMgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIHNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGUuZGF0YS5jb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2luaXQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdChlLmRhdGEuY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdyZWNvcmQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3JkKGUuZGF0YS5idWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2V4cG9ydFdBVic6XG4gICAgICAgICAgICAgICAgICAgICAgICBleHBvcnRXQVYoZS5kYXRhLnR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2dldEJ1ZmZlcic6XG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRCdWZmZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdjbGVhcic6XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZnVuY3Rpb24gaW5pdChjb25maWcpIHtcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlID0gY29uZmlnLnNhbXBsZVJhdGU7XG4gICAgICAgICAgICAgICAgbnVtQ2hhbm5lbHMgPSBjb25maWcubnVtQ2hhbm5lbHM7XG4gICAgICAgICAgICAgICAgaW5pdEJ1ZmZlcnMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVjb3JkKGlucHV0QnVmZmVyKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCBudW1DaGFubmVsczsgY2hhbm5lbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY0J1ZmZlcnNbY2hhbm5lbF0ucHVzaChpbnB1dEJ1ZmZlcltjaGFubmVsXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlY0xlbmd0aCArPSBpbnB1dEJ1ZmZlclswXS5sZW5ndGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGV4cG9ydFdBVih0eXBlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjaGFubmVsID0gMDsgY2hhbm5lbCA8IG51bUNoYW5uZWxzOyBjaGFubmVsKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVycy5wdXNoKG1lcmdlQnVmZmVycyhyZWNCdWZmZXJzW2NoYW5uZWxdLCByZWNMZW5ndGgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGludGVybGVhdmVkID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIGlmIChudW1DaGFubmVscyA9PT0gMikge1xuICAgICAgICAgICAgICAgICAgICBpbnRlcmxlYXZlZCA9IGludGVybGVhdmUoYnVmZmVyc1swXSwgYnVmZmVyc1sxXSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJsZWF2ZWQgPSBidWZmZXJzWzBdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZGF0YXZpZXcgPSBlbmNvZGVXQVYoaW50ZXJsZWF2ZWQpO1xuICAgICAgICAgICAgICAgIHZhciBhdWRpb0Jsb2IgPSBuZXcgQmxvYihbZGF0YXZpZXddLCB7IHR5cGU6IHR5cGUgfSk7XG5cbiAgICAgICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgY29tbWFuZDogJ2V4cG9ydFdBVicsIGRhdGE6IGF1ZGlvQmxvYiB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZ2V0QnVmZmVyKCkge1xuICAgICAgICAgICAgICAgIHZhciBidWZmZXJzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCBudW1DaGFubmVsczsgY2hhbm5lbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcnMucHVzaChtZXJnZUJ1ZmZlcnMocmVjQnVmZmVyc1tjaGFubmVsXSwgcmVjTGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBjb21tYW5kOiAnZ2V0QnVmZmVyJywgZGF0YTogYnVmZmVycyB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgICAgICAgICAgICAgcmVjTGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICByZWNCdWZmZXJzID0gW107XG4gICAgICAgICAgICAgICAgaW5pdEJ1ZmZlcnMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaW5pdEJ1ZmZlcnMoKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCBudW1DaGFubmVsczsgY2hhbm5lbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY0J1ZmZlcnNbY2hhbm5lbF0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG1lcmdlQnVmZmVycyhyZWNCdWZmZXJzLCByZWNMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0MzJBcnJheShyZWNMZW5ndGgpO1xuICAgICAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVjQnVmZmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuc2V0KHJlY0J1ZmZlcnNbaV0sIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSByZWNCdWZmZXJzW2ldLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gaW50ZXJsZWF2ZShpbnB1dEwsIGlucHV0Uikge1xuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBpbnB1dEwubGVuZ3RoICsgaW5wdXRSLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0MzJBcnJheShsZW5ndGgpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRJbmRleCA9IDA7XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAoaW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2luZGV4KytdID0gaW5wdXRMW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaW5kZXgrK10gPSBpbnB1dFJbaW5wdXRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlucHV0SW5kZXgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZmxvYXRUbzE2Qml0UENNKG91dHB1dCwgb2Zmc2V0LCBpbnB1dCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5wdXQubGVuZ3RoOyBpKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzID0gTWF0aC5tYXgoLTEsIE1hdGgubWluKDEsIGlucHV0W2ldKSk7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dC5zZXRJbnQxNihvZmZzZXQsIHMgPCAwID8gcyAqIDB4ODAwMCA6IHMgKiAweDdGRkYsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVTdHJpbmcodmlldywgb2Zmc2V0LCBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCArIGksIHN0cmluZy5jaGFyQ29kZUF0KGkpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGVuY29kZVdBVihzYW1wbGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcig0NCArIHNhbXBsZXMubGVuZ3RoICogMik7XG4gICAgICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblxuICAgICAgICAgICAgICAgIC8qIFJJRkYgaWRlbnRpZmllciAqL1xuICAgICAgICAgICAgICAgIHdyaXRlU3RyaW5nKHZpZXcsIDAsICdSSUZGJyk7XG4gICAgICAgICAgICAgICAgLyogUklGRiBjaHVuayBsZW5ndGggKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMig0LCAzNiArIHNhbXBsZXMubGVuZ3RoICogMiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogUklGRiB0eXBlICovXG4gICAgICAgICAgICAgICAgd3JpdGVTdHJpbmcodmlldywgOCwgJ1dBVkUnKTtcbiAgICAgICAgICAgICAgICAvKiBmb3JtYXQgY2h1bmsgaWRlbnRpZmllciAqL1xuICAgICAgICAgICAgICAgIHdyaXRlU3RyaW5nKHZpZXcsIDEyLCAnZm10ICcpO1xuICAgICAgICAgICAgICAgIC8qIGZvcm1hdCBjaHVuayBsZW5ndGggKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMigxNiwgMTYsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIHNhbXBsZSBmb3JtYXQgKHJhdykgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigyMCwgMSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogY2hhbm5lbCBjb3VudCAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDIyLCBudW1DaGFubmVscywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogc2FtcGxlIHJhdGUgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMigyNCwgc2FtcGxlUmF0ZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogYnl0ZSByYXRlIChzYW1wbGUgcmF0ZSAqIGJsb2NrIGFsaWduKSAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKDI4LCBzYW1wbGVSYXRlICogNCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogYmxvY2sgYWxpZ24gKGNoYW5uZWwgY291bnQgKiBieXRlcyBwZXIgc2FtcGxlKSAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDMyLCBudW1DaGFubmVscyAqIDIsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGJpdHMgcGVyIHNhbXBsZSAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDM0LCAxNiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogZGF0YSBjaHVuayBpZGVudGlmaWVyICovXG4gICAgICAgICAgICAgICAgd3JpdGVTdHJpbmcodmlldywgMzYsICdkYXRhJyk7XG4gICAgICAgICAgICAgICAgLyogZGF0YSBjaHVuayBsZW5ndGggKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMig0MCwgc2FtcGxlcy5sZW5ndGggKiAyLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIGZsb2F0VG8xNkJpdFBDTSh2aWV3LCA0NCwgc2FtcGxlcyk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdmlldztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgc2VsZik7XG5cbiAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgY29tbWFuZDogJ2luaXQnLFxuICAgICAgICAgICAgY29uZmlnOiB7XG4gICAgICAgICAgICAgICAgc2FtcGxlUmF0ZTogdGhpcy5jb250ZXh0LnNhbXBsZVJhdGUsXG4gICAgICAgICAgICAgICAgbnVtQ2hhbm5lbHM6IHRoaXMuY29uZmlnLm51bUNoYW5uZWxzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMud29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICB2YXIgY2IgPSBfdGhpcy5jYWxsYmFja3NbZS5kYXRhLmNvbW1hbmRdLnBvcCgpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjYiA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY2IoZS5kYXRhLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9jcmVhdGVDbGFzcyhSZWNvcmRlciwgW3tcbiAgICAgICAga2V5OiAncmVjb3JkJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHJlY29yZCgpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3JkaW5nID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnc3RvcCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnY2xlYXInLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgICAgICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7IGNvbW1hbmQ6ICdjbGVhcicgfSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2dldEJ1ZmZlcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRCdWZmZXIoY2IpIHtcbiAgICAgICAgICAgIGNiID0gY2IgfHwgdGhpcy5jb25maWcuY2FsbGJhY2s7XG4gICAgICAgICAgICBpZiAoIWNiKSB0aHJvdyBuZXcgRXJyb3IoJ0NhbGxiYWNrIG5vdCBzZXQnKTtcblxuICAgICAgICAgICAgdGhpcy5jYWxsYmFja3MuZ2V0QnVmZmVyLnB1c2goY2IpO1xuXG4gICAgICAgICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7IGNvbW1hbmQ6ICdnZXRCdWZmZXInIH0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdleHBvcnRXQVYnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZXhwb3J0V0FWKGNiLCBtaW1lVHlwZSkge1xuICAgICAgICAgICAgbWltZVR5cGUgPSBtaW1lVHlwZSB8fCB0aGlzLmNvbmZpZy5taW1lVHlwZTtcbiAgICAgICAgICAgIGNiID0gY2IgfHwgdGhpcy5jb25maWcuY2FsbGJhY2s7XG4gICAgICAgICAgICBpZiAoIWNiKSB0aHJvdyBuZXcgRXJyb3IoJ0NhbGxiYWNrIG5vdCBzZXQnKTtcblxuICAgICAgICAgICAgdGhpcy5jYWxsYmFja3MuZXhwb3J0V0FWLnB1c2goY2IpO1xuXG4gICAgICAgICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgY29tbWFuZDogJ2V4cG9ydFdBVicsXG4gICAgICAgICAgICAgICAgdHlwZTogbWltZVR5cGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfV0sIFt7XG4gICAgICAgIGtleTogJ2ZvcmNlRG93bmxvYWQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZm9yY2VEb3dubG9hZChibG9iLCBmaWxlbmFtZSkge1xuICAgICAgICAgICAgdmFyIHVybCA9ICh3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwpLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgICAgIHZhciBsaW5rID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICAgICAgICAgIGxpbmsuaHJlZiA9IHVybDtcbiAgICAgICAgICAgIGxpbmsuZG93bmxvYWQgPSBmaWxlbmFtZSB8fCAnb3V0cHV0Lndhdic7XG4gICAgICAgICAgICB2YXIgY2xpY2sgPSBkb2N1bWVudC5jcmVhdGVFdmVudChcIkV2ZW50XCIpO1xuICAgICAgICAgICAgY2xpY2suaW5pdEV2ZW50KFwiY2xpY2tcIiwgdHJ1ZSwgdHJ1ZSk7XG4gICAgICAgICAgICBsaW5rLmRpc3BhdGNoRXZlbnQoY2xpY2spO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIFJlY29yZGVyO1xufSkoKTtcblxuZXhwb3J0cy5kZWZhdWx0ID0gUmVjb3JkZXI7XG5cbn0se1wiaW5saW5lLXdvcmtlclwiOjN9XSwzOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lubGluZS13b3JrZXJcIik7XG59LHtcIi4vaW5saW5lLXdvcmtlclwiOjR9XSw0OltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcbihmdW5jdGlvbiAoZ2xvYmFsKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHsgZnVuY3Rpb24gZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKSB7IGZvciAodmFyIGtleSBpbiBwcm9wcykgeyB2YXIgcHJvcCA9IHByb3BzW2tleV07IHByb3AuY29uZmlndXJhYmxlID0gdHJ1ZTsgaWYgKHByb3AudmFsdWUpIHByb3Aud3JpdGFibGUgPSB0cnVlOyB9IE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpOyB9IHJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7IGlmIChzdGF0aWNQcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvciwgc3RhdGljUHJvcHMpOyByZXR1cm4gQ29uc3RydWN0b3I7IH07IH0pKCk7XG5cbnZhciBfY2xhc3NDYWxsQ2hlY2sgPSBmdW5jdGlvbiAoaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7IH0gfTtcblxudmFyIFdPUktFUl9FTkFCTEVEID0gISEoZ2xvYmFsID09PSBnbG9iYWwud2luZG93ICYmIGdsb2JhbC5VUkwgJiYgZ2xvYmFsLkJsb2IgJiYgZ2xvYmFsLldvcmtlcik7XG5cbnZhciBJbmxpbmVXb3JrZXIgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBJbmxpbmVXb3JrZXIoZnVuYywgc2VsZikge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgSW5saW5lV29ya2VyKTtcblxuICAgIGlmIChXT1JLRVJfRU5BQkxFRCkge1xuICAgICAgdmFyIGZ1bmN0aW9uQm9keSA9IGZ1bmMudG9TdHJpbmcoKS50cmltKCkubWF0Y2goL15mdW5jdGlvblxccypcXHcqXFxzKlxcKFtcXHdcXHMsXSpcXClcXHMqeyhbXFx3XFxXXSo/KX0kLylbMV07XG4gICAgICB2YXIgdXJsID0gZ2xvYmFsLlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IGdsb2JhbC5CbG9iKFtmdW5jdGlvbkJvZHldLCB7IHR5cGU6IFwidGV4dC9qYXZhc2NyaXB0XCIgfSkpO1xuXG4gICAgICByZXR1cm4gbmV3IGdsb2JhbC5Xb3JrZXIodXJsKTtcbiAgICB9XG5cbiAgICB0aGlzLnNlbGYgPSBzZWxmO1xuICAgIHRoaXMuc2VsZi5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX3RoaXMub25tZXNzYWdlKHsgZGF0YTogZGF0YSB9KTtcbiAgICAgIH0sIDApO1xuICAgIH07XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmMuY2FsbChzZWxmKTtcbiAgICB9LCAwKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhJbmxpbmVXb3JrZXIsIHtcbiAgICBwb3N0TWVzc2FnZToge1xuICAgICAgdmFsdWU6IGZ1bmN0aW9uIHBvc3RNZXNzYWdlKGRhdGEpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBfdGhpcy5zZWxmLm9ubWVzc2FnZSh7IGRhdGE6IGRhdGEgfSk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIElubGluZVdvcmtlcjtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gSW5saW5lV29ya2VyO1xufSkuY2FsbCh0aGlzLHR5cGVvZiBnbG9iYWwgIT09IFwidW5kZWZpbmVkXCIgPyBnbG9iYWwgOiB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG59LHt9XX0se30sWzFdKSgxKVxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9