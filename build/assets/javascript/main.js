
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
			playlist = ['dirty_south_loop_85bpm', 'pop_hiphop_loop_100bpm'],
			dir = "audio/",
			ext = ".mp3",
			currentTrack = 0,
			seekslider,
			seeking=false,
			seekto;

			pauseState.attr("display", "none");



			// Audio Object
			audio.src = dir+playlist[0]+ext;

			// reel sizes
			var tapeRValue = 0;
			var tapeLValue = 90;

			tapeL.animate({rx: tapeLValue, ry: tapeLValue}, 500, mina.linear)
			tapeR.animate({rx: tapeRValue, ry: tapeRValue}, 500, mina.linear)

			seekslider = document.getElementById("seekslider");

			//curtimetext = document.getElementById("curtimetext");
			//durtimetext = document.getElementById("durtimetext");
			// Add Event Handling

			//audio.addEventListener("ended", function(){ switchTrack(); });

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
				}

				var anim2 = function() {
				    backward.animate({'transform' : 't85.344053, ' + buttonYposition}, 200);
				}

				anim1();

				if(currentTrack > 0 ) {

					currentTrack--;


					//console.log('bw - the current track is: ' + currentTrack);

				} else {

				    currentTrack = (playlist.length - 1);

				    //console.log('bw - the current track is: ' + currentTrack);
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
				}

				var anim2 = function() {
				    forward.animate({'transform' : 't253.344053, ' + buttonYposition}, 200);
				}

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


				tapeRValue = (audio.currentTime / 2.2);
				tapeLValue = (audio.duration / 2.2) - (audio.currentTime / 2.2);

				console.log('duration ' + audio.duration);
				console.log('tapeRValue ' + tapeRValue);

				tapeL.animate({rx: tapeLValue, ry: tapeLValue}, 500, mina.linear)
				tapeR.animate({rx: tapeRValue, ry: tapeRValue}, 500, mina.linear)


				var curmins = Math.floor(audio.currentTime / 60);
			    var cursecs = Math.floor(audio.currentTime - curmins * 60);

				if(cursecs < 10){ cursecs = "0"+cursecs; }

			    if(curmins < 10){ curmins = "0"+curmins; }

				curtimetext.node.innerHTML = curmins+":"+cursecs;


			}
			function timeDurUpdate(){
				//tapeL init
				tapeLValue = (audio.duration / 2.2);
				tapeL.animate({rx: tapeLValue, ry: tapeLValue}, 500, mina.linear)

				var durmins = Math.floor(audio.duration / 60);
			    var dursecs = Math.floor(audio.duration - durmins * 60);
				if(dursecs < 10){ dursecs = "0"+dursecs; }
				if(durmins < 10){ durmins = "0"+durmins; }

				if(audio.duration) {
					durtimetext.node.innerHTML = durmins+":"+dursecs;
				} else {
					durtimetext.node.innerHTML = "0:00";
				}
			}
			function titleUpdate(){
				tracktitle.node.innerHTML = playlist[currentTrack];
			}

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4uanMiLCJyZWNvcmRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJcblx0XHR2YXIgcmVjID0gU25hcCgnI3JlYycpLFxuXHRcdFx0eFJlYyA9IGZhbHNlLFxuXHRcdFx0YmFja3dhcmQgPSBTbmFwKCcjYmFja3dhcmQnKSxcblx0XHRcdHBsYXlQYXVzZSA9IFNuYXAoJyNwbGF5UGF1c2UnKSxcblx0XHRcdHBsYXlTdGF0ZSA9IFNuYXAoJyNwbGF5U3RhdGUnKSxcblx0XHRcdHBhdXNlU3RhdGUgPSBTbmFwKCcjcGF1c2VTdGF0ZScpLFxuXHRcdFx0cGxheUFjdGl2ZSA9IGZhbHNlLFxuXHRcdFx0Zm9yd2FyZCA9IFNuYXAoJyNmb3J3YXJkJyksXG5cdFx0XHR3aGVlbEwgPSBTbmFwKCcjd2hlZWwtbCcpLFxuXHRcdFx0d2hlZWxSID0gU25hcCgnI3doZWVsLXInKSxcblx0XHRcdHRhcGUgPSBTbmFwKCcjdGFwZScpLFxuXHRcdFx0dGFwZUwgPSBTbmFwKCcjdGFwZUwnKSxcblx0XHRcdHRhcGVSID0gU25hcCgnI3RhcGVSJyksXG5cdFx0XHRjdXJ0aW1ldGV4dCA9IFNuYXAoJyNjdXJ0aW1ldGV4dCB0c3BhbicpLFxuXHRcdFx0ZHVydGltZXRleHQgPSBTbmFwKCcjZHVydGltZXRleHQgdHNwYW4nKSxcblx0XHRcdHRyYWNrdGl0bGUgPSBTbmFwKCcjdHJhY2t0aXRsZSB0c3BhbicpLFxuXHRcdFx0YnV0dG9uWXBvc2l0aW9uID0gMC42Nzk0NzcsXG5cdFx0XHRidXR0b25ZcG9zaXRpb25BY3RpdmUgPSA4LjY3OTQ3Nyxcblx0XHRcdGJib3hMID0gdGFwZUwuZ2V0QkJveCgpLFxuXHRcdFx0YmJveFIgPSB0YXBlUi5nZXRCQm94KCksXG5cdFx0XHRhdWRpbyA9IG5ldyBBdWRpbygpLFxuXHRcdFx0ZHVyYXRpb24gPSBhdWRpby5kdXJhdGlvbixcblx0XHRcdHBsYXlsaXN0ID0gWydkaXJ0eV9zb3V0aF9sb29wXzg1YnBtJywgJ3BvcF9oaXBob3BfbG9vcF8xMDBicG0nXSxcblx0XHRcdGRpciA9IFwiYXVkaW8vXCIsXG5cdFx0XHRleHQgPSBcIi5tcDNcIixcblx0XHRcdGN1cnJlbnRUcmFjayA9IDAsXG5cdFx0XHRzZWVrc2xpZGVyLFxuXHRcdFx0c2Vla2luZz1mYWxzZSxcblx0XHRcdHNlZWt0bztcblxuXHRcdFx0cGF1c2VTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cblxuXG5cdFx0XHQvLyBBdWRpbyBPYmplY3Rcblx0XHRcdGF1ZGlvLnNyYyA9IGRpcitwbGF5bGlzdFswXStleHQ7XG5cblx0XHRcdC8vIHJlZWwgc2l6ZXNcblx0XHRcdHZhciB0YXBlUlZhbHVlID0gMDtcblx0XHRcdHZhciB0YXBlTFZhbHVlID0gOTA7XG5cblx0XHRcdHRhcGVMLmFuaW1hdGUoe3J4OiB0YXBlTFZhbHVlLCByeTogdGFwZUxWYWx1ZX0sIDUwMCwgbWluYS5saW5lYXIpXG5cdFx0XHR0YXBlUi5hbmltYXRlKHtyeDogdGFwZVJWYWx1ZSwgcnk6IHRhcGVSVmFsdWV9LCA1MDAsIG1pbmEubGluZWFyKVxuXG5cdFx0XHRzZWVrc2xpZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWVrc2xpZGVyXCIpO1xuXG5cdFx0XHQvL2N1cnRpbWV0ZXh0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjdXJ0aW1ldGV4dFwiKTtcblx0XHRcdC8vZHVydGltZXRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImR1cnRpbWV0ZXh0XCIpO1xuXHRcdFx0Ly8gQWRkIEV2ZW50IEhhbmRsaW5nXG5cblx0XHRcdC8vYXVkaW8uYWRkRXZlbnRMaXN0ZW5lcihcImVuZGVkXCIsIGZ1bmN0aW9uKCl7IHN3aXRjaFRyYWNrKCk7IH0pO1xuXG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKCdlbmRlZCcsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHR0aGlzLmN1cnJlbnRUaW1lID0gMDtcblx0XHRcdFx0dGhpcy5wbGF5KCk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0aW1ldXBkYXRlXCIsIGZ1bmN0aW9uKCl7IHRpbWVVcGRhdGUoKTsgfSk7XG5cdFx0XHRhdWRpby5hZGRFdmVudExpc3RlbmVyKFwibG9hZGVkbWV0YWRhdGFcIiwgZnVuY3Rpb24oKXsgdGltZUR1clVwZGF0ZSgpOyB9KTtcblx0XHRcdGF1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJ0cmFja3RpdGxlXCIsIGZ1bmN0aW9uKCl7IHRpdGxlVXBkYXRlKCk7IH0pO1xuXG5cdFx0XHQvL2F1ZGlvLmFkZEV2ZW50TGlzdGVuZXIoXCJlbmRlZFwiLCBmdW5jdGlvbigpeyBuZXh0VHJhY2soKTsgfSk7XG5cblx0XHRcdC8vIHdoZWVsIGFuaW1hdGlvbiBsZWZ0XG5cdFx0XHRmdW5jdGlvbiB3aGVlbEFuaW1hdGlvbkwoKSB7XG5cdFx0XHRcdHdoZWVsTC5hbmltYXRlKHsgdHJhbnNmb3JtOiAnci0zNjAsMzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbEwuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDMwIDMwKSd9KTtcblx0XHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb25MKCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0XHQvLyB3aGVlbCBhbmltYXRpb24gcmlnaHRcblx0XHRcdGZ1bmN0aW9uIHdoZWVsQW5pbWF0aW9uUigpIHtcblx0XHRcdFx0d2hlZWxSLmFuaW1hdGUoeyB0cmFuc2Zvcm06ICdyLTM2MCwyNzAsMzAnfSwgMjAwMCxcblx0XHRcdFx0XHRmdW5jdGlvbigpe1xuXHRcdFx0XHRcdFx0XHR3aGVlbFIuYXR0cih7IHRyYW5zZm9ybTogJ3JvdGF0ZSgwIDI3MCAzMCknfSk7XG5cdFx0XHRcdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gd2hlZWxBbmltYXRpb24oKSB7XG5cdFx0XHRcdHdoZWVsQW5pbWF0aW9uUigpO1xuXHRcdFx0XHR3aGVlbEFuaW1hdGlvbkwoKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gc3RvcFdoZWVsQW5pbWF0aW9uKCkge1xuXHRcdFx0XHR3aGVlbEwuc3RvcCgpO1xuXHRcdFx0XHR3aGVlbFIuc3RvcCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRmdW5jdGlvbiByZWNTdG9wKCkge1xuXHRcdFx0ICBcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbik7XG5cdFx0XHRcdHhSZWMgPSBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gcGxheVN0b3AoKSB7XG5cdFx0XHQgIFx0cGxheVBhdXNlLnRyYW5zZm9ybSgndDE2OS4zNDQwNTMsICcgKyBidXR0b25ZcG9zaXRpb24pO1xuXHRcdFx0XHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRmdW5jdGlvbiBmb3J3YXJkU3RvcCgpIHtcblx0XHRcdFx0Zm9yd2FyZC50cmFuc2Zvcm0oJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdFx0c3RvcEFuaW1hdGlvbigpO1xuXHRcdFx0XHRYRm9yd2FyZCA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gbmV4dFRyYWNrICgpIHtcblxuXHRcdFx0XHRpZihjdXJyZW50VHJhY2sgPT0gKHBsYXlsaXN0Lmxlbmd0aCAtIDEpKXtcblx0XHRcdFx0XHRjdXJyZW50VHJhY2sgPSAwO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQgICAgY3VycmVudFRyYWNrKys7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhdWRpby5zcmMgPSBkaXIrcGxheWxpc3RbY3VycmVudFRyYWNrXStleHQ7XG5cblx0XHRcdFx0dGl0bGVVcGRhdGUoKTtcblxuXG5cdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblxuXHRcdFx0fVxuXG5cblx0XHRcdC8vIHJlYyBmdW5jdGlvblxuXHRcdFx0cmVjLmNsaWNrKGZ1bmN0aW9uKCkge1xuXG5cdFx0XHQgXHRpZiAoIXhSZWMpe1xuXG5cdFx0XHQgXHRcdHJlYy50cmFuc2Zvcm0oJ3QwLjM0NDA1MywgJyArIGJ1dHRvbllwb3NpdGlvbkFjdGl2ZSk7XG5cblx0XHRcdCBcdFx0Ly8gd2hlZWxzIGV2ZW50c1xuXG5cdFx0XHQgXHRcdGlmICghcGxheUFjdGl2ZSkgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXG5cdFx0XHRcdFx0eFJlYyA9IHRydWU7XG5cblx0XHRcdFx0fSAgZWxzZSB7XG5cdFx0XHRcdFx0cmVjU3RvcCgpO1xuXG5cdFx0XHRcdFx0aWYgKCFwbGF5QWN0aXZlKSB7IC8vIGlzIHN0b3BwZWQgb3IgcGF1c2VkXG5cblx0XHRcdFx0XHRcdHN0b3BXaGVlbEFuaW1hdGlvbigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgcmVjIGZ1bmN0aW9uXG5cblx0XHRcdC8vIHBsYXkgZnVuY3Rpb25cblx0XHRcdHBsYXlQYXVzZS5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0IFx0aWYoYXVkaW8ucGF1c2VkKSB7XG5cblx0XHRcdCBcdFx0Ly8gcGxheSBzdGF0ZVxuXG5cdFx0XHQgXHRcdHBsYXlBY3RpdmUgPSB0cnVlO1xuXG5cdFx0XHQgXHRcdHBsYXlTdGF0ZS5hdHRyKFwiZGlzcGxheVwiLCBcIm5vbmVcIik7XG5cdFx0XHQgXHRcdHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJibG9ja1wiKTtcblxuXHRcdFx0IFx0XHRjb25zb2xlLmxvZyhwbGF5QWN0aXZlKTtcblxuXHRcdFx0XHRcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHRcdFx0d2hlZWxBbmltYXRpb24oKTtcblx0XHRcdCBcdFx0fVxuXHRcdFx0XHRcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlKTtcblxuXG5cdFx0XHRcdFx0YXVkaW8ucGxheSgpO1xuXG5cdFx0XHRcdCAgICAvL2F1ZGlvLnBsYXkoKTtcblx0XHRcdFx0ICAgIHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdCAgICB9IGVsc2Uge1xuXG5cdFx0XHQgICAgXHQvLyBwYXVzZSBzdGF0ZVxuXG5cdFx0XHQgICAgXHRwbGF5QWN0aXZlID0gZmFsc2U7XG5cblx0XHRcdCAgICBcdHBhdXNlU3RhdGUuYXR0cihcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRcdFx0ICAgIFx0cGxheVN0YXRlLmF0dHIoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG5cblx0XHRcdCAgICBcdC8vY29uc29sZS5sb2cocGxheUFjdGl2ZSk7XG5cblx0XHRcdFx0ICAgIGF1ZGlvLnBhdXNlKCk7XG5cblx0XHRcdFx0ICBcdGlmICgheFJlYykgeyAvLyBpcyBzdG9wcGVkIG9yIHBhdXNlZFxuXHRcdFx0XHQgIFx0XHRzdG9wV2hlZWxBbmltYXRpb24oKTtcblx0XHRcdFx0ICBcdH1cblx0XHRcdFx0ICBcdHBsYXlQYXVzZS50cmFuc2Zvcm0oJ3QxNjkuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uKTtcblx0XHRcdCAgICB9XG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBwbGF5IGZ1bmN0aW9uXG5cblx0XHRcdC8vIGJhY2t3YXJkIGZ1bmN0aW9uXG5cdFx0XHRiYWNrd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBiYWNrd2FyZC5hbmltYXRlKHsndHJhbnNmb3JtJyA6ICd0ODUuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID4gMCApIHtcblxuXHRcdFx0XHRcdGN1cnJlbnRUcmFjay0tO1xuXG5cblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKCdidyAtIHRoZSBjdXJyZW50IHRyYWNrIGlzOiAnICsgY3VycmVudFRyYWNrKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdCAgICBjdXJyZW50VHJhY2sgPSAocGxheWxpc3QubGVuZ3RoIC0gMSk7XG5cblx0XHRcdFx0ICAgIC8vY29uc29sZS5sb2coJ2J3IC0gdGhlIGN1cnJlbnQgdHJhY2sgaXM6ICcgKyBjdXJyZW50VHJhY2spO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KTtcblx0XHRcdC8vIGVuZCBiYWNrd2FyZCBmdW5jdGlvblxuXHRcdFx0Ly8gZm9yd2FyZCBmdW5jdGlvblxuXHRcdFx0Zm9yd2FyZC5jbGljayhmdW5jdGlvbigpIHtcblxuXHRcdFx0XHQvLyBidXR0b24gYW5pbTFcblx0XHRcdFx0dmFyIGFuaW0xID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9uQWN0aXZlfSwgMjAwLCBtaW5hLmxpbmVhciwgYW5pbTIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIGFuaW0yID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCAgICBmb3J3YXJkLmFuaW1hdGUoeyd0cmFuc2Zvcm0nIDogJ3QyNTMuMzQ0MDUzLCAnICsgYnV0dG9uWXBvc2l0aW9ufSwgMjAwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFuaW0xKCk7XG5cblx0XHRcdFx0aWYoY3VycmVudFRyYWNrID09IChwbGF5bGlzdC5sZW5ndGggLSAxKSl7XG5cdFx0XHRcdFx0Y3VycmVudFRyYWNrID0gMDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ICAgIGN1cnJlbnRUcmFjaysrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9jb25zb2xlLmxvZygnZncgLSB0aGUgY3VycmVudCB0cmFjayBpczogJyArIGN1cnJlbnRUcmFjayk7XG5cblx0XHRcdFx0YXVkaW8uc3JjID0gZGlyK3BsYXlsaXN0W2N1cnJlbnRUcmFja10rZXh0O1xuXG5cdFx0XHRcdHRpdGxlVXBkYXRlKCk7XG5cblx0XHRcdFx0aWYgKHBsYXlBY3RpdmUpIHsgLy8gaWYgaXMgcGxheWluZ1xuXHRcdFx0XHRcdGF1ZGlvLnBsYXkoKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0XHQvLyBlbmQgZm9yd2FyZCBmdW5jdGlvblxuXG5cdFx0XHRmdW5jdGlvbiBzZWVrKGV2ZW50KXtcblx0XHRcdCAgICBpZihzZWVraW5nKXtcblx0XHRcdFx0ICAgIHRhcGUudHJhbnNmb3JtKCd0NDMuNzA5MTEwLCAwLjY4MDI5MScpO1xuXHRcdFx0ICAgICAgICAvL3NlZWt0byA9IGF1ZGlvLmR1cmF0aW9uICogKHNlZWtzbGlkZXIudmFsdWUgLyAxMDApO1xuXHRcdFx0ICAgICAgICAvL2F1ZGlvLmN1cnJlbnRUaW1lID0gc2Vla3RvO1xuXHRcdFx0ICAgIH1cblx0XHQgICAgfVxuXG5cdFx0ICAgIGZ1bmN0aW9uIHRpbWVVcGRhdGUoKXtcblx0XHRcdFx0dmFyIG50ID0gYXVkaW8uY3VycmVudFRpbWUgKiAoMTAwIC8gYXVkaW8uZHVyYXRpb24pO1xuXG5cdFx0XHRcdHZhciB0YXBlWCA9IDQzLjcwOTExMCAqIChhdWRpby5jdXJyZW50VGltZSAvIDEwMCk7XG5cblxuXHRcdFx0XHR0YXBlUlZhbHVlID0gKGF1ZGlvLmN1cnJlbnRUaW1lIC8gMi4yKTtcblx0XHRcdFx0dGFwZUxWYWx1ZSA9IChhdWRpby5kdXJhdGlvbiAvIDIuMikgLSAoYXVkaW8uY3VycmVudFRpbWUgLyAyLjIpO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdkdXJhdGlvbiAnICsgYXVkaW8uZHVyYXRpb24pO1xuXHRcdFx0XHRjb25zb2xlLmxvZygndGFwZVJWYWx1ZSAnICsgdGFwZVJWYWx1ZSk7XG5cblx0XHRcdFx0dGFwZUwuYW5pbWF0ZSh7cng6IHRhcGVMVmFsdWUsIHJ5OiB0YXBlTFZhbHVlfSwgNTAwLCBtaW5hLmxpbmVhcilcblx0XHRcdFx0dGFwZVIuYW5pbWF0ZSh7cng6IHRhcGVSVmFsdWUsIHJ5OiB0YXBlUlZhbHVlfSwgNTAwLCBtaW5hLmxpbmVhcilcblxuXG5cdFx0XHRcdHZhciBjdXJtaW5zID0gTWF0aC5mbG9vcihhdWRpby5jdXJyZW50VGltZSAvIDYwKTtcblx0XHRcdCAgICB2YXIgY3Vyc2VjcyA9IE1hdGguZmxvb3IoYXVkaW8uY3VycmVudFRpbWUgLSBjdXJtaW5zICogNjApO1xuXG5cdFx0XHRcdGlmKGN1cnNlY3MgPCAxMCl7IGN1cnNlY3MgPSBcIjBcIitjdXJzZWNzOyB9XG5cblx0XHRcdCAgICBpZihjdXJtaW5zIDwgMTApeyBjdXJtaW5zID0gXCIwXCIrY3VybWluczsgfVxuXG5cdFx0XHRcdGN1cnRpbWV0ZXh0Lm5vZGUuaW5uZXJIVE1MID0gY3VybWlucytcIjpcIitjdXJzZWNzO1xuXG5cblx0XHRcdH1cblx0XHRcdGZ1bmN0aW9uIHRpbWVEdXJVcGRhdGUoKXtcblx0XHRcdFx0Ly90YXBlTCBpbml0XG5cdFx0XHRcdHRhcGVMVmFsdWUgPSAoYXVkaW8uZHVyYXRpb24gLyAyLjIpO1xuXHRcdFx0XHR0YXBlTC5hbmltYXRlKHtyeDogdGFwZUxWYWx1ZSwgcnk6IHRhcGVMVmFsdWV9LCA1MDAsIG1pbmEubGluZWFyKVxuXG5cdFx0XHRcdHZhciBkdXJtaW5zID0gTWF0aC5mbG9vcihhdWRpby5kdXJhdGlvbiAvIDYwKTtcblx0XHRcdCAgICB2YXIgZHVyc2VjcyA9IE1hdGguZmxvb3IoYXVkaW8uZHVyYXRpb24gLSBkdXJtaW5zICogNjApO1xuXHRcdFx0XHRpZihkdXJzZWNzIDwgMTApeyBkdXJzZWNzID0gXCIwXCIrZHVyc2VjczsgfVxuXHRcdFx0XHRpZihkdXJtaW5zIDwgMTApeyBkdXJtaW5zID0gXCIwXCIrZHVybWluczsgfVxuXG5cdFx0XHRcdGlmKGF1ZGlvLmR1cmF0aW9uKSB7XG5cdFx0XHRcdFx0ZHVydGltZXRleHQubm9kZS5pbm5lckhUTUwgPSBkdXJtaW5zK1wiOlwiK2R1cnNlY3M7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZHVydGltZXRleHQubm9kZS5pbm5lckhUTUwgPSBcIjA6MDBcIjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZnVuY3Rpb24gdGl0bGVVcGRhdGUoKXtcblx0XHRcdFx0dHJhY2t0aXRsZS5ub2RlLmlubmVySFRNTCA9IHBsYXlsaXN0W2N1cnJlbnRUcmFja107XG5cdFx0XHR9XG4iLCIoZnVuY3Rpb24oZil7aWYodHlwZW9mIGV4cG9ydHM9PT1cIm9iamVjdFwiJiZ0eXBlb2YgbW9kdWxlIT09XCJ1bmRlZmluZWRcIil7bW9kdWxlLmV4cG9ydHM9ZigpfWVsc2UgaWYodHlwZW9mIGRlZmluZT09PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZCl7ZGVmaW5lKFtdLGYpfWVsc2V7dmFyIGc7aWYodHlwZW9mIHdpbmRvdyE9PVwidW5kZWZpbmVkXCIpe2c9d2luZG93fWVsc2UgaWYodHlwZW9mIGdsb2JhbCE9PVwidW5kZWZpbmVkXCIpe2c9Z2xvYmFsfWVsc2UgaWYodHlwZW9mIHNlbGYhPT1cInVuZGVmaW5lZFwiKXtnPXNlbGZ9ZWxzZXtnPXRoaXN9Zy5SZWNvcmRlciA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3JlY29yZGVyXCIpLlJlY29yZGVyO1xuXG59LHtcIi4vcmVjb3JkZXJcIjoyfV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO2Rlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7aWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgICAgIH1cbiAgICB9cmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICAgICAgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtyZXR1cm4gQ29uc3RydWN0b3I7XG4gICAgfTtcbn0pKCk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuUmVjb3JkZXIgPSB1bmRlZmluZWQ7XG5cbnZhciBfaW5saW5lV29ya2VyID0gcmVxdWlyZSgnaW5saW5lLXdvcmtlcicpO1xuXG52YXIgX2lubGluZVdvcmtlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pbmxpbmVXb3JrZXIpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikge1xuICAgIHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9O1xufVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgICB9XG59XG5cbnZhciBSZWNvcmRlciA9IGV4cG9ydHMuUmVjb3JkZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlY29yZGVyKHNvdXJjZSwgY2ZnKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlY29yZGVyKTtcblxuICAgICAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgICAgICAgIGJ1ZmZlckxlbjogNDA5NixcbiAgICAgICAgICAgIG51bUNoYW5uZWxzOiAyLFxuICAgICAgICAgICAgbWltZVR5cGU6ICdhdWRpby93YXYnXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucmVjb3JkaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzID0ge1xuICAgICAgICAgICAgZ2V0QnVmZmVyOiBbXSxcbiAgICAgICAgICAgIGV4cG9ydFdBVjogW11cbiAgICAgICAgfTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuY29uZmlnLCBjZmcpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBzb3VyY2UuY29udGV4dDtcbiAgICAgICAgdGhpcy5ub2RlID0gKHRoaXMuY29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IgfHwgdGhpcy5jb250ZXh0LmNyZWF0ZUphdmFTY3JpcHROb2RlKS5jYWxsKHRoaXMuY29udGV4dCwgdGhpcy5jb25maWcuYnVmZmVyTGVuLCB0aGlzLmNvbmZpZy5udW1DaGFubmVscywgdGhpcy5jb25maWcubnVtQ2hhbm5lbHMpO1xuXG4gICAgICAgIHRoaXMubm9kZS5vbmF1ZGlvcHJvY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoIV90aGlzLnJlY29yZGluZykgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgYnVmZmVyID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBjaGFubmVsID0gMDsgY2hhbm5lbCA8IF90aGlzLmNvbmZpZy5udW1DaGFubmVsczsgY2hhbm5lbCsrKSB7XG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goZS5pbnB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YShjaGFubmVsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy53b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGNvbW1hbmQ6ICdyZWNvcmQnLFxuICAgICAgICAgICAgICAgIGJ1ZmZlcjogYnVmZmVyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2UuY29ubmVjdCh0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLm5vZGUuY29ubmVjdCh0aGlzLmNvbnRleHQuZGVzdGluYXRpb24pOyAvL3RoaXMgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnlcblxuICAgICAgICB2YXIgc2VsZiA9IHt9O1xuICAgICAgICB0aGlzLndvcmtlciA9IG5ldyBfaW5saW5lV29ya2VyMi5kZWZhdWx0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZWNMZW5ndGggPSAwLFxuICAgICAgICAgICAgICAgIHJlY0J1ZmZlcnMgPSBbXSxcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIG51bUNoYW5uZWxzID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBzZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChlLmRhdGEuY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdpbml0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXQoZS5kYXRhLmNvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncmVjb3JkJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY29yZChlLmRhdGEuYnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdleHBvcnRXQVYnOlxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0V0FWKGUuZGF0YS50eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdnZXRCdWZmZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0QnVmZmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2xlYXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgc2FtcGxlUmF0ZSA9IGNvbmZpZy5zYW1wbGVSYXRlO1xuICAgICAgICAgICAgICAgIG51bUNoYW5uZWxzID0gY29uZmlnLm51bUNoYW5uZWxzO1xuICAgICAgICAgICAgICAgIGluaXRCdWZmZXJzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlY29yZChpbnB1dEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgbnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgICAgICByZWNCdWZmZXJzW2NoYW5uZWxdLnB1c2goaW5wdXRCdWZmZXJbY2hhbm5lbF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZWNMZW5ndGggKz0gaW5wdXRCdWZmZXJbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBleHBvcnRXQVYodHlwZSkge1xuICAgICAgICAgICAgICAgIHZhciBidWZmZXJzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCBudW1DaGFubmVsczsgY2hhbm5lbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcnMucHVzaChtZXJnZUJ1ZmZlcnMocmVjQnVmZmVyc1tjaGFubmVsXSwgcmVjTGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpbnRlcmxlYXZlZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAobnVtQ2hhbm5lbHMgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJsZWF2ZWQgPSBpbnRlcmxlYXZlKGJ1ZmZlcnNbMF0sIGJ1ZmZlcnNbMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGludGVybGVhdmVkID0gYnVmZmVyc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGRhdGF2aWV3ID0gZW5jb2RlV0FWKGludGVybGVhdmVkKTtcbiAgICAgICAgICAgICAgICB2YXIgYXVkaW9CbG9iID0gbmV3IEJsb2IoW2RhdGF2aWV3XSwgeyB0eXBlOiB0eXBlIH0pO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGNvbW1hbmQ6ICdleHBvcnRXQVYnLCBkYXRhOiBhdWRpb0Jsb2IgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEJ1ZmZlcigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVycyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgbnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgICAgICBidWZmZXJzLnB1c2gobWVyZ2VCdWZmZXJzKHJlY0J1ZmZlcnNbY2hhbm5lbF0sIHJlY0xlbmd0aCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgY29tbWFuZDogJ2dldEJ1ZmZlcicsIGRhdGE6IGJ1ZmZlcnMgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICAgICAgICAgICAgIHJlY0xlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgcmVjQnVmZmVycyA9IFtdO1xuICAgICAgICAgICAgICAgIGluaXRCdWZmZXJzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluaXRCdWZmZXJzKCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgbnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgICAgICByZWNCdWZmZXJzW2NoYW5uZWxdID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBtZXJnZUJ1ZmZlcnMocmVjQnVmZmVycywgcmVjTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkocmVjTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY0J1ZmZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNldChyZWNCdWZmZXJzW2ldLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gcmVjQnVmZmVyc1tpXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGludGVybGVhdmUoaW5wdXRMLCBpbnB1dFIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gaW5wdXRMLmxlbmd0aCArIGlucHV0Ui5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGlucHV0SW5kZXggPSAwO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtpbmRleCsrXSA9IGlucHV0TFtpbnB1dEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2luZGV4KytdID0gaW5wdXRSW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dEluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZsb2F0VG8xNkJpdFBDTShvdXRwdXQsIG9mZnNldCwgaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrLCBvZmZzZXQgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9IE1hdGgubWF4KC0xLCBNYXRoLm1pbigxLCBpbnB1dFtpXSkpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc2V0SW50MTYob2Zmc2V0LCBzIDwgMCA/IHMgKiAweDgwMDAgOiBzICogMHg3RkZGLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdyaXRlU3RyaW5nKHZpZXcsIG9mZnNldCwgc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQgKyBpLCBzdHJpbmcuY2hhckNvZGVBdChpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBlbmNvZGVXQVYoc2FtcGxlcykge1xuICAgICAgICAgICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQgKyBzYW1wbGVzLmxlbmd0aCAqIDIpO1xuICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cbiAgICAgICAgICAgICAgICAvKiBSSUZGIGlkZW50aWZpZXIgKi9cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmluZyh2aWV3LCAwLCAnUklGRicpO1xuICAgICAgICAgICAgICAgIC8qIFJJRkYgY2h1bmsgbGVuZ3RoICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoNCwgMzYgKyBzYW1wbGVzLmxlbmd0aCAqIDIsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIFJJRkYgdHlwZSAqL1xuICAgICAgICAgICAgICAgIHdyaXRlU3RyaW5nKHZpZXcsIDgsICdXQVZFJyk7XG4gICAgICAgICAgICAgICAgLyogZm9ybWF0IGNodW5rIGlkZW50aWZpZXIgKi9cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmluZyh2aWV3LCAxMiwgJ2ZtdCAnKTtcbiAgICAgICAgICAgICAgICAvKiBmb3JtYXQgY2h1bmsgbGVuZ3RoICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBzYW1wbGUgZm9ybWF0IChyYXcpICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGNoYW5uZWwgY291bnQgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigyMiwgbnVtQ2hhbm5lbHMsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIHNhbXBsZSByYXRlICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMjQsIHNhbXBsZVJhdGUsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGJ5dGUgcmF0ZSAoc2FtcGxlIHJhdGUgKiBibG9jayBhbGlnbikgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMigyOCwgc2FtcGxlUmF0ZSAqIDQsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGJsb2NrIGFsaWduIChjaGFubmVsIGNvdW50ICogYnl0ZXMgcGVyIHNhbXBsZSkgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigzMiwgbnVtQ2hhbm5lbHMgKiAyLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBiaXRzIHBlciBzYW1wbGUgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigzNCwgMTYsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGRhdGEgY2h1bmsgaWRlbnRpZmllciAqL1xuICAgICAgICAgICAgICAgIHdyaXRlU3RyaW5nKHZpZXcsIDM2LCAnZGF0YScpO1xuICAgICAgICAgICAgICAgIC8qIGRhdGEgY2h1bmsgbGVuZ3RoICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoNDAsIHNhbXBsZXMubGVuZ3RoICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBmbG9hdFRvMTZCaXRQQ00odmlldywgNDQsIHNhbXBsZXMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHNlbGYpO1xuXG4gICAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGNvbW1hbmQ6ICdpbml0JyxcbiAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICAgIHNhbXBsZVJhdGU6IHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLFxuICAgICAgICAgICAgICAgIG51bUNoYW5uZWxzOiB0aGlzLmNvbmZpZy5udW1DaGFubmVsc1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIGNiID0gX3RoaXMuY2FsbGJhY2tzW2UuZGF0YS5jb21tYW5kXS5wb3AoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNiKGUuZGF0YS5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoUmVjb3JkZXIsIFt7XG4gICAgICAgIGtleTogJ3JlY29yZCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZWNvcmQoKSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3N0b3AnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3JkaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2NsZWFyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoeyBjb21tYW5kOiAnY2xlYXInIH0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdnZXRCdWZmZXInLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QnVmZmVyKGNiKSB7XG4gICAgICAgICAgICBjYiA9IGNiIHx8IHRoaXMuY29uZmlnLmNhbGxiYWNrO1xuICAgICAgICAgICAgaWYgKCFjYikgdGhyb3cgbmV3IEVycm9yKCdDYWxsYmFjayBub3Qgc2V0Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLmdldEJ1ZmZlci5wdXNoKGNiKTtcblxuICAgICAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoeyBjb21tYW5kOiAnZ2V0QnVmZmVyJyB9KTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnZXhwb3J0V0FWJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGV4cG9ydFdBVihjYiwgbWltZVR5cGUpIHtcbiAgICAgICAgICAgIG1pbWVUeXBlID0gbWltZVR5cGUgfHwgdGhpcy5jb25maWcubWltZVR5cGU7XG4gICAgICAgICAgICBjYiA9IGNiIHx8IHRoaXMuY29uZmlnLmNhbGxiYWNrO1xuICAgICAgICAgICAgaWYgKCFjYikgdGhyb3cgbmV3IEVycm9yKCdDYWxsYmFjayBub3Qgc2V0Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLmV4cG9ydFdBVi5wdXNoKGNiKTtcblxuICAgICAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGNvbW1hbmQ6ICdleHBvcnRXQVYnLFxuICAgICAgICAgICAgICAgIHR5cGU6IG1pbWVUeXBlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6ICdmb3JjZURvd25sb2FkJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZvcmNlRG93bmxvYWQoYmxvYiwgZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSAod2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgICB2YXIgbGluayA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBsaW5rLmhyZWYgPSB1cmw7XG4gICAgICAgICAgICBsaW5rLmRvd25sb2FkID0gZmlsZW5hbWUgfHwgJ291dHB1dC53YXYnO1xuICAgICAgICAgICAgdmFyIGNsaWNrID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICAgICAgICAgIGNsaWNrLmluaXRFdmVudChcImNsaWNrXCIsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgbGluay5kaXNwYXRjaEV2ZW50KGNsaWNrKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBSZWNvcmRlcjtcbn0pKCk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IFJlY29yZGVyO1xuXG59LHtcImlubGluZS13b3JrZXJcIjozfV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmxpbmUtd29ya2VyXCIpO1xufSx7XCIuL2lubGluZS13b3JrZXJcIjo0fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4oZnVuY3Rpb24gKGdsb2JhbCl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHsgdmFyIHByb3AgPSBwcm9wc1trZXldOyBwcm9wLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChwcm9wLnZhbHVlKSBwcm9wLndyaXRhYmxlID0gdHJ1ZTsgfSBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKTsgfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH07XG5cbnZhciBXT1JLRVJfRU5BQkxFRCA9ICEhKGdsb2JhbCA9PT0gZ2xvYmFsLndpbmRvdyAmJiBnbG9iYWwuVVJMICYmIGdsb2JhbC5CbG9iICYmIGdsb2JhbC5Xb3JrZXIpO1xuXG52YXIgSW5saW5lV29ya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gSW5saW5lV29ya2VyKGZ1bmMsIHNlbGYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIElubGluZVdvcmtlcik7XG5cbiAgICBpZiAoV09SS0VSX0VOQUJMRUQpIHtcbiAgICAgIHZhciBmdW5jdGlvbkJvZHkgPSBmdW5jLnRvU3RyaW5nKCkudHJpbSgpLm1hdGNoKC9eZnVuY3Rpb25cXHMqXFx3KlxccypcXChbXFx3XFxzLF0qXFwpXFxzKnsoW1xcd1xcV10qPyl9JC8pWzFdO1xuICAgICAgdmFyIHVybCA9IGdsb2JhbC5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBnbG9iYWwuQmxvYihbZnVuY3Rpb25Cb2R5XSwgeyB0eXBlOiBcInRleHQvamF2YXNjcmlwdFwiIH0pKTtcblxuICAgICAgcmV0dXJuIG5ldyBnbG9iYWwuV29ya2VyKHVybCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZWxmID0gc2VsZjtcbiAgICB0aGlzLnNlbGYucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIF90aGlzLm9ubWVzc2FnZSh7IGRhdGE6IGRhdGEgfSk7XG4gICAgICB9LCAwKTtcbiAgICB9O1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBmdW5jLmNhbGwoc2VsZik7XG4gICAgfSwgMCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoSW5saW5lV29ya2VyLCB7XG4gICAgcG9zdE1lc3NhZ2U6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBwb3N0TWVzc2FnZShkYXRhKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgX3RoaXMuc2VsZi5vbm1lc3NhZ2UoeyBkYXRhOiBkYXRhIH0pO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBJbmxpbmVXb3JrZXI7XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElubGluZVdvcmtlcjtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxufSx7fV19LHt9LFsxXSkoMSlcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==