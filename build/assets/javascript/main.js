
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
					navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJyZWNvcmRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblx0XHR2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuXHRcdFx0eFJlYyA9IGZhbHNlLFxuXHRcdFx0YmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcblx0XHRcdHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcblx0XHRcdHBsYXlTdGF0ZSA9IFNuYXAoJyNwbGF5U3RhdGUnKSxcblx0XHRcdHBhdXNlU3RhdGUgPSBTbmFwKCcjcGF1c2VTdGF0ZScpLFxuXHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGUgPSBTbmFwKCcjdGFwZScpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRsb2dUZXh0ID0gU25hcCgnI3JlY29yZGluZ1RleHQgdHNwYW4nKSxcblx0XHRcdHRyYWNrdGl0bGUgPSBTbmFwKCcjdHJhY2t0aXRsZSB0c3BhbicpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG5cdFx0XHRhdWRpbyA9IG5ldyBBdWRpbygpLFxuXHRcdFx0ZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcblx0XHRcdHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcblx0XHRcdGRpciA9IFwiYXVkaW8vXCIsXG5cdFx0XHRleHQgPSBcIi5tcDNcIixcblx0XHRcdGN1cnJlbnRUcmFjayA9IDAsXG5cdFx0XHRzZWVrc2xpZGVyLFxuXHRcdFx0c2Vla2luZz1mYWxzZSxcblx0XHRcdGF1ZGlvX2NvbnRleHQsXG5cdFx0XHRyZWNvcmRlcixcblx0XHRcdHNlZWt0bztcblxuXHRcdFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cblx0XHRcdC8vIEF1ZGlvIE9iamVjdFxuXHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0WzBdK2V4dDtcblxuXHRcdFx0Ly8gcmVlbCBzaXplc1xuXHRcdFx0dmFyIHRhcGVSVmFsdWUgPSAwO1xuXHRcdFx0dmFyIHRhcGVMVmFsdWUgPSA5MDtcblxuXHRcdFx0dGFwZUwuYW5pbWF0ZSh7cng6IHRhcGVMVmFsdWUsIHJ5OiB0YXBlTFZhbHVlfSwgNTAwLCBtaW5hLmxpbmVhcik7XG5cdFx0XHR0YXBlUi5hbmltYXRlKHtyeDogdGFwZVJWYWx1ZSwgcnk6IHRhcGVSVmFsdWV9LCA1MDAsIG1pbmEubGluZWFyKTtcblxuXHRcdFx0c2Vla3NsaWRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2Vla3NsaWRlclwiKTtcblxuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcignZW5kZWQnLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0dGhpcy5jdXJyZW50VGltZSA9IDA7XG5cdFx0XHRcdHRoaXMucGxheSgpO1xuXHRcdFx0fSwgZmFsc2UpO1xuXG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwidGltZXVwZGF0ZVwiLCBmdW5jdGlvbigpeyB0aW1lVXBkYXRlKCk7IH0pO1xuXHRcdFx0YXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRlZG1ldGFkYXRhXCIsIGZ1bmN0aW9uKCl7IHRpbWVEdXJVcGRhdGUoKTsgfSk7XG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwidHJhY2t0aXRsZVwiLCBmdW5jdGlvbigpeyB0aXRsZVVwZGF0ZSgpOyB9KTtcblxuXHRcdFx0Ly9hdWRpby5hZGRFdmVudExpc3RlbmVyKFwiZW5kZWRcIiwgZnVuY3Rpb24oKXsgbmV4dFRyYWNrKCk7IH0pO1xuXG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gbGVmdFxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb25MKCkge1xuXHRcdFx0XHR3aGVlbEwuYW5pbWF0ZSh7IHRyYW5zZm9ybTogJ3ItMzYwLDMwLDMwJ30sIDIwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdFx0d2hlZWxMLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAzMCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uTCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gd2hlZWwgYW5pbWF0aW9uIHJpZ2h0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvblIoKSB7XG5cdFx0XHRcdHdoZWVsUi5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMjcwLDMwJ30sIDIwMDAsXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcdFx0d2hlZWxSLmF0dHIoeyB0cmFuc2Zvcm06ICdyb3RhdGUoMCAyNzAgMzApJ30pO1xuXHRcdFx0XHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvblIoKTtcblx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHN0b3BXaGVlbEFuaW1hdGlvbigpIHtcblx0XHRcdFx0d2hlZWxMLnN0b3AoKTtcblx0XHRcdFx0d2hlZWxSLnN0b3AoKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gcmVjU3RvcCgpIHtcblx0XHRcdCAgXHRyZWMudHJhbnNmb3JtKCd0MC4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHR4UmVjID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHBsYXlTdG9wKCkge1xuXHRcdFx0ICBcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gZm9yd2FyZFN0b3AoKSB7XG5cdFx0XHRcdGZvcndhcmQudHJhbnNmb3JtKCd0MjUzLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHN0b3BBbmltYXRpb24oKTtcblx0XHRcdFx0WEZvcndhcmQgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIG5leHRUcmFjayAoKSB7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblxuXHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cblx0XHRcdH1cblxuXHRcdFx0Ly8gcGxheSBmdW5jdGlvblxuXHRcdFx0cGxheVBhdXNlLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQgXHRpZihhdWRpby5wYXVzZWQpIHtcblxuXHRcdFx0IFx0XHQvLyBwbGF5IHN0YXRlXG5cblx0XHRcdCBcdFx0cGxheUFjdGl2ZSA9IHRydWU7XG5cblx0XHRcdCBcdFx0cGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblx0XHRcdCBcdFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG5cdFx0XHQgXHRcdC8vY29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cblx0XHRcdFx0XHRpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHQgXHRcdH1cblx0XHRcdFx0XHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblxuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblxuXHRcdFx0XHQgICAgLy9hdWRpby5wbGF5KCk7XG5cdFx0XHRcdCAgICB0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHQgICAgfSBlbHNlIHtcblxuXHRcdFx0ICAgIFx0Ly8gcGF1c2Ugc3RhdGVcblxuXHRcdFx0ICAgIFx0cGxheUFjdGl2ZSA9IGZhbHNlO1xuXG5cdFx0XHQgICAgXHRwYXVzZVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwibm9uZVwiKTtcblx0XHRcdCAgICBcdHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXG5cdFx0XHQgICAgXHQvL2NvbnNvbGUubG9nKHBsYXlBY3RpdmUpO1xuXG5cdFx0XHRcdCAgICBhdWRpby5wYXVzZSgpO1xuXG5cdFx0XHRcdCAgXHRpZiAoIXhSZWMpIHsgLy8gaXMgc3RvcHBlZCBvciBwYXVzZWRcblx0XHRcdFx0ICBcdFx0c3RvcFdoZWVsQW5pbWF0aW9uKCk7XG5cdFx0XHRcdCAgXHR9XG5cdFx0XHRcdCAgXHRwbGF5UGF1c2UudHJhbnNmb3JtKCd0MTY5LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHQgICAgfVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcGxheSBmdW5jdGlvblxuXG5cdFx0XHQvLyBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0YmFja3dhcmQuY2xpY2soZnVuY3Rpb24oKSB7XG5cblx0XHRcdFx0Ly8gYnV0dG9uIGFuaW0xXG5cdFx0XHRcdHZhciBhbmltMSA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQgICAgYmFja3dhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDg1LjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZX0sIDIwMCwgbWluYS5saW5lYXIsIGFuaW0yKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgYW5pbTIgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ICAgIGJhY2t3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3Q4NS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb259LCAyMDApO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuXHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjayA9IChwbGF5bGlzdC5sZW5ndGggLSAxKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXG5cdFx0XHQvLyBmb3J3YXJkIGZ1bmN0aW9uXG5cdFx0XHRmb3J3YXJkLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHRcdC8vIGJ1dHRvbiBhbmltMVxuXHRcdFx0XHR2YXIgYW5pbTEgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0ICAgIGZvcndhcmQuYW5pbWF0ZSh7J3RyYW5zZm9ybScgOiAndDI1My4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb25BY3RpdmV9LCAyMDAsIG1pbmEubGluZWFyLCBhbmltMik7XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRhbmltMSgpO1xuXG5cdFx0XHRcdGlmKGN1cnJlbnRUcmFjayA9PSAocGxheWxpc3QubGVuZ3RoIC0gMSkpe1xuXHRcdFx0XHRcdGN1cnJlbnRUcmFjayA9IDA7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2srKztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vY29uc29sZS5sb2coJ2Z3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXG5cdFx0XHRcdGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFtjdXJyZW50VHJhY2tdK2V4dDtcblxuXHRcdFx0XHR0aXRsZVVwZGF0ZSgpO1xuXG5cdFx0XHRcdGlmIChwbGF5QWN0aXZlKSB7IC8vIGlmIGlzIHBsYXlpbmdcblx0XHRcdFx0XHRhdWRpby5wbGF5KCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIGZvcndhcmQgZnVuY3Rpb25cblxuXHRcdFx0ZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcblx0XHRcdFx0dHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cdFx0XHR9XG5cblx0XHRcdC8vICoqKioqKioqIFJlY29yZGVyICoqKioqKiogLy9cblx0XHRcdGZ1bmN0aW9uIF9fbG9nKGUsIGRhdGEpIHtcblx0XHRcdFx0bG9nVGV4dC5ub2RlLmlubmVySFRNTCA9IFwiXFxuXCIgKyBlICsgXCIgXCIgKyAoZGF0YSB8fCAnJyk7XG5cdFx0XHR9XG5cblx0XHRcdGZ1bmN0aW9uIHN0YXJ0VXNlck1lZGlhKHN0cmVhbSkge1xuXHRcdFx0XHR2YXIgaW5wdXQgPSBhdWRpb19jb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKHN0cmVhbSk7XG5cdFx0XHRcdF9fbG9nKCdNZWRpYSBzdHJlYW0gY3JlYXRlZC4nKTtcblx0XHRcdFx0Ly8gVW5jb21tZW50IGlmIHlvdSB3YW50IHRoZSBhdWRpbyB0byBmZWVkYmFjayBkaXJlY3RseVxuXHRcdFx0XHQvL2lucHV0LmNvbm5lY3QoYXVkaW9fY29udGV4dC5kZXN0aW5hdGlvbik7XG5cdFx0XHRcdC8vX19sb2coJ0lucHV0IGNvbm5lY3RlZCB0byBhdWRpbyBjb250ZXh0IGRlc3RpbmF0aW9uLicpO1xuXG5cdFx0XHRcdHJlY29yZGVyID0gbmV3IFJlY29yZGVyKGlucHV0KTtcblx0XHRcdFx0X19sb2coJ1JlY29yZGVyIGluaXRpYWxpc2VkLicpO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyByZWMgZnVuY3Rpb25cblx0XHRcdHJlYy5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHRpZiAoIXhSZWMpeyAvL3N0YXJ0IHJlY29yZGluZ1xuXG5cdFx0XHRcdFx0cmVjLnRyYW5zZm9ybSgndDAuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXHRcdFx0XHRcdC8vIHdoZWVscyBldmVudHNcblxuXHRcdFx0XHRcdGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR4UmVjID0gdHJ1ZTtcblxuXHRcdFx0XHRcdHJlY29yZGVyICYmIHJlY29yZGVyLnJlY29yZCgpO1xuXG5cdFx0XHRcdFx0X19sb2coJ1JlY29yZGluZy4uLicpO1xuXG5cdFx0XHRcdH0gIGVsc2UgeyAvL3N0b3AgcmVjb3JkaW5nXG5cdFx0XHRcdFx0cmVjU3RvcCgpO1xuXG5cdFx0XHRcdFx0aWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cblx0XHRcdFx0XHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJlY29yZGVyICYmIHJlY29yZGVyLnN0b3AoKTtcblxuXHRcdFx0XHRcdF9fbG9nKCdTdG9wcGVkIHJlY29yZGluZy4nKTtcblxuXHRcdFx0XHRcdC8vIGNyZWF0ZSBXQVYgZG93bmxvYWQgbGluayB1c2luZyBhdWRpbyBkYXRhIGJsb2Jcblx0XHRcdFx0XHRjcmVhdGVEb3dubG9hZExpbmsoKTtcblxuXHRcdFx0XHRcdHJlY29yZGVyLmNsZWFyKCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0Ly8gZW5kIHJlYyBmdW5jdGlvblxuXG5cdFx0XHRmdW5jdGlvbiBjcmVhdGVEb3dubG9hZExpbmsoKSB7XG5cdFx0XHRcdHJlY29yZGVyICYmIHJlY29yZGVyLmV4cG9ydFdBVihmdW5jdGlvbihibG9iKSB7XG5cdFx0XHRcdFx0dmFyIHVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG5cdFx0XHRcdFx0dmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcblx0XHRcdFx0XHR2YXIgYXUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhdWRpbycpO1xuXHRcdFx0XHRcdHZhciBoZiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcblxuXHRcdFx0XHRcdGF1LmNvbnRyb2xzID0gdHJ1ZTtcblx0XHRcdFx0XHRhdS5zcmMgPSB1cmw7XG5cdFx0XHRcdFx0aGYuaHJlZiA9IHVybDtcblx0XHRcdFx0XHRoZi5kb3dubG9hZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSArICcud2F2Jztcblx0XHRcdFx0XHRoZi5pbm5lckhUTUwgPSBoZi5kb3dubG9hZDtcblx0XHRcdFx0XHQvL2xpLmFwcGVuZENoaWxkKGF1KTsgLy8gSSBkb24ndCB3YW50IHRoZSBkZWZhdWx0IGJyb3dzZXIgcGxheWVyLlxuXHRcdFx0XHRcdGxpLmFwcGVuZENoaWxkKGhmKTsgLy8gaSBqdXN0IHdhbnQgdGhlIGxpbmsgb2YgdGhlIHJlY29yZGVkIGF1ZGlvIHRvIGRvd25sb2FkXG5cdFx0XHRcdFx0cmVjb3JkaW5nc2xpc3QuYXBwZW5kQ2hpbGQobGkpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdHdpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiBpbml0KCkge1xuXHRcdFx0XHR0cnkge1xuXHRcdFx0XHRcdC8vIHdlYmtpdCBzaGltXG5cdFx0XHRcdFx0d2luZG93LkF1ZGlvQ29udGV4dCA9IHdpbmRvdy5BdWRpb0NvbnRleHQgfHwgd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dDtcblx0XHRcdFx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLmdldFVzZXJNZWRpYSB8fCBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhO1xuXHRcdFx0XHRcdHdpbmRvdy5VUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkw7XG5cblx0XHRcdFx0XHRhdWRpb19jb250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dDtcblx0XHRcdFx0XHRfX2xvZygnQXVkaW8gY29udGV4dCBzZXQgdXAuJyk7XG5cdFx0XHRcdFx0X19sb2coJ25hdmlnYXRvci5nZXRVc2VyTWVkaWEgJyArIChuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhID8gJ2F2YWlsYWJsZS4nIDogJ25vdCBwcmVzZW50IScpKTtcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRcdGFsZXJ0KCdObyB3ZWIgYXVkaW8gc3VwcG9ydCBpbiB0aGlzIGJyb3dzZXIhJyk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKHthdWRpbzogdHJ1ZX0sIHN0YXJ0VXNlck1lZGlhLCBmdW5jdGlvbihlKSB7XG5cdFx0XHRcdFx0X19sb2coJ05vIGxpdmUgYXVkaW8gaW5wdXQ6ICcgKyBlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuIiwiKGZ1bmN0aW9uKGYpe2lmKHR5cGVvZiBleHBvcnRzPT09XCJvYmplY3RcIiYmdHlwZW9mIG1vZHVsZSE9PVwidW5kZWZpbmVkXCIpe21vZHVsZS5leHBvcnRzPWYoKX1lbHNlIGlmKHR5cGVvZiBkZWZpbmU9PT1cImZ1bmN0aW9uXCImJmRlZmluZS5hbWQpe2RlZmluZShbXSxmKX1lbHNle3ZhciBnO2lmKHR5cGVvZiB3aW5kb3chPT1cInVuZGVmaW5lZFwiKXtnPXdpbmRvd31lbHNlIGlmKHR5cGVvZiBnbG9iYWwhPT1cInVuZGVmaW5lZFwiKXtnPWdsb2JhbH1lbHNlIGlmKHR5cGVvZiBzZWxmIT09XCJ1bmRlZmluZWRcIil7Zz1zZWxmfWVsc2V7Zz10aGlzfWcuUmVjb3JkZXIgPSBmKCl9fSkoZnVuY3Rpb24oKXt2YXIgZGVmaW5lLG1vZHVsZSxleHBvcnRzO3JldHVybiAoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSh7MTpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9yZWNvcmRlclwiKS5SZWNvcmRlcjtcblxufSx7XCIuL3JlY29yZGVyXCI6Mn1dLDI6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX2NyZWF0ZUNsYXNzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSBwcm9wc1tpXTtkZXNjcmlwdG9yLmVudW1lcmFibGUgPSBkZXNjcmlwdG9yLmVudW1lcmFibGUgfHwgZmFsc2U7ZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlO2lmIChcInZhbHVlXCIgaW4gZGVzY3JpcHRvcikgZGVzY3JpcHRvci53cml0YWJsZSA9IHRydWU7T2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpO1xuICAgICAgICB9XG4gICAgfXJldHVybiBmdW5jdGlvbiAoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgICAgIGlmIChwcm90b1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLnByb3RvdHlwZSwgcHJvdG9Qcm9wcyk7aWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7cmV0dXJuIENvbnN0cnVjdG9yO1xuICAgIH07XG59KSgpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLlJlY29yZGVyID0gdW5kZWZpbmVkO1xuXG52YXIgX2lubGluZVdvcmtlciA9IHJlcXVpcmUoJ2lubGluZS13b3JrZXInKTtcblxudmFyIF9pbmxpbmVXb3JrZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaW5saW5lV29ya2VyKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHtcbiAgICByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTtcbn1cblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3Rvcikge1xuICAgIGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb25cIik7XG4gICAgfVxufVxuXG52YXIgUmVjb3JkZXIgPSBleHBvcnRzLlJlY29yZGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZWNvcmRlcihzb3VyY2UsIGNmZykge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBSZWNvcmRlcik7XG5cbiAgICAgICAgdGhpcy5jb25maWcgPSB7XG4gICAgICAgICAgICBidWZmZXJMZW46IDQwOTYsXG4gICAgICAgICAgICBudW1DaGFubmVsczogMixcbiAgICAgICAgICAgIG1pbWVUeXBlOiAnYXVkaW8vd2F2J1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnJlY29yZGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHtcbiAgICAgICAgICAgIGdldEJ1ZmZlcjogW10sXG4gICAgICAgICAgICBleHBvcnRXQVY6IFtdXG4gICAgICAgIH07XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLmNvbmZpZywgY2ZnKTtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gc291cmNlLmNvbnRleHQ7XG4gICAgICAgIHRoaXMubm9kZSA9ICh0aGlzLmNvbnRleHQuY3JlYXRlU2NyaXB0UHJvY2Vzc29yIHx8IHRoaXMuY29udGV4dC5jcmVhdGVKYXZhU2NyaXB0Tm9kZSkuY2FsbCh0aGlzLmNvbnRleHQsIHRoaXMuY29uZmlnLmJ1ZmZlckxlbiwgdGhpcy5jb25maWcubnVtQ2hhbm5lbHMsIHRoaXMuY29uZmlnLm51bUNoYW5uZWxzKTtcblxuICAgICAgICB0aGlzLm5vZGUub25hdWRpb3Byb2Nlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgaWYgKCFfdGhpcy5yZWNvcmRpbmcpIHJldHVybjtcblxuICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCBfdGhpcy5jb25maWcubnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgIGJ1ZmZlci5wdXNoKGUuaW5wdXRCdWZmZXIuZ2V0Q2hhbm5lbERhdGEoY2hhbm5lbCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBjb21tYW5kOiAncmVjb3JkJyxcbiAgICAgICAgICAgICAgICBidWZmZXI6IGJ1ZmZlclxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc291cmNlLmNvbm5lY3QodGhpcy5ub2RlKTtcbiAgICAgICAgdGhpcy5ub2RlLmNvbm5lY3QodGhpcy5jb250ZXh0LmRlc3RpbmF0aW9uKTsgLy90aGlzIHNob3VsZCBub3QgYmUgbmVjZXNzYXJ5XG5cbiAgICAgICAgdmFyIHNlbGYgPSB7fTtcbiAgICAgICAgdGhpcy53b3JrZXIgPSBuZXcgX2lubGluZVdvcmtlcjIuZGVmYXVsdChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVjTGVuZ3RoID0gMCxcbiAgICAgICAgICAgICAgICByZWNCdWZmZXJzID0gW10sXG4gICAgICAgICAgICAgICAgc2FtcGxlUmF0ZSA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBudW1DaGFubmVscyA9IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZS5kYXRhLmNvbW1hbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW5pdCc6XG4gICAgICAgICAgICAgICAgICAgICAgICBpbml0KGUuZGF0YS5jb25maWcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JlY29yZCc6XG4gICAgICAgICAgICAgICAgICAgICAgICByZWNvcmQoZS5kYXRhLmJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZXhwb3J0V0FWJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4cG9ydFdBVihlLmRhdGEudHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZ2V0QnVmZmVyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGdldEJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NsZWFyJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmdW5jdGlvbiBpbml0KGNvbmZpZykge1xuICAgICAgICAgICAgICAgIHNhbXBsZVJhdGUgPSBjb25maWcuc2FtcGxlUmF0ZTtcbiAgICAgICAgICAgICAgICBudW1DaGFubmVscyA9IGNvbmZpZy5udW1DaGFubmVscztcbiAgICAgICAgICAgICAgICBpbml0QnVmZmVycygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiByZWNvcmQoaW5wdXRCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjaGFubmVsID0gMDsgY2hhbm5lbCA8IG51bUNoYW5uZWxzOyBjaGFubmVsKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjQnVmZmVyc1tjaGFubmVsXS5wdXNoKGlucHV0QnVmZmVyW2NoYW5uZWxdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVjTGVuZ3RoICs9IGlucHV0QnVmZmVyWzBdLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZXhwb3J0V0FWKHR5cGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVycyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgbnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgICAgICBidWZmZXJzLnB1c2gobWVyZ2VCdWZmZXJzKHJlY0J1ZmZlcnNbY2hhbm5lbF0sIHJlY0xlbmd0aCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgaW50ZXJsZWF2ZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgaWYgKG51bUNoYW5uZWxzID09PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGludGVybGVhdmVkID0gaW50ZXJsZWF2ZShidWZmZXJzWzBdLCBidWZmZXJzWzFdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnRlcmxlYXZlZCA9IGJ1ZmZlcnNbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBkYXRhdmlldyA9IGVuY29kZVdBVihpbnRlcmxlYXZlZCk7XG4gICAgICAgICAgICAgICAgdmFyIGF1ZGlvQmxvYiA9IG5ldyBCbG9iKFtkYXRhdmlld10sIHsgdHlwZTogdHlwZSB9KTtcblxuICAgICAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UoeyBjb21tYW5kOiAnZXhwb3J0V0FWJywgZGF0YTogYXVkaW9CbG9iIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBnZXRCdWZmZXIoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjaGFubmVsID0gMDsgY2hhbm5lbCA8IG51bUNoYW5uZWxzOyBjaGFubmVsKyspIHtcbiAgICAgICAgICAgICAgICAgICAgYnVmZmVycy5wdXNoKG1lcmdlQnVmZmVycyhyZWNCdWZmZXJzW2NoYW5uZWxdLCByZWNMZW5ndGgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGNvbW1hbmQ6ICdnZXRCdWZmZXInLCBkYXRhOiBidWZmZXJzIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICAgICAgICAgICAgICByZWNMZW5ndGggPSAwO1xuICAgICAgICAgICAgICAgIHJlY0J1ZmZlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBpbml0QnVmZmVycygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpbml0QnVmZmVycygpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjaGFubmVsID0gMDsgY2hhbm5lbCA8IG51bUNoYW5uZWxzOyBjaGFubmVsKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjQnVmZmVyc1tjaGFubmVsXSA9IFtdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gbWVyZ2VCdWZmZXJzKHJlY0J1ZmZlcnMsIHJlY0xlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KHJlY0xlbmd0aCk7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWNCdWZmZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zZXQocmVjQnVmZmVyc1tpXSwgb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHJlY0J1ZmZlcnNbaV0ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBpbnRlcmxlYXZlKGlucHV0TCwgaW5wdXRSKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGlucHV0TC5sZW5ndGggKyBpbnB1dFIubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KGxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSAwLFxuICAgICAgICAgICAgICAgICAgICBpbnB1dEluZGV4ID0gMDtcblxuICAgICAgICAgICAgICAgIHdoaWxlIChpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaW5kZXgrK10gPSBpbnB1dExbaW5wdXRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtpbmRleCsrXSA9IGlucHV0UltpbnB1dEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXRJbmRleCsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBmbG9hdFRvMTZCaXRQQ00ob3V0cHV0LCBvZmZzZXQsIGlucHV0KSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBpbnB1dC5sZW5ndGg7IGkrKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHMgPSBNYXRoLm1heCgtMSwgTWF0aC5taW4oMSwgaW5wdXRbaV0pKTtcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnNldEludDE2KG9mZnNldCwgcyA8IDAgPyBzICogMHg4MDAwIDogcyAqIDB4N0ZGRiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiB3cml0ZVN0cmluZyh2aWV3LCBvZmZzZXQsIHN0cmluZykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDgob2Zmc2V0ICsgaSwgc3RyaW5nLmNoYXJDb2RlQXQoaSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gZW5jb2RlV0FWKHNhbXBsZXMpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDQ0ICsgc2FtcGxlcy5sZW5ndGggKiAyKTtcbiAgICAgICAgICAgICAgICB2YXIgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuXG4gICAgICAgICAgICAgICAgLyogUklGRiBpZGVudGlmaWVyICovXG4gICAgICAgICAgICAgICAgd3JpdGVTdHJpbmcodmlldywgMCwgJ1JJRkYnKTtcbiAgICAgICAgICAgICAgICAvKiBSSUZGIGNodW5rIGxlbmd0aCAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKDQsIDM2ICsgc2FtcGxlcy5sZW5ndGggKiAyLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBSSUZGIHR5cGUgKi9cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmluZyh2aWV3LCA4LCAnV0FWRScpO1xuICAgICAgICAgICAgICAgIC8qIGZvcm1hdCBjaHVuayBpZGVudGlmaWVyICovXG4gICAgICAgICAgICAgICAgd3JpdGVTdHJpbmcodmlldywgMTIsICdmbXQgJyk7XG4gICAgICAgICAgICAgICAgLyogZm9ybWF0IGNodW5rIGxlbmd0aCAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKDE2LCAxNiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogc2FtcGxlIGZvcm1hdCAocmF3KSAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDE2KDIwLCAxLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBjaGFubmVsIGNvdW50ICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMjIsIG51bUNoYW5uZWxzLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBzYW1wbGUgcmF0ZSAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKDI0LCBzYW1wbGVSYXRlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBieXRlIHJhdGUgKHNhbXBsZSByYXRlICogYmxvY2sgYWxpZ24pICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMjgsIHNhbXBsZVJhdGUgKiA0LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBibG9jayBhbGlnbiAoY2hhbm5lbCBjb3VudCAqIGJ5dGVzIHBlciBzYW1wbGUpICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMzIsIG51bUNoYW5uZWxzICogMiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgLyogYml0cyBwZXIgc2FtcGxlICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMzQsIDE2LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBkYXRhIGNodW5rIGlkZW50aWZpZXIgKi9cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmluZyh2aWV3LCAzNiwgJ2RhdGEnKTtcbiAgICAgICAgICAgICAgICAvKiBkYXRhIGNodW5rIGxlbmd0aCAqL1xuICAgICAgICAgICAgICAgIHZpZXcuc2V0VWludDMyKDQwLCBzYW1wbGVzLmxlbmd0aCAqIDIsIHRydWUpO1xuXG4gICAgICAgICAgICAgICAgZmxvYXRUbzE2Qml0UENNKHZpZXcsIDQ0LCBzYW1wbGVzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB2aWV3O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBzZWxmKTtcblxuICAgICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBjb21tYW5kOiAnaW5pdCcsXG4gICAgICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlOiB0aGlzLmNvbnRleHQuc2FtcGxlUmF0ZSxcbiAgICAgICAgICAgICAgICBudW1DaGFubmVsczogdGhpcy5jb25maWcubnVtQ2hhbm5lbHNcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy53b3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHZhciBjYiA9IF90aGlzLmNhbGxiYWNrc1tlLmRhdGEuY29tbWFuZF0ucG9wKCk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNiID09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjYihlLmRhdGEuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgX2NyZWF0ZUNsYXNzKFJlY29yZGVyLCBbe1xuICAgICAgICBrZXk6ICdyZWNvcmQnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gcmVjb3JkKCkge1xuICAgICAgICAgICAgdGhpcy5yZWNvcmRpbmcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdzdG9wJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdjbGVhcicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBjbGVhcigpIHtcbiAgICAgICAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHsgY29tbWFuZDogJ2NsZWFyJyB9KTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnZ2V0QnVmZmVyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGdldEJ1ZmZlcihjYikge1xuICAgICAgICAgICAgY2IgPSBjYiB8fCB0aGlzLmNvbmZpZy5jYWxsYmFjaztcbiAgICAgICAgICAgIGlmICghY2IpIHRocm93IG5ldyBFcnJvcignQ2FsbGJhY2sgbm90IHNldCcpO1xuXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5nZXRCdWZmZXIucHVzaChjYik7XG5cbiAgICAgICAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHsgY29tbWFuZDogJ2dldEJ1ZmZlcicgfSk7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2V4cG9ydFdBVicsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBleHBvcnRXQVYoY2IsIG1pbWVUeXBlKSB7XG4gICAgICAgICAgICBtaW1lVHlwZSA9IG1pbWVUeXBlIHx8IHRoaXMuY29uZmlnLm1pbWVUeXBlO1xuICAgICAgICAgICAgY2IgPSBjYiB8fCB0aGlzLmNvbmZpZy5jYWxsYmFjaztcbiAgICAgICAgICAgIGlmICghY2IpIHRocm93IG5ldyBFcnJvcignQ2FsbGJhY2sgbm90IHNldCcpO1xuXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5leHBvcnRXQVYucHVzaChjYik7XG5cbiAgICAgICAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBjb21tYW5kOiAnZXhwb3J0V0FWJyxcbiAgICAgICAgICAgICAgICB0eXBlOiBtaW1lVHlwZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XSwgW3tcbiAgICAgICAga2V5OiAnZm9yY2VEb3dubG9hZCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBmb3JjZURvd25sb2FkKGJsb2IsIGZpbGVuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gKHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgdmFyIGxpbmsgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICAgICAgbGluay5ocmVmID0gdXJsO1xuICAgICAgICAgICAgbGluay5kb3dubG9hZCA9IGZpbGVuYW1lIHx8ICdvdXRwdXQud2F2JztcbiAgICAgICAgICAgIHZhciBjbGljayA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KFwiRXZlbnRcIik7XG4gICAgICAgICAgICBjbGljay5pbml0RXZlbnQoXCJjbGlja1wiLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgIGxpbmsuZGlzcGF0Y2hFdmVudChjbGljayk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gUmVjb3JkZXI7XG59KSgpO1xuXG5leHBvcnRzLmRlZmF1bHQgPSBSZWNvcmRlcjtcblxufSx7XCJpbmxpbmUtd29ya2VyXCI6M31dLDM6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaW5saW5lLXdvcmtlclwiKTtcbn0se1wiLi9pbmxpbmUtd29ya2VyXCI6NH1dLDQ6W2Z1bmN0aW9uKHJlcXVpcmUsbW9kdWxlLGV4cG9ydHMpe1xuKGZ1bmN0aW9uIChnbG9iYWwpe1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBkZWZpbmVQcm9wZXJ0aWVzKHRhcmdldCwgcHJvcHMpIHsgZm9yICh2YXIga2V5IGluIHByb3BzKSB7IHZhciBwcm9wID0gcHJvcHNba2V5XTsgcHJvcC5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAocHJvcC52YWx1ZSkgcHJvcC53cml0YWJsZSA9IHRydWU7IH0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcyk7IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9jbGFzc0NhbGxDaGVjayA9IGZ1bmN0aW9uIChpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTsgfSB9O1xuXG52YXIgV09SS0VSX0VOQUJMRUQgPSAhIShnbG9iYWwgPT09IGdsb2JhbC53aW5kb3cgJiYgZ2xvYmFsLlVSTCAmJiBnbG9iYWwuQmxvYiAmJiBnbG9iYWwuV29ya2VyKTtcblxudmFyIElubGluZVdvcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIElubGluZVdvcmtlcihmdW5jLCBzZWxmKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBJbmxpbmVXb3JrZXIpO1xuXG4gICAgaWYgKFdPUktFUl9FTkFCTEVEKSB7XG4gICAgICB2YXIgZnVuY3Rpb25Cb2R5ID0gZnVuYy50b1N0cmluZygpLnRyaW0oKS5tYXRjaCgvXmZ1bmN0aW9uXFxzKlxcdypcXHMqXFwoW1xcd1xccyxdKlxcKVxccyp7KFtcXHdcXFddKj8pfSQvKVsxXTtcbiAgICAgIHZhciB1cmwgPSBnbG9iYWwuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgZ2xvYmFsLkJsb2IoW2Z1bmN0aW9uQm9keV0sIHsgdHlwZTogXCJ0ZXh0L2phdmFzY3JpcHRcIiB9KSk7XG5cbiAgICAgIHJldHVybiBuZXcgZ2xvYmFsLldvcmtlcih1cmwpO1xuICAgIH1cblxuICAgIHRoaXMuc2VsZiA9IHNlbGY7XG4gICAgdGhpcy5zZWxmLnBvc3RNZXNzYWdlID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBfdGhpcy5vbm1lc3NhZ2UoeyBkYXRhOiBkYXRhIH0pO1xuICAgICAgfSwgMCk7XG4gICAgfTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgZnVuYy5jYWxsKHNlbGYpO1xuICAgIH0sIDApO1xuICB9XG5cbiAgX2NyZWF0ZUNsYXNzKElubGluZVdvcmtlciwge1xuICAgIHBvc3RNZXNzYWdlOiB7XG4gICAgICB2YWx1ZTogZnVuY3Rpb24gcG9zdE1lc3NhZ2UoZGF0YSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIF90aGlzLnNlbGYub25tZXNzYWdlKHsgZGF0YTogZGF0YSB9KTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gSW5saW5lV29ya2VyO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbmxpbmVXb3JrZXI7XG59KS5jYWxsKHRoaXMsdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbn0se31dfSx7fSxbMV0pKDEpXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=