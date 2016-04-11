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

// Snap.svg 0.4.1
//
// Copyright (c) 2013 – 2015 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// build: 2015-04-13

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.4.2 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.4.2",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        comaseparator = /\s*,\s*/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
        firstDefined = function () {
            for (var i = 0, ii = this.length; i < ii; i++) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
        lastDefined = function () {
            var i = this.length;
            while (--i) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
    /*\
     * eve
     [ method ]

     * Fires event with given `name`, given scope and other parameters.

     > Arguments

     - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
     - scope (object) context for the event handlers
     - varargs (...) the rest of arguments will be sent to event handlers

     = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
    \*/
        eve = function (name, scope) {
            name = String(name);
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            out.firstDefined = firstDefined;
            out.lastDefined = lastDefined;
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out;
        };
        // Undocumented. Debug only.
        eve._events = events;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     > Arguments

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment. 
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f) {
        name = String(name);
        if (typeof f != "function") {
            return function () {};
        }
        var names = name.split(comaseparator);
        for (var i = 0, ii = names.length; i < ii; i++) {
            (function (name) {
                var names = name.split(separator),
                    e = events,
                    exist;
                for (var i = 0, ii = names.length; i < ii; i++) {
                    e = e.n;
                    e = e.hasOwnProperty(names[i]) && e[names[i]] || (e[names[i]] = {n: {}});
                }
                e.f = e.f || [];
                for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
                    exist = true;
                    break;
                }
                !exist && e.f.push(f);
            }(names[i]));
        }
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
     > Arguments
     - event (string) event name
     - varargs (…) and any other arguments
     = (function) possible event handler function
    \*/
    eve.f = function (event) {
        var attrs = [].slice.call(arguments, 1);
        return function () {
            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     > Arguments
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f) {
        if (!name) {
            eve._events = events = {n: {}};
            return;
        }
        var names = name.split(comaseparator);
        if (names.length > 1) {
            for (var i = 0, ii = names.length; i < ii; i++) {
                eve.off(names[i], f);
            }
            return;
        }
        names = name.split(separator);
        var e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     > Arguments
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f) {
        var f2 = function () {
            eve.unbind(name, f2);
            return f.apply(this, arguments);
        };
        return eve.on(name, f2);
    };
    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define === "function" && define.amd ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);

(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module
        define(["eve"], function (eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != 'undefined') {
        // Next for Node.js or CommonJS
        var eve = require('eve');
        module.exports = factory(glob, eve);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        factory(glob, glob.eve);
    }
}(window || this, function (window, eve) {

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
var mina = (function (eve) {
    var animations = {},
    requestAnimFrame = window.requestAnimationFrame       ||
                       window.webkitRequestAnimationFrame ||
                       window.mozRequestAnimationFrame    ||
                       window.oRequestAnimationFrame      ||
                       window.msRequestAnimationFrame     ||
                       function (callback) {
                           setTimeout(callback, 16);
                       },
    isArray = Array.isArray || function (a) {
        return a instanceof Array ||
            Object.prototype.toString.call(a) == "[object Array]";
    },
    idgen = 0,
    idprefix = "M" + (+new Date).toString(36),
    ID = function () {
        return idprefix + (idgen++).toString(36);
    },
    diff = function (a, b, A, B) {
        if (isArray(a)) {
            res = [];
            for (var i = 0, ii = a.length; i < ii; i++) {
                res[i] = diff(a[i], b, A[i], B);
            }
            return res;
        }
        var dif = (A - a) / (B - b);
        return function (bb) {
            return a + dif * (bb - b);
        };
    },
    timer = Date.now || function () {
        return +new Date;
    },
    sta = function (val) {
        var a = this;
        if (val == null) {
            return a.s;
        }
        var ds = a.s - val;
        a.b += a.dur * ds;
        a.B += a.dur * ds;
        a.s = val;
    },
    speed = function (val) {
        var a = this;
        if (val == null) {
            return a.spd;
        }
        a.spd = val;
    },
    duration = function (val) {
        var a = this;
        if (val == null) {
            return a.dur;
        }
        a.s = a.s * val / a.dur;
        a.dur = val;
    },
    stopit = function () {
        var a = this;
        delete animations[a.id];
        a.update();
        eve("mina.stop." + a.id, a);
    },
    pause = function () {
        var a = this;
        if (a.pdif) {
            return;
        }
        delete animations[a.id];
        a.update();
        a.pdif = a.get() - a.b;
    },
    resume = function () {
        var a = this;
        if (!a.pdif) {
            return;
        }
        a.b = a.get() - a.pdif;
        delete a.pdif;
        animations[a.id] = a;
    },
    update = function () {
        var a = this,
            res;
        if (isArray(a.start)) {
            res = [];
            for (var j = 0, jj = a.start.length; j < jj; j++) {
                res[j] = +a.start[j] +
                    (a.end[j] - a.start[j]) * a.easing(a.s);
            }
        } else {
            res = +a.start + (a.end - a.start) * a.easing(a.s);
        }
        a.set(res);
    },
    frame = function () {
        var len = 0;
        for (var i in animations) if (animations.hasOwnProperty(i)) {
            var a = animations[i],
                b = a.get(),
                res;
            len++;
            a.s = (b - a.b) / (a.dur / a.spd);
            if (a.s >= 1) {
                delete animations[i];
                a.s = 1;
                len--;
                (function (a) {
                    setTimeout(function () {
                        eve("mina.finish." + a.id, a);
                    });
                }(a));
            }
            a.update();
        }
        len && requestAnimFrame(frame);
    },
    /*\
     * mina
     [ method ]
     **
     * Generic animation of numbers
     **
     - a (number) start _slave_ number
     - A (number) end _slave_ number
     - b (number) start _master_ number (start time in general case)
     - B (number) end _master_ number (end time in gereal case)
     - get (function) getter of _master_ number (see @mina.time)
     - set (function) setter of _slave_ number
     - easing (function) #optional easing function, default is @mina.linear
     = (object) animation descriptor
     o {
     o         id (string) animation id,
     o         start (number) start _slave_ number,
     o         end (number) end _slave_ number,
     o         b (number) start _master_ number,
     o         s (number) animation status (0..1),
     o         dur (number) animation duration,
     o         spd (number) animation speed,
     o         get (function) getter of _master_ number (see @mina.time),
     o         set (function) setter of _slave_ number,
     o         easing (function) easing function, default is @mina.linear,
     o         status (function) status getter/setter,
     o         speed (function) speed getter/setter,
     o         duration (function) duration getter/setter,
     o         stop (function) animation stopper
     o         pause (function) pauses the animation
     o         resume (function) resumes the animation
     o         update (function) calles setter with the right value of the animation
     o }
    \*/
    mina = function (a, A, b, B, get, set, easing) {
        var anim = {
            id: ID(),
            start: a,
            end: A,
            b: b,
            s: 0,
            dur: B - b,
            spd: 1,
            get: get,
            set: set,
            easing: easing || mina.linear,
            status: sta,
            speed: speed,
            duration: duration,
            stop: stopit,
            pause: pause,
            resume: resume,
            update: update
        };
        animations[anim.id] = anim;
        var len = 0, i;
        for (i in animations) if (animations.hasOwnProperty(i)) {
            len++;
            if (len == 2) {
                break;
            }
        }
        len == 1 && requestAnimFrame(frame);
        return anim;
    };
    /*\
     * mina.time
     [ method ]
     **
     * Returns the current time. Equivalent to:
     | function () {
     |     return (new Date).getTime();
     | }
    \*/
    mina.time = timer;
    /*\
     * mina.getById
     [ method ]
     **
     * Returns an animation by its id
     - id (string) animation's id
     = (object) See @mina
    \*/
    mina.getById = function (id) {
        return animations[id] || null;
    };

    /*\
     * mina.linear
     [ method ]
     **
     * Default linear easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.linear = function (n) {
        return n;
    };
    /*\
     * mina.easeout
     [ method ]
     **
     * Easeout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easeout = function (n) {
        return Math.pow(n, 1.7);
    };
    /*\
     * mina.easein
     [ method ]
     **
     * Easein easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easein = function (n) {
        return Math.pow(n, .48);
    };
    /*\
     * mina.easeinout
     [ method ]
     **
     * Easeinout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easeinout = function (n) {
        if (n == 1) {
            return 1;
        }
        if (n == 0) {
            return 0;
        }
        var q = .48 - n / 1.04,
            Q = Math.sqrt(.1734 + q * q),
            x = Q - q,
            X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1),
            y = -Q - q,
            Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1),
            t = X + Y + .5;
        return (1 - t) * 3 * t * t + t * t * t;
    };
    /*\
     * mina.backin
     [ method ]
     **
     * Backin easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backin = function (n) {
        if (n == 1) {
            return 1;
        }
        var s = 1.70158;
        return n * n * ((s + 1) * n - s);
    };
    /*\
     * mina.backout
     [ method ]
     **
     * Backout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backout = function (n) {
        if (n == 0) {
            return 0;
        }
        n = n - 1;
        var s = 1.70158;
        return n * n * ((s + 1) * n + s) + 1;
    };
    /*\
     * mina.elastic
     [ method ]
     **
     * Elastic easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.elastic = function (n) {
        if (n == !!n) {
            return n;
        }
        return Math.pow(2, -10 * n) * Math.sin((n - .075) *
            (2 * Math.PI) / .3) + 1;
    };
    /*\
     * mina.bounce
     [ method ]
     **
     * Bounce easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.bounce = function (n) {
        var s = 7.5625,
            p = 2.75,
            l;
        if (n < (1 / p)) {
            l = s * n * n;
        } else {
            if (n < (2 / p)) {
                n -= (1.5 / p);
                l = s * n * n + .75;
            } else {
                if (n < (2.5 / p)) {
                    n -= (2.25 / p);
                    l = s * n * n + .9375;
                } else {
                    n -= (2.625 / p);
                    l = s * n * n + .984375;
                }
            }
        }
        return l;
    };
    window.mina = mina;
    return mina;
})(typeof eve == "undefined" ? function () {} : eve);
// Copyright (c) 2013 - 2015 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var Snap = (function(root) {
Snap.version = "0.4.0";
/*\
 * Snap
 [ method ]
 **
 * Creates a drawing surface or wraps existing SVG element.
 **
 - width (number|string) width of surface
 - height (number|string) height of surface
 * or
 - DOM (SVGElement) element to be wrapped into Snap structure
 * or
 - array (array) array of elements (will return set of elements)
 * or
 - query (string) CSS query selector
 = (object) @Element
\*/
function Snap(w, h) {
    if (w) {
        if (w.nodeType) {
            return wrap(w);
        }
        if (is(w, "array") && Snap.set) {
            return Snap.set.apply(Snap, w);
        }
        if (w instanceof Element) {
            return w;
        }
        if (h == null) {
            w = glob.doc.querySelector(String(w));
            return wrap(w);
        }
    }
    w = w == null ? "100%" : w;
    h = h == null ? "100%" : h;
    return new Paper(w, h);
}
Snap.toString = function () {
    return "Snap v" + this.version;
};
Snap._ = {};
var glob = {
    win: root.window,
    doc: root.window.document
};
Snap._.glob = glob;
var has = "hasOwnProperty",
    Str = String,
    toFloat = parseFloat,
    toInt = parseInt,
    math = Math,
    mmax = math.max,
    mmin = math.min,
    abs = math.abs,
    pow = math.pow,
    PI = math.PI,
    round = math.round,
    E = "",
    S = " ",
    objectToString = Object.prototype.toString,
    ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i,
    colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i,
    bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
    reURLValue = /^url\(#?([^)]+)\)$/,
    separator = Snap._.separator = /[,\s]+/,
    whitespace = /[\s]/g,
    commaSpaces = /[\s]*,[\s]*/,
    hsrg = {hs: 1, rg: 1},
    pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
    tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig,
    pathValues = /(-?\d*\.?\d*(?:e[\-+]?\\d+)?)[\s]*,?[\s]*/ig,
    idgen = 0,
    idprefix = "S" + (+new Date).toString(36),
    ID = function (el) {
        return (el && el.type ? el.type : E) + idprefix + (idgen++).toString(36);
    },
    xlink = "http://www.w3.org/1999/xlink",
    xmlns = "http://www.w3.org/2000/svg",
    hub = {},
    URL = Snap.url = function (url) {
        return "url('#" + url + "')";
    };

function $(el, attr) {
    if (attr) {
        if (el == "#text") {
            el = glob.doc.createTextNode(attr.text || attr["#text"] || "");
        }
        if (el == "#comment") {
            el = glob.doc.createComment(attr.text || attr["#text"] || "");
        }
        if (typeof el == "string") {
            el = $(el);
        }
        if (typeof attr == "string") {
            if (el.nodeType == 1) {
                if (attr.substring(0, 6) == "xlink:") {
                    return el.getAttributeNS(xlink, attr.substring(6));
                }
                if (attr.substring(0, 4) == "xml:") {
                    return el.getAttributeNS(xmlns, attr.substring(4));
                }
                return el.getAttribute(attr);
            } else if (attr == "text") {
                return el.nodeValue;
            } else {
                return null;
            }
        }
        if (el.nodeType == 1) {
            for (var key in attr) if (attr[has](key)) {
                var val = Str(attr[key]);
                if (val) {
                    if (key.substring(0, 6) == "xlink:") {
                        el.setAttributeNS(xlink, key.substring(6), val);
                    } else if (key.substring(0, 4) == "xml:") {
                        el.setAttributeNS(xmlns, key.substring(4), val);
                    } else {
                        el.setAttribute(key, val);
                    }
                } else {
                    el.removeAttribute(key);
                }
            }
        } else if ("text" in attr) {
            el.nodeValue = attr.text;
        }
    } else {
        el = glob.doc.createElementNS(xmlns, el);
    }
    return el;
}
Snap._.$ = $;
Snap._.id = ID;
function getAttrs(el) {
    var attrs = el.attributes,
        name,
        out = {};
    for (var i = 0; i < attrs.length; i++) {
        if (attrs[i].namespaceURI == xlink) {
            name = "xlink:";
        } else {
            name = "";
        }
        name += attrs[i].name;
        out[name] = attrs[i].textContent;
    }
    return out;
}
function is(o, type) {
    type = Str.prototype.toLowerCase.call(type);
    if (type == "finite") {
        return isFinite(o);
    }
    if (type == "array" &&
        (o instanceof Array || Array.isArray && Array.isArray(o))) {
        return true;
    }
    return  (type == "null" && o === null) ||
            (type == typeof o && o !== null) ||
            (type == "object" && o === Object(o)) ||
            objectToString.call(o).slice(8, -1).toLowerCase() == type;
}
/*\
 * Snap.format
 [ method ]
 **
 * Replaces construction of type `{<name>}` to the corresponding argument
 **
 - token (string) string to format
 - json (object) object which properties are used as a replacement
 = (string) formatted string
 > Usage
 | // this draws a rectangular shape equivalent to "M10,20h40v50h-40z"
 | paper.path(Snap.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
 |     x: 10,
 |     y: 20,
 |     dim: {
 |         width: 40,
 |         height: 50,
 |         "negative width": -40
 |     }
 | }));
\*/
Snap.format = (function () {
    var tokenRegex = /\{([^\}]+)\}/g,
        objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
        replacer = function (all, key, obj) {
            var res = obj;
            key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                name = name || quotedName;
                if (res) {
                    if (name in res) {
                        res = res[name];
                    }
                    typeof res == "function" && isFunc && (res = res());
                }
            });
            res = (res == null || res == obj ? all : res) + "";
            return res;
        };
    return function (str, obj) {
        return Str(str).replace(tokenRegex, function (all, key) {
            return replacer(all, key, obj);
        });
    };
})();
function clone(obj) {
    if (typeof obj == "function" || Object(obj) !== obj) {
        return obj;
    }
    var res = new obj.constructor;
    for (var key in obj) if (obj[has](key)) {
        res[key] = clone(obj[key]);
    }
    return res;
}
Snap._.clone = clone;
function repush(array, item) {
    for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
        return array.push(array.splice(i, 1)[0]);
    }
}
function cacher(f, scope, postprocessor) {
    function newf() {
        var arg = Array.prototype.slice.call(arguments, 0),
            args = arg.join("\u2400"),
            cache = newf.cache = newf.cache || {},
            count = newf.count = newf.count || [];
        if (cache[has](args)) {
            repush(count, args);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        count.length >= 1e3 && delete cache[count.shift()];
        count.push(args);
        cache[args] = f.apply(scope, arg);
        return postprocessor ? postprocessor(cache[args]) : cache[args];
    }
    return newf;
}
Snap._.cacher = cacher;
function angle(x1, y1, x2, y2, x3, y3) {
    if (x3 == null) {
        var x = x1 - x2,
            y = y1 - y2;
        if (!x && !y) {
            return 0;
        }
        return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
    } else {
        return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
    }
}
function rad(deg) {
    return deg % 360 * PI / 180;
}
function deg(rad) {
    return rad * 180 / PI % 360;
}
function x_y() {
    return this.x + S + this.y;
}
function x_y_w_h() {
    return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
}

/*\
 * Snap.rad
 [ method ]
 **
 * Transform angle to radians
 - deg (number) angle in degrees
 = (number) angle in radians
\*/
Snap.rad = rad;
/*\
 * Snap.deg
 [ method ]
 **
 * Transform angle to degrees
 - rad (number) angle in radians
 = (number) angle in degrees
\*/
Snap.deg = deg;
/*\
 * Snap.sin
 [ method ]
 **
 * Equivalent to `Math.sin()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) sin
\*/
Snap.sin = function (angle) {
    return math.sin(Snap.rad(angle));
};
/*\
 * Snap.tan
 [ method ]
 **
 * Equivalent to `Math.tan()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) tan
\*/
Snap.tan = function (angle) {
    return math.tan(Snap.rad(angle));
};
/*\
 * Snap.cos
 [ method ]
 **
 * Equivalent to `Math.cos()` only works with degrees, not radians.
 - angle (number) angle in degrees
 = (number) cos
\*/
Snap.cos = function (angle) {
    return math.cos(Snap.rad(angle));
};
/*\
 * Snap.asin
 [ method ]
 **
 * Equivalent to `Math.asin()` only works with degrees, not radians.
 - num (number) value
 = (number) asin in degrees
\*/
Snap.asin = function (num) {
    return Snap.deg(math.asin(num));
};
/*\
 * Snap.acos
 [ method ]
 **
 * Equivalent to `Math.acos()` only works with degrees, not radians.
 - num (number) value
 = (number) acos in degrees
\*/
Snap.acos = function (num) {
    return Snap.deg(math.acos(num));
};
/*\
 * Snap.atan
 [ method ]
 **
 * Equivalent to `Math.atan()` only works with degrees, not radians.
 - num (number) value
 = (number) atan in degrees
\*/
Snap.atan = function (num) {
    return Snap.deg(math.atan(num));
};
/*\
 * Snap.atan2
 [ method ]
 **
 * Equivalent to `Math.atan2()` only works with degrees, not radians.
 - num (number) value
 = (number) atan2 in degrees
\*/
Snap.atan2 = function (num) {
    return Snap.deg(math.atan2(num));
};
/*\
 * Snap.angle
 [ method ]
 **
 * Returns an angle between two or three points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 - x3 (number) #optional x coord of third point
 - y3 (number) #optional y coord of third point
 = (number) angle in degrees
\*/
Snap.angle = angle;
/*\
 * Snap.len
 [ method ]
 **
 * Returns distance between two points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 = (number) distance
\*/
Snap.len = function (x1, y1, x2, y2) {
    return Math.sqrt(Snap.len2(x1, y1, x2, y2));
};
/*\
 * Snap.len2
 [ method ]
 **
 * Returns squared distance between two points
 > Parameters
 - x1 (number) x coord of first point
 - y1 (number) y coord of first point
 - x2 (number) x coord of second point
 - y2 (number) y coord of second point
 = (number) distance
\*/
Snap.len2 = function (x1, y1, x2, y2) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
};
/*\
 * Snap.closestPoint
 [ method ]
 **
 * Returns closest point to a given one on a given path.
 > Parameters
 - path (Element) path element
 - x (number) x coord of a point
 - y (number) y coord of a point
 = (object) in format
 {
    x (number) x coord of the point on the path
    y (number) y coord of the point on the path
    length (number) length of the path to the point
    distance (number) distance from the given point to the path
 }
\*/
// Copied from http://bl.ocks.org/mbostock/8027637
Snap.closestPoint = function (path, x, y) {
    function distance2(p) {
        var dx = p.x - x,
            dy = p.y - y;
        return dx * dx + dy * dy;
    }
    var pathNode = path.node,
        pathLength = pathNode.getTotalLength(),
        precision = pathLength / pathNode.pathSegList.numberOfItems * .125,
        best,
        bestLength,
        bestDistance = Infinity;

    // linear scan for coarse approximation
    for (var scan, scanLength = 0, scanDistance; scanLength <= pathLength; scanLength += precision) {
        if ((scanDistance = distance2(scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
            best = scan, bestLength = scanLength, bestDistance = scanDistance;
        }
    }

    // binary search for precise estimate
    precision *= .5;
    while (precision > .5) {
        var before,
            after,
            beforeLength,
            afterLength,
            beforeDistance,
            afterDistance;
        if ((beforeLength = bestLength - precision) >= 0 && (beforeDistance = distance2(before = pathNode.getPointAtLength(beforeLength))) < bestDistance) {
            best = before, bestLength = beforeLength, bestDistance = beforeDistance;
        } else if ((afterLength = bestLength + precision) <= pathLength && (afterDistance = distance2(after = pathNode.getPointAtLength(afterLength))) < bestDistance) {
            best = after, bestLength = afterLength, bestDistance = afterDistance;
        } else {
            precision *= .5;
        }
    }

    best = {
        x: best.x,
        y: best.y,
        length: bestLength,
        distance: Math.sqrt(bestDistance)
    };
    return best;
}
/*\
 * Snap.is
 [ method ]
 **
 * Handy replacement for the `typeof` operator
 - o (…) any object or primitive
 - type (string) name of the type, e.g., `string`, `function`, `number`, etc.
 = (boolean) `true` if given value is of given type
\*/
Snap.is = is;
/*\
 * Snap.snapTo
 [ method ]
 **
 * Snaps given value to given grid
 - values (array|number) given array of values or step of the grid
 - value (number) value to adjust
 - tolerance (number) #optional maximum distance to the target value that would trigger the snap. Default is `10`.
 = (number) adjusted value
\*/
Snap.snapTo = function (values, value, tolerance) {
    tolerance = is(tolerance, "finite") ? tolerance : 10;
    if (is(values, "array")) {
        var i = values.length;
        while (i--) if (abs(values[i] - value) <= tolerance) {
            return values[i];
        }
    } else {
        values = +values;
        var rem = value % values;
        if (rem < tolerance) {
            return value - rem;
        }
        if (rem > values - tolerance) {
            return value - rem + values;
        }
    }
    return value;
};
// Colour
/*\
 * Snap.getRGB
 [ method ]
 **
 * Parses color string as RGB object
 - color (string) color string in one of the following formats:
 # <ul>
 #     <li>Color name (<code>red</code>, <code>green</code>, <code>cornflowerblue</code>, etc)</li>
 #     <li>#••• — shortened HTML color: (<code>#000</code>, <code>#fc0</code>, etc.)</li>
 #     <li>#•••••• — full length HTML color: (<code>#000000</code>, <code>#bd2300</code>)</li>
 #     <li>rgb(•••, •••, •••) — red, green and blue channels values: (<code>rgb(200,&nbsp;100,&nbsp;0)</code>)</li>
 #     <li>rgba(•••, •••, •••, •••) — also with opacity</li>
 #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>)</li>
 #     <li>rgba(•••%, •••%, •••%, •••%) — also with opacity</li>
 #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>)</li>
 #     <li>hsba(•••, •••, •••, •••) — also with opacity</li>
 #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
 #     <li>hsba(•••%, •••%, •••%, •••%) — also with opacity</li>
 #     <li>hsl(•••, •••, •••) — hue, saturation and luminosity values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;0.5)</code>)</li>
 #     <li>hsla(•••, •••, •••, •••) — also with opacity</li>
 #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
 #     <li>hsla(•••%, •••%, •••%, •••%) — also with opacity</li>
 # </ul>
 * Note that `%` can be used any time: `rgb(20%, 255, 50%)`.
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) true if string can't be parsed
 o }
\*/
Snap.getRGB = cacher(function (colour) {
    if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    if (colour == "none") {
        return {r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString};
    }
    !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
    if (!colour) {
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
    }
    var res,
        red,
        green,
        blue,
        opacity,
        t,
        values,
        rgb = colour.match(colourRegExp);
    if (rgb) {
        if (rgb[2]) {
            blue = toInt(rgb[2].substring(5), 16);
            green = toInt(rgb[2].substring(3, 5), 16);
            red = toInt(rgb[2].substring(1, 3), 16);
        }
        if (rgb[3]) {
            blue = toInt((t = rgb[3].charAt(3)) + t, 16);
            green = toInt((t = rgb[3].charAt(2)) + t, 16);
            red = toInt((t = rgb[3].charAt(1)) + t, 16);
        }
        if (rgb[4]) {
            values = rgb[4].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red *= 2.55);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green *= 2.55);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue *= 2.55);
            rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
        }
        if (rgb[5]) {
            values = rgb[5].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsb2rgb(red, green, blue, opacity);
        }
        if (rgb[6]) {
            values = rgb[6].split(commaSpaces);
            red = toFloat(values[0]);
            values[0].slice(-1) == "%" && (red /= 100);
            green = toFloat(values[1]);
            values[1].slice(-1) == "%" && (green /= 100);
            blue = toFloat(values[2]);
            values[2].slice(-1) == "%" && (blue /= 100);
            (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
            rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
            values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            return Snap.hsl2rgb(red, green, blue, opacity);
        }
        red = mmin(math.round(red), 255);
        green = mmin(math.round(green), 255);
        blue = mmin(math.round(blue), 255);
        opacity = mmin(mmax(opacity, 0), 1);
        rgb = {r: red, g: green, b: blue, toString: rgbtoString};
        rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
        rgb.opacity = is(opacity, "finite") ? opacity : 1;
        return rgb;
    }
    return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: rgbtoString};
}, Snap);
/*\
 * Snap.hsb
 [ method ]
 **
 * Converts HSB values to a hex representation of the color
 - h (number) hue
 - s (number) saturation
 - b (number) value or brightness
 = (string) hex representation of the color
\*/
Snap.hsb = cacher(function (h, s, b) {
    return Snap.hsb2rgb(h, s, b).hex;
});
/*\
 * Snap.hsl
 [ method ]
 **
 * Converts HSL values to a hex representation of the color
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (string) hex representation of the color
\*/
Snap.hsl = cacher(function (h, s, l) {
    return Snap.hsl2rgb(h, s, l).hex;
});
/*\
 * Snap.rgb
 [ method ]
 **
 * Converts RGB values to a hex representation of the color
 - r (number) red
 - g (number) green
 - b (number) blue
 = (string) hex representation of the color
\*/
Snap.rgb = cacher(function (r, g, b, o) {
    if (is(o, "finite")) {
        var round = math.round;
        return "rgba(" + [round(r), round(g), round(b), +o.toFixed(2)] + ")";
    }
    return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
});
var toHex = function (color) {
    var i = glob.doc.getElementsByTagName("head")[0] || glob.doc.getElementsByTagName("svg")[0],
        red = "rgb(255, 0, 0)";
    toHex = cacher(function (color) {
        if (color.toLowerCase() == "red") {
            return red;
        }
        i.style.color = red;
        i.style.color = color;
        var out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
        return out == red ? null : out;
    });
    return toHex(color);
},
hsbtoString = function () {
    return "hsb(" + [this.h, this.s, this.b] + ")";
},
hsltoString = function () {
    return "hsl(" + [this.h, this.s, this.l] + ")";
},
rgbtoString = function () {
    return this.opacity == 1 || this.opacity == null ?
            this.hex :
            "rgba(" + [this.r, this.g, this.b, this.opacity] + ")";
},
prepareRGB = function (r, g, b) {
    if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in r) {
        b = r.b;
        g = r.g;
        r = r.r;
    }
    if (g == null && is(r, string)) {
        var clr = Snap.getRGB(r);
        r = clr.r;
        g = clr.g;
        b = clr.b;
    }
    if (r > 1 || g > 1 || b > 1) {
        r /= 255;
        g /= 255;
        b /= 255;
    }
    
    return [r, g, b];
},
packageRGB = function (r, g, b, o) {
    r = math.round(r * 255);
    g = math.round(g * 255);
    b = math.round(b * 255);
    var rgb = {
        r: r,
        g: g,
        b: b,
        opacity: is(o, "finite") ? o : 1,
        hex: Snap.rgb(r, g, b),
        toString: rgbtoString
    };
    is(o, "finite") && (rgb.opacity = o);
    return rgb;
};
/*\
 * Snap.color
 [ method ]
 **
 * Parses the color string and returns an object featuring the color's component values
 - clr (string) color string in one of the supported formats (see @Snap.getRGB)
 = (object) Combined RGB/HSB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••,
 o     error (boolean) `true` if string can't be parsed,
 o     h (number) hue,
 o     s (number) saturation,
 o     v (number) value (brightness),
 o     l (number) lightness
 o }
\*/
Snap.color = function (clr) {
    var rgb;
    if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
        rgb = Snap.hsb2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
        rgb = Snap.hsl2rgb(clr);
        clr.r = rgb.r;
        clr.g = rgb.g;
        clr.b = rgb.b;
        clr.opacity = 1;
        clr.hex = rgb.hex;
    } else {
        if (is(clr, "string")) {
            clr = Snap.getRGB(clr);
        }
        if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr && !("error" in clr)) {
            rgb = Snap.rgb2hsl(clr);
            clr.h = rgb.h;
            clr.s = rgb.s;
            clr.l = rgb.l;
            rgb = Snap.rgb2hsb(clr);
            clr.v = rgb.b;
        } else {
            clr = {hex: "none"};
            clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
            clr.error = 1;
        }
    }
    clr.toString = rgbtoString;
    return clr;
};
/*\
 * Snap.hsb2rgb
 [ method ]
 **
 * Converts HSB values to an RGB object
 - h (number) hue
 - s (number) saturation
 - v (number) value or brightness
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Snap.hsb2rgb = function (h, s, v, o) {
    if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
        v = h.b;
        s = h.s;
        o = h.o;
        h = h.h;
    }
    h *= 360;
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = v * s;
    X = C * (1 - abs(h % 2 - 1));
    R = G = B = v - C;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
};
/*\
 * Snap.hsl2rgb
 [ method ]
 **
 * Converts HSL values to an RGB object
 - h (number) hue
 - s (number) saturation
 - l (number) luminosity
 = (object) RGB object in the following format:
 o {
 o     r (number) red,
 o     g (number) green,
 o     b (number) blue,
 o     hex (string) color in HTML/CSS format: #••••••
 o }
\*/
Snap.hsl2rgb = function (h, s, l, o) {
    if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
        l = h.l;
        s = h.s;
        h = h.h;
    }
    if (h > 1 || s > 1 || l > 1) {
        h /= 360;
        s /= 100;
        l /= 100;
    }
    h *= 360;
    var R, G, B, X, C;
    h = (h % 360) / 60;
    C = 2 * s * (l < .5 ? l : 1 - l);
    X = C * (1 - abs(h % 2 - 1));
    R = G = B = l - C / 2;

    h = ~~h;
    R += [C, X, 0, 0, X, C][h];
    G += [X, C, C, X, 0, 0][h];
    B += [0, 0, X, C, C, X][h];
    return packageRGB(R, G, B, o);
};
/*\
 * Snap.rgb2hsb
 [ method ]
 **
 * Converts RGB values to an HSB object
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSB object in the following format:
 o {
 o     h (number) hue,
 o     s (number) saturation,
 o     b (number) brightness
 o }
\*/
Snap.rgb2hsb = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, V, C;
    V = mmax(r, g, b);
    C = V - mmin(r, g, b);
    H = (C == 0 ? null :
         V == r ? (g - b) / C :
         V == g ? (b - r) / C + 2 :
                  (r - g) / C + 4
        );
    H = ((H + 360) % 6) * 60 / 360;
    S = C == 0 ? 0 : C / V;
    return {h: H, s: S, b: V, toString: hsbtoString};
};
/*\
 * Snap.rgb2hsl
 [ method ]
 **
 * Converts RGB values to an HSL object
 - r (number) red
 - g (number) green
 - b (number) blue
 = (object) HSL object in the following format:
 o {
 o     h (number) hue,
 o     s (number) saturation,
 o     l (number) luminosity
 o }
\*/
Snap.rgb2hsl = function (r, g, b) {
    b = prepareRGB(r, g, b);
    r = b[0];
    g = b[1];
    b = b[2];

    var H, S, L, M, m, C;
    M = mmax(r, g, b);
    m = mmin(r, g, b);
    C = M - m;
    H = (C == 0 ? null :
         M == r ? (g - b) / C :
         M == g ? (b - r) / C + 2 :
                  (r - g) / C + 4);
    H = ((H + 360) % 6) * 60 / 360;
    L = (M + m) / 2;
    S = (C == 0 ? 0 :
         L < .5 ? C / (2 * L) :
                  C / (2 - 2 * L));
    return {h: H, s: S, l: L, toString: hsltoString};
};

// Transformations
/*\
 * Snap.parsePathString
 [ method ]
 **
 * Utility method
 **
 * Parses given path string into an array of arrays of path segments
 - pathString (string|array) path string or array of segments (in the last case it is returned straight away)
 = (array) array of segments
\*/
Snap.parsePathString = function (pathString) {
    if (!pathString) {
        return null;
    }
    var pth = Snap.path(pathString);
    if (pth.arr) {
        return Snap.path.clone(pth.arr);
    }
    
    var paramCounts = {a: 7, c: 6, o: 2, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, u: 3, z: 0},
        data = [];
    if (is(pathString, "array") && is(pathString[0], "array")) { // rough assumption
        data = Snap.path.clone(pathString);
    }
    if (!data.length) {
        Str(pathString).replace(pathCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            if (name == "m" && params.length > 2) {
                data.push([b].concat(params.splice(0, 2)));
                name = "l";
                b = b == "m" ? "l" : "L";
            }
            if (name == "o" && params.length == 1) {
                data.push([b, params[0]]);
            }
            if (name == "r") {
                data.push([b].concat(params));
            } else while (params.length >= paramCounts[name]) {
                data.push([b].concat(params.splice(0, paramCounts[name])));
                if (!paramCounts[name]) {
                    break;
                }
            }
        });
    }
    data.toString = Snap.path.toString;
    pth.arr = Snap.path.clone(data);
    return data;
};
/*\
 * Snap.parseTransformString
 [ method ]
 **
 * Utility method
 **
 * Parses given transform string into an array of transformations
 - TString (string|array) transform string or array of transformations (in the last case it is returned straight away)
 = (array) array of transformations
\*/
var parseTransformString = Snap.parseTransformString = function (TString) {
    if (!TString) {
        return null;
    }
    var paramCounts = {r: 3, s: 4, t: 2, m: 6},
        data = [];
    if (is(TString, "array") && is(TString[0], "array")) { // rough assumption
        data = Snap.path.clone(TString);
    }
    if (!data.length) {
        Str(TString).replace(tCommand, function (a, b, c) {
            var params = [],
                name = b.toLowerCase();
            c.replace(pathValues, function (a, b) {
                b && params.push(+b);
            });
            data.push([b].concat(params));
        });
    }
    data.toString = Snap.path.toString;
    return data;
};
function svgTransform2string(tstr) {
    var res = [];
    tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g, function (all, name, params) {
        params = params.split(/\s*,\s*|\s+/);
        if (name == "rotate" && params.length == 1) {
            params.push(0, 0);
        }
        if (name == "scale") {
            if (params.length > 2) {
                params = params.slice(0, 2);
            } else if (params.length == 2) {
                params.push(0, 0);
            }
            if (params.length == 1) {
                params.push(params[0], 0, 0);
            }
        }
        if (name == "skewX") {
            res.push(["m", 1, 0, math.tan(rad(params[0])), 1, 0, 0]);
        } else if (name == "skewY") {
            res.push(["m", 1, math.tan(rad(params[0])), 0, 1, 0, 0]);
        } else {
            res.push([name.charAt(0)].concat(params));
        }
        return all;
    });
    return res;
}
Snap._.svgTransform2string = svgTransform2string;
Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;
function transform2matrix(tstr, bbox) {
    var tdata = parseTransformString(tstr),
        m = new Snap.Matrix;
    if (tdata) {
        for (var i = 0, ii = tdata.length; i < ii; i++) {
            var t = tdata[i],
                tlen = t.length,
                command = Str(t[0]).toLowerCase(),
                absolute = t[0] != command,
                inver = absolute ? m.invert() : 0,
                x1,
                y1,
                x2,
                y2,
                bb;
            if (command == "t" && tlen == 2){
                m.translate(t[1], 0);
            } else if (command == "t" && tlen == 3) {
                if (absolute) {
                    x1 = inver.x(0, 0);
                    y1 = inver.y(0, 0);
                    x2 = inver.x(t[1], t[2]);
                    y2 = inver.y(t[1], t[2]);
                    m.translate(x2 - x1, y2 - y1);
                } else {
                    m.translate(t[1], t[2]);
                }
            } else if (command == "r") {
                if (tlen == 2) {
                    bb = bb || bbox;
                    m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                } else if (tlen == 4) {
                    if (absolute) {
                        x2 = inver.x(t[2], t[3]);
                        y2 = inver.y(t[2], t[3]);
                        m.rotate(t[1], x2, y2);
                    } else {
                        m.rotate(t[1], t[2], t[3]);
                    }
                }
            } else if (command == "s") {
                if (tlen == 2 || tlen == 3) {
                    bb = bb || bbox;
                    m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                } else if (tlen == 4) {
                    if (absolute) {
                        x2 = inver.x(t[2], t[3]);
                        y2 = inver.y(t[2], t[3]);
                        m.scale(t[1], t[1], x2, y2);
                    } else {
                        m.scale(t[1], t[1], t[2], t[3]);
                    }
                } else if (tlen == 5) {
                    if (absolute) {
                        x2 = inver.x(t[3], t[4]);
                        y2 = inver.y(t[3], t[4]);
                        m.scale(t[1], t[2], x2, y2);
                    } else {
                        m.scale(t[1], t[2], t[3], t[4]);
                    }
                }
            } else if (command == "m" && tlen == 7) {
                m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
            }
        }
    }
    return m;
}
Snap._.transform2matrix = transform2matrix;
Snap._unit2px = unit2px;
var contains = glob.doc.contains || glob.doc.compareDocumentPosition ?
    function (a, b) {
        var adown = a.nodeType == 9 ? a.documentElement : a,
            bup = b && b.parentNode;
            return a == bup || !!(bup && bup.nodeType == 1 && (
                adown.contains ?
                    adown.contains(bup) :
                    a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
            ));
    } :
    function (a, b) {
        if (b) {
            while (b) {
                b = b.parentNode;
                if (b == a) {
                    return true;
                }
            }
        }
        return false;
    };
function getSomeDefs(el) {
    var p = (el.node.ownerSVGElement && wrap(el.node.ownerSVGElement)) ||
            (el.node.parentNode && wrap(el.node.parentNode)) ||
            Snap.select("svg") ||
            Snap(0, 0),
        pdefs = p.select("defs"),
        defs  = pdefs == null ? false : pdefs.node;
    if (!defs) {
        defs = make("defs", p.node).node;
    }
    return defs;
}
function getSomeSVG(el) {
    return el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) || Snap.select("svg");
}
Snap._.getSomeDefs = getSomeDefs;
Snap._.getSomeSVG = getSomeSVG;
function unit2px(el, name, value) {
    var svg = getSomeSVG(el).node,
        out = {},
        mgr = svg.querySelector(".svg---mgr");
    if (!mgr) {
        mgr = $("rect");
        $(mgr, {x: -9e9, y: -9e9, width: 10, height: 10, "class": "svg---mgr", fill: "none"});
        svg.appendChild(mgr);
    }
    function getW(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {width: val});
        try {
            return mgr.getBBox().width;
        } catch (e) {
            return 0;
        }
    }
    function getH(val) {
        if (val == null) {
            return E;
        }
        if (val == +val) {
            return val;
        }
        $(mgr, {height: val});
        try {
            return mgr.getBBox().height;
        } catch (e) {
            return 0;
        }
    }
    function set(nam, f) {
        if (name == null) {
            out[nam] = f(el.attr(nam) || 0);
        } else if (nam == name) {
            out = f(value == null ? el.attr(nam) || 0 : value);
        }
    }
    switch (el.type) {
        case "rect":
            set("rx", getW);
            set("ry", getH);
        case "image":
            set("width", getW);
            set("height", getH);
        case "text":
            set("x", getW);
            set("y", getH);
        break;
        case "circle":
            set("cx", getW);
            set("cy", getH);
            set("r", getW);
        break;
        case "ellipse":
            set("cx", getW);
            set("cy", getH);
            set("rx", getW);
            set("ry", getH);
        break;
        case "line":
            set("x1", getW);
            set("x2", getW);
            set("y1", getH);
            set("y2", getH);
        break;
        case "marker":
            set("refX", getW);
            set("markerWidth", getW);
            set("refY", getH);
            set("markerHeight", getH);
        break;
        case "radialGradient":
            set("fx", getW);
            set("fy", getH);
        break;
        case "tspan":
            set("dx", getW);
            set("dy", getH);
        break;
        default:
            set(name, getW);
    }
    svg.removeChild(mgr);
    return out;
}
/*\
 * Snap.select
 [ method ]
 **
 * Wraps a DOM element specified by CSS selector as @Element
 - query (string) CSS selector of the element
 = (Element) the current element
\*/
Snap.select = function (query) {
    query = Str(query).replace(/([^\\]):/g, "$1\\:");
    return wrap(glob.doc.querySelector(query));
};
/*\
 * Snap.selectAll
 [ method ]
 **
 * Wraps DOM elements specified by CSS selector as set or array of @Element
 - query (string) CSS selector of the element
 = (Element) the current element
\*/
Snap.selectAll = function (query) {
    var nodelist = glob.doc.querySelectorAll(query),
        set = (Snap.set || Array)();
    for (var i = 0; i < nodelist.length; i++) {
        set.push(wrap(nodelist[i]));
    }
    return set;
};

function add2group(list) {
    if (!is(list, "array")) {
        list = Array.prototype.slice.call(arguments, 0);
    }
    var i = 0,
        j = 0,
        node = this.node;
    while (this[i]) delete this[i++];
    for (i = 0; i < list.length; i++) {
        if (list[i].type == "set") {
            list[i].forEach(function (el) {
                node.appendChild(el.node);
            });
        } else {
            node.appendChild(list[i].node);
        }
    }
    var children = node.childNodes;
    for (i = 0; i < children.length; i++) {
        this[j++] = wrap(children[i]);
    }
    return this;
}
// Hub garbage collector every 10s
setInterval(function () {
    for (var key in hub) if (hub[has](key)) {
        var el = hub[key],
            node = el.node;
        if (el.type != "svg" && !node.ownerSVGElement || el.type == "svg" && (!node.parentNode || "ownerSVGElement" in node.parentNode && !node.ownerSVGElement)) {
            delete hub[key];
        }
    }
}, 1e4);
function Element(el) {
    if (el.snap in hub) {
        return hub[el.snap];
    }
    var svg;
    try {
        svg = el.ownerSVGElement;
    } catch(e) {}
    /*\
     * Element.node
     [ property (object) ]
     **
     * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
     > Usage
     | // draw a circle at coordinate 10,10 with radius of 10
     | var c = paper.circle(10, 10, 10);
     | c.node.onclick = function () {
     |     c.attr("fill", "red");
     | };
    \*/
    this.node = el;
    if (svg) {
        this.paper = new Paper(svg);
    }
    /*\
     * Element.type
     [ property (string) ]
     **
     * SVG tag name of the given element.
    \*/
    this.type = el.tagName || el.nodeName;
    var id = this.id = ID(this);
    this.anims = {};
    this._ = {
        transform: []
    };
    el.snap = id;
    hub[id] = this;
    if (this.type == "g") {
        this.add = add2group;
    }
    if (this.type in {g: 1, mask: 1, pattern: 1, symbol: 1}) {
        for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
            this[method] = Paper.prototype[method];
        }
    }
}
   /*\
     * Element.attr
     [ method ]
     **
     * Gets or sets given attributes of the element.
     **
     - params (object) contains key-value pairs of attributes you want to set
     * or
     - param (string) name of the attribute
     = (Element) the current element
     * or
     = (string) value of attribute
     > Usage
     | el.attr({
     |     fill: "#fc0",
     |     stroke: "#000",
     |     strokeWidth: 2, // CamelCase...
     |     "fill-opacity": 0.5, // or dash-separated names
     |     width: "*=2" // prefixed values
     | });
     | console.log(el.attr("fill")); // #fc0
     * Prefixed values in format `"+=10"` supported. All four operations
     * (`+`, `-`, `*` and `/`) could be used. Optionally you can use units for `+`
     * and `-`: `"+=2em"`.
    \*/
    Element.prototype.attr = function (params, value) {
        var el = this,
            node = el.node;
        if (!params) {
            if (node.nodeType != 1) {
                return {
                    text: node.nodeValue
                };
            }
            var attr = node.attributes,
                out = {};
            for (var i = 0, ii = attr.length; i < ii; i++) {
                out[attr[i].nodeName] = attr[i].nodeValue;
            }
            return out;
        }
        if (is(params, "string")) {
            if (arguments.length > 1) {
                var json = {};
                json[params] = value;
                params = json;
            } else {
                return eve("snap.util.getattr." + params, el).firstDefined();
            }
        }
        for (var att in params) {
            if (params[has](att)) {
                eve("snap.util.attr." + att, el, params[att]);
            }
        }
        return el;
    };
/*\
 * Snap.parse
 [ method ]
 **
 * Parses SVG fragment and converts it into a @Fragment
 **
 - svg (string) SVG string
 = (Fragment) the @Fragment
\*/
Snap.parse = function (svg) {
    var f = glob.doc.createDocumentFragment(),
        full = true,
        div = glob.doc.createElement("div");
    svg = Str(svg);
    if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
        svg = "<svg>" + svg + "</svg>";
        full = false;
    }
    div.innerHTML = svg;
    svg = div.getElementsByTagName("svg")[0];
    if (svg) {
        if (full) {
            f = svg;
        } else {
            while (svg.firstChild) {
                f.appendChild(svg.firstChild);
            }
        }
    }
    return new Fragment(f);
};
function Fragment(frag) {
    this.node = frag;
}
/*\
 * Snap.fragment
 [ method ]
 **
 * Creates a DOM fragment from a given list of elements or strings
 **
 - varargs (…) SVG string
 = (Fragment) the @Fragment
\*/
Snap.fragment = function () {
    var args = Array.prototype.slice.call(arguments, 0),
        f = glob.doc.createDocumentFragment();
    for (var i = 0, ii = args.length; i < ii; i++) {
        var item = args[i];
        if (item.node && item.node.nodeType) {
            f.appendChild(item.node);
        }
        if (item.nodeType) {
            f.appendChild(item);
        }
        if (typeof item == "string") {
            f.appendChild(Snap.parse(item).node);
        }
    }
    return new Fragment(f);
};

function make(name, parent) {
    var res = $(name);
    parent.appendChild(res);
    var el = wrap(res);
    return el;
}
function Paper(w, h) {
    var res,
        desc,
        defs,
        proto = Paper.prototype;
    if (w && w.tagName == "svg") {
        if (w.snap in hub) {
            return hub[w.snap];
        }
        var doc = w.ownerDocument;
        res = new Element(w);
        desc = w.getElementsByTagName("desc")[0];
        defs = w.getElementsByTagName("defs")[0];
        if (!desc) {
            desc = $("desc");
            desc.appendChild(doc.createTextNode("Created with Snap"));
            res.node.appendChild(desc);
        }
        if (!defs) {
            defs = $("defs");
            res.node.appendChild(defs);
        }
        res.defs = defs;
        for (var key in proto) if (proto[has](key)) {
            res[key] = proto[key];
        }
        res.paper = res.root = res;
    } else {
        res = make("svg", glob.doc.body);
        $(res.node, {
            height: h,
            version: 1.1,
            width: w,
            xmlns: xmlns
        });
    }
    return res;
}
function wrap(dom) {
    if (!dom) {
        return dom;
    }
    if (dom instanceof Element || dom instanceof Fragment) {
        return dom;
    }
    if (dom.tagName && dom.tagName.toLowerCase() == "svg") {
        return new Paper(dom);
    }
    if (dom.tagName && dom.tagName.toLowerCase() == "object" && dom.type == "image/svg+xml") {
        return new Paper(dom.contentDocument.getElementsByTagName("svg")[0]);
    }
    return new Element(dom);
}

Snap._.make = make;
Snap._.wrap = wrap;
/*\
 * Paper.el
 [ method ]
 **
 * Creates an element on paper with a given name and no attributes
 **
 - name (string) tag name
 - attr (object) attributes
 = (Element) the current element
 > Usage
 | var c = paper.circle(10, 10, 10); // is the same as...
 | var c = paper.el("circle").attr({
 |     cx: 10,
 |     cy: 10,
 |     r: 10
 | });
 | // and the same as
 | var c = paper.el("circle", {
 |     cx: 10,
 |     cy: 10,
 |     r: 10
 | });
\*/
Paper.prototype.el = function (name, attr) {
    var el = make(name, this.node);
    attr && el.attr(attr);
    return el;
};
/*\
 * Element.children
 [ method ]
 **
 * Returns array of all the children of the element.
 = (array) array of Elements
\*/
Element.prototype.children = function () {
    var out = [],
        ch = this.node.childNodes;
    for (var i = 0, ii = ch.length; i < ii; i++) {
        out[i] = Snap(ch[i]);
    }
    return out;
};
function jsonFiller(root, o) {
    for (var i = 0, ii = root.length; i < ii; i++) {
        var item = {
                type: root[i].type,
                attr: root[i].attr()
            },
            children = root[i].children();
        o.push(item);
        if (children.length) {
            jsonFiller(children, item.childNodes = []);
        }
    }
}
/*\
 * Element.toJSON
 [ method ]
 **
 * Returns object representation of the given element and all its children.
 = (object) in format
 o {
 o     type (string) this.type,
 o     attr (object) attributes map,
 o     childNodes (array) optional array of children in the same format
 o }
\*/
Element.prototype.toJSON = function () {
    var out = [];
    jsonFiller([this], out);
    return out[0];
};
// default
eve.on("snap.util.getattr", function () {
    var att = eve.nt();
    att = att.substring(att.lastIndexOf(".") + 1);
    var css = att.replace(/[A-Z]/g, function (letter) {
        return "-" + letter.toLowerCase();
    });
    if (cssAttr[has](css)) {
        return this.node.ownerDocument.defaultView.getComputedStyle(this.node, null).getPropertyValue(css);
    } else {
        return $(this.node, att);
    }
});
var cssAttr = {
    "alignment-baseline": 0,
    "baseline-shift": 0,
    "clip": 0,
    "clip-path": 0,
    "clip-rule": 0,
    "color": 0,
    "color-interpolation": 0,
    "color-interpolation-filters": 0,
    "color-profile": 0,
    "color-rendering": 0,
    "cursor": 0,
    "direction": 0,
    "display": 0,
    "dominant-baseline": 0,
    "enable-background": 0,
    "fill": 0,
    "fill-opacity": 0,
    "fill-rule": 0,
    "filter": 0,
    "flood-color": 0,
    "flood-opacity": 0,
    "font": 0,
    "font-family": 0,
    "font-size": 0,
    "font-size-adjust": 0,
    "font-stretch": 0,
    "font-style": 0,
    "font-variant": 0,
    "font-weight": 0,
    "glyph-orientation-horizontal": 0,
    "glyph-orientation-vertical": 0,
    "image-rendering": 0,
    "kerning": 0,
    "letter-spacing": 0,
    "lighting-color": 0,
    "marker": 0,
    "marker-end": 0,
    "marker-mid": 0,
    "marker-start": 0,
    "mask": 0,
    "opacity": 0,
    "overflow": 0,
    "pointer-events": 0,
    "shape-rendering": 0,
    "stop-color": 0,
    "stop-opacity": 0,
    "stroke": 0,
    "stroke-dasharray": 0,
    "stroke-dashoffset": 0,
    "stroke-linecap": 0,
    "stroke-linejoin": 0,
    "stroke-miterlimit": 0,
    "stroke-opacity": 0,
    "stroke-width": 0,
    "text-anchor": 0,
    "text-decoration": 0,
    "text-rendering": 0,
    "unicode-bidi": 0,
    "visibility": 0,
    "word-spacing": 0,
    "writing-mode": 0
};

eve.on("snap.util.attr", function (value) {
    var att = eve.nt(),
        attr = {};
    att = att.substring(att.lastIndexOf(".") + 1);
    attr[att] = value;
    var style = att.replace(/-(\w)/gi, function (all, letter) {
            return letter.toUpperCase();
        }),
        css = att.replace(/[A-Z]/g, function (letter) {
            return "-" + letter.toLowerCase();
        });
    if (cssAttr[has](css)) {
        this.node.style[style] = value == null ? E : value;
    } else {
        $(this.node, attr);
    }
});
(function (proto) {}(Paper.prototype));

// simple ajax
/*\
 * Snap.ajax
 [ method ]
 **
 * Simple implementation of Ajax
 **
 - url (string) URL
 - postData (object|string) data for post request
 - callback (function) callback
 - scope (object) #optional scope of callback
 * or
 - url (string) URL
 - callback (function) callback
 - scope (object) #optional scope of callback
 = (XMLHttpRequest) the XMLHttpRequest object, just in case
\*/
Snap.ajax = function (url, postData, callback, scope){
    var req = new XMLHttpRequest,
        id = ID();
    if (req) {
        if (is(postData, "function")) {
            scope = callback;
            callback = postData;
            postData = null;
        } else if (is(postData, "object")) {
            var pd = [];
            for (var key in postData) if (postData.hasOwnProperty(key)) {
                pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
            }
            postData = pd.join("&");
        }
        req.open((postData ? "POST" : "GET"), url, true);
        if (postData) {
            req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        }
        if (callback) {
            eve.once("snap.ajax." + id + ".0", callback);
            eve.once("snap.ajax." + id + ".200", callback);
            eve.once("snap.ajax." + id + ".304", callback);
        }
        req.onreadystatechange = function() {
            if (req.readyState != 4) return;
            eve("snap.ajax." + id + "." + req.status, scope, req);
        };
        if (req.readyState == 4) {
            return req;
        }
        req.send(postData);
        return req;
    }
};
/*\
 * Snap.load
 [ method ]
 **
 * Loads external SVG file as a @Fragment (see @Snap.ajax for more advanced AJAX)
 **
 - url (string) URL
 - callback (function) callback
 - scope (object) #optional scope of callback
\*/
Snap.load = function (url, callback, scope) {
    Snap.ajax(url, function (req) {
        var f = Snap.parse(req.responseText);
        scope ? callback.call(scope, f) : callback(f);
    });
};
var getOffset = function (elem) {
    var box = elem.getBoundingClientRect(),
        doc = elem.ownerDocument,
        body = doc.body,
        docElem = doc.documentElement,
        clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
        top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
        left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
    return {
        y: top,
        x: left
    };
};
/*\
 * Snap.getElementByPoint
 [ method ]
 **
 * Returns you topmost element under given point.
 **
 = (object) Snap element object
 - x (number) x coordinate from the top left corner of the window
 - y (number) y coordinate from the top left corner of the window
 > Usage
 | Snap.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
\*/
Snap.getElementByPoint = function (x, y) {
    var paper = this,
        svg = paper.canvas,
        target = glob.doc.elementFromPoint(x, y);
    if (glob.win.opera && target.tagName == "svg") {
        var so = getOffset(target),
            sr = target.createSVGRect();
        sr.x = x - so.x;
        sr.y = y - so.y;
        sr.width = sr.height = 1;
        var hits = target.getIntersectionList(sr, null);
        if (hits.length) {
            target = hits[hits.length - 1];
        }
    }
    if (!target) {
        return null;
    }
    return wrap(target);
};
/*\
 * Snap.plugin
 [ method ]
 **
 * Let you write plugins. You pass in a function with five arguments, like this:
 | Snap.plugin(function (Snap, Element, Paper, global, Fragment) {
 |     Snap.newmethod = function () {};
 |     Element.prototype.newmethod = function () {};
 |     Paper.prototype.newmethod = function () {};
 | });
 * Inside the function you have access to all main objects (and their
 * prototypes). This allow you to extend anything you want.
 **
 - f (function) your plugin body
\*/
Snap.plugin = function (f) {
    f(Snap, Element, Paper, glob, Fragment);
};
glob.win.Snap = Snap;
return Snap;
}(window || this));

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var elproto = Element.prototype,
        is = Snap.is,
        Str = String,
        unit2px = Snap._unit2px,
        $ = Snap._.$,
        make = Snap._.make,
        getSomeDefs = Snap._.getSomeDefs,
        has = "hasOwnProperty",
        wrap = Snap._.wrap;
    /*\
     * Element.getBBox
     [ method ]
     **
     * Returns the bounding box descriptor for the given element
     **
     = (object) bounding box descriptor:
     o {
     o     cx: (number) x of the center,
     o     cy: (number) x of the center,
     o     h: (number) height,
     o     height: (number) height,
     o     path: (string) path command for the box,
     o     r0: (number) radius of a circle that fully encloses the box,
     o     r1: (number) radius of the smallest circle that can be enclosed,
     o     r2: (number) radius of the largest circle that can be enclosed,
     o     vb: (string) box as a viewbox command,
     o     w: (number) width,
     o     width: (number) width,
     o     x2: (number) x of the right side,
     o     x: (number) x of the left side,
     o     y2: (number) y of the bottom edge,
     o     y: (number) y of the top edge
     o }
    \*/
    elproto.getBBox = function (isWithoutTransform) {
        if (!Snap.Matrix || !Snap.path) {
            return this.node.getBBox();
        }
        var el = this,
            m = new Snap.Matrix;
        if (el.removed) {
            return Snap._.box();
        }
        while (el.type == "use") {
            if (!isWithoutTransform) {
                m = m.add(el.transform().localMatrix.translate(el.attr("x") || 0, el.attr("y") || 0));
            }
            if (el.original) {
                el = el.original;
            } else {
                var href = el.attr("xlink:href");
                el = el.original = el.node.ownerDocument.getElementById(href.substring(href.indexOf("#") + 1));
            }
        }
        var _ = el._,
            pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
        try {
            if (isWithoutTransform) {
                _.bboxwt = pathfinder ? Snap.path.getBBox(el.realPath = pathfinder(el)) : Snap._.box(el.node.getBBox());
                return Snap._.box(_.bboxwt);
            } else {
                el.realPath = pathfinder(el);
                el.matrix = el.transform().localMatrix;
                _.bbox = Snap.path.getBBox(Snap.path.map(el.realPath, m.add(el.matrix)));
                return Snap._.box(_.bbox);
            }
        } catch (e) {
            // Firefox doesn’t give you bbox of hidden element
            return Snap._.box();
        }
    };
    var propString = function () {
        return this.string;
    };
    function extractTransform(el, tstr) {
        if (tstr == null) {
            var doReturn = true;
            if (el.type == "linearGradient" || el.type == "radialGradient") {
                tstr = el.node.getAttribute("gradientTransform");
            } else if (el.type == "pattern") {
                tstr = el.node.getAttribute("patternTransform");
            } else {
                tstr = el.node.getAttribute("transform");
            }
            if (!tstr) {
                return new Snap.Matrix;
            }
            tstr = Snap._.svgTransform2string(tstr);
        } else {
            if (!Snap._.rgTransform.test(tstr)) {
                tstr = Snap._.svgTransform2string(tstr);
            } else {
                tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || "");
            }
            if (is(tstr, "array")) {
                tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
            }
            el._.transform = tstr;
        }
        var m = Snap._.transform2matrix(tstr, el.getBBox(1));
        if (doReturn) {
            return m;
        } else {
            el.matrix = m;
        }
    }
    /*\
     * Element.transform
     [ method ]
     **
     * Gets or sets transformation of the element
     **
     - tstr (string) transform string in Snap or SVG format
     = (Element) the current element
     * or
     = (object) transformation descriptor:
     o {
     o     string (string) transform string,
     o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
     o     localMatrix (Matrix) matrix of transformations applied only to the element,
     o     diffMatrix (Matrix) matrix of difference between global and local transformations,
     o     global (string) global transformation as string,
     o     local (string) local transformation as string,
     o     toString (function) returns `string` property
     o }
    \*/
    elproto.transform = function (tstr) {
        var _ = this._;
        if (tstr == null) {
            var papa = this,
                global = new Snap.Matrix(this.node.getCTM()),
                local = extractTransform(this),
                ms = [local],
                m = new Snap.Matrix,
                i,
                localString = local.toTransformString(),
                string = Str(local) == Str(this.matrix) ?
                            Str(_.transform) : localString;
            while (papa.type != "svg" && (papa = papa.parent())) {
                ms.push(extractTransform(papa));
            }
            i = ms.length;
            while (i--) {
                m.add(ms[i]);
            }
            return {
                string: string,
                globalMatrix: global,
                totalMatrix: m,
                localMatrix: local,
                diffMatrix: global.clone().add(local.invert()),
                global: global.toTransformString(),
                total: m.toTransformString(),
                local: localString,
                toString: propString
            };
        }
        if (tstr instanceof Snap.Matrix) {
            this.matrix = tstr;
            this._.transform = tstr.toTransformString();
        } else {
            extractTransform(this, tstr);
        }

        if (this.node) {
            if (this.type == "linearGradient" || this.type == "radialGradient") {
                $(this.node, {gradientTransform: this.matrix});
            } else if (this.type == "pattern") {
                $(this.node, {patternTransform: this.matrix});
            } else {
                $(this.node, {transform: this.matrix});
            }
        }

        return this;
    };
    /*\
     * Element.parent
     [ method ]
     **
     * Returns the element's parent
     **
     = (Element) the parent element
    \*/
    elproto.parent = function () {
        return wrap(this.node.parentNode);
    };
    /*\
     * Element.append
     [ method ]
     **
     * Appends the given element to current one
     **
     - el (Element|Set) element to append
     = (Element) the parent element
    \*/
    /*\
     * Element.add
     [ method ]
     **
     * See @Element.append
    \*/
    elproto.append = elproto.add = function (el) {
        if (el) {
            if (el.type == "set") {
                var it = this;
                el.forEach(function (el) {
                    it.add(el);
                });
                return this;
            }
            el = wrap(el);
            this.node.appendChild(el.node);
            el.paper = this.paper;
        }
        return this;
    };
    /*\
     * Element.appendTo
     [ method ]
     **
     * Appends the current element to the given one
     **
     - el (Element) parent element to append to
     = (Element) the child element
    \*/
    elproto.appendTo = function (el) {
        if (el) {
            el = wrap(el);
            el.append(this);
        }
        return this;
    };
    /*\
     * Element.prepend
     [ method ]
     **
     * Prepends the given element to the current one
     **
     - el (Element) element to prepend
     = (Element) the parent element
    \*/
    elproto.prepend = function (el) {
        if (el) {
            if (el.type == "set") {
                var it = this,
                    first;
                el.forEach(function (el) {
                    if (first) {
                        first.after(el);
                    } else {
                        it.prepend(el);
                    }
                    first = el;
                });
                return this;
            }
            el = wrap(el);
            var parent = el.parent();
            this.node.insertBefore(el.node, this.node.firstChild);
            this.add && this.add();
            el.paper = this.paper;
            this.parent() && this.parent().add();
            parent && parent.add();
        }
        return this;
    };
    /*\
     * Element.prependTo
     [ method ]
     **
     * Prepends the current element to the given one
     **
     - el (Element) parent element to prepend to
     = (Element) the child element
    \*/
    elproto.prependTo = function (el) {
        el = wrap(el);
        el.prepend(this);
        return this;
    };
    /*\
     * Element.before
     [ method ]
     **
     * Inserts given element before the current one
     **
     - el (Element) element to insert
     = (Element) the parent element
    \*/
    elproto.before = function (el) {
        if (el.type == "set") {
            var it = this;
            el.forEach(function (el) {
                var parent = el.parent();
                it.node.parentNode.insertBefore(el.node, it.node);
                parent && parent.add();
            });
            this.parent().add();
            return this;
        }
        el = wrap(el);
        var parent = el.parent();
        this.node.parentNode.insertBefore(el.node, this.node);
        this.parent() && this.parent().add();
        parent && parent.add();
        el.paper = this.paper;
        return this;
    };
    /*\
     * Element.after
     [ method ]
     **
     * Inserts given element after the current one
     **
     - el (Element) element to insert
     = (Element) the parent element
    \*/
    elproto.after = function (el) {
        el = wrap(el);
        var parent = el.parent();
        if (this.node.nextSibling) {
            this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
        } else {
            this.node.parentNode.appendChild(el.node);
        }
        this.parent() && this.parent().add();
        parent && parent.add();
        el.paper = this.paper;
        return this;
    };
    /*\
     * Element.insertBefore
     [ method ]
     **
     * Inserts the element after the given one
     **
     - el (Element) element next to whom insert to
     = (Element) the parent element
    \*/
    elproto.insertBefore = function (el) {
        el = wrap(el);
        var parent = this.parent();
        el.node.parentNode.insertBefore(this.node, el.node);
        this.paper = el.paper;
        parent && parent.add();
        el.parent() && el.parent().add();
        return this;
    };
    /*\
     * Element.insertAfter
     [ method ]
     **
     * Inserts the element after the given one
     **
     - el (Element) element next to whom insert to
     = (Element) the parent element
    \*/
    elproto.insertAfter = function (el) {
        el = wrap(el);
        var parent = this.parent();
        el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
        this.paper = el.paper;
        parent && parent.add();
        el.parent() && el.parent().add();
        return this;
    };
    /*\
     * Element.remove
     [ method ]
     **
     * Removes element from the DOM
     = (Element) the detached element
    \*/
    elproto.remove = function () {
        var parent = this.parent();
        this.node.parentNode && this.node.parentNode.removeChild(this.node);
        delete this.paper;
        this.removed = true;
        parent && parent.add();
        return this;
    };
    /*\
     * Element.select
     [ method ]
     **
     * Gathers the nested @Element matching the given set of CSS selectors
     **
     - query (string) CSS selector
     = (Element) result of query selection
    \*/
    elproto.select = function (query) {
        return wrap(this.node.querySelector(query));
    };
    /*\
     * Element.selectAll
     [ method ]
     **
     * Gathers nested @Element objects matching the given set of CSS selectors
     **
     - query (string) CSS selector
     = (Set|array) result of query selection
    \*/
    elproto.selectAll = function (query) {
        var nodelist = this.node.querySelectorAll(query),
            set = (Snap.set || Array)();
        for (var i = 0; i < nodelist.length; i++) {
            set.push(wrap(nodelist[i]));
        }
        return set;
    };
    /*\
     * Element.asPX
     [ method ]
     **
     * Returns given attribute of the element as a `px` value (not %, em, etc.)
     **
     - attr (string) attribute name
     - value (string) #optional attribute value
     = (Element) result of query selection
    \*/
    elproto.asPX = function (attr, value) {
        if (value == null) {
            value = this.attr(attr);
        }
        return +unit2px(this, attr, value);
    };
    // SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
    /*\
     * Element.use
     [ method ]
     **
     * Creates a `<use>` element linked to the current element
     **
     = (Element) the `<use>` element
    \*/
    elproto.use = function () {
        var use,
            id = this.node.id;
        if (!id) {
            id = this.id;
            $(this.node, {
                id: id
            });
        }
        if (this.type == "linearGradient" || this.type == "radialGradient" ||
            this.type == "pattern") {
            use = make(this.type, this.node.parentNode);
        } else {
            use = make("use", this.node.parentNode);
        }
        $(use.node, {
            "xlink:href": "#" + id
        });
        use.original = this;
        return use;
    };
    function fixids(el) {
        var els = el.selectAll("*"),
            it,
            url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
            ids = [],
            uses = {};
        function urltest(it, name) {
            var val = $(it.node, name);
            val = val && val.match(url);
            val = val && val[2];
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    var attr = {};
                    attr[name] = URL(id);
                    $(it.node, attr);
                });
            }
        }
        function linktest(it) {
            var val = $(it.node, "xlink:href");
            if (val && val.charAt() == "#") {
                val = val.substring(1);
            } else {
                return;
            }
            if (val) {
                uses[val] = (uses[val] || []).concat(function (id) {
                    it.attr("xlink:href", "#" + id);
                });
            }
        }
        for (var i = 0, ii = els.length; i < ii; i++) {
            it = els[i];
            urltest(it, "fill");
            urltest(it, "stroke");
            urltest(it, "filter");
            urltest(it, "mask");
            urltest(it, "clip-path");
            linktest(it);
            var oldid = $(it.node, "id");
            if (oldid) {
                $(it.node, {id: it.id});
                ids.push({
                    old: oldid,
                    id: it.id
                });
            }
        }
        for (i = 0, ii = ids.length; i < ii; i++) {
            var fs = uses[ids[i].old];
            if (fs) {
                for (var j = 0, jj = fs.length; j < jj; j++) {
                    fs[j](ids[i].id);
                }
            }
        }
    }
    /*\
     * Element.clone
     [ method ]
     **
     * Creates a clone of the element and inserts it after the element
     **
     = (Element) the clone
    \*/
    elproto.clone = function () {
        var clone = wrap(this.node.cloneNode(true));
        if ($(clone.node, "id")) {
            $(clone.node, {id: clone.id});
        }
        fixids(clone);
        clone.insertAfter(this);
        return clone;
    };
    /*\
     * Element.toDefs
     [ method ]
     **
     * Moves element to the shared `<defs>` area
     **
     = (Element) the element
    \*/
    elproto.toDefs = function () {
        var defs = getSomeDefs(this);
        defs.appendChild(this.node);
        return this;
    };
    /*\
     * Element.toPattern
     [ method ]
     **
     * Creates a `<pattern>` element from the current element
     **
     * To create a pattern you have to specify the pattern rect:
     - x (string|number)
     - y (string|number)
     - width (string|number)
     - height (string|number)
     = (Element) the `<pattern>` element
     * You can use pattern later on as an argument for `fill` attribute:
     | var p = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
     |         fill: "none",
     |         stroke: "#bada55",
     |         strokeWidth: 5
     |     }).pattern(0, 0, 10, 10),
     |     c = paper.circle(200, 200, 100);
     | c.attr({
     |     fill: p
     | });
    \*/
    elproto.pattern = elproto.toPattern = function (x, y, width, height) {
        var p = make("pattern", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (is(x, "object") && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            x = x.x;
        }
        $(p.node, {
            x: x,
            y: y,
            width: width,
            height: height,
            patternUnits: "userSpaceOnUse",
            id: p.id,
            viewBox: [x, y, width, height].join(" ")
        });
        p.node.appendChild(this.node);
        return p;
    };
// SIERRA Element.marker(): clarify what a reference point is. E.g., helps you offset the object from its edge such as when centering it over a path.
// SIERRA Element.marker(): I suggest the method should accept default reference point values.  Perhaps centered with (refX = width/2) and (refY = height/2)? Also, couldn't it assume the element's current _width_ and _height_? And please specify what _x_ and _y_ mean: offsets? If so, from where?  Couldn't they also be assigned default values?
    /*\
     * Element.marker
     [ method ]
     **
     * Creates a `<marker>` element from the current element
     **
     * To create a marker you have to specify the bounding rect and reference point:
     - x (number)
     - y (number)
     - width (number)
     - height (number)
     - refX (number)
     - refY (number)
     = (Element) the `<marker>` element
     * You can specify the marker later as an argument for `marker-start`, `marker-end`, `marker-mid`, and `marker` attributes. The `marker` attribute places the marker at every point along the path, and `marker-mid` places them at every point except the start and end.
    \*/
    // TODO add usage for markers
    elproto.marker = function (x, y, width, height, refX, refY) {
        var p = make("marker", getSomeDefs(this));
        if (x == null) {
            x = this.getBBox();
        }
        if (is(x, "object") && "x" in x) {
            y = x.y;
            width = x.width;
            height = x.height;
            refX = x.refX || x.cx;
            refY = x.refY || x.cy;
            x = x.x;
        }
        $(p.node, {
            viewBox: [x, y, width, height].join(" "),
            markerWidth: width,
            markerHeight: height,
            orient: "auto",
            refX: refX || 0,
            refY: refY || 0,
            id: p.id
        });
        p.node.appendChild(this.node);
        return p;
    };
    // animation
    function slice(from, to, f) {
        return function (arr) {
            var res = arr.slice(from, to);
            if (res.length == 1) {
                res = res[0];
            }
            return f ? f(res) : res;
        };
    }
    var Animation = function (attr, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        this.attr = attr;
        this.dur = ms;
        easing && (this.easing = easing);
        callback && (this.callback = callback);
    };
    Snap._.Animation = Animation;
    /*\
     * Snap.animation
     [ method ]
     **
     * Creates an animation object
     **
     - attr (object) attributes of final destination
     - duration (number) duration of the animation, in milliseconds
     - easing (function) #optional one of easing functions of @mina or custom one
     - callback (function) #optional callback function that fires when animation ends
     = (object) animation object
    \*/
    Snap.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /*\
     * Element.inAnim
     [ method ]
     **
     * Returns a set of animations that may be able to manipulate the current element
     **
     = (object) in format:
     o {
     o     anim (object) animation object,
     o     mina (object) @mina object,
     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    \*/
    elproto.inAnim = function () {
        var el = this,
            res = [];
        for (var id in el.anims) if (el.anims[has](id)) {
            (function (a) {
                res.push({
                    anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
                    mina: a,
                    curStatus: a.status(),
                    status: function (val) {
                        return a.status(val);
                    },
                    stop: function () {
                        a.stop();
                    }
                });
            }(el.anims[id]));
        }
        return res;
    };
    /*\
     * Snap.animate
     [ method ]
     **
     * Runs generic animation of one number into another with a caring function
     **
     - from (number|array) number or array of numbers
     - to (number|array) number or array of numbers
     - setter (function) caring function that accepts one number argument
     - duration (number) duration, in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function to execute when animation ends
     = (object) animation object in @mina format
     o {
     o     id (string) animation id, consider it read-only,
     o     duration (function) gets or sets the duration of the animation,
     o     easing (function) easing,
     o     speed (function) gets or sets the speed of the animation,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
     | var rect = Snap().rect(0, 0, 10, 10);
     | Snap.animate(0, 10, function (val) {
     |     rect.attr({
     |         x: val
     |     });
     | }, 1000);
     | // in given context is equivalent to
     | rect.animate({x: 10}, 1000);
    \*/
    Snap.animate = function (from, to, setter, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        var now = mina.time(),
            anim = mina(from, to, now, now + ms, mina.time, setter, easing);
        callback && eve.once("mina.finish." + anim.id, callback);
        return anim;
    };
    /*\
     * Element.stop
     [ method ]
     **
     * Stops all the animations for the current element
     **
     = (Element) the current element
    \*/
    elproto.stop = function () {
        var anims = this.inAnim();
        for (var i = 0, ii = anims.length; i < ii; i++) {
            anims[i].stop();
        }
        return this;
    };
    /*\
     * Element.animate
     [ method ]
     **
     * Animates the given attributes of the element
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     = (Element) the current element
    \*/
    elproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = attrs.dur;
            attrs = attrs.attr;
        }
        var fkeys = [], tkeys = [], keys = {}, from, to, f, eq,
            el = this;
        for (var key in attrs) if (attrs[has](key)) {
            if (el.equal) {
                eq = el.equal(key, Str(attrs[key]));
                from = eq.from;
                to = eq.to;
                f = eq.f;
            } else {
                from = +el.attr(key);
                to = +attrs[key];
            }
            var len = is(from, "array") ? from.length : 1;
            keys[key] = slice(fkeys.length, fkeys.length + len, f);
            fkeys = fkeys.concat(from);
            tkeys = tkeys.concat(to);
        }
        var now = mina.time(),
            anim = mina(fkeys, tkeys, now, now + ms, mina.time, function (val) {
                var attr = {};
                for (var key in keys) if (keys[has](key)) {
                    attr[key] = keys[key](val);
                }
                el.attr(attr);
            }, easing);
        el.anims[anim.id] = anim;
        anim._attrs = attrs;
        anim._callback = callback;
        eve("snap.animcreated." + el.id, anim);
        eve.once("mina.finish." + anim.id, function () {
            delete el.anims[anim.id];
            callback && callback.call(el);
        });
        eve.once("mina.stop." + anim.id, function () {
            delete el.anims[anim.id];
        });
        return el;
    };
    var eldata = {};
    /*\
     * Element.data
     [ method ]
     **
     * Adds or retrieves given value associated with given key. (Don’t confuse
     * with `data-` attributes)
     *
     * See also @Element.removeData
     - key (string) key to store data
     - value (any) #optional value to store
     = (object) @Element
     * or, if value is not specified:
     = (any) value
     > Usage
     | for (var i = 0, i < 5, i++) {
     |     paper.circle(10 + 15 * i, 10, 10)
     |          .attr({fill: "#000"})
     |          .data("i", i)
     |          .click(function () {
     |             alert(this.data("i"));
     |          });
     | }
    \*/
    elproto.data = function (key, value) {
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 0){
            eve("snap.data.get." + this.id, this, data, null);
            return data;
        }
        if (arguments.length == 1) {
            if (Snap.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("snap.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("snap.data.set." + this.id, this, value, key);
        return this;
    };
    /*\
     * Element.removeData
     [ method ]
     **
     * Removes value associated with an element by given key.
     * If key is not provided, removes all the data of the element.
     - key (string) #optional key
     = (object) @Element
    \*/
    elproto.removeData = function (key) {
        if (key == null) {
            eldata[this.id] = {};
        } else {
            eldata[this.id] && delete eldata[this.id][key];
        }
        return this;
    };
    /*\
     * Element.outerSVG
     [ method ]
     **
     * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
     *
     * See also @Element.innerSVG
     = (string) SVG code for the element
    \*/
    /*\
     * Element.toString
     [ method ]
     **
     * See @Element.outerSVG
    \*/
    elproto.outerSVG = elproto.toString = toString(1);
    /*\
     * Element.innerSVG
     [ method ]
     **
     * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
     = (string) SVG code for the element
    \*/
    elproto.innerSVG = toString();
    function toString(type) {
        return function () {
            var res = type ? "<" + this.type : "",
                attr = this.node.attributes,
                chld = this.node.childNodes;
            if (type) {
                for (var i = 0, ii = attr.length; i < ii; i++) {
                    res += " " + attr[i].name + '="' +
                            attr[i].value.replace(/"/g, '\\"') + '"';
                }
            }
            if (chld.length) {
                type && (res += ">");
                for (i = 0, ii = chld.length; i < ii; i++) {
                    if (chld[i].nodeType == 3) {
                        res += chld[i].nodeValue;
                    } else if (chld[i].nodeType == 1) {
                        res += wrap(chld[i]).toString();
                    }
                }
                type && (res += "</" + this.type + ">");
            } else {
                type && (res += "/>");
            }
            return res;
        };
    }
    elproto.toDataURL = function () {
        if (window && window.btoa) {
            var bb = this.getBBox(),
                svg = Snap.format('<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>', {
                x: +bb.x.toFixed(3),
                y: +bb.y.toFixed(3),
                width: +bb.width.toFixed(3),
                height: +bb.height.toFixed(3),
                contents: this.outerSVG()
            });
            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        }
    };
    /*\
     * Fragment.select
     [ method ]
     **
     * See @Element.select
    \*/
    Fragment.prototype.select = elproto.select;
    /*\
     * Fragment.selectAll
     [ method ]
     **
     * See @Element.selectAll
    \*/
    Fragment.prototype.selectAll = elproto.selectAll;
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var objectToString = Object.prototype.toString,
        Str = String,
        math = Math,
        E = "";
    function Matrix(a, b, c, d, e, f) {
        if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
            this.a = a.a;
            this.b = a.b;
            this.c = a.c;
            this.d = a.d;
            this.e = a.e;
            this.f = a.f;
            return;
        }
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }
    (function (matrixproto) {
        /*\
         * Matrix.add
         [ method ]
         **
         * Adds the given matrix to existing one
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         * or
         - matrix (object) @Matrix
        \*/
        matrixproto.add = function (a, b, c, d, e, f) {
            var out = [[], [], []],
                m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
                matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
                x, y, z, res;

            if (a && a instanceof Matrix) {
                matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res = 0;
                    for (z = 0; z < 3; z++) {
                        res += m[x][z] * matrix[z][y];
                    }
                    out[x][y] = res;
                }
            }
            this.a = out[0][0];
            this.b = out[1][0];
            this.c = out[0][1];
            this.d = out[1][1];
            this.e = out[0][2];
            this.f = out[1][2];
            return this;
        };
        /*\
         * Matrix.invert
         [ method ]
         **
         * Returns an inverted version of the matrix
         = (object) @Matrix
        \*/
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /*\
         * Matrix.clone
         [ method ]
         **
         * Returns a copy of the matrix
         = (object) @Matrix
        \*/
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /*\
         * Matrix.translate
         [ method ]
         **
         * Translate the matrix
         - x (number) horizontal offset distance
         - y (number) vertical offset distance
        \*/
        matrixproto.translate = function (x, y) {
            return this.add(1, 0, 0, 1, x, y);
        };
        /*\
         * Matrix.scale
         [ method ]
         **
         * Scales the matrix
         - x (number) amount to be scaled, with `1` resulting in no change
         - y (number) #optional amount to scale along the vertical axis. (Otherwise `x` applies to both axes.)
         - cx (number) #optional horizontal origin point from which to scale
         - cy (number) #optional vertical origin point from which to scale
         * Default cx, cy is the middle point of the element.
        \*/
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
            this.add(x, 0, 0, y, 0, 0);
            (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
            return this;
        };
        /*\
         * Matrix.rotate
         [ method ]
         **
         * Rotates the matrix
         - a (number) angle of rotation, in degrees
         - x (number) horizontal origin point from which to rotate
         - y (number) vertical origin point from which to rotate
        \*/
        matrixproto.rotate = function (a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        };
        /*\
         * Matrix.x
         [ method ]
         **
         * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
         - x (number)
         - y (number)
         = (number) x
        \*/
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /*\
         * Matrix.y
         [ method ]
         **
         * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
         - x (number)
         - y (number)
         = (number) y
        \*/
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(4);
        };
        matrixproto.toString = function () {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(4), this.f.toFixed(4)];
        };
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }
        /*\
         * Matrix.determinant
         [ method ]
         **
         * Finds determinant of the given matrix.
         = (number) determinant
        \*/
        matrixproto.determinant = function () {
            return this.a * this.d - this.b * this.c;
        };
        /*\
         * Matrix.split
         [ method ]
         **
         * Splits matrix into primitive transformations
         = (object) in format:
         o dx (number) translation by x
         o dy (number) translation by y
         o scalex (number) scale by x
         o scaley (number) scale by y
         o shear (number) shear
         o rotate (number) rotation in deg
         o isSimple (boolean) could it be represented via simple transformations
        \*/
        matrixproto.split = function () {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            // scale and shear
            var row = [[this.a, this.c], [this.b, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            if (this.determinant() < 0) {
                out.scalex = -out.scalex;
            }

            // rotation
            var sin = -row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = Snap.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = Snap.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };
        /*\
         * Matrix.toTransformString
         [ method ]
         **
         * Returns transform string that represents given matrix
         = (string) transform string
        \*/
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this.split();
            if (!+s.shear.toFixed(9)) {
                s.scalex = +s.scalex.toFixed(4);
                s.scaley = +s.scaley.toFixed(4);
                s.rotate = +s.rotate.toFixed(4);
                return  (s.dx || s.dy ? "t" + [+s.dx.toFixed(4), +s.dy.toFixed(4)] : E) + 
                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                        (s.rotate ? "r" + [+s.rotate.toFixed(4), 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };
    })(Matrix.prototype);
    /*\
     * Snap.Matrix
     [ method ]
     **
     * Matrix constructor, extend on your own risk.
     * To create matrices use @Snap.matrix.
    \*/
    Snap.Matrix = Matrix;
    /*\
     * Snap.matrix
     [ method ]
     **
     * Utility method
     **
     * Returns a matrix based on the given parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     * or
     - svgMatrix (SVGMatrix)
     = (object) @Matrix
    \*/
    Snap.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
});
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var has = "hasOwnProperty",
        make = Snap._.make,
        wrap = Snap._.wrap,
        is = Snap.is,
        getSomeDefs = Snap._.getSomeDefs,
        reURLValue = /^url\(#?([^)]+)\)$/,
        $ = Snap._.$,
        URL = Snap.url,
        Str = String,
        separator = Snap._.separator,
        E = "";
    // Attributes event handlers
    eve.on("snap.util.attr.mask", function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value.type == "mask") {
                var mask = value;
            } else {
                mask = make("mask", getSomeDefs(this));
                mask.node.appendChild(value.node);
            }
            !mask.node.id && $(mask.node, {
                id: mask.id
            });
            $(this.node, {
                mask: URL(mask.id)
            });
        }
    });
    (function (clipIt) {
        eve.on("snap.util.attr.clip", clipIt);
        eve.on("snap.util.attr.clip-path", clipIt);
        eve.on("snap.util.attr.clipPath", clipIt);
    }(function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            if (value.type == "clipPath") {
                var clip = value;
            } else {
                clip = make("clipPath", getSomeDefs(this));
                clip.node.appendChild(value.node);
                !clip.node.id && $(clip.node, {
                    id: clip.id
                });
            }
            $(this.node, {
                "clip-path": URL(clip.node.id || clip.id)
            });
        }
    }));
    function fillStroke(name) {
        return function (value) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1 &&
                (value.node.firstChild.tagName == "radialGradient" ||
                value.node.firstChild.tagName == "linearGradient" ||
                value.node.firstChild.tagName == "pattern")) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value instanceof Element) {
                if (value.type == "radialGradient" || value.type == "linearGradient"
                   || value.type == "pattern") {
                    if (!value.node.id) {
                        $(value.node, {
                            id: value.id
                        });
                    }
                    var fill = URL(value.node.id);
                } else {
                    fill = value.attr(name);
                }
            } else {
                fill = Snap.color(value);
                if (fill.error) {
                    var grad = Snap(getSomeDefs(this).ownerSVGElement).gradient(value);
                    if (grad) {
                        if (!grad.node.id) {
                            $(grad.node, {
                                id: grad.id
                            });
                        }
                        fill = URL(grad.node.id);
                    } else {
                        fill = value;
                    }
                } else {
                    fill = Str(fill);
                }
            }
            var attrs = {};
            attrs[name] = fill;
            $(this.node, attrs);
            this.node.style[name] = E;
        };
    }
    eve.on("snap.util.attr.fill", fillStroke("fill"));
    eve.on("snap.util.attr.stroke", fillStroke("stroke"));
    var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
    eve.on("snap.util.grad.parse", function parseGrad(string) {
        string = Str(string);
        var tokens = string.match(gradrg);
        if (!tokens) {
            return null;
        }
        var type = tokens[1],
            params = tokens[2],
            stops = tokens[3];
        params = params.split(/\s*,\s*/).map(function (el) {
            return +el == el ? +el : el;
        });
        if (params.length == 1 && params[0] == 0) {
            params = [];
        }
        stops = stops.split("-");
        stops = stops.map(function (el) {
            el = el.split(":");
            var out = {
                color: el[0]
            };
            if (el[1]) {
                out.offset = parseFloat(el[1]);
            }
            return out;
        });
        return {
            type: type,
            params: params,
            stops: stops
        };
    });

    eve.on("snap.util.attr.d", function (value) {
        eve.stop();
        if (is(value, "array") && is(value[0], "array")) {
            value = Snap.path.toString.call(value);
        }
        value = Str(value);
        if (value.match(/[ruo]/i)) {
            value = Snap.path.toAbsolute(value);
        }
        $(this.node, {d: value});
    })(-1);
    eve.on("snap.util.attr.#text", function (value) {
        eve.stop();
        value = Str(value);
        var txt = glob.doc.createTextNode(value);
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        this.node.appendChild(txt);
    })(-1);
    eve.on("snap.util.attr.path", function (value) {
        eve.stop();
        this.attr({d: value});
    })(-1);
    eve.on("snap.util.attr.class", function (value) {
        eve.stop();
        this.node.className.baseVal = value;
    })(-1);
    eve.on("snap.util.attr.viewBox", function (value) {
        var vb;
        if (is(value, "object") && "x" in value) {
            vb = [value.x, value.y, value.width, value.height].join(" ");
        } else if (is(value, "array")) {
            vb = value.join(" ");
        } else {
            vb = value;
        }
        $(this.node, {
            viewBox: vb
        });
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.transform", function (value) {
        this.transform(value);
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.r", function (value) {
        if (this.type == "rect") {
            eve.stop();
            $(this.node, {
                rx: value,
                ry: value
            });
        }
    })(-1);
    eve.on("snap.util.attr.textpath", function (value) {
        eve.stop();
        if (this.type == "text") {
            var id, tp, node;
            if (!value && this.textPath) {
                tp = this.textPath;
                while (tp.node.firstChild) {
                    this.node.appendChild(tp.node.firstChild);
                }
                tp.remove();
                delete this.textPath;
                return;
            }
            if (is(value, "string")) {
                var defs = getSomeDefs(this),
                    path = wrap(defs.parentNode).path(value);
                defs.appendChild(path.node);
                id = path.id;
                path.attr({id: id});
            } else {
                value = wrap(value);
                if (value instanceof Element) {
                    id = value.attr("id");
                    if (!id) {
                        id = value.id;
                        value.attr({id: id});
                    }
                }
            }
            if (id) {
                tp = this.textPath;
                node = this.node;
                if (tp) {
                    tp.attr({"xlink:href": "#" + id});
                } else {
                    tp = $("textPath", {
                        "xlink:href": "#" + id
                    });
                    while (node.firstChild) {
                        tp.appendChild(node.firstChild);
                    }
                    node.appendChild(tp);
                    this.textPath = wrap(tp);
                }
            }
        }
    })(-1);
    eve.on("snap.util.attr.text", function (value) {
        if (this.type == "text") {
            var i = 0,
                node = this.node,
                tuner = function (chunk) {
                    var out = $("tspan");
                    if (is(chunk, "array")) {
                        for (var i = 0; i < chunk.length; i++) {
                            out.appendChild(tuner(chunk[i]));
                        }
                    } else {
                        out.appendChild(glob.doc.createTextNode(chunk));
                    }
                    out.normalize && out.normalize();
                    return out;
                };
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var tuned = tuner(value);
            while (tuned.firstChild) {
                node.appendChild(tuned.firstChild);
            }
        }
        eve.stop();
    })(-1);
    function setFontSize(value) {
        eve.stop();
        if (value == +value) {
            value += "px";
        }
        this.node.style.fontSize = value;
    }
    eve.on("snap.util.attr.fontSize", setFontSize)(-1);
    eve.on("snap.util.attr.font-size", setFontSize)(-1);


    eve.on("snap.util.getattr.transform", function () {
        eve.stop();
        return this.transform();
    })(-1);
    eve.on("snap.util.getattr.textpath", function () {
        eve.stop();
        return this.textPath;
    })(-1);
    // Markers
    (function () {
        function getter(end) {
            return function () {
                eve.stop();
                var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
                if (style == "none") {
                    return style;
                } else {
                    return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
                }
            };
        }
        function setter(end) {
            return function (value) {
                eve.stop();
                var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
                if (value == "" || !value) {
                    this.node.style[name] = "none";
                    return;
                }
                if (value.type == "marker") {
                    var id = value.node.id;
                    if (!id) {
                        $(value.node, {id: value.id});
                    }
                    this.node.style[name] = URL(id);
                    return;
                }
            };
        }
        eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
        eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
        eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
        eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
        eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
        eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
        eve.on("snap.util.attr.marker-end", setter("end"))(-1);
        eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
        eve.on("snap.util.attr.marker-start", setter("start"))(-1);
        eve.on("snap.util.attr.markerStart", setter("start"))(-1);
        eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
        eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
    }());
    eve.on("snap.util.getattr.r", function () {
        if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
            eve.stop();
            return $(this.node, "rx");
        }
    })(-1);
    function textExtract(node) {
        var out = [];
        var children = node.childNodes;
        for (var i = 0, ii = children.length; i < ii; i++) {
            var chi = children[i];
            if (chi.nodeType == 3) {
                out.push(chi.nodeValue);
            }
            if (chi.tagName == "tspan") {
                if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
                    out.push(chi.firstChild.nodeValue);
                } else {
                    out.push(textExtract(chi));
                }
            }
        }
        return out;
    }
    eve.on("snap.util.getattr.text", function () {
        if (this.type == "text" || this.type == "tspan") {
            eve.stop();
            var out = textExtract(this.node);
            return out.length == 1 ? out[0] : out;
        }
    })(-1);
    eve.on("snap.util.getattr.#text", function () {
        return this.node.textContent;
    })(-1);
    eve.on("snap.util.getattr.viewBox", function () {
        eve.stop();
        var vb = $(this.node, "viewBox");
        if (vb) {
            vb = vb.split(separator);
            return Snap._.box(+vb[0], +vb[1], +vb[2], +vb[3]);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.points", function () {
        var p = $(this.node, "points");
        eve.stop();
        if (p) {
            return p.split(separator);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.path", function () {
        var p = $(this.node, "d");
        eve.stop();
        return p;
    })(-1);
    eve.on("snap.util.getattr.class", function () {
        return this.node.className.baseVal;
    })(-1);
    function getFontSize() {
        eve.stop();
        return this.node.style.fontSize;
    }
    eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
    eve.on("snap.util.getattr.font-size", getFontSize)(-1);
});

// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var rgNotSpace = /\S+/g,
        rgBadSpace = /[\t\r\n\f]/g,
        rgTrim = /(^\s+|\s+$)/g,
        Str = String,
        elproto = Element.prototype;
    /*\
     * Element.addClass
     [ method ]
     **
     * Adds given class name or list of class names to the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
    elproto.addClass = function (value) {
        var classes = Str(value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;

        if (classes.length) {
            j = 0;
            while ((clazz = classes[j++])) {
                pos = curClasses.indexOf(clazz);
                if (!~pos) {
                    curClasses.push(clazz);
                }
            }

            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                elem.className.baseVal = finalValue;
            }
        }
        return this;
    };
    /*\
     * Element.removeClass
     [ method ]
     **
     * Removes given class name or list of class names from the element.
     - value (string) class name or space separated list of class names
     **
     = (Element) original element.
    \*/
    elproto.removeClass = function (value) {
        var classes = Str(value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;
        if (curClasses.length) {
            j = 0;
            while ((clazz = classes[j++])) {
                pos = curClasses.indexOf(clazz);
                if (~pos) {
                    curClasses.splice(pos, 1);
                }
            }

            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                elem.className.baseVal = finalValue;
            }
        }
        return this;
    };
    /*\
     * Element.hasClass
     [ method ]
     **
     * Checks if the element has a given class name in the list of class names applied to it.
     - value (string) class name
     **
     = (boolean) `true` if the element has given class
    \*/
    elproto.hasClass = function (value) {
        var elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [];
        return !!~curClasses.indexOf(value);
    };
    /*\
     * Element.toggleClass
     [ method ]
     **
     * Add or remove one or more classes from the element, depending on either
     * the class’s presence or the value of the `flag` argument.
     - value (string) class name or space separated list of class names
     - flag (boolean) value to determine whether the class should be added or removed
     **
     = (Element) original element.
    \*/
    elproto.toggleClass = function (value, flag) {
        if (flag != null) {
            if (flag) {
                return this.addClass(value);
            } else {
                return this.removeClass(value);
            }
        }
        var classes = (value || "").match(rgNotSpace) || [],
            elem = this.node,
            className = elem.className.baseVal,
            curClasses = className.match(rgNotSpace) || [],
            j,
            pos,
            clazz,
            finalValue;
        j = 0;
        while ((clazz = classes[j++])) {
            pos = curClasses.indexOf(clazz);
            if (~pos) {
                curClasses.splice(pos, 1);
            } else {
                curClasses.push(clazz);
            }
        }

        finalValue = curClasses.join(" ");
        if (className != finalValue) {
            elem.className.baseVal = finalValue;
        }
        return this;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var operators = {
            "+": function (x, y) {
                    return x + y;
                },
            "-": function (x, y) {
                    return x - y;
                },
            "/": function (x, y) {
                    return x / y;
                },
            "*": function (x, y) {
                    return x * y;
                }
        },
        Str = String,
        reUnit = /[a-z]+$/i,
        reAddon = /^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    eve.on("snap.util.attr", function (val) {
        var plus = Str(val).match(reAddon);
        if (plus) {
            var evnt = eve.nt(),
                name = evnt.substring(evnt.lastIndexOf(".") + 1),
                a = this.attr(name),
                atr = {};
            eve.stop();
            var unit = plus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[plus[1]];
            if (aUnit && aUnit == unit) {
                val = op(parseFloat(a), +plus[2]);
            } else {
                a = this.asPX(name);
                val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
            }
            if (isNaN(a) || isNaN(val)) {
                return;
            }
            atr[name] = val;
            this.attr(atr);
        }
    })(-10);
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this,
            bplus = Str(b).match(reAddon);
        if (bplus) {
            eve.stop();
            var unit = bplus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[bplus[1]];
            if (aUnit && aUnit == unit) {
                return {
                    from: parseFloat(a),
                    to: op(parseFloat(a), +bplus[2]),
                    f: getUnit(aUnit)
                };
            } else {
                a = this.asPX(name);
                return {
                    from: a,
                    to: op(a, this.asPX(name, bplus[2] + unit)),
                    f: getNumber
                };
            }
        }
    })(-10);
});
// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var proto = Paper.prototype,
        is = Snap.is;
    /*\
     * Paper.rect
     [ method ]
     *
     * Draws a rectangle
     **
     - x (number) x coordinate of the top left corner
     - y (number) y coordinate of the top left corner
     - width (number) width
     - height (number) height
     - rx (number) #optional horizontal radius for rounded corners, default is 0
     - ry (number) #optional vertical radius for rounded corners, default is rx or 0
     = (object) the `rect` element
     **
     > Usage
     | // regular rectangle
     | var c = paper.rect(10, 10, 50, 50);
     | // rectangle with rounded corners
     | var c = paper.rect(40, 40, 50, 50, 10);
    \*/
    proto.rect = function (x, y, w, h, rx, ry) {
        var attr;
        if (ry == null) {
            ry = rx;
        }
        if (is(x, "object") && x == "[object Object]") {
            attr = x;
        } else if (x != null) {
            attr = {
                x: x,
                y: y,
                width: w,
                height: h
            };
            if (rx != null) {
                attr.rx = rx;
                attr.ry = ry;
            }
        }
        return this.el("rect", attr);
    };
    /*\
     * Paper.circle
     [ method ]
     **
     * Draws a circle
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - r (number) radius
     = (object) the `circle` element
     **
     > Usage
     | var c = paper.circle(50, 50, 40);
    \*/
    proto.circle = function (cx, cy, r) {
        var attr;
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr = {
                cx: cx,
                cy: cy,
                r: r
            };
        }
        return this.el("circle", attr);
    };

    var preload = (function () {
        function onerror() {
            this.parentNode.removeChild(this);
        }
        return function (src, f) {
            var img = glob.doc.createElement("img"),
                body = glob.doc.body;
            img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
            img.onload = function () {
                f.call(img);
                img.onload = img.onerror = null;
                body.removeChild(img);
            };
            img.onerror = onerror;
            body.appendChild(img);
            img.src = src;
        };
    }());

    /*\
     * Paper.image
     [ method ]
     **
     * Places an image on the surface
     **
     - src (string) URI of the source image
     - x (number) x offset position
     - y (number) y offset position
     - width (number) width of the image
     - height (number) height of the image
     = (object) the `image` element
     * or
     = (object) Snap element object with type `image`
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    proto.image = function (src, x, y, width, height) {
        var el = this.el("image");
        if (is(src, "object") && "src" in src) {
            el.attr(src);
        } else if (src != null) {
            var set = {
                "xlink:href": src,
                preserveAspectRatio: "none"
            };
            if (x != null && y != null) {
                set.x = x;
                set.y = y;
            }
            if (width != null && height != null) {
                set.width = width;
                set.height = height;
            } else {
                preload(src, function () {
                    Snap._.$(el.node, {
                        width: this.offsetWidth,
                        height: this.offsetHeight
                    });
                });
            }
            Snap._.$(el.node, set);
        }
        return el;
    };
    /*\
     * Paper.ellipse
     [ method ]
     **
     * Draws an ellipse
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - rx (number) horizontal radius
     - ry (number) vertical radius
     = (object) the `ellipse` element
     **
     > Usage
     | var c = paper.ellipse(50, 50, 40, 20);
    \*/
    proto.ellipse = function (cx, cy, rx, ry) {
        var attr;
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr ={
                cx: cx,
                cy: cy,
                rx: rx,
                ry: ry
            };
        }
        return this.el("ellipse", attr);
    };
    // SIERRA Paper.path(): Unclear from the link what a Catmull-Rom curveto is, and why it would make life any easier.
    /*\
     * Paper.path
     [ method ]
     **
     * Creates a `<path>` element using the given string as the path's definition
     - pathString (string) #optional path string in SVG format
     * Path string consists of one-letter commands, followed by comma seprarated arguments in numerical form. Example:
     | "M10,20L30,40"
     * This example features two commands: `M`, with arguments `(10, 20)` and `L` with arguments `(30, 40)`. Uppercase letter commands express coordinates in absolute terms, while lowercase commands express them in relative terms from the most recently declared coordinates.
     *
     # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a> or <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">article about path strings at MDN</a>.</p>
     # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
     # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
     # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
     # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
     # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
     # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
     # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
     # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
     # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
     # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
     # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
     # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
     * * _Catmull-Rom curveto_ is a not standard SVG command and added to make life easier.
     * Note: there is a special case when a path consists of only three commands: `M10,10R…z`. In this case the path connects back to its starting point.
     > Usage
     | var c = paper.path("M10 10L90 90");
     | // draw a diagonal line:
     | // move to 10,10, line to 90,90
    \*/
    proto.path = function (d) {
        var attr;
        if (is(d, "object") && !is(d, "array")) {
            attr = d;
        } else if (d) {
            attr = {d: d};
        }
        return this.el("path", attr);
    };
    /*\
     * Paper.g
     [ method ]
     **
     * Creates a group element
     **
     - varargs (…) #optional elements to nest within the group
     = (object) the `g` element
     **
     > Usage
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g(c2, c1); // note that the order of elements is different
     * or
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g();
     | g.add(c2, c1);
    \*/
    /*\
     * Paper.group
     [ method ]
     **
     * See @Paper.g
    \*/
    proto.group = proto.g = function (first) {
        var attr,
            el = this.el("g");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.svg
     [ method ]
     **
     * Creates a nested SVG element.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `svg` element
     **
    \*/
    proto.svg = function (x, y, width, height, vbx, vby, vbw, vbh) {
        var attrs = {};
        if (is(x, "object") && y == null) {
            attrs = x;
        } else {
            if (x != null) {
                attrs.x = x;
            }
            if (y != null) {
                attrs.y = y;
            }
            if (width != null) {
                attrs.width = width;
            }
            if (height != null) {
                attrs.height = height;
            }
            if (vbx != null && vby != null && vbw != null && vbh != null) {
                attrs.viewBox = [vbx, vby, vbw, vbh];
            }
        }
        return this.el("svg", attrs);
    };
    /*\
     * Paper.mask
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a mask.
     **
     = (object) the `mask` element
     **
    \*/
    proto.mask = function (first) {
        var attr,
            el = this.el("mask");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.ptrn
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a pattern.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `pattern` element
     **
    \*/
    proto.ptrn = function (x, y, width, height, vx, vy, vw, vh) {
        if (is(x, "object")) {
            var attr = x;
        } else {
            attr = {patternUnits: "userSpaceOnUse"};
            if (x) {
                attr.x = x;
            }
            if (y) {
                attr.y = y;
            }
            if (width != null) {
                attr.width = width;
            }
            if (height != null) {
                attr.height = height;
            }
            if (vx != null && vy != null && vw != null && vh != null) {
                attr.viewBox = [vx, vy, vw, vh];
            } else {
                attr.viewBox = [x || 0, y || 0, width || 0, height || 0];
            }
        }
        return this.el("pattern", attr);
    };
    /*\
     * Paper.use
     [ method ]
     **
     * Creates a <use> element.
     - id (string) @optional id of element to link
     * or
     - id (Element) @optional element to link
     **
     = (object) the `use` element
     **
    \*/
    proto.use = function (id) {
        if (id != null) {
            if (id instanceof Element) {
                if (!id.attr("id")) {
                    id.attr({id: Snap._.id(id)});
                }
                id = id.attr("id");
            }
            if (String(id).charAt() == "#") {
                id = id.substring(1);
            }
            return this.el("use", {"xlink:href": "#" + id});
        } else {
            return Element.prototype.use.call(this);
        }
    };
    /*\
     * Paper.symbol
     [ method ]
     **
     * Creates a <symbol> element.
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     = (object) the `symbol` element
     **
    \*/
    proto.symbol = function (vx, vy, vw, vh) {
        var attr = {};
        if (vx != null && vy != null && vw != null && vh != null) {
            attr.viewBox = [vx, vy, vw, vh];
        }

        return this.el("symbol", attr);
    };
    /*\
     * Paper.text
     [ method ]
     **
     * Draws a text string
     **
     - x (number) x coordinate position
     - y (number) y coordinate position
     - text (string|array) The text string to draw or array of strings to nest within separate `<tspan>` elements
     = (object) the `text` element
     **
     > Usage
     | var t1 = paper.text(50, 50, "Snap");
     | var t2 = paper.text(50, 50, ["S","n","a","p"]);
     | // Text path usage
     | t1.attr({textpath: "M10,10L100,100"});
     | // or
     | var pth = paper.path("M10,10L100,100");
     | t1.attr({textpath: pth});
    \*/
    proto.text = function (x, y, text) {
        var attr = {};
        if (is(x, "object")) {
            attr = x;
        } else if (x != null) {
            attr = {
                x: x,
                y: y,
                text: text || ""
            };
        }
        return this.el("text", attr);
    };
    /*\
     * Paper.line
     [ method ]
     **
     * Draws a line
     **
     - x1 (number) x coordinate position of the start
     - y1 (number) y coordinate position of the start
     - x2 (number) x coordinate position of the end
     - y2 (number) y coordinate position of the end
     = (object) the `line` element
     **
     > Usage
     | var t1 = paper.line(50, 50, 100, 100);
    \*/
    proto.line = function (x1, y1, x2, y2) {
        var attr = {};
        if (is(x1, "object")) {
            attr = x1;
        } else if (x1 != null) {
            attr = {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            };
        }
        return this.el("line", attr);
    };
    /*\
     * Paper.polyline
     [ method ]
     **
     * Draws a polyline
     **
     - points (array) array of points
     * or
     - varargs (…) points
     = (object) the `polyline` element
     **
     > Usage
     | var p1 = paper.polyline([10, 10, 100, 100]);
     | var p2 = paper.polyline(10, 10, 100, 100);
    \*/
    proto.polyline = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var attr = {};
        if (is(points, "object") && !is(points, "array")) {
            attr = points;
        } else if (points != null) {
            attr = {points: points};
        }
        return this.el("polyline", attr);
    };
    /*\
     * Paper.polygon
     [ method ]
     **
     * Draws a polygon. See @Paper.polyline
    \*/
    proto.polygon = function (points) {
        if (arguments.length > 1) {
            points = Array.prototype.slice.call(arguments, 0);
        }
        var attr = {};
        if (is(points, "object") && !is(points, "array")) {
            attr = points;
        } else if (points != null) {
            attr = {points: points};
        }
        return this.el("polygon", attr);
    };
    // gradients
    (function () {
        var $ = Snap._.$;
        // gradients' helpers
        function Gstops() {
            return this.selectAll("stop");
        }
        function GaddStop(color, offset) {
            var stop = $("stop"),
                attr = {
                    offset: +offset + "%"
                };
            color = Snap.color(color);
            attr["stop-color"] = color.hex;
            if (color.opacity < 1) {
                attr["stop-opacity"] = color.opacity;
            }
            $(stop, attr);
            this.node.appendChild(stop);
            return this;
        }
        function GgetBBox() {
            if (this.type == "linearGradient") {
                var x1 = $(this.node, "x1") || 0,
                    x2 = $(this.node, "x2") || 1,
                    y1 = $(this.node, "y1") || 0,
                    y2 = $(this.node, "y2") || 0;
                return Snap._.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
            } else {
                var cx = this.node.cx || .5,
                    cy = this.node.cy || .5,
                    r = this.node.r || 0;
                return Snap._.box(cx - r, cy - r, r * 2, r * 2);
            }
        }
        function gradient(defs, str) {
            var grad = eve("snap.util.grad.parse", null, str).firstDefined(),
                el;
            if (!grad) {
                return null;
            }
            grad.params.unshift(defs);
            if (grad.type.toLowerCase() == "l") {
                el = gradientLinear.apply(0, grad.params);
            } else {
                el = gradientRadial.apply(0, grad.params);
            }
            if (grad.type != grad.type.toLowerCase()) {
                $(el.node, {
                    gradientUnits: "userSpaceOnUse"
                });
            }
            var stops = grad.stops,
                len = stops.length,
                start = 0,
                j = 0;
            function seed(i, end) {
                var step = (end - start) / (i - j);
                for (var k = j; k < i; k++) {
                    stops[k].offset = +(+start + step * (k - j)).toFixed(2);
                }
                j = i;
                start = end;
            }
            len--;
            for (var i = 0; i < len; i++) if ("offset" in stops[i]) {
                seed(i, stops[i].offset);
            }
            stops[len].offset = stops[len].offset || 100;
            seed(len, stops[len].offset);
            for (i = 0; i <= len; i++) {
                var stop = stops[i];
                el.addStop(stop.color, stop.offset);
            }
            return el;
        }
        function gradientLinear(defs, x1, y1, x2, y2) {
            var el = Snap._.make("linearGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (x1 != null) {
                $(el.node, {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                });
            }
            return el;
        }
        function gradientRadial(defs, cx, cy, r, fx, fy) {
            var el = Snap._.make("radialGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (cx != null) {
                $(el.node, {
                    cx: cx,
                    cy: cy,
                    r: r
                });
            }
            if (fx != null && fy != null) {
                $(el.node, {
                    fx: fx,
                    fy: fy
                });
            }
            return el;
        }
        /*\
         * Paper.gradient
         [ method ]
         **
         * Creates a gradient element
         **
         - gradient (string) gradient descriptor
         > Gradient Descriptor
         * The gradient descriptor is an expression formatted as
         * follows: `<type>(<coords>)<colors>`.  The `<type>` can be
         * either linear or radial.  The uppercase `L` or `R` letters
         * indicate absolute coordinates offset from the SVG surface.
         * Lowercase `l` or `r` letters indicate coordinates
         * calculated relative to the element to which the gradient is
         * applied.  Coordinates specify a linear gradient vector as
         * `x1`, `y1`, `x2`, `y2`, or a radial gradient as `cx`, `cy`,
         * `r` and optional `fx`, `fy` specifying a focal point away
         * from the center of the circle. Specify `<colors>` as a list
         * of dash-separated CSS color values.  Each color may be
         * followed by a custom offset value, separated with a colon
         * character.
         > Examples
         * Linear gradient, relative from top-left corner to bottom-right
         * corner, from black through red to white:
         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         * Linear gradient, absolute from (0, 0) to (100, 100), from black
         * through red at 25% to white:
         | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25-#fff");
         * Radial gradient, relative from the center of the element with radius
         * half the width, from black to white:
         | var g = paper.gradient("r(0.5, 0.5, 0.5)#000-#fff");
         * To apply the gradient:
         | paper.circle(50, 50, 40).attr({
         |     fill: g
         | });
         = (object) the `gradient` element
        \*/
        proto.gradient = function (str) {
            return gradient(this.defs, str);
        };
        proto.gradientLinear = function (x1, y1, x2, y2) {
            return gradientLinear(this.defs, x1, y1, x2, y2);
        };
        proto.gradientRadial = function (cx, cy, r, fx, fy) {
            return gradientRadial(this.defs, cx, cy, r, fx, fy);
        };
        /*\
         * Paper.toString
         [ method ]
         **
         * Returns SVG code for the @Paper
         = (string) SVG code for the @Paper
        \*/
        proto.toString = function () {
            var doc = this.node.ownerDocument,
                f = doc.createDocumentFragment(),
                d = doc.createElement("div"),
                svg = this.node.cloneNode(true),
                res;
            f.appendChild(d);
            d.appendChild(svg);
            Snap._.$(svg, {xmlns: "http://www.w3.org/2000/svg"});
            res = d.innerHTML;
            f.removeChild(f.firstChild);
            return res;
        };
        /*\
         * Paper.toDataURL
         [ method ]
         **
         * Returns SVG code for the @Paper as Data URI string.
         = (string) Data URI string
        \*/
        proto.toDataURL = function () {
            if (window && window.btoa) {
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this)));
            }
        };
        /*\
         * Paper.clear
         [ method ]
         **
         * Removes all child nodes of the paper, except <defs>.
        \*/
        proto.clear = function () {
            var node = this.node.firstChild,
                next;
            while (node) {
                next = node.nextSibling;
                if (node.tagName != "defs") {
                    node.parentNode.removeChild(node);
                } else {
                    proto.clear.call({node: node});
                }
                node = next;
            }
        };
    }());
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
        is = Snap.is,
        clone = Snap._.clone,
        has = "hasOwnProperty",
        p2s = /,?([a-z]),?/gi,
        toFloat = parseFloat,
        math = Math,
        PI = math.PI,
        mmin = math.min,
        mmax = math.max,
        pow = math.pow,
        abs = math.abs;
    function paths(ps) {
        var p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    }
    function box(x, y, width, height) {
        if (x == null) {
            x = y = width = height = 0;
        }
        if (y == null) {
            y = x.y;
            width = x.width;
            height = x.height;
            x = x.x;
        }
        return {
            x: x,
            y: y,
            width: width,
            w: width,
            height: height,
            h: height,
            x2: x + width,
            y2: y + height,
            cx: x + width / 2,
            cy: y + height / 2,
            r1: math.min(width, height) / 2,
            r2: math.max(width, height) / 2,
            r0: math.sqrt(width * width + height * height) / 2,
            path: rectPath(x, y, width, height),
            vb: [x, y, width, height].join(" ")
        };
    }
    function toString() {
        return this.join(",").replace(p2s, "$1");
    }
    function pathClone(pathArray) {
        var res = clone(pathArray);
        res.toString = toString;
        return res;
    }
    function getPointAtSegmentLength(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
                getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    }
    function getLengthFactory(istotal, subpath) {
        function O(val) {
            return +(+val).toFixed(3);
        }
        return Snap._.cacher(function (path, length, onlystart) {
            if (path instanceof Element) {
                path = path.attr("d");
            }
            path = path2curve(path);
            var x, y, p, l, sp = "", subpaths = {}, point,
                len = 0;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            sp += [
                                "C" + O(point.start.x),
                                O(point.start.y),
                                O(point.m.x),
                                O(point.m.y),
                                O(point.x),
                                O(point.y)
                            ];
                            if (onlystart) {return sp;}
                            subpaths.start = sp;
                            sp = [
                                "M" + O(point.x),
                                O(point.y) + "C" + O(point.n.x),
                                O(point.n.y),
                                O(point.end.x),
                                O(point.end.y),
                                O(p[5]),
                                O(p[6])
                            ].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            return point;
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ? len : subpath ? subpaths : findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            return point;
        }, null, Snap._.clone);
    }
    var getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);
    function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = (90 - math.atan2(mx - nx, my - ny) * 180 / PI);
        // (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha
        };
    }
    function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!Snap.is(p1x, "array")) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        var bbox = curveDim.apply(null, p1x);
        return box(
            bbox.min.x,
            bbox.min.y,
            bbox.max.x - bbox.min.x,
            bbox.max.y - bbox.min.y
        );
    }
    function isPointInsideBBox(bbox, x, y) {
        return  x >= bbox.x &&
                x <= bbox.x + bbox.width &&
                y >= bbox.y &&
                y <= bbox.y + bbox.height;
    }
    function isBBoxIntersect(bbox1, bbox2) {
        bbox1 = box(bbox1);
        bbox2 = box(bbox2);
        return isPointInsideBBox(bbox2, bbox1.x, bbox1.y)
            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y)
            || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2)
            || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2)
            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y)
            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y)
            || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2)
            || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2)
            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x
                || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y
                || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    }
    function base3(t, p1, p2, p3, p4) {
        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }
    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        var z2 = z / 2,
            n = 12,
            Tvalues = [-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816],
            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
            sum = 0;
        for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * math.sqrt(comb);
        }
        return z2 * sum;
    }
    function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        var t = 1,
            step = t / 2,
            t2 = t - step,
            l,
            e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        var px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }
    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }
    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }
    function interHelper(bez1, bez2, justCount) {
        var bbox1 = bezierBBox(bez1),
            bbox2 = bezierBBox(bez2);
        if (!isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        var l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = ~~(l1 / 8),
            n2 = ~~(l2 / 8),
            dots1 = [],
            dots2 = [],
            xy = {},
            res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; i++) {
            var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; i++) {
            p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; i++) {
            for (var j = 0; j < n2; j++) {
                var di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2
                            });
                        }
                    }
                }
            }
        }
        return res;
    }
    function pathIntersection(path1, path2) {
        return interPathHelper(path1, path2);
    }
    function pathIntersectionNumber(path1, path2) {
        return interPathHelper(path1, path2, 1);
    }
    function interPathHelper(path1, path2, justCount) {
        path1 = path2curve(path1);
        path2 = path2curve(path2);
        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        for (var i = 0, ii = path1.length; i < ii; i++) {
            var pi = path1[i];
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                for (var j = 0, jj = path2.length; j < jj; j++) {
                    var pj = path2[j];
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        var intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            for (var k = 0, kk = intr.length; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }
    function isPointInsidePath(path, x, y) {
        var bbox = pathBBox(path);
        return isPointInsideBBox(bbox, x, y) &&
               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
    }
    function pathBBox(path) {
        var pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox);
        }
        if (!path) {
            return box();
        }
        path = path2curve(path);
        var x = 0, 
            y = 0,
            X = [],
            Y = [],
            p;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X.concat(dim.min.x, dim.max.x);
                Y = Y.concat(dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        var xmin = mmin.apply(0, X),
            ymin = mmin.apply(0, Y),
            xmax = mmax.apply(0, X),
            ymax = mmax.apply(0, Y),
            bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
        pth.bbox = clone(bb);
        return bb;
    }
    function rectPath(x, y, w, h, r) {
        if (r) {
            return [
                ["M", +x + (+r), y],
                ["l", w - r * 2, 0],
                ["a", r, r, 0, 0, 1, r, r],
                ["l", 0, h - r * 2],
                ["a", r, r, 0, 0, 1, -r, r],
                ["l", r * 2 - w, 0],
                ["a", r, r, 0, 0, 1, -r, -r],
                ["l", 0, r * 2 - h],
                ["a", r, r, 0, 0, 1, r, -r],
                ["z"]
            ];
        }
        var res = [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
        res.toString = toString;
        return res;
    }
    function ellipsePath(x, y, rx, ry, a) {
        if (a == null && ry == null) {
            ry = rx;
        }
        x = +x;
        y = +y;
        rx = +rx;
        ry = +ry;
        if (a != null) {
            var rad = Math.PI / 180,
                x1 = x + rx * Math.cos(-ry * rad),
                x2 = x + rx * Math.cos(-a * rad),
                y1 = y + rx * Math.sin(-ry * rad),
                y2 = y + rx * Math.sin(-a * rad),
                res = [["M", x1, y1], ["A", rx, rx, 0, +(a - ry > 180), 0, x2, y2]];
        } else {
            res = [
                ["M", x, y],
                ["m", 0, -ry],
                ["a", rx, ry, 0, 1, 1, 0, 2 * ry],
                ["a", rx, ry, 0, 1, 1, 0, -2 * ry],
                ["z"]
            ];
        }
        res.toString = toString;
        return res;
    }
    var unit2px = Snap._unit2px,
        getPath = {
        path: function (el) {
            return el.attr("path");
        },
        circle: function (el) {
            var attr = unit2px(el);
            return ellipsePath(attr.cx, attr.cy, attr.r);
        },
        ellipse: function (el) {
            var attr = unit2px(el);
            return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
        },
        rect: function (el) {
            var attr = unit2px(el);
            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height, attr.rx, attr.ry);
        },
        image: function (el) {
            var attr = unit2px(el);
            return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
        },
        line: function (el) {
            return "M" + [el.attr("x1") || 0, el.attr("y1") || 0, el.attr("x2"), el.attr("y2")];
        },
        polyline: function (el) {
            return "M" + el.attr("points");
        },
        polygon: function (el) {
            return "M" + el.attr("points") + "z";
        },
        deflt: function (el) {
            var bbox = el.node.getBBox();
            return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
        }
    };
    function pathToRelative(pathArray) {
        var pth = paths(pathArray),
            lowerCase = String.prototype.toLowerCase;
        if (pth.rel) {
            return pathClone(pth.rel);
        }
        if (!Snap.is(pathArray, "array") || !Snap.is(pathArray && pathArray[0], "array")) {
            pathArray = Snap.parsePathString(pathArray);
        }
        var res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;
        if (pathArray[0][0] == "M") {
            x = pathArray[0][1];
            y = pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res.push(["M", x, y]);
        }
        for (var i = start, ii = pathArray.length; i < ii; i++) {
            var r = res[i] = [],
                pa = pathArray[i];
            if (pa[0] != lowerCase.call(pa[0])) {
                r[0] = lowerCase.call(pa[0]);
                switch (r[0]) {
                    case "a":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;
                    case "v":
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;
                    case "m":
                        mx = pa[1];
                        my = pa[2];
                    default:
                        for (var j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
                        }
                }
            } else {
                r = res[i] = [];
                if (pa[0] == "m") {
                    mx = pa[1] + x;
                    my = pa[2] + y;
                }
                for (var k = 0, kk = pa.length; k < kk; k++) {
                    res[i][k] = pa[k];
                }
            }
            var len = res[i].length;
            switch (res[i][0]) {
                case "z":
                    x = mx;
                    y = my;
                    break;
                case "h":
                    x += +res[i][len - 1];
                    break;
                case "v":
                    y += +res[i][len - 1];
                    break;
                default:
                    x += +res[i][len - 2];
                    y += +res[i][len - 1];
            }
        }
        res.toString = toString;
        pth.rel = pathClone(res);
        return res;
    }
    function pathToAbsolute(pathArray) {
        var pth = paths(pathArray);
        if (pth.abs) {
            return pathClone(pth.abs);
        }
        if (!is(pathArray, "array") || !is(pathArray && pathArray[0], "array")) { // rough assumption
            pathArray = Snap.parsePathString(pathArray);
        }
        if (!pathArray || !pathArray.length) {
            return [["M", 0, 0]];
        }
        var res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0,
            pa0;
        if (pathArray[0][0] == "M") {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res[0] = ["M", x, y];
        }
        var crz = pathArray.length == 3 &&
            pathArray[0][0] == "M" &&
            pathArray[1][0].toUpperCase() == "R" &&
            pathArray[2][0].toUpperCase() == "Z";
        for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
            res.push(r = []);
            pa = pathArray[i];
            pa0 = pa[0];
            if (pa0 != pa0.toUpperCase()) {
                r[0] = pa0.toUpperCase();
                switch (r[0]) {
                    case "A":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +pa[6] + x;
                        r[7] = +pa[7] + y;
                        break;
                    case "V":
                        r[1] = +pa[1] + y;
                        break;
                    case "H":
                        r[1] = +pa[1] + x;
                        break;
                    case "R":
                        var dots = [x, y].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;
                    case "O":
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;
                    case "U":
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = ["U"].concat(res[res.length - 1].slice(-2));
                        break;
                    case "M":
                        mx = +pa[1] + x;
                        my = +pa[2] + y;
                    default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + ((j % 2) ? x : y);
                        }
                }
            } else if (pa0 == "R") {
                dots = [x, y].concat(pa.slice(1));
                res.pop();
                res = res.concat(catmullRom2bezier(dots, crz));
                r = ["R"].concat(pa.slice(-2));
            } else if (pa0 == "O") {
                res.pop();
                dots = ellipsePath(x, y, pa[1], pa[2]);
                dots.push(dots[0]);
                res = res.concat(dots);
            } else if (pa0 == "U") {
                res.pop();
                res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                r = ["U"].concat(res[res.length - 1].slice(-2));
            } else {
                for (var k = 0, kk = pa.length; k < kk; k++) {
                    r[k] = pa[k];
                }
            }
            pa0 = pa0.toUpperCase();
            if (pa0 != "O") {
                switch (r[0]) {
                    case "Z":
                        x = +mx;
                        y = +my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
        }
        res.toString = toString;
        pth.abs = pathClone(res);
        return res;
    }
    function l2c(x1, y1, x2, y2) {
        return [x1, y1, x2, y2, x2, y2];
    }
    function q2c(x1, y1, ax, ay, x2, y2) {
        var _13 = 1 / 3,
            _23 = 2 / 3;
        return [
                _13 * x1 + _23 * ax,
                _13 * y1 + _23 * ay,
                _13 * x2 + _23 * ax,
                _13 * y2 + _23 * ay,
                x2,
                y2
            ];
    }
    function a2c(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
        // for more information of where this math came from visit:
        // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
        var _120 = PI * 120 / 180,
            rad = PI / 180 * (+angle || 0),
            res = [],
            xy,
            rotate = Snap._.cacher(function (x, y, rad) {
                var X = x * math.cos(rad) - y * math.sin(rad),
                    Y = x * math.sin(rad) + y * math.cos(rad);
                return {x: X, y: Y};
            });
        if (!recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var cos = math.cos(PI / 180 * angle),
                sin = math.sin(PI / 180 * angle),
                x = (x1 - x2) / 2,
                y = (y1 - y2) / 2;
            var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
            if (h > 1) {
                h = math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (large_arc_flag == sweep_flag ? -1 : 1) *
                    math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                cx = k * rx * y / ry + (x1 + x2) / 2,
                cy = k * -ry * x / rx + (y1 + y2) / 2,
                f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
                f2 = math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? PI - f1 : f1;
            f2 = x2 < cx ? PI - f2 : f2;
            f1 < 0 && (f1 = PI * 2 + f1);
            f2 < 0 && (f2 = PI * 2 + f2);
            if (sweep_flag && f1 > f2) {
                f1 = f1 - PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
                f2 = f2 - PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        var df = f2 - f1;
        if (abs(df) > _120) {
            var f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * math.cos(f2);
            y2 = cy + ry * math.sin(f2);
            res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        var c1 = math.cos(f1),
            s1 = math.sin(f1),
            c2 = math.cos(f2),
            s2 = math.sin(f2),
            t = math.tan(df / 4),
            hx = 4 / 3 * rx * t,
            hy = 4 / 3 * ry * t,
            m1 = [x1, y1],
            m2 = [x1 + hx * s1, y1 - hy * c1],
            m3 = [x2 + hx * s2, y2 - hy * c2],
            m4 = [x2, y2];
        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];
        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(",");
            var newres = [];
            for (var i = 0, ii = res.length; i < ii; i++) {
                newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
            }
            return newres;
        }
    }
    function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t;
        return {
            x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
            y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
        };
    }
    
    // Returns bounding box of cubic bezier curve.
    // Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
    // Original version: NISHIO Hirokazu
    // Modifications: https://github.com/timo22345
    function curveDim(x0, y0, x1, y1, x2, y2, x3, y3) {
        var tvalues = [],
            bounds = [[], []],
            a, b, c, t, t1, t2, b2ac, sqrtb2ac;
        for (var i = 0; i < 2; ++i) {
            if (i == 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;
            } else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (abs(a) < 1e-12) {
                if (abs(b) < 1e-12) {
                    continue;
                }
                t = -c / b;
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            sqrtb2ac = math.sqrt(b2ac);
            if (b2ac < 0) {
                continue;
            }
            t1 = (-b + sqrtb2ac) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tvalues.push(t1);
            }
            t2 = (-b - sqrtb2ac) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tvalues.push(t2);
            }
        }

        var x, y, j = tvalues.length,
            jlen = j,
            mt;
        while (j--) {
            t = tvalues[j];
            mt = 1 - t;
            bounds[0][j] = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3);
            bounds[1][j] = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3);
        }

        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;
        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;
        bounds[0].length = bounds[1].length = jlen + 2;


        return {
          min: {x: mmin.apply(0, bounds[0]), y: mmin.apply(0, bounds[1])},
          max: {x: mmax.apply(0, bounds[0]), y: mmax.apply(0, bounds[1])}
        };
    }

    function path2curve(path, path2) {
        var pth = !path2 && paths(path);
        if (!path2 && pth.curve) {
            return pathClone(pth.curve);
        }
        var p = pathToAbsolute(path),
            p2 = path2 && pathToAbsolute(path2),
            attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            processPath = function (path, d, pcom) {
                var nx, ny;
                if (!path) {
                    return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                }
                !(path[0] in {T: 1, Q: 1}) && (d.qx = d.qy = null);
                switch (path[0]) {
                    case "M":
                        d.X = path[1];
                        d.Y = path[2];
                        break;
                    case "A":
                        path = ["C"].concat(a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
                        break;
                    case "S":
                        if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
                            nx = d.x * 2 - d.bx;          // And reflect the previous
                            ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                        }
                        else {                            // or some else or nothing
                            nx = d.x;
                            ny = d.y;
                        }
                        path = ["C", nx, ny].concat(path.slice(1));
                        break;
                    case "T":
                        if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
                            d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                            d.qy = d.y * 2 - d.qy;        // to case "S".
                        }
                        else {                            // or something else or nothing
                            d.qx = d.x;
                            d.qy = d.y;
                        }
                        path = ["C"].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                        break;
                    case "Q":
                        d.qx = path[1];
                        d.qy = path[2];
                        path = ["C"].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                        break;
                    case "L":
                        path = ["C"].concat(l2c(d.x, d.y, path[1], path[2]));
                        break;
                    case "H":
                        path = ["C"].concat(l2c(d.x, d.y, path[1], d.y));
                        break;
                    case "V":
                        path = ["C"].concat(l2c(d.x, d.y, d.x, path[1]));
                        break;
                    case "Z":
                        path = ["C"].concat(l2c(d.x, d.y, d.X, d.Y));
                        break;
                }
                return path;
            },
            fixArc = function (pp, i) {
                if (pp[i].length > 7) {
                    pp[i].shift();
                    var pi = pp[i];
                    while (pi.length) {
                        pcoms1[i] = "A"; // if created multiple C:s, their original seg is saved
                        p2 && (pcoms2[i] = "A"); // the same as above
                        pp.splice(i++, 0, ["C"].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            fixM = function (path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                    path2.splice(i, 0, ["M", a2.x, a2.y]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = path1[i][1];
                    a1.y = path1[i][2];
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            pcoms1 = [], // path commands of original path p
            pcoms2 = [], // path commands of original path p2
            pfirst = "", // temporary holder for original path command
            pcom = ""; // holder for previous path command of original path
        for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
            p[i] && (pfirst = p[i][0]); // save current path command

            if (pfirst != "C") // C is not saved yet, because it may be result of conversion
            {
                pcoms1[i] = pfirst; // Save current path command
                i && ( pcom = pcoms1[i - 1]); // Get previous path command pcom
            }
            p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

            if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
            // which may produce multiple C:s
            // so we have to make sure that C is also C in original path

            fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1

            if (p2) { // the same procedures is done to p2
                p2[i] && (pfirst = p2[i][0]);
                if (pfirst != "C") {
                    pcoms2[i] = pfirst;
                    i && (pcom = pcoms2[i - 1]);
                }
                p2[i] = processPath(p2[i], attrs2, pcom);

                if (pcoms2[i] != "A" && pfirst == "C") {
                    pcoms2[i] = "C";
                }

                fixArc(p2, i);
            }
            fixM(p, p2, attrs, attrs2, i);
            fixM(p2, p, attrs2, attrs, i);
            var seg = p[i],
                seg2 = p2 && p2[i],
                seglen = seg.length,
                seg2len = p2 && seg2.length;
            attrs.x = seg[seglen - 2];
            attrs.y = seg[seglen - 1];
            attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
            attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
            attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
            attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
            attrs2.x = p2 && seg2[seg2len - 2];
            attrs2.y = p2 && seg2[seg2len - 1];
        }
        if (!p2) {
            pth.curve = pathClone(p);
        }
        return p2 ? [p, p2] : p;
    }
    function mapPath(path, matrix) {
        if (!matrix) {
            return path;
        }
        var x, y, i, j, ii, jj, pathi;
        path = path2curve(path);
        for (i = 0, ii = path.length; i < ii; i++) {
            pathi = path[i];
            for (j = 1, jj = pathi.length; j < jj; j += 2) {
                x = matrix.x(pathi[j], pathi[j + 1]);
                y = matrix.y(pathi[j], pathi[j + 1]);
                pathi[j] = x;
                pathi[j + 1] = y;
            }
        }
        return path;
    }

    // http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        var d = [];
        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [
                        {x: +crp[i - 2], y: +crp[i - 1]},
                        {x: +crp[i],     y: +crp[i + 1]},
                        {x: +crp[i + 2], y: +crp[i + 3]},
                        {x: +crp[i + 4], y: +crp[i + 5]}
                    ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push(["C",
                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
                  (p[1].y + 6*p[2].y - p[3].y) / 6,
                  p[2].x,
                  p[2].y
            ]);
        }

        return d;
    }

    // export
    Snap.path = paths;

    /*\
     * Snap.path.getTotalLength
     [ method ]
     **
     * Returns the length of the given path in pixels
     **
     - path (string) SVG path string
     **
     = (number) length
    \*/
    Snap.path.getTotalLength = getTotalLength;
    /*\
     * Snap.path.getPointAtLength
     [ method ]
     **
     * Returns the coordinates of the point located at the given length along the given path
     **
     - path (string) SVG path string
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
    \*/
    Snap.path.getPointAtLength = getPointAtLength;
    /*\
     * Snap.path.getSubpath
     [ method ]
     **
     * Returns the subpath of a given path between given start and end lengths
     **
     - path (string) SVG path string
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
    \*/
    Snap.path.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        var a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };
    /*\
     * Element.getTotalLength
     [ method ]
     **
     * Returns the length of the path in pixels (only works for `path` elements)
     = (number) length
    \*/
    elproto.getTotalLength = function () {
        if (this.node.getTotalLength) {
            return this.node.getTotalLength();
        }
    };
    // SIERRA Element.getPointAtLength()/Element.getTotalLength(): If a <path> is broken into different segments, is the jump distance to the new coordinates set by the _M_ or _m_ commands calculated as part of the path's total length?
    /*\
     * Element.getPointAtLength
     [ method ]
     **
     * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
     **
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
    \*/
    elproto.getPointAtLength = function (length) {
        return getPointAtLength(this.attr("d"), length);
    };
    // SIERRA Element.getSubpath(): Similar to the problem for Element.getPointAtLength(). Unclear how this would work for a segmented path. Overall, the concept of _subpath_ and what I'm calling a _segment_ (series of non-_M_ or _Z_ commands) is unclear.
    /*\
     * Element.getSubpath
     [ method ]
     **
     * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
     **
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
    \*/
    elproto.getSubpath = function (from, to) {
        return Snap.path.getSubpath(this.attr("d"), from, to);
    };
    Snap._.box = box;
    /*\
     * Snap.path.findDotsAtSegment
     [ method ]
     **
     * Utility method
     **
     * Finds dot coordinates on the given cubic beziér curve at the given t
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) point information in format:
     o {
     o     x: (number) x coordinate of the point,
     o     y: (number) y coordinate of the point,
     o     m: {
     o         x: (number) x coordinate of the left anchor,
     o         y: (number) y coordinate of the left anchor
     o     },
     o     n: {
     o         x: (number) x coordinate of the right anchor,
     o         y: (number) y coordinate of the right anchor
     o     },
     o     start: {
     o         x: (number) x coordinate of the start of the curve,
     o         y: (number) y coordinate of the start of the curve
     o     },
     o     end: {
     o         x: (number) x coordinate of the end of the curve,
     o         y: (number) y coordinate of the end of the curve
     o     },
     o     alpha: (number) angle of the curve derivative at the point
     o }
    \*/
    Snap.path.findDotsAtSegment = findDotsAtSegment;
    /*\
     * Snap.path.bezierBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given cubic beziér curve
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     * or
     - bez (array) array of six points for beziér curve
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
    \*/
    Snap.path.bezierBBox = bezierBBox;
    /*\
     * Snap.path.isPointInsideBBox
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside bounding box
     - bbox (string) bounding box
     - x (string) x coordinate of the point
     - y (string) y coordinate of the point
     = (boolean) `true` if point is inside
    \*/
    Snap.path.isPointInsideBBox = isPointInsideBBox;
    Snap.closest = function (x, y, X, Y) {
        var r = 100,
            b = box(x - r / 2, y - r / 2, r, r),
            inside = [],
            getter = X[0].hasOwnProperty("x") ? function (i) {
                return {
                    x: X[i].x,
                    y: X[i].y
                };
            } : function (i) {
                return {
                    x: X[i],
                    y: Y[i]
                };
            },
            found = 0;
        while (r <= 1e6 && !found) {
            for (var i = 0, ii = X.length; i < ii; i++) {
                var xy = getter(i);
                if (isPointInsideBBox(b, xy.x, xy.y)) {
                    found++;
                    inside.push(xy);
                    break;
                }
            }
            if (!found) {
                r *= 2;
                b = box(x - r / 2, y - r / 2, r, r)
            }
        }
        if (r == 1e6) {
            return;
        }
        var len = Infinity,
            res;
        for (i = 0, ii = inside.length; i < ii; i++) {
            var l = Snap.len(x, y, inside[i].x, inside[i].y);
            if (len > l) {
                len = l;
                inside[i].len = l;
                res = inside[i];
            }
        }
        return res;
    };
    /*\
     * Snap.path.isBBoxIntersect
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if two bounding boxes intersect
     - bbox1 (string) first bounding box
     - bbox2 (string) second bounding box
     = (boolean) `true` if bounding boxes intersect
    \*/
    Snap.path.isBBoxIntersect = isBBoxIntersect;
    /*\
     * Snap.path.intersection
     [ method ]
     **
     * Utility method
     **
     * Finds intersections of two paths
     - path1 (string) path string
     - path2 (string) path string
     = (array) dots of intersection
     o [
     o     {
     o         x: (number) x coordinate of the point,
     o         y: (number) y coordinate of the point,
     o         t1: (number) t value for segment of path1,
     o         t2: (number) t value for segment of path2,
     o         segment1: (number) order number for segment of path1,
     o         segment2: (number) order number for segment of path2,
     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1,
     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
     o     }
     o ]
    \*/
    Snap.path.intersection = pathIntersection;
    Snap.path.intersectionNumber = pathIntersectionNumber;
    /*\
     * Snap.path.isPointInside
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside a given closed path.
     *
     * Note: fill mode doesn’t affect the result of this method.
     - path (string) path string
     - x (number) x of the point
     - y (number) y of the point
     = (boolean) `true` if point is inside the path
    \*/
    Snap.path.isPointInside = isPointInsidePath;
    /*\
     * Snap.path.getBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given path
     - path (string) path string
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
    \*/
    Snap.path.getBBox = pathBBox;
    Snap.path.get = getPath;
    /*\
     * Snap.path.toRelative
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into relative values
     - path (string) path string
     = (array) path string
    \*/
    Snap.path.toRelative = pathToRelative;
    /*\
     * Snap.path.toAbsolute
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into absolute values
     - path (string) path string
     = (array) path string
    \*/
    Snap.path.toAbsolute = pathToAbsolute;
    /*\
     * Snap.path.toCubic
     [ method ]
     **
     * Utility method
     **
     * Converts path to a new path where all segments are cubic beziér curves
     - pathString (string|array) path string or array of segments
     = (array) array of segments
    \*/
    Snap.path.toCubic = path2curve;
    /*\
     * Snap.path.map
     [ method ]
     **
     * Transform the path string with the given matrix
     - path (string) path string
     - matrix (object) see @Matrix
     = (string) transformed path string
    \*/
    Snap.path.map = mapPath;
    Snap.path.toString = toString;
    Snap.path.clone = pathClone;
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var mmax = Math.max,
        mmin = Math.min;

    // Set
    var Set = function (items) {
        this.items = [];
	this.bindings = {};
        this.length = 0;
        this.type = "set";
        if (items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                if (items[i]) {
                    this[this.items.length] = this.items[this.items.length] = items[i];
                    this.length++;
                }
            }
        }
    },
    setproto = Set.prototype;
    /*\
     * Set.push
     [ method ]
     **
     * Adds each argument to the current set
     = (object) original element
    \*/
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            item = arguments[i];
            if (item) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    /*\
     * Set.pop
     [ method ]
     **
     * Removes last element and returns it
     = (object) element
    \*/
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    /*\
     * Set.forEach
     [ method ]
     **
     * Executes given function for each element in the set
     *
     * If the function returns `false`, the loop stops running.
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Set object
    \*/
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    /*\
     * Set.animate
     [ method ]
     **
     * Animates each element in set in sync.
     *
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     * or
     - animation (array) array of animation parameter for each element in set in format `[attrs, duration, easing, callback]`
     > Usage
     | // animate all elements in set to radius 10
     | set.animate({r: 10}, 500, mina.easein);
     | // or
     | // animate first element to radius 10, but second to radius 20 and in different time
     | set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
     = (Element) the current element
    \*/
    setproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Snap._.Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = easing.dur;
            attrs = attrs.attr;
        }
        var args = arguments;
        if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
            var each = true;
        }
        var begin,
            handler = function () {
                if (begin) {
                    this.b = begin;
                } else {
                    begin = this.b;
                }
            },
            cb = 0,
            set = this,
            callbacker = callback && function () {
                if (++cb == set.length) {
                    callback.call(this);
                }
            };
        return this.forEach(function (el, i) {
            eve.once("snap.animcreated." + el.id, handler);
            if (each) {
                args[i] && el.animate.apply(el, args[i]);
            } else {
                el.animate(attrs, ms, easing, callbacker);
            }
        });
    };
    setproto.remove = function () {
        while (this.length) {
            this.pop().remove();
        }
        return this;
    };
    /*\
     * Set.bind
     [ method ]
     **
     * Specifies how to handle a specific attribute when applied
     * to a set.
     *
     **
     - attr (string) attribute name
     - callback (function) function to run
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     - eattr (string) attribute on the element to bind the attribute to
     = (object) Set object
    \*/
    setproto.bind = function (attr, a, b) {
        var data = {};
        if (typeof a == "function") {
            this.bindings[attr] = a;
        } else {
            var aname = b || attr;
            this.bindings[attr] = function (v) {
                data[aname] = v;
                a.attr(data);
            };
        }
        return this;
    };
    setproto.attr = function (value) {
        var unbound = {};
        for (var k in value) {
            if (this.bindings[k]) {
                this.bindings[k](value[k]);
            } else {
                unbound[k] = value[k];
            }
        }
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            this.items[i].attr(unbound);
        }
        return this;
    };
    /*\
     * Set.clear
     [ method ]
     **
     * Removes all elements from the set
    \*/
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    /*\
     * Set.splice
     [ method ]
     **
     * Removes range of elements from the set
     **
     - index (number) position of the deletion
     - count (number) number of element to remove
     - insertion… (object) #optional elements to insert
     = (object) set elements that were deleted
    \*/
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; i++) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; i++) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    /*\
     * Set.exclude
     [ method ]
     **
     * Removes given element from the set
     **
     - element (object) element to remove
     = (boolean) `true` if object was found and removed from the set
    \*/
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
        return false;
    };
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    setproto.getBBox = function () {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            var box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
        }
        x = mmin.apply(0, x);
        y = mmin.apply(0, y);
        x2 = mmax.apply(0, x2);
        y2 = mmax.apply(0, y2);
        return {
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y,
            cx: x + (x2 - x) / 2,
            cy: y + (y2 - y) / 2
        };
    };
    setproto.clone = function (s) {
        s = new Set;
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Snap\u2018s set";
    };
    setproto.type = "set";
    // export
    Snap.Set = Set;
    Snap.set = function () {
        var set = new Set;
        if (arguments.length) {
            set.push.apply(set, Array.prototype.slice.call(arguments, 0));
        }
        return set;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var names = {},
        reUnit = /[a-z]+$/i,
        Str = String;
    names.stroke = names.fill = "colour";
    function getEmpty(item) {
        var l = item[0];
        switch (l.toLowerCase()) {
            case "t": return [l, 0, 0];
            case "m": return [l, 1, 0, 0, 1, 0, 0];
            case "r": if (item.length == 4) {
                return [l, 0, item[2], item[3]];
            } else {
                return [l, 0];
            }
            case "s": if (item.length == 5) {
                return [l, 1, 1, item[3], item[4]];
            } else if (item.length == 3) {
                return [l, 1, 1];
            } else {
                return [l, 1];
            }
        }
    }
    function equaliseTransform(t1, t2, getBBox) {
        t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
        t1 = Snap.parseTransformString(t1) || [];
        t2 = Snap.parseTransformString(t2) || [];
        var maxlength = Math.max(t1.length, t2.length),
            from = [],
            to = [],
            i = 0, j, jj,
            tt1, tt2;
        for (; i < maxlength; i++) {
            tt1 = t1[i] || getEmpty(t2[i]);
            tt2 = t2[i] || getEmpty(tt1);
            if ((tt1[0] != tt2[0]) ||
                (tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
                ) {
                    t1 = Snap._.transform2matrix(t1, getBBox());
                    t2 = Snap._.transform2matrix(t2, getBBox());
                    from = [["m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f]];
                    to = [["m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f]];
                    break;
            }
            from[i] = [];
            to[i] = [];
            for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                j in tt1 && (from[i][j] = tt1[j]);
                j in tt2 && (to[i][j] = tt2[j]);
            }
        }
        return {
            from: path2array(from),
            to: path2array(to),
            f: getPath(from)
        };
    }
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    function getViewBox(val) {
        return val.join(" ");
    }
    function getColour(clr) {
        return Snap.rgb(clr[0], clr[1], clr[2]);
    }
    function getPath(path) {
        var k = 0, i, ii, j, jj, out, a, b = [];
        for (i = 0, ii = path.length; i < ii; i++) {
            out = "[";
            a = ['"' + path[i][0] + '"'];
            for (j = 1, jj = path[i].length; j < jj; j++) {
                a[j] = "val[" + (k++) + "]";
            }
            out += a + "]";
            b[i] = out;
        }
        return Function("val", "return Snap.path.toString.call([" + b + "])");
    }
    function path2array(path) {
        var out = [];
        for (var i = 0, ii = path.length; i < ii; i++) {
            for (var j = 1, jj = path[i].length; j < jj; j++) {
                out.push(path[i][j]);
            }
        }
        return out;
    }
    function isNumeric(obj) {
        return isFinite(parseFloat(obj));
    }
    function arrayEqual(arr1, arr2) {
        if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
            return false;
        }
        return arr1.toString() == arr2.toString();
    }
    Element.prototype.equal = function (name, b) {
        return eve("snap.util.equal", this, name, b).firstDefined();
    };
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this;
        if (isNumeric(a) && isNumeric(b)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getNumber
            };
        }
        if (names[name] == "colour") {
            A = Snap.color(a);
            B = Snap.color(b);
            return {
                from: [A.r, A.g, A.b, A.opacity],
                to: [B.r, B.g, B.b, B.opacity],
                f: getColour
            };
        }
        if (name == "viewBox") {
            A = this.attr(name).vb.split(" ").map(Number);
            B = b.split(" ").map(Number);
            return {
                from: A,
                to: B,
                f: getViewBox
            };
        }
        if (name == "transform" || name == "gradientTransform" || name == "patternTransform") {
            if (b instanceof Snap.Matrix) {
                b = b.toTransformString();
            }
            if (!Snap._.rgTransform.test(b)) {
                b = Snap._.svgTransform2string(b);
            }
            return equaliseTransform(a, b, function () {
                return el.getBBox(1);
            });
        }
        if (name == "d" || name == "path") {
            A = Snap.path.toCubic(a, b);
            return {
                from: path2array(A[0]),
                to: path2array(A[1]),
                f: getPath(A[0])
            };
        }
        if (name == "points") {
            A = Str(a).split(Snap._.separator);
            B = Str(b).split(Snap._.separator);
            return {
                from: A,
                to: B,
                f: function (val) { return val; }
            };
        }
        var aUnit = a.match(reUnit),
            bUnit = Str(b).match(reUnit);
        if (aUnit && arrayEqual(aUnit, bUnit)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getUnit(aUnit)
            };
        } else {
            return {
                from: this.asPX(name),
                to: this.asPX(name, b),
                f: getNumber
            };
        }
    });
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
    has = "hasOwnProperty",
    supportsTouch = "createTouch" in glob.doc,
    events = [
        "click", "dblclick", "mousedown", "mousemove", "mouseout",
        "mouseover", "mouseup", "touchstart", "touchmove", "touchend",
        "touchcancel"
    ],
    touchMap = {
        mousedown: "touchstart",
        mousemove: "touchmove",
        mouseup: "touchend"
    },
    getScroll = function (xy, el) {
        var name = xy == "y" ? "scrollTop" : "scrollLeft",
            doc = el && el.node ? el.node.ownerDocument : glob.doc;
        return doc[name in doc.documentElement ? "documentElement" : "body"][name];
    },
    preventDefault = function () {
        this.returnValue = false;
    },
    preventTouch = function () {
        return this.originalEvent.preventDefault();
    },
    stopPropagation = function () {
        this.cancelBubble = true;
    },
    stopTouch = function () {
        return this.originalEvent.stopPropagation();
    },
    addEvent = function (obj, type, fn, element) {
        var realName = supportsTouch && touchMap[type] ? touchMap[type] : type,
            f = function (e) {
                var scrollY = getScroll("y", element),
                    scrollX = getScroll("x", element);
                if (supportsTouch && touchMap[has](type)) {
                    for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                        if (e.targetTouches[i].target == obj || obj.contains(e.targetTouches[i].target)) {
                            var olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                }
                var x = e.clientX + scrollX,
                    y = e.clientY + scrollY;
                return fn.call(element, e, x, y);
            };

        if (type !== realName) {
            obj.addEventListener(type, f, false);
        }

        obj.addEventListener(realName, f, false);

        return function () {
            if (type !== realName) {
                obj.removeEventListener(type, f, false);
            }

            obj.removeEventListener(realName, f, false);
            return true;
        };
    },
    drag = [],
    dragMove = function (e) {
        var x = e.clientX,
            y = e.clientY,
            scrollY = getScroll("y"),
            scrollX = getScroll("x"),
            dragi,
            j = drag.length;
        while (j--) {
            dragi = drag[j];
            if (supportsTouch) {
                var i = e.touches && e.touches.length,
                    touch;
                while (i--) {
                    touch = e.touches[i];
                    if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
                        x = touch.clientX;
                        y = touch.clientY;
                        (e.originalEvent ? e.originalEvent : e).preventDefault();
                        break;
                    }
                }
            } else {
                e.preventDefault();
            }
            var node = dragi.el.node,
                o,
                next = node.nextSibling,
                parent = node.parentNode,
                display = node.style.display;
            // glob.win.opera && parent.removeChild(node);
            // node.style.display = "none";
            // o = dragi.el.paper.getElementByPoint(x, y);
            // node.style.display = display;
            // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
            // o && eve("snap.drag.over." + dragi.el.id, dragi.el, o);
            x += scrollX;
            y += scrollY;
            eve("snap.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
        }
    },
    dragUp = function (e) {
        Snap.unmousemove(dragMove).unmouseup(dragUp);
        var i = drag.length,
            dragi;
        while (i--) {
            dragi = drag[i];
            dragi.el._drag = {};
            eve("snap.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
            eve.off("snap.drag.*." + dragi.el.id);
        }
        drag = [];
    };
    /*\
     * Element.click
     [ method ]
     **
     * Adds a click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unclick
     [ method ]
     **
     * Removes a click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.dblclick
     [ method ]
     **
     * Adds a double click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.undblclick
     [ method ]
     **
     * Removes a double click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mousedown
     [ method ]
     **
     * Adds a mousedown event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousedown
     [ method ]
     **
     * Removes a mousedown event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mousemove
     [ method ]
     **
     * Adds a mousemove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousemove
     [ method ]
     **
     * Removes a mousemove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseout
     [ method ]
     **
     * Adds a mouseout event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseout
     [ method ]
     **
     * Removes a mouseout event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseover
     [ method ]
     **
     * Adds a mouseover event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseover
     [ method ]
     **
     * Removes a mouseover event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.mouseup
     [ method ]
     **
     * Adds a mouseup event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseup
     [ method ]
     **
     * Removes a mouseup event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchstart
     [ method ]
     **
     * Adds a touchstart event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchstart
     [ method ]
     **
     * Removes a touchstart event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchmove
     [ method ]
     **
     * Adds a touchmove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchmove
     [ method ]
     **
     * Removes a touchmove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchend
     [ method ]
     **
     * Adds a touchend event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchend
     [ method ]
     **
     * Removes a touchend event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    
    /*\
     * Element.touchcancel
     [ method ]
     **
     * Adds a touchcancel event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchcancel
     [ method ]
     **
     * Removes a touchcancel event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    for (var i = events.length; i--;) {
        (function (eventName) {
            Snap[eventName] = elproto[eventName] = function (fn, scope) {
                if (Snap.is(fn, "function")) {
                    this.events = this.events || [];
                    this.events.push({
                        name: eventName,
                        f: fn,
                        unbind: addEvent(this.node || document, eventName, fn, scope || this)
                    });
                } else {
                    for (var i = 0, ii = this.events.length; i < ii; i++) if (this.events[i].name == eventName) {
                        try {
                            this.events[i].f.call(this);
                        } catch (e) {}
                    }
                }
                return this;
            };
            Snap["un" + eventName] =
            elproto["un" + eventName] = function (fn) {
                var events = this.events || [],
                    l = events.length;
                while (l--) if (events[l].name == eventName &&
                               (events[l].f == fn || !fn)) {
                    events[l].unbind();
                    events.splice(l, 1);
                    !events.length && delete this.events;
                    return this;
                }
                return this;
            };
        })(events[i]);
    }
    /*\
     * Element.hover
     [ method ]
     **
     * Adds hover event handlers to the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     - icontext (object) #optional context for hover in handler
     - ocontext (object) #optional context for hover out handler
     = (object) @Element
    \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /*\
     * Element.unhover
     [ method ]
     **
     * Removes hover event handlers from the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     = (object) @Element
    \*/
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    var draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /*\
     * Element.drag
     [ method ]
     **
     * Adds event handlers for an element's drag gesture
     **
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events are triggered: `drag.start.<id>` on start, 
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element 
     * `drag.over.<id>` fires as well.
     *
     * Start event and start handler are called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler are called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler are called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
    \*/
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        var el = this;
        if (!arguments.length) {
            var origTransform;
            return el.drag(function (dx, dy) {
                this.attr({
                    transform: origTransform + (origTransform ? "T" : "t") + [dx, dy]
                });
            }, function () {
                origTransform = this.transform().local;
            });
        }
        function start(e, x, y) {
            (e.originalEvent || e).preventDefault();
            el._drag.x = x;
            el._drag.y = y;
            el._drag.id = e.identifier;
            !drag.length && Snap.mousemove(dragMove).mouseup(dragUp);
            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("snap.drag.start." + el.id, onstart);
            onmove && eve.on("snap.drag.move." + el.id, onmove);
            onend && eve.on("snap.drag.end." + el.id, onend);
            eve("snap.drag.start." + el.id, start_scope || move_scope || el, x, y, e);
        }
        function init(e, x, y) {
            eve("snap.draginit." + el.id, el, e, x, y);
        }
        eve.on("snap.draginit." + el.id, start);
        el._drag = {};
        draggable.push({el: el, start: start, init: init});
        el.mousedown(init);
        return el;
    };
    /*
     * Element.onDragOver
     [ method ]
     **
     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
     - f (function) handler for event, first argument would be the element you are dragging over
    \*/
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /*\
     * Element.undrag
     [ method ]
     **
     * Removes all drag event handlers from the given element
    \*/
    elproto.undrag = function () {
        var i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].init);
            draggable.splice(i, 1);
            eve.unbind("snap.drag.*." + this.id);
            eve.unbind("snap.draginit." + this.id);
        }
        !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
        return this;
    };
});

// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob) {
    var elproto = Element.prototype,
        pproto = Paper.prototype,
        rgurl = /^\s*url\((.+)\)/,
        Str = String,
        $ = Snap._.$;
    Snap.filter = {};
    /*\
     * Paper.filter
     [ method ]
     **
     * Creates a `<filter>` element
     **
     - filstr (string) SVG fragment of filter provided as a string
     = (object) @Element
     * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
     > Usage
     | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    pproto.filter = function (filstr) {
        var paper = this;
        if (paper.type != "svg") {
            paper = paper.paper;
        }
        var f = Snap.parse(Str(filstr)),
            id = Snap._.id(),
            width = paper.node.offsetWidth,
            height = paper.node.offsetHeight,
            filter = $("filter");
        $(filter, {
            id: id,
            filterUnits: "userSpaceOnUse"
        });
        filter.appendChild(f.node);
        paper.defs.appendChild(filter);
        return new Element(filter);
    };
    
    eve.on("snap.util.getattr.filter", function () {
        eve.stop();
        var p = $(this.node, "filter");
        if (p) {
            var match = Str(p).match(rgurl);
            return match && Snap.select(match[1]);
        }
    });
    eve.on("snap.util.attr.filter", function (value) {
        if (value instanceof Element && value.type == "filter") {
            eve.stop();
            var id = value.node.id;
            if (!id) {
                $(value.node, {id: value.id});
                id = value.id;
            }
            $(this.node, {
                filter: Snap.url(id)
            });
        }
        if (!value || value == "none") {
            eve.stop();
            this.node.removeAttribute("filter");
        }
    });
    /*\
     * Snap.filter.blur
     [ method ]
     **
     * Returns an SVG markup string for the blur filter
     **
     - x (number) amount of horizontal blur, in pixels
     - y (number) #optional amount of vertical blur, in pixels
     = (string) filter representation
     > Usage
     | var f = paper.filter(Snap.filter.blur(5, 10)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Snap.filter.blur = function (x, y) {
        if (x == null) {
            x = 2;
        }
        var def = y == null ? x : [x, y];
        return Snap.format('\<feGaussianBlur stdDeviation="{def}"/>', {
            def: def
        });
    };
    Snap.filter.blur.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.shadow
     [ method ]
     **
     * Returns an SVG markup string for the shadow filter
     **
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - blur (number) #optional amount of blur
     - color (string) #optional color of the shadow
     - opacity (number) #optional `0..1` opacity of the shadow
     * or
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - color (string) #optional color of the shadow
     - opacity (number) #optional `0..1` opacity of the shadow
     * which makes blur default to `4`. Or
     - dx (number) #optional horizontal shift of the shadow, in pixels
     - dy (number) #optional vertical shift of the shadow, in pixels
     - opacity (number) #optional `0..1` opacity of the shadow
     = (string) filter representation
     > Usage
     | var f = paper.filter(Snap.filter.shadow(0, 2, 3)),
     |     c = paper.circle(10, 10, 10).attr({
     |         filter: f
     |     });
    \*/
    Snap.filter.shadow = function (dx, dy, blur, color, opacity) {
        if (typeof blur == "string") {
            color = blur;
            opacity = color;
            blur = 4;
        }
        if (typeof color != "string") {
            opacity = color;
            color = "#000";
        }
        color = color || "#000";
        if (blur == null) {
            blur = 4;
        }
        if (opacity == null) {
            opacity = 1;
        }
        if (dx == null) {
            dx = 0;
            dy = 2;
        }
        if (dy == null) {
            dy = dx;
        }
        color = Snap.color(color);
        return Snap.format('<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>', {
            color: color,
            dx: dx,
            dy: dy,
            blur: blur,
            opacity: opacity
        });
    };
    Snap.filter.shadow.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.grayscale
     [ method ]
     **
     * Returns an SVG markup string for the grayscale filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.grayscale = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>', {
            a: 0.2126 + 0.7874 * (1 - amount),
            b: 0.7152 - 0.7152 * (1 - amount),
            c: 0.0722 - 0.0722 * (1 - amount),
            d: 0.2126 - 0.2126 * (1 - amount),
            e: 0.7152 + 0.2848 * (1 - amount),
            f: 0.0722 - 0.0722 * (1 - amount),
            g: 0.2126 - 0.2126 * (1 - amount),
            h: 0.0722 + 0.9278 * (1 - amount)
        });
    };
    Snap.filter.grayscale.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.sepia
     [ method ]
     **
     * Returns an SVG markup string for the sepia filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.sepia = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>', {
            a: 0.393 + 0.607 * (1 - amount),
            b: 0.769 - 0.769 * (1 - amount),
            c: 0.189 - 0.189 * (1 - amount),
            d: 0.349 - 0.349 * (1 - amount),
            e: 0.686 + 0.314 * (1 - amount),
            f: 0.168 - 0.168 * (1 - amount),
            g: 0.272 - 0.272 * (1 - amount),
            h: 0.534 - 0.534 * (1 - amount),
            i: 0.131 + 0.869 * (1 - amount)
        });
    };
    Snap.filter.sepia.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.saturate
     [ method ]
     **
     * Returns an SVG markup string for the saturate filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.saturate = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
            amount: 1 - amount
        });
    };
    Snap.filter.saturate.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.hueRotate
     [ method ]
     **
     * Returns an SVG markup string for the hue-rotate filter
     **
     - angle (number) angle of rotation
     = (string) filter representation
    \*/
    Snap.filter.hueRotate = function (angle) {
        angle = angle || 0;
        return Snap.format('<feColorMatrix type="hueRotate" values="{angle}"/>', {
            angle: angle
        });
    };
    Snap.filter.hueRotate.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.invert
     [ method ]
     **
     * Returns an SVG markup string for the invert filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.invert = function (amount) {
        if (amount == null) {
            amount = 1;
        }
//        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
        return Snap.format('<feComponentTransfer><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: 1 - amount
        });
    };
    Snap.filter.invert.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.brightness
     [ method ]
     **
     * Returns an SVG markup string for the brightness filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.brightness = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>', {
            amount: amount
        });
    };
    Snap.filter.brightness.toString = function () {
        return this();
    };
    /*\
     * Snap.filter.contrast
     [ method ]
     **
     * Returns an SVG markup string for the contrast filter
     **
     - amount (number) amount of filter (`0..1`)
     = (string) filter representation
    \*/
    Snap.filter.contrast = function (amount) {
        if (amount == null) {
            amount = 1;
        }
        return Snap.format('<feComponentTransfer><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>', {
            amount: amount,
            amount2: .5 - amount / 2
        });
    };
    Snap.filter.contrast.toString = function () {
        return this();
    };
});

// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap.plugin(function (Snap, Element, Paper, glob, Fragment) {
    var box = Snap._.box,
        is = Snap.is,
        firstLetter = /^[^a-z]*([tbmlrc])/i,
        toString = function () {
            return "T" + this.dx + "," + this.dy;
        };
    /*\
     * Element.getAlign
     [ method ]
     **
     * Returns shift needed to align the element relatively to given element.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object|string) Object in format `{dx: , dy: }` also has a string representation as a transformation string
     > Usage
     | el.transform(el.getAlign(el2, "top"));
     * or
     | var dy = el.getAlign(el2, "top").dy;
    \*/
    Element.prototype.getAlign = function (el, way) {
        if (way == null && is(el, "string")) {
            way = el;
            el = null;
        }
        el = el || this.paper;
        var bx = el.getBBox ? el.getBBox() : box(el),
            bb = this.getBBox(),
            out = {};
        way = way && way.match(firstLetter);
        way = way ? way[1].toLowerCase() : "c";
        switch (way) {
            case "t":
                out.dx = 0;
                out.dy = bx.y - bb.y;
            break;
            case "b":
                out.dx = 0;
                out.dy = bx.y2 - bb.y2;
            break;
            case "m":
                out.dx = 0;
                out.dy = bx.cy - bb.cy;
            break;
            case "l":
                out.dx = bx.x - bb.x;
                out.dy = 0;
            break;
            case "r":
                out.dx = bx.x2 - bb.x2;
                out.dy = 0;
            break;
            default:
                out.dx = bx.cx - bb.cx;
                out.dy = 0;
            break;
        }
        out.toString = toString;
        return out;
    };
    /*\
     * Element.align
     [ method ]
     **
     * Aligns the element relatively to given one via transformation.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object) this element
     > Usage
     | el.align(el2, "top");
     * or
     | el.align("middle");
    \*/
    Element.prototype.align = function (el, way) {
        return this.transform("..." + this.getAlign(el, way));
    };
});

return Snap;
}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlY29yZGVyLmpzIiwic25hcC5zdmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJ2ZW5kb3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oZil7aWYodHlwZW9mIGV4cG9ydHM9PT1cIm9iamVjdFwiJiZ0eXBlb2YgbW9kdWxlIT09XCJ1bmRlZmluZWRcIil7bW9kdWxlLmV4cG9ydHM9ZigpfWVsc2UgaWYodHlwZW9mIGRlZmluZT09PVwiZnVuY3Rpb25cIiYmZGVmaW5lLmFtZCl7ZGVmaW5lKFtdLGYpfWVsc2V7dmFyIGc7aWYodHlwZW9mIHdpbmRvdyE9PVwidW5kZWZpbmVkXCIpe2c9d2luZG93fWVsc2UgaWYodHlwZW9mIGdsb2JhbCE9PVwidW5kZWZpbmVkXCIpe2c9Z2xvYmFsfWVsc2UgaWYodHlwZW9mIHNlbGYhPT1cInVuZGVmaW5lZFwiKXtnPXNlbGZ9ZWxzZXtnPXRoaXN9Zy5SZWNvcmRlciA9IGYoKX19KShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihyZXF1aXJlLG1vZHVsZSxleHBvcnRzKXtcblwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL3JlY29yZGVyXCIpLlJlY29yZGVyO1xuXG59LHtcIi4vcmVjb3JkZXJcIjoyfV0sMjpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBfY3JlYXRlQ2xhc3MgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRvciA9IHByb3BzW2ldO2Rlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTtkZXNjcmlwdG9yLmNvbmZpZ3VyYWJsZSA9IHRydWU7aWYgKFwidmFsdWVcIiBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTtPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7XG4gICAgICAgIH1cbiAgICB9cmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICAgICAgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTtpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTtyZXR1cm4gQ29uc3RydWN0b3I7XG4gICAgfTtcbn0pKCk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICAgIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuUmVjb3JkZXIgPSB1bmRlZmluZWQ7XG5cbnZhciBfaW5saW5lV29ya2VyID0gcmVxdWlyZSgnaW5saW5lLXdvcmtlcicpO1xuXG52YXIgX2lubGluZVdvcmtlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pbmxpbmVXb3JrZXIpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikge1xuICAgIHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9O1xufVxuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7XG4gICAgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvblwiKTtcbiAgICB9XG59XG5cbnZhciBSZWNvcmRlciA9IGV4cG9ydHMuUmVjb3JkZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlY29yZGVyKHNvdXJjZSwgY2ZnKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIFJlY29yZGVyKTtcblxuICAgICAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgICAgICAgIGJ1ZmZlckxlbjogNDA5NixcbiAgICAgICAgICAgIG51bUNoYW5uZWxzOiAyLFxuICAgICAgICAgICAgbWltZVR5cGU6ICdhdWRpby93YXYnXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucmVjb3JkaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzID0ge1xuICAgICAgICAgICAgZ2V0QnVmZmVyOiBbXSxcbiAgICAgICAgICAgIGV4cG9ydFdBVjogW11cbiAgICAgICAgfTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMuY29uZmlnLCBjZmcpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBzb3VyY2UuY29udGV4dDtcbiAgICAgICAgdGhpcy5ub2RlID0gKHRoaXMuY29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IgfHwgdGhpcy5jb250ZXh0LmNyZWF0ZUphdmFTY3JpcHROb2RlKS5jYWxsKHRoaXMuY29udGV4dCwgdGhpcy5jb25maWcuYnVmZmVyTGVuLCB0aGlzLmNvbmZpZy5udW1DaGFubmVscywgdGhpcy5jb25maWcubnVtQ2hhbm5lbHMpO1xuXG4gICAgICAgIHRoaXMubm9kZS5vbmF1ZGlvcHJvY2VzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBpZiAoIV90aGlzLnJlY29yZGluZykgcmV0dXJuO1xuXG4gICAgICAgICAgICB2YXIgYnVmZmVyID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBjaGFubmVsID0gMDsgY2hhbm5lbCA8IF90aGlzLmNvbmZpZy5udW1DaGFubmVsczsgY2hhbm5lbCsrKSB7XG4gICAgICAgICAgICAgICAgYnVmZmVyLnB1c2goZS5pbnB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YShjaGFubmVsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBfdGhpcy53b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGNvbW1hbmQ6ICdyZWNvcmQnLFxuICAgICAgICAgICAgICAgIGJ1ZmZlcjogYnVmZmVyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBzb3VyY2UuY29ubmVjdCh0aGlzLm5vZGUpO1xuICAgICAgICB0aGlzLm5vZGUuY29ubmVjdCh0aGlzLmNvbnRleHQuZGVzdGluYXRpb24pOyAvL3RoaXMgc2hvdWxkIG5vdCBiZSBuZWNlc3NhcnlcblxuICAgICAgICB2YXIgc2VsZiA9IHt9O1xuICAgICAgICB0aGlzLndvcmtlciA9IG5ldyBfaW5saW5lV29ya2VyMi5kZWZhdWx0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByZWNMZW5ndGggPSAwLFxuICAgICAgICAgICAgICAgIHJlY0J1ZmZlcnMgPSBbXSxcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIG51bUNoYW5uZWxzID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICBzZWxmLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChlLmRhdGEuY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdpbml0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXQoZS5kYXRhLmNvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncmVjb3JkJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY29yZChlLmRhdGEuYnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdleHBvcnRXQVYnOlxuICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0V0FWKGUuZGF0YS50eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlICdnZXRCdWZmZXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgZ2V0QnVmZmVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2xlYXInOlxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluaXQoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgc2FtcGxlUmF0ZSA9IGNvbmZpZy5zYW1wbGVSYXRlO1xuICAgICAgICAgICAgICAgIG51bUNoYW5uZWxzID0gY29uZmlnLm51bUNoYW5uZWxzO1xuICAgICAgICAgICAgICAgIGluaXRCdWZmZXJzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlY29yZChpbnB1dEJ1ZmZlcikge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgbnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgICAgICByZWNCdWZmZXJzW2NoYW5uZWxdLnB1c2goaW5wdXRCdWZmZXJbY2hhbm5lbF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZWNMZW5ndGggKz0gaW5wdXRCdWZmZXJbMF0ubGVuZ3RoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBleHBvcnRXQVYodHlwZSkge1xuICAgICAgICAgICAgICAgIHZhciBidWZmZXJzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCBudW1DaGFubmVsczsgY2hhbm5lbCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJ1ZmZlcnMucHVzaChtZXJnZUJ1ZmZlcnMocmVjQnVmZmVyc1tjaGFubmVsXSwgcmVjTGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBpbnRlcmxlYXZlZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICBpZiAobnVtQ2hhbm5lbHMgPT09IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgaW50ZXJsZWF2ZWQgPSBpbnRlcmxlYXZlKGJ1ZmZlcnNbMF0sIGJ1ZmZlcnNbMV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGludGVybGVhdmVkID0gYnVmZmVyc1swXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGRhdGF2aWV3ID0gZW5jb2RlV0FWKGludGVybGVhdmVkKTtcbiAgICAgICAgICAgICAgICB2YXIgYXVkaW9CbG9iID0gbmV3IEJsb2IoW2RhdGF2aWV3XSwgeyB0eXBlOiB0eXBlIH0pO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZSh7IGNvbW1hbmQ6ICdleHBvcnRXQVYnLCBkYXRhOiBhdWRpb0Jsb2IgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEJ1ZmZlcigpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnVmZmVycyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgbnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgICAgICBidWZmZXJzLnB1c2gobWVyZ2VCdWZmZXJzKHJlY0J1ZmZlcnNbY2hhbm5lbF0sIHJlY0xlbmd0aCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHsgY29tbWFuZDogJ2dldEJ1ZmZlcicsIGRhdGE6IGJ1ZmZlcnMgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICAgICAgICAgICAgIHJlY0xlbmd0aCA9IDA7XG4gICAgICAgICAgICAgICAgcmVjQnVmZmVycyA9IFtdO1xuICAgICAgICAgICAgICAgIGluaXRCdWZmZXJzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGluaXRCdWZmZXJzKCkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNoYW5uZWwgPSAwOyBjaGFubmVsIDwgbnVtQ2hhbm5lbHM7IGNoYW5uZWwrKykge1xuICAgICAgICAgICAgICAgICAgICByZWNCdWZmZXJzW2NoYW5uZWxdID0gW107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBtZXJnZUJ1ZmZlcnMocmVjQnVmZmVycywgcmVjTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkocmVjTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY0J1ZmZlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNldChyZWNCdWZmZXJzW2ldLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgKz0gcmVjQnVmZmVyc1tpXS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGludGVybGVhdmUoaW5wdXRMLCBpbnB1dFIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gaW5wdXRMLmxlbmd0aCArIGlucHV0Ui5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkobGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICAgICAgICAgIGlucHV0SW5kZXggPSAwO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtpbmRleCsrXSA9IGlucHV0TFtpbnB1dEluZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W2luZGV4KytdID0gaW5wdXRSW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dEluZGV4Kys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGZsb2F0VG8xNkJpdFBDTShvdXRwdXQsIG9mZnNldCwgaW5wdXQpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGlucHV0Lmxlbmd0aDsgaSsrLCBvZmZzZXQgKz0gMikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcyA9IE1hdGgubWF4KC0xLCBNYXRoLm1pbigxLCBpbnB1dFtpXSkpO1xuICAgICAgICAgICAgICAgICAgICBvdXRwdXQuc2V0SW50MTYob2Zmc2V0LCBzIDwgMCA/IHMgKiAweDgwMDAgOiBzICogMHg3RkZGLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIHdyaXRlU3RyaW5nKHZpZXcsIG9mZnNldCwgc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQgKyBpLCBzdHJpbmcuY2hhckNvZGVBdChpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmdW5jdGlvbiBlbmNvZGVXQVYoc2FtcGxlcykge1xuICAgICAgICAgICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNDQgKyBzYW1wbGVzLmxlbmd0aCAqIDIpO1xuICAgICAgICAgICAgICAgIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KGJ1ZmZlcik7XG5cbiAgICAgICAgICAgICAgICAvKiBSSUZGIGlkZW50aWZpZXIgKi9cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmluZyh2aWV3LCAwLCAnUklGRicpO1xuICAgICAgICAgICAgICAgIC8qIFJJRkYgY2h1bmsgbGVuZ3RoICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoNCwgMzYgKyBzYW1wbGVzLmxlbmd0aCAqIDIsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIFJJRkYgdHlwZSAqL1xuICAgICAgICAgICAgICAgIHdyaXRlU3RyaW5nKHZpZXcsIDgsICdXQVZFJyk7XG4gICAgICAgICAgICAgICAgLyogZm9ybWF0IGNodW5rIGlkZW50aWZpZXIgKi9cbiAgICAgICAgICAgICAgICB3cml0ZVN0cmluZyh2aWV3LCAxMiwgJ2ZtdCAnKTtcbiAgICAgICAgICAgICAgICAvKiBmb3JtYXQgY2h1bmsgbGVuZ3RoICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBzYW1wbGUgZm9ybWF0IChyYXcpICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGNoYW5uZWwgY291bnQgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigyMiwgbnVtQ2hhbm5lbHMsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIHNhbXBsZSByYXRlICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMjQsIHNhbXBsZVJhdGUsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGJ5dGUgcmF0ZSAoc2FtcGxlIHJhdGUgKiBibG9jayBhbGlnbikgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQzMigyOCwgc2FtcGxlUmF0ZSAqIDQsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGJsb2NrIGFsaWduIChjaGFubmVsIGNvdW50ICogYnl0ZXMgcGVyIHNhbXBsZSkgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigzMiwgbnVtQ2hhbm5lbHMgKiAyLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvKiBiaXRzIHBlciBzYW1wbGUgKi9cbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigzNCwgMTYsIHRydWUpO1xuICAgICAgICAgICAgICAgIC8qIGRhdGEgY2h1bmsgaWRlbnRpZmllciAqL1xuICAgICAgICAgICAgICAgIHdyaXRlU3RyaW5nKHZpZXcsIDM2LCAnZGF0YScpO1xuICAgICAgICAgICAgICAgIC8qIGRhdGEgY2h1bmsgbGVuZ3RoICovXG4gICAgICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoNDAsIHNhbXBsZXMubGVuZ3RoICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICBmbG9hdFRvMTZCaXRQQ00odmlldywgNDQsIHNhbXBsZXMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZpZXc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHNlbGYpO1xuXG4gICAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGNvbW1hbmQ6ICdpbml0JyxcbiAgICAgICAgICAgIGNvbmZpZzoge1xuICAgICAgICAgICAgICAgIHNhbXBsZVJhdGU6IHRoaXMuY29udGV4dC5zYW1wbGVSYXRlLFxuICAgICAgICAgICAgICAgIG51bUNoYW5uZWxzOiB0aGlzLmNvbmZpZy5udW1DaGFubmVsc1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLndvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgdmFyIGNiID0gX3RoaXMuY2FsbGJhY2tzW2UuZGF0YS5jb21tYW5kXS5wb3AoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNiKGUuZGF0YS5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfY3JlYXRlQ2xhc3MoUmVjb3JkZXIsIFt7XG4gICAgICAgIGtleTogJ3JlY29yZCcsXG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiByZWNvcmQoKSB7XG4gICAgICAgICAgICB0aGlzLnJlY29yZGluZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ3N0b3AnLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb3JkaW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LCB7XG4gICAgICAgIGtleTogJ2NsZWFyJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgICAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoeyBjb21tYW5kOiAnY2xlYXInIH0pO1xuICAgICAgICB9XG4gICAgfSwge1xuICAgICAgICBrZXk6ICdnZXRCdWZmZXInLFxuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gZ2V0QnVmZmVyKGNiKSB7XG4gICAgICAgICAgICBjYiA9IGNiIHx8IHRoaXMuY29uZmlnLmNhbGxiYWNrO1xuICAgICAgICAgICAgaWYgKCFjYikgdGhyb3cgbmV3IEVycm9yKCdDYWxsYmFjayBub3Qgc2V0Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLmdldEJ1ZmZlci5wdXNoKGNiKTtcblxuICAgICAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoeyBjb21tYW5kOiAnZ2V0QnVmZmVyJyB9KTtcbiAgICAgICAgfVxuICAgIH0sIHtcbiAgICAgICAga2V5OiAnZXhwb3J0V0FWJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGV4cG9ydFdBVihjYiwgbWltZVR5cGUpIHtcbiAgICAgICAgICAgIG1pbWVUeXBlID0gbWltZVR5cGUgfHwgdGhpcy5jb25maWcubWltZVR5cGU7XG4gICAgICAgICAgICBjYiA9IGNiIHx8IHRoaXMuY29uZmlnLmNhbGxiYWNrO1xuICAgICAgICAgICAgaWYgKCFjYikgdGhyb3cgbmV3IEVycm9yKCdDYWxsYmFjayBub3Qgc2V0Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzLmV4cG9ydFdBVi5wdXNoKGNiKTtcblxuICAgICAgICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIGNvbW1hbmQ6ICdleHBvcnRXQVYnLFxuICAgICAgICAgICAgICAgIHR5cGU6IG1pbWVUeXBlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1dLCBbe1xuICAgICAgICBrZXk6ICdmb3JjZURvd25sb2FkJyxcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGZvcmNlRG93bmxvYWQoYmxvYiwgZmlsZW5hbWUpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSAod2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgICB2YXIgbGluayA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBsaW5rLmhyZWYgPSB1cmw7XG4gICAgICAgICAgICBsaW5rLmRvd25sb2FkID0gZmlsZW5hbWUgfHwgJ291dHB1dC53YXYnO1xuICAgICAgICAgICAgdmFyIGNsaWNrID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKTtcbiAgICAgICAgICAgIGNsaWNrLmluaXRFdmVudChcImNsaWNrXCIsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgbGluay5kaXNwYXRjaEV2ZW50KGNsaWNrKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBSZWNvcmRlcjtcbn0pKCk7XG5cbmV4cG9ydHMuZGVmYXVsdCA9IFJlY29yZGVyO1xuXG59LHtcImlubGluZS13b3JrZXJcIjozfV0sMzpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pbmxpbmUtd29ya2VyXCIpO1xufSx7XCIuL2lubGluZS13b3JrZXJcIjo0fV0sNDpbZnVuY3Rpb24ocmVxdWlyZSxtb2R1bGUsZXhwb3J0cyl7XG4oZnVuY3Rpb24gKGdsb2JhbCl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBrZXkgaW4gcHJvcHMpIHsgdmFyIHByb3AgPSBwcm9wc1trZXldOyBwcm9wLmNvbmZpZ3VyYWJsZSA9IHRydWU7IGlmIChwcm9wLnZhbHVlKSBwcm9wLndyaXRhYmxlID0gdHJ1ZTsgfSBPYmplY3QuZGVmaW5lUHJvcGVydGllcyh0YXJnZXQsIHByb3BzKTsgfSByZXR1cm4gZnVuY3Rpb24gKENvbnN0cnVjdG9yLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykgeyBpZiAocHJvdG9Qcm9wcykgZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IsIHN0YXRpY1Byb3BzKTsgcmV0dXJuIENvbnN0cnVjdG9yOyB9OyB9KSgpO1xuXG52YXIgX2NsYXNzQ2FsbENoZWNrID0gZnVuY3Rpb24gKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH07XG5cbnZhciBXT1JLRVJfRU5BQkxFRCA9ICEhKGdsb2JhbCA9PT0gZ2xvYmFsLndpbmRvdyAmJiBnbG9iYWwuVVJMICYmIGdsb2JhbC5CbG9iICYmIGdsb2JhbC5Xb3JrZXIpO1xuXG52YXIgSW5saW5lV29ya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gSW5saW5lV29ya2VyKGZ1bmMsIHNlbGYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIElubGluZVdvcmtlcik7XG5cbiAgICBpZiAoV09SS0VSX0VOQUJMRUQpIHtcbiAgICAgIHZhciBmdW5jdGlvbkJvZHkgPSBmdW5jLnRvU3RyaW5nKCkudHJpbSgpLm1hdGNoKC9eZnVuY3Rpb25cXHMqXFx3KlxccypcXChbXFx3XFxzLF0qXFwpXFxzKnsoW1xcd1xcV10qPyl9JC8pWzFdO1xuICAgICAgdmFyIHVybCA9IGdsb2JhbC5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBnbG9iYWwuQmxvYihbZnVuY3Rpb25Cb2R5XSwgeyB0eXBlOiBcInRleHQvamF2YXNjcmlwdFwiIH0pKTtcblxuICAgICAgcmV0dXJuIG5ldyBnbG9iYWwuV29ya2VyKHVybCk7XG4gICAgfVxuXG4gICAgdGhpcy5zZWxmID0gc2VsZjtcbiAgICB0aGlzLnNlbGYucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIF90aGlzLm9ubWVzc2FnZSh7IGRhdGE6IGRhdGEgfSk7XG4gICAgICB9LCAwKTtcbiAgICB9O1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBmdW5jLmNhbGwoc2VsZik7XG4gICAgfSwgMCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoSW5saW5lV29ya2VyLCB7XG4gICAgcG9zdE1lc3NhZ2U6IHtcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBwb3N0TWVzc2FnZShkYXRhKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgX3RoaXMuc2VsZi5vbm1lc3NhZ2UoeyBkYXRhOiBkYXRhIH0pO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBJbmxpbmVXb3JrZXI7XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IElubGluZVdvcmtlcjtcbn0pLmNhbGwodGhpcyx0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxufSx7fV19LHt9LFsxXSkoMSlcbn0pO1xuIiwiLy8gU25hcC5zdmcgMC40LjFcbi8vXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMg4oCTIDIwMTUgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4vL1xuLy8gYnVpbGQ6IDIwMTUtMDQtMTNcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLy8g4pSM4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSA4pSQIFxcXFxcbi8vIOKUgiBFdmUgMC40LjIgLSBKYXZhU2NyaXB0IEV2ZW50cyBMaWJyYXJ5ICAgICAgICAgICAgICAgICAgICAgIOKUgiBcXFxcXG4vLyDilJzilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilIDilKQgXFxcXFxuLy8g4pSCIEF1dGhvciBEbWl0cnkgQmFyYW5vdnNraXkgKGh0dHA6Ly9kbWl0cnkuYmFyYW5vdnNraXkuY29tLykg4pSCIFxcXFxcbi8vIOKUlOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUgOKUmCBcXFxcXG5cbihmdW5jdGlvbiAoZ2xvYikge1xuICAgIHZhciB2ZXJzaW9uID0gXCIwLjQuMlwiLFxuICAgICAgICBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIHNlcGFyYXRvciA9IC9bXFwuXFwvXS8sXG4gICAgICAgIGNvbWFzZXBhcmF0b3IgPSAvXFxzKixcXHMqLyxcbiAgICAgICAgd2lsZGNhcmQgPSBcIipcIixcbiAgICAgICAgZnVuID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIG51bXNvcnQgPSBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgLSBiO1xuICAgICAgICB9LFxuICAgICAgICBjdXJyZW50X2V2ZW50LFxuICAgICAgICBzdG9wLFxuICAgICAgICBldmVudHMgPSB7bjoge319LFxuICAgICAgICBmaXJzdERlZmluZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXNbaV0gIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGxhc3REZWZpbmVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGkgPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlICgtLWkpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXNbaV0gIT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgLypcXFxuICAgICAqIGV2ZVxuICAgICBbIG1ldGhvZCBdXG5cbiAgICAgKiBGaXJlcyBldmVudCB3aXRoIGdpdmVuIGBuYW1lYCwgZ2l2ZW4gc2NvcGUgYW5kIG90aGVyIHBhcmFtZXRlcnMuXG5cbiAgICAgPiBBcmd1bWVudHNcblxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgKmV2ZW50KiwgZG90IChgLmApIG9yIHNsYXNoIChgL2ApIHNlcGFyYXRlZFxuICAgICAtIHNjb3BlIChvYmplY3QpIGNvbnRleHQgZm9yIHRoZSBldmVudCBoYW5kbGVyc1xuICAgICAtIHZhcmFyZ3MgKC4uLikgdGhlIHJlc3Qgb2YgYXJndW1lbnRzIHdpbGwgYmUgc2VudCB0byBldmVudCBoYW5kbGVyc1xuXG4gICAgID0gKG9iamVjdCkgYXJyYXkgb2YgcmV0dXJuZWQgdmFsdWVzIGZyb20gdGhlIGxpc3RlbmVycy4gQXJyYXkgaGFzIHR3byBtZXRob2RzIGAuZmlyc3REZWZpbmVkKClgIGFuZCBgLmxhc3REZWZpbmVkKClgIHRvIGdldCBmaXJzdCBvciBsYXN0IG5vdCBgdW5kZWZpbmVkYCB2YWx1ZS5cbiAgICBcXCovXG4gICAgICAgIGV2ZSA9IGZ1bmN0aW9uIChuYW1lLCBzY29wZSkge1xuICAgICAgICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICAgICAgICAgIHZhciBlID0gZXZlbnRzLFxuICAgICAgICAgICAgICAgIG9sZHN0b3AgPSBzdG9wLFxuICAgICAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpLFxuICAgICAgICAgICAgICAgIGxpc3RlbmVycyA9IGV2ZS5saXN0ZW5lcnMobmFtZSksXG4gICAgICAgICAgICAgICAgeiA9IDAsXG4gICAgICAgICAgICAgICAgZiA9IGZhbHNlLFxuICAgICAgICAgICAgICAgIGwsXG4gICAgICAgICAgICAgICAgaW5kZXhlZCA9IFtdLFxuICAgICAgICAgICAgICAgIHF1ZXVlID0ge30sXG4gICAgICAgICAgICAgICAgb3V0ID0gW10sXG4gICAgICAgICAgICAgICAgY2UgPSBjdXJyZW50X2V2ZW50LFxuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgb3V0LmZpcnN0RGVmaW5lZCA9IGZpcnN0RGVmaW5lZDtcbiAgICAgICAgICAgIG91dC5sYXN0RGVmaW5lZCA9IGxhc3REZWZpbmVkO1xuICAgICAgICAgICAgY3VycmVudF9ldmVudCA9IG5hbWU7XG4gICAgICAgICAgICBzdG9wID0gMDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAoXCJ6SW5kZXhcIiBpbiBsaXN0ZW5lcnNbaV0pIHtcbiAgICAgICAgICAgICAgICBpbmRleGVkLnB1c2gobGlzdGVuZXJzW2ldLnpJbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKGxpc3RlbmVyc1tpXS56SW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlW2xpc3RlbmVyc1tpXS56SW5kZXhdID0gbGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGluZGV4ZWQuc29ydChudW1zb3J0KTtcbiAgICAgICAgICAgIHdoaWxlIChpbmRleGVkW3pdIDwgMCkge1xuICAgICAgICAgICAgICAgIGwgPSBxdWV1ZVtpbmRleGVkW3orK11dO1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGwuYXBwbHkoc2NvcGUsIGFyZ3MpKTtcbiAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICBzdG9wID0gb2xkc3RvcDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGwgPSBsaXN0ZW5lcnNbaV07XG4gICAgICAgICAgICAgICAgaWYgKFwiekluZGV4XCIgaW4gbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAobC56SW5kZXggPT0gaW5kZXhlZFt6XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHN0b3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB6Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbCA9IHF1ZXVlW2luZGV4ZWRbel1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGwgJiYgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9wKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGwpXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZVtsLnpJbmRleF0gPSBsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0LnB1c2gobC5hcHBseShzY29wZSwgYXJncykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RvcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdG9wID0gb2xkc3RvcDtcbiAgICAgICAgICAgIGN1cnJlbnRfZXZlbnQgPSBjZTtcbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFVuZG9jdW1lbnRlZC4gRGVidWcgb25seS5cbiAgICAgICAgZXZlLl9ldmVudHMgPSBldmVudHM7XG4gICAgLypcXFxuICAgICAqIGV2ZS5saXN0ZW5lcnNcbiAgICAgWyBtZXRob2QgXVxuXG4gICAgICogSW50ZXJuYWwgbWV0aG9kIHdoaWNoIGdpdmVzIHlvdSBhcnJheSBvZiBhbGwgZXZlbnQgaGFuZGxlcnMgdGhhdCB3aWxsIGJlIHRyaWdnZXJlZCBieSB0aGUgZ2l2ZW4gYG5hbWVgLlxuXG4gICAgID4gQXJndW1lbnRzXG5cbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkXG5cbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIGV2ZW50IGhhbmRsZXJzXG4gICAgXFwqL1xuICAgIGV2ZS5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvciksXG4gICAgICAgICAgICBlID0gZXZlbnRzLFxuICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgIGl0ZW1zLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBpaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBqaixcbiAgICAgICAgICAgIG5lcyxcbiAgICAgICAgICAgIGVzID0gW2VdLFxuICAgICAgICAgICAgb3V0ID0gW107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgbmVzID0gW107XG4gICAgICAgICAgICBmb3IgKGogPSAwLCBqaiA9IGVzLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICBlID0gZXNbal0ubjtcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtlW25hbWVzW2ldXSwgZVt3aWxkY2FyZF1dO1xuICAgICAgICAgICAgICAgIGsgPSAyO1xuICAgICAgICAgICAgICAgIHdoaWxlIChrLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2tdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmVzLnB1c2goaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQgPSBvdXQuY29uY2F0KGl0ZW0uZiB8fCBbXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlcyA9IG5lcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgXG4gICAgLypcXFxuICAgICAqIGV2ZS5vblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmluZHMgZ2l2ZW4gZXZlbnQgaGFuZGxlciB3aXRoIGEgZ2l2ZW4gbmFtZS4gWW91IGNhbiB1c2Ugd2lsZGNhcmRzIOKAnGAqYOKAnSBmb3IgdGhlIG5hbWVzOlxuICAgICB8IGV2ZS5vbihcIioudW5kZXIuKlwiLCBmKTtcbiAgICAgfCBldmUoXCJtb3VzZS51bmRlci5mbG9vclwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICAqIFVzZSBAZXZlIHRvIHRyaWdnZXIgdGhlIGxpc3RlbmVyLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICAgKipcbiAgICAgPSAoZnVuY3Rpb24pIHJldHVybmVkIGZ1bmN0aW9uIGFjY2VwdHMgYSBzaW5nbGUgbnVtZXJpYyBwYXJhbWV0ZXIgdGhhdCByZXByZXNlbnRzIHotaW5kZXggb2YgdGhlIGhhbmRsZXIuIEl0IGlzIGFuIG9wdGlvbmFsIGZlYXR1cmUgYW5kIG9ubHkgdXNlZCB3aGVuIHlvdSBuZWVkIHRvIGVuc3VyZSB0aGF0IHNvbWUgc3Vic2V0IG9mIGhhbmRsZXJzIHdpbGwgYmUgaW52b2tlZCBpbiBhIGdpdmVuIG9yZGVyLCBkZXNwaXRlIG9mIHRoZSBvcmRlciBvZiBhc3NpZ25tZW50LiBcbiAgICAgPiBFeGFtcGxlOlxuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIGVhdEl0KSgyKTtcbiAgICAgfCBldmUub24oXCJtb3VzZVwiLCBzY3JlYW0pO1xuICAgICB8IGV2ZS5vbihcIm1vdXNlXCIsIGNhdGNoSXQpKDEpO1xuICAgICAqIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCBgY2F0Y2hJdGAgZnVuY3Rpb24gd2lsbCBiZSBjYWxsZWQgYmVmb3JlIGBlYXRJdGAuXG4gICAgICpcbiAgICAgKiBJZiB5b3Ugd2FudCB0byBwdXQgeW91ciBoYW5kbGVyIGJlZm9yZSBub24taW5kZXhlZCBoYW5kbGVycywgc3BlY2lmeSBhIG5lZ2F0aXZlIHZhbHVlLlxuICAgICAqIE5vdGU6IEkgYXNzdW1lIG1vc3Qgb2YgdGhlIHRpbWUgeW91IGRvbuKAmXQgbmVlZCB0byB3b3JyeSBhYm91dCB6LWluZGV4LCBidXQgaXTigJlzIG5pY2UgdG8gaGF2ZSB0aGlzIGZlYXR1cmUg4oCcanVzdCBpbiBjYXNl4oCdLlxuICAgIFxcKi9cbiAgICBldmUub24gPSBmdW5jdGlvbiAobmFtZSwgZikge1xuICAgICAgICBuYW1lID0gU3RyaW5nKG5hbWUpO1xuICAgICAgICBpZiAodHlwZW9mIGYgIT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge307XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChjb21hc2VwYXJhdG9yKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzID0gbmFtZS5zcGxpdChzZXBhcmF0b3IpLFxuICAgICAgICAgICAgICAgICAgICBlID0gZXZlbnRzLFxuICAgICAgICAgICAgICAgICAgICBleGlzdDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGUgPSBlLm47XG4gICAgICAgICAgICAgICAgICAgIGUgPSBlLmhhc093blByb3BlcnR5KG5hbWVzW2ldKSAmJiBlW25hbWVzW2ldXSB8fCAoZVtuYW1lc1tpXV0gPSB7bjoge319KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZS5mID0gZS5mIHx8IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gZS5mLmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChlLmZbaV0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICBleGlzdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAhZXhpc3QgJiYgZS5mLnB1c2goZik7XG4gICAgICAgICAgICB9KG5hbWVzW2ldKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh6SW5kZXgpIHtcbiAgICAgICAgICAgIGlmICgrekluZGV4ID09ICt6SW5kZXgpIHtcbiAgICAgICAgICAgICAgICBmLnpJbmRleCA9ICt6SW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLmZcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgZnVuY3Rpb24gdGhhdCB3aWxsIGZpcmUgZ2l2ZW4gZXZlbnQgd2l0aCBvcHRpb25hbCBhcmd1bWVudHMuXG4gICAgICogQXJndW1lbnRzIHRoYXQgd2lsbCBiZSBwYXNzZWQgdG8gdGhlIHJlc3VsdCBmdW5jdGlvbiB3aWxsIGJlIGFsc29cbiAgICAgKiBjb25jYXRlZCB0byB0aGUgbGlzdCBvZiBmaW5hbCBhcmd1bWVudHMuXG4gICAgIHwgZWwub25jbGljayA9IGV2ZS5mKFwiY2xpY2tcIiwgMSwgMik7XG4gICAgIHwgZXZlLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgfCAgICAgY29uc29sZS5sb2coYSwgYiwgYyk7IC8vIDEsIDIsIFtldmVudCBvYmplY3RdXG4gICAgIHwgfSk7XG4gICAgID4gQXJndW1lbnRzXG4gICAgIC0gZXZlbnQgKHN0cmluZykgZXZlbnQgbmFtZVxuICAgICAtIHZhcmFyZ3MgKOKApikgYW5kIGFueSBvdGhlciBhcmd1bWVudHNcbiAgICAgPSAoZnVuY3Rpb24pIHBvc3NpYmxlIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgZXZlLmYgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIGF0dHJzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlLmFwcGx5KG51bGwsIFtldmVudCwgbnVsbF0uY29uY2F0KGF0dHJzKS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKSk7XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLnN0b3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIElzIHVzZWQgaW5zaWRlIGFuIGV2ZW50IGhhbmRsZXIgdG8gc3RvcCB0aGUgZXZlbnQsIHByZXZlbnRpbmcgYW55IHN1YnNlcXVlbnQgbGlzdGVuZXJzIGZyb20gZmlyaW5nLlxuICAgIFxcKi9cbiAgICBldmUuc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc3RvcCA9IDE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm50XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIHN1Ym5hbWUgKHN0cmluZykgI29wdGlvbmFsIHN1Ym5hbWUgb2YgdGhlIGV2ZW50XG4gICAgICoqXG4gICAgID0gKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGlmIGBzdWJuYW1lYCBpcyBub3Qgc3BlY2lmaWVkXG4gICAgICogb3JcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgLCBpZiBjdXJyZW50IGV2ZW504oCZcyBuYW1lIGNvbnRhaW5zIGBzdWJuYW1lYFxuICAgIFxcKi9cbiAgICBldmUubnQgPSBmdW5jdGlvbiAoc3VibmFtZSkge1xuICAgICAgICBpZiAoc3VibmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoXCIoPzpcXFxcLnxcXFxcL3xeKVwiICsgc3VibmFtZSArIFwiKD86XFxcXC58XFxcXC98JClcIikudGVzdChjdXJyZW50X2V2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudF9ldmVudDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUubnRzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDb3VsZCBiZSB1c2VkIGluc2lkZSBldmVudCBoYW5kbGVyIHRvIGZpZ3VyZSBvdXQgYWN0dWFsIG5hbWUgb2YgdGhlIGV2ZW50LlxuICAgICAqKlxuICAgICAqKlxuICAgICA9IChhcnJheSkgbmFtZXMgb2YgdGhlIGV2ZW50XG4gICAgXFwqL1xuICAgIGV2ZS5udHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50X2V2ZW50LnNwbGl0KHNlcGFyYXRvcik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9mZlxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBsaXN0IG9mIGV2ZW50IGxpc3RlbmVycyBhc3NpZ25lZCB0byBnaXZlbiBuYW1lLlxuICAgICAqIElmIG5vIGFyZ3VtZW50cyBzcGVjaWZpZWQgYWxsIHRoZSBldmVudHMgd2lsbCBiZSBjbGVhcmVkLlxuICAgICAqKlxuICAgICA+IEFyZ3VtZW50c1xuICAgICAqKlxuICAgICAtIG5hbWUgKHN0cmluZykgbmFtZSBvZiB0aGUgZXZlbnQsIGRvdCAoYC5gKSBvciBzbGFzaCAoYC9gKSBzZXBhcmF0ZWQsIHdpdGggb3B0aW9uYWwgd2lsZGNhcmRzXG4gICAgIC0gZiAoZnVuY3Rpb24pIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb25cbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIGV2ZS51bmJpbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBAZXZlLm9mZlxuICAgIFxcKi9cbiAgICBldmUub2ZmID0gZXZlLnVuYmluZCA9IGZ1bmN0aW9uIChuYW1lLCBmKSB7XG4gICAgICAgIGlmICghbmFtZSkge1xuICAgICAgICAgICAgZXZlLl9ldmVudHMgPSBldmVudHMgPSB7bjoge319O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lcyA9IG5hbWUuc3BsaXQoY29tYXNlcGFyYXRvcik7XG4gICAgICAgIGlmIChuYW1lcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBuYW1lcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZXZlLm9mZihuYW1lc1tpXSwgZik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbmFtZXMgPSBuYW1lLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIHZhciBlLFxuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgc3BsaWNlLFxuICAgICAgICAgICAgaSwgaWksIGosIGpqLFxuICAgICAgICAgICAgY3VyID0gW2V2ZW50c107XG4gICAgICAgIGZvciAoaSA9IDAsIGlpID0gbmFtZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGN1ci5sZW5ndGg7IGogKz0gc3BsaWNlLmxlbmd0aCAtIDIpIHtcbiAgICAgICAgICAgICAgICBzcGxpY2UgPSBbaiwgMV07XG4gICAgICAgICAgICAgICAgZSA9IGN1cltqXS5uO1xuICAgICAgICAgICAgICAgIGlmIChuYW1lc1tpXSAhPSB3aWxkY2FyZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZVtuYW1lc1tpXV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGljZS5wdXNoKGVbbmFtZXNbaV1dKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUpIGlmIChlW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaWNlLnB1c2goZVtrZXldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjdXIuc3BsaWNlLmFwcGx5KGN1ciwgc3BsaWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBpaSA9IGN1ci5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBlID0gY3VyW2ldO1xuICAgICAgICAgICAgd2hpbGUgKGUubikge1xuICAgICAgICAgICAgICAgIGlmIChmKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlLmYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZS5mLmxlbmd0aDsgaiA8IGpqOyBqKyspIGlmIChlLmZbal0gPT0gZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuZi5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAhZS5mLmxlbmd0aCAmJiBkZWxldGUgZS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIGUubikgaWYgKGUubltoYXNdKGtleSkgJiYgZS5uW2tleV0uZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZ1bmNzID0gZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGpqID0gZnVuY3MubGVuZ3RoOyBqIDwgamo7IGorKykgaWYgKGZ1bmNzW2pdID09IGYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jcy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAhZnVuY3MubGVuZ3RoICYmIGRlbGV0ZSBlLm5ba2V5XS5mO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGUuZjtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChrZXkgaW4gZS5uKSBpZiAoZS5uW2hhc10oa2V5KSAmJiBlLm5ba2V5XS5mKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZS5uW2tleV0uZjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlID0gZS5uO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogZXZlLm9uY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJpbmRzIGdpdmVuIGV2ZW50IGhhbmRsZXIgd2l0aCBhIGdpdmVuIG5hbWUgdG8gb25seSBydW4gb25jZSB0aGVuIHVuYmluZCBpdHNlbGYuXG4gICAgIHwgZXZlLm9uY2UoXCJsb2dpblwiLCBmKTtcbiAgICAgfCBldmUoXCJsb2dpblwiKTsgLy8gdHJpZ2dlcnMgZlxuICAgICB8IGV2ZShcImxvZ2luXCIpOyAvLyBubyBsaXN0ZW5lcnNcbiAgICAgKiBVc2UgQGV2ZSB0byB0cmlnZ2VyIHRoZSBsaXN0ZW5lci5cbiAgICAgKipcbiAgICAgPiBBcmd1bWVudHNcbiAgICAgKipcbiAgICAgLSBuYW1lIChzdHJpbmcpIG5hbWUgb2YgdGhlIGV2ZW50LCBkb3QgKGAuYCkgb3Igc2xhc2ggKGAvYCkgc2VwYXJhdGVkLCB3aXRoIG9wdGlvbmFsIHdpbGRjYXJkc1xuICAgICAtIGYgKGZ1bmN0aW9uKSBldmVudCBoYW5kbGVyIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgID0gKGZ1bmN0aW9uKSBzYW1lIHJldHVybiBmdW5jdGlvbiBhcyBAZXZlLm9uXG4gICAgXFwqL1xuICAgIGV2ZS5vbmNlID0gZnVuY3Rpb24gKG5hbWUsIGYpIHtcbiAgICAgICAgdmFyIGYyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZXZlLnVuYmluZChuYW1lLCBmMik7XG4gICAgICAgICAgICByZXR1cm4gZi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZXZlLm9uKG5hbWUsIGYyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBldmUudmVyc2lvblxuICAgICBbIHByb3BlcnR5IChzdHJpbmcpIF1cbiAgICAgKipcbiAgICAgKiBDdXJyZW50IHZlcnNpb24gb2YgdGhlIGxpYnJhcnkuXG4gICAgXFwqL1xuICAgIGV2ZS52ZXJzaW9uID0gdmVyc2lvbjtcbiAgICBldmUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBcIllvdSBhcmUgcnVubmluZyBFdmUgXCIgKyB2ZXJzaW9uO1xuICAgIH07XG4gICAgKHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiAmJiBtb2R1bGUuZXhwb3J0cykgPyAobW9kdWxlLmV4cG9ydHMgPSBldmUpIDogKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kID8gKGRlZmluZShcImV2ZVwiLCBbXSwgZnVuY3Rpb24oKSB7IHJldHVybiBldmU7IH0pKSA6IChnbG9iLmV2ZSA9IGV2ZSkpO1xufSkodGhpcyk7XG5cbihmdW5jdGlvbiAoZ2xvYiwgZmFjdG9yeSkge1xuICAgIC8vIEFNRCBzdXBwb3J0XG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgLy8gRGVmaW5lIGFzIGFuIGFub255bW91cyBtb2R1bGVcbiAgICAgICAgZGVmaW5lKFtcImV2ZVwiXSwgZnVuY3Rpb24gKGV2ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhY3RvcnkoZ2xvYiwgZXZlKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAvLyBOZXh0IGZvciBOb2RlLmpzIG9yIENvbW1vbkpTXG4gICAgICAgIHZhciBldmUgPSByZXF1aXJlKCdldmUnKTtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KGdsb2IsIGV2ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQnJvd3NlciBnbG9iYWxzIChnbG9iIGlzIHdpbmRvdylcbiAgICAgICAgLy8gU25hcCBhZGRzIGl0c2VsZiB0byB3aW5kb3dcbiAgICAgICAgZmFjdG9yeShnbG9iLCBnbG9iLmV2ZSk7XG4gICAgfVxufSh3aW5kb3cgfHwgdGhpcywgZnVuY3Rpb24gKHdpbmRvdywgZXZlKSB7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnZhciBtaW5hID0gKGZ1bmN0aW9uIChldmUpIHtcbiAgICB2YXIgYW5pbWF0aW9ucyA9IHt9LFxuICAgIHJlcXVlc3RBbmltRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lICAgICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSAgICB8fFxuICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZSAgICAgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAxNik7XG4gICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgcmV0dXJuIGEgaW5zdGFuY2VvZiBBcnJheSB8fFxuICAgICAgICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09IFwiW29iamVjdCBBcnJheV1cIjtcbiAgICB9LFxuICAgIGlkZ2VuID0gMCxcbiAgICBpZHByZWZpeCA9IFwiTVwiICsgKCtuZXcgRGF0ZSkudG9TdHJpbmcoMzYpLFxuICAgIElEID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gaWRwcmVmaXggKyAoaWRnZW4rKykudG9TdHJpbmcoMzYpO1xuICAgIH0sXG4gICAgZGlmZiA9IGZ1bmN0aW9uIChhLCBiLCBBLCBCKSB7XG4gICAgICAgIGlmIChpc0FycmF5KGEpKSB7XG4gICAgICAgICAgICByZXMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGEubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIHJlc1tpXSA9IGRpZmYoYVtpXSwgYiwgQVtpXSwgQik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkaWYgPSAoQSAtIGEpIC8gKEIgLSBiKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChiYikge1xuICAgICAgICAgICAgcmV0dXJuIGEgKyBkaWYgKiAoYmIgLSBiKTtcbiAgICAgICAgfTtcbiAgICB9LFxuICAgIHRpbWVyID0gRGF0ZS5ub3cgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gK25ldyBEYXRlO1xuICAgIH0sXG4gICAgc3RhID0gZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICB2YXIgYSA9IHRoaXM7XG4gICAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGEucztcbiAgICAgICAgfVxuICAgICAgICB2YXIgZHMgPSBhLnMgLSB2YWw7XG4gICAgICAgIGEuYiArPSBhLmR1ciAqIGRzO1xuICAgICAgICBhLkIgKz0gYS5kdXIgKiBkcztcbiAgICAgICAgYS5zID0gdmFsO1xuICAgIH0sXG4gICAgc3BlZWQgPSBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgIHZhciBhID0gdGhpcztcbiAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gYS5zcGQ7XG4gICAgICAgIH1cbiAgICAgICAgYS5zcGQgPSB2YWw7XG4gICAgfSxcbiAgICBkdXJhdGlvbiA9IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgdmFyIGEgPSB0aGlzO1xuICAgICAgICBpZiAodmFsID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBhLmR1cjtcbiAgICAgICAgfVxuICAgICAgICBhLnMgPSBhLnMgKiB2YWwgLyBhLmR1cjtcbiAgICAgICAgYS5kdXIgPSB2YWw7XG4gICAgfSxcbiAgICBzdG9waXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhID0gdGhpcztcbiAgICAgICAgZGVsZXRlIGFuaW1hdGlvbnNbYS5pZF07XG4gICAgICAgIGEudXBkYXRlKCk7XG4gICAgICAgIGV2ZShcIm1pbmEuc3RvcC5cIiArIGEuaWQsIGEpO1xuICAgIH0sXG4gICAgcGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhID0gdGhpcztcbiAgICAgICAgaWYgKGEucGRpZikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBhbmltYXRpb25zW2EuaWRdO1xuICAgICAgICBhLnVwZGF0ZSgpO1xuICAgICAgICBhLnBkaWYgPSBhLmdldCgpIC0gYS5iO1xuICAgIH0sXG4gICAgcmVzdW1lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYSA9IHRoaXM7XG4gICAgICAgIGlmICghYS5wZGlmKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgYS5iID0gYS5nZXQoKSAtIGEucGRpZjtcbiAgICAgICAgZGVsZXRlIGEucGRpZjtcbiAgICAgICAgYW5pbWF0aW9uc1thLmlkXSA9IGE7XG4gICAgfSxcbiAgICB1cGRhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhID0gdGhpcyxcbiAgICAgICAgICAgIHJlcztcbiAgICAgICAgaWYgKGlzQXJyYXkoYS5zdGFydCkpIHtcbiAgICAgICAgICAgIHJlcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDAsIGpqID0gYS5zdGFydC5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgcmVzW2pdID0gK2Euc3RhcnRbal0gK1xuICAgICAgICAgICAgICAgICAgICAoYS5lbmRbal0gLSBhLnN0YXJ0W2pdKSAqIGEuZWFzaW5nKGEucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMgPSArYS5zdGFydCArIChhLmVuZCAtIGEuc3RhcnQpICogYS5lYXNpbmcoYS5zKTtcbiAgICAgICAgfVxuICAgICAgICBhLnNldChyZXMpO1xuICAgIH0sXG4gICAgZnJhbWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBsZW4gPSAwO1xuICAgICAgICBmb3IgKHZhciBpIGluIGFuaW1hdGlvbnMpIGlmIChhbmltYXRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICB2YXIgYSA9IGFuaW1hdGlvbnNbaV0sXG4gICAgICAgICAgICAgICAgYiA9IGEuZ2V0KCksXG4gICAgICAgICAgICAgICAgcmVzO1xuICAgICAgICAgICAgbGVuKys7XG4gICAgICAgICAgICBhLnMgPSAoYiAtIGEuYikgLyAoYS5kdXIgLyBhLnNwZCk7XG4gICAgICAgICAgICBpZiAoYS5zID49IDEpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgYW5pbWF0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBhLnMgPSAxO1xuICAgICAgICAgICAgICAgIGxlbi0tO1xuICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoYSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZShcIm1pbmEuZmluaXNoLlwiICsgYS5pZCwgYSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0oYSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYS51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBsZW4gJiYgcmVxdWVzdEFuaW1GcmFtZShmcmFtZSk7XG4gICAgfSxcbiAgICAvKlxcXG4gICAgICogbWluYVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogR2VuZXJpYyBhbmltYXRpb24gb2YgbnVtYmVyc1xuICAgICAqKlxuICAgICAtIGEgKG51bWJlcikgc3RhcnQgX3NsYXZlXyBudW1iZXJcbiAgICAgLSBBIChudW1iZXIpIGVuZCBfc2xhdmVfIG51bWJlclxuICAgICAtIGIgKG51bWJlcikgc3RhcnQgX21hc3Rlcl8gbnVtYmVyIChzdGFydCB0aW1lIGluIGdlbmVyYWwgY2FzZSlcbiAgICAgLSBCIChudW1iZXIpIGVuZCBfbWFzdGVyXyBudW1iZXIgKGVuZCB0aW1lIGluIGdlcmVhbCBjYXNlKVxuICAgICAtIGdldCAoZnVuY3Rpb24pIGdldHRlciBvZiBfbWFzdGVyXyBudW1iZXIgKHNlZSBAbWluYS50aW1lKVxuICAgICAtIHNldCAoZnVuY3Rpb24pIHNldHRlciBvZiBfc2xhdmVfIG51bWJlclxuICAgICAtIGVhc2luZyAoZnVuY3Rpb24pICNvcHRpb25hbCBlYXNpbmcgZnVuY3Rpb24sIGRlZmF1bHQgaXMgQG1pbmEubGluZWFyXG4gICAgID0gKG9iamVjdCkgYW5pbWF0aW9uIGRlc2NyaXB0b3JcbiAgICAgbyB7XG4gICAgIG8gICAgICAgICBpZCAoc3RyaW5nKSBhbmltYXRpb24gaWQsXG4gICAgIG8gICAgICAgICBzdGFydCAobnVtYmVyKSBzdGFydCBfc2xhdmVfIG51bWJlcixcbiAgICAgbyAgICAgICAgIGVuZCAobnVtYmVyKSBlbmQgX3NsYXZlXyBudW1iZXIsXG4gICAgIG8gICAgICAgICBiIChudW1iZXIpIHN0YXJ0IF9tYXN0ZXJfIG51bWJlcixcbiAgICAgbyAgICAgICAgIHMgKG51bWJlcikgYW5pbWF0aW9uIHN0YXR1cyAoMC4uMSksXG4gICAgIG8gICAgICAgICBkdXIgKG51bWJlcikgYW5pbWF0aW9uIGR1cmF0aW9uLFxuICAgICBvICAgICAgICAgc3BkIChudW1iZXIpIGFuaW1hdGlvbiBzcGVlZCxcbiAgICAgbyAgICAgICAgIGdldCAoZnVuY3Rpb24pIGdldHRlciBvZiBfbWFzdGVyXyBudW1iZXIgKHNlZSBAbWluYS50aW1lKSxcbiAgICAgbyAgICAgICAgIHNldCAoZnVuY3Rpb24pIHNldHRlciBvZiBfc2xhdmVfIG51bWJlcixcbiAgICAgbyAgICAgICAgIGVhc2luZyAoZnVuY3Rpb24pIGVhc2luZyBmdW5jdGlvbiwgZGVmYXVsdCBpcyBAbWluYS5saW5lYXIsXG4gICAgIG8gICAgICAgICBzdGF0dXMgKGZ1bmN0aW9uKSBzdGF0dXMgZ2V0dGVyL3NldHRlcixcbiAgICAgbyAgICAgICAgIHNwZWVkIChmdW5jdGlvbikgc3BlZWQgZ2V0dGVyL3NldHRlcixcbiAgICAgbyAgICAgICAgIGR1cmF0aW9uIChmdW5jdGlvbikgZHVyYXRpb24gZ2V0dGVyL3NldHRlcixcbiAgICAgbyAgICAgICAgIHN0b3AgKGZ1bmN0aW9uKSBhbmltYXRpb24gc3RvcHBlclxuICAgICBvICAgICAgICAgcGF1c2UgKGZ1bmN0aW9uKSBwYXVzZXMgdGhlIGFuaW1hdGlvblxuICAgICBvICAgICAgICAgcmVzdW1lIChmdW5jdGlvbikgcmVzdW1lcyB0aGUgYW5pbWF0aW9uXG4gICAgIG8gICAgICAgICB1cGRhdGUgKGZ1bmN0aW9uKSBjYWxsZXMgc2V0dGVyIHdpdGggdGhlIHJpZ2h0IHZhbHVlIG9mIHRoZSBhbmltYXRpb25cbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIG1pbmEgPSBmdW5jdGlvbiAoYSwgQSwgYiwgQiwgZ2V0LCBzZXQsIGVhc2luZykge1xuICAgICAgICB2YXIgYW5pbSA9IHtcbiAgICAgICAgICAgIGlkOiBJRCgpLFxuICAgICAgICAgICAgc3RhcnQ6IGEsXG4gICAgICAgICAgICBlbmQ6IEEsXG4gICAgICAgICAgICBiOiBiLFxuICAgICAgICAgICAgczogMCxcbiAgICAgICAgICAgIGR1cjogQiAtIGIsXG4gICAgICAgICAgICBzcGQ6IDEsXG4gICAgICAgICAgICBnZXQ6IGdldCxcbiAgICAgICAgICAgIHNldDogc2V0LFxuICAgICAgICAgICAgZWFzaW5nOiBlYXNpbmcgfHwgbWluYS5saW5lYXIsXG4gICAgICAgICAgICBzdGF0dXM6IHN0YSxcbiAgICAgICAgICAgIHNwZWVkOiBzcGVlZCxcbiAgICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvbixcbiAgICAgICAgICAgIHN0b3A6IHN0b3BpdCxcbiAgICAgICAgICAgIHBhdXNlOiBwYXVzZSxcbiAgICAgICAgICAgIHJlc3VtZTogcmVzdW1lLFxuICAgICAgICAgICAgdXBkYXRlOiB1cGRhdGVcbiAgICAgICAgfTtcbiAgICAgICAgYW5pbWF0aW9uc1thbmltLmlkXSA9IGFuaW07XG4gICAgICAgIHZhciBsZW4gPSAwLCBpO1xuICAgICAgICBmb3IgKGkgaW4gYW5pbWF0aW9ucykgaWYgKGFuaW1hdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgIGxlbisrO1xuICAgICAgICAgICAgaWYgKGxlbiA9PSAyKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGVuID09IDEgJiYgcmVxdWVzdEFuaW1GcmFtZShmcmFtZSk7XG4gICAgICAgIHJldHVybiBhbmltO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEudGltZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgY3VycmVudCB0aW1lLiBFcXVpdmFsZW50IHRvOlxuICAgICB8IGZ1bmN0aW9uICgpIHtcbiAgICAgfCAgICAgcmV0dXJuIChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICB8IH1cbiAgICBcXCovXG4gICAgbWluYS50aW1lID0gdGltZXI7XG4gICAgLypcXFxuICAgICAqIG1pbmEuZ2V0QnlJZFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBhbmltYXRpb24gYnkgaXRzIGlkXG4gICAgIC0gaWQgKHN0cmluZykgYW5pbWF0aW9uJ3MgaWRcbiAgICAgPSAob2JqZWN0KSBTZWUgQG1pbmFcbiAgICBcXCovXG4gICAgbWluYS5nZXRCeUlkID0gZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiBhbmltYXRpb25zW2lkXSB8fCBudWxsO1xuICAgIH07XG5cbiAgICAvKlxcXG4gICAgICogbWluYS5saW5lYXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERlZmF1bHQgbGluZWFyIGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEubGluZWFyID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS5lYXNlb3V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFYXNlb3V0IGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEuZWFzZW91dCA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnBvdyhuLCAxLjcpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEuZWFzZWluXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBFYXNlaW4gZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5lYXNlaW4gPSBmdW5jdGlvbiAobikge1xuICAgICAgICByZXR1cm4gTWF0aC5wb3cobiwgLjQ4KTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBtaW5hLmVhc2Vpbm91dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRWFzZWlub3V0IGVhc2luZ1xuICAgICAtIG4gKG51bWJlcikgaW5wdXQgMC4uMVxuICAgICA9IChudW1iZXIpIG91dHB1dCAwLi4xXG4gICAgXFwqL1xuICAgIG1pbmEuZWFzZWlub3V0ID0gZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgaWYgKG4gPT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG4gPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHEgPSAuNDggLSBuIC8gMS4wNCxcbiAgICAgICAgICAgIFEgPSBNYXRoLnNxcnQoLjE3MzQgKyBxICogcSksXG4gICAgICAgICAgICB4ID0gUSAtIHEsXG4gICAgICAgICAgICBYID0gTWF0aC5wb3coTWF0aC5hYnMoeCksIDEgLyAzKSAqICh4IDwgMCA/IC0xIDogMSksXG4gICAgICAgICAgICB5ID0gLVEgLSBxLFxuICAgICAgICAgICAgWSA9IE1hdGgucG93KE1hdGguYWJzKHkpLCAxIC8gMykgKiAoeSA8IDAgPyAtMSA6IDEpLFxuICAgICAgICAgICAgdCA9IFggKyBZICsgLjU7XG4gICAgICAgIHJldHVybiAoMSAtIHQpICogMyAqIHQgKiB0ICsgdCAqIHQgKiB0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEuYmFja2luXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBCYWNraW4gZWFzaW5nXG4gICAgIC0gbiAobnVtYmVyKSBpbnB1dCAwLi4xXG4gICAgID0gKG51bWJlcikgb3V0cHV0IDAuLjFcbiAgICBcXCovXG4gICAgbWluYS5iYWNraW4gPSBmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAobiA9PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcyA9IDEuNzAxNTg7XG4gICAgICAgIHJldHVybiBuICogbiAqICgocyArIDEpICogbiAtIHMpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEuYmFja291dFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQmFja291dCBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmJhY2tvdXQgPSBmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAobiA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICBuID0gbiAtIDE7XG4gICAgICAgIHZhciBzID0gMS43MDE1ODtcbiAgICAgICAgcmV0dXJuIG4gKiBuICogKChzICsgMSkgKiBuICsgcykgKyAxO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIG1pbmEuZWxhc3RpY1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRWxhc3RpYyBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmVsYXN0aWMgPSBmdW5jdGlvbiAobikge1xuICAgICAgICBpZiAobiA9PSAhIW4pIHtcbiAgICAgICAgICAgIHJldHVybiBuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBNYXRoLnBvdygyLCAtMTAgKiBuKSAqIE1hdGguc2luKChuIC0gLjA3NSkgKlxuICAgICAgICAgICAgKDIgKiBNYXRoLlBJKSAvIC4zKSArIDE7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogbWluYS5ib3VuY2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEJvdW5jZSBlYXNpbmdcbiAgICAgLSBuIChudW1iZXIpIGlucHV0IDAuLjFcbiAgICAgPSAobnVtYmVyKSBvdXRwdXQgMC4uMVxuICAgIFxcKi9cbiAgICBtaW5hLmJvdW5jZSA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHZhciBzID0gNy41NjI1LFxuICAgICAgICAgICAgcCA9IDIuNzUsXG4gICAgICAgICAgICBsO1xuICAgICAgICBpZiAobiA8ICgxIC8gcCkpIHtcbiAgICAgICAgICAgIGwgPSBzICogbiAqIG47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobiA8ICgyIC8gcCkpIHtcbiAgICAgICAgICAgICAgICBuIC09ICgxLjUgLyBwKTtcbiAgICAgICAgICAgICAgICBsID0gcyAqIG4gKiBuICsgLjc1O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobiA8ICgyLjUgLyBwKSkge1xuICAgICAgICAgICAgICAgICAgICBuIC09ICgyLjI1IC8gcCk7XG4gICAgICAgICAgICAgICAgICAgIGwgPSBzICogbiAqIG4gKyAuOTM3NTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuIC09ICgyLjYyNSAvIHApO1xuICAgICAgICAgICAgICAgICAgICBsID0gcyAqIG4gKiBuICsgLjk4NDM3NTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGw7XG4gICAgfTtcbiAgICB3aW5kb3cubWluYSA9IG1pbmE7XG4gICAgcmV0dXJuIG1pbmE7XG59KSh0eXBlb2YgZXZlID09IFwidW5kZWZpbmVkXCIgPyBmdW5jdGlvbiAoKSB7fSA6IGV2ZSk7XG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgLSAyMDE1IEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG52YXIgU25hcCA9IChmdW5jdGlvbihyb290KSB7XG5TbmFwLnZlcnNpb24gPSBcIjAuNC4wXCI7XG4vKlxcXG4gKiBTbmFwXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDcmVhdGVzIGEgZHJhd2luZyBzdXJmYWNlIG9yIHdyYXBzIGV4aXN0aW5nIFNWRyBlbGVtZW50LlxuICoqXG4gLSB3aWR0aCAobnVtYmVyfHN0cmluZykgd2lkdGggb2Ygc3VyZmFjZVxuIC0gaGVpZ2h0IChudW1iZXJ8c3RyaW5nKSBoZWlnaHQgb2Ygc3VyZmFjZVxuICogb3JcbiAtIERPTSAoU1ZHRWxlbWVudCkgZWxlbWVudCB0byBiZSB3cmFwcGVkIGludG8gU25hcCBzdHJ1Y3R1cmVcbiAqIG9yXG4gLSBhcnJheSAoYXJyYXkpIGFycmF5IG9mIGVsZW1lbnRzICh3aWxsIHJldHVybiBzZXQgb2YgZWxlbWVudHMpXG4gKiBvclxuIC0gcXVlcnkgKHN0cmluZykgQ1NTIHF1ZXJ5IHNlbGVjdG9yXG4gPSAob2JqZWN0KSBARWxlbWVudFxuXFwqL1xuZnVuY3Rpb24gU25hcCh3LCBoKSB7XG4gICAgaWYgKHcpIHtcbiAgICAgICAgaWYgKHcubm9kZVR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiB3cmFwKHcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpcyh3LCBcImFycmF5XCIpICYmIFNuYXAuc2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gU25hcC5zZXQuYXBwbHkoU25hcCwgdyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHcgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdztcbiAgICAgICAgfVxuICAgICAgICBpZiAoaCA9PSBudWxsKSB7XG4gICAgICAgICAgICB3ID0gZ2xvYi5kb2MucXVlcnlTZWxlY3RvcihTdHJpbmcodykpO1xuICAgICAgICAgICAgcmV0dXJuIHdyYXAodyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdyA9IHcgPT0gbnVsbCA/IFwiMTAwJVwiIDogdztcbiAgICBoID0gaCA9PSBudWxsID8gXCIxMDAlXCIgOiBoO1xuICAgIHJldHVybiBuZXcgUGFwZXIodywgaCk7XG59XG5TbmFwLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcIlNuYXAgdlwiICsgdGhpcy52ZXJzaW9uO1xufTtcblNuYXAuXyA9IHt9O1xudmFyIGdsb2IgPSB7XG4gICAgd2luOiByb290LndpbmRvdyxcbiAgICBkb2M6IHJvb3Qud2luZG93LmRvY3VtZW50XG59O1xuU25hcC5fLmdsb2IgPSBnbG9iO1xudmFyIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICBTdHIgPSBTdHJpbmcsXG4gICAgdG9GbG9hdCA9IHBhcnNlRmxvYXQsXG4gICAgdG9JbnQgPSBwYXJzZUludCxcbiAgICBtYXRoID0gTWF0aCxcbiAgICBtbWF4ID0gbWF0aC5tYXgsXG4gICAgbW1pbiA9IG1hdGgubWluLFxuICAgIGFicyA9IG1hdGguYWJzLFxuICAgIHBvdyA9IG1hdGgucG93LFxuICAgIFBJID0gbWF0aC5QSSxcbiAgICByb3VuZCA9IG1hdGgucm91bmQsXG4gICAgRSA9IFwiXCIsXG4gICAgUyA9IFwiIFwiLFxuICAgIG9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICBJU1VSTCA9IC9edXJsXFwoWydcIl0/KFteXFwpXSs/KVsnXCJdP1xcKSQvaSxcbiAgICBjb2xvdXJSZWdFeHAgPSAvXlxccyooKCNbYS1mXFxkXXs2fSl8KCNbYS1mXFxkXXszfSl8cmdiYT9cXChcXHMqKFtcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rJT9cXHMqLFxccypbXFxkXFwuXSslPyg/OlxccyosXFxzKltcXGRcXC5dKyU/KT8pXFxzKlxcKXxoc2JhP1xcKFxccyooW1xcZFxcLl0rKD86ZGVnfFxceGIwfCUpP1xccyosXFxzKltcXGRcXC5dKyU/XFxzKixcXHMqW1xcZFxcLl0rKD86JT9cXHMqLFxccypbXFxkXFwuXSspPyU/KVxccypcXCl8aHNsYT9cXChcXHMqKFtcXGRcXC5dKyg/OmRlZ3xcXHhiMHwlKT9cXHMqLFxccypbXFxkXFwuXSslP1xccyosXFxzKltcXGRcXC5dKyg/OiU/XFxzKixcXHMqW1xcZFxcLl0rKT8lPylcXHMqXFwpKVxccyokL2ksXG4gICAgYmV6aWVycmcgPSAvXig/OmN1YmljLSk/YmV6aWVyXFwoKFteLF0rKSwoW14sXSspLChbXixdKyksKFteXFwpXSspXFwpLyxcbiAgICByZVVSTFZhbHVlID0gL151cmxcXCgjPyhbXildKylcXCkkLyxcbiAgICBzZXBhcmF0b3IgPSBTbmFwLl8uc2VwYXJhdG9yID0gL1ssXFxzXSsvLFxuICAgIHdoaXRlc3BhY2UgPSAvW1xcc10vZyxcbiAgICBjb21tYVNwYWNlcyA9IC9bXFxzXSosW1xcc10qLyxcbiAgICBoc3JnID0ge2hzOiAxLCByZzogMX0sXG4gICAgcGF0aENvbW1hbmQgPSAvKFthLXpdKVtcXHMsXSooKC0/XFxkKlxcLj9cXGQqKD86ZVtcXC0rXT9cXGQrKT9bXFxzXSosP1tcXHNdKikrKS9pZyxcbiAgICB0Q29tbWFuZCA9IC8oW3JzdG1dKVtcXHMsXSooKC0/XFxkKlxcLj9cXGQqKD86ZVtcXC0rXT9cXGQrKT9bXFxzXSosP1tcXHNdKikrKS9pZyxcbiAgICBwYXRoVmFsdWVzID0gLygtP1xcZCpcXC4/XFxkKig/OmVbXFwtK10/XFxcXGQrKT8pW1xcc10qLD9bXFxzXSovaWcsXG4gICAgaWRnZW4gPSAwLFxuICAgIGlkcHJlZml4ID0gXCJTXCIgKyAoK25ldyBEYXRlKS50b1N0cmluZygzNiksXG4gICAgSUQgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgcmV0dXJuIChlbCAmJiBlbC50eXBlID8gZWwudHlwZSA6IEUpICsgaWRwcmVmaXggKyAoaWRnZW4rKykudG9TdHJpbmcoMzYpO1xuICAgIH0sXG4gICAgeGxpbmsgPSBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIixcbiAgICB4bWxucyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcbiAgICBodWIgPSB7fSxcbiAgICBVUkwgPSBTbmFwLnVybCA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgcmV0dXJuIFwidXJsKCcjXCIgKyB1cmwgKyBcIicpXCI7XG4gICAgfTtcblxuZnVuY3Rpb24gJChlbCwgYXR0cikge1xuICAgIGlmIChhdHRyKSB7XG4gICAgICAgIGlmIChlbCA9PSBcIiN0ZXh0XCIpIHtcbiAgICAgICAgICAgIGVsID0gZ2xvYi5kb2MuY3JlYXRlVGV4dE5vZGUoYXR0ci50ZXh0IHx8IGF0dHJbXCIjdGV4dFwiXSB8fCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWwgPT0gXCIjY29tbWVudFwiKSB7XG4gICAgICAgICAgICBlbCA9IGdsb2IuZG9jLmNyZWF0ZUNvbW1lbnQoYXR0ci50ZXh0IHx8IGF0dHJbXCIjdGV4dFwiXSB8fCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGVsID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGVsID0gJChlbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmIChlbC5ub2RlVHlwZSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKGF0dHIuc3Vic3RyaW5nKDAsIDYpID09IFwieGxpbms6XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldEF0dHJpYnV0ZU5TKHhsaW5rLCBhdHRyLnN1YnN0cmluZyg2KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhdHRyLnN1YnN0cmluZygwLCA0KSA9PSBcInhtbDpcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0QXR0cmlidXRlTlMoeG1sbnMsIGF0dHIuc3Vic3RyaW5nKDQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsLmdldEF0dHJpYnV0ZShhdHRyKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoYXR0ciA9PSBcInRleHRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbC5ub2RlVmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlbC5ub2RlVHlwZSA9PSAxKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cikgaWYgKGF0dHJbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IFN0cihhdHRyW2tleV0pO1xuICAgICAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleS5zdWJzdHJpbmcoMCwgNikgPT0gXCJ4bGluazpcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMoeGxpbmssIGtleS5zdWJzdHJpbmcoNiksIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5LnN1YnN0cmluZygwLCA0KSA9PSBcInhtbDpcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwuc2V0QXR0cmlidXRlTlMoeG1sbnMsIGtleS5zdWJzdHJpbmcoNCksIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKFwidGV4dFwiIGluIGF0dHIpIHtcbiAgICAgICAgICAgIGVsLm5vZGVWYWx1ZSA9IGF0dHIudGV4dDtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGVsID0gZ2xvYi5kb2MuY3JlYXRlRWxlbWVudE5TKHhtbG5zLCBlbCk7XG4gICAgfVxuICAgIHJldHVybiBlbDtcbn1cblNuYXAuXy4kID0gJDtcblNuYXAuXy5pZCA9IElEO1xuZnVuY3Rpb24gZ2V0QXR0cnMoZWwpIHtcbiAgICB2YXIgYXR0cnMgPSBlbC5hdHRyaWJ1dGVzLFxuICAgICAgICBuYW1lLFxuICAgICAgICBvdXQgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhdHRyc1tpXS5uYW1lc3BhY2VVUkkgPT0geGxpbmspIHtcbiAgICAgICAgICAgIG5hbWUgPSBcInhsaW5rOlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbmFtZSA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgbmFtZSArPSBhdHRyc1tpXS5uYW1lO1xuICAgICAgICBvdXRbbmFtZV0gPSBhdHRyc1tpXS50ZXh0Q29udGVudDtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn1cbmZ1bmN0aW9uIGlzKG8sIHR5cGUpIHtcbiAgICB0eXBlID0gU3RyLnByb3RvdHlwZS50b0xvd2VyQ2FzZS5jYWxsKHR5cGUpO1xuICAgIGlmICh0eXBlID09IFwiZmluaXRlXCIpIHtcbiAgICAgICAgcmV0dXJuIGlzRmluaXRlKG8pO1xuICAgIH1cbiAgICBpZiAodHlwZSA9PSBcImFycmF5XCIgJiZcbiAgICAgICAgKG8gaW5zdGFuY2VvZiBBcnJheSB8fCBBcnJheS5pc0FycmF5ICYmIEFycmF5LmlzQXJyYXkobykpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gICh0eXBlID09IFwibnVsbFwiICYmIG8gPT09IG51bGwpIHx8XG4gICAgICAgICAgICAodHlwZSA9PSB0eXBlb2YgbyAmJiBvICE9PSBudWxsKSB8fFxuICAgICAgICAgICAgKHR5cGUgPT0gXCJvYmplY3RcIiAmJiBvID09PSBPYmplY3QobykpIHx8XG4gICAgICAgICAgICBvYmplY3RUb1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKS50b0xvd2VyQ2FzZSgpID09IHR5cGU7XG59XG4vKlxcXG4gKiBTbmFwLmZvcm1hdFxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmVwbGFjZXMgY29uc3RydWN0aW9uIG9mIHR5cGUgYHs8bmFtZT59YCB0byB0aGUgY29ycmVzcG9uZGluZyBhcmd1bWVudFxuICoqXG4gLSB0b2tlbiAoc3RyaW5nKSBzdHJpbmcgdG8gZm9ybWF0XG4gLSBqc29uIChvYmplY3QpIG9iamVjdCB3aGljaCBwcm9wZXJ0aWVzIGFyZSB1c2VkIGFzIGEgcmVwbGFjZW1lbnRcbiA9IChzdHJpbmcpIGZvcm1hdHRlZCBzdHJpbmdcbiA+IFVzYWdlXG4gfCAvLyB0aGlzIGRyYXdzIGEgcmVjdGFuZ3VsYXIgc2hhcGUgZXF1aXZhbGVudCB0byBcIk0xMCwyMGg0MHY1MGgtNDB6XCJcbiB8IHBhcGVyLnBhdGgoU25hcC5mb3JtYXQoXCJNe3h9LHt5fWh7ZGltLndpZHRofXZ7ZGltLmhlaWdodH1oe2RpbVsnbmVnYXRpdmUgd2lkdGgnXX16XCIsIHtcbiB8ICAgICB4OiAxMCxcbiB8ICAgICB5OiAyMCxcbiB8ICAgICBkaW06IHtcbiB8ICAgICAgICAgd2lkdGg6IDQwLFxuIHwgICAgICAgICBoZWlnaHQ6IDUwLFxuIHwgICAgICAgICBcIm5lZ2F0aXZlIHdpZHRoXCI6IC00MFxuIHwgICAgIH1cbiB8IH0pKTtcblxcKi9cblNuYXAuZm9ybWF0ID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdG9rZW5SZWdleCA9IC9cXHsoW15cXH1dKylcXH0vZyxcbiAgICAgICAgb2JqTm90YXRpb25SZWdleCA9IC8oPzooPzpefFxcLikoLis/KSg/PVxcW3xcXC58JHxcXCgpfFxcWygnfFwiKSguKz8pXFwyXFxdKShcXChcXCkpPy9nLCAvLyBtYXRjaGVzIC54eHh4eCBvciBbXCJ4eHh4eFwiXSB0byBydW4gb3ZlciBvYmplY3QgcHJvcGVydGllc1xuICAgICAgICByZXBsYWNlciA9IGZ1bmN0aW9uIChhbGwsIGtleSwgb2JqKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gb2JqO1xuICAgICAgICAgICAga2V5LnJlcGxhY2Uob2JqTm90YXRpb25SZWdleCwgZnVuY3Rpb24gKGFsbCwgbmFtZSwgcXVvdGUsIHF1b3RlZE5hbWUsIGlzRnVuYykge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lIHx8IHF1b3RlZE5hbWU7XG4gICAgICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZSBpbiByZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IHJlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0eXBlb2YgcmVzID09IFwiZnVuY3Rpb25cIiAmJiBpc0Z1bmMgJiYgKHJlcyA9IHJlcygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlcyA9IChyZXMgPT0gbnVsbCB8fCByZXMgPT0gb2JqID8gYWxsIDogcmVzKSArIFwiXCI7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiAoc3RyLCBvYmopIHtcbiAgICAgICAgcmV0dXJuIFN0cihzdHIpLnJlcGxhY2UodG9rZW5SZWdleCwgZnVuY3Rpb24gKGFsbCwga2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gcmVwbGFjZXIoYWxsLCBrZXksIG9iaik7XG4gICAgICAgIH0pO1xuICAgIH07XG59KSgpO1xuZnVuY3Rpb24gY2xvbmUob2JqKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogPT0gXCJmdW5jdGlvblwiIHx8IE9iamVjdChvYmopICE9PSBvYmopIHtcbiAgICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gICAgdmFyIHJlcyA9IG5ldyBvYmouY29uc3RydWN0b3I7XG4gICAgZm9yICh2YXIga2V5IGluIG9iaikgaWYgKG9ialtoYXNdKGtleSkpIHtcbiAgICAgICAgcmVzW2tleV0gPSBjbG9uZShvYmpba2V5XSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5TbmFwLl8uY2xvbmUgPSBjbG9uZTtcbmZ1bmN0aW9uIHJlcHVzaChhcnJheSwgaXRlbSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFycmF5Lmxlbmd0aDsgaSA8IGlpOyBpKyspIGlmIChhcnJheVtpXSA9PT0gaXRlbSkge1xuICAgICAgICByZXR1cm4gYXJyYXkucHVzaChhcnJheS5zcGxpY2UoaSwgMSlbMF0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNhY2hlcihmLCBzY29wZSwgcG9zdHByb2Nlc3Nvcikge1xuICAgIGZ1bmN0aW9uIG5ld2YoKSB7XG4gICAgICAgIHZhciBhcmcgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApLFxuICAgICAgICAgICAgYXJncyA9IGFyZy5qb2luKFwiXFx1MjQwMFwiKSxcbiAgICAgICAgICAgIGNhY2hlID0gbmV3Zi5jYWNoZSA9IG5ld2YuY2FjaGUgfHwge30sXG4gICAgICAgICAgICBjb3VudCA9IG5ld2YuY291bnQgPSBuZXdmLmNvdW50IHx8IFtdO1xuICAgICAgICBpZiAoY2FjaGVbaGFzXShhcmdzKSkge1xuICAgICAgICAgICAgcmVwdXNoKGNvdW50LCBhcmdzKTtcbiAgICAgICAgICAgIHJldHVybiBwb3N0cHJvY2Vzc29yID8gcG9zdHByb2Nlc3NvcihjYWNoZVthcmdzXSkgOiBjYWNoZVthcmdzXTtcbiAgICAgICAgfVxuICAgICAgICBjb3VudC5sZW5ndGggPj0gMWUzICYmIGRlbGV0ZSBjYWNoZVtjb3VudC5zaGlmdCgpXTtcbiAgICAgICAgY291bnQucHVzaChhcmdzKTtcbiAgICAgICAgY2FjaGVbYXJnc10gPSBmLmFwcGx5KHNjb3BlLCBhcmcpO1xuICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3NvciA/IHBvc3Rwcm9jZXNzb3IoY2FjaGVbYXJnc10pIDogY2FjaGVbYXJnc107XG4gICAgfVxuICAgIHJldHVybiBuZXdmO1xufVxuU25hcC5fLmNhY2hlciA9IGNhY2hlcjtcbmZ1bmN0aW9uIGFuZ2xlKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMpIHtcbiAgICBpZiAoeDMgPT0gbnVsbCkge1xuICAgICAgICB2YXIgeCA9IHgxIC0geDIsXG4gICAgICAgICAgICB5ID0geTEgLSB5MjtcbiAgICAgICAgaWYgKCF4ICYmICF5KSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKDE4MCArIG1hdGguYXRhbjIoLXksIC14KSAqIDE4MCAvIFBJICsgMzYwKSAlIDM2MDtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gYW5nbGUoeDEsIHkxLCB4MywgeTMpIC0gYW5nbGUoeDIsIHkyLCB4MywgeTMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJhZChkZWcpIHtcbiAgICByZXR1cm4gZGVnICUgMzYwICogUEkgLyAxODA7XG59XG5mdW5jdGlvbiBkZWcocmFkKSB7XG4gICAgcmV0dXJuIHJhZCAqIDE4MCAvIFBJICUgMzYwO1xufVxuZnVuY3Rpb24geF95KCkge1xuICAgIHJldHVybiB0aGlzLnggKyBTICsgdGhpcy55O1xufVxuZnVuY3Rpb24geF95X3dfaCgpIHtcbiAgICByZXR1cm4gdGhpcy54ICsgUyArIHRoaXMueSArIFMgKyB0aGlzLndpZHRoICsgXCIgXFx4ZDcgXCIgKyB0aGlzLmhlaWdodDtcbn1cblxuLypcXFxuICogU25hcC5yYWRcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFRyYW5zZm9ybSBhbmdsZSB0byByYWRpYW5zXG4gLSBkZWcgKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuID0gKG51bWJlcikgYW5nbGUgaW4gcmFkaWFuc1xuXFwqL1xuU25hcC5yYWQgPSByYWQ7XG4vKlxcXG4gKiBTbmFwLmRlZ1xuIFsgbWV0aG9kIF1cbiAqKlxuICogVHJhbnNmb3JtIGFuZ2xlIHRvIGRlZ3JlZXNcbiAtIHJhZCAobnVtYmVyKSBhbmdsZSBpbiByYWRpYW5zXG4gPSAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG5cXCovXG5TbmFwLmRlZyA9IGRlZztcbi8qXFxcbiAqIFNuYXAuc2luXG4gWyBtZXRob2QgXVxuICoqXG4gKiBFcXVpdmFsZW50IHRvIGBNYXRoLnNpbigpYCBvbmx5IHdvcmtzIHdpdGggZGVncmVlcywgbm90IHJhZGlhbnMuXG4gLSBhbmdsZSAobnVtYmVyKSBhbmdsZSBpbiBkZWdyZWVzXG4gPSAobnVtYmVyKSBzaW5cblxcKi9cblNuYXAuc2luID0gZnVuY3Rpb24gKGFuZ2xlKSB7XG4gICAgcmV0dXJuIG1hdGguc2luKFNuYXAucmFkKGFuZ2xlKSk7XG59O1xuLypcXFxuICogU25hcC50YW5cbiBbIG1ldGhvZCBdXG4gKipcbiAqIEVxdWl2YWxlbnQgdG8gYE1hdGgudGFuKClgIG9ubHkgd29ya3Mgd2l0aCBkZWdyZWVzLCBub3QgcmFkaWFucy5cbiAtIGFuZ2xlIChudW1iZXIpIGFuZ2xlIGluIGRlZ3JlZXNcbiA9IChudW1iZXIpIHRhblxuXFwqL1xuU25hcC50YW4gPSBmdW5jdGlvbiAoYW5nbGUpIHtcbiAgICByZXR1cm4gbWF0aC50YW4oU25hcC5yYWQoYW5nbGUpKTtcbn07XG4vKlxcXG4gKiBTbmFwLmNvc1xuIFsgbWV0aG9kIF1cbiAqKlxuICogRXF1aXZhbGVudCB0byBgTWF0aC5jb3MoKWAgb25seSB3b3JrcyB3aXRoIGRlZ3JlZXMsIG5vdCByYWRpYW5zLlxuIC0gYW5nbGUgKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuID0gKG51bWJlcikgY29zXG5cXCovXG5TbmFwLmNvcyA9IGZ1bmN0aW9uIChhbmdsZSkge1xuICAgIHJldHVybiBtYXRoLmNvcyhTbmFwLnJhZChhbmdsZSkpO1xufTtcbi8qXFxcbiAqIFNuYXAuYXNpblxuIFsgbWV0aG9kIF1cbiAqKlxuICogRXF1aXZhbGVudCB0byBgTWF0aC5hc2luKClgIG9ubHkgd29ya3Mgd2l0aCBkZWdyZWVzLCBub3QgcmFkaWFucy5cbiAtIG51bSAobnVtYmVyKSB2YWx1ZVxuID0gKG51bWJlcikgYXNpbiBpbiBkZWdyZWVzXG5cXCovXG5TbmFwLmFzaW4gPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgcmV0dXJuIFNuYXAuZGVnKG1hdGguYXNpbihudW0pKTtcbn07XG4vKlxcXG4gKiBTbmFwLmFjb3NcbiBbIG1ldGhvZCBdXG4gKipcbiAqIEVxdWl2YWxlbnQgdG8gYE1hdGguYWNvcygpYCBvbmx5IHdvcmtzIHdpdGggZGVncmVlcywgbm90IHJhZGlhbnMuXG4gLSBudW0gKG51bWJlcikgdmFsdWVcbiA9IChudW1iZXIpIGFjb3MgaW4gZGVncmVlc1xuXFwqL1xuU25hcC5hY29zID0gZnVuY3Rpb24gKG51bSkge1xuICAgIHJldHVybiBTbmFwLmRlZyhtYXRoLmFjb3MobnVtKSk7XG59O1xuLypcXFxuICogU25hcC5hdGFuXG4gWyBtZXRob2QgXVxuICoqXG4gKiBFcXVpdmFsZW50IHRvIGBNYXRoLmF0YW4oKWAgb25seSB3b3JrcyB3aXRoIGRlZ3JlZXMsIG5vdCByYWRpYW5zLlxuIC0gbnVtIChudW1iZXIpIHZhbHVlXG4gPSAobnVtYmVyKSBhdGFuIGluIGRlZ3JlZXNcblxcKi9cblNuYXAuYXRhbiA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICByZXR1cm4gU25hcC5kZWcobWF0aC5hdGFuKG51bSkpO1xufTtcbi8qXFxcbiAqIFNuYXAuYXRhbjJcbiBbIG1ldGhvZCBdXG4gKipcbiAqIEVxdWl2YWxlbnQgdG8gYE1hdGguYXRhbjIoKWAgb25seSB3b3JrcyB3aXRoIGRlZ3JlZXMsIG5vdCByYWRpYW5zLlxuIC0gbnVtIChudW1iZXIpIHZhbHVlXG4gPSAobnVtYmVyKSBhdGFuMiBpbiBkZWdyZWVzXG5cXCovXG5TbmFwLmF0YW4yID0gZnVuY3Rpb24gKG51bSkge1xuICAgIHJldHVybiBTbmFwLmRlZyhtYXRoLmF0YW4yKG51bSkpO1xufTtcbi8qXFxcbiAqIFNuYXAuYW5nbGVcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJldHVybnMgYW4gYW5nbGUgYmV0d2VlbiB0d28gb3IgdGhyZWUgcG9pbnRzXG4gPiBQYXJhbWV0ZXJzXG4gLSB4MSAobnVtYmVyKSB4IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gLSB5MSAobnVtYmVyKSB5IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gLSB4MiAobnVtYmVyKSB4IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuIC0geTIgKG51bWJlcikgeSBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiAtIHgzIChudW1iZXIpICNvcHRpb25hbCB4IGNvb3JkIG9mIHRoaXJkIHBvaW50XG4gLSB5MyAobnVtYmVyKSAjb3B0aW9uYWwgeSBjb29yZCBvZiB0aGlyZCBwb2ludFxuID0gKG51bWJlcikgYW5nbGUgaW4gZGVncmVlc1xuXFwqL1xuU25hcC5hbmdsZSA9IGFuZ2xlO1xuLypcXFxuICogU25hcC5sZW5cbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJldHVybnMgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gPiBQYXJhbWV0ZXJzXG4gLSB4MSAobnVtYmVyKSB4IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gLSB5MSAobnVtYmVyKSB5IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gLSB4MiAobnVtYmVyKSB4IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuIC0geTIgKG51bWJlcikgeSBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiA9IChudW1iZXIpIGRpc3RhbmNlXG5cXCovXG5TbmFwLmxlbiA9IGZ1bmN0aW9uICh4MSwgeTEsIHgyLCB5Mikge1xuICAgIHJldHVybiBNYXRoLnNxcnQoU25hcC5sZW4yKHgxLCB5MSwgeDIsIHkyKSk7XG59O1xuLypcXFxuICogU25hcC5sZW4yXG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIHNxdWFyZWQgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gPiBQYXJhbWV0ZXJzXG4gLSB4MSAobnVtYmVyKSB4IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gLSB5MSAobnVtYmVyKSB5IGNvb3JkIG9mIGZpcnN0IHBvaW50XG4gLSB4MiAobnVtYmVyKSB4IGNvb3JkIG9mIHNlY29uZCBwb2ludFxuIC0geTIgKG51bWJlcikgeSBjb29yZCBvZiBzZWNvbmQgcG9pbnRcbiA9IChudW1iZXIpIGRpc3RhbmNlXG5cXCovXG5TbmFwLmxlbjIgPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICByZXR1cm4gKHgxIC0geDIpICogKHgxIC0geDIpICsgKHkxIC0geTIpICogKHkxIC0geTIpO1xufTtcbi8qXFxcbiAqIFNuYXAuY2xvc2VzdFBvaW50XG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIGNsb3Nlc3QgcG9pbnQgdG8gYSBnaXZlbiBvbmUgb24gYSBnaXZlbiBwYXRoLlxuID4gUGFyYW1ldGVyc1xuIC0gcGF0aCAoRWxlbWVudCkgcGF0aCBlbGVtZW50XG4gLSB4IChudW1iZXIpIHggY29vcmQgb2YgYSBwb2ludFxuIC0geSAobnVtYmVyKSB5IGNvb3JkIG9mIGEgcG9pbnRcbiA9IChvYmplY3QpIGluIGZvcm1hdFxuIHtcbiAgICB4IChudW1iZXIpIHggY29vcmQgb2YgdGhlIHBvaW50IG9uIHRoZSBwYXRoXG4gICAgeSAobnVtYmVyKSB5IGNvb3JkIG9mIHRoZSBwb2ludCBvbiB0aGUgcGF0aFxuICAgIGxlbmd0aCAobnVtYmVyKSBsZW5ndGggb2YgdGhlIHBhdGggdG8gdGhlIHBvaW50XG4gICAgZGlzdGFuY2UgKG51bWJlcikgZGlzdGFuY2UgZnJvbSB0aGUgZ2l2ZW4gcG9pbnQgdG8gdGhlIHBhdGhcbiB9XG5cXCovXG4vLyBDb3BpZWQgZnJvbSBodHRwOi8vYmwub2Nrcy5vcmcvbWJvc3RvY2svODAyNzYzN1xuU25hcC5jbG9zZXN0UG9pbnQgPSBmdW5jdGlvbiAocGF0aCwgeCwgeSkge1xuICAgIGZ1bmN0aW9uIGRpc3RhbmNlMihwKSB7XG4gICAgICAgIHZhciBkeCA9IHAueCAtIHgsXG4gICAgICAgICAgICBkeSA9IHAueSAtIHk7XG4gICAgICAgIHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeTtcbiAgICB9XG4gICAgdmFyIHBhdGhOb2RlID0gcGF0aC5ub2RlLFxuICAgICAgICBwYXRoTGVuZ3RoID0gcGF0aE5vZGUuZ2V0VG90YWxMZW5ndGgoKSxcbiAgICAgICAgcHJlY2lzaW9uID0gcGF0aExlbmd0aCAvIHBhdGhOb2RlLnBhdGhTZWdMaXN0Lm51bWJlck9mSXRlbXMgKiAuMTI1LFxuICAgICAgICBiZXN0LFxuICAgICAgICBiZXN0TGVuZ3RoLFxuICAgICAgICBiZXN0RGlzdGFuY2UgPSBJbmZpbml0eTtcblxuICAgIC8vIGxpbmVhciBzY2FuIGZvciBjb2Fyc2UgYXBwcm94aW1hdGlvblxuICAgIGZvciAodmFyIHNjYW4sIHNjYW5MZW5ndGggPSAwLCBzY2FuRGlzdGFuY2U7IHNjYW5MZW5ndGggPD0gcGF0aExlbmd0aDsgc2Nhbkxlbmd0aCArPSBwcmVjaXNpb24pIHtcbiAgICAgICAgaWYgKChzY2FuRGlzdGFuY2UgPSBkaXN0YW5jZTIoc2NhbiA9IHBhdGhOb2RlLmdldFBvaW50QXRMZW5ndGgoc2Nhbkxlbmd0aCkpKSA8IGJlc3REaXN0YW5jZSkge1xuICAgICAgICAgICAgYmVzdCA9IHNjYW4sIGJlc3RMZW5ndGggPSBzY2FuTGVuZ3RoLCBiZXN0RGlzdGFuY2UgPSBzY2FuRGlzdGFuY2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBiaW5hcnkgc2VhcmNoIGZvciBwcmVjaXNlIGVzdGltYXRlXG4gICAgcHJlY2lzaW9uICo9IC41O1xuICAgIHdoaWxlIChwcmVjaXNpb24gPiAuNSkge1xuICAgICAgICB2YXIgYmVmb3JlLFxuICAgICAgICAgICAgYWZ0ZXIsXG4gICAgICAgICAgICBiZWZvcmVMZW5ndGgsXG4gICAgICAgICAgICBhZnRlckxlbmd0aCxcbiAgICAgICAgICAgIGJlZm9yZURpc3RhbmNlLFxuICAgICAgICAgICAgYWZ0ZXJEaXN0YW5jZTtcbiAgICAgICAgaWYgKChiZWZvcmVMZW5ndGggPSBiZXN0TGVuZ3RoIC0gcHJlY2lzaW9uKSA+PSAwICYmIChiZWZvcmVEaXN0YW5jZSA9IGRpc3RhbmNlMihiZWZvcmUgPSBwYXRoTm9kZS5nZXRQb2ludEF0TGVuZ3RoKGJlZm9yZUxlbmd0aCkpKSA8IGJlc3REaXN0YW5jZSkge1xuICAgICAgICAgICAgYmVzdCA9IGJlZm9yZSwgYmVzdExlbmd0aCA9IGJlZm9yZUxlbmd0aCwgYmVzdERpc3RhbmNlID0gYmVmb3JlRGlzdGFuY2U7XG4gICAgICAgIH0gZWxzZSBpZiAoKGFmdGVyTGVuZ3RoID0gYmVzdExlbmd0aCArIHByZWNpc2lvbikgPD0gcGF0aExlbmd0aCAmJiAoYWZ0ZXJEaXN0YW5jZSA9IGRpc3RhbmNlMihhZnRlciA9IHBhdGhOb2RlLmdldFBvaW50QXRMZW5ndGgoYWZ0ZXJMZW5ndGgpKSkgPCBiZXN0RGlzdGFuY2UpIHtcbiAgICAgICAgICAgIGJlc3QgPSBhZnRlciwgYmVzdExlbmd0aCA9IGFmdGVyTGVuZ3RoLCBiZXN0RGlzdGFuY2UgPSBhZnRlckRpc3RhbmNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJlY2lzaW9uICo9IC41O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgYmVzdCA9IHtcbiAgICAgICAgeDogYmVzdC54LFxuICAgICAgICB5OiBiZXN0LnksXG4gICAgICAgIGxlbmd0aDogYmVzdExlbmd0aCxcbiAgICAgICAgZGlzdGFuY2U6IE1hdGguc3FydChiZXN0RGlzdGFuY2UpXG4gICAgfTtcbiAgICByZXR1cm4gYmVzdDtcbn1cbi8qXFxcbiAqIFNuYXAuaXNcbiBbIG1ldGhvZCBdXG4gKipcbiAqIEhhbmR5IHJlcGxhY2VtZW50IGZvciB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAtIG8gKOKApikgYW55IG9iamVjdCBvciBwcmltaXRpdmVcbiAtIHR5cGUgKHN0cmluZykgbmFtZSBvZiB0aGUgdHlwZSwgZS5nLiwgYHN0cmluZ2AsIGBmdW5jdGlvbmAsIGBudW1iZXJgLCBldGMuXG4gPSAoYm9vbGVhbikgYHRydWVgIGlmIGdpdmVuIHZhbHVlIGlzIG9mIGdpdmVuIHR5cGVcblxcKi9cblNuYXAuaXMgPSBpcztcbi8qXFxcbiAqIFNuYXAuc25hcFRvXG4gWyBtZXRob2QgXVxuICoqXG4gKiBTbmFwcyBnaXZlbiB2YWx1ZSB0byBnaXZlbiBncmlkXG4gLSB2YWx1ZXMgKGFycmF5fG51bWJlcikgZ2l2ZW4gYXJyYXkgb2YgdmFsdWVzIG9yIHN0ZXAgb2YgdGhlIGdyaWRcbiAtIHZhbHVlIChudW1iZXIpIHZhbHVlIHRvIGFkanVzdFxuIC0gdG9sZXJhbmNlIChudW1iZXIpICNvcHRpb25hbCBtYXhpbXVtIGRpc3RhbmNlIHRvIHRoZSB0YXJnZXQgdmFsdWUgdGhhdCB3b3VsZCB0cmlnZ2VyIHRoZSBzbmFwLiBEZWZhdWx0IGlzIGAxMGAuXG4gPSAobnVtYmVyKSBhZGp1c3RlZCB2YWx1ZVxuXFwqL1xuU25hcC5zbmFwVG8gPSBmdW5jdGlvbiAodmFsdWVzLCB2YWx1ZSwgdG9sZXJhbmNlKSB7XG4gICAgdG9sZXJhbmNlID0gaXModG9sZXJhbmNlLCBcImZpbml0ZVwiKSA/IHRvbGVyYW5jZSA6IDEwO1xuICAgIGlmIChpcyh2YWx1ZXMsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgdmFyIGkgPSB2YWx1ZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSBpZiAoYWJzKHZhbHVlc1tpXSAtIHZhbHVlKSA8PSB0b2xlcmFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZXNbaV07XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB2YWx1ZXMgPSArdmFsdWVzO1xuICAgICAgICB2YXIgcmVtID0gdmFsdWUgJSB2YWx1ZXM7XG4gICAgICAgIGlmIChyZW0gPCB0b2xlcmFuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZSAtIHJlbTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVtID4gdmFsdWVzIC0gdG9sZXJhbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUgLSByZW0gKyB2YWx1ZXM7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufTtcbi8vIENvbG91clxuLypcXFxuICogU25hcC5nZXRSR0JcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFBhcnNlcyBjb2xvciBzdHJpbmcgYXMgUkdCIG9iamVjdFxuIC0gY29sb3IgKHN0cmluZykgY29sb3Igc3RyaW5nIGluIG9uZSBvZiB0aGUgZm9sbG93aW5nIGZvcm1hdHM6XG4gIyA8dWw+XG4gIyAgICAgPGxpPkNvbG9yIG5hbWUgKDxjb2RlPnJlZDwvY29kZT4sIDxjb2RlPmdyZWVuPC9jb2RlPiwgPGNvZGU+Y29ybmZsb3dlcmJsdWU8L2NvZGU+LCBldGMpPC9saT5cbiAjICAgICA8bGk+I+KAouKAouKAoiDigJQgc2hvcnRlbmVkIEhUTUwgY29sb3I6ICg8Y29kZT4jMDAwPC9jb2RlPiwgPGNvZGU+I2ZjMDwvY29kZT4sIGV0Yy4pPC9saT5cbiAjICAgICA8bGk+I+KAouKAouKAouKAouKAouKAoiDigJQgZnVsbCBsZW5ndGggSFRNTCBjb2xvcjogKDxjb2RlPiMwMDAwMDA8L2NvZGU+LCA8Y29kZT4jYmQyMzAwPC9jb2RlPik8L2xpPlxuICMgICAgIDxsaT5yZ2Io4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIHJlZCwgZ3JlZW4gYW5kIGJsdWUgY2hhbm5lbHMgdmFsdWVzOiAoPGNvZGU+cmdiKDIwMCwmbmJzcDsxMDAsJm5ic3A7MCk8L2NvZGU+KTwvbGk+XG4gIyAgICAgPGxpPnJnYmEo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgYWxzbyB3aXRoIG9wYWNpdHk8L2xpPlxuICMgICAgIDxsaT5yZ2Io4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlOiAoPGNvZGU+cmdiKDEwMCUsJm5ic3A7MTc1JSwmbmJzcDswJSk8L2NvZGU+KTwvbGk+XG4gIyAgICAgPGxpPnJnYmEo4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIGFsc28gd2l0aCBvcGFjaXR5PC9saT5cbiAjICAgICA8bGk+aHNiKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBodWUsIHNhdHVyYXRpb24gYW5kIGJyaWdodG5lc3MgdmFsdWVzOiAoPGNvZGU+aHNiKDAuNSwmbmJzcDswLjI1LCZuYnNwOzEpPC9jb2RlPik8L2xpPlxuICMgICAgIDxsaT5oc2JhKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoikg4oCUIGFsc28gd2l0aCBvcGFjaXR5PC9saT5cbiAjICAgICA8bGk+aHNiKOKAouKAouKAoiUsIOKAouKAouKAoiUsIOKAouKAouKAoiUpIOKAlCBzYW1lIGFzIGFib3ZlLCBidXQgaW4gJTwvbGk+XG4gIyAgICAgPGxpPmhzYmEo4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIGFsc28gd2l0aCBvcGFjaXR5PC9saT5cbiAjICAgICA8bGk+aHNsKOKAouKAouKAoiwg4oCi4oCi4oCiLCDigKLigKLigKIpIOKAlCBodWUsIHNhdHVyYXRpb24gYW5kIGx1bWlub3NpdHkgdmFsdWVzOiAoPGNvZGU+aHNiKDAuNSwmbmJzcDswLjI1LCZuYnNwOzAuNSk8L2NvZGU+KTwvbGk+XG4gIyAgICAgPGxpPmhzbGEo4oCi4oCi4oCiLCDigKLigKLigKIsIOKAouKAouKAoiwg4oCi4oCi4oCiKSDigJQgYWxzbyB3aXRoIG9wYWNpdHk8L2xpPlxuICMgICAgIDxsaT5oc2wo4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSwg4oCi4oCi4oCiJSkg4oCUIHNhbWUgYXMgYWJvdmUsIGJ1dCBpbiAlPC9saT5cbiAjICAgICA8bGk+aHNsYSjigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlLCDigKLigKLigKIlKSDigJQgYWxzbyB3aXRoIG9wYWNpdHk8L2xpPlxuICMgPC91bD5cbiAqIE5vdGUgdGhhdCBgJWAgY2FuIGJlIHVzZWQgYW55IHRpbWU6IGByZ2IoMjAlLCAyNTUsIDUwJSlgLlxuID0gKG9iamVjdCkgUkdCIG9iamVjdCBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiBvIHtcbiBvICAgICByIChudW1iZXIpIHJlZCxcbiBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuIG8gICAgIGIgKG51bWJlcikgYmx1ZSxcbiBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiLFxuIG8gICAgIGVycm9yIChib29sZWFuKSB0cnVlIGlmIHN0cmluZyBjYW4ndCBiZSBwYXJzZWRcbiBvIH1cblxcKi9cblNuYXAuZ2V0UkdCID0gY2FjaGVyKGZ1bmN0aW9uIChjb2xvdXIpIHtcbiAgICBpZiAoIWNvbG91ciB8fCAhISgoY29sb3VyID0gU3RyKGNvbG91cikpLmluZGV4T2YoXCItXCIpICsgMSkpIHtcbiAgICAgICAgcmV0dXJuIHtyOiAtMSwgZzogLTEsIGI6IC0xLCBoZXg6IFwibm9uZVwiLCBlcnJvcjogMSwgdG9TdHJpbmc6IHJnYnRvU3RyaW5nfTtcbiAgICB9XG4gICAgaWYgKGNvbG91ciA9PSBcIm5vbmVcIikge1xuICAgICAgICByZXR1cm4ge3I6IC0xLCBnOiAtMSwgYjogLTEsIGhleDogXCJub25lXCIsIHRvU3RyaW5nOiByZ2J0b1N0cmluZ307XG4gICAgfVxuICAgICEoaHNyZ1toYXNdKGNvbG91ci50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygwLCAyKSkgfHwgY29sb3VyLmNoYXJBdCgpID09IFwiI1wiKSAmJiAoY29sb3VyID0gdG9IZXgoY29sb3VyKSk7XG4gICAgaWYgKCFjb2xvdXIpIHtcbiAgICAgICAgcmV0dXJuIHtyOiAtMSwgZzogLTEsIGI6IC0xLCBoZXg6IFwibm9uZVwiLCBlcnJvcjogMSwgdG9TdHJpbmc6IHJnYnRvU3RyaW5nfTtcbiAgICB9XG4gICAgdmFyIHJlcyxcbiAgICAgICAgcmVkLFxuICAgICAgICBncmVlbixcbiAgICAgICAgYmx1ZSxcbiAgICAgICAgb3BhY2l0eSxcbiAgICAgICAgdCxcbiAgICAgICAgdmFsdWVzLFxuICAgICAgICByZ2IgPSBjb2xvdXIubWF0Y2goY29sb3VyUmVnRXhwKTtcbiAgICBpZiAocmdiKSB7XG4gICAgICAgIGlmIChyZ2JbMl0pIHtcbiAgICAgICAgICAgIGJsdWUgPSB0b0ludChyZ2JbMl0uc3Vic3RyaW5nKDUpLCAxNik7XG4gICAgICAgICAgICBncmVlbiA9IHRvSW50KHJnYlsyXS5zdWJzdHJpbmcoMywgNSksIDE2KTtcbiAgICAgICAgICAgIHJlZCA9IHRvSW50KHJnYlsyXS5zdWJzdHJpbmcoMSwgMyksIDE2KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmdiWzNdKSB7XG4gICAgICAgICAgICBibHVlID0gdG9JbnQoKHQgPSByZ2JbM10uY2hhckF0KDMpKSArIHQsIDE2KTtcbiAgICAgICAgICAgIGdyZWVuID0gdG9JbnQoKHQgPSByZ2JbM10uY2hhckF0KDIpKSArIHQsIDE2KTtcbiAgICAgICAgICAgIHJlZCA9IHRvSW50KCh0ID0gcmdiWzNdLmNoYXJBdCgxKSkgKyB0LCAxNik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJnYls0XSkge1xuICAgICAgICAgICAgdmFsdWVzID0gcmdiWzRdLnNwbGl0KGNvbW1hU3BhY2VzKTtcbiAgICAgICAgICAgIHJlZCA9IHRvRmxvYXQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgIHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKHJlZCAqPSAyLjU1KTtcbiAgICAgICAgICAgIGdyZWVuID0gdG9GbG9hdCh2YWx1ZXNbMV0pO1xuICAgICAgICAgICAgdmFsdWVzWzFdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoZ3JlZW4gKj0gMi41NSk7XG4gICAgICAgICAgICBibHVlID0gdG9GbG9hdCh2YWx1ZXNbMl0pO1xuICAgICAgICAgICAgdmFsdWVzWzJdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoYmx1ZSAqPSAyLjU1KTtcbiAgICAgICAgICAgIHJnYlsxXS50b0xvd2VyQ2FzZSgpLnNsaWNlKDAsIDQpID09IFwicmdiYVwiICYmIChvcGFjaXR5ID0gdG9GbG9hdCh2YWx1ZXNbM10pKTtcbiAgICAgICAgICAgIHZhbHVlc1szXSAmJiB2YWx1ZXNbM10uc2xpY2UoLTEpID09IFwiJVwiICYmIChvcGFjaXR5IC89IDEwMCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJnYls1XSkge1xuICAgICAgICAgICAgdmFsdWVzID0gcmdiWzVdLnNwbGl0KGNvbW1hU3BhY2VzKTtcbiAgICAgICAgICAgIHJlZCA9IHRvRmxvYXQodmFsdWVzWzBdKTtcbiAgICAgICAgICAgIHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKHJlZCAvPSAxMDApO1xuICAgICAgICAgICAgZ3JlZW4gPSB0b0Zsb2F0KHZhbHVlc1sxXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMV0uc2xpY2UoLTEpID09IFwiJVwiICYmIChncmVlbiAvPSAxMDApO1xuICAgICAgICAgICAgYmx1ZSA9IHRvRmxvYXQodmFsdWVzWzJdKTtcbiAgICAgICAgICAgIHZhbHVlc1syXS5zbGljZSgtMSkgPT0gXCIlXCIgJiYgKGJsdWUgLz0gMTAwKTtcbiAgICAgICAgICAgICh2YWx1ZXNbMF0uc2xpY2UoLTMpID09IFwiZGVnXCIgfHwgdmFsdWVzWzBdLnNsaWNlKC0xKSA9PSBcIlxceGIwXCIpICYmIChyZWQgLz0gMzYwKTtcbiAgICAgICAgICAgIHJnYlsxXS50b0xvd2VyQ2FzZSgpLnNsaWNlKDAsIDQpID09IFwiaHNiYVwiICYmIChvcGFjaXR5ID0gdG9GbG9hdCh2YWx1ZXNbM10pKTtcbiAgICAgICAgICAgIHZhbHVlc1szXSAmJiB2YWx1ZXNbM10uc2xpY2UoLTEpID09IFwiJVwiICYmIChvcGFjaXR5IC89IDEwMCk7XG4gICAgICAgICAgICByZXR1cm4gU25hcC5oc2IycmdiKHJlZCwgZ3JlZW4sIGJsdWUsIG9wYWNpdHkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZ2JbNl0pIHtcbiAgICAgICAgICAgIHZhbHVlcyA9IHJnYls2XS5zcGxpdChjb21tYVNwYWNlcyk7XG4gICAgICAgICAgICByZWQgPSB0b0Zsb2F0KHZhbHVlc1swXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMF0uc2xpY2UoLTEpID09IFwiJVwiICYmIChyZWQgLz0gMTAwKTtcbiAgICAgICAgICAgIGdyZWVuID0gdG9GbG9hdCh2YWx1ZXNbMV0pO1xuICAgICAgICAgICAgdmFsdWVzWzFdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAoZ3JlZW4gLz0gMTAwKTtcbiAgICAgICAgICAgIGJsdWUgPSB0b0Zsb2F0KHZhbHVlc1syXSk7XG4gICAgICAgICAgICB2YWx1ZXNbMl0uc2xpY2UoLTEpID09IFwiJVwiICYmIChibHVlIC89IDEwMCk7XG4gICAgICAgICAgICAodmFsdWVzWzBdLnNsaWNlKC0zKSA9PSBcImRlZ1wiIHx8IHZhbHVlc1swXS5zbGljZSgtMSkgPT0gXCJcXHhiMFwiKSAmJiAocmVkIC89IDM2MCk7XG4gICAgICAgICAgICByZ2JbMV0udG9Mb3dlckNhc2UoKS5zbGljZSgwLCA0KSA9PSBcImhzbGFcIiAmJiAob3BhY2l0eSA9IHRvRmxvYXQodmFsdWVzWzNdKSk7XG4gICAgICAgICAgICB2YWx1ZXNbM10gJiYgdmFsdWVzWzNdLnNsaWNlKC0xKSA9PSBcIiVcIiAmJiAob3BhY2l0eSAvPSAxMDApO1xuICAgICAgICAgICAgcmV0dXJuIFNuYXAuaHNsMnJnYihyZWQsIGdyZWVuLCBibHVlLCBvcGFjaXR5KTtcbiAgICAgICAgfVxuICAgICAgICByZWQgPSBtbWluKG1hdGgucm91bmQocmVkKSwgMjU1KTtcbiAgICAgICAgZ3JlZW4gPSBtbWluKG1hdGgucm91bmQoZ3JlZW4pLCAyNTUpO1xuICAgICAgICBibHVlID0gbW1pbihtYXRoLnJvdW5kKGJsdWUpLCAyNTUpO1xuICAgICAgICBvcGFjaXR5ID0gbW1pbihtbWF4KG9wYWNpdHksIDApLCAxKTtcbiAgICAgICAgcmdiID0ge3I6IHJlZCwgZzogZ3JlZW4sIGI6IGJsdWUsIHRvU3RyaW5nOiByZ2J0b1N0cmluZ307XG4gICAgICAgIHJnYi5oZXggPSBcIiNcIiArICgxNjc3NzIxNiB8IGJsdWUgfCAoZ3JlZW4gPDwgOCkgfCAocmVkIDw8IDE2KSkudG9TdHJpbmcoMTYpLnNsaWNlKDEpO1xuICAgICAgICByZ2Iub3BhY2l0eSA9IGlzKG9wYWNpdHksIFwiZmluaXRlXCIpID8gb3BhY2l0eSA6IDE7XG4gICAgICAgIHJldHVybiByZ2I7XG4gICAgfVxuICAgIHJldHVybiB7cjogLTEsIGc6IC0xLCBiOiAtMSwgaGV4OiBcIm5vbmVcIiwgZXJyb3I6IDEsIHRvU3RyaW5nOiByZ2J0b1N0cmluZ307XG59LCBTbmFwKTtcbi8qXFxcbiAqIFNuYXAuaHNiXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDb252ZXJ0cyBIU0IgdmFsdWVzIHRvIGEgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvclxuIC0gaCAobnVtYmVyKSBodWVcbiAtIHMgKG51bWJlcikgc2F0dXJhdGlvblxuIC0gYiAobnVtYmVyKSB2YWx1ZSBvciBicmlnaHRuZXNzXG4gPSAoc3RyaW5nKSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG9yXG5cXCovXG5TbmFwLmhzYiA9IGNhY2hlcihmdW5jdGlvbiAoaCwgcywgYikge1xuICAgIHJldHVybiBTbmFwLmhzYjJyZ2IoaCwgcywgYikuaGV4O1xufSk7XG4vKlxcXG4gKiBTbmFwLmhzbFxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ29udmVydHMgSFNMIHZhbHVlcyB0byBhIGhleCByZXByZXNlbnRhdGlvbiBvZiB0aGUgY29sb3JcbiAtIGggKG51bWJlcikgaHVlXG4gLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAtIGwgKG51bWJlcikgbHVtaW5vc2l0eVxuID0gKHN0cmluZykgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBjb2xvclxuXFwqL1xuU25hcC5oc2wgPSBjYWNoZXIoZnVuY3Rpb24gKGgsIHMsIGwpIHtcbiAgICByZXR1cm4gU25hcC5oc2wycmdiKGgsIHMsIGwpLmhleDtcbn0pO1xuLypcXFxuICogU25hcC5yZ2JcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENvbnZlcnRzIFJHQiB2YWx1ZXMgdG8gYSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG9yXG4gLSByIChudW1iZXIpIHJlZFxuIC0gZyAobnVtYmVyKSBncmVlblxuIC0gYiAobnVtYmVyKSBibHVlXG4gPSAoc3RyaW5nKSBoZXggcmVwcmVzZW50YXRpb24gb2YgdGhlIGNvbG9yXG5cXCovXG5TbmFwLnJnYiA9IGNhY2hlcihmdW5jdGlvbiAociwgZywgYiwgbykge1xuICAgIGlmIChpcyhvLCBcImZpbml0ZVwiKSkge1xuICAgICAgICB2YXIgcm91bmQgPSBtYXRoLnJvdW5kO1xuICAgICAgICByZXR1cm4gXCJyZ2JhKFwiICsgW3JvdW5kKHIpLCByb3VuZChnKSwgcm91bmQoYiksICtvLnRvRml4ZWQoMildICsgXCIpXCI7XG4gICAgfVxuICAgIHJldHVybiBcIiNcIiArICgxNjc3NzIxNiB8IGIgfCAoZyA8PCA4KSB8IChyIDw8IDE2KSkudG9TdHJpbmcoMTYpLnNsaWNlKDEpO1xufSk7XG52YXIgdG9IZXggPSBmdW5jdGlvbiAoY29sb3IpIHtcbiAgICB2YXIgaSA9IGdsb2IuZG9jLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXSB8fCBnbG9iLmRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInN2Z1wiKVswXSxcbiAgICAgICAgcmVkID0gXCJyZ2IoMjU1LCAwLCAwKVwiO1xuICAgIHRvSGV4ID0gY2FjaGVyKGZ1bmN0aW9uIChjb2xvcikge1xuICAgICAgICBpZiAoY29sb3IudG9Mb3dlckNhc2UoKSA9PSBcInJlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVkO1xuICAgICAgICB9XG4gICAgICAgIGkuc3R5bGUuY29sb3IgPSByZWQ7XG4gICAgICAgIGkuc3R5bGUuY29sb3IgPSBjb2xvcjtcbiAgICAgICAgdmFyIG91dCA9IGdsb2IuZG9jLmRlZmF1bHRWaWV3LmdldENvbXB1dGVkU3R5bGUoaSwgRSkuZ2V0UHJvcGVydHlWYWx1ZShcImNvbG9yXCIpO1xuICAgICAgICByZXR1cm4gb3V0ID09IHJlZCA/IG51bGwgOiBvdXQ7XG4gICAgfSk7XG4gICAgcmV0dXJuIHRvSGV4KGNvbG9yKTtcbn0sXG5oc2J0b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJoc2IoXCIgKyBbdGhpcy5oLCB0aGlzLnMsIHRoaXMuYl0gKyBcIilcIjtcbn0sXG5oc2x0b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJoc2woXCIgKyBbdGhpcy5oLCB0aGlzLnMsIHRoaXMubF0gKyBcIilcIjtcbn0sXG5yZ2J0b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5vcGFjaXR5ID09IDEgfHwgdGhpcy5vcGFjaXR5ID09IG51bGwgP1xuICAgICAgICAgICAgdGhpcy5oZXggOlxuICAgICAgICAgICAgXCJyZ2JhKFwiICsgW3RoaXMuciwgdGhpcy5nLCB0aGlzLmIsIHRoaXMub3BhY2l0eV0gKyBcIilcIjtcbn0sXG5wcmVwYXJlUkdCID0gZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICBpZiAoZyA9PSBudWxsICYmIGlzKHIsIFwib2JqZWN0XCIpICYmIFwiclwiIGluIHIgJiYgXCJnXCIgaW4gciAmJiBcImJcIiBpbiByKSB7XG4gICAgICAgIGIgPSByLmI7XG4gICAgICAgIGcgPSByLmc7XG4gICAgICAgIHIgPSByLnI7XG4gICAgfVxuICAgIGlmIChnID09IG51bGwgJiYgaXMociwgc3RyaW5nKSkge1xuICAgICAgICB2YXIgY2xyID0gU25hcC5nZXRSR0Iocik7XG4gICAgICAgIHIgPSBjbHIucjtcbiAgICAgICAgZyA9IGNsci5nO1xuICAgICAgICBiID0gY2xyLmI7XG4gICAgfVxuICAgIGlmIChyID4gMSB8fCBnID4gMSB8fCBiID4gMSkge1xuICAgICAgICByIC89IDI1NTtcbiAgICAgICAgZyAvPSAyNTU7XG4gICAgICAgIGIgLz0gMjU1O1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gW3IsIGcsIGJdO1xufSxcbnBhY2thZ2VSR0IgPSBmdW5jdGlvbiAociwgZywgYiwgbykge1xuICAgIHIgPSBtYXRoLnJvdW5kKHIgKiAyNTUpO1xuICAgIGcgPSBtYXRoLnJvdW5kKGcgKiAyNTUpO1xuICAgIGIgPSBtYXRoLnJvdW5kKGIgKiAyNTUpO1xuICAgIHZhciByZ2IgPSB7XG4gICAgICAgIHI6IHIsXG4gICAgICAgIGc6IGcsXG4gICAgICAgIGI6IGIsXG4gICAgICAgIG9wYWNpdHk6IGlzKG8sIFwiZmluaXRlXCIpID8gbyA6IDEsXG4gICAgICAgIGhleDogU25hcC5yZ2IociwgZywgYiksXG4gICAgICAgIHRvU3RyaW5nOiByZ2J0b1N0cmluZ1xuICAgIH07XG4gICAgaXMobywgXCJmaW5pdGVcIikgJiYgKHJnYi5vcGFjaXR5ID0gbyk7XG4gICAgcmV0dXJuIHJnYjtcbn07XG4vKlxcXG4gKiBTbmFwLmNvbG9yXG4gWyBtZXRob2QgXVxuICoqXG4gKiBQYXJzZXMgdGhlIGNvbG9yIHN0cmluZyBhbmQgcmV0dXJucyBhbiBvYmplY3QgZmVhdHVyaW5nIHRoZSBjb2xvcidzIGNvbXBvbmVudCB2YWx1ZXNcbiAtIGNsciAoc3RyaW5nKSBjb2xvciBzdHJpbmcgaW4gb25lIG9mIHRoZSBzdXBwb3J0ZWQgZm9ybWF0cyAoc2VlIEBTbmFwLmdldFJHQilcbiA9IChvYmplY3QpIENvbWJpbmVkIFJHQi9IU0Igb2JqZWN0IGluIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuIG8ge1xuIG8gICAgIHIgKG51bWJlcikgcmVkLFxuIG8gICAgIGcgKG51bWJlcikgZ3JlZW4sXG4gbyAgICAgYiAobnVtYmVyKSBibHVlLFxuIG8gICAgIGhleCAoc3RyaW5nKSBjb2xvciBpbiBIVE1ML0NTUyBmb3JtYXQ6ICPigKLigKLigKLigKLigKLigKIsXG4gbyAgICAgZXJyb3IgKGJvb2xlYW4pIGB0cnVlYCBpZiBzdHJpbmcgY2FuJ3QgYmUgcGFyc2VkLFxuIG8gICAgIGggKG51bWJlcikgaHVlLFxuIG8gICAgIHMgKG51bWJlcikgc2F0dXJhdGlvbixcbiBvICAgICB2IChudW1iZXIpIHZhbHVlIChicmlnaHRuZXNzKSxcbiBvICAgICBsIChudW1iZXIpIGxpZ2h0bmVzc1xuIG8gfVxuXFwqL1xuU25hcC5jb2xvciA9IGZ1bmN0aW9uIChjbHIpIHtcbiAgICB2YXIgcmdiO1xuICAgIGlmIChpcyhjbHIsIFwib2JqZWN0XCIpICYmIFwiaFwiIGluIGNsciAmJiBcInNcIiBpbiBjbHIgJiYgXCJiXCIgaW4gY2xyKSB7XG4gICAgICAgIHJnYiA9IFNuYXAuaHNiMnJnYihjbHIpO1xuICAgICAgICBjbHIuciA9IHJnYi5yO1xuICAgICAgICBjbHIuZyA9IHJnYi5nO1xuICAgICAgICBjbHIuYiA9IHJnYi5iO1xuICAgICAgICBjbHIub3BhY2l0eSA9IDE7XG4gICAgICAgIGNsci5oZXggPSByZ2IuaGV4O1xuICAgIH0gZWxzZSBpZiAoaXMoY2xyLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBjbHIgJiYgXCJzXCIgaW4gY2xyICYmIFwibFwiIGluIGNscikge1xuICAgICAgICByZ2IgPSBTbmFwLmhzbDJyZ2IoY2xyKTtcbiAgICAgICAgY2xyLnIgPSByZ2IucjtcbiAgICAgICAgY2xyLmcgPSByZ2IuZztcbiAgICAgICAgY2xyLmIgPSByZ2IuYjtcbiAgICAgICAgY2xyLm9wYWNpdHkgPSAxO1xuICAgICAgICBjbHIuaGV4ID0gcmdiLmhleDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXMoY2xyLCBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgY2xyID0gU25hcC5nZXRSR0IoY2xyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXMoY2xyLCBcIm9iamVjdFwiKSAmJiBcInJcIiBpbiBjbHIgJiYgXCJnXCIgaW4gY2xyICYmIFwiYlwiIGluIGNsciAmJiAhKFwiZXJyb3JcIiBpbiBjbHIpKSB7XG4gICAgICAgICAgICByZ2IgPSBTbmFwLnJnYjJoc2woY2xyKTtcbiAgICAgICAgICAgIGNsci5oID0gcmdiLmg7XG4gICAgICAgICAgICBjbHIucyA9IHJnYi5zO1xuICAgICAgICAgICAgY2xyLmwgPSByZ2IubDtcbiAgICAgICAgICAgIHJnYiA9IFNuYXAucmdiMmhzYihjbHIpO1xuICAgICAgICAgICAgY2xyLnYgPSByZ2IuYjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNsciA9IHtoZXg6IFwibm9uZVwifTtcbiAgICAgICAgICAgIGNsci5yID0gY2xyLmcgPSBjbHIuYiA9IGNsci5oID0gY2xyLnMgPSBjbHIudiA9IGNsci5sID0gLTE7XG4gICAgICAgICAgICBjbHIuZXJyb3IgPSAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNsci50b1N0cmluZyA9IHJnYnRvU3RyaW5nO1xuICAgIHJldHVybiBjbHI7XG59O1xuLypcXFxuICogU25hcC5oc2IycmdiXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDb252ZXJ0cyBIU0IgdmFsdWVzIHRvIGFuIFJHQiBvYmplY3RcbiAtIGggKG51bWJlcikgaHVlXG4gLSBzIChudW1iZXIpIHNhdHVyYXRpb25cbiAtIHYgKG51bWJlcikgdmFsdWUgb3IgYnJpZ2h0bmVzc1xuID0gKG9iamVjdCkgUkdCIG9iamVjdCBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiBvIHtcbiBvICAgICByIChudW1iZXIpIHJlZCxcbiBvICAgICBnIChudW1iZXIpIGdyZWVuLFxuIG8gICAgIGIgKG51bWJlcikgYmx1ZSxcbiBvICAgICBoZXggKHN0cmluZykgY29sb3IgaW4gSFRNTC9DU1MgZm9ybWF0OiAj4oCi4oCi4oCi4oCi4oCi4oCiXG4gbyB9XG5cXCovXG5TbmFwLmhzYjJyZ2IgPSBmdW5jdGlvbiAoaCwgcywgdiwgbykge1xuICAgIGlmIChpcyhoLCBcIm9iamVjdFwiKSAmJiBcImhcIiBpbiBoICYmIFwic1wiIGluIGggJiYgXCJiXCIgaW4gaCkge1xuICAgICAgICB2ID0gaC5iO1xuICAgICAgICBzID0gaC5zO1xuICAgICAgICBvID0gaC5vO1xuICAgICAgICBoID0gaC5oO1xuICAgIH1cbiAgICBoICo9IDM2MDtcbiAgICB2YXIgUiwgRywgQiwgWCwgQztcbiAgICBoID0gKGggJSAzNjApIC8gNjA7XG4gICAgQyA9IHYgKiBzO1xuICAgIFggPSBDICogKDEgLSBhYnMoaCAlIDIgLSAxKSk7XG4gICAgUiA9IEcgPSBCID0gdiAtIEM7XG5cbiAgICBoID0gfn5oO1xuICAgIFIgKz0gW0MsIFgsIDAsIDAsIFgsIENdW2hdO1xuICAgIEcgKz0gW1gsIEMsIEMsIFgsIDAsIDBdW2hdO1xuICAgIEIgKz0gWzAsIDAsIFgsIEMsIEMsIFhdW2hdO1xuICAgIHJldHVybiBwYWNrYWdlUkdCKFIsIEcsIEIsIG8pO1xufTtcbi8qXFxcbiAqIFNuYXAuaHNsMnJnYlxuIFsgbWV0aG9kIF1cbiAqKlxuICogQ29udmVydHMgSFNMIHZhbHVlcyB0byBhbiBSR0Igb2JqZWN0XG4gLSBoIChudW1iZXIpIGh1ZVxuIC0gcyAobnVtYmVyKSBzYXR1cmF0aW9uXG4gLSBsIChudW1iZXIpIGx1bWlub3NpdHlcbiA9IChvYmplY3QpIFJHQiBvYmplY3QgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gbyB7XG4gbyAgICAgciAobnVtYmVyKSByZWQsXG4gbyAgICAgZyAobnVtYmVyKSBncmVlbixcbiBvICAgICBiIChudW1iZXIpIGJsdWUsXG4gbyAgICAgaGV4IChzdHJpbmcpIGNvbG9yIGluIEhUTUwvQ1NTIGZvcm1hdDogI+KAouKAouKAouKAouKAouKAolxuIG8gfVxuXFwqL1xuU25hcC5oc2wycmdiID0gZnVuY3Rpb24gKGgsIHMsIGwsIG8pIHtcbiAgICBpZiAoaXMoaCwgXCJvYmplY3RcIikgJiYgXCJoXCIgaW4gaCAmJiBcInNcIiBpbiBoICYmIFwibFwiIGluIGgpIHtcbiAgICAgICAgbCA9IGgubDtcbiAgICAgICAgcyA9IGgucztcbiAgICAgICAgaCA9IGguaDtcbiAgICB9XG4gICAgaWYgKGggPiAxIHx8IHMgPiAxIHx8IGwgPiAxKSB7XG4gICAgICAgIGggLz0gMzYwO1xuICAgICAgICBzIC89IDEwMDtcbiAgICAgICAgbCAvPSAxMDA7XG4gICAgfVxuICAgIGggKj0gMzYwO1xuICAgIHZhciBSLCBHLCBCLCBYLCBDO1xuICAgIGggPSAoaCAlIDM2MCkgLyA2MDtcbiAgICBDID0gMiAqIHMgKiAobCA8IC41ID8gbCA6IDEgLSBsKTtcbiAgICBYID0gQyAqICgxIC0gYWJzKGggJSAyIC0gMSkpO1xuICAgIFIgPSBHID0gQiA9IGwgLSBDIC8gMjtcblxuICAgIGggPSB+fmg7XG4gICAgUiArPSBbQywgWCwgMCwgMCwgWCwgQ11baF07XG4gICAgRyArPSBbWCwgQywgQywgWCwgMCwgMF1baF07XG4gICAgQiArPSBbMCwgMCwgWCwgQywgQywgWF1baF07XG4gICAgcmV0dXJuIHBhY2thZ2VSR0IoUiwgRywgQiwgbyk7XG59O1xuLypcXFxuICogU25hcC5yZ2IyaHNiXG4gWyBtZXRob2QgXVxuICoqXG4gKiBDb252ZXJ0cyBSR0IgdmFsdWVzIHRvIGFuIEhTQiBvYmplY3RcbiAtIHIgKG51bWJlcikgcmVkXG4gLSBnIChudW1iZXIpIGdyZWVuXG4gLSBiIChudW1iZXIpIGJsdWVcbiA9IChvYmplY3QpIEhTQiBvYmplY3QgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gbyB7XG4gbyAgICAgaCAobnVtYmVyKSBodWUsXG4gbyAgICAgcyAobnVtYmVyKSBzYXR1cmF0aW9uLFxuIG8gICAgIGIgKG51bWJlcikgYnJpZ2h0bmVzc1xuIG8gfVxuXFwqL1xuU25hcC5yZ2IyaHNiID0gZnVuY3Rpb24gKHIsIGcsIGIpIHtcbiAgICBiID0gcHJlcGFyZVJHQihyLCBnLCBiKTtcbiAgICByID0gYlswXTtcbiAgICBnID0gYlsxXTtcbiAgICBiID0gYlsyXTtcblxuICAgIHZhciBILCBTLCBWLCBDO1xuICAgIFYgPSBtbWF4KHIsIGcsIGIpO1xuICAgIEMgPSBWIC0gbW1pbihyLCBnLCBiKTtcbiAgICBIID0gKEMgPT0gMCA/IG51bGwgOlxuICAgICAgICAgViA9PSByID8gKGcgLSBiKSAvIEMgOlxuICAgICAgICAgViA9PSBnID8gKGIgLSByKSAvIEMgKyAyIDpcbiAgICAgICAgICAgICAgICAgIChyIC0gZykgLyBDICsgNFxuICAgICAgICApO1xuICAgIEggPSAoKEggKyAzNjApICUgNikgKiA2MCAvIDM2MDtcbiAgICBTID0gQyA9PSAwID8gMCA6IEMgLyBWO1xuICAgIHJldHVybiB7aDogSCwgczogUywgYjogViwgdG9TdHJpbmc6IGhzYnRvU3RyaW5nfTtcbn07XG4vKlxcXG4gKiBTbmFwLnJnYjJoc2xcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENvbnZlcnRzIFJHQiB2YWx1ZXMgdG8gYW4gSFNMIG9iamVjdFxuIC0gciAobnVtYmVyKSByZWRcbiAtIGcgKG51bWJlcikgZ3JlZW5cbiAtIGIgKG51bWJlcikgYmx1ZVxuID0gKG9iamVjdCkgSFNMIG9iamVjdCBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiBvIHtcbiBvICAgICBoIChudW1iZXIpIGh1ZSxcbiBvICAgICBzIChudW1iZXIpIHNhdHVyYXRpb24sXG4gbyAgICAgbCAobnVtYmVyKSBsdW1pbm9zaXR5XG4gbyB9XG5cXCovXG5TbmFwLnJnYjJoc2wgPSBmdW5jdGlvbiAociwgZywgYikge1xuICAgIGIgPSBwcmVwYXJlUkdCKHIsIGcsIGIpO1xuICAgIHIgPSBiWzBdO1xuICAgIGcgPSBiWzFdO1xuICAgIGIgPSBiWzJdO1xuXG4gICAgdmFyIEgsIFMsIEwsIE0sIG0sIEM7XG4gICAgTSA9IG1tYXgociwgZywgYik7XG4gICAgbSA9IG1taW4ociwgZywgYik7XG4gICAgQyA9IE0gLSBtO1xuICAgIEggPSAoQyA9PSAwID8gbnVsbCA6XG4gICAgICAgICBNID09IHIgPyAoZyAtIGIpIC8gQyA6XG4gICAgICAgICBNID09IGcgPyAoYiAtIHIpIC8gQyArIDIgOlxuICAgICAgICAgICAgICAgICAgKHIgLSBnKSAvIEMgKyA0KTtcbiAgICBIID0gKChIICsgMzYwKSAlIDYpICogNjAgLyAzNjA7XG4gICAgTCA9IChNICsgbSkgLyAyO1xuICAgIFMgPSAoQyA9PSAwID8gMCA6XG4gICAgICAgICBMIDwgLjUgPyBDIC8gKDIgKiBMKSA6XG4gICAgICAgICAgICAgICAgICBDIC8gKDIgLSAyICogTCkpO1xuICAgIHJldHVybiB7aDogSCwgczogUywgbDogTCwgdG9TdHJpbmc6IGhzbHRvU3RyaW5nfTtcbn07XG5cbi8vIFRyYW5zZm9ybWF0aW9uc1xuLypcXFxuICogU25hcC5wYXJzZVBhdGhTdHJpbmdcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFV0aWxpdHkgbWV0aG9kXG4gKipcbiAqIFBhcnNlcyBnaXZlbiBwYXRoIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mIGFycmF5cyBvZiBwYXRoIHNlZ21lbnRzXG4gLSBwYXRoU3RyaW5nIChzdHJpbmd8YXJyYXkpIHBhdGggc3RyaW5nIG9yIGFycmF5IG9mIHNlZ21lbnRzIChpbiB0aGUgbGFzdCBjYXNlIGl0IGlzIHJldHVybmVkIHN0cmFpZ2h0IGF3YXkpXG4gPSAoYXJyYXkpIGFycmF5IG9mIHNlZ21lbnRzXG5cXCovXG5TbmFwLnBhcnNlUGF0aFN0cmluZyA9IGZ1bmN0aW9uIChwYXRoU3RyaW5nKSB7XG4gICAgaWYgKCFwYXRoU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgcHRoID0gU25hcC5wYXRoKHBhdGhTdHJpbmcpO1xuICAgIGlmIChwdGguYXJyKSB7XG4gICAgICAgIHJldHVybiBTbmFwLnBhdGguY2xvbmUocHRoLmFycik7XG4gICAgfVxuICAgIFxuICAgIHZhciBwYXJhbUNvdW50cyA9IHthOiA3LCBjOiA2LCBvOiAyLCBoOiAxLCBsOiAyLCBtOiAyLCByOiA0LCBxOiA0LCBzOiA0LCB0OiAyLCB2OiAxLCB1OiAzLCB6OiAwfSxcbiAgICAgICAgZGF0YSA9IFtdO1xuICAgIGlmIChpcyhwYXRoU3RyaW5nLCBcImFycmF5XCIpICYmIGlzKHBhdGhTdHJpbmdbMF0sIFwiYXJyYXlcIikpIHsgLy8gcm91Z2ggYXNzdW1wdGlvblxuICAgICAgICBkYXRhID0gU25hcC5wYXRoLmNsb25lKHBhdGhTdHJpbmcpO1xuICAgIH1cbiAgICBpZiAoIWRhdGEubGVuZ3RoKSB7XG4gICAgICAgIFN0cihwYXRoU3RyaW5nKS5yZXBsYWNlKHBhdGhDb21tYW5kLCBmdW5jdGlvbiAoYSwgYiwgYykge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IFtdLFxuICAgICAgICAgICAgICAgIG5hbWUgPSBiLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBjLnJlcGxhY2UocGF0aFZhbHVlcywgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgICAgICBiICYmIHBhcmFtcy5wdXNoKCtiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKG5hbWUgPT0gXCJtXCIgJiYgcGFyYW1zLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgICAgICBkYXRhLnB1c2goW2JdLmNvbmNhdChwYXJhbXMuc3BsaWNlKDAsIDIpKSk7XG4gICAgICAgICAgICAgICAgbmFtZSA9IFwibFwiO1xuICAgICAgICAgICAgICAgIGIgPSBiID09IFwibVwiID8gXCJsXCIgOiBcIkxcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuYW1lID09IFwib1wiICYmIHBhcmFtcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYiwgcGFyYW1zWzBdXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmFtZSA9PSBcInJcIikge1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaChbYl0uY29uY2F0KHBhcmFtcykpO1xuICAgICAgICAgICAgfSBlbHNlIHdoaWxlIChwYXJhbXMubGVuZ3RoID49IHBhcmFtQ291bnRzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKFtiXS5jb25jYXQocGFyYW1zLnNwbGljZSgwLCBwYXJhbUNvdW50c1tuYW1lXSkpKTtcbiAgICAgICAgICAgICAgICBpZiAoIXBhcmFtQ291bnRzW25hbWVdKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRhdGEudG9TdHJpbmcgPSBTbmFwLnBhdGgudG9TdHJpbmc7XG4gICAgcHRoLmFyciA9IFNuYXAucGF0aC5jbG9uZShkYXRhKTtcbiAgICByZXR1cm4gZGF0YTtcbn07XG4vKlxcXG4gKiBTbmFwLnBhcnNlVHJhbnNmb3JtU3RyaW5nXG4gWyBtZXRob2QgXVxuICoqXG4gKiBVdGlsaXR5IG1ldGhvZFxuICoqXG4gKiBQYXJzZXMgZ2l2ZW4gdHJhbnNmb3JtIHN0cmluZyBpbnRvIGFuIGFycmF5IG9mIHRyYW5zZm9ybWF0aW9uc1xuIC0gVFN0cmluZyAoc3RyaW5nfGFycmF5KSB0cmFuc2Zvcm0gc3RyaW5nIG9yIGFycmF5IG9mIHRyYW5zZm9ybWF0aW9ucyAoaW4gdGhlIGxhc3QgY2FzZSBpdCBpcyByZXR1cm5lZCBzdHJhaWdodCBhd2F5KVxuID0gKGFycmF5KSBhcnJheSBvZiB0cmFuc2Zvcm1hdGlvbnNcblxcKi9cbnZhciBwYXJzZVRyYW5zZm9ybVN0cmluZyA9IFNuYXAucGFyc2VUcmFuc2Zvcm1TdHJpbmcgPSBmdW5jdGlvbiAoVFN0cmluZykge1xuICAgIGlmICghVFN0cmluZykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHBhcmFtQ291bnRzID0ge3I6IDMsIHM6IDQsIHQ6IDIsIG06IDZ9LFxuICAgICAgICBkYXRhID0gW107XG4gICAgaWYgKGlzKFRTdHJpbmcsIFwiYXJyYXlcIikgJiYgaXMoVFN0cmluZ1swXSwgXCJhcnJheVwiKSkgeyAvLyByb3VnaCBhc3N1bXB0aW9uXG4gICAgICAgIGRhdGEgPSBTbmFwLnBhdGguY2xvbmUoVFN0cmluZyk7XG4gICAgfVxuICAgIGlmICghZGF0YS5sZW5ndGgpIHtcbiAgICAgICAgU3RyKFRTdHJpbmcpLnJlcGxhY2UodENvbW1hbmQsIGZ1bmN0aW9uIChhLCBiLCBjKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gW10sXG4gICAgICAgICAgICAgICAgbmFtZSA9IGIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGMucmVwbGFjZShwYXRoVmFsdWVzLCBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIGIgJiYgcGFyYW1zLnB1c2goK2IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBkYXRhLnB1c2goW2JdLmNvbmNhdChwYXJhbXMpKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRhdGEudG9TdHJpbmcgPSBTbmFwLnBhdGgudG9TdHJpbmc7XG4gICAgcmV0dXJuIGRhdGE7XG59O1xuZnVuY3Rpb24gc3ZnVHJhbnNmb3JtMnN0cmluZyh0c3RyKSB7XG4gICAgdmFyIHJlcyA9IFtdO1xuICAgIHRzdHIgPSB0c3RyLnJlcGxhY2UoLyg/Ol58XFxzKShcXHcrKVxcKChbXildKylcXCkvZywgZnVuY3Rpb24gKGFsbCwgbmFtZSwgcGFyYW1zKSB7XG4gICAgICAgIHBhcmFtcyA9IHBhcmFtcy5zcGxpdCgvXFxzKixcXHMqfFxccysvKTtcbiAgICAgICAgaWYgKG5hbWUgPT0gXCJyb3RhdGVcIiAmJiBwYXJhbXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgIHBhcmFtcy5wdXNoKDAsIDApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IFwic2NhbGVcIikge1xuICAgICAgICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0gcGFyYW1zLnNsaWNlKDAsIDIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJhbXMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMucHVzaCgwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwYXJhbXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMucHVzaChwYXJhbXNbMF0sIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IFwic2tld1hcIikge1xuICAgICAgICAgICAgcmVzLnB1c2goW1wibVwiLCAxLCAwLCBtYXRoLnRhbihyYWQocGFyYW1zWzBdKSksIDEsIDAsIDBdKTtcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lID09IFwic2tld1lcIikge1xuICAgICAgICAgICAgcmVzLnB1c2goW1wibVwiLCAxLCBtYXRoLnRhbihyYWQocGFyYW1zWzBdKSksIDAsIDEsIDAsIDBdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKFtuYW1lLmNoYXJBdCgwKV0uY29uY2F0KHBhcmFtcykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhbGw7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlcztcbn1cblNuYXAuXy5zdmdUcmFuc2Zvcm0yc3RyaW5nID0gc3ZnVHJhbnNmb3JtMnN0cmluZztcblNuYXAuXy5yZ1RyYW5zZm9ybSA9IC9eW2Etel1bXFxzXSotP1xcLj9cXGQvaTtcbmZ1bmN0aW9uIHRyYW5zZm9ybTJtYXRyaXgodHN0ciwgYmJveCkge1xuICAgIHZhciB0ZGF0YSA9IHBhcnNlVHJhbnNmb3JtU3RyaW5nKHRzdHIpLFxuICAgICAgICBtID0gbmV3IFNuYXAuTWF0cml4O1xuICAgIGlmICh0ZGF0YSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0ZGF0YS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdCA9IHRkYXRhW2ldLFxuICAgICAgICAgICAgICAgIHRsZW4gPSB0Lmxlbmd0aCxcbiAgICAgICAgICAgICAgICBjb21tYW5kID0gU3RyKHRbMF0pLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICAgICAgYWJzb2x1dGUgPSB0WzBdICE9IGNvbW1hbmQsXG4gICAgICAgICAgICAgICAgaW52ZXIgPSBhYnNvbHV0ZSA/IG0uaW52ZXJ0KCkgOiAwLFxuICAgICAgICAgICAgICAgIHgxLFxuICAgICAgICAgICAgICAgIHkxLFxuICAgICAgICAgICAgICAgIHgyLFxuICAgICAgICAgICAgICAgIHkyLFxuICAgICAgICAgICAgICAgIGJiO1xuICAgICAgICAgICAgaWYgKGNvbW1hbmQgPT0gXCJ0XCIgJiYgdGxlbiA9PSAyKXtcbiAgICAgICAgICAgICAgICBtLnRyYW5zbGF0ZSh0WzFdLCAwKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoY29tbWFuZCA9PSBcInRcIiAmJiB0bGVuID09IDMpIHtcbiAgICAgICAgICAgICAgICBpZiAoYWJzb2x1dGUpIHtcbiAgICAgICAgICAgICAgICAgICAgeDEgPSBpbnZlci54KDAsIDApO1xuICAgICAgICAgICAgICAgICAgICB5MSA9IGludmVyLnkoMCwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHgyID0gaW52ZXIueCh0WzFdLCB0WzJdKTtcbiAgICAgICAgICAgICAgICAgICAgeTIgPSBpbnZlci55KHRbMV0sIHRbMl0pO1xuICAgICAgICAgICAgICAgICAgICBtLnRyYW5zbGF0ZSh4MiAtIHgxLCB5MiAtIHkxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtLnRyYW5zbGF0ZSh0WzFdLCB0WzJdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbW1hbmQgPT0gXCJyXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAodGxlbiA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIGJiID0gYmIgfHwgYmJveDtcbiAgICAgICAgICAgICAgICAgICAgbS5yb3RhdGUodFsxXSwgYmIueCArIGJiLndpZHRoIC8gMiwgYmIueSArIGJiLmhlaWdodCAvIDIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGxlbiA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhYnNvbHV0ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSBpbnZlci54KHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBpbnZlci55KHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgbS5yb3RhdGUodFsxXSwgeDIsIHkyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG0ucm90YXRlKHRbMV0sIHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tYW5kID09IFwic1wiKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRsZW4gPT0gMiB8fCB0bGVuID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgYmIgPSBiYiB8fCBiYm94O1xuICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbdGxlbiAtIDFdLCBiYi54ICsgYmIud2lkdGggLyAyLCBiYi55ICsgYmIuaGVpZ2h0IC8gMik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0bGVuID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFic29sdXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGludmVyLngodFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGludmVyLnkodFsyXSwgdFszXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbMV0sIHgyLCB5Mik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbMV0sIHRbMl0sIHRbM10pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0bGVuID09IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFic29sdXRlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGludmVyLngodFszXSwgdFs0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB5MiA9IGludmVyLnkodFszXSwgdFs0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbMl0sIHgyLCB5Mik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtLnNjYWxlKHRbMV0sIHRbMl0sIHRbM10sIHRbNF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChjb21tYW5kID09IFwibVwiICYmIHRsZW4gPT0gNykge1xuICAgICAgICAgICAgICAgIG0uYWRkKHRbMV0sIHRbMl0sIHRbM10sIHRbNF0sIHRbNV0sIHRbNl0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtO1xufVxuU25hcC5fLnRyYW5zZm9ybTJtYXRyaXggPSB0cmFuc2Zvcm0ybWF0cml4O1xuU25hcC5fdW5pdDJweCA9IHVuaXQycHg7XG52YXIgY29udGFpbnMgPSBnbG9iLmRvYy5jb250YWlucyB8fCBnbG9iLmRvYy5jb21wYXJlRG9jdW1lbnRQb3NpdGlvbiA/XG4gICAgZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIGFkb3duID0gYS5ub2RlVHlwZSA9PSA5ID8gYS5kb2N1bWVudEVsZW1lbnQgOiBhLFxuICAgICAgICAgICAgYnVwID0gYiAmJiBiLnBhcmVudE5vZGU7XG4gICAgICAgICAgICByZXR1cm4gYSA9PSBidXAgfHwgISEoYnVwICYmIGJ1cC5ub2RlVHlwZSA9PSAxICYmIChcbiAgICAgICAgICAgICAgICBhZG93bi5jb250YWlucyA/XG4gICAgICAgICAgICAgICAgICAgIGFkb3duLmNvbnRhaW5zKGJ1cCkgOlxuICAgICAgICAgICAgICAgICAgICBhLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uICYmIGEuY29tcGFyZURvY3VtZW50UG9zaXRpb24oYnVwKSAmIDE2XG4gICAgICAgICAgICApKTtcbiAgICB9IDpcbiAgICBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICBpZiAoYikge1xuICAgICAgICAgICAgd2hpbGUgKGIpIHtcbiAgICAgICAgICAgICAgICBiID0gYi5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICAgIGlmIChiID09IGEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuZnVuY3Rpb24gZ2V0U29tZURlZnMoZWwpIHtcbiAgICB2YXIgcCA9IChlbC5ub2RlLm93bmVyU1ZHRWxlbWVudCAmJiB3cmFwKGVsLm5vZGUub3duZXJTVkdFbGVtZW50KSkgfHxcbiAgICAgICAgICAgIChlbC5ub2RlLnBhcmVudE5vZGUgJiYgd3JhcChlbC5ub2RlLnBhcmVudE5vZGUpKSB8fFxuICAgICAgICAgICAgU25hcC5zZWxlY3QoXCJzdmdcIikgfHxcbiAgICAgICAgICAgIFNuYXAoMCwgMCksXG4gICAgICAgIHBkZWZzID0gcC5zZWxlY3QoXCJkZWZzXCIpLFxuICAgICAgICBkZWZzICA9IHBkZWZzID09IG51bGwgPyBmYWxzZSA6IHBkZWZzLm5vZGU7XG4gICAgaWYgKCFkZWZzKSB7XG4gICAgICAgIGRlZnMgPSBtYWtlKFwiZGVmc1wiLCBwLm5vZGUpLm5vZGU7XG4gICAgfVxuICAgIHJldHVybiBkZWZzO1xufVxuZnVuY3Rpb24gZ2V0U29tZVNWRyhlbCkge1xuICAgIHJldHVybiBlbC5ub2RlLm93bmVyU1ZHRWxlbWVudCAmJiB3cmFwKGVsLm5vZGUub3duZXJTVkdFbGVtZW50KSB8fCBTbmFwLnNlbGVjdChcInN2Z1wiKTtcbn1cblNuYXAuXy5nZXRTb21lRGVmcyA9IGdldFNvbWVEZWZzO1xuU25hcC5fLmdldFNvbWVTVkcgPSBnZXRTb21lU1ZHO1xuZnVuY3Rpb24gdW5pdDJweChlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICB2YXIgc3ZnID0gZ2V0U29tZVNWRyhlbCkubm9kZSxcbiAgICAgICAgb3V0ID0ge30sXG4gICAgICAgIG1nciA9IHN2Zy5xdWVyeVNlbGVjdG9yKFwiLnN2Zy0tLW1nclwiKTtcbiAgICBpZiAoIW1ncikge1xuICAgICAgICBtZ3IgPSAkKFwicmVjdFwiKTtcbiAgICAgICAgJChtZ3IsIHt4OiAtOWU5LCB5OiAtOWU5LCB3aWR0aDogMTAsIGhlaWdodDogMTAsIFwiY2xhc3NcIjogXCJzdmctLS1tZ3JcIiwgZmlsbDogXCJub25lXCJ9KTtcbiAgICAgICAgc3ZnLmFwcGVuZENoaWxkKG1ncik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldFcodmFsKSB7XG4gICAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIEU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbCA9PSArdmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgICAgICQobWdyLCB7d2lkdGg6IHZhbH0pO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG1nci5nZXRCQm94KCkud2lkdGg7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldEgodmFsKSB7XG4gICAgICAgIGlmICh2YWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIEU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZhbCA9PSArdmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgICAgICQobWdyLCB7aGVpZ2h0OiB2YWx9KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBtZ3IuZ2V0QkJveCgpLmhlaWdodDtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc2V0KG5hbSwgZikge1xuICAgICAgICBpZiAobmFtZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBvdXRbbmFtXSA9IGYoZWwuYXR0cihuYW0pIHx8IDApO1xuICAgICAgICB9IGVsc2UgaWYgKG5hbSA9PSBuYW1lKSB7XG4gICAgICAgICAgICBvdXQgPSBmKHZhbHVlID09IG51bGwgPyBlbC5hdHRyKG5hbSkgfHwgMCA6IHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzd2l0Y2ggKGVsLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcInJlY3RcIjpcbiAgICAgICAgICAgIHNldChcInJ4XCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwicnlcIiwgZ2V0SCk7XG4gICAgICAgIGNhc2UgXCJpbWFnZVwiOlxuICAgICAgICAgICAgc2V0KFwid2lkdGhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJoZWlnaHRcIiwgZ2V0SCk7XG4gICAgICAgIGNhc2UgXCJ0ZXh0XCI6XG4gICAgICAgICAgICBzZXQoXCJ4XCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwieVwiLCBnZXRIKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJjaXJjbGVcIjpcbiAgICAgICAgICAgIHNldChcImN4XCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwiY3lcIiwgZ2V0SCk7XG4gICAgICAgICAgICBzZXQoXCJyXCIsIGdldFcpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImVsbGlwc2VcIjpcbiAgICAgICAgICAgIHNldChcImN4XCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwiY3lcIiwgZ2V0SCk7XG4gICAgICAgICAgICBzZXQoXCJyeFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcInJ5XCIsIGdldEgpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImxpbmVcIjpcbiAgICAgICAgICAgIHNldChcIngxXCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwieDJcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJ5MVwiLCBnZXRIKTtcbiAgICAgICAgICAgIHNldChcInkyXCIsIGdldEgpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIm1hcmtlclwiOlxuICAgICAgICAgICAgc2V0KFwicmVmWFwiLCBnZXRXKTtcbiAgICAgICAgICAgIHNldChcIm1hcmtlcldpZHRoXCIsIGdldFcpO1xuICAgICAgICAgICAgc2V0KFwicmVmWVwiLCBnZXRIKTtcbiAgICAgICAgICAgIHNldChcIm1hcmtlckhlaWdodFwiLCBnZXRIKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJyYWRpYWxHcmFkaWVudFwiOlxuICAgICAgICAgICAgc2V0KFwiZnhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJmeVwiLCBnZXRIKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ0c3BhblwiOlxuICAgICAgICAgICAgc2V0KFwiZHhcIiwgZ2V0Vyk7XG4gICAgICAgICAgICBzZXQoXCJkeVwiLCBnZXRIKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBzZXQobmFtZSwgZ2V0Vyk7XG4gICAgfVxuICAgIHN2Zy5yZW1vdmVDaGlsZChtZ3IpO1xuICAgIHJldHVybiBvdXQ7XG59XG4vKlxcXG4gKiBTbmFwLnNlbGVjdFxuIFsgbWV0aG9kIF1cbiAqKlxuICogV3JhcHMgYSBET00gZWxlbWVudCBzcGVjaWZpZWQgYnkgQ1NTIHNlbGVjdG9yIGFzIEBFbGVtZW50XG4gLSBxdWVyeSAoc3RyaW5nKSBDU1Mgc2VsZWN0b3Igb2YgdGhlIGVsZW1lbnRcbiA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG5cXCovXG5TbmFwLnNlbGVjdCA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgIHF1ZXJ5ID0gU3RyKHF1ZXJ5KS5yZXBsYWNlKC8oW15cXFxcXSk6L2csIFwiJDFcXFxcOlwiKTtcbiAgICByZXR1cm4gd3JhcChnbG9iLmRvYy5xdWVyeVNlbGVjdG9yKHF1ZXJ5KSk7XG59O1xuLypcXFxuICogU25hcC5zZWxlY3RBbGxcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFdyYXBzIERPTSBlbGVtZW50cyBzcGVjaWZpZWQgYnkgQ1NTIHNlbGVjdG9yIGFzIHNldCBvciBhcnJheSBvZiBARWxlbWVudFxuIC0gcXVlcnkgKHN0cmluZykgQ1NTIHNlbGVjdG9yIG9mIHRoZSBlbGVtZW50XG4gPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuXFwqL1xuU25hcC5zZWxlY3RBbGwgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICB2YXIgbm9kZWxpc3QgPSBnbG9iLmRvYy5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSxcbiAgICAgICAgc2V0ID0gKFNuYXAuc2V0IHx8IEFycmF5KSgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZWxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2V0LnB1c2god3JhcChub2RlbGlzdFtpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gc2V0O1xufTtcblxuZnVuY3Rpb24gYWRkMmdyb3VwKGxpc3QpIHtcbiAgICBpZiAoIWlzKGxpc3QsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgbGlzdCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgfVxuICAgIHZhciBpID0gMCxcbiAgICAgICAgaiA9IDAsXG4gICAgICAgIG5vZGUgPSB0aGlzLm5vZGU7XG4gICAgd2hpbGUgKHRoaXNbaV0pIGRlbGV0ZSB0aGlzW2krK107XG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGxpc3RbaV0udHlwZSA9PSBcInNldFwiKSB7XG4gICAgICAgICAgICBsaXN0W2ldLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChlbC5ub2RlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS5hcHBlbmRDaGlsZChsaXN0W2ldLm5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjaGlsZHJlbiA9IG5vZGUuY2hpbGROb2RlcztcbiAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpc1tqKytdID0gd3JhcChjaGlsZHJlbltpXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufVxuLy8gSHViIGdhcmJhZ2UgY29sbGVjdG9yIGV2ZXJ5IDEwc1xuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGtleSBpbiBodWIpIGlmIChodWJbaGFzXShrZXkpKSB7XG4gICAgICAgIHZhciBlbCA9IGh1YltrZXldLFxuICAgICAgICAgICAgbm9kZSA9IGVsLm5vZGU7XG4gICAgICAgIGlmIChlbC50eXBlICE9IFwic3ZnXCIgJiYgIW5vZGUub3duZXJTVkdFbGVtZW50IHx8IGVsLnR5cGUgPT0gXCJzdmdcIiAmJiAoIW5vZGUucGFyZW50Tm9kZSB8fCBcIm93bmVyU1ZHRWxlbWVudFwiIGluIG5vZGUucGFyZW50Tm9kZSAmJiAhbm9kZS5vd25lclNWR0VsZW1lbnQpKSB7XG4gICAgICAgICAgICBkZWxldGUgaHViW2tleV07XG4gICAgICAgIH1cbiAgICB9XG59LCAxZTQpO1xuZnVuY3Rpb24gRWxlbWVudChlbCkge1xuICAgIGlmIChlbC5zbmFwIGluIGh1Yikge1xuICAgICAgICByZXR1cm4gaHViW2VsLnNuYXBdO1xuICAgIH1cbiAgICB2YXIgc3ZnO1xuICAgIHRyeSB7XG4gICAgICAgIHN2ZyA9IGVsLm93bmVyU1ZHRWxlbWVudDtcbiAgICB9IGNhdGNoKGUpIHt9XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubm9kZVxuICAgICBbIHByb3BlcnR5IChvYmplY3QpIF1cbiAgICAgKipcbiAgICAgKiBHaXZlcyB5b3UgYSByZWZlcmVuY2UgdG8gdGhlIERPTSBvYmplY3QsIHNvIHlvdSBjYW4gYXNzaWduIGV2ZW50IGhhbmRsZXJzIG9yIGp1c3QgbWVzcyBhcm91bmQuXG4gICAgID4gVXNhZ2VcbiAgICAgfCAvLyBkcmF3IGEgY2lyY2xlIGF0IGNvb3JkaW5hdGUgMTAsMTAgd2l0aCByYWRpdXMgb2YgMTBcbiAgICAgfCB2YXIgYyA9IHBhcGVyLmNpcmNsZSgxMCwgMTAsIDEwKTtcbiAgICAgfCBjLm5vZGUub25jbGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgfCAgICAgYy5hdHRyKFwiZmlsbFwiLCBcInJlZFwiKTtcbiAgICAgfCB9O1xuICAgIFxcKi9cbiAgICB0aGlzLm5vZGUgPSBlbDtcbiAgICBpZiAoc3ZnKSB7XG4gICAgICAgIHRoaXMucGFwZXIgPSBuZXcgUGFwZXIoc3ZnKTtcbiAgICB9XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudHlwZVxuICAgICBbIHByb3BlcnR5IChzdHJpbmcpIF1cbiAgICAgKipcbiAgICAgKiBTVkcgdGFnIG5hbWUgb2YgdGhlIGdpdmVuIGVsZW1lbnQuXG4gICAgXFwqL1xuICAgIHRoaXMudHlwZSA9IGVsLnRhZ05hbWUgfHwgZWwubm9kZU5hbWU7XG4gICAgdmFyIGlkID0gdGhpcy5pZCA9IElEKHRoaXMpO1xuICAgIHRoaXMuYW5pbXMgPSB7fTtcbiAgICB0aGlzLl8gPSB7XG4gICAgICAgIHRyYW5zZm9ybTogW11cbiAgICB9O1xuICAgIGVsLnNuYXAgPSBpZDtcbiAgICBodWJbaWRdID0gdGhpcztcbiAgICBpZiAodGhpcy50eXBlID09IFwiZ1wiKSB7XG4gICAgICAgIHRoaXMuYWRkID0gYWRkMmdyb3VwO1xuICAgIH1cbiAgICBpZiAodGhpcy50eXBlIGluIHtnOiAxLCBtYXNrOiAxLCBwYXR0ZXJuOiAxLCBzeW1ib2w6IDF9KSB7XG4gICAgICAgIGZvciAodmFyIG1ldGhvZCBpbiBQYXBlci5wcm90b3R5cGUpIGlmIChQYXBlci5wcm90b3R5cGVbaGFzXShtZXRob2QpKSB7XG4gICAgICAgICAgICB0aGlzW21ldGhvZF0gPSBQYXBlci5wcm90b3R5cGVbbWV0aG9kXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmF0dHJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEdldHMgb3Igc2V0cyBnaXZlbiBhdHRyaWJ1dGVzIG9mIHRoZSBlbGVtZW50LlxuICAgICAqKlxuICAgICAtIHBhcmFtcyAob2JqZWN0KSBjb250YWlucyBrZXktdmFsdWUgcGFpcnMgb2YgYXR0cmlidXRlcyB5b3Ugd2FudCB0byBzZXRcbiAgICAgKiBvclxuICAgICAtIHBhcmFtIChzdHJpbmcpIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZVxuICAgICA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICogb3JcbiAgICAgPSAoc3RyaW5nKSB2YWx1ZSBvZiBhdHRyaWJ1dGVcbiAgICAgPiBVc2FnZVxuICAgICB8IGVsLmF0dHIoe1xuICAgICB8ICAgICBmaWxsOiBcIiNmYzBcIixcbiAgICAgfCAgICAgc3Ryb2tlOiBcIiMwMDBcIixcbiAgICAgfCAgICAgc3Ryb2tlV2lkdGg6IDIsIC8vIENhbWVsQ2FzZS4uLlxuICAgICB8ICAgICBcImZpbGwtb3BhY2l0eVwiOiAwLjUsIC8vIG9yIGRhc2gtc2VwYXJhdGVkIG5hbWVzXG4gICAgIHwgICAgIHdpZHRoOiBcIio9MlwiIC8vIHByZWZpeGVkIHZhbHVlc1xuICAgICB8IH0pO1xuICAgICB8IGNvbnNvbGUubG9nKGVsLmF0dHIoXCJmaWxsXCIpKTsgLy8gI2ZjMFxuICAgICAqIFByZWZpeGVkIHZhbHVlcyBpbiBmb3JtYXQgYFwiKz0xMFwiYCBzdXBwb3J0ZWQuIEFsbCBmb3VyIG9wZXJhdGlvbnNcbiAgICAgKiAoYCtgLCBgLWAsIGAqYCBhbmQgYC9gKSBjb3VsZCBiZSB1c2VkLiBPcHRpb25hbGx5IHlvdSBjYW4gdXNlIHVuaXRzIGZvciBgK2BcbiAgICAgKiBhbmQgYC1gOiBgXCIrPTJlbVwiYC5cbiAgICBcXCovXG4gICAgRWxlbWVudC5wcm90b3R5cGUuYXR0ciA9IGZ1bmN0aW9uIChwYXJhbXMsIHZhbHVlKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMsXG4gICAgICAgICAgICBub2RlID0gZWwubm9kZTtcbiAgICAgICAgaWYgKCFwYXJhbXMpIHtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBub2RlLm5vZGVWYWx1ZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXR0ciA9IG5vZGUuYXR0cmlidXRlcyxcbiAgICAgICAgICAgICAgICBvdXQgPSB7fTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGF0dHIubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIG91dFthdHRyW2ldLm5vZGVOYW1lXSA9IGF0dHJbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXMocGFyYW1zLCBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIGpzb24gPSB7fTtcbiAgICAgICAgICAgICAgICBqc29uW3BhcmFtc10gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSBqc29uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZXZlKFwic25hcC51dGlsLmdldGF0dHIuXCIgKyBwYXJhbXMsIGVsKS5maXJzdERlZmluZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBhdHQgaW4gcGFyYW1zKSB7XG4gICAgICAgICAgICBpZiAocGFyYW1zW2hhc10oYXR0KSkge1xuICAgICAgICAgICAgICAgIGV2ZShcInNuYXAudXRpbC5hdHRyLlwiICsgYXR0LCBlbCwgcGFyYW1zW2F0dF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuLypcXFxuICogU25hcC5wYXJzZVxuIFsgbWV0aG9kIF1cbiAqKlxuICogUGFyc2VzIFNWRyBmcmFnbWVudCBhbmQgY29udmVydHMgaXQgaW50byBhIEBGcmFnbWVudFxuICoqXG4gLSBzdmcgKHN0cmluZykgU1ZHIHN0cmluZ1xuID0gKEZyYWdtZW50KSB0aGUgQEZyYWdtZW50XG5cXCovXG5TbmFwLnBhcnNlID0gZnVuY3Rpb24gKHN2Zykge1xuICAgIHZhciBmID0gZ2xvYi5kb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICBmdWxsID0gdHJ1ZSxcbiAgICAgICAgZGl2ID0gZ2xvYi5kb2MuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBzdmcgPSBTdHIoc3ZnKTtcbiAgICBpZiAoIXN2Zy5tYXRjaCgvXlxccyo8XFxzKnN2Zyg/Olxcc3w+KS8pKSB7XG4gICAgICAgIHN2ZyA9IFwiPHN2Zz5cIiArIHN2ZyArIFwiPC9zdmc+XCI7XG4gICAgICAgIGZ1bGwgPSBmYWxzZTtcbiAgICB9XG4gICAgZGl2LmlubmVySFRNTCA9IHN2ZztcbiAgICBzdmcgPSBkaXYuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdmdcIilbMF07XG4gICAgaWYgKHN2Zykge1xuICAgICAgICBpZiAoZnVsbCkge1xuICAgICAgICAgICAgZiA9IHN2ZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdoaWxlIChzdmcuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgIGYuYXBwZW5kQ2hpbGQoc3ZnLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBuZXcgRnJhZ21lbnQoZik7XG59O1xuZnVuY3Rpb24gRnJhZ21lbnQoZnJhZykge1xuICAgIHRoaXMubm9kZSA9IGZyYWc7XG59XG4vKlxcXG4gKiBTbmFwLmZyYWdtZW50XG4gWyBtZXRob2QgXVxuICoqXG4gKiBDcmVhdGVzIGEgRE9NIGZyYWdtZW50IGZyb20gYSBnaXZlbiBsaXN0IG9mIGVsZW1lbnRzIG9yIHN0cmluZ3NcbiAqKlxuIC0gdmFyYXJncyAo4oCmKSBTVkcgc3RyaW5nXG4gPSAoRnJhZ21lbnQpIHRoZSBARnJhZ21lbnRcblxcKi9cblNuYXAuZnJhZ21lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApLFxuICAgICAgICBmID0gZ2xvYi5kb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFyZ3MubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICB2YXIgaXRlbSA9IGFyZ3NbaV07XG4gICAgICAgIGlmIChpdGVtLm5vZGUgJiYgaXRlbS5ub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgICAgICBmLmFwcGVuZENoaWxkKGl0ZW0ubm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW0ubm9kZVR5cGUpIHtcbiAgICAgICAgICAgIGYuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGYuYXBwZW5kQ2hpbGQoU25hcC5wYXJzZShpdGVtKS5ub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEZyYWdtZW50KGYpO1xufTtcblxuZnVuY3Rpb24gbWFrZShuYW1lLCBwYXJlbnQpIHtcbiAgICB2YXIgcmVzID0gJChuYW1lKTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQocmVzKTtcbiAgICB2YXIgZWwgPSB3cmFwKHJlcyk7XG4gICAgcmV0dXJuIGVsO1xufVxuZnVuY3Rpb24gUGFwZXIodywgaCkge1xuICAgIHZhciByZXMsXG4gICAgICAgIGRlc2MsXG4gICAgICAgIGRlZnMsXG4gICAgICAgIHByb3RvID0gUGFwZXIucHJvdG90eXBlO1xuICAgIGlmICh3ICYmIHcudGFnTmFtZSA9PSBcInN2Z1wiKSB7XG4gICAgICAgIGlmICh3LnNuYXAgaW4gaHViKSB7XG4gICAgICAgICAgICByZXR1cm4gaHViW3cuc25hcF07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRvYyA9IHcub3duZXJEb2N1bWVudDtcbiAgICAgICAgcmVzID0gbmV3IEVsZW1lbnQodyk7XG4gICAgICAgIGRlc2MgPSB3LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiZGVzY1wiKVswXTtcbiAgICAgICAgZGVmcyA9IHcuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJkZWZzXCIpWzBdO1xuICAgICAgICBpZiAoIWRlc2MpIHtcbiAgICAgICAgICAgIGRlc2MgPSAkKFwiZGVzY1wiKTtcbiAgICAgICAgICAgIGRlc2MuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZVRleHROb2RlKFwiQ3JlYXRlZCB3aXRoIFNuYXBcIikpO1xuICAgICAgICAgICAgcmVzLm5vZGUuYXBwZW5kQ2hpbGQoZGVzYyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWZzKSB7XG4gICAgICAgICAgICBkZWZzID0gJChcImRlZnNcIik7XG4gICAgICAgICAgICByZXMubm9kZS5hcHBlbmRDaGlsZChkZWZzKTtcbiAgICAgICAgfVxuICAgICAgICByZXMuZGVmcyA9IGRlZnM7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwcm90bykgaWYgKHByb3RvW2hhc10oa2V5KSkge1xuICAgICAgICAgICAgcmVzW2tleV0gPSBwcm90b1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHJlcy5wYXBlciA9IHJlcy5yb290ID0gcmVzO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcyA9IG1ha2UoXCJzdmdcIiwgZ2xvYi5kb2MuYm9keSk7XG4gICAgICAgICQocmVzLm5vZGUsIHtcbiAgICAgICAgICAgIGhlaWdodDogaCxcbiAgICAgICAgICAgIHZlcnNpb246IDEuMSxcbiAgICAgICAgICAgIHdpZHRoOiB3LFxuICAgICAgICAgICAgeG1sbnM6IHhtbG5zXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gcmVzO1xufVxuZnVuY3Rpb24gd3JhcChkb20pIHtcbiAgICBpZiAoIWRvbSkge1xuICAgICAgICByZXR1cm4gZG9tO1xuICAgIH1cbiAgICBpZiAoZG9tIGluc3RhbmNlb2YgRWxlbWVudCB8fCBkb20gaW5zdGFuY2VvZiBGcmFnbWVudCkge1xuICAgICAgICByZXR1cm4gZG9tO1xuICAgIH1cbiAgICBpZiAoZG9tLnRhZ05hbWUgJiYgZG9tLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PSBcInN2Z1wiKSB7XG4gICAgICAgIHJldHVybiBuZXcgUGFwZXIoZG9tKTtcbiAgICB9XG4gICAgaWYgKGRvbS50YWdOYW1lICYmIGRvbS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJvYmplY3RcIiAmJiBkb20udHlwZSA9PSBcImltYWdlL3N2Zyt4bWxcIikge1xuICAgICAgICByZXR1cm4gbmV3IFBhcGVyKGRvbS5jb250ZW50RG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzdmdcIilbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEVsZW1lbnQoZG9tKTtcbn1cblxuU25hcC5fLm1ha2UgPSBtYWtlO1xuU25hcC5fLndyYXAgPSB3cmFwO1xuLypcXFxuICogUGFwZXIuZWxcbiBbIG1ldGhvZCBdXG4gKipcbiAqIENyZWF0ZXMgYW4gZWxlbWVudCBvbiBwYXBlciB3aXRoIGEgZ2l2ZW4gbmFtZSBhbmQgbm8gYXR0cmlidXRlc1xuICoqXG4gLSBuYW1lIChzdHJpbmcpIHRhZyBuYW1lXG4gLSBhdHRyIChvYmplY3QpIGF0dHJpYnV0ZXNcbiA9IChFbGVtZW50KSB0aGUgY3VycmVudCBlbGVtZW50XG4gPiBVc2FnZVxuIHwgdmFyIGMgPSBwYXBlci5jaXJjbGUoMTAsIDEwLCAxMCk7IC8vIGlzIHRoZSBzYW1lIGFzLi4uXG4gfCB2YXIgYyA9IHBhcGVyLmVsKFwiY2lyY2xlXCIpLmF0dHIoe1xuIHwgICAgIGN4OiAxMCxcbiB8ICAgICBjeTogMTAsXG4gfCAgICAgcjogMTBcbiB8IH0pO1xuIHwgLy8gYW5kIHRoZSBzYW1lIGFzXG4gfCB2YXIgYyA9IHBhcGVyLmVsKFwiY2lyY2xlXCIsIHtcbiB8ICAgICBjeDogMTAsXG4gfCAgICAgY3k6IDEwLFxuIHwgICAgIHI6IDEwXG4gfCB9KTtcblxcKi9cblBhcGVyLnByb3RvdHlwZS5lbCA9IGZ1bmN0aW9uIChuYW1lLCBhdHRyKSB7XG4gICAgdmFyIGVsID0gbWFrZShuYW1lLCB0aGlzLm5vZGUpO1xuICAgIGF0dHIgJiYgZWwuYXR0cihhdHRyKTtcbiAgICByZXR1cm4gZWw7XG59O1xuLypcXFxuICogRWxlbWVudC5jaGlsZHJlblxuIFsgbWV0aG9kIF1cbiAqKlxuICogUmV0dXJucyBhcnJheSBvZiBhbGwgdGhlIGNoaWxkcmVuIG9mIHRoZSBlbGVtZW50LlxuID0gKGFycmF5KSBhcnJheSBvZiBFbGVtZW50c1xuXFwqL1xuRWxlbWVudC5wcm90b3R5cGUuY2hpbGRyZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG91dCA9IFtdLFxuICAgICAgICBjaCA9IHRoaXMubm9kZS5jaGlsZE5vZGVzO1xuICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGNoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgb3V0W2ldID0gU25hcChjaFtpXSk7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG59O1xuZnVuY3Rpb24ganNvbkZpbGxlcihyb290LCBvKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcm9vdC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6IHJvb3RbaV0udHlwZSxcbiAgICAgICAgICAgICAgICBhdHRyOiByb290W2ldLmF0dHIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNoaWxkcmVuID0gcm9vdFtpXS5jaGlsZHJlbigpO1xuICAgICAgICBvLnB1c2goaXRlbSk7XG4gICAgICAgIGlmIChjaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIGpzb25GaWxsZXIoY2hpbGRyZW4sIGl0ZW0uY2hpbGROb2RlcyA9IFtdKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8qXFxcbiAqIEVsZW1lbnQudG9KU09OXG4gWyBtZXRob2QgXVxuICoqXG4gKiBSZXR1cm5zIG9iamVjdCByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gZWxlbWVudCBhbmQgYWxsIGl0cyBjaGlsZHJlbi5cbiA9IChvYmplY3QpIGluIGZvcm1hdFxuIG8ge1xuIG8gICAgIHR5cGUgKHN0cmluZykgdGhpcy50eXBlLFxuIG8gICAgIGF0dHIgKG9iamVjdCkgYXR0cmlidXRlcyBtYXAsXG4gbyAgICAgY2hpbGROb2RlcyAoYXJyYXkpIG9wdGlvbmFsIGFycmF5IG9mIGNoaWxkcmVuIGluIHRoZSBzYW1lIGZvcm1hdFxuIG8gfVxuXFwqL1xuRWxlbWVudC5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBvdXQgPSBbXTtcbiAgICBqc29uRmlsbGVyKFt0aGlzXSwgb3V0KTtcbiAgICByZXR1cm4gb3V0WzBdO1xufTtcbi8vIGRlZmF1bHRcbmV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgYXR0ID0gZXZlLm50KCk7XG4gICAgYXR0ID0gYXR0LnN1YnN0cmluZyhhdHQubGFzdEluZGV4T2YoXCIuXCIpICsgMSk7XG4gICAgdmFyIGNzcyA9IGF0dC5yZXBsYWNlKC9bQS1aXS9nLCBmdW5jdGlvbiAobGV0dGVyKSB7XG4gICAgICAgIHJldHVybiBcIi1cIiArIGxldHRlci50b0xvd2VyQ2FzZSgpO1xuICAgIH0pO1xuICAgIGlmIChjc3NBdHRyW2hhc10oY3NzKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2RlLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5vZGUsIG51bGwpLmdldFByb3BlcnR5VmFsdWUoY3NzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gJCh0aGlzLm5vZGUsIGF0dCk7XG4gICAgfVxufSk7XG52YXIgY3NzQXR0ciA9IHtcbiAgICBcImFsaWdubWVudC1iYXNlbGluZVwiOiAwLFxuICAgIFwiYmFzZWxpbmUtc2hpZnRcIjogMCxcbiAgICBcImNsaXBcIjogMCxcbiAgICBcImNsaXAtcGF0aFwiOiAwLFxuICAgIFwiY2xpcC1ydWxlXCI6IDAsXG4gICAgXCJjb2xvclwiOiAwLFxuICAgIFwiY29sb3ItaW50ZXJwb2xhdGlvblwiOiAwLFxuICAgIFwiY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzXCI6IDAsXG4gICAgXCJjb2xvci1wcm9maWxlXCI6IDAsXG4gICAgXCJjb2xvci1yZW5kZXJpbmdcIjogMCxcbiAgICBcImN1cnNvclwiOiAwLFxuICAgIFwiZGlyZWN0aW9uXCI6IDAsXG4gICAgXCJkaXNwbGF5XCI6IDAsXG4gICAgXCJkb21pbmFudC1iYXNlbGluZVwiOiAwLFxuICAgIFwiZW5hYmxlLWJhY2tncm91bmRcIjogMCxcbiAgICBcImZpbGxcIjogMCxcbiAgICBcImZpbGwtb3BhY2l0eVwiOiAwLFxuICAgIFwiZmlsbC1ydWxlXCI6IDAsXG4gICAgXCJmaWx0ZXJcIjogMCxcbiAgICBcImZsb29kLWNvbG9yXCI6IDAsXG4gICAgXCJmbG9vZC1vcGFjaXR5XCI6IDAsXG4gICAgXCJmb250XCI6IDAsXG4gICAgXCJmb250LWZhbWlseVwiOiAwLFxuICAgIFwiZm9udC1zaXplXCI6IDAsXG4gICAgXCJmb250LXNpemUtYWRqdXN0XCI6IDAsXG4gICAgXCJmb250LXN0cmV0Y2hcIjogMCxcbiAgICBcImZvbnQtc3R5bGVcIjogMCxcbiAgICBcImZvbnQtdmFyaWFudFwiOiAwLFxuICAgIFwiZm9udC13ZWlnaHRcIjogMCxcbiAgICBcImdseXBoLW9yaWVudGF0aW9uLWhvcml6b250YWxcIjogMCxcbiAgICBcImdseXBoLW9yaWVudGF0aW9uLXZlcnRpY2FsXCI6IDAsXG4gICAgXCJpbWFnZS1yZW5kZXJpbmdcIjogMCxcbiAgICBcImtlcm5pbmdcIjogMCxcbiAgICBcImxldHRlci1zcGFjaW5nXCI6IDAsXG4gICAgXCJsaWdodGluZy1jb2xvclwiOiAwLFxuICAgIFwibWFya2VyXCI6IDAsXG4gICAgXCJtYXJrZXItZW5kXCI6IDAsXG4gICAgXCJtYXJrZXItbWlkXCI6IDAsXG4gICAgXCJtYXJrZXItc3RhcnRcIjogMCxcbiAgICBcIm1hc2tcIjogMCxcbiAgICBcIm9wYWNpdHlcIjogMCxcbiAgICBcIm92ZXJmbG93XCI6IDAsXG4gICAgXCJwb2ludGVyLWV2ZW50c1wiOiAwLFxuICAgIFwic2hhcGUtcmVuZGVyaW5nXCI6IDAsXG4gICAgXCJzdG9wLWNvbG9yXCI6IDAsXG4gICAgXCJzdG9wLW9wYWNpdHlcIjogMCxcbiAgICBcInN0cm9rZVwiOiAwLFxuICAgIFwic3Ryb2tlLWRhc2hhcnJheVwiOiAwLFxuICAgIFwic3Ryb2tlLWRhc2hvZmZzZXRcIjogMCxcbiAgICBcInN0cm9rZS1saW5lY2FwXCI6IDAsXG4gICAgXCJzdHJva2UtbGluZWpvaW5cIjogMCxcbiAgICBcInN0cm9rZS1taXRlcmxpbWl0XCI6IDAsXG4gICAgXCJzdHJva2Utb3BhY2l0eVwiOiAwLFxuICAgIFwic3Ryb2tlLXdpZHRoXCI6IDAsXG4gICAgXCJ0ZXh0LWFuY2hvclwiOiAwLFxuICAgIFwidGV4dC1kZWNvcmF0aW9uXCI6IDAsXG4gICAgXCJ0ZXh0LXJlbmRlcmluZ1wiOiAwLFxuICAgIFwidW5pY29kZS1iaWRpXCI6IDAsXG4gICAgXCJ2aXNpYmlsaXR5XCI6IDAsXG4gICAgXCJ3b3JkLXNwYWNpbmdcIjogMCxcbiAgICBcIndyaXRpbmctbW9kZVwiOiAwXG59O1xuXG5ldmUub24oXCJzbmFwLnV0aWwuYXR0clwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICB2YXIgYXR0ID0gZXZlLm50KCksXG4gICAgICAgIGF0dHIgPSB7fTtcbiAgICBhdHQgPSBhdHQuc3Vic3RyaW5nKGF0dC5sYXN0SW5kZXhPZihcIi5cIikgKyAxKTtcbiAgICBhdHRyW2F0dF0gPSB2YWx1ZTtcbiAgICB2YXIgc3R5bGUgPSBhdHQucmVwbGFjZSgvLShcXHcpL2dpLCBmdW5jdGlvbiAoYWxsLCBsZXR0ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBsZXR0ZXIudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSksXG4gICAgICAgIGNzcyA9IGF0dC5yZXBsYWNlKC9bQS1aXS9nLCBmdW5jdGlvbiAobGV0dGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gXCItXCIgKyBsZXR0ZXIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfSk7XG4gICAgaWYgKGNzc0F0dHJbaGFzXShjc3MpKSB7XG4gICAgICAgIHRoaXMubm9kZS5zdHlsZVtzdHlsZV0gPSB2YWx1ZSA9PSBudWxsID8gRSA6IHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgICQodGhpcy5ub2RlLCBhdHRyKTtcbiAgICB9XG59KTtcbihmdW5jdGlvbiAocHJvdG8pIHt9KFBhcGVyLnByb3RvdHlwZSkpO1xuXG4vLyBzaW1wbGUgYWpheFxuLypcXFxuICogU25hcC5hamF4XG4gWyBtZXRob2QgXVxuICoqXG4gKiBTaW1wbGUgaW1wbGVtZW50YXRpb24gb2YgQWpheFxuICoqXG4gLSB1cmwgKHN0cmluZykgVVJMXG4gLSBwb3N0RGF0YSAob2JqZWN0fHN0cmluZykgZGF0YSBmb3IgcG9zdCByZXF1ZXN0XG4gLSBjYWxsYmFjayAoZnVuY3Rpb24pIGNhbGxiYWNrXG4gLSBzY29wZSAob2JqZWN0KSAjb3B0aW9uYWwgc2NvcGUgb2YgY2FsbGJhY2tcbiAqIG9yXG4gLSB1cmwgKHN0cmluZykgVVJMXG4gLSBjYWxsYmFjayAoZnVuY3Rpb24pIGNhbGxiYWNrXG4gLSBzY29wZSAob2JqZWN0KSAjb3B0aW9uYWwgc2NvcGUgb2YgY2FsbGJhY2tcbiA9IChYTUxIdHRwUmVxdWVzdCkgdGhlIFhNTEh0dHBSZXF1ZXN0IG9iamVjdCwganVzdCBpbiBjYXNlXG5cXCovXG5TbmFwLmFqYXggPSBmdW5jdGlvbiAodXJsLCBwb3N0RGF0YSwgY2FsbGJhY2ssIHNjb3BlKXtcbiAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0LFxuICAgICAgICBpZCA9IElEKCk7XG4gICAgaWYgKHJlcSkge1xuICAgICAgICBpZiAoaXMocG9zdERhdGEsIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgIHNjb3BlID0gY2FsbGJhY2s7XG4gICAgICAgICAgICBjYWxsYmFjayA9IHBvc3REYXRhO1xuICAgICAgICAgICAgcG9zdERhdGEgPSBudWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGlzKHBvc3REYXRhLCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgdmFyIHBkID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gcG9zdERhdGEpIGlmIChwb3N0RGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgcGQucHVzaChlbmNvZGVVUklDb21wb25lbnQoa2V5KSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHBvc3REYXRhW2tleV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBvc3REYXRhID0gcGQuam9pbihcIiZcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmVxLm9wZW4oKHBvc3REYXRhID8gXCJQT1NUXCIgOiBcIkdFVFwiKSwgdXJsLCB0cnVlKTtcbiAgICAgICAgaWYgKHBvc3REYXRhKSB7XG4gICAgICAgICAgICByZXEuc2V0UmVxdWVzdEhlYWRlcihcIlgtUmVxdWVzdGVkLVdpdGhcIiwgXCJYTUxIdHRwUmVxdWVzdFwiKTtcbiAgICAgICAgICAgIHJlcS5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgZXZlLm9uY2UoXCJzbmFwLmFqYXguXCIgKyBpZCArIFwiLjBcIiwgY2FsbGJhY2spO1xuICAgICAgICAgICAgZXZlLm9uY2UoXCJzbmFwLmFqYXguXCIgKyBpZCArIFwiLjIwMFwiLCBjYWxsYmFjayk7XG4gICAgICAgICAgICBldmUub25jZShcInNuYXAuYWpheC5cIiArIGlkICsgXCIuMzA0XCIsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgIT0gNCkgcmV0dXJuO1xuICAgICAgICAgICAgZXZlKFwic25hcC5hamF4LlwiICsgaWQgKyBcIi5cIiArIHJlcS5zdGF0dXMsIHNjb3BlLCByZXEpO1xuICAgICAgICB9O1xuICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT0gNCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlcTtcbiAgICAgICAgfVxuICAgICAgICByZXEuc2VuZChwb3N0RGF0YSk7XG4gICAgICAgIHJldHVybiByZXE7XG4gICAgfVxufTtcbi8qXFxcbiAqIFNuYXAubG9hZFxuIFsgbWV0aG9kIF1cbiAqKlxuICogTG9hZHMgZXh0ZXJuYWwgU1ZHIGZpbGUgYXMgYSBARnJhZ21lbnQgKHNlZSBAU25hcC5hamF4IGZvciBtb3JlIGFkdmFuY2VkIEFKQVgpXG4gKipcbiAtIHVybCAoc3RyaW5nKSBVUkxcbiAtIGNhbGxiYWNrIChmdW5jdGlvbikgY2FsbGJhY2tcbiAtIHNjb3BlIChvYmplY3QpICNvcHRpb25hbCBzY29wZSBvZiBjYWxsYmFja1xuXFwqL1xuU25hcC5sb2FkID0gZnVuY3Rpb24gKHVybCwgY2FsbGJhY2ssIHNjb3BlKSB7XG4gICAgU25hcC5hamF4KHVybCwgZnVuY3Rpb24gKHJlcSkge1xuICAgICAgICB2YXIgZiA9IFNuYXAucGFyc2UocmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgIHNjb3BlID8gY2FsbGJhY2suY2FsbChzY29wZSwgZikgOiBjYWxsYmFjayhmKTtcbiAgICB9KTtcbn07XG52YXIgZ2V0T2Zmc2V0ID0gZnVuY3Rpb24gKGVsZW0pIHtcbiAgICB2YXIgYm94ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgZG9jID0gZWxlbS5vd25lckRvY3VtZW50LFxuICAgICAgICBib2R5ID0gZG9jLmJvZHksXG4gICAgICAgIGRvY0VsZW0gPSBkb2MuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgICBjbGllbnRUb3AgPSBkb2NFbGVtLmNsaWVudFRvcCB8fCBib2R5LmNsaWVudFRvcCB8fCAwLCBjbGllbnRMZWZ0ID0gZG9jRWxlbS5jbGllbnRMZWZ0IHx8IGJvZHkuY2xpZW50TGVmdCB8fCAwLFxuICAgICAgICB0b3AgID0gYm94LnRvcCAgKyAoZy53aW4ucGFnZVlPZmZzZXQgfHwgZG9jRWxlbS5zY3JvbGxUb3AgfHwgYm9keS5zY3JvbGxUb3AgKSAtIGNsaWVudFRvcCxcbiAgICAgICAgbGVmdCA9IGJveC5sZWZ0ICsgKGcud2luLnBhZ2VYT2Zmc2V0IHx8IGRvY0VsZW0uc2Nyb2xsTGVmdCB8fCBib2R5LnNjcm9sbExlZnQpIC0gY2xpZW50TGVmdDtcbiAgICByZXR1cm4ge1xuICAgICAgICB5OiB0b3AsXG4gICAgICAgIHg6IGxlZnRcbiAgICB9O1xufTtcbi8qXFxcbiAqIFNuYXAuZ2V0RWxlbWVudEJ5UG9pbnRcbiBbIG1ldGhvZCBdXG4gKipcbiAqIFJldHVybnMgeW91IHRvcG1vc3QgZWxlbWVudCB1bmRlciBnaXZlbiBwb2ludC5cbiAqKlxuID0gKG9iamVjdCkgU25hcCBlbGVtZW50IG9iamVjdFxuIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgZnJvbSB0aGUgdG9wIGxlZnQgY29ybmVyIG9mIHRoZSB3aW5kb3dcbiAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIGZyb20gdGhlIHRvcCBsZWZ0IGNvcm5lciBvZiB0aGUgd2luZG93XG4gPiBVc2FnZVxuIHwgU25hcC5nZXRFbGVtZW50QnlQb2ludChtb3VzZVgsIG1vdXNlWSkuYXR0cih7c3Ryb2tlOiBcIiNmMDBcIn0pO1xuXFwqL1xuU25hcC5nZXRFbGVtZW50QnlQb2ludCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdmFyIHBhcGVyID0gdGhpcyxcbiAgICAgICAgc3ZnID0gcGFwZXIuY2FudmFzLFxuICAgICAgICB0YXJnZXQgPSBnbG9iLmRvYy5lbGVtZW50RnJvbVBvaW50KHgsIHkpO1xuICAgIGlmIChnbG9iLndpbi5vcGVyYSAmJiB0YXJnZXQudGFnTmFtZSA9PSBcInN2Z1wiKSB7XG4gICAgICAgIHZhciBzbyA9IGdldE9mZnNldCh0YXJnZXQpLFxuICAgICAgICAgICAgc3IgPSB0YXJnZXQuY3JlYXRlU1ZHUmVjdCgpO1xuICAgICAgICBzci54ID0geCAtIHNvLng7XG4gICAgICAgIHNyLnkgPSB5IC0gc28ueTtcbiAgICAgICAgc3Iud2lkdGggPSBzci5oZWlnaHQgPSAxO1xuICAgICAgICB2YXIgaGl0cyA9IHRhcmdldC5nZXRJbnRlcnNlY3Rpb25MaXN0KHNyLCBudWxsKTtcbiAgICAgICAgaWYgKGhpdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSBoaXRzW2hpdHMubGVuZ3RoIC0gMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB3cmFwKHRhcmdldCk7XG59O1xuLypcXFxuICogU25hcC5wbHVnaW5cbiBbIG1ldGhvZCBdXG4gKipcbiAqIExldCB5b3Ugd3JpdGUgcGx1Z2lucy4gWW91IHBhc3MgaW4gYSBmdW5jdGlvbiB3aXRoIGZpdmUgYXJndW1lbnRzLCBsaWtlIHRoaXM6XG4gfCBTbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2JhbCwgRnJhZ21lbnQpIHtcbiB8ICAgICBTbmFwLm5ld21ldGhvZCA9IGZ1bmN0aW9uICgpIHt9O1xuIHwgICAgIEVsZW1lbnQucHJvdG90eXBlLm5ld21ldGhvZCA9IGZ1bmN0aW9uICgpIHt9O1xuIHwgICAgIFBhcGVyLnByb3RvdHlwZS5uZXdtZXRob2QgPSBmdW5jdGlvbiAoKSB7fTtcbiB8IH0pO1xuICogSW5zaWRlIHRoZSBmdW5jdGlvbiB5b3UgaGF2ZSBhY2Nlc3MgdG8gYWxsIG1haW4gb2JqZWN0cyAoYW5kIHRoZWlyXG4gKiBwcm90b3R5cGVzKS4gVGhpcyBhbGxvdyB5b3UgdG8gZXh0ZW5kIGFueXRoaW5nIHlvdSB3YW50LlxuICoqXG4gLSBmIChmdW5jdGlvbikgeW91ciBwbHVnaW4gYm9keVxuXFwqL1xuU25hcC5wbHVnaW4gPSBmdW5jdGlvbiAoZikge1xuICAgIGYoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KTtcbn07XG5nbG9iLndpbi5TbmFwID0gU25hcDtcbnJldHVybiBTbmFwO1xufSh3aW5kb3cgfHwgdGhpcykpO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy9cbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KSB7XG4gICAgdmFyIGVscHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZSxcbiAgICAgICAgaXMgPSBTbmFwLmlzLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIHVuaXQycHggPSBTbmFwLl91bml0MnB4LFxuICAgICAgICAkID0gU25hcC5fLiQsXG4gICAgICAgIG1ha2UgPSBTbmFwLl8ubWFrZSxcbiAgICAgICAgZ2V0U29tZURlZnMgPSBTbmFwLl8uZ2V0U29tZURlZnMsXG4gICAgICAgIGhhcyA9IFwiaGFzT3duUHJvcGVydHlcIixcbiAgICAgICAgd3JhcCA9IFNuYXAuXy53cmFwO1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmdldEJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCBkZXNjcmlwdG9yIGZvciB0aGUgZ2l2ZW4gZWxlbWVudFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIGJvdW5kaW5nIGJveCBkZXNjcmlwdG9yOlxuICAgICBvIHtcbiAgICAgbyAgICAgY3g6IChudW1iZXIpIHggb2YgdGhlIGNlbnRlcixcbiAgICAgbyAgICAgY3k6IChudW1iZXIpIHggb2YgdGhlIGNlbnRlcixcbiAgICAgbyAgICAgaDogKG51bWJlcikgaGVpZ2h0LFxuICAgICBvICAgICBoZWlnaHQ6IChudW1iZXIpIGhlaWdodCxcbiAgICAgbyAgICAgcGF0aDogKHN0cmluZykgcGF0aCBjb21tYW5kIGZvciB0aGUgYm94LFxuICAgICBvICAgICByMDogKG51bWJlcikgcmFkaXVzIG9mIGEgY2lyY2xlIHRoYXQgZnVsbHkgZW5jbG9zZXMgdGhlIGJveCxcbiAgICAgbyAgICAgcjE6IChudW1iZXIpIHJhZGl1cyBvZiB0aGUgc21hbGxlc3QgY2lyY2xlIHRoYXQgY2FuIGJlIGVuY2xvc2VkLFxuICAgICBvICAgICByMjogKG51bWJlcikgcmFkaXVzIG9mIHRoZSBsYXJnZXN0IGNpcmNsZSB0aGF0IGNhbiBiZSBlbmNsb3NlZCxcbiAgICAgbyAgICAgdmI6IChzdHJpbmcpIGJveCBhcyBhIHZpZXdib3ggY29tbWFuZCxcbiAgICAgbyAgICAgdzogKG51bWJlcikgd2lkdGgsXG4gICAgIG8gICAgIHdpZHRoOiAobnVtYmVyKSB3aWR0aCxcbiAgICAgbyAgICAgeDI6IChudW1iZXIpIHggb2YgdGhlIHJpZ2h0IHNpZGUsXG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggb2YgdGhlIGxlZnQgc2lkZSxcbiAgICAgbyAgICAgeTI6IChudW1iZXIpIHkgb2YgdGhlIGJvdHRvbSBlZGdlLFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IG9mIHRoZSB0b3AgZWRnZVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRCQm94ID0gZnVuY3Rpb24gKGlzV2l0aG91dFRyYW5zZm9ybSkge1xuICAgICAgICBpZiAoIVNuYXAuTWF0cml4IHx8ICFTbmFwLnBhdGgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0QkJveCgpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbCA9IHRoaXMsXG4gICAgICAgICAgICBtID0gbmV3IFNuYXAuTWF0cml4O1xuICAgICAgICBpZiAoZWwucmVtb3ZlZCkge1xuICAgICAgICAgICAgcmV0dXJuIFNuYXAuXy5ib3goKTtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoZWwudHlwZSA9PSBcInVzZVwiKSB7XG4gICAgICAgICAgICBpZiAoIWlzV2l0aG91dFRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgIG0gPSBtLmFkZChlbC50cmFuc2Zvcm0oKS5sb2NhbE1hdHJpeC50cmFuc2xhdGUoZWwuYXR0cihcInhcIikgfHwgMCwgZWwuYXR0cihcInlcIikgfHwgMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVsLm9yaWdpbmFsKSB7XG4gICAgICAgICAgICAgICAgZWwgPSBlbC5vcmlnaW5hbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGhyZWYgPSBlbC5hdHRyKFwieGxpbms6aHJlZlwiKTtcbiAgICAgICAgICAgICAgICBlbCA9IGVsLm9yaWdpbmFsID0gZWwubm9kZS5vd25lckRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGhyZWYuc3Vic3RyaW5nKGhyZWYuaW5kZXhPZihcIiNcIikgKyAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIF8gPSBlbC5fLFxuICAgICAgICAgICAgcGF0aGZpbmRlciA9IFNuYXAucGF0aC5nZXRbZWwudHlwZV0gfHwgU25hcC5wYXRoLmdldC5kZWZsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChpc1dpdGhvdXRUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgICAgICBfLmJib3h3dCA9IHBhdGhmaW5kZXIgPyBTbmFwLnBhdGguZ2V0QkJveChlbC5yZWFsUGF0aCA9IHBhdGhmaW5kZXIoZWwpKSA6IFNuYXAuXy5ib3goZWwubm9kZS5nZXRCQm94KCkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBTbmFwLl8uYm94KF8uYmJveHd0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWwucmVhbFBhdGggPSBwYXRoZmluZGVyKGVsKTtcbiAgICAgICAgICAgICAgICBlbC5tYXRyaXggPSBlbC50cmFuc2Zvcm0oKS5sb2NhbE1hdHJpeDtcbiAgICAgICAgICAgICAgICBfLmJib3ggPSBTbmFwLnBhdGguZ2V0QkJveChTbmFwLnBhdGgubWFwKGVsLnJlYWxQYXRoLCBtLmFkZChlbC5tYXRyaXgpKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNuYXAuXy5ib3goXy5iYm94KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gRmlyZWZveCBkb2VzbuKAmXQgZ2l2ZSB5b3UgYmJveCBvZiBoaWRkZW4gZWxlbWVudFxuICAgICAgICAgICAgcmV0dXJuIFNuYXAuXy5ib3goKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdmFyIHByb3BTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmluZztcbiAgICB9O1xuICAgIGZ1bmN0aW9uIGV4dHJhY3RUcmFuc2Zvcm0oZWwsIHRzdHIpIHtcbiAgICAgICAgaWYgKHRzdHIgPT0gbnVsbCkge1xuICAgICAgICAgICAgdmFyIGRvUmV0dXJuID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChlbC50eXBlID09IFwibGluZWFyR3JhZGllbnRcIiB8fCBlbC50eXBlID09IFwicmFkaWFsR3JhZGllbnRcIikge1xuICAgICAgICAgICAgICAgIHRzdHIgPSBlbC5ub2RlLmdldEF0dHJpYnV0ZShcImdyYWRpZW50VHJhbnNmb3JtXCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChlbC50eXBlID09IFwicGF0dGVyblwiKSB7XG4gICAgICAgICAgICAgICAgdHN0ciA9IGVsLm5vZGUuZ2V0QXR0cmlidXRlKFwicGF0dGVyblRyYW5zZm9ybVwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHN0ciA9IGVsLm5vZGUuZ2V0QXR0cmlidXRlKFwidHJhbnNmb3JtXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0c3RyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTbmFwLk1hdHJpeDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRzdHIgPSBTbmFwLl8uc3ZnVHJhbnNmb3JtMnN0cmluZyh0c3RyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICghU25hcC5fLnJnVHJhbnNmb3JtLnRlc3QodHN0cikpIHtcbiAgICAgICAgICAgICAgICB0c3RyID0gU25hcC5fLnN2Z1RyYW5zZm9ybTJzdHJpbmcodHN0cik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRzdHIgPSBTdHIodHN0cikucmVwbGFjZSgvXFwuezN9fFxcdTIwMjYvZywgZWwuXy50cmFuc2Zvcm0gfHwgXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXModHN0ciwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgICAgIHRzdHIgPSBTbmFwLnBhdGggPyBTbmFwLnBhdGgudG9TdHJpbmcuY2FsbCh0c3RyKSA6IFN0cih0c3RyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsLl8udHJhbnNmb3JtID0gdHN0cjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbSA9IFNuYXAuXy50cmFuc2Zvcm0ybWF0cml4KHRzdHIsIGVsLmdldEJCb3goMSkpO1xuICAgICAgICBpZiAoZG9SZXR1cm4pIHtcbiAgICAgICAgICAgIHJldHVybiBtO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWwubWF0cml4ID0gbTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50cmFuc2Zvcm1cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEdldHMgb3Igc2V0cyB0cmFuc2Zvcm1hdGlvbiBvZiB0aGUgZWxlbWVudFxuICAgICAqKlxuICAgICAtIHRzdHIgKHN0cmluZykgdHJhbnNmb3JtIHN0cmluZyBpbiBTbmFwIG9yIFNWRyBmb3JtYXRcbiAgICAgPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAqIG9yXG4gICAgID0gKG9iamVjdCkgdHJhbnNmb3JtYXRpb24gZGVzY3JpcHRvcjpcbiAgICAgbyB7XG4gICAgIG8gICAgIHN0cmluZyAoc3RyaW5nKSB0cmFuc2Zvcm0gc3RyaW5nLFxuICAgICBvICAgICBnbG9iYWxNYXRyaXggKE1hdHJpeCkgbWF0cml4IG9mIGFsbCB0cmFuc2Zvcm1hdGlvbnMgYXBwbGllZCB0byBlbGVtZW50IG9yIGl0cyBwYXJlbnRzLFxuICAgICBvICAgICBsb2NhbE1hdHJpeCAoTWF0cml4KSBtYXRyaXggb2YgdHJhbnNmb3JtYXRpb25zIGFwcGxpZWQgb25seSB0byB0aGUgZWxlbWVudCxcbiAgICAgbyAgICAgZGlmZk1hdHJpeCAoTWF0cml4KSBtYXRyaXggb2YgZGlmZmVyZW5jZSBiZXR3ZWVuIGdsb2JhbCBhbmQgbG9jYWwgdHJhbnNmb3JtYXRpb25zLFxuICAgICBvICAgICBnbG9iYWwgKHN0cmluZykgZ2xvYmFsIHRyYW5zZm9ybWF0aW9uIGFzIHN0cmluZyxcbiAgICAgbyAgICAgbG9jYWwgKHN0cmluZykgbG9jYWwgdHJhbnNmb3JtYXRpb24gYXMgc3RyaW5nLFxuICAgICBvICAgICB0b1N0cmluZyAoZnVuY3Rpb24pIHJldHVybnMgYHN0cmluZ2AgcHJvcGVydHlcbiAgICAgbyB9XG4gICAgXFwqL1xuICAgIGVscHJvdG8udHJhbnNmb3JtID0gZnVuY3Rpb24gKHRzdHIpIHtcbiAgICAgICAgdmFyIF8gPSB0aGlzLl87XG4gICAgICAgIGlmICh0c3RyID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBwYXBhID0gdGhpcyxcbiAgICAgICAgICAgICAgICBnbG9iYWwgPSBuZXcgU25hcC5NYXRyaXgodGhpcy5ub2RlLmdldENUTSgpKSxcbiAgICAgICAgICAgICAgICBsb2NhbCA9IGV4dHJhY3RUcmFuc2Zvcm0odGhpcyksXG4gICAgICAgICAgICAgICAgbXMgPSBbbG9jYWxdLFxuICAgICAgICAgICAgICAgIG0gPSBuZXcgU25hcC5NYXRyaXgsXG4gICAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgICBsb2NhbFN0cmluZyA9IGxvY2FsLnRvVHJhbnNmb3JtU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgc3RyaW5nID0gU3RyKGxvY2FsKSA9PSBTdHIodGhpcy5tYXRyaXgpID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTdHIoXy50cmFuc2Zvcm0pIDogbG9jYWxTdHJpbmc7XG4gICAgICAgICAgICB3aGlsZSAocGFwYS50eXBlICE9IFwic3ZnXCIgJiYgKHBhcGEgPSBwYXBhLnBhcmVudCgpKSkge1xuICAgICAgICAgICAgICAgIG1zLnB1c2goZXh0cmFjdFRyYW5zZm9ybShwYXBhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpID0gbXMubGVuZ3RoO1xuICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgIG0uYWRkKG1zW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RyaW5nOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgZ2xvYmFsTWF0cml4OiBnbG9iYWwsXG4gICAgICAgICAgICAgICAgdG90YWxNYXRyaXg6IG0sXG4gICAgICAgICAgICAgICAgbG9jYWxNYXRyaXg6IGxvY2FsLFxuICAgICAgICAgICAgICAgIGRpZmZNYXRyaXg6IGdsb2JhbC5jbG9uZSgpLmFkZChsb2NhbC5pbnZlcnQoKSksXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiBnbG9iYWwudG9UcmFuc2Zvcm1TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICB0b3RhbDogbS50b1RyYW5zZm9ybVN0cmluZygpLFxuICAgICAgICAgICAgICAgIGxvY2FsOiBsb2NhbFN0cmluZyxcbiAgICAgICAgICAgICAgICB0b1N0cmluZzogcHJvcFN0cmluZ1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHN0ciBpbnN0YW5jZW9mIFNuYXAuTWF0cml4KSB7XG4gICAgICAgICAgICB0aGlzLm1hdHJpeCA9IHRzdHI7XG4gICAgICAgICAgICB0aGlzLl8udHJhbnNmb3JtID0gdHN0ci50b1RyYW5zZm9ybVN0cmluZygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXh0cmFjdFRyYW5zZm9ybSh0aGlzLCB0c3RyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm5vZGUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJsaW5lYXJHcmFkaWVudFwiIHx8IHRoaXMudHlwZSA9PSBcInJhZGlhbEdyYWRpZW50XCIpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMubm9kZSwge2dyYWRpZW50VHJhbnNmb3JtOiB0aGlzLm1hdHJpeH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLnR5cGUgPT0gXCJwYXR0ZXJuXCIpIHtcbiAgICAgICAgICAgICAgICAkKHRoaXMubm9kZSwge3BhdHRlcm5UcmFuc2Zvcm06IHRoaXMubWF0cml4fSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICQodGhpcy5ub2RlLCB7dHJhbnNmb3JtOiB0aGlzLm1hdHJpeH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5wYXJlbnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGVsZW1lbnQncyBwYXJlbnRcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucGFyZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gd3JhcCh0aGlzLm5vZGUucGFyZW50Tm9kZSk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hcHBlbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFwcGVuZHMgdGhlIGdpdmVuIGVsZW1lbnQgdG8gY3VycmVudCBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudHxTZXQpIGVsZW1lbnQgdG8gYXBwZW5kXG4gICAgID0gKEVsZW1lbnQpIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hZGRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBARWxlbWVudC5hcHBlbmRcbiAgICBcXCovXG4gICAgZWxwcm90by5hcHBlbmQgPSBlbHByb3RvLmFkZCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBpZiAoZWwpIHtcbiAgICAgICAgICAgIGlmIChlbC50eXBlID09IFwic2V0XCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGVsLmZvckVhY2goZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0LmFkZChlbCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGVsLm5vZGUpO1xuICAgICAgICAgICAgZWwucGFwZXIgPSB0aGlzLnBhcGVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYXBwZW5kVG9cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFwcGVuZHMgdGhlIGN1cnJlbnQgZWxlbWVudCB0byB0aGUgZ2l2ZW4gb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnQpIHBhcmVudCBlbGVtZW50IHRvIGFwcGVuZCB0b1xuICAgICA9IChFbGVtZW50KSB0aGUgY2hpbGQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFwcGVuZFRvID0gZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIGlmIChlbCkge1xuICAgICAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgICAgIGVsLmFwcGVuZCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnByZXBlbmRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFByZXBlbmRzIHRoZSBnaXZlbiBlbGVtZW50IHRvIHRoZSBjdXJyZW50IG9uZVxuICAgICAqKlxuICAgICAtIGVsIChFbGVtZW50KSBlbGVtZW50IHRvIHByZXBlbmRcbiAgICAgPSAoRWxlbWVudCkgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucHJlcGVuZCA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBpZiAoZWwpIHtcbiAgICAgICAgICAgIGlmIChlbC50eXBlID09IFwic2V0XCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgaXQgPSB0aGlzLFxuICAgICAgICAgICAgICAgICAgICBmaXJzdDtcbiAgICAgICAgICAgICAgICBlbC5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcnN0LmFmdGVyKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0LnByZXBlbmQoZWwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZpcnN0ID0gZWw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IGVsLnBhcmVudCgpO1xuICAgICAgICAgICAgdGhpcy5ub2RlLmluc2VydEJlZm9yZShlbC5ub2RlLCB0aGlzLm5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICB0aGlzLmFkZCAmJiB0aGlzLmFkZCgpO1xuICAgICAgICAgICAgZWwucGFwZXIgPSB0aGlzLnBhcGVyO1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQoKSAmJiB0aGlzLnBhcmVudCgpLmFkZCgpO1xuICAgICAgICAgICAgcGFyZW50ICYmIHBhcmVudC5hZGQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnByZXBlbmRUb1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUHJlcGVuZHMgdGhlIGN1cnJlbnQgZWxlbWVudCB0byB0aGUgZ2l2ZW4gb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnQpIHBhcmVudCBlbGVtZW50IHRvIHByZXBlbmQgdG9cbiAgICAgPSAoRWxlbWVudCkgdGhlIGNoaWxkIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5wcmVwZW5kVG8gPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgZWwucHJlcGVuZCh0aGlzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5iZWZvcmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEluc2VydHMgZ2l2ZW4gZWxlbWVudCBiZWZvcmUgdGhlIGN1cnJlbnQgb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnQpIGVsZW1lbnQgdG8gaW5zZXJ0XG4gICAgID0gKEVsZW1lbnQpIHRoZSBwYXJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmJlZm9yZSA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBpZiAoZWwudHlwZSA9PSBcInNldFwiKSB7XG4gICAgICAgICAgICB2YXIgaXQgPSB0aGlzO1xuICAgICAgICAgICAgZWwuZm9yRWFjaChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gZWwucGFyZW50KCk7XG4gICAgICAgICAgICAgICAgaXQubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShlbC5ub2RlLCBpdC5ub2RlKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQgJiYgcGFyZW50LmFkZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnBhcmVudCgpLmFkZCgpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsLnBhcmVudCgpO1xuICAgICAgICB0aGlzLm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwubm9kZSwgdGhpcy5ub2RlKTtcbiAgICAgICAgdGhpcy5wYXJlbnQoKSAmJiB0aGlzLnBhcmVudCgpLmFkZCgpO1xuICAgICAgICBwYXJlbnQgJiYgcGFyZW50LmFkZCgpO1xuICAgICAgICBlbC5wYXBlciA9IHRoaXMucGFwZXI7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYWZ0ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEluc2VydHMgZ2l2ZW4gZWxlbWVudCBhZnRlciB0aGUgY3VycmVudCBvbmVcbiAgICAgKipcbiAgICAgLSBlbCAoRWxlbWVudCkgZWxlbWVudCB0byBpbnNlcnRcbiAgICAgPSAoRWxlbWVudCkgdGhlIHBhcmVudCBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uYWZ0ZXIgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVsLnBhcmVudCgpO1xuICAgICAgICBpZiAodGhpcy5ub2RlLm5leHRTaWJsaW5nKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZWwubm9kZSwgdGhpcy5ub2RlLm5leHRTaWJsaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubm9kZS5wYXJlbnROb2RlLmFwcGVuZENoaWxkKGVsLm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFyZW50KCkgJiYgdGhpcy5wYXJlbnQoKS5hZGQoKTtcbiAgICAgICAgcGFyZW50ICYmIHBhcmVudC5hZGQoKTtcbiAgICAgICAgZWwucGFwZXIgPSB0aGlzLnBhcGVyO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lmluc2VydEJlZm9yZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSW5zZXJ0cyB0aGUgZWxlbWVudCBhZnRlciB0aGUgZ2l2ZW4gb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnQpIGVsZW1lbnQgbmV4dCB0byB3aG9tIGluc2VydCB0b1xuICAgICA9IChFbGVtZW50KSB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5pbnNlcnRCZWZvcmUgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZWwgPSB3cmFwKGVsKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50KCk7XG4gICAgICAgIGVsLm5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodGhpcy5ub2RlLCBlbC5ub2RlKTtcbiAgICAgICAgdGhpcy5wYXBlciA9IGVsLnBhcGVyO1xuICAgICAgICBwYXJlbnQgJiYgcGFyZW50LmFkZCgpO1xuICAgICAgICBlbC5wYXJlbnQoKSAmJiBlbC5wYXJlbnQoKS5hZGQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5pbnNlcnRBZnRlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogSW5zZXJ0cyB0aGUgZWxlbWVudCBhZnRlciB0aGUgZ2l2ZW4gb25lXG4gICAgICoqXG4gICAgIC0gZWwgKEVsZW1lbnQpIGVsZW1lbnQgbmV4dCB0byB3aG9tIGluc2VydCB0b1xuICAgICA9IChFbGVtZW50KSB0aGUgcGFyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5pbnNlcnRBZnRlciA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBlbCA9IHdyYXAoZWwpO1xuICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQoKTtcbiAgICAgICAgZWwubm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLm5vZGUsIGVsLm5vZGUubmV4dFNpYmxpbmcpO1xuICAgICAgICB0aGlzLnBhcGVyID0gZWwucGFwZXI7XG4gICAgICAgIHBhcmVudCAmJiBwYXJlbnQuYWRkKCk7XG4gICAgICAgIGVsLnBhcmVudCgpICYmIGVsLnBhcmVudCgpLmFkZCgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnJlbW92ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBlbGVtZW50IGZyb20gdGhlIERPTVxuICAgICA9IChFbGVtZW50KSB0aGUgZGV0YWNoZWQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50KCk7XG4gICAgICAgIHRoaXMubm9kZS5wYXJlbnROb2RlICYmIHRoaXMubm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZSk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnBhcGVyO1xuICAgICAgICB0aGlzLnJlbW92ZWQgPSB0cnVlO1xuICAgICAgICBwYXJlbnQgJiYgcGFyZW50LmFkZCgpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnNlbGVjdFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogR2F0aGVycyB0aGUgbmVzdGVkIEBFbGVtZW50IG1hdGNoaW5nIHRoZSBnaXZlbiBzZXQgb2YgQ1NTIHNlbGVjdG9yc1xuICAgICAqKlxuICAgICAtIHF1ZXJ5IChzdHJpbmcpIENTUyBzZWxlY3RvclxuICAgICA9IChFbGVtZW50KSByZXN1bHQgb2YgcXVlcnkgc2VsZWN0aW9uXG4gICAgXFwqL1xuICAgIGVscHJvdG8uc2VsZWN0ID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgIHJldHVybiB3cmFwKHRoaXMubm9kZS5xdWVyeVNlbGVjdG9yKHF1ZXJ5KSk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zZWxlY3RBbGxcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEdhdGhlcnMgbmVzdGVkIEBFbGVtZW50IG9iamVjdHMgbWF0Y2hpbmcgdGhlIGdpdmVuIHNldCBvZiBDU1Mgc2VsZWN0b3JzXG4gICAgICoqXG4gICAgIC0gcXVlcnkgKHN0cmluZykgQ1NTIHNlbGVjdG9yXG4gICAgID0gKFNldHxhcnJheSkgcmVzdWx0IG9mIHF1ZXJ5IHNlbGVjdGlvblxuICAgIFxcKi9cbiAgICBlbHByb3RvLnNlbGVjdEFsbCA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICB2YXIgbm9kZWxpc3QgPSB0aGlzLm5vZGUucXVlcnlTZWxlY3RvckFsbChxdWVyeSksXG4gICAgICAgICAgICBzZXQgPSAoU25hcC5zZXQgfHwgQXJyYXkpKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZWxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHNldC5wdXNoKHdyYXAobm9kZWxpc3RbaV0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0O1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuYXNQWFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBnaXZlbiBhdHRyaWJ1dGUgb2YgdGhlIGVsZW1lbnQgYXMgYSBgcHhgIHZhbHVlIChub3QgJSwgZW0sIGV0Yy4pXG4gICAgICoqXG4gICAgIC0gYXR0ciAoc3RyaW5nKSBhdHRyaWJ1dGUgbmFtZVxuICAgICAtIHZhbHVlIChzdHJpbmcpICNvcHRpb25hbCBhdHRyaWJ1dGUgdmFsdWVcbiAgICAgPSAoRWxlbWVudCkgcmVzdWx0IG9mIHF1ZXJ5IHNlbGVjdGlvblxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFzUFggPSBmdW5jdGlvbiAoYXR0ciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgIHZhbHVlID0gdGhpcy5hdHRyKGF0dHIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiArdW5pdDJweCh0aGlzLCBhdHRyLCB2YWx1ZSk7XG4gICAgfTtcbiAgICAvLyBTSUVSUkEgRWxlbWVudC51c2UoKTogSSBzdWdnZXN0IGFkZGluZyBhIG5vdGUgYWJvdXQgaG93IHRvIGFjY2VzcyB0aGUgb3JpZ2luYWwgZWxlbWVudCB0aGUgcmV0dXJuZWQgPHVzZT4gaW5zdGFudGlhdGVzLiBJdCdzIGEgcGFydCBvZiBTVkcgd2l0aCB3aGljaCBvcmRpbmFyeSB3ZWIgZGV2ZWxvcGVycyBtYXkgYmUgbGVhc3QgZmFtaWxpYXIuXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudXNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgYDx1c2U+YCBlbGVtZW50IGxpbmtlZCB0byB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICoqXG4gICAgID0gKEVsZW1lbnQpIHRoZSBgPHVzZT5gIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by51c2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1c2UsXG4gICAgICAgICAgICBpZCA9IHRoaXMubm9kZS5pZDtcbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgaWQgPSB0aGlzLmlkO1xuICAgICAgICAgICAgJCh0aGlzLm5vZGUsIHtcbiAgICAgICAgICAgICAgICBpZDogaWRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJsaW5lYXJHcmFkaWVudFwiIHx8IHRoaXMudHlwZSA9PSBcInJhZGlhbEdyYWRpZW50XCIgfHxcbiAgICAgICAgICAgIHRoaXMudHlwZSA9PSBcInBhdHRlcm5cIikge1xuICAgICAgICAgICAgdXNlID0gbWFrZSh0aGlzLnR5cGUsIHRoaXMubm9kZS5wYXJlbnROb2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVzZSA9IG1ha2UoXCJ1c2VcIiwgdGhpcy5ub2RlLnBhcmVudE5vZGUpO1xuICAgICAgICB9XG4gICAgICAgICQodXNlLm5vZGUsIHtcbiAgICAgICAgICAgIFwieGxpbms6aHJlZlwiOiBcIiNcIiArIGlkXG4gICAgICAgIH0pO1xuICAgICAgICB1c2Uub3JpZ2luYWwgPSB0aGlzO1xuICAgICAgICByZXR1cm4gdXNlO1xuICAgIH07XG4gICAgZnVuY3Rpb24gZml4aWRzKGVsKSB7XG4gICAgICAgIHZhciBlbHMgPSBlbC5zZWxlY3RBbGwoXCIqXCIpLFxuICAgICAgICAgICAgaXQsXG4gICAgICAgICAgICB1cmwgPSAvXlxccyp1cmxcXCgoXCJ8J3wpKC4qKVxcMVxcKVxccyokLyxcbiAgICAgICAgICAgIGlkcyA9IFtdLFxuICAgICAgICAgICAgdXNlcyA9IHt9O1xuICAgICAgICBmdW5jdGlvbiB1cmx0ZXN0KGl0LCBuYW1lKSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gJChpdC5ub2RlLCBuYW1lKTtcbiAgICAgICAgICAgIHZhbCA9IHZhbCAmJiB2YWwubWF0Y2godXJsKTtcbiAgICAgICAgICAgIHZhbCA9IHZhbCAmJiB2YWxbMl07XG4gICAgICAgICAgICBpZiAodmFsICYmIHZhbC5jaGFyQXQoKSA9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIHZhbCA9IHZhbC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICB1c2VzW3ZhbF0gPSAodXNlc1t2YWxdIHx8IFtdKS5jb25jYXQoZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0ge307XG4gICAgICAgICAgICAgICAgICAgIGF0dHJbbmFtZV0gPSBVUkwoaWQpO1xuICAgICAgICAgICAgICAgICAgICAkKGl0Lm5vZGUsIGF0dHIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGxpbmt0ZXN0KGl0KSB7XG4gICAgICAgICAgICB2YXIgdmFsID0gJChpdC5ub2RlLCBcInhsaW5rOmhyZWZcIik7XG4gICAgICAgICAgICBpZiAodmFsICYmIHZhbC5jaGFyQXQoKSA9PSBcIiNcIikge1xuICAgICAgICAgICAgICAgIHZhbCA9IHZhbC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgICAgICAgICB1c2VzW3ZhbF0gPSAodXNlc1t2YWxdIHx8IFtdKS5jb25jYXQoZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0LmF0dHIoXCJ4bGluazpocmVmXCIsIFwiI1wiICsgaWQpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGVscy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICBpdCA9IGVsc1tpXTtcbiAgICAgICAgICAgIHVybHRlc3QoaXQsIFwiZmlsbFwiKTtcbiAgICAgICAgICAgIHVybHRlc3QoaXQsIFwic3Ryb2tlXCIpO1xuICAgICAgICAgICAgdXJsdGVzdChpdCwgXCJmaWx0ZXJcIik7XG4gICAgICAgICAgICB1cmx0ZXN0KGl0LCBcIm1hc2tcIik7XG4gICAgICAgICAgICB1cmx0ZXN0KGl0LCBcImNsaXAtcGF0aFwiKTtcbiAgICAgICAgICAgIGxpbmt0ZXN0KGl0KTtcbiAgICAgICAgICAgIHZhciBvbGRpZCA9ICQoaXQubm9kZSwgXCJpZFwiKTtcbiAgICAgICAgICAgIGlmIChvbGRpZCkge1xuICAgICAgICAgICAgICAgICQoaXQubm9kZSwge2lkOiBpdC5pZH0pO1xuICAgICAgICAgICAgICAgIGlkcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgb2xkOiBvbGRpZCxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGl0LmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBpZHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdmFyIGZzID0gdXNlc1tpZHNbaV0ub2xkXTtcbiAgICAgICAgICAgIGlmIChmcykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBqaiA9IGZzLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZnNbal0oaWRzW2ldLmlkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuY2xvbmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBjbG9uZSBvZiB0aGUgZWxlbWVudCBhbmQgaW5zZXJ0cyBpdCBhZnRlciB0aGUgZWxlbWVudFxuICAgICAqKlxuICAgICA9IChFbGVtZW50KSB0aGUgY2xvbmVcbiAgICBcXCovXG4gICAgZWxwcm90by5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNsb25lID0gd3JhcCh0aGlzLm5vZGUuY2xvbmVOb2RlKHRydWUpKTtcbiAgICAgICAgaWYgKCQoY2xvbmUubm9kZSwgXCJpZFwiKSkge1xuICAgICAgICAgICAgJChjbG9uZS5ub2RlLCB7aWQ6IGNsb25lLmlkfSk7XG4gICAgICAgIH1cbiAgICAgICAgZml4aWRzKGNsb25lKTtcbiAgICAgICAgY2xvbmUuaW5zZXJ0QWZ0ZXIodGhpcyk7XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvRGVmc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogTW92ZXMgZWxlbWVudCB0byB0aGUgc2hhcmVkIGA8ZGVmcz5gIGFyZWFcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgdGhlIGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by50b0RlZnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkZWZzID0gZ2V0U29tZURlZnModGhpcyk7XG4gICAgICAgIGRlZnMuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC50b1BhdHRlcm5cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBgPHBhdHRlcm4+YCBlbGVtZW50IGZyb20gdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAqKlxuICAgICAqIFRvIGNyZWF0ZSBhIHBhdHRlcm4geW91IGhhdmUgdG8gc3BlY2lmeSB0aGUgcGF0dGVybiByZWN0OlxuICAgICAtIHggKHN0cmluZ3xudW1iZXIpXG4gICAgIC0geSAoc3RyaW5nfG51bWJlcilcbiAgICAgLSB3aWR0aCAoc3RyaW5nfG51bWJlcilcbiAgICAgLSBoZWlnaHQgKHN0cmluZ3xudW1iZXIpXG4gICAgID0gKEVsZW1lbnQpIHRoZSBgPHBhdHRlcm4+YCBlbGVtZW50XG4gICAgICogWW91IGNhbiB1c2UgcGF0dGVybiBsYXRlciBvbiBhcyBhbiBhcmd1bWVudCBmb3IgYGZpbGxgIGF0dHJpYnV0ZTpcbiAgICAgfCB2YXIgcCA9IHBhcGVyLnBhdGgoXCJNMTAtNS0xMCwxNU0xNSwwLDAsMTVNMC01LTIwLDE1XCIpLmF0dHIoe1xuICAgICB8ICAgICAgICAgZmlsbDogXCJub25lXCIsXG4gICAgIHwgICAgICAgICBzdHJva2U6IFwiI2JhZGE1NVwiLFxuICAgICB8ICAgICAgICAgc3Ryb2tlV2lkdGg6IDVcbiAgICAgfCAgICAgfSkucGF0dGVybigwLCAwLCAxMCwgMTApLFxuICAgICB8ICAgICBjID0gcGFwZXIuY2lyY2xlKDIwMCwgMjAwLCAxMDApO1xuICAgICB8IGMuYXR0cih7XG4gICAgIHwgICAgIGZpbGw6IHBcbiAgICAgfCB9KTtcbiAgICBcXCovXG4gICAgZWxwcm90by5wYXR0ZXJuID0gZWxwcm90by50b1BhdHRlcm4gPSBmdW5jdGlvbiAoeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICB2YXIgcCA9IG1ha2UoXCJwYXR0ZXJuXCIsIGdldFNvbWVEZWZzKHRoaXMpKTtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgeCA9IHRoaXMuZ2V0QkJveCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpcyh4LCBcIm9iamVjdFwiKSAmJiBcInhcIiBpbiB4KSB7XG4gICAgICAgICAgICB5ID0geC55O1xuICAgICAgICAgICAgd2lkdGggPSB4LndpZHRoO1xuICAgICAgICAgICAgaGVpZ2h0ID0geC5oZWlnaHQ7XG4gICAgICAgICAgICB4ID0geC54O1xuICAgICAgICB9XG4gICAgICAgICQocC5ub2RlLCB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgcGF0dGVyblVuaXRzOiBcInVzZXJTcGFjZU9uVXNlXCIsXG4gICAgICAgICAgICBpZDogcC5pZCxcbiAgICAgICAgICAgIHZpZXdCb3g6IFt4LCB5LCB3aWR0aCwgaGVpZ2h0XS5qb2luKFwiIFwiKVxuICAgICAgICB9KTtcbiAgICAgICAgcC5ub2RlLmFwcGVuZENoaWxkKHRoaXMubm9kZSk7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG4vLyBTSUVSUkEgRWxlbWVudC5tYXJrZXIoKTogY2xhcmlmeSB3aGF0IGEgcmVmZXJlbmNlIHBvaW50IGlzLiBFLmcuLCBoZWxwcyB5b3Ugb2Zmc2V0IHRoZSBvYmplY3QgZnJvbSBpdHMgZWRnZSBzdWNoIGFzIHdoZW4gY2VudGVyaW5nIGl0IG92ZXIgYSBwYXRoLlxuLy8gU0lFUlJBIEVsZW1lbnQubWFya2VyKCk6IEkgc3VnZ2VzdCB0aGUgbWV0aG9kIHNob3VsZCBhY2NlcHQgZGVmYXVsdCByZWZlcmVuY2UgcG9pbnQgdmFsdWVzLiAgUGVyaGFwcyBjZW50ZXJlZCB3aXRoIChyZWZYID0gd2lkdGgvMikgYW5kIChyZWZZID0gaGVpZ2h0LzIpPyBBbHNvLCBjb3VsZG4ndCBpdCBhc3N1bWUgdGhlIGVsZW1lbnQncyBjdXJyZW50IF93aWR0aF8gYW5kIF9oZWlnaHRfPyBBbmQgcGxlYXNlIHNwZWNpZnkgd2hhdCBfeF8gYW5kIF95XyBtZWFuOiBvZmZzZXRzPyBJZiBzbywgZnJvbSB3aGVyZT8gIENvdWxkbid0IHRoZXkgYWxzbyBiZSBhc3NpZ25lZCBkZWZhdWx0IHZhbHVlcz9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tYXJrZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYSBgPG1hcmtlcj5gIGVsZW1lbnQgZnJvbSB0aGUgY3VycmVudCBlbGVtZW50XG4gICAgICoqXG4gICAgICogVG8gY3JlYXRlIGEgbWFya2VyIHlvdSBoYXZlIHRvIHNwZWNpZnkgdGhlIGJvdW5kaW5nIHJlY3QgYW5kIHJlZmVyZW5jZSBwb2ludDpcbiAgICAgLSB4IChudW1iZXIpXG4gICAgIC0geSAobnVtYmVyKVxuICAgICAtIHdpZHRoIChudW1iZXIpXG4gICAgIC0gaGVpZ2h0IChudW1iZXIpXG4gICAgIC0gcmVmWCAobnVtYmVyKVxuICAgICAtIHJlZlkgKG51bWJlcilcbiAgICAgPSAoRWxlbWVudCkgdGhlIGA8bWFya2VyPmAgZWxlbWVudFxuICAgICAqIFlvdSBjYW4gc3BlY2lmeSB0aGUgbWFya2VyIGxhdGVyIGFzIGFuIGFyZ3VtZW50IGZvciBgbWFya2VyLXN0YXJ0YCwgYG1hcmtlci1lbmRgLCBgbWFya2VyLW1pZGAsIGFuZCBgbWFya2VyYCBhdHRyaWJ1dGVzLiBUaGUgYG1hcmtlcmAgYXR0cmlidXRlIHBsYWNlcyB0aGUgbWFya2VyIGF0IGV2ZXJ5IHBvaW50IGFsb25nIHRoZSBwYXRoLCBhbmQgYG1hcmtlci1taWRgIHBsYWNlcyB0aGVtIGF0IGV2ZXJ5IHBvaW50IGV4Y2VwdCB0aGUgc3RhcnQgYW5kIGVuZC5cbiAgICBcXCovXG4gICAgLy8gVE9ETyBhZGQgdXNhZ2UgZm9yIG1hcmtlcnNcbiAgICBlbHByb3RvLm1hcmtlciA9IGZ1bmN0aW9uICh4LCB5LCB3aWR0aCwgaGVpZ2h0LCByZWZYLCByZWZZKSB7XG4gICAgICAgIHZhciBwID0gbWFrZShcIm1hcmtlclwiLCBnZXRTb21lRGVmcyh0aGlzKSk7XG4gICAgICAgIGlmICh4ID09IG51bGwpIHtcbiAgICAgICAgICAgIHggPSB0aGlzLmdldEJCb3goKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXMoeCwgXCJvYmplY3RcIikgJiYgXCJ4XCIgaW4geCkge1xuICAgICAgICAgICAgeSA9IHgueTtcbiAgICAgICAgICAgIHdpZHRoID0geC53aWR0aDtcbiAgICAgICAgICAgIGhlaWdodCA9IHguaGVpZ2h0O1xuICAgICAgICAgICAgcmVmWCA9IHgucmVmWCB8fCB4LmN4O1xuICAgICAgICAgICAgcmVmWSA9IHgucmVmWSB8fCB4LmN5O1xuICAgICAgICAgICAgeCA9IHgueDtcbiAgICAgICAgfVxuICAgICAgICAkKHAubm9kZSwge1xuICAgICAgICAgICAgdmlld0JveDogW3gsIHksIHdpZHRoLCBoZWlnaHRdLmpvaW4oXCIgXCIpLFxuICAgICAgICAgICAgbWFya2VyV2lkdGg6IHdpZHRoLFxuICAgICAgICAgICAgbWFya2VySGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBvcmllbnQ6IFwiYXV0b1wiLFxuICAgICAgICAgICAgcmVmWDogcmVmWCB8fCAwLFxuICAgICAgICAgICAgcmVmWTogcmVmWSB8fCAwLFxuICAgICAgICAgICAgaWQ6IHAuaWRcbiAgICAgICAgfSk7XG4gICAgICAgIHAubm9kZS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpO1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9O1xuICAgIC8vIGFuaW1hdGlvblxuICAgIGZ1bmN0aW9uIHNsaWNlKGZyb20sIHRvLCBmKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gYXJyLnNsaWNlKGZyb20sIHRvKTtcbiAgICAgICAgICAgIGlmIChyZXMubGVuZ3RoID09IDEpIHtcbiAgICAgICAgICAgICAgICByZXMgPSByZXNbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZiA/IGYocmVzKSA6IHJlcztcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIEFuaW1hdGlvbiA9IGZ1bmN0aW9uIChhdHRyLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGVhc2luZyA9PSBcImZ1bmN0aW9uXCIgJiYgIWVhc2luZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZWFzaW5nO1xuICAgICAgICAgICAgZWFzaW5nID0gbWluYS5saW5lYXI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hdHRyID0gYXR0cjtcbiAgICAgICAgdGhpcy5kdXIgPSBtcztcbiAgICAgICAgZWFzaW5nICYmICh0aGlzLmVhc2luZyA9IGVhc2luZyk7XG4gICAgICAgIGNhbGxiYWNrICYmICh0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2spO1xuICAgIH07XG4gICAgU25hcC5fLkFuaW1hdGlvbiA9IEFuaW1hdGlvbjtcbiAgICAvKlxcXG4gICAgICogU25hcC5hbmltYXRpb25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIENyZWF0ZXMgYW4gYW5pbWF0aW9uIG9iamVjdFxuICAgICAqKlxuICAgICAtIGF0dHIgKG9iamVjdCkgYXR0cmlidXRlcyBvZiBmaW5hbCBkZXN0aW5hdGlvblxuICAgICAtIGR1cmF0aW9uIChudW1iZXIpIGR1cmF0aW9uIG9mIHRoZSBhbmltYXRpb24sIGluIG1pbGxpc2Vjb25kc1xuICAgICAtIGVhc2luZyAoZnVuY3Rpb24pICNvcHRpb25hbCBvbmUgb2YgZWFzaW5nIGZ1bmN0aW9ucyBvZiBAbWluYSBvciBjdXN0b20gb25lXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBmaXJlcyB3aGVuIGFuaW1hdGlvbiBlbmRzXG4gICAgID0gKG9iamVjdCkgYW5pbWF0aW9uIG9iamVjdFxuICAgIFxcKi9cbiAgICBTbmFwLmFuaW1hdGlvbiA9IGZ1bmN0aW9uIChhdHRyLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICByZXR1cm4gbmV3IEFuaW1hdGlvbihhdHRyLCBtcywgZWFzaW5nLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5pbkFuaW1cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYSBzZXQgb2YgYW5pbWF0aW9ucyB0aGF0IG1heSBiZSBhYmxlIHRvIG1hbmlwdWxhdGUgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIGluIGZvcm1hdDpcbiAgICAgbyB7XG4gICAgIG8gICAgIGFuaW0gKG9iamVjdCkgYW5pbWF0aW9uIG9iamVjdCxcbiAgICAgbyAgICAgbWluYSAob2JqZWN0KSBAbWluYSBvYmplY3QsXG4gICAgIG8gICAgIGN1clN0YXR1cyAobnVtYmVyKSAwLi4xIOKAlCBzdGF0dXMgb2YgdGhlIGFuaW1hdGlvbjogMCDigJQganVzdCBzdGFydGVkLCAxIOKAlCBqdXN0IGZpbmlzaGVkLFxuICAgICBvICAgICBzdGF0dXMgKGZ1bmN0aW9uKSBnZXRzIG9yIHNldHMgdGhlIHN0YXR1cyBvZiB0aGUgYW5pbWF0aW9uLFxuICAgICBvICAgICBzdG9wIChmdW5jdGlvbikgc3RvcHMgdGhlIGFuaW1hdGlvblxuICAgICBvIH1cbiAgICBcXCovXG4gICAgZWxwcm90by5pbkFuaW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlbCA9IHRoaXMsXG4gICAgICAgICAgICByZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gZWwuYW5pbXMpIGlmIChlbC5hbmltc1toYXNdKGlkKSkge1xuICAgICAgICAgICAgKGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBhbmltOiBuZXcgQW5pbWF0aW9uKGEuX2F0dHJzLCBhLmR1ciwgYS5lYXNpbmcsIGEuX2NhbGxiYWNrKSxcbiAgICAgICAgICAgICAgICAgICAgbWluYTogYSxcbiAgICAgICAgICAgICAgICAgICAgY3VyU3RhdHVzOiBhLnN0YXR1cygpLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhLnN0YXR1cyh2YWwpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfShlbC5hbmltc1tpZF0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuYW5pbWF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUnVucyBnZW5lcmljIGFuaW1hdGlvbiBvZiBvbmUgbnVtYmVyIGludG8gYW5vdGhlciB3aXRoIGEgY2FyaW5nIGZ1bmN0aW9uXG4gICAgICoqXG4gICAgIC0gZnJvbSAobnVtYmVyfGFycmF5KSBudW1iZXIgb3IgYXJyYXkgb2YgbnVtYmVyc1xuICAgICAtIHRvIChudW1iZXJ8YXJyYXkpIG51bWJlciBvciBhcnJheSBvZiBudW1iZXJzXG4gICAgIC0gc2V0dGVyIChmdW5jdGlvbikgY2FyaW5nIGZ1bmN0aW9uIHRoYXQgYWNjZXB0cyBvbmUgbnVtYmVyIGFyZ3VtZW50XG4gICAgIC0gZHVyYXRpb24gKG51bWJlcikgZHVyYXRpb24sIGluIG1pbGxpc2Vjb25kc1xuICAgICAtIGVhc2luZyAoZnVuY3Rpb24pICNvcHRpb25hbCBlYXNpbmcgZnVuY3Rpb24gZnJvbSBAbWluYSBvciBjdXN0b21cbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0byBleGVjdXRlIHdoZW4gYW5pbWF0aW9uIGVuZHNcbiAgICAgPSAob2JqZWN0KSBhbmltYXRpb24gb2JqZWN0IGluIEBtaW5hIGZvcm1hdFxuICAgICBvIHtcbiAgICAgbyAgICAgaWQgKHN0cmluZykgYW5pbWF0aW9uIGlkLCBjb25zaWRlciBpdCByZWFkLW9ubHksXG4gICAgIG8gICAgIGR1cmF0aW9uIChmdW5jdGlvbikgZ2V0cyBvciBzZXRzIHRoZSBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uLFxuICAgICBvICAgICBlYXNpbmcgKGZ1bmN0aW9uKSBlYXNpbmcsXG4gICAgIG8gICAgIHNwZWVkIChmdW5jdGlvbikgZ2V0cyBvciBzZXRzIHRoZSBzcGVlZCBvZiB0aGUgYW5pbWF0aW9uLFxuICAgICBvICAgICBzdGF0dXMgKGZ1bmN0aW9uKSBnZXRzIG9yIHNldHMgdGhlIHN0YXR1cyBvZiB0aGUgYW5pbWF0aW9uLFxuICAgICBvICAgICBzdG9wIChmdW5jdGlvbikgc3RvcHMgdGhlIGFuaW1hdGlvblxuICAgICBvIH1cbiAgICAgfCB2YXIgcmVjdCA9IFNuYXAoKS5yZWN0KDAsIDAsIDEwLCAxMCk7XG4gICAgIHwgU25hcC5hbmltYXRlKDAsIDEwLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgIHwgICAgIHJlY3QuYXR0cih7XG4gICAgIHwgICAgICAgICB4OiB2YWxcbiAgICAgfCAgICAgfSk7XG4gICAgIHwgfSwgMTAwMCk7XG4gICAgIHwgLy8gaW4gZ2l2ZW4gY29udGV4dCBpcyBlcXVpdmFsZW50IHRvXG4gICAgIHwgcmVjdC5hbmltYXRlKHt4OiAxMH0sIDEwMDApO1xuICAgIFxcKi9cbiAgICBTbmFwLmFuaW1hdGUgPSBmdW5jdGlvbiAoZnJvbSwgdG8sIHNldHRlciwgbXMsIGVhc2luZywgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHR5cGVvZiBlYXNpbmcgPT0gXCJmdW5jdGlvblwiICYmICFlYXNpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGVhc2luZztcbiAgICAgICAgICAgIGVhc2luZyA9IG1pbmEubGluZWFyO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub3cgPSBtaW5hLnRpbWUoKSxcbiAgICAgICAgICAgIGFuaW0gPSBtaW5hKGZyb20sIHRvLCBub3csIG5vdyArIG1zLCBtaW5hLnRpbWUsIHNldHRlciwgZWFzaW5nKTtcbiAgICAgICAgY2FsbGJhY2sgJiYgZXZlLm9uY2UoXCJtaW5hLmZpbmlzaC5cIiArIGFuaW0uaWQsIGNhbGxiYWNrKTtcbiAgICAgICAgcmV0dXJuIGFuaW07XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5zdG9wXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTdG9wcyBhbGwgdGhlIGFuaW1hdGlvbnMgZm9yIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhbmltcyA9IHRoaXMuaW5BbmltKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IGFuaW1zLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGFuaW1zW2ldLnN0b3AoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFuaW1hdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFuaW1hdGVzIHRoZSBnaXZlbiBhdHRyaWJ1dGVzIG9mIHRoZSBlbGVtZW50XG4gICAgICoqXG4gICAgIC0gYXR0cnMgKG9iamVjdCkga2V5LXZhbHVlIHBhaXJzIG9mIGRlc3RpbmF0aW9uIGF0dHJpYnV0ZXNcbiAgICAgLSBkdXJhdGlvbiAobnVtYmVyKSBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uIGluIG1pbGxpc2Vjb25kc1xuICAgICAtIGVhc2luZyAoZnVuY3Rpb24pICNvcHRpb25hbCBlYXNpbmcgZnVuY3Rpb24gZnJvbSBAbWluYSBvciBjdXN0b21cbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pICNvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0aGF0IGV4ZWN1dGVzIHdoZW4gdGhlIGFuaW1hdGlvbiBlbmRzXG4gICAgID0gKEVsZW1lbnQpIHRoZSBjdXJyZW50IGVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5hbmltYXRlID0gZnVuY3Rpb24gKGF0dHJzLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGVhc2luZyA9PSBcImZ1bmN0aW9uXCIgJiYgIWVhc2luZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZWFzaW5nO1xuICAgICAgICAgICAgZWFzaW5nID0gbWluYS5saW5lYXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF0dHJzIGluc3RhbmNlb2YgQW5pbWF0aW9uKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGF0dHJzLmNhbGxiYWNrO1xuICAgICAgICAgICAgZWFzaW5nID0gYXR0cnMuZWFzaW5nO1xuICAgICAgICAgICAgbXMgPSBhdHRycy5kdXI7XG4gICAgICAgICAgICBhdHRycyA9IGF0dHJzLmF0dHI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZrZXlzID0gW10sIHRrZXlzID0gW10sIGtleXMgPSB7fSwgZnJvbSwgdG8sIGYsIGVxLFxuICAgICAgICAgICAgZWwgPSB0aGlzO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cnMpIGlmIChhdHRyc1toYXNdKGtleSkpIHtcbiAgICAgICAgICAgIGlmIChlbC5lcXVhbCkge1xuICAgICAgICAgICAgICAgIGVxID0gZWwuZXF1YWwoa2V5LCBTdHIoYXR0cnNba2V5XSkpO1xuICAgICAgICAgICAgICAgIGZyb20gPSBlcS5mcm9tO1xuICAgICAgICAgICAgICAgIHRvID0gZXEudG87XG4gICAgICAgICAgICAgICAgZiA9IGVxLmY7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZyb20gPSArZWwuYXR0cihrZXkpO1xuICAgICAgICAgICAgICAgIHRvID0gK2F0dHJzW2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbGVuID0gaXMoZnJvbSwgXCJhcnJheVwiKSA/IGZyb20ubGVuZ3RoIDogMTtcbiAgICAgICAgICAgIGtleXNba2V5XSA9IHNsaWNlKGZrZXlzLmxlbmd0aCwgZmtleXMubGVuZ3RoICsgbGVuLCBmKTtcbiAgICAgICAgICAgIGZrZXlzID0gZmtleXMuY29uY2F0KGZyb20pO1xuICAgICAgICAgICAgdGtleXMgPSB0a2V5cy5jb25jYXQodG8pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBub3cgPSBtaW5hLnRpbWUoKSxcbiAgICAgICAgICAgIGFuaW0gPSBtaW5hKGZrZXlzLCB0a2V5cywgbm93LCBub3cgKyBtcywgbWluYS50aW1lLCBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSB7fTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4ga2V5cykgaWYgKGtleXNbaGFzXShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0dHJba2V5XSA9IGtleXNba2V5XSh2YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbC5hdHRyKGF0dHIpO1xuICAgICAgICAgICAgfSwgZWFzaW5nKTtcbiAgICAgICAgZWwuYW5pbXNbYW5pbS5pZF0gPSBhbmltO1xuICAgICAgICBhbmltLl9hdHRycyA9IGF0dHJzO1xuICAgICAgICBhbmltLl9jYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICBldmUoXCJzbmFwLmFuaW1jcmVhdGVkLlwiICsgZWwuaWQsIGFuaW0pO1xuICAgICAgICBldmUub25jZShcIm1pbmEuZmluaXNoLlwiICsgYW5pbS5pZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVsZXRlIGVsLmFuaW1zW2FuaW0uaWRdO1xuICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2suY2FsbChlbCk7XG4gICAgICAgIH0pO1xuICAgICAgICBldmUub25jZShcIm1pbmEuc3RvcC5cIiArIGFuaW0uaWQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBlbC5hbmltc1thbmltLmlkXTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuICAgIHZhciBlbGRhdGEgPSB7fTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5kYXRhXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIG9yIHJldHJpZXZlcyBnaXZlbiB2YWx1ZSBhc3NvY2lhdGVkIHdpdGggZ2l2ZW4ga2V5LiAoRG9u4oCZdCBjb25mdXNlXG4gICAgICogd2l0aCBgZGF0YS1gIGF0dHJpYnV0ZXMpXG4gICAgICpcbiAgICAgKiBTZWUgYWxzbyBARWxlbWVudC5yZW1vdmVEYXRhXG4gICAgIC0ga2V5IChzdHJpbmcpIGtleSB0byBzdG9yZSBkYXRhXG4gICAgIC0gdmFsdWUgKGFueSkgI29wdGlvbmFsIHZhbHVlIHRvIHN0b3JlXG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICAgKiBvciwgaWYgdmFsdWUgaXMgbm90IHNwZWNpZmllZDpcbiAgICAgPSAoYW55KSB2YWx1ZVxuICAgICA+IFVzYWdlXG4gICAgIHwgZm9yICh2YXIgaSA9IDAsIGkgPCA1LCBpKyspIHtcbiAgICAgfCAgICAgcGFwZXIuY2lyY2xlKDEwICsgMTUgKiBpLCAxMCwgMTApXG4gICAgIHwgICAgICAgICAgLmF0dHIoe2ZpbGw6IFwiIzAwMFwifSlcbiAgICAgfCAgICAgICAgICAuZGF0YShcImlcIiwgaSlcbiAgICAgfCAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICB8ICAgICAgICAgICAgIGFsZXJ0KHRoaXMuZGF0YShcImlcIikpO1xuICAgICB8ICAgICAgICAgIH0pO1xuICAgICB8IH1cbiAgICBcXCovXG4gICAgZWxwcm90by5kYXRhID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBlbGRhdGFbdGhpcy5pZF0gPSBlbGRhdGFbdGhpcy5pZF0gfHwge307XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApe1xuICAgICAgICAgICAgZXZlKFwic25hcC5kYXRhLmdldC5cIiArIHRoaXMuaWQsIHRoaXMsIGRhdGEsIG51bGwpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgaWYgKFNuYXAuaXMoa2V5LCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4ga2V5KSBpZiAoa2V5W2hhc10oaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kYXRhKGksIGtleVtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXZlKFwic25hcC5kYXRhLmdldC5cIiArIHRoaXMuaWQsIHRoaXMsIGRhdGFba2V5XSwga2V5KTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgZGF0YVtrZXldID0gdmFsdWU7XG4gICAgICAgIGV2ZShcInNuYXAuZGF0YS5zZXQuXCIgKyB0aGlzLmlkLCB0aGlzLCB2YWx1ZSwga2V5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5yZW1vdmVEYXRhXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIHZhbHVlIGFzc29jaWF0ZWQgd2l0aCBhbiBlbGVtZW50IGJ5IGdpdmVuIGtleS5cbiAgICAgKiBJZiBrZXkgaXMgbm90IHByb3ZpZGVkLCByZW1vdmVzIGFsbCB0aGUgZGF0YSBvZiB0aGUgZWxlbWVudC5cbiAgICAgLSBrZXkgKHN0cmluZykgI29wdGlvbmFsIGtleVxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8ucmVtb3ZlRGF0YSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgICAgICAgICBlbGRhdGFbdGhpcy5pZF0gPSB7fTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZGF0YVt0aGlzLmlkXSAmJiBkZWxldGUgZWxkYXRhW3RoaXMuaWRdW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5vdXRlclNWR1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBTVkcgY29kZSBmb3IgdGhlIGVsZW1lbnQsIGVxdWl2YWxlbnQgdG8gSFRNTCdzIGBvdXRlckhUTUxgLlxuICAgICAqXG4gICAgICogU2VlIGFsc28gQEVsZW1lbnQuaW5uZXJTVkdcbiAgICAgPSAoc3RyaW5nKSBTVkcgY29kZSBmb3IgdGhlIGVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG9TdHJpbmdcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBARWxlbWVudC5vdXRlclNWR1xuICAgIFxcKi9cbiAgICBlbHByb3RvLm91dGVyU1ZHID0gZWxwcm90by50b1N0cmluZyA9IHRvU3RyaW5nKDEpO1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmlubmVyU1ZHXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIFNWRyBjb2RlIGZvciB0aGUgZWxlbWVudCdzIGNvbnRlbnRzLCBlcXVpdmFsZW50IHRvIEhUTUwncyBgaW5uZXJIVE1MYFxuICAgICA9IChzdHJpbmcpIFNWRyBjb2RlIGZvciB0aGUgZWxlbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmlubmVyU1ZHID0gdG9TdHJpbmcoKTtcbiAgICBmdW5jdGlvbiB0b1N0cmluZyh0eXBlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzID0gdHlwZSA/IFwiPFwiICsgdGhpcy50eXBlIDogXCJcIixcbiAgICAgICAgICAgICAgICBhdHRyID0gdGhpcy5ub2RlLmF0dHJpYnV0ZXMsXG4gICAgICAgICAgICAgICAgY2hsZCA9IHRoaXMubm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICAgICAgaWYgKHR5cGUpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhdHRyLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzICs9IFwiIFwiICsgYXR0cltpXS5uYW1lICsgJz1cIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJbaV0udmFsdWUucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpICsgJ1wiJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2hsZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0eXBlICYmIChyZXMgKz0gXCI+XCIpO1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGlpID0gY2hsZC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGxkW2ldLm5vZGVUeXBlID09IDMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSBjaGxkW2ldLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChjaGxkW2ldLm5vZGVUeXBlID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSB3cmFwKGNobGRbaV0pLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHlwZSAmJiAocmVzICs9IFwiPC9cIiArIHRoaXMudHlwZSArIFwiPlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdHlwZSAmJiAocmVzICs9IFwiLz5cIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHByb3RvLnRvRGF0YVVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHdpbmRvdyAmJiB3aW5kb3cuYnRvYSkge1xuICAgICAgICAgICAgdmFyIGJiID0gdGhpcy5nZXRCQm94KCksXG4gICAgICAgICAgICAgICAgc3ZnID0gU25hcC5mb3JtYXQoJzxzdmcgdmVyc2lvbj1cIjEuMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxuczp4bGluaz1cImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIiB3aWR0aD1cInt3aWR0aH1cIiBoZWlnaHQ9XCJ7aGVpZ2h0fVwiIHZpZXdCb3g9XCJ7eH0ge3l9IHt3aWR0aH0ge2hlaWdodH1cIj57Y29udGVudHN9PC9zdmc+Jywge1xuICAgICAgICAgICAgICAgIHg6ICtiYi54LnRvRml4ZWQoMyksXG4gICAgICAgICAgICAgICAgeTogK2JiLnkudG9GaXhlZCgzKSxcbiAgICAgICAgICAgICAgICB3aWR0aDogK2JiLndpZHRoLnRvRml4ZWQoMyksXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiArYmIuaGVpZ2h0LnRvRml4ZWQoMyksXG4gICAgICAgICAgICAgICAgY29udGVudHM6IHRoaXMub3V0ZXJTVkcoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gXCJkYXRhOmltYWdlL3N2Zyt4bWw7YmFzZTY0LFwiICsgYnRvYSh1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3ZnKSkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRnJhZ21lbnQuc2VsZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQEVsZW1lbnQuc2VsZWN0XG4gICAgXFwqL1xuICAgIEZyYWdtZW50LnByb3RvdHlwZS5zZWxlY3QgPSBlbHByb3RvLnNlbGVjdDtcbiAgICAvKlxcXG4gICAgICogRnJhZ21lbnQuc2VsZWN0QWxsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTZWUgQEVsZW1lbnQuc2VsZWN0QWxsXG4gICAgXFwqL1xuICAgIEZyYWdtZW50LnByb3RvdHlwZS5zZWxlY3RBbGwgPSBlbHByb3RvLnNlbGVjdEFsbDtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IsIEZyYWdtZW50KSB7XG4gICAgdmFyIG9iamVjdFRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICBtYXRoID0gTWF0aCxcbiAgICAgICAgRSA9IFwiXCI7XG4gICAgZnVuY3Rpb24gTWF0cml4KGEsIGIsIGMsIGQsIGUsIGYpIHtcbiAgICAgICAgaWYgKGIgPT0gbnVsbCAmJiBvYmplY3RUb1N0cmluZy5jYWxsKGEpID09IFwiW29iamVjdCBTVkdNYXRyaXhdXCIpIHtcbiAgICAgICAgICAgIHRoaXMuYSA9IGEuYTtcbiAgICAgICAgICAgIHRoaXMuYiA9IGEuYjtcbiAgICAgICAgICAgIHRoaXMuYyA9IGEuYztcbiAgICAgICAgICAgIHRoaXMuZCA9IGEuZDtcbiAgICAgICAgICAgIHRoaXMuZSA9IGEuZTtcbiAgICAgICAgICAgIHRoaXMuZiA9IGEuZjtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmEgPSArYTtcbiAgICAgICAgICAgIHRoaXMuYiA9ICtiO1xuICAgICAgICAgICAgdGhpcy5jID0gK2M7XG4gICAgICAgICAgICB0aGlzLmQgPSArZDtcbiAgICAgICAgICAgIHRoaXMuZSA9ICtlO1xuICAgICAgICAgICAgdGhpcy5mID0gK2Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmEgPSAxO1xuICAgICAgICAgICAgdGhpcy5iID0gMDtcbiAgICAgICAgICAgIHRoaXMuYyA9IDA7XG4gICAgICAgICAgICB0aGlzLmQgPSAxO1xuICAgICAgICAgICAgdGhpcy5lID0gMDtcbiAgICAgICAgICAgIHRoaXMuZiA9IDA7XG4gICAgICAgIH1cbiAgICB9XG4gICAgKGZ1bmN0aW9uIChtYXRyaXhwcm90bykge1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5hZGRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIEFkZHMgdGhlIGdpdmVuIG1hdHJpeCB0byBleGlzdGluZyBvbmVcbiAgICAgICAgIC0gYSAobnVtYmVyKVxuICAgICAgICAgLSBiIChudW1iZXIpXG4gICAgICAgICAtIGMgKG51bWJlcilcbiAgICAgICAgIC0gZCAobnVtYmVyKVxuICAgICAgICAgLSBlIChudW1iZXIpXG4gICAgICAgICAtIGYgKG51bWJlcilcbiAgICAgICAgICogb3JcbiAgICAgICAgIC0gbWF0cml4IChvYmplY3QpIEBNYXRyaXhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5hZGQgPSBmdW5jdGlvbiAoYSwgYiwgYywgZCwgZSwgZikge1xuICAgICAgICAgICAgdmFyIG91dCA9IFtbXSwgW10sIFtdXSxcbiAgICAgICAgICAgICAgICBtID0gW1t0aGlzLmEsIHRoaXMuYywgdGhpcy5lXSwgW3RoaXMuYiwgdGhpcy5kLCB0aGlzLmZdLCBbMCwgMCwgMV1dLFxuICAgICAgICAgICAgICAgIG1hdHJpeCA9IFtbYSwgYywgZV0sIFtiLCBkLCBmXSwgWzAsIDAsIDFdXSxcbiAgICAgICAgICAgICAgICB4LCB5LCB6LCByZXM7XG5cbiAgICAgICAgICAgIGlmIChhICYmIGEgaW5zdGFuY2VvZiBNYXRyaXgpIHtcbiAgICAgICAgICAgICAgICBtYXRyaXggPSBbW2EuYSwgYS5jLCBhLmVdLCBbYS5iLCBhLmQsIGEuZl0sIFswLCAwLCAxXV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoeCA9IDA7IHggPCAzOyB4KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKHkgPSAwOyB5IDwgMzsgeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoeiA9IDA7IHogPCAzOyB6KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSBtW3hdW3pdICogbWF0cml4W3pdW3ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG91dFt4XVt5XSA9IHJlcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmEgPSBvdXRbMF1bMF07XG4gICAgICAgICAgICB0aGlzLmIgPSBvdXRbMV1bMF07XG4gICAgICAgICAgICB0aGlzLmMgPSBvdXRbMF1bMV07XG4gICAgICAgICAgICB0aGlzLmQgPSBvdXRbMV1bMV07XG4gICAgICAgICAgICB0aGlzLmUgPSBvdXRbMF1bMl07XG4gICAgICAgICAgICB0aGlzLmYgPSBvdXRbMV1bMl07XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguaW52ZXJ0XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIGFuIGludmVydGVkIHZlcnNpb24gb2YgdGhlIG1hdHJpeFxuICAgICAgICAgPSAob2JqZWN0KSBATWF0cml4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uaW52ZXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcyxcbiAgICAgICAgICAgICAgICB4ID0gbWUuYSAqIG1lLmQgLSBtZS5iICogbWUuYztcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWF0cml4KG1lLmQgLyB4LCAtbWUuYiAvIHgsIC1tZS5jIC8geCwgbWUuYSAvIHgsIChtZS5jICogbWUuZiAtIG1lLmQgKiBtZS5lKSAvIHgsIChtZS5iICogbWUuZSAtIG1lLmEgKiBtZS5mKSAvIHgpO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5jbG9uZVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhlIG1hdHJpeFxuICAgICAgICAgPSAob2JqZWN0KSBATWF0cml4XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uY2xvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1hdHJpeCh0aGlzLmEsIHRoaXMuYiwgdGhpcy5jLCB0aGlzLmQsIHRoaXMuZSwgdGhpcy5mKTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgudHJhbnNsYXRlXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBUcmFuc2xhdGUgdGhlIG1hdHJpeFxuICAgICAgICAgLSB4IChudW1iZXIpIGhvcml6b250YWwgb2Zmc2V0IGRpc3RhbmNlXG4gICAgICAgICAtIHkgKG51bWJlcikgdmVydGljYWwgb2Zmc2V0IGRpc3RhbmNlXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8udHJhbnNsYXRlID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkZCgxLCAwLCAwLCAxLCB4LCB5KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguc2NhbGVcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIFNjYWxlcyB0aGUgbWF0cml4XG4gICAgICAgICAtIHggKG51bWJlcikgYW1vdW50IHRvIGJlIHNjYWxlZCwgd2l0aCBgMWAgcmVzdWx0aW5nIGluIG5vIGNoYW5nZVxuICAgICAgICAgLSB5IChudW1iZXIpICNvcHRpb25hbCBhbW91bnQgdG8gc2NhbGUgYWxvbmcgdGhlIHZlcnRpY2FsIGF4aXMuIChPdGhlcndpc2UgYHhgIGFwcGxpZXMgdG8gYm90aCBheGVzLilcbiAgICAgICAgIC0gY3ggKG51bWJlcikgI29wdGlvbmFsIGhvcml6b250YWwgb3JpZ2luIHBvaW50IGZyb20gd2hpY2ggdG8gc2NhbGVcbiAgICAgICAgIC0gY3kgKG51bWJlcikgI29wdGlvbmFsIHZlcnRpY2FsIG9yaWdpbiBwb2ludCBmcm9tIHdoaWNoIHRvIHNjYWxlXG4gICAgICAgICAqIERlZmF1bHQgY3gsIGN5IGlzIHRoZSBtaWRkbGUgcG9pbnQgb2YgdGhlIGVsZW1lbnQuXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uc2NhbGUgPSBmdW5jdGlvbiAoeCwgeSwgY3gsIGN5KSB7XG4gICAgICAgICAgICB5ID09IG51bGwgJiYgKHkgPSB4KTtcbiAgICAgICAgICAgIChjeCB8fCBjeSkgJiYgdGhpcy5hZGQoMSwgMCwgMCwgMSwgY3gsIGN5KTtcbiAgICAgICAgICAgIHRoaXMuYWRkKHgsIDAsIDAsIHksIDAsIDApO1xuICAgICAgICAgICAgKGN4IHx8IGN5KSAmJiB0aGlzLmFkZCgxLCAwLCAwLCAxLCAtY3gsIC1jeSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgucm90YXRlXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSb3RhdGVzIHRoZSBtYXRyaXhcbiAgICAgICAgIC0gYSAobnVtYmVyKSBhbmdsZSBvZiByb3RhdGlvbiwgaW4gZGVncmVlc1xuICAgICAgICAgLSB4IChudW1iZXIpIGhvcml6b250YWwgb3JpZ2luIHBvaW50IGZyb20gd2hpY2ggdG8gcm90YXRlXG4gICAgICAgICAtIHkgKG51bWJlcikgdmVydGljYWwgb3JpZ2luIHBvaW50IGZyb20gd2hpY2ggdG8gcm90YXRlXG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8ucm90YXRlID0gZnVuY3Rpb24gKGEsIHgsIHkpIHtcbiAgICAgICAgICAgIGEgPSBTbmFwLnJhZChhKTtcbiAgICAgICAgICAgIHggPSB4IHx8IDA7XG4gICAgICAgICAgICB5ID0geSB8fCAwO1xuICAgICAgICAgICAgdmFyIGNvcyA9ICttYXRoLmNvcyhhKS50b0ZpeGVkKDkpLFxuICAgICAgICAgICAgICAgIHNpbiA9ICttYXRoLnNpbihhKS50b0ZpeGVkKDkpO1xuICAgICAgICAgICAgdGhpcy5hZGQoY29zLCBzaW4sIC1zaW4sIGNvcywgeCwgeSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQoMSwgMCwgMCwgMSwgLXgsIC15KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgueFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyB4IGNvb3JkaW5hdGUgZm9yIGdpdmVuIHBvaW50IGFmdGVyIHRyYW5zZm9ybWF0aW9uIGRlc2NyaWJlZCBieSB0aGUgbWF0cml4LiBTZWUgYWxzbyBATWF0cml4LnlcbiAgICAgICAgIC0geCAobnVtYmVyKVxuICAgICAgICAgLSB5IChudW1iZXIpXG4gICAgICAgICA9IChudW1iZXIpIHhcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by54ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiB4ICogdGhpcy5hICsgeSAqIHRoaXMuYyArIHRoaXMuZTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXgueVxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyB5IGNvb3JkaW5hdGUgZm9yIGdpdmVuIHBvaW50IGFmdGVyIHRyYW5zZm9ybWF0aW9uIGRlc2NyaWJlZCBieSB0aGUgbWF0cml4LiBTZWUgYWxzbyBATWF0cml4LnhcbiAgICAgICAgIC0geCAobnVtYmVyKVxuICAgICAgICAgLSB5IChudW1iZXIpXG4gICAgICAgICA9IChudW1iZXIpIHlcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by55ID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgICAgIHJldHVybiB4ICogdGhpcy5iICsgeSAqIHRoaXMuZCArIHRoaXMuZjtcbiAgICAgICAgfTtcbiAgICAgICAgbWF0cml4cHJvdG8uZ2V0ID0gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgICAgIHJldHVybiArdGhpc1tTdHIuZnJvbUNoYXJDb2RlKDk3ICsgaSldLnRvRml4ZWQoNCk7XG4gICAgICAgIH07XG4gICAgICAgIG1hdHJpeHByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIFwibWF0cml4KFwiICsgW3RoaXMuZ2V0KDApLCB0aGlzLmdldCgxKSwgdGhpcy5nZXQoMiksIHRoaXMuZ2V0KDMpLCB0aGlzLmdldCg0KSwgdGhpcy5nZXQoNSldLmpvaW4oKSArIFwiKVwiO1xuICAgICAgICB9O1xuICAgICAgICBtYXRyaXhwcm90by5vZmZzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RoaXMuZS50b0ZpeGVkKDQpLCB0aGlzLmYudG9GaXhlZCg0KV07XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIG5vcm0oYSkge1xuICAgICAgICAgICAgcmV0dXJuIGFbMF0gKiBhWzBdICsgYVsxXSAqIGFbMV07XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gbm9ybWFsaXplKGEpIHtcbiAgICAgICAgICAgIHZhciBtYWcgPSBtYXRoLnNxcnQobm9ybShhKSk7XG4gICAgICAgICAgICBhWzBdICYmIChhWzBdIC89IG1hZyk7XG4gICAgICAgICAgICBhWzFdICYmIChhWzFdIC89IG1hZyk7XG4gICAgICAgIH1cbiAgICAgICAgLypcXFxuICAgICAgICAgKiBNYXRyaXguZGV0ZXJtaW5hbnRcbiAgICAgICAgIFsgbWV0aG9kIF1cbiAgICAgICAgICoqXG4gICAgICAgICAqIEZpbmRzIGRldGVybWluYW50IG9mIHRoZSBnaXZlbiBtYXRyaXguXG4gICAgICAgICA9IChudW1iZXIpIGRldGVybWluYW50XG4gICAgICAgIFxcKi9cbiAgICAgICAgbWF0cml4cHJvdG8uZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hICogdGhpcy5kIC0gdGhpcy5iICogdGhpcy5jO1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC5zcGxpdFxuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogU3BsaXRzIG1hdHJpeCBpbnRvIHByaW1pdGl2ZSB0cmFuc2Zvcm1hdGlvbnNcbiAgICAgICAgID0gKG9iamVjdCkgaW4gZm9ybWF0OlxuICAgICAgICAgbyBkeCAobnVtYmVyKSB0cmFuc2xhdGlvbiBieSB4XG4gICAgICAgICBvIGR5IChudW1iZXIpIHRyYW5zbGF0aW9uIGJ5IHlcbiAgICAgICAgIG8gc2NhbGV4IChudW1iZXIpIHNjYWxlIGJ5IHhcbiAgICAgICAgIG8gc2NhbGV5IChudW1iZXIpIHNjYWxlIGJ5IHlcbiAgICAgICAgIG8gc2hlYXIgKG51bWJlcikgc2hlYXJcbiAgICAgICAgIG8gcm90YXRlIChudW1iZXIpIHJvdGF0aW9uIGluIGRlZ1xuICAgICAgICAgbyBpc1NpbXBsZSAoYm9vbGVhbikgY291bGQgaXQgYmUgcmVwcmVzZW50ZWQgdmlhIHNpbXBsZSB0cmFuc2Zvcm1hdGlvbnNcbiAgICAgICAgXFwqL1xuICAgICAgICBtYXRyaXhwcm90by5zcGxpdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvdXQgPSB7fTtcbiAgICAgICAgICAgIC8vIHRyYW5zbGF0aW9uXG4gICAgICAgICAgICBvdXQuZHggPSB0aGlzLmU7XG4gICAgICAgICAgICBvdXQuZHkgPSB0aGlzLmY7XG5cbiAgICAgICAgICAgIC8vIHNjYWxlIGFuZCBzaGVhclxuICAgICAgICAgICAgdmFyIHJvdyA9IFtbdGhpcy5hLCB0aGlzLmNdLCBbdGhpcy5iLCB0aGlzLmRdXTtcbiAgICAgICAgICAgIG91dC5zY2FsZXggPSBtYXRoLnNxcnQobm9ybShyb3dbMF0pKTtcbiAgICAgICAgICAgIG5vcm1hbGl6ZShyb3dbMF0pO1xuXG4gICAgICAgICAgICBvdXQuc2hlYXIgPSByb3dbMF1bMF0gKiByb3dbMV1bMF0gKyByb3dbMF1bMV0gKiByb3dbMV1bMV07XG4gICAgICAgICAgICByb3dbMV0gPSBbcm93WzFdWzBdIC0gcm93WzBdWzBdICogb3V0LnNoZWFyLCByb3dbMV1bMV0gLSByb3dbMF1bMV0gKiBvdXQuc2hlYXJdO1xuXG4gICAgICAgICAgICBvdXQuc2NhbGV5ID0gbWF0aC5zcXJ0KG5vcm0ocm93WzFdKSk7XG4gICAgICAgICAgICBub3JtYWxpemUocm93WzFdKTtcbiAgICAgICAgICAgIG91dC5zaGVhciAvPSBvdXQuc2NhbGV5O1xuXG4gICAgICAgICAgICBpZiAodGhpcy5kZXRlcm1pbmFudCgpIDwgMCkge1xuICAgICAgICAgICAgICAgIG91dC5zY2FsZXggPSAtb3V0LnNjYWxleDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcm90YXRpb25cbiAgICAgICAgICAgIHZhciBzaW4gPSAtcm93WzBdWzFdLFxuICAgICAgICAgICAgICAgIGNvcyA9IHJvd1sxXVsxXTtcbiAgICAgICAgICAgIGlmIChjb3MgPCAwKSB7XG4gICAgICAgICAgICAgICAgb3V0LnJvdGF0ZSA9IFNuYXAuZGVnKG1hdGguYWNvcyhjb3MpKTtcbiAgICAgICAgICAgICAgICBpZiAoc2luIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBvdXQucm90YXRlID0gMzYwIC0gb3V0LnJvdGF0ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG91dC5yb3RhdGUgPSBTbmFwLmRlZyhtYXRoLmFzaW4oc2luKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dC5pc1NpbXBsZSA9ICErb3V0LnNoZWFyLnRvRml4ZWQoOSkgJiYgKG91dC5zY2FsZXgudG9GaXhlZCg5KSA9PSBvdXQuc2NhbGV5LnRvRml4ZWQoOSkgfHwgIW91dC5yb3RhdGUpO1xuICAgICAgICAgICAgb3V0LmlzU3VwZXJTaW1wbGUgPSAhK291dC5zaGVhci50b0ZpeGVkKDkpICYmIG91dC5zY2FsZXgudG9GaXhlZCg5KSA9PSBvdXQuc2NhbGV5LnRvRml4ZWQoOSkgJiYgIW91dC5yb3RhdGU7XG4gICAgICAgICAgICBvdXQubm9Sb3RhdGlvbiA9ICErb3V0LnNoZWFyLnRvRml4ZWQoOSkgJiYgIW91dC5yb3RhdGU7XG4gICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIE1hdHJpeC50b1RyYW5zZm9ybVN0cmluZ1xuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyB0cmFuc2Zvcm0gc3RyaW5nIHRoYXQgcmVwcmVzZW50cyBnaXZlbiBtYXRyaXhcbiAgICAgICAgID0gKHN0cmluZykgdHJhbnNmb3JtIHN0cmluZ1xuICAgICAgICBcXCovXG4gICAgICAgIG1hdHJpeHByb3RvLnRvVHJhbnNmb3JtU3RyaW5nID0gZnVuY3Rpb24gKHNob3J0ZXIpIHtcbiAgICAgICAgICAgIHZhciBzID0gc2hvcnRlciB8fCB0aGlzLnNwbGl0KCk7XG4gICAgICAgICAgICBpZiAoIStzLnNoZWFyLnRvRml4ZWQoOSkpIHtcbiAgICAgICAgICAgICAgICBzLnNjYWxleCA9ICtzLnNjYWxleC50b0ZpeGVkKDQpO1xuICAgICAgICAgICAgICAgIHMuc2NhbGV5ID0gK3Muc2NhbGV5LnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgcy5yb3RhdGUgPSArcy5yb3RhdGUudG9GaXhlZCg0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gIChzLmR4IHx8IHMuZHkgPyBcInRcIiArIFsrcy5keC50b0ZpeGVkKDQpLCArcy5keS50b0ZpeGVkKDQpXSA6IEUpICsgXG4gICAgICAgICAgICAgICAgICAgICAgICAocy5zY2FsZXggIT0gMSB8fCBzLnNjYWxleSAhPSAxID8gXCJzXCIgKyBbcy5zY2FsZXgsIHMuc2NhbGV5LCAwLCAwXSA6IEUpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIChzLnJvdGF0ZSA/IFwiclwiICsgWytzLnJvdGF0ZS50b0ZpeGVkKDQpLCAwLCAwXSA6IEUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJtXCIgKyBbdGhpcy5nZXQoMCksIHRoaXMuZ2V0KDEpLCB0aGlzLmdldCgyKSwgdGhpcy5nZXQoMyksIHRoaXMuZ2V0KDQpLCB0aGlzLmdldCg1KV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSkoTWF0cml4LnByb3RvdHlwZSk7XG4gICAgLypcXFxuICAgICAqIFNuYXAuTWF0cml4XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBNYXRyaXggY29uc3RydWN0b3IsIGV4dGVuZCBvbiB5b3VyIG93biByaXNrLlxuICAgICAqIFRvIGNyZWF0ZSBtYXRyaWNlcyB1c2UgQFNuYXAubWF0cml4LlxuICAgIFxcKi9cbiAgICBTbmFwLk1hdHJpeCA9IE1hdHJpeDtcbiAgICAvKlxcXG4gICAgICogU25hcC5tYXRyaXhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhIG1hdHJpeCBiYXNlZCBvbiB0aGUgZ2l2ZW4gcGFyYW1ldGVyc1xuICAgICAtIGEgKG51bWJlcilcbiAgICAgLSBiIChudW1iZXIpXG4gICAgIC0gYyAobnVtYmVyKVxuICAgICAtIGQgKG51bWJlcilcbiAgICAgLSBlIChudW1iZXIpXG4gICAgIC0gZiAobnVtYmVyKVxuICAgICAqIG9yXG4gICAgIC0gc3ZnTWF0cml4IChTVkdNYXRyaXgpXG4gICAgID0gKG9iamVjdCkgQE1hdHJpeFxuICAgIFxcKi9cbiAgICBTbmFwLm1hdHJpeCA9IGZ1bmN0aW9uIChhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWF0cml4KGEsIGIsIGMsIGQsIGUsIGYpO1xuICAgIH07XG59KTtcbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpIHtcbiAgICB2YXIgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgICAgICBtYWtlID0gU25hcC5fLm1ha2UsXG4gICAgICAgIHdyYXAgPSBTbmFwLl8ud3JhcCxcbiAgICAgICAgaXMgPSBTbmFwLmlzLFxuICAgICAgICBnZXRTb21lRGVmcyA9IFNuYXAuXy5nZXRTb21lRGVmcyxcbiAgICAgICAgcmVVUkxWYWx1ZSA9IC9edXJsXFwoIz8oW14pXSspXFwpJC8sXG4gICAgICAgICQgPSBTbmFwLl8uJCxcbiAgICAgICAgVVJMID0gU25hcC51cmwsXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgc2VwYXJhdG9yID0gU25hcC5fLnNlcGFyYXRvcixcbiAgICAgICAgRSA9IFwiXCI7XG4gICAgLy8gQXR0cmlidXRlcyBldmVudCBoYW5kbGVyc1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLm1hc2tcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVsZW1lbnQgfHwgdmFsdWUgaW5zdGFuY2VvZiBGcmFnbWVudCkge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZyYWdtZW50ICYmIHZhbHVlLm5vZGUuY2hpbGROb2Rlcy5sZW5ndGggPT0gMSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUubm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgIGdldFNvbWVEZWZzKHRoaXMpLmFwcGVuZENoaWxkKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXAodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlLnR5cGUgPT0gXCJtYXNrXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWFzayA9IHZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXNrID0gbWFrZShcIm1hc2tcIiwgZ2V0U29tZURlZnModGhpcykpO1xuICAgICAgICAgICAgICAgIG1hc2subm9kZS5hcHBlbmRDaGlsZCh2YWx1ZS5ub2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICFtYXNrLm5vZGUuaWQgJiYgJChtYXNrLm5vZGUsIHtcbiAgICAgICAgICAgICAgICBpZDogbWFzay5pZFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKHRoaXMubm9kZSwge1xuICAgICAgICAgICAgICAgIG1hc2s6IFVSTChtYXNrLmlkKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAoZnVuY3Rpb24gKGNsaXBJdCkge1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5jbGlwXCIsIGNsaXBJdCk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmNsaXAtcGF0aFwiLCBjbGlwSXQpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5jbGlwUGF0aFwiLCBjbGlwSXQpO1xuICAgIH0oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEVsZW1lbnQgfHwgdmFsdWUgaW5zdGFuY2VvZiBGcmFnbWVudCkge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIGlmICh2YWx1ZS50eXBlID09IFwiY2xpcFBhdGhcIikge1xuICAgICAgICAgICAgICAgIHZhciBjbGlwID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsaXAgPSBtYWtlKFwiY2xpcFBhdGhcIiwgZ2V0U29tZURlZnModGhpcykpO1xuICAgICAgICAgICAgICAgIGNsaXAubm9kZS5hcHBlbmRDaGlsZCh2YWx1ZS5ub2RlKTtcbiAgICAgICAgICAgICAgICAhY2xpcC5ub2RlLmlkICYmICQoY2xpcC5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBjbGlwLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAkKHRoaXMubm9kZSwge1xuICAgICAgICAgICAgICAgIFwiY2xpcC1wYXRoXCI6IFVSTChjbGlwLm5vZGUuaWQgfHwgY2xpcC5pZClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSkpO1xuICAgIGZ1bmN0aW9uIGZpbGxTdHJva2UobmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRnJhZ21lbnQgJiYgdmFsdWUubm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA9PSAxICYmXG4gICAgICAgICAgICAgICAgKHZhbHVlLm5vZGUuZmlyc3RDaGlsZC50YWdOYW1lID09IFwicmFkaWFsR3JhZGllbnRcIiB8fFxuICAgICAgICAgICAgICAgIHZhbHVlLm5vZGUuZmlyc3RDaGlsZC50YWdOYW1lID09IFwibGluZWFyR3JhZGllbnRcIiB8fFxuICAgICAgICAgICAgICAgIHZhbHVlLm5vZGUuZmlyc3RDaGlsZC50YWdOYW1lID09IFwicGF0dGVyblwiKSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUubm9kZS5maXJzdENoaWxkO1xuICAgICAgICAgICAgICAgIGdldFNvbWVEZWZzKHRoaXMpLmFwcGVuZENoaWxkKHZhbHVlKTtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHdyYXAodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS50eXBlID09IFwicmFkaWFsR3JhZGllbnRcIiB8fCB2YWx1ZS50eXBlID09IFwibGluZWFyR3JhZGllbnRcIlxuICAgICAgICAgICAgICAgICAgIHx8IHZhbHVlLnR5cGUgPT0gXCJwYXR0ZXJuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZS5ub2RlLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHZhbHVlLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogdmFsdWUuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxsID0gVVJMKHZhbHVlLm5vZGUuaWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwgPSB2YWx1ZS5hdHRyKG5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmlsbCA9IFNuYXAuY29sb3IodmFsdWUpO1xuICAgICAgICAgICAgICAgIGlmIChmaWxsLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBncmFkID0gU25hcChnZXRTb21lRGVmcyh0aGlzKS5vd25lclNWR0VsZW1lbnQpLmdyYWRpZW50KHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZ3JhZC5ub2RlLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChncmFkLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGdyYWQuaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGwgPSBVUkwoZ3JhZC5ub2RlLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGwgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGwgPSBTdHIoZmlsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGF0dHJzID0ge307XG4gICAgICAgICAgICBhdHRyc1tuYW1lXSA9IGZpbGw7XG4gICAgICAgICAgICAkKHRoaXMubm9kZSwgYXR0cnMpO1xuICAgICAgICAgICAgdGhpcy5ub2RlLnN0eWxlW25hbWVdID0gRTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuZmlsbFwiLCBmaWxsU3Ryb2tlKFwiZmlsbFwiKSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuc3Ryb2tlXCIsIGZpbGxTdHJva2UoXCJzdHJva2VcIikpO1xuICAgIHZhciBncmFkcmcgPSAvXihbbHJdKSg/OlxcKChbXildKilcXCkpPyguKikkL2k7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdyYWQucGFyc2VcIiwgZnVuY3Rpb24gcGFyc2VHcmFkKHN0cmluZykge1xuICAgICAgICBzdHJpbmcgPSBTdHIoc3RyaW5nKTtcbiAgICAgICAgdmFyIHRva2VucyA9IHN0cmluZy5tYXRjaChncmFkcmcpO1xuICAgICAgICBpZiAoIXRva2Vucykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHR5cGUgPSB0b2tlbnNbMV0sXG4gICAgICAgICAgICBwYXJhbXMgPSB0b2tlbnNbMl0sXG4gICAgICAgICAgICBzdG9wcyA9IHRva2Vuc1szXTtcbiAgICAgICAgcGFyYW1zID0gcGFyYW1zLnNwbGl0KC9cXHMqLFxccyovKS5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gK2VsID09IGVsID8gK2VsIDogZWw7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAocGFyYW1zLmxlbmd0aCA9PSAxICYmIHBhcmFtc1swXSA9PSAwKSB7XG4gICAgICAgICAgICBwYXJhbXMgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBzdG9wcyA9IHN0b3BzLnNwbGl0KFwiLVwiKTtcbiAgICAgICAgc3RvcHMgPSBzdG9wcy5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICBlbCA9IGVsLnNwbGl0KFwiOlwiKTtcbiAgICAgICAgICAgIHZhciBvdXQgPSB7XG4gICAgICAgICAgICAgICAgY29sb3I6IGVsWzBdXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGVsWzFdKSB7XG4gICAgICAgICAgICAgICAgb3V0Lm9mZnNldCA9IHBhcnNlRmxvYXQoZWxbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgICAgICAgICBzdG9wczogc3RvcHNcbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLmRcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIGlmIChpcyh2YWx1ZSwgXCJhcnJheVwiKSAmJiBpcyh2YWx1ZVswXSwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgdmFsdWUgPSBTbmFwLnBhdGgudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPSBTdHIodmFsdWUpO1xuICAgICAgICBpZiAodmFsdWUubWF0Y2goL1tydW9dL2kpKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IFNuYXAucGF0aC50b0Fic29sdXRlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICAkKHRoaXMubm9kZSwge2Q6IHZhbHVlfSk7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLiN0ZXh0XCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICB2YWx1ZSA9IFN0cih2YWx1ZSk7XG4gICAgICAgIHZhciB0eHQgPSBnbG9iLmRvYy5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgIHdoaWxlICh0aGlzLm5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgdGhpcy5ub2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQodHh0KTtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIucGF0aFwiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgdGhpcy5hdHRyKHtkOiB2YWx1ZX0pO1xuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5jbGFzc1wiLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgdGhpcy5ub2RlLmNsYXNzTmFtZS5iYXNlVmFsID0gdmFsdWU7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLnZpZXdCb3hcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciB2YjtcbiAgICAgICAgaWYgKGlzKHZhbHVlLCBcIm9iamVjdFwiKSAmJiBcInhcIiBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgdmIgPSBbdmFsdWUueCwgdmFsdWUueSwgdmFsdWUud2lkdGgsIHZhbHVlLmhlaWdodF0uam9pbihcIiBcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoaXModmFsdWUsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHZiID0gdmFsdWUuam9pbihcIiBcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YiA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgICQodGhpcy5ub2RlLCB7XG4gICAgICAgICAgICB2aWV3Qm94OiB2YlxuICAgICAgICB9KTtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIudHJhbnNmb3JtXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnRyYW5zZm9ybSh2YWx1ZSk7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLnJcIiwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh0aGlzLnR5cGUgPT0gXCJyZWN0XCIpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICAkKHRoaXMubm9kZSwge1xuICAgICAgICAgICAgICAgIHJ4OiB2YWx1ZSxcbiAgICAgICAgICAgICAgICByeTogdmFsdWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLnRleHRwYXRoXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICBpZiAodGhpcy50eXBlID09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICB2YXIgaWQsIHRwLCBub2RlO1xuICAgICAgICAgICAgaWYgKCF2YWx1ZSAmJiB0aGlzLnRleHRQYXRoKSB7XG4gICAgICAgICAgICAgICAgdHAgPSB0aGlzLnRleHRQYXRoO1xuICAgICAgICAgICAgICAgIHdoaWxlICh0cC5ub2RlLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHRwLm5vZGUuZmlyc3RDaGlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRwLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRleHRQYXRoO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpcyh2YWx1ZSwgXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmcyA9IGdldFNvbWVEZWZzKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICBwYXRoID0gd3JhcChkZWZzLnBhcmVudE5vZGUpLnBhdGgodmFsdWUpO1xuICAgICAgICAgICAgICAgIGRlZnMuYXBwZW5kQ2hpbGQocGF0aC5ub2RlKTtcbiAgICAgICAgICAgICAgICBpZCA9IHBhdGguaWQ7XG4gICAgICAgICAgICAgICAgcGF0aC5hdHRyKHtpZDogaWR9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB3cmFwKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGlkID0gdmFsdWUuYXR0cihcImlkXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IHZhbHVlLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuYXR0cih7aWQ6IGlkfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgICAgICB0cCA9IHRoaXMudGV4dFBhdGg7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMubm9kZTtcbiAgICAgICAgICAgICAgICBpZiAodHApIHtcbiAgICAgICAgICAgICAgICAgICAgdHAuYXR0cih7XCJ4bGluazpocmVmXCI6IFwiI1wiICsgaWR9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0cCA9ICQoXCJ0ZXh0UGF0aFwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcInhsaW5rOmhyZWZcIjogXCIjXCIgKyBpZFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG5vZGUuZmlyc3RDaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHAuYXBwZW5kQ2hpbGQobm9kZS5maXJzdENoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKHRwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXh0UGF0aCA9IHdyYXAodHApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci50ZXh0XCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy50eXBlID09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICB2YXIgaSA9IDAsXG4gICAgICAgICAgICAgICAgbm9kZSA9IHRoaXMubm9kZSxcbiAgICAgICAgICAgICAgICB0dW5lciA9IGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3V0ID0gJChcInRzcGFuXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXMoY2h1bmssIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2h1bmsubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXQuYXBwZW5kQ2hpbGQodHVuZXIoY2h1bmtbaV0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dC5hcHBlbmRDaGlsZChnbG9iLmRvYy5jcmVhdGVUZXh0Tm9kZShjaHVuaykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG91dC5ub3JtYWxpemUgJiYgb3V0Lm5vcm1hbGl6ZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb3V0O1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB3aGlsZSAobm9kZS5maXJzdENoaWxkKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHR1bmVkID0gdHVuZXIodmFsdWUpO1xuICAgICAgICAgICAgd2hpbGUgKHR1bmVkLmZpcnN0Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKHR1bmVkLmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgfSkoLTEpO1xuICAgIGZ1bmN0aW9uIHNldEZvbnRTaXplKHZhbHVlKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIGlmICh2YWx1ZSA9PSArdmFsdWUpIHtcbiAgICAgICAgICAgIHZhbHVlICs9IFwicHhcIjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm5vZGUuc3R5bGUuZm9udFNpemUgPSB2YWx1ZTtcbiAgICB9XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuZm9udFNpemVcIiwgc2V0Rm9udFNpemUpKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5mb250LXNpemVcIiwgc2V0Rm9udFNpemUpKC0xKTtcblxuXG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIudHJhbnNmb3JtXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKCk7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLnRleHRwYXRoXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dFBhdGg7XG4gICAgfSkoLTEpO1xuICAgIC8vIE1hcmtlcnNcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICBmdW5jdGlvbiBnZXR0ZXIoZW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICAgICAgdmFyIHN0eWxlID0gZ2xvYi5kb2MuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLm5vZGUsIG51bGwpLmdldFByb3BlcnR5VmFsdWUoXCJtYXJrZXItXCIgKyBlbmQpO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZSA9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3R5bGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNuYXAoZ2xvYi5kb2MuZ2V0RWxlbWVudEJ5SWQoc3R5bGUubWF0Y2gocmVVUkxWYWx1ZSlbMV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHNldHRlcihlbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gXCJtYXJrZXJcIiArIGVuZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGVuZC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXCIgfHwgIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubm9kZS5zdHlsZVtuYW1lXSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS50eXBlID09IFwibWFya2VyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlkID0gdmFsdWUubm9kZS5pZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh2YWx1ZS5ub2RlLCB7aWQ6IHZhbHVlLmlkfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ub2RlLnN0eWxlW25hbWVdID0gVVJMKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIubWFya2VyLWVuZFwiLCBnZXR0ZXIoXCJlbmRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIubWFya2VyRW5kXCIsIGdldHRlcihcImVuZFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5tYXJrZXItc3RhcnRcIiwgZ2V0dGVyKFwic3RhcnRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIubWFya2VyU3RhcnRcIiwgZ2V0dGVyKFwic3RhcnRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIubWFya2VyLW1pZFwiLCBnZXR0ZXIoXCJtaWRcIikpKC0xKTtcbiAgICAgICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIubWFya2VyTWlkXCIsIGdldHRlcihcIm1pZFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5tYXJrZXItZW5kXCIsIHNldHRlcihcImVuZFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5tYXJrZXJFbmRcIiwgc2V0dGVyKFwiZW5kXCIpKSgtMSk7XG4gICAgICAgIGV2ZS5vbihcInNuYXAudXRpbC5hdHRyLm1hcmtlci1zdGFydFwiLCBzZXR0ZXIoXCJzdGFydFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5tYXJrZXJTdGFydFwiLCBzZXR0ZXIoXCJzdGFydFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5tYXJrZXItbWlkXCIsIHNldHRlcihcIm1pZFwiKSkoLTEpO1xuICAgICAgICBldmUub24oXCJzbmFwLnV0aWwuYXR0ci5tYXJrZXJNaWRcIiwgc2V0dGVyKFwibWlkXCIpKSgtMSk7XG4gICAgfSgpKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5yXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcInJlY3RcIiAmJiAkKHRoaXMubm9kZSwgXCJyeFwiKSA9PSAkKHRoaXMubm9kZSwgXCJyeVwiKSkge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIHJldHVybiAkKHRoaXMubm9kZSwgXCJyeFwiKTtcbiAgICAgICAgfVxuICAgIH0pKC0xKTtcbiAgICBmdW5jdGlvbiB0ZXh0RXh0cmFjdChub2RlKSB7XG4gICAgICAgIHZhciBvdXQgPSBbXTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICBpZiAoY2hpLm5vZGVUeXBlID09IDMpIHtcbiAgICAgICAgICAgICAgICBvdXQucHVzaChjaGkubm9kZVZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChjaGkudGFnTmFtZSA9PSBcInRzcGFuXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2hpLmNoaWxkTm9kZXMubGVuZ3RoID09IDEgJiYgY2hpLmZpcnN0Q2hpbGQubm9kZVR5cGUgPT0gMykge1xuICAgICAgICAgICAgICAgICAgICBvdXQucHVzaChjaGkuZmlyc3RDaGlsZC5ub2RlVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG91dC5wdXNoKHRleHRFeHRyYWN0KGNoaSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH1cbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci50ZXh0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcInRleHRcIiB8fCB0aGlzLnR5cGUgPT0gXCJ0c3BhblwiKSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgdmFyIG91dCA9IHRleHRFeHRyYWN0KHRoaXMubm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gb3V0Lmxlbmd0aCA9PSAxID8gb3V0WzBdIDogb3V0O1xuICAgICAgICB9XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLiN0ZXh0XCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS50ZXh0Q29udGVudDtcbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIudmlld0JveFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHZhciB2YiA9ICQodGhpcy5ub2RlLCBcInZpZXdCb3hcIik7XG4gICAgICAgIGlmICh2Yikge1xuICAgICAgICAgICAgdmIgPSB2Yi5zcGxpdChzZXBhcmF0b3IpO1xuICAgICAgICAgICAgcmV0dXJuIFNuYXAuXy5ib3goK3ZiWzBdLCArdmJbMV0sICt2YlsyXSwgK3ZiWzNdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0pKC0xKTtcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5wb2ludHNcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcCA9ICQodGhpcy5ub2RlLCBcInBvaW50c1wiKTtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgaWYgKHApIHtcbiAgICAgICAgICAgIHJldHVybiBwLnNwbGl0KHNlcGFyYXRvcik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9KSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIucGF0aFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwID0gJCh0aGlzLm5vZGUsIFwiZFwiKTtcbiAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfSkoLTEpO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLmNsYXNzXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5jbGFzc05hbWUuYmFzZVZhbDtcbiAgICB9KSgtMSk7XG4gICAgZnVuY3Rpb24gZ2V0Rm9udFNpemUoKSB7XG4gICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuc3R5bGUuZm9udFNpemU7XG4gICAgfVxuICAgIGV2ZS5vbihcInNuYXAudXRpbC5nZXRhdHRyLmZvbnRTaXplXCIsIGdldEZvbnRTaXplKSgtMSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmdldGF0dHIuZm9udC1zaXplXCIsIGdldEZvbnRTaXplKSgtMSk7XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDE0IEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCkge1xuICAgIHZhciByZ05vdFNwYWNlID0gL1xcUysvZyxcbiAgICAgICAgcmdCYWRTcGFjZSA9IC9bXFx0XFxyXFxuXFxmXS9nLFxuICAgICAgICByZ1RyaW0gPSAvKF5cXHMrfFxccyskKS9nLFxuICAgICAgICBTdHIgPSBTdHJpbmcsXG4gICAgICAgIGVscHJvdG8gPSBFbGVtZW50LnByb3RvdHlwZTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5hZGRDbGFzc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBnaXZlbiBjbGFzcyBuYW1lIG9yIGxpc3Qgb2YgY2xhc3MgbmFtZXMgdG8gdGhlIGVsZW1lbnQuXG4gICAgIC0gdmFsdWUgKHN0cmluZykgY2xhc3MgbmFtZSBvciBzcGFjZSBzZXBhcmF0ZWQgbGlzdCBvZiBjbGFzcyBuYW1lc1xuICAgICAqKlxuICAgICA9IChFbGVtZW50KSBvcmlnaW5hbCBlbGVtZW50LlxuICAgIFxcKi9cbiAgICBlbHByb3RvLmFkZENsYXNzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBjbGFzc2VzID0gU3RyKHZhbHVlIHx8IFwiXCIpLm1hdGNoKHJnTm90U3BhY2UpIHx8IFtdLFxuICAgICAgICAgICAgZWxlbSA9IHRoaXMubm9kZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGVsZW0uY2xhc3NOYW1lLmJhc2VWYWwsXG4gICAgICAgICAgICBjdXJDbGFzc2VzID0gY2xhc3NOYW1lLm1hdGNoKHJnTm90U3BhY2UpIHx8IFtdLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIHBvcyxcbiAgICAgICAgICAgIGNsYXp6LFxuICAgICAgICAgICAgZmluYWxWYWx1ZTtcblxuICAgICAgICBpZiAoY2xhc3Nlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGogPSAwO1xuICAgICAgICAgICAgd2hpbGUgKChjbGF6eiA9IGNsYXNzZXNbaisrXSkpIHtcbiAgICAgICAgICAgICAgICBwb3MgPSBjdXJDbGFzc2VzLmluZGV4T2YoY2xhenopO1xuICAgICAgICAgICAgICAgIGlmICghfnBvcykge1xuICAgICAgICAgICAgICAgICAgICBjdXJDbGFzc2VzLnB1c2goY2xhenopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmluYWxWYWx1ZSA9IGN1ckNsYXNzZXMuam9pbihcIiBcIik7XG4gICAgICAgICAgICBpZiAoY2xhc3NOYW1lICE9IGZpbmFsVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBlbGVtLmNsYXNzTmFtZS5iYXNlVmFsID0gZmluYWxWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnJlbW92ZUNsYXNzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGdpdmVuIGNsYXNzIG5hbWUgb3IgbGlzdCBvZiBjbGFzcyBuYW1lcyBmcm9tIHRoZSBlbGVtZW50LlxuICAgICAtIHZhbHVlIChzdHJpbmcpIGNsYXNzIG5hbWUgb3Igc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgY2xhc3MgbmFtZXNcbiAgICAgKipcbiAgICAgPSAoRWxlbWVudCkgb3JpZ2luYWwgZWxlbWVudC5cbiAgICBcXCovXG4gICAgZWxwcm90by5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgY2xhc3NlcyA9IFN0cih2YWx1ZSB8fCBcIlwiKS5tYXRjaChyZ05vdFNwYWNlKSB8fCBbXSxcbiAgICAgICAgICAgIGVsZW0gPSB0aGlzLm5vZGUsXG4gICAgICAgICAgICBjbGFzc05hbWUgPSBlbGVtLmNsYXNzTmFtZS5iYXNlVmFsLFxuICAgICAgICAgICAgY3VyQ2xhc3NlcyA9IGNsYXNzTmFtZS5tYXRjaChyZ05vdFNwYWNlKSB8fCBbXSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBwb3MsXG4gICAgICAgICAgICBjbGF6eixcbiAgICAgICAgICAgIGZpbmFsVmFsdWU7XG4gICAgICAgIGlmIChjdXJDbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoKGNsYXp6ID0gY2xhc3Nlc1tqKytdKSkge1xuICAgICAgICAgICAgICAgIHBvcyA9IGN1ckNsYXNzZXMuaW5kZXhPZihjbGF6eik7XG4gICAgICAgICAgICAgICAgaWYgKH5wb3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VyQ2xhc3Nlcy5zcGxpY2UocG9zLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZpbmFsVmFsdWUgPSBjdXJDbGFzc2VzLmpvaW4oXCIgXCIpO1xuICAgICAgICAgICAgaWYgKGNsYXNzTmFtZSAhPSBmaW5hbFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZWxlbS5jbGFzc05hbWUuYmFzZVZhbCA9IGZpbmFsVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5oYXNDbGFzc1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ2hlY2tzIGlmIHRoZSBlbGVtZW50IGhhcyBhIGdpdmVuIGNsYXNzIG5hbWUgaW4gdGhlIGxpc3Qgb2YgY2xhc3MgbmFtZXMgYXBwbGllZCB0byBpdC5cbiAgICAgLSB2YWx1ZSAoc3RyaW5nKSBjbGFzcyBuYW1lXG4gICAgICoqXG4gICAgID0gKGJvb2xlYW4pIGB0cnVlYCBpZiB0aGUgZWxlbWVudCBoYXMgZ2l2ZW4gY2xhc3NcbiAgICBcXCovXG4gICAgZWxwcm90by5oYXNDbGFzcyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgZWxlbSA9IHRoaXMubm9kZSxcbiAgICAgICAgICAgIGNsYXNzTmFtZSA9IGVsZW0uY2xhc3NOYW1lLmJhc2VWYWwsXG4gICAgICAgICAgICBjdXJDbGFzc2VzID0gY2xhc3NOYW1lLm1hdGNoKHJnTm90U3BhY2UpIHx8IFtdO1xuICAgICAgICByZXR1cm4gISF+Y3VyQ2xhc3Nlcy5pbmRleE9mKHZhbHVlKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvZ2dsZUNsYXNzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGQgb3IgcmVtb3ZlIG9uZSBvciBtb3JlIGNsYXNzZXMgZnJvbSB0aGUgZWxlbWVudCwgZGVwZW5kaW5nIG9uIGVpdGhlclxuICAgICAqIHRoZSBjbGFzc+KAmXMgcHJlc2VuY2Ugb3IgdGhlIHZhbHVlIG9mIHRoZSBgZmxhZ2AgYXJndW1lbnQuXG4gICAgIC0gdmFsdWUgKHN0cmluZykgY2xhc3MgbmFtZSBvciBzcGFjZSBzZXBhcmF0ZWQgbGlzdCBvZiBjbGFzcyBuYW1lc1xuICAgICAtIGZsYWcgKGJvb2xlYW4pIHZhbHVlIHRvIGRldGVybWluZSB3aGV0aGVyIHRoZSBjbGFzcyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZFxuICAgICAqKlxuICAgICA9IChFbGVtZW50KSBvcmlnaW5hbCBlbGVtZW50LlxuICAgIFxcKi9cbiAgICBlbHByb3RvLnRvZ2dsZUNsYXNzID0gZnVuY3Rpb24gKHZhbHVlLCBmbGFnKSB7XG4gICAgICAgIGlmIChmbGFnICE9IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChmbGFnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRkQ2xhc3ModmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmVDbGFzcyh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNsYXNzZXMgPSAodmFsdWUgfHwgXCJcIikubWF0Y2gocmdOb3RTcGFjZSkgfHwgW10sXG4gICAgICAgICAgICBlbGVtID0gdGhpcy5ub2RlLFxuICAgICAgICAgICAgY2xhc3NOYW1lID0gZWxlbS5jbGFzc05hbWUuYmFzZVZhbCxcbiAgICAgICAgICAgIGN1ckNsYXNzZXMgPSBjbGFzc05hbWUubWF0Y2gocmdOb3RTcGFjZSkgfHwgW10sXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgcG9zLFxuICAgICAgICAgICAgY2xhenosXG4gICAgICAgICAgICBmaW5hbFZhbHVlO1xuICAgICAgICBqID0gMDtcbiAgICAgICAgd2hpbGUgKChjbGF6eiA9IGNsYXNzZXNbaisrXSkpIHtcbiAgICAgICAgICAgIHBvcyA9IGN1ckNsYXNzZXMuaW5kZXhPZihjbGF6eik7XG4gICAgICAgICAgICBpZiAofnBvcykge1xuICAgICAgICAgICAgICAgIGN1ckNsYXNzZXMuc3BsaWNlKHBvcywgMSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN1ckNsYXNzZXMucHVzaChjbGF6eik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmaW5hbFZhbHVlID0gY3VyQ2xhc3Nlcy5qb2luKFwiIFwiKTtcbiAgICAgICAgaWYgKGNsYXNzTmFtZSAhPSBmaW5hbFZhbHVlKSB7XG4gICAgICAgICAgICBlbGVtLmNsYXNzTmFtZS5iYXNlVmFsID0gZmluYWxWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYiwgRnJhZ21lbnQpIHtcbiAgICB2YXIgb3BlcmF0b3JzID0ge1xuICAgICAgICAgICAgXCIrXCI6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4ICsgeTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCItXCI6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4IC0geTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCIvXCI6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4IC8geTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXCIqXCI6IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB4ICogeTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFN0ciA9IFN0cmluZyxcbiAgICAgICAgcmVVbml0ID0gL1thLXpdKyQvaSxcbiAgICAgICAgcmVBZGRvbiA9IC9eXFxzKihbK1xcLVxcLypdKVxccyo9XFxzKihbXFxkLmVFK1xcLV0rKVxccyooW15cXGRcXHNdKyk/XFxzKiQvO1xuICAgIGZ1bmN0aW9uIGdldE51bWJlcih2YWwpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0VW5pdCh1bml0KSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAodmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gK3ZhbC50b0ZpeGVkKDMpICsgdW5pdDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHJcIiwgZnVuY3Rpb24gKHZhbCkge1xuICAgICAgICB2YXIgcGx1cyA9IFN0cih2YWwpLm1hdGNoKHJlQWRkb24pO1xuICAgICAgICBpZiAocGx1cykge1xuICAgICAgICAgICAgdmFyIGV2bnQgPSBldmUubnQoKSxcbiAgICAgICAgICAgICAgICBuYW1lID0gZXZudC5zdWJzdHJpbmcoZXZudC5sYXN0SW5kZXhPZihcIi5cIikgKyAxKSxcbiAgICAgICAgICAgICAgICBhID0gdGhpcy5hdHRyKG5hbWUpLFxuICAgICAgICAgICAgICAgIGF0ciA9IHt9O1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIHZhciB1bml0ID0gcGx1c1szXSB8fCBcIlwiLFxuICAgICAgICAgICAgICAgIGFVbml0ID0gYS5tYXRjaChyZVVuaXQpLFxuICAgICAgICAgICAgICAgIG9wID0gb3BlcmF0b3JzW3BsdXNbMV1dO1xuICAgICAgICAgICAgaWYgKGFVbml0ICYmIGFVbml0ID09IHVuaXQpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSBvcChwYXJzZUZsb2F0KGEpLCArcGx1c1syXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGEgPSB0aGlzLmFzUFgobmFtZSk7XG4gICAgICAgICAgICAgICAgdmFsID0gb3AodGhpcy5hc1BYKG5hbWUpLCB0aGlzLmFzUFgobmFtZSwgcGx1c1syXSArIHVuaXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc05hTihhKSB8fCBpc05hTih2YWwpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXRyW25hbWVdID0gdmFsO1xuICAgICAgICAgICAgdGhpcy5hdHRyKGF0cik7XG4gICAgICAgIH1cbiAgICB9KSgtMTApO1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5lcXVhbFwiLCBmdW5jdGlvbiAobmFtZSwgYikge1xuICAgICAgICB2YXIgQSwgQiwgYSA9IFN0cih0aGlzLmF0dHIobmFtZSkgfHwgXCJcIiksXG4gICAgICAgICAgICBlbCA9IHRoaXMsXG4gICAgICAgICAgICBicGx1cyA9IFN0cihiKS5tYXRjaChyZUFkZG9uKTtcbiAgICAgICAgaWYgKGJwbHVzKSB7XG4gICAgICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICAgICAgdmFyIHVuaXQgPSBicGx1c1szXSB8fCBcIlwiLFxuICAgICAgICAgICAgICAgIGFVbml0ID0gYS5tYXRjaChyZVVuaXQpLFxuICAgICAgICAgICAgICAgIG9wID0gb3BlcmF0b3JzW2JwbHVzWzFdXTtcbiAgICAgICAgICAgIGlmIChhVW5pdCAmJiBhVW5pdCA9PSB1bml0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbTogcGFyc2VGbG9hdChhKSxcbiAgICAgICAgICAgICAgICAgICAgdG86IG9wKHBhcnNlRmxvYXQoYSksICticGx1c1syXSksXG4gICAgICAgICAgICAgICAgICAgIGY6IGdldFVuaXQoYVVuaXQpXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYSA9IHRoaXMuYXNQWChuYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBmcm9tOiBhLFxuICAgICAgICAgICAgICAgICAgICB0bzogb3AoYSwgdGhpcy5hc1BYKG5hbWUsIGJwbHVzWzJdICsgdW5pdCkpLFxuICAgICAgICAgICAgICAgICAgICBmOiBnZXROdW1iZXJcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSkoLTEwKTtcbn0pO1xuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCkge1xuICAgIHZhciBwcm90byA9IFBhcGVyLnByb3RvdHlwZSxcbiAgICAgICAgaXMgPSBTbmFwLmlzO1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5yZWN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKlxuICAgICAqIERyYXdzIGEgcmVjdGFuZ2xlXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIHRvcCBsZWZ0IGNvcm5lclxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSB0b3AgbGVmdCBjb3JuZXJcbiAgICAgLSB3aWR0aCAobnVtYmVyKSB3aWR0aFxuICAgICAtIGhlaWdodCAobnVtYmVyKSBoZWlnaHRcbiAgICAgLSByeCAobnVtYmVyKSAjb3B0aW9uYWwgaG9yaXpvbnRhbCByYWRpdXMgZm9yIHJvdW5kZWQgY29ybmVycywgZGVmYXVsdCBpcyAwXG4gICAgIC0gcnkgKG51bWJlcikgI29wdGlvbmFsIHZlcnRpY2FsIHJhZGl1cyBmb3Igcm91bmRlZCBjb3JuZXJzLCBkZWZhdWx0IGlzIHJ4IG9yIDBcbiAgICAgPSAob2JqZWN0KSB0aGUgYHJlY3RgIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IC8vIHJlZ3VsYXIgcmVjdGFuZ2xlXG4gICAgIHwgdmFyIGMgPSBwYXBlci5yZWN0KDEwLCAxMCwgNTAsIDUwKTtcbiAgICAgfCAvLyByZWN0YW5nbGUgd2l0aCByb3VuZGVkIGNvcm5lcnNcbiAgICAgfCB2YXIgYyA9IHBhcGVyLnJlY3QoNDAsIDQwLCA1MCwgNTAsIDEwKTtcbiAgICBcXCovXG4gICAgcHJvdG8ucmVjdCA9IGZ1bmN0aW9uICh4LCB5LCB3LCBoLCByeCwgcnkpIHtcbiAgICAgICAgdmFyIGF0dHI7XG4gICAgICAgIGlmIChyeSA9PSBudWxsKSB7XG4gICAgICAgICAgICByeSA9IHJ4O1xuICAgICAgICB9XG4gICAgICAgIGlmIChpcyh4LCBcIm9iamVjdFwiKSAmJiB4ID09IFwiW29iamVjdCBPYmplY3RdXCIpIHtcbiAgICAgICAgICAgIGF0dHIgPSB4O1xuICAgICAgICB9IGVsc2UgaWYgKHggIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgd2lkdGg6IHcsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKHJ4ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyLnJ4ID0gcng7XG4gICAgICAgICAgICAgICAgYXR0ci5yeSA9IHJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwicmVjdFwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5jaXJjbGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGEgY2lyY2xlXG4gICAgICoqXG4gICAgIC0geCAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBjZW50cmVcbiAgICAgLSByIChudW1iZXIpIHJhZGl1c1xuICAgICA9IChvYmplY3QpIHRoZSBgY2lyY2xlYCBlbGVtZW50XG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLmNpcmNsZSg1MCwgNTAsIDQwKTtcbiAgICBcXCovXG4gICAgcHJvdG8uY2lyY2xlID0gZnVuY3Rpb24gKGN4LCBjeSwgcikge1xuICAgICAgICB2YXIgYXR0cjtcbiAgICAgICAgaWYgKGlzKGN4LCBcIm9iamVjdFwiKSAmJiBjeCA9PSBcIltvYmplY3QgT2JqZWN0XVwiKSB7XG4gICAgICAgICAgICBhdHRyID0gY3g7XG4gICAgICAgIH0gZWxzZSBpZiAoY3ggIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICBjeDogY3gsXG4gICAgICAgICAgICAgICAgY3k6IGN5LFxuICAgICAgICAgICAgICAgIHI6IHJcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJjaXJjbGVcIiwgYXR0cik7XG4gICAgfTtcblxuICAgIHZhciBwcmVsb2FkID0gKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZnVuY3Rpb24gb25lcnJvcigpIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHNyYywgZikge1xuICAgICAgICAgICAgdmFyIGltZyA9IGdsb2IuZG9jLmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiksXG4gICAgICAgICAgICAgICAgYm9keSA9IGdsb2IuZG9jLmJvZHk7XG4gICAgICAgICAgICBpbWcuc3R5bGUuY3NzVGV4dCA9IFwicG9zaXRpb246YWJzb2x1dGU7bGVmdDotOTk5OWVtO3RvcDotOTk5OWVtXCI7XG4gICAgICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGYuY2FsbChpbWcpO1xuICAgICAgICAgICAgICAgIGltZy5vbmxvYWQgPSBpbWcub25lcnJvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgYm9keS5yZW1vdmVDaGlsZChpbWcpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGltZy5vbmVycm9yID0gb25lcnJvcjtcbiAgICAgICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQoaW1nKTtcbiAgICAgICAgICAgIGltZy5zcmMgPSBzcmM7XG4gICAgICAgIH07XG4gICAgfSgpKTtcblxuICAgIC8qXFxcbiAgICAgKiBQYXBlci5pbWFnZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUGxhY2VzIGFuIGltYWdlIG9uIHRoZSBzdXJmYWNlXG4gICAgICoqXG4gICAgIC0gc3JjIChzdHJpbmcpIFVSSSBvZiB0aGUgc291cmNlIGltYWdlXG4gICAgIC0geCAobnVtYmVyKSB4IG9mZnNldCBwb3NpdGlvblxuICAgICAtIHkgKG51bWJlcikgeSBvZmZzZXQgcG9zaXRpb25cbiAgICAgLSB3aWR0aCAobnVtYmVyKSB3aWR0aCBvZiB0aGUgaW1hZ2VcbiAgICAgLSBoZWlnaHQgKG51bWJlcikgaGVpZ2h0IG9mIHRoZSBpbWFnZVxuICAgICA9IChvYmplY3QpIHRoZSBgaW1hZ2VgIGVsZW1lbnRcbiAgICAgKiBvclxuICAgICA9IChvYmplY3QpIFNuYXAgZWxlbWVudCBvYmplY3Qgd2l0aCB0eXBlIGBpbWFnZWBcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjID0gcGFwZXIuaW1hZ2UoXCJhcHBsZS5wbmdcIiwgMTAsIDEwLCA4MCwgODApO1xuICAgIFxcKi9cbiAgICBwcm90by5pbWFnZSA9IGZ1bmN0aW9uIChzcmMsIHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcy5lbChcImltYWdlXCIpO1xuICAgICAgICBpZiAoaXMoc3JjLCBcIm9iamVjdFwiKSAmJiBcInNyY1wiIGluIHNyYykge1xuICAgICAgICAgICAgZWwuYXR0cihzcmMpO1xuICAgICAgICB9IGVsc2UgaWYgKHNyYyAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgc2V0ID0ge1xuICAgICAgICAgICAgICAgIFwieGxpbms6aHJlZlwiOiBzcmMsXG4gICAgICAgICAgICAgICAgcHJlc2VydmVBc3BlY3RSYXRpbzogXCJub25lXCJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoeCAhPSBudWxsICYmIHkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNldC54ID0geDtcbiAgICAgICAgICAgICAgICBzZXQueSA9IHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod2lkdGggIT0gbnVsbCAmJiBoZWlnaHQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNldC53aWR0aCA9IHdpZHRoO1xuICAgICAgICAgICAgICAgIHNldC5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByZWxvYWQoc3JjLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIFNuYXAuXy4kKGVsLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLm9mZnNldEhlaWdodFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFNuYXAuXy4kKGVsLm5vZGUsIHNldCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLmVsbGlwc2VcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGFuIGVsbGlwc2VcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgY2VudHJlXG4gICAgIC0geSAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIGNlbnRyZVxuICAgICAtIHJ4IChudW1iZXIpIGhvcml6b250YWwgcmFkaXVzXG4gICAgIC0gcnkgKG51bWJlcikgdmVydGljYWwgcmFkaXVzXG4gICAgID0gKG9iamVjdCkgdGhlIGBlbGxpcHNlYCBlbGVtZW50XG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLmVsbGlwc2UoNTAsIDUwLCA0MCwgMjApO1xuICAgIFxcKi9cbiAgICBwcm90by5lbGxpcHNlID0gZnVuY3Rpb24gKGN4LCBjeSwgcngsIHJ5KSB7XG4gICAgICAgIHZhciBhdHRyO1xuICAgICAgICBpZiAoaXMoY3gsIFwib2JqZWN0XCIpICYmIGN4ID09IFwiW29iamVjdCBPYmplY3RdXCIpIHtcbiAgICAgICAgICAgIGF0dHIgPSBjeDtcbiAgICAgICAgfSBlbHNlIGlmIChjeCAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyID17XG4gICAgICAgICAgICAgICAgY3g6IGN4LFxuICAgICAgICAgICAgICAgIGN5OiBjeSxcbiAgICAgICAgICAgICAgICByeDogcngsXG4gICAgICAgICAgICAgICAgcnk6IHJ5XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwiZWxsaXBzZVwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8vIFNJRVJSQSBQYXBlci5wYXRoKCk6IFVuY2xlYXIgZnJvbSB0aGUgbGluayB3aGF0IGEgQ2F0bXVsbC1Sb20gY3VydmV0byBpcywgYW5kIHdoeSBpdCB3b3VsZCBtYWtlIGxpZmUgYW55IGVhc2llci5cbiAgICAvKlxcXG4gICAgICogUGFwZXIucGF0aFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGA8cGF0aD5gIGVsZW1lbnQgdXNpbmcgdGhlIGdpdmVuIHN0cmluZyBhcyB0aGUgcGF0aCdzIGRlZmluaXRpb25cbiAgICAgLSBwYXRoU3RyaW5nIChzdHJpbmcpICNvcHRpb25hbCBwYXRoIHN0cmluZyBpbiBTVkcgZm9ybWF0XG4gICAgICogUGF0aCBzdHJpbmcgY29uc2lzdHMgb2Ygb25lLWxldHRlciBjb21tYW5kcywgZm9sbG93ZWQgYnkgY29tbWEgc2VwcmFyYXRlZCBhcmd1bWVudHMgaW4gbnVtZXJpY2FsIGZvcm0uIEV4YW1wbGU6XG4gICAgIHwgXCJNMTAsMjBMMzAsNDBcIlxuICAgICAqIFRoaXMgZXhhbXBsZSBmZWF0dXJlcyB0d28gY29tbWFuZHM6IGBNYCwgd2l0aCBhcmd1bWVudHMgYCgxMCwgMjApYCBhbmQgYExgIHdpdGggYXJndW1lbnRzIGAoMzAsIDQwKWAuIFVwcGVyY2FzZSBsZXR0ZXIgY29tbWFuZHMgZXhwcmVzcyBjb29yZGluYXRlcyBpbiBhYnNvbHV0ZSB0ZXJtcywgd2hpbGUgbG93ZXJjYXNlIGNvbW1hbmRzIGV4cHJlc3MgdGhlbSBpbiByZWxhdGl2ZSB0ZXJtcyBmcm9tIHRoZSBtb3N0IHJlY2VudGx5IGRlY2xhcmVkIGNvb3JkaW5hdGVzLlxuICAgICAqXG4gICAgICMgPHA+SGVyZSBpcyBzaG9ydCBsaXN0IG9mIGNvbW1hbmRzIGF2YWlsYWJsZSwgZm9yIG1vcmUgZGV0YWlscyBzZWUgPGEgaHJlZj1cImh0dHA6Ly93d3cudzMub3JnL1RSL1NWRy9wYXRocy5odG1sI1BhdGhEYXRhXCIgdGl0bGU9XCJEZXRhaWxzIG9mIGEgcGF0aCdzIGRhdGEgYXR0cmlidXRlJ3MgZm9ybWF0IGFyZSBkZXNjcmliZWQgaW4gdGhlIFNWRyBzcGVjaWZpY2F0aW9uLlwiPlNWRyBwYXRoIHN0cmluZyBmb3JtYXQ8L2E+IG9yIDxhIGhyZWY9XCJodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9TVkcvVHV0b3JpYWwvUGF0aHNcIj5hcnRpY2xlIGFib3V0IHBhdGggc3RyaW5ncyBhdCBNRE48L2E+LjwvcD5cbiAgICAgIyA8dGFibGU+PHRoZWFkPjx0cj48dGg+Q29tbWFuZDwvdGg+PHRoPk5hbWU8L3RoPjx0aD5QYXJhbWV0ZXJzPC90aD48L3RyPjwvdGhlYWQ+PHRib2R5PlxuICAgICAjIDx0cj48dGQ+TTwvdGQ+PHRkPm1vdmV0bzwvdGQ+PHRkPih4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlo8L3RkPjx0ZD5jbG9zZXBhdGg8L3RkPjx0ZD4obm9uZSk8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5MPC90ZD48dGQ+bGluZXRvPC90ZD48dGQ+KHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+SDwvdGQ+PHRkPmhvcml6b250YWwgbGluZXRvPC90ZD48dGQ+eCs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5WPC90ZD48dGQ+dmVydGljYWwgbGluZXRvPC90ZD48dGQ+eSs8L3RkPjwvdHI+XG4gICAgICMgPHRyPjx0ZD5DPC90ZD48dGQ+Y3VydmV0bzwvdGQ+PHRkPih4MSB5MSB4MiB5MiB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlM8L3RkPjx0ZD5zbW9vdGggY3VydmV0bzwvdGQ+PHRkPih4MiB5MiB4IHkpKzwvdGQ+PC90cj5cbiAgICAgIyA8dHI+PHRkPlE8L3RkPjx0ZD5xdWFkcmF0aWMgQsOpemllciBjdXJ2ZXRvPC90ZD48dGQ+KHgxIHkxIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+VDwvdGQ+PHRkPnNtb290aCBxdWFkcmF0aWMgQsOpemllciBjdXJ2ZXRvPC90ZD48dGQ+KHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+QTwvdGQ+PHRkPmVsbGlwdGljYWwgYXJjPC90ZD48dGQ+KHJ4IHJ5IHgtYXhpcy1yb3RhdGlvbiBsYXJnZS1hcmMtZmxhZyBzd2VlcC1mbGFnIHggeSkrPC90ZD48L3RyPlxuICAgICAjIDx0cj48dGQ+UjwvdGQ+PHRkPjxhIGhyZWY9XCJodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NhdG11bGzigJNSb21fc3BsaW5lI0NhdG11bGwuRTIuODAuOTNSb21fc3BsaW5lXCI+Q2F0bXVsbC1Sb20gY3VydmV0bzwvYT4qPC90ZD48dGQ+eDEgeTEgKHggeSkrPC90ZD48L3RyPjwvdGJvZHk+PC90YWJsZT5cbiAgICAgKiAqIF9DYXRtdWxsLVJvbSBjdXJ2ZXRvXyBpcyBhIG5vdCBzdGFuZGFyZCBTVkcgY29tbWFuZCBhbmQgYWRkZWQgdG8gbWFrZSBsaWZlIGVhc2llci5cbiAgICAgKiBOb3RlOiB0aGVyZSBpcyBhIHNwZWNpYWwgY2FzZSB3aGVuIGEgcGF0aCBjb25zaXN0cyBvZiBvbmx5IHRocmVlIGNvbW1hbmRzOiBgTTEwLDEwUuKApnpgLiBJbiB0aGlzIGNhc2UgdGhlIHBhdGggY29ubmVjdHMgYmFjayB0byBpdHMgc3RhcnRpbmcgcG9pbnQuXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgYyA9IHBhcGVyLnBhdGgoXCJNMTAgMTBMOTAgOTBcIik7XG4gICAgIHwgLy8gZHJhdyBhIGRpYWdvbmFsIGxpbmU6XG4gICAgIHwgLy8gbW92ZSB0byAxMCwxMCwgbGluZSB0byA5MCw5MFxuICAgIFxcKi9cbiAgICBwcm90by5wYXRoID0gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgdmFyIGF0dHI7XG4gICAgICAgIGlmIChpcyhkLCBcIm9iamVjdFwiKSAmJiAhaXMoZCwgXCJhcnJheVwiKSkge1xuICAgICAgICAgICAgYXR0ciA9IGQ7XG4gICAgICAgIH0gZWxzZSBpZiAoZCkge1xuICAgICAgICAgICAgYXR0ciA9IHtkOiBkfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInBhdGhcIiwgYXR0cik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIGdyb3VwIGVsZW1lbnRcbiAgICAgKipcbiAgICAgLSB2YXJhcmdzICjigKYpICNvcHRpb25hbCBlbGVtZW50cyB0byBuZXN0IHdpdGhpbiB0aGUgZ3JvdXBcbiAgICAgPSAob2JqZWN0KSB0aGUgYGdgIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciBjMSA9IHBhcGVyLmNpcmNsZSgpLFxuICAgICB8ICAgICBjMiA9IHBhcGVyLnJlY3QoKSxcbiAgICAgfCAgICAgZyA9IHBhcGVyLmcoYzIsIGMxKTsgLy8gbm90ZSB0aGF0IHRoZSBvcmRlciBvZiBlbGVtZW50cyBpcyBkaWZmZXJlbnRcbiAgICAgKiBvclxuICAgICB8IHZhciBjMSA9IHBhcGVyLmNpcmNsZSgpLFxuICAgICB8ICAgICBjMiA9IHBhcGVyLnJlY3QoKSxcbiAgICAgfCAgICAgZyA9IHBhcGVyLmcoKTtcbiAgICAgfCBnLmFkZChjMiwgYzEpO1xuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogUGFwZXIuZ3JvdXBcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFNlZSBAUGFwZXIuZ1xuICAgIFxcKi9cbiAgICBwcm90by5ncm91cCA9IHByb3RvLmcgPSBmdW5jdGlvbiAoZmlyc3QpIHtcbiAgICAgICAgdmFyIGF0dHIsXG4gICAgICAgICAgICBlbCA9IHRoaXMuZWwoXCJnXCIpO1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxICYmIGZpcnN0ICYmICFmaXJzdC50eXBlKSB7XG4gICAgICAgICAgICBlbC5hdHRyKGZpcnN0KTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBlbC5hZGQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnN2Z1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQ3JlYXRlcyBhIG5lc3RlZCBTVkcgZWxlbWVudC5cbiAgICAgLSB4IChudW1iZXIpIEBvcHRpb25hbCBYIG9mIHRoZSBlbGVtZW50XG4gICAgIC0geSAobnVtYmVyKSBAb3B0aW9uYWwgWSBvZiB0aGUgZWxlbWVudFxuICAgICAtIHdpZHRoIChudW1iZXIpIEBvcHRpb25hbCB3aWR0aCBvZiB0aGUgZWxlbWVudFxuICAgICAtIGhlaWdodCAobnVtYmVyKSBAb3B0aW9uYWwgaGVpZ2h0IG9mIHRoZSBlbGVtZW50XG4gICAgIC0gdmJ4IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IFhcbiAgICAgLSB2YnkgKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggWVxuICAgICAtIHZidyAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCB3aWR0aFxuICAgICAtIHZiaCAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBoZWlnaHRcbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSB0aGUgYHN2Z2AgZWxlbWVudFxuICAgICAqKlxuICAgIFxcKi9cbiAgICBwcm90by5zdmcgPSBmdW5jdGlvbiAoeCwgeSwgd2lkdGgsIGhlaWdodCwgdmJ4LCB2YnksIHZidywgdmJoKSB7XG4gICAgICAgIHZhciBhdHRycyA9IHt9O1xuICAgICAgICBpZiAoaXMoeCwgXCJvYmplY3RcIikgJiYgeSA9PSBudWxsKSB7XG4gICAgICAgICAgICBhdHRycyA9IHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoeCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMueCA9IHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXR0cnMueSA9IHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod2lkdGggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHJzLndpZHRoID0gd2lkdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaGVpZ2h0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRycy5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmJ4ICE9IG51bGwgJiYgdmJ5ICE9IG51bGwgJiYgdmJ3ICE9IG51bGwgJiYgdmJoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRycy52aWV3Qm94ID0gW3ZieCwgdmJ5LCB2YncsIHZiaF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZWwoXCJzdmdcIiwgYXR0cnMpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLm1hc2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEVxdWl2YWxlbnQgaW4gYmVoYXZpb3VyIHRvIEBQYXBlci5nLCBleGNlcHQgaXTigJlzIGEgbWFzay5cbiAgICAgKipcbiAgICAgPSAob2JqZWN0KSB0aGUgYG1hc2tgIGVsZW1lbnRcbiAgICAgKipcbiAgICBcXCovXG4gICAgcHJvdG8ubWFzayA9IGZ1bmN0aW9uIChmaXJzdCkge1xuICAgICAgICB2YXIgYXR0cixcbiAgICAgICAgICAgIGVsID0gdGhpcy5lbChcIm1hc2tcIik7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEgJiYgZmlyc3QgJiYgIWZpcnN0LnR5cGUpIHtcbiAgICAgICAgICAgIGVsLmF0dHIoZmlyc3QpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGVsLmFkZChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucHRyblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRXF1aXZhbGVudCBpbiBiZWhhdmlvdXIgdG8gQFBhcGVyLmcsIGV4Y2VwdCBpdOKAmXMgYSBwYXR0ZXJuLlxuICAgICAtIHggKG51bWJlcikgQG9wdGlvbmFsIFggb2YgdGhlIGVsZW1lbnRcbiAgICAgLSB5IChudW1iZXIpIEBvcHRpb25hbCBZIG9mIHRoZSBlbGVtZW50XG4gICAgIC0gd2lkdGggKG51bWJlcikgQG9wdGlvbmFsIHdpZHRoIG9mIHRoZSBlbGVtZW50XG4gICAgIC0gaGVpZ2h0IChudW1iZXIpIEBvcHRpb25hbCBoZWlnaHQgb2YgdGhlIGVsZW1lbnRcbiAgICAgLSB2YnggKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggWFxuICAgICAtIHZieSAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBZXG4gICAgIC0gdmJ3IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IHdpZHRoXG4gICAgIC0gdmJoIChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IGhlaWdodFxuICAgICAqKlxuICAgICA9IChvYmplY3QpIHRoZSBgcGF0dGVybmAgZWxlbWVudFxuICAgICAqKlxuICAgIFxcKi9cbiAgICBwcm90by5wdHJuID0gZnVuY3Rpb24gKHgsIHksIHdpZHRoLCBoZWlnaHQsIHZ4LCB2eSwgdncsIHZoKSB7XG4gICAgICAgIGlmIChpcyh4LCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgdmFyIGF0dHIgPSB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXR0ciA9IHtwYXR0ZXJuVW5pdHM6IFwidXNlclNwYWNlT25Vc2VcIn07XG4gICAgICAgICAgICBpZiAoeCkge1xuICAgICAgICAgICAgICAgIGF0dHIueCA9IHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeSkge1xuICAgICAgICAgICAgICAgIGF0dHIueSA9IHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAod2lkdGggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHIud2lkdGggPSB3aWR0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChoZWlnaHQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGF0dHIuaGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHZ4ICE9IG51bGwgJiYgdnkgIT0gbnVsbCAmJiB2dyAhPSBudWxsICYmIHZoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhdHRyLnZpZXdCb3ggPSBbdngsIHZ5LCB2dywgdmhdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhdHRyLnZpZXdCb3ggPSBbeCB8fCAwLCB5IHx8IDAsIHdpZHRoIHx8IDAsIGhlaWdodCB8fCAwXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInBhdHRlcm5cIiwgYXR0cik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIudXNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgPHVzZT4gZWxlbWVudC5cbiAgICAgLSBpZCAoc3RyaW5nKSBAb3B0aW9uYWwgaWQgb2YgZWxlbWVudCB0byBsaW5rXG4gICAgICogb3JcbiAgICAgLSBpZCAoRWxlbWVudCkgQG9wdGlvbmFsIGVsZW1lbnQgdG8gbGlua1xuICAgICAqKlxuICAgICA9IChvYmplY3QpIHRoZSBgdXNlYCBlbGVtZW50XG4gICAgICoqXG4gICAgXFwqL1xuICAgIHByb3RvLnVzZSA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICBpZiAoaWQgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKGlkIGluc3RhbmNlb2YgRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIGlmICghaWQuYXR0cihcImlkXCIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlkLmF0dHIoe2lkOiBTbmFwLl8uaWQoaWQpfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlkID0gaWQuYXR0cihcImlkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFN0cmluZyhpZCkuY2hhckF0KCkgPT0gXCIjXCIpIHtcbiAgICAgICAgICAgICAgICBpZCA9IGlkLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVsKFwidXNlXCIsIHtcInhsaW5rOmhyZWZcIjogXCIjXCIgKyBpZH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIEVsZW1lbnQucHJvdG90eXBlLnVzZS5jYWxsKHRoaXMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuc3ltYm9sXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgPHN5bWJvbD4gZWxlbWVudC5cbiAgICAgLSB2YnggKG51bWJlcikgQG9wdGlvbmFsIHZpZXdib3ggWFxuICAgICAtIHZieSAobnVtYmVyKSBAb3B0aW9uYWwgdmlld2JveCBZXG4gICAgIC0gdmJ3IChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IHdpZHRoXG4gICAgIC0gdmJoIChudW1iZXIpIEBvcHRpb25hbCB2aWV3Ym94IGhlaWdodFxuICAgICA9IChvYmplY3QpIHRoZSBgc3ltYm9sYCBlbGVtZW50XG4gICAgICoqXG4gICAgXFwqL1xuICAgIHByb3RvLnN5bWJvbCA9IGZ1bmN0aW9uICh2eCwgdnksIHZ3LCB2aCkge1xuICAgICAgICB2YXIgYXR0ciA9IHt9O1xuICAgICAgICBpZiAodnggIT0gbnVsbCAmJiB2eSAhPSBudWxsICYmIHZ3ICE9IG51bGwgJiYgdmggIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ci52aWV3Qm94ID0gW3Z4LCB2eSwgdncsIHZoXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwic3ltYm9sXCIsIGF0dHIpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFBhcGVyLnRleHRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIERyYXdzIGEgdGV4dCBzdHJpbmdcbiAgICAgKipcbiAgICAgLSB4IChudW1iZXIpIHggY29vcmRpbmF0ZSBwb3NpdGlvblxuICAgICAtIHkgKG51bWJlcikgeSBjb29yZGluYXRlIHBvc2l0aW9uXG4gICAgIC0gdGV4dCAoc3RyaW5nfGFycmF5KSBUaGUgdGV4dCBzdHJpbmcgdG8gZHJhdyBvciBhcnJheSBvZiBzdHJpbmdzIHRvIG5lc3Qgd2l0aGluIHNlcGFyYXRlIGA8dHNwYW4+YCBlbGVtZW50c1xuICAgICA9IChvYmplY3QpIHRoZSBgdGV4dGAgZWxlbWVudFxuICAgICAqKlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIHQxID0gcGFwZXIudGV4dCg1MCwgNTAsIFwiU25hcFwiKTtcbiAgICAgfCB2YXIgdDIgPSBwYXBlci50ZXh0KDUwLCA1MCwgW1wiU1wiLFwiblwiLFwiYVwiLFwicFwiXSk7XG4gICAgIHwgLy8gVGV4dCBwYXRoIHVzYWdlXG4gICAgIHwgdDEuYXR0cih7dGV4dHBhdGg6IFwiTTEwLDEwTDEwMCwxMDBcIn0pO1xuICAgICB8IC8vIG9yXG4gICAgIHwgdmFyIHB0aCA9IHBhcGVyLnBhdGgoXCJNMTAsMTBMMTAwLDEwMFwiKTtcbiAgICAgfCB0MS5hdHRyKHt0ZXh0cGF0aDogcHRofSk7XG4gICAgXFwqL1xuICAgIHByb3RvLnRleHQgPSBmdW5jdGlvbiAoeCwgeSwgdGV4dCkge1xuICAgICAgICB2YXIgYXR0ciA9IHt9O1xuICAgICAgICBpZiAoaXMoeCwgXCJvYmplY3RcIikpIHtcbiAgICAgICAgICAgIGF0dHIgPSB4O1xuICAgICAgICB9IGVsc2UgaWYgKHggIT0gbnVsbCkge1xuICAgICAgICAgICAgYXR0ciA9IHtcbiAgICAgICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgdGV4dDogdGV4dCB8fCBcIlwiXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwidGV4dFwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5saW5lXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBEcmF3cyBhIGxpbmVcbiAgICAgKipcbiAgICAgLSB4MSAobnVtYmVyKSB4IGNvb3JkaW5hdGUgcG9zaXRpb24gb2YgdGhlIHN0YXJ0XG4gICAgIC0geTEgKG51bWJlcikgeSBjb29yZGluYXRlIHBvc2l0aW9uIG9mIHRoZSBzdGFydFxuICAgICAtIHgyIChudW1iZXIpIHggY29vcmRpbmF0ZSBwb3NpdGlvbiBvZiB0aGUgZW5kXG4gICAgIC0geTIgKG51bWJlcikgeSBjb29yZGluYXRlIHBvc2l0aW9uIG9mIHRoZSBlbmRcbiAgICAgPSAob2JqZWN0KSB0aGUgYGxpbmVgIGVsZW1lbnRcbiAgICAgKipcbiAgICAgPiBVc2FnZVxuICAgICB8IHZhciB0MSA9IHBhcGVyLmxpbmUoNTAsIDUwLCAxMDAsIDEwMCk7XG4gICAgXFwqL1xuICAgIHByb3RvLmxpbmUgPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgdmFyIGF0dHIgPSB7fTtcbiAgICAgICAgaWYgKGlzKHgxLCBcIm9iamVjdFwiKSkge1xuICAgICAgICAgICAgYXR0ciA9IHgxO1xuICAgICAgICB9IGVsc2UgaWYgKHgxICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgeDE6IHgxLFxuICAgICAgICAgICAgICAgIHgyOiB4MixcbiAgICAgICAgICAgICAgICB5MTogeTEsXG4gICAgICAgICAgICAgICAgeTI6IHkyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwibGluZVwiLCBhdHRyKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBQYXBlci5wb2x5bGluZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYSBwb2x5bGluZVxuICAgICAqKlxuICAgICAtIHBvaW50cyAoYXJyYXkpIGFycmF5IG9mIHBvaW50c1xuICAgICAqIG9yXG4gICAgIC0gdmFyYXJncyAo4oCmKSBwb2ludHNcbiAgICAgPSAob2JqZWN0KSB0aGUgYHBvbHlsaW5lYCBlbGVtZW50XG4gICAgICoqXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgcDEgPSBwYXBlci5wb2x5bGluZShbMTAsIDEwLCAxMDAsIDEwMF0pO1xuICAgICB8IHZhciBwMiA9IHBhcGVyLnBvbHlsaW5lKDEwLCAxMCwgMTAwLCAxMDApO1xuICAgIFxcKi9cbiAgICBwcm90by5wb2x5bGluZSA9IGZ1bmN0aW9uIChwb2ludHMpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBwb2ludHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhdHRyID0ge307XG4gICAgICAgIGlmIChpcyhwb2ludHMsIFwib2JqZWN0XCIpICYmICFpcyhwb2ludHMsIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIGF0dHIgPSBwb2ludHM7XG4gICAgICAgIH0gZWxzZSBpZiAocG9pbnRzICE9IG51bGwpIHtcbiAgICAgICAgICAgIGF0dHIgPSB7cG9pbnRzOiBwb2ludHN9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmVsKFwicG9seWxpbmVcIiwgYXR0cik7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIucG9seWdvblxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRHJhd3MgYSBwb2x5Z29uLiBTZWUgQFBhcGVyLnBvbHlsaW5lXG4gICAgXFwqL1xuICAgIHByb3RvLnBvbHlnb24gPSBmdW5jdGlvbiAocG9pbnRzKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgcG9pbnRzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXR0ciA9IHt9O1xuICAgICAgICBpZiAoaXMocG9pbnRzLCBcIm9iamVjdFwiKSAmJiAhaXMocG9pbnRzLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBhdHRyID0gcG9pbnRzO1xuICAgICAgICB9IGVsc2UgaWYgKHBvaW50cyAhPSBudWxsKSB7XG4gICAgICAgICAgICBhdHRyID0ge3BvaW50czogcG9pbnRzfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5lbChcInBvbHlnb25cIiwgYXR0cik7XG4gICAgfTtcbiAgICAvLyBncmFkaWVudHNcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgJCA9IFNuYXAuXy4kO1xuICAgICAgICAvLyBncmFkaWVudHMnIGhlbHBlcnNcbiAgICAgICAgZnVuY3Rpb24gR3N0b3BzKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0QWxsKFwic3RvcFwiKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBHYWRkU3RvcChjb2xvciwgb2Zmc2V0KSB7XG4gICAgICAgICAgICB2YXIgc3RvcCA9ICQoXCJzdG9wXCIpLFxuICAgICAgICAgICAgICAgIGF0dHIgPSB7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogK29mZnNldCArIFwiJVwiXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbG9yID0gU25hcC5jb2xvcihjb2xvcik7XG4gICAgICAgICAgICBhdHRyW1wic3RvcC1jb2xvclwiXSA9IGNvbG9yLmhleDtcbiAgICAgICAgICAgIGlmIChjb2xvci5vcGFjaXR5IDwgMSkge1xuICAgICAgICAgICAgICAgIGF0dHJbXCJzdG9wLW9wYWNpdHlcIl0gPSBjb2xvci5vcGFjaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgJChzdG9wLCBhdHRyKTtcbiAgICAgICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZChzdG9wKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIEdnZXRCQm94KCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudHlwZSA9PSBcImxpbmVhckdyYWRpZW50XCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgeDEgPSAkKHRoaXMubm9kZSwgXCJ4MVwiKSB8fCAwLFxuICAgICAgICAgICAgICAgICAgICB4MiA9ICQodGhpcy5ub2RlLCBcIngyXCIpIHx8IDEsXG4gICAgICAgICAgICAgICAgICAgIHkxID0gJCh0aGlzLm5vZGUsIFwieTFcIikgfHwgMCxcbiAgICAgICAgICAgICAgICAgICAgeTIgPSAkKHRoaXMubm9kZSwgXCJ5MlwiKSB8fCAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBTbmFwLl8uYm94KHgxLCB5MSwgbWF0aC5hYnMoeDIgLSB4MSksIG1hdGguYWJzKHkyIC0geTEpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGN4ID0gdGhpcy5ub2RlLmN4IHx8IC41LFxuICAgICAgICAgICAgICAgICAgICBjeSA9IHRoaXMubm9kZS5jeSB8fCAuNSxcbiAgICAgICAgICAgICAgICAgICAgciA9IHRoaXMubm9kZS5yIHx8IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFNuYXAuXy5ib3goY3ggLSByLCBjeSAtIHIsIHIgKiAyLCByICogMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ3JhZGllbnQoZGVmcywgc3RyKSB7XG4gICAgICAgICAgICB2YXIgZ3JhZCA9IGV2ZShcInNuYXAudXRpbC5ncmFkLnBhcnNlXCIsIG51bGwsIHN0cikuZmlyc3REZWZpbmVkKCksXG4gICAgICAgICAgICAgICAgZWw7XG4gICAgICAgICAgICBpZiAoIWdyYWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdyYWQucGFyYW1zLnVuc2hpZnQoZGVmcyk7XG4gICAgICAgICAgICBpZiAoZ3JhZC50eXBlLnRvTG93ZXJDYXNlKCkgPT0gXCJsXCIpIHtcbiAgICAgICAgICAgICAgICBlbCA9IGdyYWRpZW50TGluZWFyLmFwcGx5KDAsIGdyYWQucGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWwgPSBncmFkaWVudFJhZGlhbC5hcHBseSgwLCBncmFkLnBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZ3JhZC50eXBlICE9IGdyYWQudHlwZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgJChlbC5ub2RlLCB7XG4gICAgICAgICAgICAgICAgICAgIGdyYWRpZW50VW5pdHM6IFwidXNlclNwYWNlT25Vc2VcIlxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN0b3BzID0gZ3JhZC5zdG9wcyxcbiAgICAgICAgICAgICAgICBsZW4gPSBzdG9wcy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgc3RhcnQgPSAwLFxuICAgICAgICAgICAgICAgIGogPSAwO1xuICAgICAgICAgICAgZnVuY3Rpb24gc2VlZChpLCBlbmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RlcCA9IChlbmQgLSBzdGFydCkgLyAoaSAtIGopO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgPSBqOyBrIDwgaTsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3BzW2tdLm9mZnNldCA9ICsoK3N0YXJ0ICsgc3RlcCAqIChrIC0gaikpLnRvRml4ZWQoMik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGogPSBpO1xuICAgICAgICAgICAgICAgIHN0YXJ0ID0gZW5kO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGVuLS07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSBpZiAoXCJvZmZzZXRcIiBpbiBzdG9wc1tpXSkge1xuICAgICAgICAgICAgICAgIHNlZWQoaSwgc3RvcHNbaV0ub2Zmc2V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0b3BzW2xlbl0ub2Zmc2V0ID0gc3RvcHNbbGVuXS5vZmZzZXQgfHwgMTAwO1xuICAgICAgICAgICAgc2VlZChsZW4sIHN0b3BzW2xlbl0ub2Zmc2V0KTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPD0gbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcCA9IHN0b3BzW2ldO1xuICAgICAgICAgICAgICAgIGVsLmFkZFN0b3Aoc3RvcC5jb2xvciwgc3RvcC5vZmZzZXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdyYWRpZW50TGluZWFyKGRlZnMsIHgxLCB5MSwgeDIsIHkyKSB7XG4gICAgICAgICAgICB2YXIgZWwgPSBTbmFwLl8ubWFrZShcImxpbmVhckdyYWRpZW50XCIsIGRlZnMpO1xuICAgICAgICAgICAgZWwuc3RvcHMgPSBHc3RvcHM7XG4gICAgICAgICAgICBlbC5hZGRTdG9wID0gR2FkZFN0b3A7XG4gICAgICAgICAgICBlbC5nZXRCQm94ID0gR2dldEJCb3g7XG4gICAgICAgICAgICBpZiAoeDEgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICQoZWwubm9kZSwge1xuICAgICAgICAgICAgICAgICAgICB4MTogeDEsXG4gICAgICAgICAgICAgICAgICAgIHkxOiB5MSxcbiAgICAgICAgICAgICAgICAgICAgeDI6IHgyLFxuICAgICAgICAgICAgICAgICAgICB5MjogeTJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBncmFkaWVudFJhZGlhbChkZWZzLCBjeCwgY3ksIHIsIGZ4LCBmeSkge1xuICAgICAgICAgICAgdmFyIGVsID0gU25hcC5fLm1ha2UoXCJyYWRpYWxHcmFkaWVudFwiLCBkZWZzKTtcbiAgICAgICAgICAgIGVsLnN0b3BzID0gR3N0b3BzO1xuICAgICAgICAgICAgZWwuYWRkU3RvcCA9IEdhZGRTdG9wO1xuICAgICAgICAgICAgZWwuZ2V0QkJveCA9IEdnZXRCQm94O1xuICAgICAgICAgICAgaWYgKGN4ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAkKGVsLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgY3g6IGN4LFxuICAgICAgICAgICAgICAgICAgICBjeTogY3ksXG4gICAgICAgICAgICAgICAgICAgIHI6IHJcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmeCAhPSBudWxsICYmIGZ5ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAkKGVsLm5vZGUsIHtcbiAgICAgICAgICAgICAgICAgICAgZng6IGZ4LFxuICAgICAgICAgICAgICAgICAgICBmeTogZnlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgfVxuICAgICAgICAvKlxcXG4gICAgICAgICAqIFBhcGVyLmdyYWRpZW50XG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBDcmVhdGVzIGEgZ3JhZGllbnQgZWxlbWVudFxuICAgICAgICAgKipcbiAgICAgICAgIC0gZ3JhZGllbnQgKHN0cmluZykgZ3JhZGllbnQgZGVzY3JpcHRvclxuICAgICAgICAgPiBHcmFkaWVudCBEZXNjcmlwdG9yXG4gICAgICAgICAqIFRoZSBncmFkaWVudCBkZXNjcmlwdG9yIGlzIGFuIGV4cHJlc3Npb24gZm9ybWF0dGVkIGFzXG4gICAgICAgICAqIGZvbGxvd3M6IGA8dHlwZT4oPGNvb3Jkcz4pPGNvbG9ycz5gLiAgVGhlIGA8dHlwZT5gIGNhbiBiZVxuICAgICAgICAgKiBlaXRoZXIgbGluZWFyIG9yIHJhZGlhbC4gIFRoZSB1cHBlcmNhc2UgYExgIG9yIGBSYCBsZXR0ZXJzXG4gICAgICAgICAqIGluZGljYXRlIGFic29sdXRlIGNvb3JkaW5hdGVzIG9mZnNldCBmcm9tIHRoZSBTVkcgc3VyZmFjZS5cbiAgICAgICAgICogTG93ZXJjYXNlIGBsYCBvciBgcmAgbGV0dGVycyBpbmRpY2F0ZSBjb29yZGluYXRlc1xuICAgICAgICAgKiBjYWxjdWxhdGVkIHJlbGF0aXZlIHRvIHRoZSBlbGVtZW50IHRvIHdoaWNoIHRoZSBncmFkaWVudCBpc1xuICAgICAgICAgKiBhcHBsaWVkLiAgQ29vcmRpbmF0ZXMgc3BlY2lmeSBhIGxpbmVhciBncmFkaWVudCB2ZWN0b3IgYXNcbiAgICAgICAgICogYHgxYCwgYHkxYCwgYHgyYCwgYHkyYCwgb3IgYSByYWRpYWwgZ3JhZGllbnQgYXMgYGN4YCwgYGN5YCxcbiAgICAgICAgICogYHJgIGFuZCBvcHRpb25hbCBgZnhgLCBgZnlgIHNwZWNpZnlpbmcgYSBmb2NhbCBwb2ludCBhd2F5XG4gICAgICAgICAqIGZyb20gdGhlIGNlbnRlciBvZiB0aGUgY2lyY2xlLiBTcGVjaWZ5IGA8Y29sb3JzPmAgYXMgYSBsaXN0XG4gICAgICAgICAqIG9mIGRhc2gtc2VwYXJhdGVkIENTUyBjb2xvciB2YWx1ZXMuICBFYWNoIGNvbG9yIG1heSBiZVxuICAgICAgICAgKiBmb2xsb3dlZCBieSBhIGN1c3RvbSBvZmZzZXQgdmFsdWUsIHNlcGFyYXRlZCB3aXRoIGEgY29sb25cbiAgICAgICAgICogY2hhcmFjdGVyLlxuICAgICAgICAgPiBFeGFtcGxlc1xuICAgICAgICAgKiBMaW5lYXIgZ3JhZGllbnQsIHJlbGF0aXZlIGZyb20gdG9wLWxlZnQgY29ybmVyIHRvIGJvdHRvbS1yaWdodFxuICAgICAgICAgKiBjb3JuZXIsIGZyb20gYmxhY2sgdGhyb3VnaCByZWQgdG8gd2hpdGU6XG4gICAgICAgICB8IHZhciBnID0gcGFwZXIuZ3JhZGllbnQoXCJsKDAsIDAsIDEsIDEpIzAwMC0jZjAwLSNmZmZcIik7XG4gICAgICAgICAqIExpbmVhciBncmFkaWVudCwgYWJzb2x1dGUgZnJvbSAoMCwgMCkgdG8gKDEwMCwgMTAwKSwgZnJvbSBibGFja1xuICAgICAgICAgKiB0aHJvdWdoIHJlZCBhdCAyNSUgdG8gd2hpdGU6XG4gICAgICAgICB8IHZhciBnID0gcGFwZXIuZ3JhZGllbnQoXCJMKDAsIDAsIDEwMCwgMTAwKSMwMDAtI2YwMDoyNS0jZmZmXCIpO1xuICAgICAgICAgKiBSYWRpYWwgZ3JhZGllbnQsIHJlbGF0aXZlIGZyb20gdGhlIGNlbnRlciBvZiB0aGUgZWxlbWVudCB3aXRoIHJhZGl1c1xuICAgICAgICAgKiBoYWxmIHRoZSB3aWR0aCwgZnJvbSBibGFjayB0byB3aGl0ZTpcbiAgICAgICAgIHwgdmFyIGcgPSBwYXBlci5ncmFkaWVudChcInIoMC41LCAwLjUsIDAuNSkjMDAwLSNmZmZcIik7XG4gICAgICAgICAqIFRvIGFwcGx5IHRoZSBncmFkaWVudDpcbiAgICAgICAgIHwgcGFwZXIuY2lyY2xlKDUwLCA1MCwgNDApLmF0dHIoe1xuICAgICAgICAgfCAgICAgZmlsbDogZ1xuICAgICAgICAgfCB9KTtcbiAgICAgICAgID0gKG9iamVjdCkgdGhlIGBncmFkaWVudGAgZWxlbWVudFxuICAgICAgICBcXCovXG4gICAgICAgIHByb3RvLmdyYWRpZW50ID0gZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIGdyYWRpZW50KHRoaXMuZGVmcywgc3RyKTtcbiAgICAgICAgfTtcbiAgICAgICAgcHJvdG8uZ3JhZGllbnRMaW5lYXIgPSBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIpIHtcbiAgICAgICAgICAgIHJldHVybiBncmFkaWVudExpbmVhcih0aGlzLmRlZnMsIHgxLCB5MSwgeDIsIHkyKTtcbiAgICAgICAgfTtcbiAgICAgICAgcHJvdG8uZ3JhZGllbnRSYWRpYWwgPSBmdW5jdGlvbiAoY3gsIGN5LCByLCBmeCwgZnkpIHtcbiAgICAgICAgICAgIHJldHVybiBncmFkaWVudFJhZGlhbCh0aGlzLmRlZnMsIGN4LCBjeSwgciwgZngsIGZ5KTtcbiAgICAgICAgfTtcbiAgICAgICAgLypcXFxuICAgICAgICAgKiBQYXBlci50b1N0cmluZ1xuICAgICAgICAgWyBtZXRob2QgXVxuICAgICAgICAgKipcbiAgICAgICAgICogUmV0dXJucyBTVkcgY29kZSBmb3IgdGhlIEBQYXBlclxuICAgICAgICAgPSAoc3RyaW5nKSBTVkcgY29kZSBmb3IgdGhlIEBQYXBlclxuICAgICAgICBcXCovXG4gICAgICAgIHByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGRvYyA9IHRoaXMubm9kZS5vd25lckRvY3VtZW50LFxuICAgICAgICAgICAgICAgIGYgPSBkb2MuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICAgICAgICAgIGQgPSBkb2MuY3JlYXRlRWxlbWVudChcImRpdlwiKSxcbiAgICAgICAgICAgICAgICBzdmcgPSB0aGlzLm5vZGUuY2xvbmVOb2RlKHRydWUpLFxuICAgICAgICAgICAgICAgIHJlcztcbiAgICAgICAgICAgIGYuYXBwZW5kQ2hpbGQoZCk7XG4gICAgICAgICAgICBkLmFwcGVuZENoaWxkKHN2Zyk7XG4gICAgICAgICAgICBTbmFwLl8uJChzdmcsIHt4bWxuczogXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wifSk7XG4gICAgICAgICAgICByZXMgPSBkLmlubmVySFRNTDtcbiAgICAgICAgICAgIGYucmVtb3ZlQ2hpbGQoZi5maXJzdENoaWxkKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH07XG4gICAgICAgIC8qXFxcbiAgICAgICAgICogUGFwZXIudG9EYXRhVVJMXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZXR1cm5zIFNWRyBjb2RlIGZvciB0aGUgQFBhcGVyIGFzIERhdGEgVVJJIHN0cmluZy5cbiAgICAgICAgID0gKHN0cmluZykgRGF0YSBVUkkgc3RyaW5nXG4gICAgICAgIFxcKi9cbiAgICAgICAgcHJvdG8udG9EYXRhVVJMID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHdpbmRvdyAmJiB3aW5kb3cuYnRvYSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsXCIgKyBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudCh0aGlzKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvKlxcXG4gICAgICAgICAqIFBhcGVyLmNsZWFyXG4gICAgICAgICBbIG1ldGhvZCBdXG4gICAgICAgICAqKlxuICAgICAgICAgKiBSZW1vdmVzIGFsbCBjaGlsZCBub2RlcyBvZiB0aGUgcGFwZXIsIGV4Y2VwdCA8ZGVmcz4uXG4gICAgICAgIFxcKi9cbiAgICAgICAgcHJvdG8uY2xlYXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMubm9kZS5maXJzdENoaWxkLFxuICAgICAgICAgICAgICAgIG5leHQ7XG4gICAgICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgICAgIG5leHQgPSBub2RlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnRhZ05hbWUgIT0gXCJkZWZzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3RvLmNsZWFyLmNhbGwoe25vZGU6IG5vZGV9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbm9kZSA9IG5leHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSgpKTtcbn0pO1xuXG4vLyBDb3B5cmlnaHQgKGMpIDIwMTMgQWRvYmUgU3lzdGVtcyBJbmNvcnBvcmF0ZWQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBcbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vIFxuLy8gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLyBcbi8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5TbmFwLnBsdWdpbihmdW5jdGlvbiAoU25hcCwgRWxlbWVudCwgUGFwZXIsIGdsb2IpIHtcbiAgICB2YXIgZWxwcm90byA9IEVsZW1lbnQucHJvdG90eXBlLFxuICAgICAgICBpcyA9IFNuYXAuaXMsXG4gICAgICAgIGNsb25lID0gU25hcC5fLmNsb25lLFxuICAgICAgICBoYXMgPSBcImhhc093blByb3BlcnR5XCIsXG4gICAgICAgIHAycyA9IC8sPyhbYS16XSksPy9naSxcbiAgICAgICAgdG9GbG9hdCA9IHBhcnNlRmxvYXQsXG4gICAgICAgIG1hdGggPSBNYXRoLFxuICAgICAgICBQSSA9IG1hdGguUEksXG4gICAgICAgIG1taW4gPSBtYXRoLm1pbixcbiAgICAgICAgbW1heCA9IG1hdGgubWF4LFxuICAgICAgICBwb3cgPSBtYXRoLnBvdyxcbiAgICAgICAgYWJzID0gbWF0aC5hYnM7XG4gICAgZnVuY3Rpb24gcGF0aHMocHMpIHtcbiAgICAgICAgdmFyIHAgPSBwYXRocy5wcyA9IHBhdGhzLnBzIHx8IHt9O1xuICAgICAgICBpZiAocFtwc10pIHtcbiAgICAgICAgICAgIHBbcHNdLnNsZWVwID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcFtwc10gPSB7XG4gICAgICAgICAgICAgICAgc2xlZXA6IDEwMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBwKSBpZiAocFtoYXNdKGtleSkgJiYga2V5ICE9IHBzKSB7XG4gICAgICAgICAgICAgICAgcFtrZXldLnNsZWVwLS07XG4gICAgICAgICAgICAgICAgIXBba2V5XS5zbGVlcCAmJiBkZWxldGUgcFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHBbcHNdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBib3goeCwgeSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICBpZiAoeCA9PSBudWxsKSB7XG4gICAgICAgICAgICB4ID0geSA9IHdpZHRoID0gaGVpZ2h0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoeSA9PSBudWxsKSB7XG4gICAgICAgICAgICB5ID0geC55O1xuICAgICAgICAgICAgd2lkdGggPSB4LndpZHRoO1xuICAgICAgICAgICAgaGVpZ2h0ID0geC5oZWlnaHQ7XG4gICAgICAgICAgICB4ID0geC54O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIHc6IHdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICBoOiBoZWlnaHQsXG4gICAgICAgICAgICB4MjogeCArIHdpZHRoLFxuICAgICAgICAgICAgeTI6IHkgKyBoZWlnaHQsXG4gICAgICAgICAgICBjeDogeCArIHdpZHRoIC8gMixcbiAgICAgICAgICAgIGN5OiB5ICsgaGVpZ2h0IC8gMixcbiAgICAgICAgICAgIHIxOiBtYXRoLm1pbih3aWR0aCwgaGVpZ2h0KSAvIDIsXG4gICAgICAgICAgICByMjogbWF0aC5tYXgod2lkdGgsIGhlaWdodCkgLyAyLFxuICAgICAgICAgICAgcjA6IG1hdGguc3FydCh3aWR0aCAqIHdpZHRoICsgaGVpZ2h0ICogaGVpZ2h0KSAvIDIsXG4gICAgICAgICAgICBwYXRoOiByZWN0UGF0aCh4LCB5LCB3aWR0aCwgaGVpZ2h0KSxcbiAgICAgICAgICAgIHZiOiBbeCwgeSwgd2lkdGgsIGhlaWdodF0uam9pbihcIiBcIilcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmpvaW4oXCIsXCIpLnJlcGxhY2UocDJzLCBcIiQxXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRoQ2xvbmUocGF0aEFycmF5KSB7XG4gICAgICAgIHZhciByZXMgPSBjbG9uZShwYXRoQXJyYXkpO1xuICAgICAgICByZXMudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGgocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnksIGxlbmd0aCkge1xuICAgICAgICBpZiAobGVuZ3RoID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBiZXpsZW4ocDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmREb3RzQXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LFxuICAgICAgICAgICAgICAgIGdldFRvdExlbihwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgbGVuZ3RoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0TGVuZ3RoRmFjdG9yeShpc3RvdGFsLCBzdWJwYXRoKSB7XG4gICAgICAgIGZ1bmN0aW9uIE8odmFsKSB7XG4gICAgICAgICAgICByZXR1cm4gKygrdmFsKS50b0ZpeGVkKDMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTbmFwLl8uY2FjaGVyKGZ1bmN0aW9uIChwYXRoLCBsZW5ndGgsIG9ubHlzdGFydCkge1xuICAgICAgICAgICAgaWYgKHBhdGggaW5zdGFuY2VvZiBFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGguYXR0cihcImRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYXRoID0gcGF0aDJjdXJ2ZShwYXRoKTtcbiAgICAgICAgICAgIHZhciB4LCB5LCBwLCBsLCBzcCA9IFwiXCIsIHN1YnBhdGhzID0ge30sIHBvaW50LFxuICAgICAgICAgICAgICAgIGxlbiA9IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwID0gcGF0aFtpXTtcbiAgICAgICAgICAgICAgICBpZiAocFswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgICAgICB4ID0gK3BbMV07XG4gICAgICAgICAgICAgICAgICAgIHkgPSArcFsyXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBsID0gZ2V0UG9pbnRBdFNlZ21lbnRMZW5ndGgoeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZW4gKyBsID4gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VicGF0aCAmJiAhc3VicGF0aHMuc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb2ludCA9IGdldFBvaW50QXRTZWdtZW50TGVuZ3RoKHgsIHksIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIHBbNl0sIGxlbmd0aCAtIGxlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3AgKz0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIkNcIiArIE8ocG9pbnQuc3RhcnQueCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQuc3RhcnQueSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQubS54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC5tLnkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50LngpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50LnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob25seXN0YXJ0KSB7cmV0dXJuIHNwO31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJwYXRocy5zdGFydCA9IHNwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIk1cIiArIE8ocG9pbnQueCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocG9pbnQueSkgKyBcIkNcIiArIE8ocG9pbnQubi54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC5uLnkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBPKHBvaW50LmVuZC54KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTyhwb2ludC5lbmQueSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocFs1XSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE8ocFs2XSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLmpvaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZW4gKz0gbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ID0gK3BbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeSA9ICtwWzZdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc3RvdGFsICYmICFzdWJwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSBnZXRQb2ludEF0U2VnbWVudExlbmd0aCh4LCB5LCBwWzFdLCBwWzJdLCBwWzNdLCBwWzRdLCBwWzVdLCBwWzZdLCBsZW5ndGggLSBsZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwb2ludDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZW4gKz0gbDtcbiAgICAgICAgICAgICAgICAgICAgeCA9ICtwWzVdO1xuICAgICAgICAgICAgICAgICAgICB5ID0gK3BbNl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNwICs9IHAuc2hpZnQoKSArIHA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdWJwYXRocy5lbmQgPSBzcDtcbiAgICAgICAgICAgIHBvaW50ID0gaXN0b3RhbCA/IGxlbiA6IHN1YnBhdGggPyBzdWJwYXRocyA6IGZpbmREb3RzQXRTZWdtZW50KHgsIHksIHBbMF0sIHBbMV0sIHBbMl0sIHBbM10sIHBbNF0sIHBbNV0sIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHBvaW50O1xuICAgICAgICB9LCBudWxsLCBTbmFwLl8uY2xvbmUpO1xuICAgIH1cbiAgICB2YXIgZ2V0VG90YWxMZW5ndGggPSBnZXRMZW5ndGhGYWN0b3J5KDEpLFxuICAgICAgICBnZXRQb2ludEF0TGVuZ3RoID0gZ2V0TGVuZ3RoRmFjdG9yeSgpLFxuICAgICAgICBnZXRTdWJwYXRoc0F0TGVuZ3RoID0gZ2V0TGVuZ3RoRmFjdG9yeSgwLCAxKTtcbiAgICBmdW5jdGlvbiBmaW5kRG90c0F0U2VnbWVudChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSwgdCkge1xuICAgICAgICB2YXIgdDEgPSAxIC0gdCxcbiAgICAgICAgICAgIHQxMyA9IHBvdyh0MSwgMyksXG4gICAgICAgICAgICB0MTIgPSBwb3codDEsIDIpLFxuICAgICAgICAgICAgdDIgPSB0ICogdCxcbiAgICAgICAgICAgIHQzID0gdDIgKiB0LFxuICAgICAgICAgICAgeCA9IHQxMyAqIHAxeCArIHQxMiAqIDMgKiB0ICogYzF4ICsgdDEgKiAzICogdCAqIHQgKiBjMnggKyB0MyAqIHAyeCxcbiAgICAgICAgICAgIHkgPSB0MTMgKiBwMXkgKyB0MTIgKiAzICogdCAqIGMxeSArIHQxICogMyAqIHQgKiB0ICogYzJ5ICsgdDMgKiBwMnksXG4gICAgICAgICAgICBteCA9IHAxeCArIDIgKiB0ICogKGMxeCAtIHAxeCkgKyB0MiAqIChjMnggLSAyICogYzF4ICsgcDF4KSxcbiAgICAgICAgICAgIG15ID0gcDF5ICsgMiAqIHQgKiAoYzF5IC0gcDF5KSArIHQyICogKGMyeSAtIDIgKiBjMXkgKyBwMXkpLFxuICAgICAgICAgICAgbnggPSBjMXggKyAyICogdCAqIChjMnggLSBjMXgpICsgdDIgKiAocDJ4IC0gMiAqIGMyeCArIGMxeCksXG4gICAgICAgICAgICBueSA9IGMxeSArIDIgKiB0ICogKGMyeSAtIGMxeSkgKyB0MiAqIChwMnkgLSAyICogYzJ5ICsgYzF5KSxcbiAgICAgICAgICAgIGF4ID0gdDEgKiBwMXggKyB0ICogYzF4LFxuICAgICAgICAgICAgYXkgPSB0MSAqIHAxeSArIHQgKiBjMXksXG4gICAgICAgICAgICBjeCA9IHQxICogYzJ4ICsgdCAqIHAyeCxcbiAgICAgICAgICAgIGN5ID0gdDEgKiBjMnkgKyB0ICogcDJ5LFxuICAgICAgICAgICAgYWxwaGEgPSAoOTAgLSBtYXRoLmF0YW4yKG14IC0gbngsIG15IC0gbnkpICogMTgwIC8gUEkpO1xuICAgICAgICAvLyAobXggPiBueCB8fCBteSA8IG55KSAmJiAoYWxwaGEgKz0gMTgwKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHgsXG4gICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgbToge3g6IG14LCB5OiBteX0sXG4gICAgICAgICAgICBuOiB7eDogbngsIHk6IG55fSxcbiAgICAgICAgICAgIHN0YXJ0OiB7eDogYXgsIHk6IGF5fSxcbiAgICAgICAgICAgIGVuZDoge3g6IGN4LCB5OiBjeX0sXG4gICAgICAgICAgICBhbHBoYTogYWxwaGFcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYmV6aWVyQkJveChwMXgsIHAxeSwgYzF4LCBjMXksIGMyeCwgYzJ5LCBwMngsIHAyeSkge1xuICAgICAgICBpZiAoIVNuYXAuaXMocDF4LCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICBwMXggPSBbcDF4LCBwMXksIGMxeCwgYzF5LCBjMngsIGMyeSwgcDJ4LCBwMnldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBiYm94ID0gY3VydmVEaW0uYXBwbHkobnVsbCwgcDF4KTtcbiAgICAgICAgcmV0dXJuIGJveChcbiAgICAgICAgICAgIGJib3gubWluLngsXG4gICAgICAgICAgICBiYm94Lm1pbi55LFxuICAgICAgICAgICAgYmJveC5tYXgueCAtIGJib3gubWluLngsXG4gICAgICAgICAgICBiYm94Lm1heC55IC0gYmJveC5taW4ueVxuICAgICAgICApO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpc1BvaW50SW5zaWRlQkJveChiYm94LCB4LCB5KSB7XG4gICAgICAgIHJldHVybiAgeCA+PSBiYm94LnggJiZcbiAgICAgICAgICAgICAgICB4IDw9IGJib3gueCArIGJib3gud2lkdGggJiZcbiAgICAgICAgICAgICAgICB5ID49IGJib3gueSAmJlxuICAgICAgICAgICAgICAgIHkgPD0gYmJveC55ICsgYmJveC5oZWlnaHQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzQkJveEludGVyc2VjdChiYm94MSwgYmJveDIpIHtcbiAgICAgICAgYmJveDEgPSBib3goYmJveDEpO1xuICAgICAgICBiYm94MiA9IGJveChiYm94Mik7XG4gICAgICAgIHJldHVybiBpc1BvaW50SW5zaWRlQkJveChiYm94MiwgYmJveDEueCwgYmJveDEueSlcbiAgICAgICAgICAgIHx8IGlzUG9pbnRJbnNpZGVCQm94KGJib3gyLCBiYm94MS54MiwgYmJveDEueSlcbiAgICAgICAgICAgIHx8IGlzUG9pbnRJbnNpZGVCQm94KGJib3gyLCBiYm94MS54LCBiYm94MS55MilcbiAgICAgICAgICAgIHx8IGlzUG9pbnRJbnNpZGVCQm94KGJib3gyLCBiYm94MS54MiwgYmJveDEueTIpXG4gICAgICAgICAgICB8fCBpc1BvaW50SW5zaWRlQkJveChiYm94MSwgYmJveDIueCwgYmJveDIueSlcbiAgICAgICAgICAgIHx8IGlzUG9pbnRJbnNpZGVCQm94KGJib3gxLCBiYm94Mi54MiwgYmJveDIueSlcbiAgICAgICAgICAgIHx8IGlzUG9pbnRJbnNpZGVCQm94KGJib3gxLCBiYm94Mi54LCBiYm94Mi55MilcbiAgICAgICAgICAgIHx8IGlzUG9pbnRJbnNpZGVCQm94KGJib3gxLCBiYm94Mi54MiwgYmJveDIueTIpXG4gICAgICAgICAgICB8fCAoYmJveDEueCA8IGJib3gyLngyICYmIGJib3gxLnggPiBiYm94Mi54XG4gICAgICAgICAgICAgICAgfHwgYmJveDIueCA8IGJib3gxLngyICYmIGJib3gyLnggPiBiYm94MS54KVxuICAgICAgICAgICAgJiYgKGJib3gxLnkgPCBiYm94Mi55MiAmJiBiYm94MS55ID4gYmJveDIueVxuICAgICAgICAgICAgICAgIHx8IGJib3gyLnkgPCBiYm94MS55MiAmJiBiYm94Mi55ID4gYmJveDEueSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJhc2UzKHQsIHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgICAgIHZhciB0MSA9IC0zICogcDEgKyA5ICogcDIgLSA5ICogcDMgKyAzICogcDQsXG4gICAgICAgICAgICB0MiA9IHQgKiB0MSArIDYgKiBwMSAtIDEyICogcDIgKyA2ICogcDM7XG4gICAgICAgIHJldHVybiB0ICogdDIgLSAzICogcDEgKyAzICogcDI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGJlemxlbih4MSwgeTEsIHgyLCB5MiwgeDMsIHkzLCB4NCwgeTQsIHopIHtcbiAgICAgICAgaWYgKHogPT0gbnVsbCkge1xuICAgICAgICAgICAgeiA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgeiA9IHogPiAxID8gMSA6IHogPCAwID8gMCA6IHo7XG4gICAgICAgIHZhciB6MiA9IHogLyAyLFxuICAgICAgICAgICAgbiA9IDEyLFxuICAgICAgICAgICAgVHZhbHVlcyA9IFstLjEyNTIsLjEyNTIsLS4zNjc4LC4zNjc4LC0uNTg3MywuNTg3MywtLjc2OTksLjc2OTksLS45MDQxLC45MDQxLC0uOTgxNiwuOTgxNl0sXG4gICAgICAgICAgICBDdmFsdWVzID0gWzAuMjQ5MSwwLjI0OTEsMC4yMzM1LDAuMjMzNSwwLjIwMzIsMC4yMDMyLDAuMTYwMSwwLjE2MDEsMC4xMDY5LDAuMTA2OSwwLjA0NzIsMC4wNDcyXSxcbiAgICAgICAgICAgIHN1bSA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY3QgPSB6MiAqIFR2YWx1ZXNbaV0gKyB6MixcbiAgICAgICAgICAgICAgICB4YmFzZSA9IGJhc2UzKGN0LCB4MSwgeDIsIHgzLCB4NCksXG4gICAgICAgICAgICAgICAgeWJhc2UgPSBiYXNlMyhjdCwgeTEsIHkyLCB5MywgeTQpLFxuICAgICAgICAgICAgICAgIGNvbWIgPSB4YmFzZSAqIHhiYXNlICsgeWJhc2UgKiB5YmFzZTtcbiAgICAgICAgICAgIHN1bSArPSBDdmFsdWVzW2ldICogbWF0aC5zcXJ0KGNvbWIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB6MiAqIHN1bTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0VG90TGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgbGwpIHtcbiAgICAgICAgaWYgKGxsIDwgMCB8fCBiZXpsZW4oeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSA8IGxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHQgPSAxLFxuICAgICAgICAgICAgc3RlcCA9IHQgLyAyLFxuICAgICAgICAgICAgdDIgPSB0IC0gc3RlcCxcbiAgICAgICAgICAgIGwsXG4gICAgICAgICAgICBlID0gLjAxO1xuICAgICAgICBsID0gYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgdDIpO1xuICAgICAgICB3aGlsZSAoYWJzKGwgLSBsbCkgPiBlKSB7XG4gICAgICAgICAgICBzdGVwIC89IDI7XG4gICAgICAgICAgICB0MiArPSAobCA8IGxsID8gMSA6IC0xKSAqIHN0ZXA7XG4gICAgICAgICAgICBsID0gYmV6bGVuKHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCwgdDIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0MjtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXJzZWN0KHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBtbWF4KHgxLCB4MikgPCBtbWluKHgzLCB4NCkgfHxcbiAgICAgICAgICAgIG1taW4oeDEsIHgyKSA+IG1tYXgoeDMsIHg0KSB8fFxuICAgICAgICAgICAgbW1heCh5MSwgeTIpIDwgbW1pbih5MywgeTQpIHx8XG4gICAgICAgICAgICBtbWluKHkxLCB5MikgPiBtbWF4KHkzLCB5NClcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG54ID0gKHgxICogeTIgLSB5MSAqIHgyKSAqICh4MyAtIHg0KSAtICh4MSAtIHgyKSAqICh4MyAqIHk0IC0geTMgKiB4NCksXG4gICAgICAgICAgICBueSA9ICh4MSAqIHkyIC0geTEgKiB4MikgKiAoeTMgLSB5NCkgLSAoeTEgLSB5MikgKiAoeDMgKiB5NCAtIHkzICogeDQpLFxuICAgICAgICAgICAgZGVub21pbmF0b3IgPSAoeDEgLSB4MikgKiAoeTMgLSB5NCkgLSAoeTEgLSB5MikgKiAoeDMgLSB4NCk7XG5cbiAgICAgICAgaWYgKCFkZW5vbWluYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBweCA9IG54IC8gZGVub21pbmF0b3IsXG4gICAgICAgICAgICBweSA9IG55IC8gZGVub21pbmF0b3IsXG4gICAgICAgICAgICBweDIgPSArcHgudG9GaXhlZCgyKSxcbiAgICAgICAgICAgIHB5MiA9ICtweS50b0ZpeGVkKDIpO1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICBweDIgPCArbW1pbih4MSwgeDIpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB4MiA+ICttbWF4KHgxLCB4MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHgyIDwgK21taW4oeDMsIHg0KS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweDIgPiArbW1heCh4MywgeDQpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA8ICttbWluKHkxLCB5MikudG9GaXhlZCgyKSB8fFxuICAgICAgICAgICAgcHkyID4gK21tYXgoeTEsIHkyKS50b0ZpeGVkKDIpIHx8XG4gICAgICAgICAgICBweTIgPCArbW1pbih5MywgeTQpLnRvRml4ZWQoMikgfHxcbiAgICAgICAgICAgIHB5MiA+ICttbWF4KHkzLCB5NCkudG9GaXhlZCgyKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge3g6IHB4LCB5OiBweX07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludGVyKGJlejEsIGJlejIpIHtcbiAgICAgICAgcmV0dXJuIGludGVySGVscGVyKGJlejEsIGJlejIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlckNvdW50KGJlejEsIGJlejIpIHtcbiAgICAgICAgcmV0dXJuIGludGVySGVscGVyKGJlejEsIGJlejIsIDEpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnRlckhlbHBlcihiZXoxLCBiZXoyLCBqdXN0Q291bnQpIHtcbiAgICAgICAgdmFyIGJib3gxID0gYmV6aWVyQkJveChiZXoxKSxcbiAgICAgICAgICAgIGJib3gyID0gYmV6aWVyQkJveChiZXoyKTtcbiAgICAgICAgaWYgKCFpc0JCb3hJbnRlcnNlY3QoYmJveDEsIGJib3gyKSkge1xuICAgICAgICAgICAgcmV0dXJuIGp1c3RDb3VudCA/IDAgOiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbDEgPSBiZXpsZW4uYXBwbHkoMCwgYmV6MSksXG4gICAgICAgICAgICBsMiA9IGJlemxlbi5hcHBseSgwLCBiZXoyKSxcbiAgICAgICAgICAgIG4xID0gfn4obDEgLyA4KSxcbiAgICAgICAgICAgIG4yID0gfn4obDIgLyA4KSxcbiAgICAgICAgICAgIGRvdHMxID0gW10sXG4gICAgICAgICAgICBkb3RzMiA9IFtdLFxuICAgICAgICAgICAgeHkgPSB7fSxcbiAgICAgICAgICAgIHJlcyA9IGp1c3RDb3VudCA/IDAgOiBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuMSArIDE7IGkrKykge1xuICAgICAgICAgICAgdmFyIHAgPSBmaW5kRG90c0F0U2VnbWVudC5hcHBseSgwLCBiZXoxLmNvbmNhdChpIC8gbjEpKTtcbiAgICAgICAgICAgIGRvdHMxLnB1c2goe3g6IHAueCwgeTogcC55LCB0OiBpIC8gbjF9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjIgKyAxOyBpKyspIHtcbiAgICAgICAgICAgIHAgPSBmaW5kRG90c0F0U2VnbWVudC5hcHBseSgwLCBiZXoyLmNvbmNhdChpIC8gbjIpKTtcbiAgICAgICAgICAgIGRvdHMyLnB1c2goe3g6IHAueCwgeTogcC55LCB0OiBpIC8gbjJ9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjE7IGkrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBuMjsgaisrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpID0gZG90czFbaV0sXG4gICAgICAgICAgICAgICAgICAgIGRpMSA9IGRvdHMxW2kgKyAxXSxcbiAgICAgICAgICAgICAgICAgICAgZGogPSBkb3RzMltqXSxcbiAgICAgICAgICAgICAgICAgICAgZGoxID0gZG90czJbaiArIDFdLFxuICAgICAgICAgICAgICAgICAgICBjaSA9IGFicyhkaTEueCAtIGRpLngpIDwgLjAwMSA/IFwieVwiIDogXCJ4XCIsXG4gICAgICAgICAgICAgICAgICAgIGNqID0gYWJzKGRqMS54IC0gZGoueCkgPCAuMDAxID8gXCJ5XCIgOiBcInhcIixcbiAgICAgICAgICAgICAgICAgICAgaXMgPSBpbnRlcnNlY3QoZGkueCwgZGkueSwgZGkxLngsIGRpMS55LCBkai54LCBkai55LCBkajEueCwgZGoxLnkpO1xuICAgICAgICAgICAgICAgIGlmIChpcykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoeHlbaXMueC50b0ZpeGVkKDQpXSA9PSBpcy55LnRvRml4ZWQoNCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHh5W2lzLngudG9GaXhlZCg0KV0gPSBpcy55LnRvRml4ZWQoNCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0MSA9IGRpLnQgKyBhYnMoKGlzW2NpXSAtIGRpW2NpXSkgLyAoZGkxW2NpXSAtIGRpW2NpXSkpICogKGRpMS50IC0gZGkudCksXG4gICAgICAgICAgICAgICAgICAgICAgICB0MiA9IGRqLnQgKyBhYnMoKGlzW2NqXSAtIGRqW2NqXSkgLyAoZGoxW2NqXSAtIGRqW2NqXSkpICogKGRqMS50IC0gZGoudCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0MSA+PSAwICYmIHQxIDw9IDEgJiYgdDIgPj0gMCAmJiB0MiA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoanVzdENvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzKys7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogaXMueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogaXMueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdDE6IHQxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0MjogdDJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRoSW50ZXJzZWN0aW9uKHBhdGgxLCBwYXRoMikge1xuICAgICAgICByZXR1cm4gaW50ZXJQYXRoSGVscGVyKHBhdGgxLCBwYXRoMik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGhJbnRlcnNlY3Rpb25OdW1iZXIocGF0aDEsIHBhdGgyKSB7XG4gICAgICAgIHJldHVybiBpbnRlclBhdGhIZWxwZXIocGF0aDEsIHBhdGgyLCAxKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gaW50ZXJQYXRoSGVscGVyKHBhdGgxLCBwYXRoMiwganVzdENvdW50KSB7XG4gICAgICAgIHBhdGgxID0gcGF0aDJjdXJ2ZShwYXRoMSk7XG4gICAgICAgIHBhdGgyID0gcGF0aDJjdXJ2ZShwYXRoMik7XG4gICAgICAgIHZhciB4MSwgeTEsIHgyLCB5MiwgeDFtLCB5MW0sIHgybSwgeTJtLCBiZXoxLCBiZXoyLFxuICAgICAgICAgICAgcmVzID0ganVzdENvdW50ID8gMCA6IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYXRoMS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGkgPSBwYXRoMVtpXTtcbiAgICAgICAgICAgIGlmIChwaVswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgIHgxID0geDFtID0gcGlbMV07XG4gICAgICAgICAgICAgICAgeTEgPSB5MW0gPSBwaVsyXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHBpWzBdID09IFwiQ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlejEgPSBbeDEsIHkxXS5jb25jYXQocGkuc2xpY2UoMSkpO1xuICAgICAgICAgICAgICAgICAgICB4MSA9IGJlejFbNl07XG4gICAgICAgICAgICAgICAgICAgIHkxID0gYmV6MVs3XTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiZXoxID0gW3gxLCB5MSwgeDEsIHkxLCB4MW0sIHkxbSwgeDFtLCB5MW1dO1xuICAgICAgICAgICAgICAgICAgICB4MSA9IHgxbTtcbiAgICAgICAgICAgICAgICAgICAgeTEgPSB5MW07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwLCBqaiA9IHBhdGgyLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBqID0gcGF0aDJbal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChwalswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgeDIgPSB4Mm0gPSBwalsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkyID0geTJtID0gcGpbMl07XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGpbMF0gPT0gXCJDXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXoyID0gW3gyLCB5Ml0uY29uY2F0KHBqLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4MiA9IGJlejJbNl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeTIgPSBiZXoyWzddO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiZXoyID0gW3gyLCB5MiwgeDIsIHkyLCB4Mm0sIHkybSwgeDJtLCB5Mm1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHgyID0geDJtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHkyID0geTJtO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludHIgPSBpbnRlckhlbHBlcihiZXoxLCBiZXoyLCBqdXN0Q291bnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGp1c3RDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcyArPSBpbnRyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMCwga2sgPSBpbnRyLmxlbmd0aDsgayA8IGtrOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50cltrXS5zZWdtZW50MSA9IGk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludHJba10uc2VnbWVudDIgPSBqO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLmJlejEgPSBiZXoxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbnRyW2tdLmJlejIgPSBiZXoyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGludHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzUG9pbnRJbnNpZGVQYXRoKHBhdGgsIHgsIHkpIHtcbiAgICAgICAgdmFyIGJib3ggPSBwYXRoQkJveChwYXRoKTtcbiAgICAgICAgcmV0dXJuIGlzUG9pbnRJbnNpZGVCQm94KGJib3gsIHgsIHkpICYmXG4gICAgICAgICAgICAgICBpbnRlclBhdGhIZWxwZXIocGF0aCwgW1tcIk1cIiwgeCwgeV0sIFtcIkhcIiwgYmJveC54MiArIDEwXV0sIDEpICUgMiA9PSAxO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRoQkJveChwYXRoKSB7XG4gICAgICAgIHZhciBwdGggPSBwYXRocyhwYXRoKTtcbiAgICAgICAgaWYgKHB0aC5iYm94KSB7XG4gICAgICAgICAgICByZXR1cm4gY2xvbmUocHRoLmJib3gpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGJveCgpO1xuICAgICAgICB9XG4gICAgICAgIHBhdGggPSBwYXRoMmN1cnZlKHBhdGgpO1xuICAgICAgICB2YXIgeCA9IDAsIFxuICAgICAgICAgICAgeSA9IDAsXG4gICAgICAgICAgICBYID0gW10sXG4gICAgICAgICAgICBZID0gW10sXG4gICAgICAgICAgICBwO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHAgPSBwYXRoW2ldO1xuICAgICAgICAgICAgaWYgKHBbMF0gPT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICB4ID0gcFsxXTtcbiAgICAgICAgICAgICAgICB5ID0gcFsyXTtcbiAgICAgICAgICAgICAgICBYLnB1c2goeCk7XG4gICAgICAgICAgICAgICAgWS5wdXNoKHkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgZGltID0gY3VydmVEaW0oeCwgeSwgcFsxXSwgcFsyXSwgcFszXSwgcFs0XSwgcFs1XSwgcFs2XSk7XG4gICAgICAgICAgICAgICAgWCA9IFguY29uY2F0KGRpbS5taW4ueCwgZGltLm1heC54KTtcbiAgICAgICAgICAgICAgICBZID0gWS5jb25jYXQoZGltLm1pbi55LCBkaW0ubWF4LnkpO1xuICAgICAgICAgICAgICAgIHggPSBwWzVdO1xuICAgICAgICAgICAgICAgIHkgPSBwWzZdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciB4bWluID0gbW1pbi5hcHBseSgwLCBYKSxcbiAgICAgICAgICAgIHltaW4gPSBtbWluLmFwcGx5KDAsIFkpLFxuICAgICAgICAgICAgeG1heCA9IG1tYXguYXBwbHkoMCwgWCksXG4gICAgICAgICAgICB5bWF4ID0gbW1heC5hcHBseSgwLCBZKSxcbiAgICAgICAgICAgIGJiID0gYm94KHhtaW4sIHltaW4sIHhtYXggLSB4bWluLCB5bWF4IC0geW1pbik7XG4gICAgICAgIHB0aC5iYm94ID0gY2xvbmUoYmIpO1xuICAgICAgICByZXR1cm4gYmI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlY3RQYXRoKHgsIHksIHcsIGgsIHIpIHtcbiAgICAgICAgaWYgKHIpIHtcbiAgICAgICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICAgICAgW1wiTVwiLCAreCArICgrciksIHldLFxuICAgICAgICAgICAgICAgIFtcImxcIiwgdyAtIHIgKiAyLCAwXSxcbiAgICAgICAgICAgICAgICBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIHIsIHJdLFxuICAgICAgICAgICAgICAgIFtcImxcIiwgMCwgaCAtIHIgKiAyXSxcbiAgICAgICAgICAgICAgICBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIC1yLCByXSxcbiAgICAgICAgICAgICAgICBbXCJsXCIsIHIgKiAyIC0gdywgMF0sXG4gICAgICAgICAgICAgICAgW1wiYVwiLCByLCByLCAwLCAwLCAxLCAtciwgLXJdLFxuICAgICAgICAgICAgICAgIFtcImxcIiwgMCwgciAqIDIgLSBoXSxcbiAgICAgICAgICAgICAgICBbXCJhXCIsIHIsIHIsIDAsIDAsIDEsIHIsIC1yXSxcbiAgICAgICAgICAgICAgICBbXCJ6XCJdXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXMgPSBbW1wiTVwiLCB4LCB5XSwgW1wibFwiLCB3LCAwXSwgW1wibFwiLCAwLCBoXSwgW1wibFwiLCAtdywgMF0sIFtcInpcIl1dO1xuICAgICAgICByZXMudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gICAgZnVuY3Rpb24gZWxsaXBzZVBhdGgoeCwgeSwgcngsIHJ5LCBhKSB7XG4gICAgICAgIGlmIChhID09IG51bGwgJiYgcnkgPT0gbnVsbCkge1xuICAgICAgICAgICAgcnkgPSByeDtcbiAgICAgICAgfVxuICAgICAgICB4ID0gK3g7XG4gICAgICAgIHkgPSAreTtcbiAgICAgICAgcnggPSArcng7XG4gICAgICAgIHJ5ID0gK3J5O1xuICAgICAgICBpZiAoYSAhPSBudWxsKSB7XG4gICAgICAgICAgICB2YXIgcmFkID0gTWF0aC5QSSAvIDE4MCxcbiAgICAgICAgICAgICAgICB4MSA9IHggKyByeCAqIE1hdGguY29zKC1yeSAqIHJhZCksXG4gICAgICAgICAgICAgICAgeDIgPSB4ICsgcnggKiBNYXRoLmNvcygtYSAqIHJhZCksXG4gICAgICAgICAgICAgICAgeTEgPSB5ICsgcnggKiBNYXRoLnNpbigtcnkgKiByYWQpLFxuICAgICAgICAgICAgICAgIHkyID0geSArIHJ4ICogTWF0aC5zaW4oLWEgKiByYWQpLFxuICAgICAgICAgICAgICAgIHJlcyA9IFtbXCJNXCIsIHgxLCB5MV0sIFtcIkFcIiwgcngsIHJ4LCAwLCArKGEgLSByeSA+IDE4MCksIDAsIHgyLCB5Ml1dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzID0gW1xuICAgICAgICAgICAgICAgIFtcIk1cIiwgeCwgeV0sXG4gICAgICAgICAgICAgICAgW1wibVwiLCAwLCAtcnldLFxuICAgICAgICAgICAgICAgIFtcImFcIiwgcngsIHJ5LCAwLCAxLCAxLCAwLCAyICogcnldLFxuICAgICAgICAgICAgICAgIFtcImFcIiwgcngsIHJ5LCAwLCAxLCAxLCAwLCAtMiAqIHJ5XSxcbiAgICAgICAgICAgICAgICBbXCJ6XCJdXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHJlcy50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICB2YXIgdW5pdDJweCA9IFNuYXAuX3VuaXQycHgsXG4gICAgICAgIGdldFBhdGggPSB7XG4gICAgICAgIHBhdGg6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsLmF0dHIoXCJwYXRoXCIpO1xuICAgICAgICB9LFxuICAgICAgICBjaXJjbGU6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGF0dHIgPSB1bml0MnB4KGVsKTtcbiAgICAgICAgICAgIHJldHVybiBlbGxpcHNlUGF0aChhdHRyLmN4LCBhdHRyLmN5LCBhdHRyLnIpO1xuICAgICAgICB9LFxuICAgICAgICBlbGxpcHNlOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gdW5pdDJweChlbCk7XG4gICAgICAgICAgICByZXR1cm4gZWxsaXBzZVBhdGgoYXR0ci5jeCB8fCAwLCBhdHRyLmN5IHx8IDAsIGF0dHIucngsIGF0dHIucnkpO1xuICAgICAgICB9LFxuICAgICAgICByZWN0OiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gdW5pdDJweChlbCk7XG4gICAgICAgICAgICByZXR1cm4gcmVjdFBhdGgoYXR0ci54IHx8IDAsIGF0dHIueSB8fCAwLCBhdHRyLndpZHRoLCBhdHRyLmhlaWdodCwgYXR0ci5yeCwgYXR0ci5yeSk7XG4gICAgICAgIH0sXG4gICAgICAgIGltYWdlOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gdW5pdDJweChlbCk7XG4gICAgICAgICAgICByZXR1cm4gcmVjdFBhdGgoYXR0ci54IHx8IDAsIGF0dHIueSB8fCAwLCBhdHRyLndpZHRoLCBhdHRyLmhlaWdodCk7XG4gICAgICAgIH0sXG4gICAgICAgIGxpbmU6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiTVwiICsgW2VsLmF0dHIoXCJ4MVwiKSB8fCAwLCBlbC5hdHRyKFwieTFcIikgfHwgMCwgZWwuYXR0cihcIngyXCIpLCBlbC5hdHRyKFwieTJcIildO1xuICAgICAgICB9LFxuICAgICAgICBwb2x5bGluZTogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJNXCIgKyBlbC5hdHRyKFwicG9pbnRzXCIpO1xuICAgICAgICB9LFxuICAgICAgICBwb2x5Z29uOiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBcIk1cIiArIGVsLmF0dHIoXCJwb2ludHNcIikgKyBcInpcIjtcbiAgICAgICAgfSxcbiAgICAgICAgZGVmbHQ6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgdmFyIGJib3ggPSBlbC5ub2RlLmdldEJCb3goKTtcbiAgICAgICAgICAgIHJldHVybiByZWN0UGF0aChiYm94LngsIGJib3gueSwgYmJveC53aWR0aCwgYmJveC5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBmdW5jdGlvbiBwYXRoVG9SZWxhdGl2ZShwYXRoQXJyYXkpIHtcbiAgICAgICAgdmFyIHB0aCA9IHBhdGhzKHBhdGhBcnJheSksXG4gICAgICAgICAgICBsb3dlckNhc2UgPSBTdHJpbmcucHJvdG90eXBlLnRvTG93ZXJDYXNlO1xuICAgICAgICBpZiAocHRoLnJlbCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGhDbG9uZShwdGgucmVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIVNuYXAuaXMocGF0aEFycmF5LCBcImFycmF5XCIpIHx8ICFTbmFwLmlzKHBhdGhBcnJheSAmJiBwYXRoQXJyYXlbMF0sIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHBhdGhBcnJheSA9IFNuYXAucGFyc2VQYXRoU3RyaW5nKHBhdGhBcnJheSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlcyA9IFtdLFxuICAgICAgICAgICAgeCA9IDAsXG4gICAgICAgICAgICB5ID0gMCxcbiAgICAgICAgICAgIG14ID0gMCxcbiAgICAgICAgICAgIG15ID0gMCxcbiAgICAgICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgICAgaWYgKHBhdGhBcnJheVswXVswXSA9PSBcIk1cIikge1xuICAgICAgICAgICAgeCA9IHBhdGhBcnJheVswXVsxXTtcbiAgICAgICAgICAgIHkgPSBwYXRoQXJyYXlbMF1bMl07XG4gICAgICAgICAgICBteCA9IHg7XG4gICAgICAgICAgICBteSA9IHk7XG4gICAgICAgICAgICBzdGFydCsrO1xuICAgICAgICAgICAgcmVzLnB1c2goW1wiTVwiLCB4LCB5XSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IHN0YXJ0LCBpaSA9IHBhdGhBcnJheS5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgciA9IHJlc1tpXSA9IFtdLFxuICAgICAgICAgICAgICAgIHBhID0gcGF0aEFycmF5W2ldO1xuICAgICAgICAgICAgaWYgKHBhWzBdICE9IGxvd2VyQ2FzZS5jYWxsKHBhWzBdKSkge1xuICAgICAgICAgICAgICAgIHJbMF0gPSBsb3dlckNhc2UuY2FsbChwYVswXSk7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJhXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gcGFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzJdID0gcGFbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzNdID0gcGFbM107XG4gICAgICAgICAgICAgICAgICAgICAgICByWzRdID0gcGFbNF07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzVdID0gcGFbNV07XG4gICAgICAgICAgICAgICAgICAgICAgICByWzZdID0gKyhwYVs2XSAtIHgpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByWzddID0gKyhwYVs3XSAtIHkpLnRvRml4ZWQoMyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSArKHBhWzFdIC0geSkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwibVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgbXggPSBwYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG15ID0gcGFbMl07XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMSwgamogPSBwYS5sZW5ndGg7IGogPCBqajsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcltqXSA9ICsocGFbal0gLSAoKGogJSAyKSA/IHggOiB5KSkudG9GaXhlZCgzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHIgPSByZXNbaV0gPSBbXTtcbiAgICAgICAgICAgICAgICBpZiAocGFbMF0gPT0gXCJtXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbXggPSBwYVsxXSArIHg7XG4gICAgICAgICAgICAgICAgICAgIG15ID0gcGFbMl0gKyB5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrID0gMCwga2sgPSBwYS5sZW5ndGg7IGsgPCBrazsgaysrKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1tpXVtrXSA9IHBhW2tdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBsZW4gPSByZXNbaV0ubGVuZ3RoO1xuICAgICAgICAgICAgc3dpdGNoIChyZXNbaV1bMF0pIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwielwiOlxuICAgICAgICAgICAgICAgICAgICB4ID0gbXg7XG4gICAgICAgICAgICAgICAgICAgIHkgPSBteTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImhcIjpcbiAgICAgICAgICAgICAgICAgICAgeCArPSArcmVzW2ldW2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgICAgICAgICB5ICs9ICtyZXNbaV1bbGVuIC0gMV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIHggKz0gK3Jlc1tpXVtsZW4gLSAyXTtcbiAgICAgICAgICAgICAgICAgICAgeSArPSArcmVzW2ldW2xlbiAtIDFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcy50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgICAgICBwdGgucmVsID0gcGF0aENsb25lKHJlcyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGhUb0Fic29sdXRlKHBhdGhBcnJheSkge1xuICAgICAgICB2YXIgcHRoID0gcGF0aHMocGF0aEFycmF5KTtcbiAgICAgICAgaWYgKHB0aC5hYnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoQ2xvbmUocHRoLmFicyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpcyhwYXRoQXJyYXksIFwiYXJyYXlcIikgfHwgIWlzKHBhdGhBcnJheSAmJiBwYXRoQXJyYXlbMF0sIFwiYXJyYXlcIikpIHsgLy8gcm91Z2ggYXNzdW1wdGlvblxuICAgICAgICAgICAgcGF0aEFycmF5ID0gU25hcC5wYXJzZVBhdGhTdHJpbmcocGF0aEFycmF5KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhdGhBcnJheSB8fCAhcGF0aEFycmF5Lmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIFtbXCJNXCIsIDAsIDBdXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzID0gW10sXG4gICAgICAgICAgICB4ID0gMCxcbiAgICAgICAgICAgIHkgPSAwLFxuICAgICAgICAgICAgbXggPSAwLFxuICAgICAgICAgICAgbXkgPSAwLFxuICAgICAgICAgICAgc3RhcnQgPSAwLFxuICAgICAgICAgICAgcGEwO1xuICAgICAgICBpZiAocGF0aEFycmF5WzBdWzBdID09IFwiTVwiKSB7XG4gICAgICAgICAgICB4ID0gK3BhdGhBcnJheVswXVsxXTtcbiAgICAgICAgICAgIHkgPSArcGF0aEFycmF5WzBdWzJdO1xuICAgICAgICAgICAgbXggPSB4O1xuICAgICAgICAgICAgbXkgPSB5O1xuICAgICAgICAgICAgc3RhcnQrKztcbiAgICAgICAgICAgIHJlc1swXSA9IFtcIk1cIiwgeCwgeV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNyeiA9IHBhdGhBcnJheS5sZW5ndGggPT0gMyAmJlxuICAgICAgICAgICAgcGF0aEFycmF5WzBdWzBdID09IFwiTVwiICYmXG4gICAgICAgICAgICBwYXRoQXJyYXlbMV1bMF0udG9VcHBlckNhc2UoKSA9PSBcIlJcIiAmJlxuICAgICAgICAgICAgcGF0aEFycmF5WzJdWzBdLnRvVXBwZXJDYXNlKCkgPT0gXCJaXCI7XG4gICAgICAgIGZvciAodmFyIHIsIHBhLCBpID0gc3RhcnQsIGlpID0gcGF0aEFycmF5Lmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHJlcy5wdXNoKHIgPSBbXSk7XG4gICAgICAgICAgICBwYSA9IHBhdGhBcnJheVtpXTtcbiAgICAgICAgICAgIHBhMCA9IHBhWzBdO1xuICAgICAgICAgICAgaWYgKHBhMCAhPSBwYTAudG9VcHBlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIHJbMF0gPSBwYTAudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHJbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSBwYVsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbMl0gPSBwYVsyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbM10gPSBwYVszXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbNF0gPSBwYVs0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbNV0gPSBwYVs1XTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbNl0gPSArcGFbNl0gKyB4O1xuICAgICAgICAgICAgICAgICAgICAgICAgcls3XSA9ICtwYVs3XSArIHk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHJbMV0gPSArcGFbMV0gKyB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJIXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByWzFdID0gK3BhWzFdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiUlwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRvdHMgPSBbeCwgeV0uY29uY2F0KHBhLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAyLCBqaiA9IGRvdHMubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvdHNbal0gPSArZG90c1tqXSArIHg7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG90c1srK2pdID0gK2RvdHNbal0gKyB5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChjYXRtdWxsUm9tMmJlemllcihkb3RzLCBjcnopKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiT1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG90cyA9IGVsbGlwc2VQYXRoKHgsIHksIHBhWzFdLCBwYVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb3RzLnB1c2goZG90c1swXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGRvdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJVXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGVsbGlwc2VQYXRoKHgsIHksIHBhWzFdLCBwYVsyXSwgcGFbM10pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHIgPSBbXCJVXCJdLmNvbmNhdChyZXNbcmVzLmxlbmd0aCAtIDFdLnNsaWNlKC0yKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIk1cIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIG14ID0gK3BhWzFdICsgeDtcbiAgICAgICAgICAgICAgICAgICAgICAgIG15ID0gK3BhWzJdICsgeTtcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDEsIGpqID0gcGEubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJbal0gPSArcGFbal0gKyAoKGogJSAyKSA/IHggOiB5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHBhMCA9PSBcIlJcIikge1xuICAgICAgICAgICAgICAgIGRvdHMgPSBbeCwgeV0uY29uY2F0KHBhLnNsaWNlKDEpKTtcbiAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChjYXRtdWxsUm9tMmJlemllcihkb3RzLCBjcnopKTtcbiAgICAgICAgICAgICAgICByID0gW1wiUlwiXS5jb25jYXQocGEuc2xpY2UoLTIpKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocGEwID09IFwiT1wiKSB7XG4gICAgICAgICAgICAgICAgcmVzLnBvcCgpO1xuICAgICAgICAgICAgICAgIGRvdHMgPSBlbGxpcHNlUGF0aCh4LCB5LCBwYVsxXSwgcGFbMl0pO1xuICAgICAgICAgICAgICAgIGRvdHMucHVzaChkb3RzWzBdKTtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuY29uY2F0KGRvdHMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChwYTAgPT0gXCJVXCIpIHtcbiAgICAgICAgICAgICAgICByZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgcmVzID0gcmVzLmNvbmNhdChlbGxpcHNlUGF0aCh4LCB5LCBwYVsxXSwgcGFbMl0sIHBhWzNdKSk7XG4gICAgICAgICAgICAgICAgciA9IFtcIlVcIl0uY29uY2F0KHJlc1tyZXMubGVuZ3RoIC0gMV0uc2xpY2UoLTIpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayA9IDAsIGtrID0gcGEubGVuZ3RoOyBrIDwga2s7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICByW2tdID0gcGFba107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGEwID0gcGEwLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAocGEwICE9IFwiT1wiKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChyWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gK214O1xuICAgICAgICAgICAgICAgICAgICAgICAgeSA9ICtteTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHJbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSByWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJNXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBteCA9IHJbci5sZW5ndGggLSAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG15ID0gcltyLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgeCA9IHJbci5sZW5ndGggLSAyXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSByW3IubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcy50b1N0cmluZyA9IHRvU3RyaW5nO1xuICAgICAgICBwdGguYWJzID0gcGF0aENsb25lKHJlcyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGwyYyh4MSwgeTEsIHgyLCB5Mikge1xuICAgICAgICByZXR1cm4gW3gxLCB5MSwgeDIsIHkyLCB4MiwgeTJdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBxMmMoeDEsIHkxLCBheCwgYXksIHgyLCB5Mikge1xuICAgICAgICB2YXIgXzEzID0gMSAvIDMsXG4gICAgICAgICAgICBfMjMgPSAyIC8gMztcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBfMTMgKiB4MSArIF8yMyAqIGF4LFxuICAgICAgICAgICAgICAgIF8xMyAqIHkxICsgXzIzICogYXksXG4gICAgICAgICAgICAgICAgXzEzICogeDIgKyBfMjMgKiBheCxcbiAgICAgICAgICAgICAgICBfMTMgKiB5MiArIF8yMyAqIGF5LFxuICAgICAgICAgICAgICAgIHgyLFxuICAgICAgICAgICAgICAgIHkyXG4gICAgICAgICAgICBdO1xuICAgIH1cbiAgICBmdW5jdGlvbiBhMmMoeDEsIHkxLCByeCwgcnksIGFuZ2xlLCBsYXJnZV9hcmNfZmxhZywgc3dlZXBfZmxhZywgeDIsIHkyLCByZWN1cnNpdmUpIHtcbiAgICAgICAgLy8gZm9yIG1vcmUgaW5mb3JtYXRpb24gb2Ygd2hlcmUgdGhpcyBtYXRoIGNhbWUgZnJvbSB2aXNpdDpcbiAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvVFIvU1ZHMTEvaW1wbG5vdGUuaHRtbCNBcmNJbXBsZW1lbnRhdGlvbk5vdGVzXG4gICAgICAgIHZhciBfMTIwID0gUEkgKiAxMjAgLyAxODAsXG4gICAgICAgICAgICByYWQgPSBQSSAvIDE4MCAqICgrYW5nbGUgfHwgMCksXG4gICAgICAgICAgICByZXMgPSBbXSxcbiAgICAgICAgICAgIHh5LFxuICAgICAgICAgICAgcm90YXRlID0gU25hcC5fLmNhY2hlcihmdW5jdGlvbiAoeCwgeSwgcmFkKSB7XG4gICAgICAgICAgICAgICAgdmFyIFggPSB4ICogbWF0aC5jb3MocmFkKSAtIHkgKiBtYXRoLnNpbihyYWQpLFxuICAgICAgICAgICAgICAgICAgICBZID0geCAqIG1hdGguc2luKHJhZCkgKyB5ICogbWF0aC5jb3MocmFkKTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge3g6IFgsIHk6IFl9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIGlmICghcmVjdXJzaXZlKSB7XG4gICAgICAgICAgICB4eSA9IHJvdGF0ZSh4MSwgeTEsIC1yYWQpO1xuICAgICAgICAgICAgeDEgPSB4eS54O1xuICAgICAgICAgICAgeTEgPSB4eS55O1xuICAgICAgICAgICAgeHkgPSByb3RhdGUoeDIsIHkyLCAtcmFkKTtcbiAgICAgICAgICAgIHgyID0geHkueDtcbiAgICAgICAgICAgIHkyID0geHkueTtcbiAgICAgICAgICAgIHZhciBjb3MgPSBtYXRoLmNvcyhQSSAvIDE4MCAqIGFuZ2xlKSxcbiAgICAgICAgICAgICAgICBzaW4gPSBtYXRoLnNpbihQSSAvIDE4MCAqIGFuZ2xlKSxcbiAgICAgICAgICAgICAgICB4ID0gKHgxIC0geDIpIC8gMixcbiAgICAgICAgICAgICAgICB5ID0gKHkxIC0geTIpIC8gMjtcbiAgICAgICAgICAgIHZhciBoID0gKHggKiB4KSAvIChyeCAqIHJ4KSArICh5ICogeSkgLyAocnkgKiByeSk7XG4gICAgICAgICAgICBpZiAoaCA+IDEpIHtcbiAgICAgICAgICAgICAgICBoID0gbWF0aC5zcXJ0KGgpO1xuICAgICAgICAgICAgICAgIHJ4ID0gaCAqIHJ4O1xuICAgICAgICAgICAgICAgIHJ5ID0gaCAqIHJ5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJ4MiA9IHJ4ICogcngsXG4gICAgICAgICAgICAgICAgcnkyID0gcnkgKiByeSxcbiAgICAgICAgICAgICAgICBrID0gKGxhcmdlX2FyY19mbGFnID09IHN3ZWVwX2ZsYWcgPyAtMSA6IDEpICpcbiAgICAgICAgICAgICAgICAgICAgbWF0aC5zcXJ0KGFicygocngyICogcnkyIC0gcngyICogeSAqIHkgLSByeTIgKiB4ICogeCkgLyAocngyICogeSAqIHkgKyByeTIgKiB4ICogeCkpKSxcbiAgICAgICAgICAgICAgICBjeCA9IGsgKiByeCAqIHkgLyByeSArICh4MSArIHgyKSAvIDIsXG4gICAgICAgICAgICAgICAgY3kgPSBrICogLXJ5ICogeCAvIHJ4ICsgKHkxICsgeTIpIC8gMixcbiAgICAgICAgICAgICAgICBmMSA9IG1hdGguYXNpbigoKHkxIC0gY3kpIC8gcnkpLnRvRml4ZWQoOSkpLFxuICAgICAgICAgICAgICAgIGYyID0gbWF0aC5hc2luKCgoeTIgLSBjeSkgLyByeSkudG9GaXhlZCg5KSk7XG5cbiAgICAgICAgICAgIGYxID0geDEgPCBjeCA/IFBJIC0gZjEgOiBmMTtcbiAgICAgICAgICAgIGYyID0geDIgPCBjeCA/IFBJIC0gZjIgOiBmMjtcbiAgICAgICAgICAgIGYxIDwgMCAmJiAoZjEgPSBQSSAqIDIgKyBmMSk7XG4gICAgICAgICAgICBmMiA8IDAgJiYgKGYyID0gUEkgKiAyICsgZjIpO1xuICAgICAgICAgICAgaWYgKHN3ZWVwX2ZsYWcgJiYgZjEgPiBmMikge1xuICAgICAgICAgICAgICAgIGYxID0gZjEgLSBQSSAqIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXN3ZWVwX2ZsYWcgJiYgZjIgPiBmMSkge1xuICAgICAgICAgICAgICAgIGYyID0gZjIgLSBQSSAqIDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmMSA9IHJlY3Vyc2l2ZVswXTtcbiAgICAgICAgICAgIGYyID0gcmVjdXJzaXZlWzFdO1xuICAgICAgICAgICAgY3ggPSByZWN1cnNpdmVbMl07XG4gICAgICAgICAgICBjeSA9IHJlY3Vyc2l2ZVszXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGYgPSBmMiAtIGYxO1xuICAgICAgICBpZiAoYWJzKGRmKSA+IF8xMjApIHtcbiAgICAgICAgICAgIHZhciBmMm9sZCA9IGYyLFxuICAgICAgICAgICAgICAgIHgyb2xkID0geDIsXG4gICAgICAgICAgICAgICAgeTJvbGQgPSB5MjtcbiAgICAgICAgICAgIGYyID0gZjEgKyBfMTIwICogKHN3ZWVwX2ZsYWcgJiYgZjIgPiBmMSA/IDEgOiAtMSk7XG4gICAgICAgICAgICB4MiA9IGN4ICsgcnggKiBtYXRoLmNvcyhmMik7XG4gICAgICAgICAgICB5MiA9IGN5ICsgcnkgKiBtYXRoLnNpbihmMik7XG4gICAgICAgICAgICByZXMgPSBhMmMoeDIsIHkyLCByeCwgcnksIGFuZ2xlLCAwLCBzd2VlcF9mbGFnLCB4Mm9sZCwgeTJvbGQsIFtmMiwgZjJvbGQsIGN4LCBjeV0pO1xuICAgICAgICB9XG4gICAgICAgIGRmID0gZjIgLSBmMTtcbiAgICAgICAgdmFyIGMxID0gbWF0aC5jb3MoZjEpLFxuICAgICAgICAgICAgczEgPSBtYXRoLnNpbihmMSksXG4gICAgICAgICAgICBjMiA9IG1hdGguY29zKGYyKSxcbiAgICAgICAgICAgIHMyID0gbWF0aC5zaW4oZjIpLFxuICAgICAgICAgICAgdCA9IG1hdGgudGFuKGRmIC8gNCksXG4gICAgICAgICAgICBoeCA9IDQgLyAzICogcnggKiB0LFxuICAgICAgICAgICAgaHkgPSA0IC8gMyAqIHJ5ICogdCxcbiAgICAgICAgICAgIG0xID0gW3gxLCB5MV0sXG4gICAgICAgICAgICBtMiA9IFt4MSArIGh4ICogczEsIHkxIC0gaHkgKiBjMV0sXG4gICAgICAgICAgICBtMyA9IFt4MiArIGh4ICogczIsIHkyIC0gaHkgKiBjMl0sXG4gICAgICAgICAgICBtNCA9IFt4MiwgeTJdO1xuICAgICAgICBtMlswXSA9IDIgKiBtMVswXSAtIG0yWzBdO1xuICAgICAgICBtMlsxXSA9IDIgKiBtMVsxXSAtIG0yWzFdO1xuICAgICAgICBpZiAocmVjdXJzaXZlKSB7XG4gICAgICAgICAgICByZXR1cm4gW20yLCBtMywgbTRdLmNvbmNhdChyZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzID0gW20yLCBtMywgbTRdLmNvbmNhdChyZXMpLmpvaW4oKS5zcGxpdChcIixcIik7XG4gICAgICAgICAgICB2YXIgbmV3cmVzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSByZXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIG5ld3Jlc1tpXSA9IGkgJSAyID8gcm90YXRlKHJlc1tpIC0gMV0sIHJlc1tpXSwgcmFkKS55IDogcm90YXRlKHJlc1tpXSwgcmVzW2kgKyAxXSwgcmFkKS54O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5ld3JlcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBmaW5kRG90QXRTZWdtZW50KHAxeCwgcDF5LCBjMXgsIGMxeSwgYzJ4LCBjMnksIHAyeCwgcDJ5LCB0KSB7XG4gICAgICAgIHZhciB0MSA9IDEgLSB0O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogcG93KHQxLCAzKSAqIHAxeCArIHBvdyh0MSwgMikgKiAzICogdCAqIGMxeCArIHQxICogMyAqIHQgKiB0ICogYzJ4ICsgcG93KHQsIDMpICogcDJ4LFxuICAgICAgICAgICAgeTogcG93KHQxLCAzKSAqIHAxeSArIHBvdyh0MSwgMikgKiAzICogdCAqIGMxeSArIHQxICogMyAqIHQgKiB0ICogYzJ5ICsgcG93KHQsIDMpICogcDJ5XG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8vIFJldHVybnMgYm91bmRpbmcgYm94IG9mIGN1YmljIGJlemllciBjdXJ2ZS5cbiAgICAvLyBTb3VyY2U6IGh0dHA6Ly9ibG9nLmhhY2tlcnMtY2FmZS5uZXQvMjAwOS8wNi9ob3ctdG8tY2FsY3VsYXRlLWJlemllci1jdXJ2ZXMtYm91bmRpbmcuaHRtbFxuICAgIC8vIE9yaWdpbmFsIHZlcnNpb246IE5JU0hJTyBIaXJva2F6dVxuICAgIC8vIE1vZGlmaWNhdGlvbnM6IGh0dHBzOi8vZ2l0aHViLmNvbS90aW1vMjIzNDVcbiAgICBmdW5jdGlvbiBjdXJ2ZURpbSh4MCwgeTAsIHgxLCB5MSwgeDIsIHkyLCB4MywgeTMpIHtcbiAgICAgICAgdmFyIHR2YWx1ZXMgPSBbXSxcbiAgICAgICAgICAgIGJvdW5kcyA9IFtbXSwgW11dLFxuICAgICAgICAgICAgYSwgYiwgYywgdCwgdDEsIHQyLCBiMmFjLCBzcXJ0YjJhYztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgICAgICAgICBiID0gNiAqIHgwIC0gMTIgKiB4MSArIDYgKiB4MjtcbiAgICAgICAgICAgICAgICBhID0gLTMgKiB4MCArIDkgKiB4MSAtIDkgKiB4MiArIDMgKiB4MztcbiAgICAgICAgICAgICAgICBjID0gMyAqIHgxIC0gMyAqIHgwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBiID0gNiAqIHkwIC0gMTIgKiB5MSArIDYgKiB5MjtcbiAgICAgICAgICAgICAgICBhID0gLTMgKiB5MCArIDkgKiB5MSAtIDkgKiB5MiArIDMgKiB5MztcbiAgICAgICAgICAgICAgICBjID0gMyAqIHkxIC0gMyAqIHkwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFicyhhKSA8IDFlLTEyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFicyhiKSA8IDFlLTEyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0ID0gLWMgLyBiO1xuICAgICAgICAgICAgICAgIGlmICgwIDwgdCAmJiB0IDwgMSkge1xuICAgICAgICAgICAgICAgICAgICB0dmFsdWVzLnB1c2godCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYjJhYyA9IGIgKiBiIC0gNCAqIGMgKiBhO1xuICAgICAgICAgICAgc3FydGIyYWMgPSBtYXRoLnNxcnQoYjJhYyk7XG4gICAgICAgICAgICBpZiAoYjJhYyA8IDApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHQxID0gKC1iICsgc3FydGIyYWMpIC8gKDIgKiBhKTtcbiAgICAgICAgICAgIGlmICgwIDwgdDEgJiYgdDEgPCAxKSB7XG4gICAgICAgICAgICAgICAgdHZhbHVlcy5wdXNoKHQxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHQyID0gKC1iIC0gc3FydGIyYWMpIC8gKDIgKiBhKTtcbiAgICAgICAgICAgIGlmICgwIDwgdDIgJiYgdDIgPCAxKSB7XG4gICAgICAgICAgICAgICAgdHZhbHVlcy5wdXNoKHQyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB4LCB5LCBqID0gdHZhbHVlcy5sZW5ndGgsXG4gICAgICAgICAgICBqbGVuID0gaixcbiAgICAgICAgICAgIG10O1xuICAgICAgICB3aGlsZSAoai0tKSB7XG4gICAgICAgICAgICB0ID0gdHZhbHVlc1tqXTtcbiAgICAgICAgICAgIG10ID0gMSAtIHQ7XG4gICAgICAgICAgICBib3VuZHNbMF1bal0gPSAobXQgKiBtdCAqIG10ICogeDApICsgKDMgKiBtdCAqIG10ICogdCAqIHgxKSArICgzICogbXQgKiB0ICogdCAqIHgyKSArICh0ICogdCAqIHQgKiB4Myk7XG4gICAgICAgICAgICBib3VuZHNbMV1bal0gPSAobXQgKiBtdCAqIG10ICogeTApICsgKDMgKiBtdCAqIG10ICogdCAqIHkxKSArICgzICogbXQgKiB0ICogdCAqIHkyKSArICh0ICogdCAqIHQgKiB5Myk7XG4gICAgICAgIH1cblxuICAgICAgICBib3VuZHNbMF1bamxlbl0gPSB4MDtcbiAgICAgICAgYm91bmRzWzFdW2psZW5dID0geTA7XG4gICAgICAgIGJvdW5kc1swXVtqbGVuICsgMV0gPSB4MztcbiAgICAgICAgYm91bmRzWzFdW2psZW4gKyAxXSA9IHkzO1xuICAgICAgICBib3VuZHNbMF0ubGVuZ3RoID0gYm91bmRzWzFdLmxlbmd0aCA9IGpsZW4gKyAyO1xuXG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBtaW46IHt4OiBtbWluLmFwcGx5KDAsIGJvdW5kc1swXSksIHk6IG1taW4uYXBwbHkoMCwgYm91bmRzWzFdKX0sXG4gICAgICAgICAgbWF4OiB7eDogbW1heC5hcHBseSgwLCBib3VuZHNbMF0pLCB5OiBtbWF4LmFwcGx5KDAsIGJvdW5kc1sxXSl9XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGF0aDJjdXJ2ZShwYXRoLCBwYXRoMikge1xuICAgICAgICB2YXIgcHRoID0gIXBhdGgyICYmIHBhdGhzKHBhdGgpO1xuICAgICAgICBpZiAoIXBhdGgyICYmIHB0aC5jdXJ2ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGhDbG9uZShwdGguY3VydmUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBwID0gcGF0aFRvQWJzb2x1dGUocGF0aCksXG4gICAgICAgICAgICBwMiA9IHBhdGgyICYmIHBhdGhUb0Fic29sdXRlKHBhdGgyKSxcbiAgICAgICAgICAgIGF0dHJzID0ge3g6IDAsIHk6IDAsIGJ4OiAwLCBieTogMCwgWDogMCwgWTogMCwgcXg6IG51bGwsIHF5OiBudWxsfSxcbiAgICAgICAgICAgIGF0dHJzMiA9IHt4OiAwLCB5OiAwLCBieDogMCwgYnk6IDAsIFg6IDAsIFk6IDAsIHF4OiBudWxsLCBxeTogbnVsbH0sXG4gICAgICAgICAgICBwcm9jZXNzUGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBkLCBwY29tKSB7XG4gICAgICAgICAgICAgICAgdmFyIG54LCBueTtcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtcIkNcIiwgZC54LCBkLnksIGQueCwgZC55LCBkLngsIGQueV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICEocGF0aFswXSBpbiB7VDogMSwgUTogMX0pICYmIChkLnF4ID0gZC5xeSA9IG51bGwpO1xuICAgICAgICAgICAgICAgIHN3aXRjaCAocGF0aFswXSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiTVwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgZC5YID0gcGF0aFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGQuWSA9IHBhdGhbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdLmNvbmNhdChhMmMuYXBwbHkoMCwgW2QueCwgZC55XS5jb25jYXQocGF0aC5zbGljZSgxKSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiU1wiOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBjb20gPT0gXCJDXCIgfHwgcGNvbSA9PSBcIlNcIikgeyAvLyBJbiBcIlNcIiBjYXNlIHdlIGhhdmUgdG8gdGFrZSBpbnRvIGFjY291bnQsIGlmIHRoZSBwcmV2aW91cyBjb21tYW5kIGlzIEMvUy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBueCA9IGQueCAqIDIgLSBkLmJ4OyAgICAgICAgICAvLyBBbmQgcmVmbGVjdCB0aGUgcHJldmlvdXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBueSA9IGQueSAqIDIgLSBkLmJ5OyAgICAgICAgICAvLyBjb21tYW5kJ3MgY29udHJvbCBwb2ludCByZWxhdGl2ZSB0byB0aGUgY3VycmVudCBwb2ludC5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvciBzb21lIGVsc2Ugb3Igbm90aGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG54ID0gZC54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG55ID0gZC55O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIiwgbngsIG55XS5jb25jYXQocGF0aC5zbGljZSgxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwY29tID09IFwiUVwiIHx8IHBjb20gPT0gXCJUXCIpIHsgLy8gSW4gXCJUXCIgY2FzZSB3ZSBoYXZlIHRvIHRha2UgaW50byBhY2NvdW50LCBpZiB0aGUgcHJldmlvdXMgY29tbWFuZCBpcyBRL1QuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZC5xeCA9IGQueCAqIDIgLSBkLnF4OyAgICAgICAgLy8gQW5kIG1ha2UgYSByZWZsZWN0aW9uIHNpbWlsYXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF5ID0gZC55ICogMiAtIGQucXk7ICAgICAgICAvLyB0byBjYXNlIFwiU1wiLlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9yIHNvbWV0aGluZyBlbHNlIG9yIG5vdGhpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkLnF4ID0gZC54O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGQucXkgPSBkLnk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXS5jb25jYXQocTJjKGQueCwgZC55LCBkLnF4LCBkLnF5LCBwYXRoWzFdLCBwYXRoWzJdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlFcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIGQucXggPSBwYXRoWzFdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZC5xeSA9IHBhdGhbMl07XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXS5jb25jYXQocTJjKGQueCwgZC55LCBwYXRoWzFdLCBwYXRoWzJdLCBwYXRoWzNdLCBwYXRoWzRdKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIkxcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdLmNvbmNhdChsMmMoZC54LCBkLnksIHBhdGhbMV0sIHBhdGhbMl0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiSFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aCA9IFtcIkNcIl0uY29uY2F0KGwyYyhkLngsIGQueSwgcGF0aFsxXSwgZC55KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcIlZcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBbXCJDXCJdLmNvbmNhdChsMmMoZC54LCBkLnksIGQueCwgcGF0aFsxXSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJaXCI6XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gW1wiQ1wiXS5jb25jYXQobDJjKGQueCwgZC55LCBkLlgsIGQuWSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpeEFyYyA9IGZ1bmN0aW9uIChwcCwgaSkge1xuICAgICAgICAgICAgICAgIGlmIChwcFtpXS5sZW5ndGggPiA3KSB7XG4gICAgICAgICAgICAgICAgICAgIHBwW2ldLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwaSA9IHBwW2ldO1xuICAgICAgICAgICAgICAgICAgICB3aGlsZSAocGkubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwY29tczFbaV0gPSBcIkFcIjsgLy8gaWYgY3JlYXRlZCBtdWx0aXBsZSBDOnMsIHRoZWlyIG9yaWdpbmFsIHNlZyBpcyBzYXZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgcDIgJiYgKHBjb21zMltpXSA9IFwiQVwiKTsgLy8gdGhlIHNhbWUgYXMgYWJvdmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHBwLnNwbGljZShpKyssIDAsIFtcIkNcIl0uY29uY2F0KHBpLnNwbGljZSgwLCA2KSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBwLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWkgPSBtbWF4KHAubGVuZ3RoLCBwMiAmJiBwMi5sZW5ndGggfHwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZpeE0gPSBmdW5jdGlvbiAocGF0aDEsIHBhdGgyLCBhMSwgYTIsIGkpIHtcbiAgICAgICAgICAgICAgICBpZiAocGF0aDEgJiYgcGF0aDIgJiYgcGF0aDFbaV1bMF0gPT0gXCJNXCIgJiYgcGF0aDJbaV1bMF0gIT0gXCJNXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDIuc3BsaWNlKGksIDAsIFtcIk1cIiwgYTIueCwgYTIueV0pO1xuICAgICAgICAgICAgICAgICAgICBhMS5ieCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGExLmJ5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgYTEueCA9IHBhdGgxW2ldWzFdO1xuICAgICAgICAgICAgICAgICAgICBhMS55ID0gcGF0aDFbaV1bMl07XG4gICAgICAgICAgICAgICAgICAgIGlpID0gbW1heChwLmxlbmd0aCwgcDIgJiYgcDIubGVuZ3RoIHx8IDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwY29tczEgPSBbXSwgLy8gcGF0aCBjb21tYW5kcyBvZiBvcmlnaW5hbCBwYXRoIHBcbiAgICAgICAgICAgIHBjb21zMiA9IFtdLCAvLyBwYXRoIGNvbW1hbmRzIG9mIG9yaWdpbmFsIHBhdGggcDJcbiAgICAgICAgICAgIHBmaXJzdCA9IFwiXCIsIC8vIHRlbXBvcmFyeSBob2xkZXIgZm9yIG9yaWdpbmFsIHBhdGggY29tbWFuZFxuICAgICAgICAgICAgcGNvbSA9IFwiXCI7IC8vIGhvbGRlciBmb3IgcHJldmlvdXMgcGF0aCBjb21tYW5kIG9mIG9yaWdpbmFsIHBhdGhcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gbW1heChwLmxlbmd0aCwgcDIgJiYgcDIubGVuZ3RoIHx8IDApOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcFtpXSAmJiAocGZpcnN0ID0gcFtpXVswXSk7IC8vIHNhdmUgY3VycmVudCBwYXRoIGNvbW1hbmRcblxuICAgICAgICAgICAgaWYgKHBmaXJzdCAhPSBcIkNcIikgLy8gQyBpcyBub3Qgc2F2ZWQgeWV0LCBiZWNhdXNlIGl0IG1heSBiZSByZXN1bHQgb2YgY29udmVyc2lvblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHBjb21zMVtpXSA9IHBmaXJzdDsgLy8gU2F2ZSBjdXJyZW50IHBhdGggY29tbWFuZFxuICAgICAgICAgICAgICAgIGkgJiYgKCBwY29tID0gcGNvbXMxW2kgLSAxXSk7IC8vIEdldCBwcmV2aW91cyBwYXRoIGNvbW1hbmQgcGNvbVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcFtpXSA9IHByb2Nlc3NQYXRoKHBbaV0sIGF0dHJzLCBwY29tKTsgLy8gUHJldmlvdXMgcGF0aCBjb21tYW5kIGlzIGlucHV0dGVkIHRvIHByb2Nlc3NQYXRoXG5cbiAgICAgICAgICAgIGlmIChwY29tczFbaV0gIT0gXCJBXCIgJiYgcGZpcnN0ID09IFwiQ1wiKSBwY29tczFbaV0gPSBcIkNcIjsgLy8gQSBpcyB0aGUgb25seSBjb21tYW5kXG4gICAgICAgICAgICAvLyB3aGljaCBtYXkgcHJvZHVjZSBtdWx0aXBsZSBDOnNcbiAgICAgICAgICAgIC8vIHNvIHdlIGhhdmUgdG8gbWFrZSBzdXJlIHRoYXQgQyBpcyBhbHNvIEMgaW4gb3JpZ2luYWwgcGF0aFxuXG4gICAgICAgICAgICBmaXhBcmMocCwgaSk7IC8vIGZpeEFyYyBhZGRzIGFsc28gdGhlIHJpZ2h0IGFtb3VudCBvZiBBOnMgdG8gcGNvbXMxXG5cbiAgICAgICAgICAgIGlmIChwMikgeyAvLyB0aGUgc2FtZSBwcm9jZWR1cmVzIGlzIGRvbmUgdG8gcDJcbiAgICAgICAgICAgICAgICBwMltpXSAmJiAocGZpcnN0ID0gcDJbaV1bMF0pO1xuICAgICAgICAgICAgICAgIGlmIChwZmlyc3QgIT0gXCJDXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcGNvbXMyW2ldID0gcGZpcnN0O1xuICAgICAgICAgICAgICAgICAgICBpICYmIChwY29tID0gcGNvbXMyW2kgLSAxXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHAyW2ldID0gcHJvY2Vzc1BhdGgocDJbaV0sIGF0dHJzMiwgcGNvbSk7XG5cbiAgICAgICAgICAgICAgICBpZiAocGNvbXMyW2ldICE9IFwiQVwiICYmIHBmaXJzdCA9PSBcIkNcIikge1xuICAgICAgICAgICAgICAgICAgICBwY29tczJbaV0gPSBcIkNcIjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmaXhBcmMocDIsIGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZml4TShwLCBwMiwgYXR0cnMsIGF0dHJzMiwgaSk7XG4gICAgICAgICAgICBmaXhNKHAyLCBwLCBhdHRyczIsIGF0dHJzLCBpKTtcbiAgICAgICAgICAgIHZhciBzZWcgPSBwW2ldLFxuICAgICAgICAgICAgICAgIHNlZzIgPSBwMiAmJiBwMltpXSxcbiAgICAgICAgICAgICAgICBzZWdsZW4gPSBzZWcubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHNlZzJsZW4gPSBwMiAmJiBzZWcyLmxlbmd0aDtcbiAgICAgICAgICAgIGF0dHJzLnggPSBzZWdbc2VnbGVuIC0gMl07XG4gICAgICAgICAgICBhdHRycy55ID0gc2VnW3NlZ2xlbiAtIDFdO1xuICAgICAgICAgICAgYXR0cnMuYnggPSB0b0Zsb2F0KHNlZ1tzZWdsZW4gLSA0XSkgfHwgYXR0cnMueDtcbiAgICAgICAgICAgIGF0dHJzLmJ5ID0gdG9GbG9hdChzZWdbc2VnbGVuIC0gM10pIHx8IGF0dHJzLnk7XG4gICAgICAgICAgICBhdHRyczIuYnggPSBwMiAmJiAodG9GbG9hdChzZWcyW3NlZzJsZW4gLSA0XSkgfHwgYXR0cnMyLngpO1xuICAgICAgICAgICAgYXR0cnMyLmJ5ID0gcDIgJiYgKHRvRmxvYXQoc2VnMltzZWcybGVuIC0gM10pIHx8IGF0dHJzMi55KTtcbiAgICAgICAgICAgIGF0dHJzMi54ID0gcDIgJiYgc2VnMltzZWcybGVuIC0gMl07XG4gICAgICAgICAgICBhdHRyczIueSA9IHAyICYmIHNlZzJbc2VnMmxlbiAtIDFdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghcDIpIHtcbiAgICAgICAgICAgIHB0aC5jdXJ2ZSA9IHBhdGhDbG9uZShwKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcDIgPyBbcCwgcDJdIDogcDtcbiAgICB9XG4gICAgZnVuY3Rpb24gbWFwUGF0aChwYXRoLCBtYXRyaXgpIHtcbiAgICAgICAgaWYgKCFtYXRyaXgpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4LCB5LCBpLCBqLCBpaSwgamosIHBhdGhpO1xuICAgICAgICBwYXRoID0gcGF0aDJjdXJ2ZShwYXRoKTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIHBhdGhpID0gcGF0aFtpXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDEsIGpqID0gcGF0aGkubGVuZ3RoOyBqIDwgamo7IGogKz0gMikge1xuICAgICAgICAgICAgICAgIHggPSBtYXRyaXgueChwYXRoaVtqXSwgcGF0aGlbaiArIDFdKTtcbiAgICAgICAgICAgICAgICB5ID0gbWF0cml4LnkocGF0aGlbal0sIHBhdGhpW2ogKyAxXSk7XG4gICAgICAgICAgICAgICAgcGF0aGlbal0gPSB4O1xuICAgICAgICAgICAgICAgIHBhdGhpW2ogKyAxXSA9IHk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgLy8gaHR0cDovL3NjaGVwZXJzLmNjL2dldHRpbmctdG8tdGhlLXBvaW50XG4gICAgZnVuY3Rpb24gY2F0bXVsbFJvbTJiZXppZXIoY3JwLCB6KSB7XG4gICAgICAgIHZhciBkID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpTGVuID0gY3JwLmxlbmd0aDsgaUxlbiAtIDIgKiAheiA+IGk7IGkgKz0gMikge1xuICAgICAgICAgICAgdmFyIHAgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpIC0gMl0sIHk6ICtjcnBbaSAtIDFdfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt4OiArY3JwW2ldLCAgICAgeTogK2NycFtpICsgMV19LFxuICAgICAgICAgICAgICAgICAgICAgICAge3g6ICtjcnBbaSArIDJdLCB5OiArY3JwW2kgKyAzXX0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7eDogK2NycFtpICsgNF0sIHk6ICtjcnBbaSArIDVdfVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgaWYgKHopIHtcbiAgICAgICAgICAgICAgICBpZiAoIWkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFswXSA9IHt4OiArY3JwW2lMZW4gLSAyXSwgeTogK2NycFtpTGVuIC0gMV19O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaUxlbiAtIDQgPT0gaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzNdID0ge3g6ICtjcnBbMF0sIHk6ICtjcnBbMV19O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaUxlbiAtIDIgPT0gaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzJdID0ge3g6ICtjcnBbMF0sIHk6ICtjcnBbMV19O1xuICAgICAgICAgICAgICAgICAgICBwWzNdID0ge3g6ICtjcnBbMl0sIHk6ICtjcnBbM119O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGlMZW4gLSA0ID09IGkpIHtcbiAgICAgICAgICAgICAgICAgICAgcFszXSA9IHBbMl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghaSkge1xuICAgICAgICAgICAgICAgICAgICBwWzBdID0ge3g6ICtjcnBbaV0sIHk6ICtjcnBbaSArIDFdfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkLnB1c2goW1wiQ1wiLFxuICAgICAgICAgICAgICAgICAgKC1wWzBdLnggKyA2ICogcFsxXS54ICsgcFsyXS54KSAvIDYsXG4gICAgICAgICAgICAgICAgICAoLXBbMF0ueSArIDYgKiBwWzFdLnkgKyBwWzJdLnkpIC8gNixcbiAgICAgICAgICAgICAgICAgIChwWzFdLnggKyA2ICogcFsyXS54IC0gcFszXS54KSAvIDYsXG4gICAgICAgICAgICAgICAgICAocFsxXS55ICsgNipwWzJdLnkgLSBwWzNdLnkpIC8gNixcbiAgICAgICAgICAgICAgICAgIHBbMl0ueCxcbiAgICAgICAgICAgICAgICAgIHBbMl0ueVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZDtcbiAgICB9XG5cbiAgICAvLyBleHBvcnRcbiAgICBTbmFwLnBhdGggPSBwYXRocztcblxuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguZ2V0VG90YWxMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgZ2l2ZW4gcGF0aCBpbiBwaXhlbHNcbiAgICAgKipcbiAgICAgLSBwYXRoIChzdHJpbmcpIFNWRyBwYXRoIHN0cmluZ1xuICAgICAqKlxuICAgICA9IChudW1iZXIpIGxlbmd0aFxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguZ2V0VG90YWxMZW5ndGggPSBnZXRUb3RhbExlbmd0aDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmdldFBvaW50QXRMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGNvb3JkaW5hdGVzIG9mIHRoZSBwb2ludCBsb2NhdGVkIGF0IHRoZSBnaXZlbiBsZW5ndGggYWxvbmcgdGhlIGdpdmVuIHBhdGhcbiAgICAgKipcbiAgICAgLSBwYXRoIChzdHJpbmcpIFNWRyBwYXRoIHN0cmluZ1xuICAgICAtIGxlbmd0aCAobnVtYmVyKSBsZW5ndGgsIGluIHBpeGVscywgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHBhdGgsIGV4Y2x1ZGluZyBub24tcmVuZGVyaW5nIGp1bXBzXG4gICAgICoqXG4gICAgID0gKG9iamVjdCkgcmVwcmVzZW50YXRpb24gb2YgdGhlIHBvaW50OlxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlLFxuICAgICBvICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUsXG4gICAgIG8gICAgIGFscGhhOiAobnVtYmVyKSBhbmdsZSBvZiBkZXJpdmF0aXZlXG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguZ2V0UG9pbnRBdExlbmd0aCA9IGdldFBvaW50QXRMZW5ndGg7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5nZXRTdWJwYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHRoZSBzdWJwYXRoIG9mIGEgZ2l2ZW4gcGF0aCBiZXR3ZWVuIGdpdmVuIHN0YXJ0IGFuZCBlbmQgbGVuZ3Roc1xuICAgICAqKlxuICAgICAtIHBhdGggKHN0cmluZykgU1ZHIHBhdGggc3RyaW5nXG4gICAgIC0gZnJvbSAobnVtYmVyKSBsZW5ndGgsIGluIHBpeGVscywgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHBhdGggdG8gdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50XG4gICAgIC0gdG8gKG51bWJlcikgbGVuZ3RoLCBpbiBwaXhlbHMsIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBwYXRoIHRvIHRoZSBlbmQgb2YgdGhlIHNlZ21lbnRcbiAgICAgKipcbiAgICAgPSAoc3RyaW5nKSBwYXRoIHN0cmluZyBkZWZpbml0aW9uIGZvciB0aGUgc2VnbWVudFxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguZ2V0U3VicGF0aCA9IGZ1bmN0aW9uIChwYXRoLCBmcm9tLCB0bykge1xuICAgICAgICBpZiAodGhpcy5nZXRUb3RhbExlbmd0aChwYXRoKSAtIHRvIDwgMWUtNikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN1YnBhdGhzQXRMZW5ndGgocGF0aCwgZnJvbSkuZW5kO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhID0gZ2V0U3VicGF0aHNBdExlbmd0aChwYXRoLCB0bywgMSk7XG4gICAgICAgIHJldHVybiBmcm9tID8gZ2V0U3VicGF0aHNBdExlbmd0aChhLCBmcm9tKS5lbmQgOiBhO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0VG90YWxMZW5ndGhcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGxlbmd0aCBvZiB0aGUgcGF0aCBpbiBwaXhlbHMgKG9ubHkgd29ya3MgZm9yIGBwYXRoYCBlbGVtZW50cylcbiAgICAgPSAobnVtYmVyKSBsZW5ndGhcbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRUb3RhbExlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMubm9kZS5nZXRUb3RhbExlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5nZXRUb3RhbExlbmd0aCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyBTSUVSUkEgRWxlbWVudC5nZXRQb2ludEF0TGVuZ3RoKCkvRWxlbWVudC5nZXRUb3RhbExlbmd0aCgpOiBJZiBhIDxwYXRoPiBpcyBicm9rZW4gaW50byBkaWZmZXJlbnQgc2VnbWVudHMsIGlzIHRoZSBqdW1wIGRpc3RhbmNlIHRvIHRoZSBuZXcgY29vcmRpbmF0ZXMgc2V0IGJ5IHRoZSBfTV8gb3IgX21fIGNvbW1hbmRzIGNhbGN1bGF0ZWQgYXMgcGFydCBvZiB0aGUgcGF0aCdzIHRvdGFsIGxlbmd0aD9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRQb2ludEF0TGVuZ3RoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGNvb3JkaW5hdGVzIG9mIHRoZSBwb2ludCBsb2NhdGVkIGF0IHRoZSBnaXZlbiBsZW5ndGggb24gdGhlIGdpdmVuIHBhdGggKG9ubHkgd29ya3MgZm9yIGBwYXRoYCBlbGVtZW50cylcbiAgICAgKipcbiAgICAgLSBsZW5ndGggKG51bWJlcikgbGVuZ3RoLCBpbiBwaXhlbHMsIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBwYXRoLCBleGNsdWRpbmcgbm9uLXJlbmRlcmluZyBqdW1wc1xuICAgICAqKlxuICAgICA9IChvYmplY3QpIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBwb2ludDpcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSxcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlLFxuICAgICBvICAgICBhbHBoYTogKG51bWJlcikgYW5nbGUgb2YgZGVyaXZhdGl2ZVxuICAgICBvIH1cbiAgICBcXCovXG4gICAgZWxwcm90by5nZXRQb2ludEF0TGVuZ3RoID0gZnVuY3Rpb24gKGxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZ2V0UG9pbnRBdExlbmd0aCh0aGlzLmF0dHIoXCJkXCIpLCBsZW5ndGgpO1xuICAgIH07XG4gICAgLy8gU0lFUlJBIEVsZW1lbnQuZ2V0U3VicGF0aCgpOiBTaW1pbGFyIHRvIHRoZSBwcm9ibGVtIGZvciBFbGVtZW50LmdldFBvaW50QXRMZW5ndGgoKS4gVW5jbGVhciBob3cgdGhpcyB3b3VsZCB3b3JrIGZvciBhIHNlZ21lbnRlZCBwYXRoLiBPdmVyYWxsLCB0aGUgY29uY2VwdCBvZiBfc3VicGF0aF8gYW5kIHdoYXQgSSdtIGNhbGxpbmcgYSBfc2VnbWVudF8gKHNlcmllcyBvZiBub24tX01fIG9yIF9aXyBjb21tYW5kcykgaXMgdW5jbGVhci5cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5nZXRTdWJwYXRoXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIHN1YnBhdGggb2YgYSBnaXZlbiBlbGVtZW50IGZyb20gZ2l2ZW4gc3RhcnQgYW5kIGVuZCBsZW5ndGhzIChvbmx5IHdvcmtzIGZvciBgcGF0aGAgZWxlbWVudHMpXG4gICAgICoqXG4gICAgIC0gZnJvbSAobnVtYmVyKSBsZW5ndGgsIGluIHBpeGVscywgZnJvbSB0aGUgc3RhcnQgb2YgdGhlIHBhdGggdG8gdGhlIHN0YXJ0IG9mIHRoZSBzZWdtZW50XG4gICAgIC0gdG8gKG51bWJlcikgbGVuZ3RoLCBpbiBwaXhlbHMsIGZyb20gdGhlIHN0YXJ0IG9mIHRoZSBwYXRoIHRvIHRoZSBlbmQgb2YgdGhlIHNlZ21lbnRcbiAgICAgKipcbiAgICAgPSAoc3RyaW5nKSBwYXRoIHN0cmluZyBkZWZpbml0aW9uIGZvciB0aGUgc2VnbWVudFxuICAgIFxcKi9cbiAgICBlbHByb3RvLmdldFN1YnBhdGggPSBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcbiAgICAgICAgcmV0dXJuIFNuYXAucGF0aC5nZXRTdWJwYXRoKHRoaXMuYXR0cihcImRcIiksIGZyb20sIHRvKTtcbiAgICB9O1xuICAgIFNuYXAuXy5ib3ggPSBib3g7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5maW5kRG90c0F0U2VnbWVudFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBGaW5kcyBkb3QgY29vcmRpbmF0ZXMgb24gdGhlIGdpdmVuIGN1YmljIGJlemnDqXIgY3VydmUgYXQgdGhlIGdpdmVuIHRcbiAgICAgLSBwMXggKG51bWJlcikgeCBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBhbmNob3Igb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF5IChudW1iZXIpIHkgb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMnkgKG51bWJlcikgeSBvZiB0aGUgc2Vjb25kIGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBwMnggKG51bWJlcikgeCBvZiB0aGUgc2Vjb25kIHBvaW50IG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gdCAobnVtYmVyKSBwb3NpdGlvbiBvbiB0aGUgY3VydmUgKDAuLjEpXG4gICAgID0gKG9iamVjdCkgcG9pbnQgaW5mb3JtYXRpb24gaW4gZm9ybWF0OlxuICAgICBvIHtcbiAgICAgbyAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBwb2ludCxcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBwb2ludCxcbiAgICAgbyAgICAgbToge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IGFuY2hvcixcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCBhbmNob3JcbiAgICAgbyAgICAgfSxcbiAgICAgbyAgICAgbjoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSByaWdodCBhbmNob3IsXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGFuY2hvclxuICAgICBvICAgICB9LFxuICAgICBvICAgICBzdGFydDoge1xuICAgICBvICAgICAgICAgeDogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSBzdGFydCBvZiB0aGUgY3VydmUsXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHN0YXJ0IG9mIHRoZSBjdXJ2ZVxuICAgICBvICAgICB9LFxuICAgICBvICAgICBlbmQ6IHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgZW5kIG9mIHRoZSBjdXJ2ZSxcbiAgICAgbyAgICAgICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgZW5kIG9mIHRoZSBjdXJ2ZVxuICAgICBvICAgICB9LFxuICAgICBvICAgICBhbHBoYTogKG51bWJlcikgYW5nbGUgb2YgdGhlIGN1cnZlIGRlcml2YXRpdmUgYXQgdGhlIHBvaW50XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguZmluZERvdHNBdFNlZ21lbnQgPSBmaW5kRG90c0F0U2VnbWVudDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmJlemllckJCb3hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyB0aGUgYm91bmRpbmcgYm94IG9mIGEgZ2l2ZW4gY3ViaWMgYmV6acOpciBjdXJ2ZVxuICAgICAtIHAxeCAobnVtYmVyKSB4IG9mIHRoZSBmaXJzdCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgLSBwMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gYzF4IChudW1iZXIpIHggb2YgdGhlIGZpcnN0IGFuY2hvciBvZiB0aGUgY3VydmVcbiAgICAgLSBjMXkgKG51bWJlcikgeSBvZiB0aGUgZmlyc3QgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIGMyeSAobnVtYmVyKSB5IG9mIHRoZSBzZWNvbmQgYW5jaG9yIG9mIHRoZSBjdXJ2ZVxuICAgICAtIHAyeCAobnVtYmVyKSB4IG9mIHRoZSBzZWNvbmQgcG9pbnQgb2YgdGhlIGN1cnZlXG4gICAgIC0gcDJ5IChudW1iZXIpIHkgb2YgdGhlIHNlY29uZCBwb2ludCBvZiB0aGUgY3VydmVcbiAgICAgKiBvclxuICAgICAtIGJleiAoYXJyYXkpIGFycmF5IG9mIHNpeCBwb2ludHMgZm9yIGJlemnDqXIgY3VydmVcbiAgICAgPSAob2JqZWN0KSBib3VuZGluZyBib3hcbiAgICAgbyB7XG4gICAgIG8gICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCB0b3AgcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgeTogKG51bWJlcikgeSBjb29yZGluYXRlIG9mIHRoZSBsZWZ0IHRvcCBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB4MjogKG51bWJlcikgeCBjb29yZGluYXRlIG9mIHRoZSByaWdodCBib3R0b20gcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgeTI6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYm90dG9tIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHdpZHRoOiAobnVtYmVyKSB3aWR0aCBvZiB0aGUgYm94LFxuICAgICBvICAgICBoZWlnaHQ6IChudW1iZXIpIGhlaWdodCBvZiB0aGUgYm94XG4gICAgIG8gfVxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguYmV6aWVyQkJveCA9IGJlemllckJCb3g7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5pc1BvaW50SW5zaWRlQkJveFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGB0cnVlYCBpZiBnaXZlbiBwb2ludCBpcyBpbnNpZGUgYm91bmRpbmcgYm94XG4gICAgIC0gYmJveCAoc3RyaW5nKSBib3VuZGluZyBib3hcbiAgICAgLSB4IChzdHJpbmcpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgLSB5IChzdHJpbmcpIHkgY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnRcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIHBvaW50IGlzIGluc2lkZVxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguaXNQb2ludEluc2lkZUJCb3ggPSBpc1BvaW50SW5zaWRlQkJveDtcbiAgICBTbmFwLmNsb3Nlc3QgPSBmdW5jdGlvbiAoeCwgeSwgWCwgWSkge1xuICAgICAgICB2YXIgciA9IDEwMCxcbiAgICAgICAgICAgIGIgPSBib3goeCAtIHIgLyAyLCB5IC0gciAvIDIsIHIsIHIpLFxuICAgICAgICAgICAgaW5zaWRlID0gW10sXG4gICAgICAgICAgICBnZXR0ZXIgPSBYWzBdLmhhc093blByb3BlcnR5KFwieFwiKSA/IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgeDogWFtpXS54LFxuICAgICAgICAgICAgICAgICAgICB5OiBYW2ldLnlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSA6IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgeDogWFtpXSxcbiAgICAgICAgICAgICAgICAgICAgeTogWVtpXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZm91bmQgPSAwO1xuICAgICAgICB3aGlsZSAociA8PSAxZTYgJiYgIWZvdW5kKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBYLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgeHkgPSBnZXR0ZXIoaSk7XG4gICAgICAgICAgICAgICAgaWYgKGlzUG9pbnRJbnNpZGVCQm94KGIsIHh5LngsIHh5LnkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kKys7XG4gICAgICAgICAgICAgICAgICAgIGluc2lkZS5wdXNoKHh5KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgICAgIHIgKj0gMjtcbiAgICAgICAgICAgICAgICBiID0gYm94KHggLSByIC8gMiwgeSAtIHIgLyAyLCByLCByKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChyID09IDFlNikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsZW4gPSBJbmZpbml0eSxcbiAgICAgICAgICAgIHJlcztcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBpbnNpZGUubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdmFyIGwgPSBTbmFwLmxlbih4LCB5LCBpbnNpZGVbaV0ueCwgaW5zaWRlW2ldLnkpO1xuICAgICAgICAgICAgaWYgKGxlbiA+IGwpIHtcbiAgICAgICAgICAgICAgICBsZW4gPSBsO1xuICAgICAgICAgICAgICAgIGluc2lkZVtpXS5sZW4gPSBsO1xuICAgICAgICAgICAgICAgIHJlcyA9IGluc2lkZVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5pc0JCb3hJbnRlcnNlY3RcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdHdvIGJvdW5kaW5nIGJveGVzIGludGVyc2VjdFxuICAgICAtIGJib3gxIChzdHJpbmcpIGZpcnN0IGJvdW5kaW5nIGJveFxuICAgICAtIGJib3gyIChzdHJpbmcpIHNlY29uZCBib3VuZGluZyBib3hcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIGJvdW5kaW5nIGJveGVzIGludGVyc2VjdFxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguaXNCQm94SW50ZXJzZWN0ID0gaXNCQm94SW50ZXJzZWN0O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGguaW50ZXJzZWN0aW9uXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIEZpbmRzIGludGVyc2VjdGlvbnMgb2YgdHdvIHBhdGhzXG4gICAgIC0gcGF0aDEgKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgLSBwYXRoMiAoc3RyaW5nKSBwYXRoIHN0cmluZ1xuICAgICA9IChhcnJheSkgZG90cyBvZiBpbnRlcnNlY3Rpb25cbiAgICAgbyBbXG4gICAgIG8gICAgIHtcbiAgICAgbyAgICAgICAgIHg6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcG9pbnQsXG4gICAgIG8gICAgICAgICB5OiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHBvaW50LFxuICAgICBvICAgICAgICAgdDE6IChudW1iZXIpIHQgdmFsdWUgZm9yIHNlZ21lbnQgb2YgcGF0aDEsXG4gICAgIG8gICAgICAgICB0MjogKG51bWJlcikgdCB2YWx1ZSBmb3Igc2VnbWVudCBvZiBwYXRoMixcbiAgICAgbyAgICAgICAgIHNlZ21lbnQxOiAobnVtYmVyKSBvcmRlciBudW1iZXIgZm9yIHNlZ21lbnQgb2YgcGF0aDEsXG4gICAgIG8gICAgICAgICBzZWdtZW50MjogKG51bWJlcikgb3JkZXIgbnVtYmVyIGZvciBzZWdtZW50IG9mIHBhdGgyLFxuICAgICBvICAgICAgICAgYmV6MTogKGFycmF5KSBlaWdodCBjb29yZGluYXRlcyByZXByZXNlbnRpbmcgYmV6acOpciBjdXJ2ZSBmb3IgdGhlIHNlZ21lbnQgb2YgcGF0aDEsXG4gICAgIG8gICAgICAgICBiZXoyOiAoYXJyYXkpIGVpZ2h0IGNvb3JkaW5hdGVzIHJlcHJlc2VudGluZyBiZXppw6lyIGN1cnZlIGZvciB0aGUgc2VnbWVudCBvZiBwYXRoMlxuICAgICBvICAgICB9XG4gICAgIG8gXVxuICAgIFxcKi9cbiAgICBTbmFwLnBhdGguaW50ZXJzZWN0aW9uID0gcGF0aEludGVyc2VjdGlvbjtcbiAgICBTbmFwLnBhdGguaW50ZXJzZWN0aW9uTnVtYmVyID0gcGF0aEludGVyc2VjdGlvbk51bWJlcjtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLmlzUG9pbnRJbnNpZGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogUmV0dXJucyBgdHJ1ZWAgaWYgZ2l2ZW4gcG9pbnQgaXMgaW5zaWRlIGEgZ2l2ZW4gY2xvc2VkIHBhdGguXG4gICAgICpcbiAgICAgKiBOb3RlOiBmaWxsIG1vZGUgZG9lc27igJl0IGFmZmVjdCB0aGUgcmVzdWx0IG9mIHRoaXMgbWV0aG9kLlxuICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgLSB4IChudW1iZXIpIHggb2YgdGhlIHBvaW50XG4gICAgIC0geSAobnVtYmVyKSB5IG9mIHRoZSBwb2ludFxuICAgICA9IChib29sZWFuKSBgdHJ1ZWAgaWYgcG9pbnQgaXMgaW5zaWRlIHRoZSBwYXRoXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC5pc1BvaW50SW5zaWRlID0gaXNQb2ludEluc2lkZVBhdGg7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC5nZXRCQm94XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIFJldHVybnMgdGhlIGJvdW5kaW5nIGJveCBvZiBhIGdpdmVuIHBhdGhcbiAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgID0gKG9iamVjdCkgYm91bmRpbmcgYm94XG4gICAgIG8ge1xuICAgICBvICAgICB4OiAobnVtYmVyKSB4IGNvb3JkaW5hdGUgb2YgdGhlIGxlZnQgdG9wIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHk6IChudW1iZXIpIHkgY29vcmRpbmF0ZSBvZiB0aGUgbGVmdCB0b3AgcG9pbnQgb2YgdGhlIGJveCxcbiAgICAgbyAgICAgeDI6IChudW1iZXIpIHggY29vcmRpbmF0ZSBvZiB0aGUgcmlnaHQgYm90dG9tIHBvaW50IG9mIHRoZSBib3gsXG4gICAgIG8gICAgIHkyOiAobnVtYmVyKSB5IGNvb3JkaW5hdGUgb2YgdGhlIHJpZ2h0IGJvdHRvbSBwb2ludCBvZiB0aGUgYm94LFxuICAgICBvICAgICB3aWR0aDogKG51bWJlcikgd2lkdGggb2YgdGhlIGJveCxcbiAgICAgbyAgICAgaGVpZ2h0OiAobnVtYmVyKSBoZWlnaHQgb2YgdGhlIGJveFxuICAgICBvIH1cbiAgICBcXCovXG4gICAgU25hcC5wYXRoLmdldEJCb3ggPSBwYXRoQkJveDtcbiAgICBTbmFwLnBhdGguZ2V0ID0gZ2V0UGF0aDtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLnRvUmVsYXRpdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFV0aWxpdHkgbWV0aG9kXG4gICAgICoqXG4gICAgICogQ29udmVydHMgcGF0aCBjb29yZGluYXRlcyBpbnRvIHJlbGF0aXZlIHZhbHVlc1xuICAgICAtIHBhdGggKHN0cmluZykgcGF0aCBzdHJpbmdcbiAgICAgPSAoYXJyYXkpIHBhdGggc3RyaW5nXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC50b1JlbGF0aXZlID0gcGF0aFRvUmVsYXRpdmU7XG4gICAgLypcXFxuICAgICAqIFNuYXAucGF0aC50b0Fic29sdXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBVdGlsaXR5IG1ldGhvZFxuICAgICAqKlxuICAgICAqIENvbnZlcnRzIHBhdGggY29vcmRpbmF0ZXMgaW50byBhYnNvbHV0ZSB2YWx1ZXNcbiAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgID0gKGFycmF5KSBwYXRoIHN0cmluZ1xuICAgIFxcKi9cbiAgICBTbmFwLnBhdGgudG9BYnNvbHV0ZSA9IHBhdGhUb0Fic29sdXRlO1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLnBhdGgudG9DdWJpY1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVXRpbGl0eSBtZXRob2RcbiAgICAgKipcbiAgICAgKiBDb252ZXJ0cyBwYXRoIHRvIGEgbmV3IHBhdGggd2hlcmUgYWxsIHNlZ21lbnRzIGFyZSBjdWJpYyBiZXppw6lyIGN1cnZlc1xuICAgICAtIHBhdGhTdHJpbmcgKHN0cmluZ3xhcnJheSkgcGF0aCBzdHJpbmcgb3IgYXJyYXkgb2Ygc2VnbWVudHNcbiAgICAgPSAoYXJyYXkpIGFycmF5IG9mIHNlZ21lbnRzXG4gICAgXFwqL1xuICAgIFNuYXAucGF0aC50b0N1YmljID0gcGF0aDJjdXJ2ZTtcbiAgICAvKlxcXG4gICAgICogU25hcC5wYXRoLm1hcFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogVHJhbnNmb3JtIHRoZSBwYXRoIHN0cmluZyB3aXRoIHRoZSBnaXZlbiBtYXRyaXhcbiAgICAgLSBwYXRoIChzdHJpbmcpIHBhdGggc3RyaW5nXG4gICAgIC0gbWF0cml4IChvYmplY3QpIHNlZSBATWF0cml4XG4gICAgID0gKHN0cmluZykgdHJhbnNmb3JtZWQgcGF0aCBzdHJpbmdcbiAgICBcXCovXG4gICAgU25hcC5wYXRoLm1hcCA9IG1hcFBhdGg7XG4gICAgU25hcC5wYXRoLnRvU3RyaW5nID0gdG9TdHJpbmc7XG4gICAgU25hcC5wYXRoLmNsb25lID0gcGF0aENsb25lO1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYikge1xuICAgIHZhciBtbWF4ID0gTWF0aC5tYXgsXG4gICAgICAgIG1taW4gPSBNYXRoLm1pbjtcblxuICAgIC8vIFNldFxuICAgIHZhciBTZXQgPSBmdW5jdGlvbiAoaXRlbXMpIHtcbiAgICAgICAgdGhpcy5pdGVtcyA9IFtdO1xuXHR0aGlzLmJpbmRpbmdzID0ge307XG4gICAgICAgIHRoaXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50eXBlID0gXCJzZXRcIjtcbiAgICAgICAgaWYgKGl0ZW1zKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBpdGVtcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1zW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbdGhpcy5pdGVtcy5sZW5ndGhdID0gdGhpcy5pdGVtc1t0aGlzLml0ZW1zLmxlbmd0aF0gPSBpdGVtc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZW5ndGgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNldHByb3RvID0gU2V0LnByb3RvdHlwZTtcbiAgICAvKlxcXG4gICAgICogU2V0LnB1c2hcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgZWFjaCBhcmd1bWVudCB0byB0aGUgY3VycmVudCBzZXRcbiAgICAgPSAob2JqZWN0KSBvcmlnaW5hbCBlbGVtZW50XG4gICAgXFwqL1xuICAgIHNldHByb3RvLnB1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpdGVtLFxuICAgICAgICAgICAgbGVuO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGlmIChpdGVtKSB7XG4gICAgICAgICAgICAgICAgbGVuID0gdGhpcy5pdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGhpc1tsZW5dID0gdGhpcy5pdGVtc1tsZW5dID0gaXRlbTtcbiAgICAgICAgICAgICAgICB0aGlzLmxlbmd0aCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5wb3BcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgbGFzdCBlbGVtZW50IGFuZCByZXR1cm5zIGl0XG4gICAgID0gKG9iamVjdCkgZWxlbWVudFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5wb3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubGVuZ3RoICYmIGRlbGV0ZSB0aGlzW3RoaXMubGVuZ3RoLS1dO1xuICAgICAgICByZXR1cm4gdGhpcy5pdGVtcy5wb3AoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuZm9yRWFjaFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogRXhlY3V0ZXMgZ2l2ZW4gZnVuY3Rpb24gZm9yIGVhY2ggZWxlbWVudCBpbiB0aGUgc2V0XG4gICAgICpcbiAgICAgKiBJZiB0aGUgZnVuY3Rpb24gcmV0dXJucyBgZmFsc2VgLCB0aGUgbG9vcCBzdG9wcyBydW5uaW5nLlxuICAgICAqKlxuICAgICAtIGNhbGxiYWNrIChmdW5jdGlvbikgZnVuY3Rpb24gdG8gcnVuXG4gICAgIC0gdGhpc0FyZyAob2JqZWN0KSBjb250ZXh0IG9iamVjdCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgID0gKG9iamVjdCkgU2V0IG9iamVjdFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5mb3JFYWNoID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5pdGVtc1tpXSwgaSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU2V0LmFuaW1hdGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFuaW1hdGVzIGVhY2ggZWxlbWVudCBpbiBzZXQgaW4gc3luYy5cbiAgICAgKlxuICAgICAqKlxuICAgICAtIGF0dHJzIChvYmplY3QpIGtleS12YWx1ZSBwYWlycyBvZiBkZXN0aW5hdGlvbiBhdHRyaWJ1dGVzXG4gICAgIC0gZHVyYXRpb24gKG51bWJlcikgZHVyYXRpb24gb2YgdGhlIGFuaW1hdGlvbiBpbiBtaWxsaXNlY29uZHNcbiAgICAgLSBlYXNpbmcgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgZWFzaW5nIGZ1bmN0aW9uIGZyb20gQG1pbmEgb3IgY3VzdG9tXG4gICAgIC0gY2FsbGJhY2sgKGZ1bmN0aW9uKSAjb3B0aW9uYWwgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCBleGVjdXRlcyB3aGVuIHRoZSBhbmltYXRpb24gZW5kc1xuICAgICAqIG9yXG4gICAgIC0gYW5pbWF0aW9uIChhcnJheSkgYXJyYXkgb2YgYW5pbWF0aW9uIHBhcmFtZXRlciBmb3IgZWFjaCBlbGVtZW50IGluIHNldCBpbiBmb3JtYXQgYFthdHRycywgZHVyYXRpb24sIGVhc2luZywgY2FsbGJhY2tdYFxuICAgICA+IFVzYWdlXG4gICAgIHwgLy8gYW5pbWF0ZSBhbGwgZWxlbWVudHMgaW4gc2V0IHRvIHJhZGl1cyAxMFxuICAgICB8IHNldC5hbmltYXRlKHtyOiAxMH0sIDUwMCwgbWluYS5lYXNlaW4pO1xuICAgICB8IC8vIG9yXG4gICAgIHwgLy8gYW5pbWF0ZSBmaXJzdCBlbGVtZW50IHRvIHJhZGl1cyAxMCwgYnV0IHNlY29uZCB0byByYWRpdXMgMjAgYW5kIGluIGRpZmZlcmVudCB0aW1lXG4gICAgIHwgc2V0LmFuaW1hdGUoW3tyOiAxMH0sIDUwMCwgbWluYS5lYXNlaW5dLCBbe3I6IDIwfSwgMTUwMCwgbWluYS5lYXNlaW5dKTtcbiAgICAgPSAoRWxlbWVudCkgdGhlIGN1cnJlbnQgZWxlbWVudFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5hbmltYXRlID0gZnVuY3Rpb24gKGF0dHJzLCBtcywgZWFzaW5nLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAodHlwZW9mIGVhc2luZyA9PSBcImZ1bmN0aW9uXCIgJiYgIWVhc2luZy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrID0gZWFzaW5nO1xuICAgICAgICAgICAgZWFzaW5nID0gbWluYS5saW5lYXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGF0dHJzIGluc3RhbmNlb2YgU25hcC5fLkFuaW1hdGlvbikge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSBhdHRycy5jYWxsYmFjaztcbiAgICAgICAgICAgIGVhc2luZyA9IGF0dHJzLmVhc2luZztcbiAgICAgICAgICAgIG1zID0gZWFzaW5nLmR1cjtcbiAgICAgICAgICAgIGF0dHJzID0gYXR0cnMuYXR0cjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgaWYgKFNuYXAuaXMoYXR0cnMsIFwiYXJyYXlcIikgJiYgU25hcC5pcyhhcmdzW2FyZ3MubGVuZ3RoIC0gMV0sIFwiYXJyYXlcIikpIHtcbiAgICAgICAgICAgIHZhciBlYWNoID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYmVnaW4sXG4gICAgICAgICAgICBoYW5kbGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChiZWdpbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmIgPSBiZWdpbjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiZWdpbiA9IHRoaXMuYjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2IgPSAwLFxuICAgICAgICAgICAgc2V0ID0gdGhpcyxcbiAgICAgICAgICAgIGNhbGxiYWNrZXIgPSBjYWxsYmFjayAmJiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCsrY2IgPT0gc2V0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIHJldHVybiB0aGlzLmZvckVhY2goZnVuY3Rpb24gKGVsLCBpKSB7XG4gICAgICAgICAgICBldmUub25jZShcInNuYXAuYW5pbWNyZWF0ZWQuXCIgKyBlbC5pZCwgaGFuZGxlcik7XG4gICAgICAgICAgICBpZiAoZWFjaCkge1xuICAgICAgICAgICAgICAgIGFyZ3NbaV0gJiYgZWwuYW5pbWF0ZS5hcHBseShlbCwgYXJnc1tpXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsLmFuaW1hdGUoYXR0cnMsIG1zLCBlYXNpbmcsIGNhbGxiYWNrZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHNldHByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnBvcCgpLnJlbW92ZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5iaW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBTcGVjaWZpZXMgaG93IHRvIGhhbmRsZSBhIHNwZWNpZmljIGF0dHJpYnV0ZSB3aGVuIGFwcGxpZWRcbiAgICAgKiB0byBhIHNldC5cbiAgICAgKlxuICAgICAqKlxuICAgICAtIGF0dHIgKHN0cmluZykgYXR0cmlidXRlIG5hbWVcbiAgICAgLSBjYWxsYmFjayAoZnVuY3Rpb24pIGZ1bmN0aW9uIHRvIHJ1blxuICAgICAqIG9yXG4gICAgIC0gYXR0ciAoc3RyaW5nKSBhdHRyaWJ1dGUgbmFtZVxuICAgICAtIGVsZW1lbnQgKEVsZW1lbnQpIHNwZWNpZmljIGVsZW1lbnQgaW4gdGhlIHNldCB0byBhcHBseSB0aGUgYXR0cmlidXRlIHRvXG4gICAgICogb3JcbiAgICAgLSBhdHRyIChzdHJpbmcpIGF0dHJpYnV0ZSBuYW1lXG4gICAgIC0gZWxlbWVudCAoRWxlbWVudCkgc3BlY2lmaWMgZWxlbWVudCBpbiB0aGUgc2V0IHRvIGFwcGx5IHRoZSBhdHRyaWJ1dGUgdG9cbiAgICAgLSBlYXR0ciAoc3RyaW5nKSBhdHRyaWJ1dGUgb24gdGhlIGVsZW1lbnQgdG8gYmluZCB0aGUgYXR0cmlidXRlIHRvXG4gICAgID0gKG9iamVjdCkgU2V0IG9iamVjdFxuICAgIFxcKi9cbiAgICBzZXRwcm90by5iaW5kID0gZnVuY3Rpb24gKGF0dHIsIGEsIGIpIHtcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgaWYgKHR5cGVvZiBhID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5iaW5kaW5nc1thdHRyXSA9IGE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYW5hbWUgPSBiIHx8IGF0dHI7XG4gICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2F0dHJdID0gZnVuY3Rpb24gKHYpIHtcbiAgICAgICAgICAgICAgICBkYXRhW2FuYW1lXSA9IHY7XG4gICAgICAgICAgICAgICAgYS5hdHRyKGRhdGEpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHNldHByb3RvLmF0dHIgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIHVuYm91bmQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgayBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3Nba10pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2tdKHZhbHVlW2tdKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdW5ib3VuZFtrXSA9IHZhbHVlW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pdGVtc1tpXS5hdHRyKHVuYm91bmQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNldC5jbGVhclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhbGwgZWxlbWVudHMgZnJvbSB0aGUgc2V0XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB3aGlsZSAodGhpcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMucG9wKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuc3BsaWNlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIHJhbmdlIG9mIGVsZW1lbnRzIGZyb20gdGhlIHNldFxuICAgICAqKlxuICAgICAtIGluZGV4IChudW1iZXIpIHBvc2l0aW9uIG9mIHRoZSBkZWxldGlvblxuICAgICAtIGNvdW50IChudW1iZXIpIG51bWJlciBvZiBlbGVtZW50IHRvIHJlbW92ZVxuICAgICAtIGluc2VydGlvbuKApiAob2JqZWN0KSAjb3B0aW9uYWwgZWxlbWVudHMgdG8gaW5zZXJ0XG4gICAgID0gKG9iamVjdCkgc2V0IGVsZW1lbnRzIHRoYXQgd2VyZSBkZWxldGVkXG4gICAgXFwqL1xuICAgIHNldHByb3RvLnNwbGljZSA9IGZ1bmN0aW9uIChpbmRleCwgY291bnQsIGluc2VydGlvbikge1xuICAgICAgICBpbmRleCA9IGluZGV4IDwgMCA/IG1tYXgodGhpcy5sZW5ndGggKyBpbmRleCwgMCkgOiBpbmRleDtcbiAgICAgICAgY291bnQgPSBtbWF4KDAsIG1taW4odGhpcy5sZW5ndGggLSBpbmRleCwgY291bnQpKTtcbiAgICAgICAgdmFyIHRhaWwgPSBbXSxcbiAgICAgICAgICAgIHRvZGVsID0gW10sXG4gICAgICAgICAgICBhcmdzID0gW10sXG4gICAgICAgICAgICBpO1xuICAgICAgICBmb3IgKGkgPSAyOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgdG9kZWwucHVzaCh0aGlzW2luZGV4ICsgaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoOyBpIDwgdGhpcy5sZW5ndGggLSBpbmRleDsgaSsrKSB7XG4gICAgICAgICAgICB0YWlsLnB1c2godGhpc1tpbmRleCArIGldKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYXJnbGVuID0gYXJncy5sZW5ndGg7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcmdsZW4gKyB0YWlsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2luZGV4ICsgaV0gPSB0aGlzW2luZGV4ICsgaV0gPSBpIDwgYXJnbGVuID8gYXJnc1tpXSA6IHRhaWxbaSAtIGFyZ2xlbl07XG4gICAgICAgIH1cbiAgICAgICAgaSA9IHRoaXMuaXRlbXMubGVuZ3RoID0gdGhpcy5sZW5ndGggLT0gY291bnQgLSBhcmdsZW47XG4gICAgICAgIHdoaWxlICh0aGlzW2ldKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpc1tpKytdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgU2V0KHRvZGVsKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTZXQuZXhjbHVkZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBnaXZlbiBlbGVtZW50IGZyb20gdGhlIHNldFxuICAgICAqKlxuICAgICAtIGVsZW1lbnQgKG9iamVjdCkgZWxlbWVudCB0byByZW1vdmVcbiAgICAgPSAoYm9vbGVhbikgYHRydWVgIGlmIG9iamVjdCB3YXMgZm91bmQgYW5kIHJlbW92ZWQgZnJvbSB0aGUgc2V0XG4gICAgXFwqL1xuICAgIHNldHByb3RvLmV4Y2x1ZGUgPSBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gdGhpcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAodGhpc1tpXSA9PSBlbCkge1xuICAgICAgICAgICAgdGhpcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBzZXRwcm90by5pbnNlcnRBZnRlciA9IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICB2YXIgaSA9IHRoaXMuaXRlbXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2ldLmluc2VydEFmdGVyKGVsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIHNldHByb3RvLmdldEJCb3ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4ID0gW10sXG4gICAgICAgICAgICB5ID0gW10sXG4gICAgICAgICAgICB4MiA9IFtdLFxuICAgICAgICAgICAgeTIgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpLS07KSBpZiAoIXRoaXMuaXRlbXNbaV0ucmVtb3ZlZCkge1xuICAgICAgICAgICAgdmFyIGJveCA9IHRoaXMuaXRlbXNbaV0uZ2V0QkJveCgpO1xuICAgICAgICAgICAgeC5wdXNoKGJveC54KTtcbiAgICAgICAgICAgIHkucHVzaChib3gueSk7XG4gICAgICAgICAgICB4Mi5wdXNoKGJveC54ICsgYm94LndpZHRoKTtcbiAgICAgICAgICAgIHkyLnB1c2goYm94LnkgKyBib3guaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgICAgICB4ID0gbW1pbi5hcHBseSgwLCB4KTtcbiAgICAgICAgeSA9IG1taW4uYXBwbHkoMCwgeSk7XG4gICAgICAgIHgyID0gbW1heC5hcHBseSgwLCB4Mik7XG4gICAgICAgIHkyID0gbW1heC5hcHBseSgwLCB5Mik7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB4LFxuICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgIHgyOiB4MixcbiAgICAgICAgICAgIHkyOiB5MixcbiAgICAgICAgICAgIHdpZHRoOiB4MiAtIHgsXG4gICAgICAgICAgICBoZWlnaHQ6IHkyIC0geSxcbiAgICAgICAgICAgIGN4OiB4ICsgKHgyIC0geCkgLyAyLFxuICAgICAgICAgICAgY3k6IHkgKyAoeTIgLSB5KSAvIDJcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHNldHByb3RvLmNsb25lID0gZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgcyA9IG5ldyBTZXQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpaSA9IHRoaXMuaXRlbXMubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgcy5wdXNoKHRoaXMuaXRlbXNbaV0uY2xvbmUoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHM7XG4gICAgfTtcbiAgICBzZXRwcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFwiU25hcFxcdTIwMThzIHNldFwiO1xuICAgIH07XG4gICAgc2V0cHJvdG8udHlwZSA9IFwic2V0XCI7XG4gICAgLy8gZXhwb3J0XG4gICAgU25hcC5TZXQgPSBTZXQ7XG4gICAgU25hcC5zZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZXQgPSBuZXcgU2V0O1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgc2V0LnB1c2guYXBwbHkoc2V0LCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2V0O1xuICAgIH07XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDEzIEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy8gXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLyBcbi8vIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8gXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iKSB7XG4gICAgdmFyIG5hbWVzID0ge30sXG4gICAgICAgIHJlVW5pdCA9IC9bYS16XSskL2ksXG4gICAgICAgIFN0ciA9IFN0cmluZztcbiAgICBuYW1lcy5zdHJva2UgPSBuYW1lcy5maWxsID0gXCJjb2xvdXJcIjtcbiAgICBmdW5jdGlvbiBnZXRFbXB0eShpdGVtKSB7XG4gICAgICAgIHZhciBsID0gaXRlbVswXTtcbiAgICAgICAgc3dpdGNoIChsLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIGNhc2UgXCJ0XCI6IHJldHVybiBbbCwgMCwgMF07XG4gICAgICAgICAgICBjYXNlIFwibVwiOiByZXR1cm4gW2wsIDEsIDAsIDAsIDEsIDAsIDBdO1xuICAgICAgICAgICAgY2FzZSBcInJcIjogaWYgKGl0ZW0ubGVuZ3RoID09IDQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDAsIGl0ZW1bMl0sIGl0ZW1bM11dO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FzZSBcInNcIjogaWYgKGl0ZW0ubGVuZ3RoID09IDUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2wsIDEsIDEsIGl0ZW1bM10sIGl0ZW1bNF1dO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLmxlbmd0aCA9PSAzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAxLCAxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtsLCAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlcXVhbGlzZVRyYW5zZm9ybSh0MSwgdDIsIGdldEJCb3gpIHtcbiAgICAgICAgdDIgPSBTdHIodDIpLnJlcGxhY2UoL1xcLnszfXxcXHUyMDI2L2csIHQxKTtcbiAgICAgICAgdDEgPSBTbmFwLnBhcnNlVHJhbnNmb3JtU3RyaW5nKHQxKSB8fCBbXTtcbiAgICAgICAgdDIgPSBTbmFwLnBhcnNlVHJhbnNmb3JtU3RyaW5nKHQyKSB8fCBbXTtcbiAgICAgICAgdmFyIG1heGxlbmd0aCA9IE1hdGgubWF4KHQxLmxlbmd0aCwgdDIubGVuZ3RoKSxcbiAgICAgICAgICAgIGZyb20gPSBbXSxcbiAgICAgICAgICAgIHRvID0gW10sXG4gICAgICAgICAgICBpID0gMCwgaiwgamosXG4gICAgICAgICAgICB0dDEsIHR0MjtcbiAgICAgICAgZm9yICg7IGkgPCBtYXhsZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHQxID0gdDFbaV0gfHwgZ2V0RW1wdHkodDJbaV0pO1xuICAgICAgICAgICAgdHQyID0gdDJbaV0gfHwgZ2V0RW1wdHkodHQxKTtcbiAgICAgICAgICAgIGlmICgodHQxWzBdICE9IHR0MlswXSkgfHxcbiAgICAgICAgICAgICAgICAodHQxWzBdLnRvTG93ZXJDYXNlKCkgPT0gXCJyXCIgJiYgKHR0MVsyXSAhPSB0dDJbMl0gfHwgdHQxWzNdICE9IHR0MlszXSkpIHx8XG4gICAgICAgICAgICAgICAgKHR0MVswXS50b0xvd2VyQ2FzZSgpID09IFwic1wiICYmICh0dDFbM10gIT0gdHQyWzNdIHx8IHR0MVs0XSAhPSB0dDJbNF0pKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICB0MSA9IFNuYXAuXy50cmFuc2Zvcm0ybWF0cml4KHQxLCBnZXRCQm94KCkpO1xuICAgICAgICAgICAgICAgICAgICB0MiA9IFNuYXAuXy50cmFuc2Zvcm0ybWF0cml4KHQyLCBnZXRCQm94KCkpO1xuICAgICAgICAgICAgICAgICAgICBmcm9tID0gW1tcIm1cIiwgdDEuYSwgdDEuYiwgdDEuYywgdDEuZCwgdDEuZSwgdDEuZl1dO1xuICAgICAgICAgICAgICAgICAgICB0byA9IFtbXCJtXCIsIHQyLmEsIHQyLmIsIHQyLmMsIHQyLmQsIHQyLmUsIHQyLmZdXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmcm9tW2ldID0gW107XG4gICAgICAgICAgICB0b1tpXSA9IFtdO1xuICAgICAgICAgICAgZm9yIChqID0gMCwgamogPSBNYXRoLm1heCh0dDEubGVuZ3RoLCB0dDIubGVuZ3RoKTsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICBqIGluIHR0MSAmJiAoZnJvbVtpXVtqXSA9IHR0MVtqXSk7XG4gICAgICAgICAgICAgICAgaiBpbiB0dDIgJiYgKHRvW2ldW2pdID0gdHQyW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJvbTogcGF0aDJhcnJheShmcm9tKSxcbiAgICAgICAgICAgIHRvOiBwYXRoMmFycmF5KHRvKSxcbiAgICAgICAgICAgIGY6IGdldFBhdGgoZnJvbSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0TnVtYmVyKHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRVbml0KHVuaXQpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICh2YWwpIHtcbiAgICAgICAgICAgIHJldHVybiArdmFsLnRvRml4ZWQoMykgKyB1bml0O1xuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRWaWV3Qm94KHZhbCkge1xuICAgICAgICByZXR1cm4gdmFsLmpvaW4oXCIgXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBnZXRDb2xvdXIoY2xyKSB7XG4gICAgICAgIHJldHVybiBTbmFwLnJnYihjbHJbMF0sIGNsclsxXSwgY2xyWzJdKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0UGF0aChwYXRoKSB7XG4gICAgICAgIHZhciBrID0gMCwgaSwgaWksIGosIGpqLCBvdXQsIGEsIGIgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIG91dCA9IFwiW1wiO1xuICAgICAgICAgICAgYSA9IFsnXCInICsgcGF0aFtpXVswXSArICdcIiddO1xuICAgICAgICAgICAgZm9yIChqID0gMSwgamogPSBwYXRoW2ldLmxlbmd0aDsgaiA8IGpqOyBqKyspIHtcbiAgICAgICAgICAgICAgICBhW2pdID0gXCJ2YWxbXCIgKyAoaysrKSArIFwiXVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0ICs9IGEgKyBcIl1cIjtcbiAgICAgICAgICAgIGJbaV0gPSBvdXQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEZ1bmN0aW9uKFwidmFsXCIsIFwicmV0dXJuIFNuYXAucGF0aC50b1N0cmluZy5jYWxsKFtcIiArIGIgKyBcIl0pXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRoMmFycmF5KHBhdGgpIHtcbiAgICAgICAgdmFyIG91dCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBwYXRoLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAxLCBqaiA9IHBhdGhbaV0ubGVuZ3RoOyBqIDwgamo7IGorKykge1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKHBhdGhbaV1bal0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGlzTnVtZXJpYyhvYmopIHtcbiAgICAgICAgcmV0dXJuIGlzRmluaXRlKHBhcnNlRmxvYXQob2JqKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFycmF5RXF1YWwoYXJyMSwgYXJyMikge1xuICAgICAgICBpZiAoIVNuYXAuaXMoYXJyMSwgXCJhcnJheVwiKSB8fCAhU25hcC5pcyhhcnIyLCBcImFycmF5XCIpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFycjEudG9TdHJpbmcoKSA9PSBhcnIyLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIEVsZW1lbnQucHJvdG90eXBlLmVxdWFsID0gZnVuY3Rpb24gKG5hbWUsIGIpIHtcbiAgICAgICAgcmV0dXJuIGV2ZShcInNuYXAudXRpbC5lcXVhbFwiLCB0aGlzLCBuYW1lLCBiKS5maXJzdERlZmluZWQoKTtcbiAgICB9O1xuICAgIGV2ZS5vbihcInNuYXAudXRpbC5lcXVhbFwiLCBmdW5jdGlvbiAobmFtZSwgYikge1xuICAgICAgICB2YXIgQSwgQiwgYSA9IFN0cih0aGlzLmF0dHIobmFtZSkgfHwgXCJcIiksXG4gICAgICAgICAgICBlbCA9IHRoaXM7XG4gICAgICAgIGlmIChpc051bWVyaWMoYSkgJiYgaXNOdW1lcmljKGIpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IHBhcnNlRmxvYXQoYSksXG4gICAgICAgICAgICAgICAgdG86IHBhcnNlRmxvYXQoYiksXG4gICAgICAgICAgICAgICAgZjogZ2V0TnVtYmVyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lc1tuYW1lXSA9PSBcImNvbG91clwiKSB7XG4gICAgICAgICAgICBBID0gU25hcC5jb2xvcihhKTtcbiAgICAgICAgICAgIEIgPSBTbmFwLmNvbG9yKGIpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBbQS5yLCBBLmcsIEEuYiwgQS5vcGFjaXR5XSxcbiAgICAgICAgICAgICAgICB0bzogW0IuciwgQi5nLCBCLmIsIEIub3BhY2l0eV0sXG4gICAgICAgICAgICAgICAgZjogZ2V0Q29sb3VyXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IFwidmlld0JveFwiKSB7XG4gICAgICAgICAgICBBID0gdGhpcy5hdHRyKG5hbWUpLnZiLnNwbGl0KFwiIFwiKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgICAgIEIgPSBiLnNwbGl0KFwiIFwiKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogQSxcbiAgICAgICAgICAgICAgICB0bzogQixcbiAgICAgICAgICAgICAgICBmOiBnZXRWaWV3Qm94XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IFwidHJhbnNmb3JtXCIgfHwgbmFtZSA9PSBcImdyYWRpZW50VHJhbnNmb3JtXCIgfHwgbmFtZSA9PSBcInBhdHRlcm5UcmFuc2Zvcm1cIikge1xuICAgICAgICAgICAgaWYgKGIgaW5zdGFuY2VvZiBTbmFwLk1hdHJpeCkge1xuICAgICAgICAgICAgICAgIGIgPSBiLnRvVHJhbnNmb3JtU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIVNuYXAuXy5yZ1RyYW5zZm9ybS50ZXN0KGIpKSB7XG4gICAgICAgICAgICAgICAgYiA9IFNuYXAuXy5zdmdUcmFuc2Zvcm0yc3RyaW5nKGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGVxdWFsaXNlVHJhbnNmb3JtKGEsIGIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWwuZ2V0QkJveCgxKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IFwiZFwiIHx8IG5hbWUgPT0gXCJwYXRoXCIpIHtcbiAgICAgICAgICAgIEEgPSBTbmFwLnBhdGgudG9DdWJpYyhhLCBiKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogcGF0aDJhcnJheShBWzBdKSxcbiAgICAgICAgICAgICAgICB0bzogcGF0aDJhcnJheShBWzFdKSxcbiAgICAgICAgICAgICAgICBmOiBnZXRQYXRoKEFbMF0pXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09IFwicG9pbnRzXCIpIHtcbiAgICAgICAgICAgIEEgPSBTdHIoYSkuc3BsaXQoU25hcC5fLnNlcGFyYXRvcik7XG4gICAgICAgICAgICBCID0gU3RyKGIpLnNwbGl0KFNuYXAuXy5zZXBhcmF0b3IpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiBBLFxuICAgICAgICAgICAgICAgIHRvOiBCLFxuICAgICAgICAgICAgICAgIGY6IGZ1bmN0aW9uICh2YWwpIHsgcmV0dXJuIHZhbDsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYVVuaXQgPSBhLm1hdGNoKHJlVW5pdCksXG4gICAgICAgICAgICBiVW5pdCA9IFN0cihiKS5tYXRjaChyZVVuaXQpO1xuICAgICAgICBpZiAoYVVuaXQgJiYgYXJyYXlFcXVhbChhVW5pdCwgYlVuaXQpKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IHBhcnNlRmxvYXQoYSksXG4gICAgICAgICAgICAgICAgdG86IHBhcnNlRmxvYXQoYiksXG4gICAgICAgICAgICAgICAgZjogZ2V0VW5pdChhVW5pdClcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGZyb206IHRoaXMuYXNQWChuYW1lKSxcbiAgICAgICAgICAgICAgICB0bzogdGhpcy5hc1BYKG5hbWUsIGIpLFxuICAgICAgICAgICAgICAgIGY6IGdldE51bWJlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYikge1xuICAgIHZhciBlbHByb3RvID0gRWxlbWVudC5wcm90b3R5cGUsXG4gICAgaGFzID0gXCJoYXNPd25Qcm9wZXJ0eVwiLFxuICAgIHN1cHBvcnRzVG91Y2ggPSBcImNyZWF0ZVRvdWNoXCIgaW4gZ2xvYi5kb2MsXG4gICAgZXZlbnRzID0gW1xuICAgICAgICBcImNsaWNrXCIsIFwiZGJsY2xpY2tcIiwgXCJtb3VzZWRvd25cIiwgXCJtb3VzZW1vdmVcIiwgXCJtb3VzZW91dFwiLFxuICAgICAgICBcIm1vdXNlb3ZlclwiLCBcIm1vdXNldXBcIiwgXCJ0b3VjaHN0YXJ0XCIsIFwidG91Y2htb3ZlXCIsIFwidG91Y2hlbmRcIixcbiAgICAgICAgXCJ0b3VjaGNhbmNlbFwiXG4gICAgXSxcbiAgICB0b3VjaE1hcCA9IHtcbiAgICAgICAgbW91c2Vkb3duOiBcInRvdWNoc3RhcnRcIixcbiAgICAgICAgbW91c2Vtb3ZlOiBcInRvdWNobW92ZVwiLFxuICAgICAgICBtb3VzZXVwOiBcInRvdWNoZW5kXCJcbiAgICB9LFxuICAgIGdldFNjcm9sbCA9IGZ1bmN0aW9uICh4eSwgZWwpIHtcbiAgICAgICAgdmFyIG5hbWUgPSB4eSA9PSBcInlcIiA/IFwic2Nyb2xsVG9wXCIgOiBcInNjcm9sbExlZnRcIixcbiAgICAgICAgICAgIGRvYyA9IGVsICYmIGVsLm5vZGUgPyBlbC5ub2RlLm93bmVyRG9jdW1lbnQgOiBnbG9iLmRvYztcbiAgICAgICAgcmV0dXJuIGRvY1tuYW1lIGluIGRvYy5kb2N1bWVudEVsZW1lbnQgPyBcImRvY3VtZW50RWxlbWVudFwiIDogXCJib2R5XCJdW25hbWVdO1xuICAgIH0sXG4gICAgcHJldmVudERlZmF1bHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9LFxuICAgIHByZXZlbnRUb3VjaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWxFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0sXG4gICAgc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmNhbmNlbEJ1YmJsZSA9IHRydWU7XG4gICAgfSxcbiAgICBzdG9wVG91Y2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSxcbiAgICBhZGRFdmVudCA9IGZ1bmN0aW9uIChvYmosIHR5cGUsIGZuLCBlbGVtZW50KSB7XG4gICAgICAgIHZhciByZWFsTmFtZSA9IHN1cHBvcnRzVG91Y2ggJiYgdG91Y2hNYXBbdHlwZV0gPyB0b3VjaE1hcFt0eXBlXSA6IHR5cGUsXG4gICAgICAgICAgICBmID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2Nyb2xsWSA9IGdldFNjcm9sbChcInlcIiwgZWxlbWVudCksXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbFggPSBnZXRTY3JvbGwoXCJ4XCIsIGVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIGlmIChzdXBwb3J0c1RvdWNoICYmIHRvdWNoTWFwW2hhc10odHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gZS50YXJnZXRUb3VjaGVzICYmIGUudGFyZ2V0VG91Y2hlcy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZS50YXJnZXRUb3VjaGVzW2ldLnRhcmdldCA9PSBvYmogfHwgb2JqLmNvbnRhaW5zKGUudGFyZ2V0VG91Y2hlc1tpXS50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG9sZGUgPSBlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUgPSBlLnRhcmdldFRvdWNoZXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5vcmlnaW5hbEV2ZW50ID0gb2xkZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0ID0gcHJldmVudFRvdWNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uID0gc3RvcFRvdWNoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB4ID0gZS5jbGllbnRYICsgc2Nyb2xsWCxcbiAgICAgICAgICAgICAgICAgICAgeSA9IGUuY2xpZW50WSArIHNjcm9sbFk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwoZWxlbWVudCwgZSwgeCwgeSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmICh0eXBlICE9PSByZWFsTmFtZSkge1xuICAgICAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgZiwgZmFsc2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqLmFkZEV2ZW50TGlzdGVuZXIocmVhbE5hbWUsIGYsIGZhbHNlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHR5cGUgIT09IHJlYWxOYW1lKSB7XG4gICAgICAgICAgICAgICAgb2JqLnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgZiwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvYmoucmVtb3ZlRXZlbnRMaXN0ZW5lcihyZWFsTmFtZSwgZiwgZmFsc2UpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBkcmFnID0gW10sXG4gICAgZHJhZ01vdmUgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgeCA9IGUuY2xpZW50WCxcbiAgICAgICAgICAgIHkgPSBlLmNsaWVudFksXG4gICAgICAgICAgICBzY3JvbGxZID0gZ2V0U2Nyb2xsKFwieVwiKSxcbiAgICAgICAgICAgIHNjcm9sbFggPSBnZXRTY3JvbGwoXCJ4XCIpLFxuICAgICAgICAgICAgZHJhZ2ksXG4gICAgICAgICAgICBqID0gZHJhZy5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChqLS0pIHtcbiAgICAgICAgICAgIGRyYWdpID0gZHJhZ1tqXTtcbiAgICAgICAgICAgIGlmIChzdXBwb3J0c1RvdWNoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGkgPSBlLnRvdWNoZXMgJiYgZS50b3VjaGVzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgdG91Y2g7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgICAgICAgICB0b3VjaCA9IGUudG91Y2hlc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdWNoLmlkZW50aWZpZXIgPT0gZHJhZ2kuZWwuX2RyYWcuaWQgfHwgZHJhZ2kuZWwubm9kZS5jb250YWlucyh0b3VjaC50YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4ID0gdG91Y2guY2xpZW50WDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHkgPSB0b3VjaC5jbGllbnRZO1xuICAgICAgICAgICAgICAgICAgICAgICAgKGUub3JpZ2luYWxFdmVudCA/IGUub3JpZ2luYWxFdmVudCA6IGUpLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5vZGUgPSBkcmFnaS5lbC5ub2RlLFxuICAgICAgICAgICAgICAgIG8sXG4gICAgICAgICAgICAgICAgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmcsXG4gICAgICAgICAgICAgICAgcGFyZW50ID0gbm9kZS5wYXJlbnROb2RlLFxuICAgICAgICAgICAgICAgIGRpc3BsYXkgPSBub2RlLnN0eWxlLmRpc3BsYXk7XG4gICAgICAgICAgICAvLyBnbG9iLndpbi5vcGVyYSAmJiBwYXJlbnQucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICAvLyBub2RlLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgIC8vIG8gPSBkcmFnaS5lbC5wYXBlci5nZXRFbGVtZW50QnlQb2ludCh4LCB5KTtcbiAgICAgICAgICAgIC8vIG5vZGUuc3R5bGUuZGlzcGxheSA9IGRpc3BsYXk7XG4gICAgICAgICAgICAvLyBnbG9iLndpbi5vcGVyYSAmJiAobmV4dCA/IHBhcmVudC5pbnNlcnRCZWZvcmUobm9kZSwgbmV4dCkgOiBwYXJlbnQuYXBwZW5kQ2hpbGQobm9kZSkpO1xuICAgICAgICAgICAgLy8gbyAmJiBldmUoXCJzbmFwLmRyYWcub3Zlci5cIiArIGRyYWdpLmVsLmlkLCBkcmFnaS5lbCwgbyk7XG4gICAgICAgICAgICB4ICs9IHNjcm9sbFg7XG4gICAgICAgICAgICB5ICs9IHNjcm9sbFk7XG4gICAgICAgICAgICBldmUoXCJzbmFwLmRyYWcubW92ZS5cIiArIGRyYWdpLmVsLmlkLCBkcmFnaS5tb3ZlX3Njb3BlIHx8IGRyYWdpLmVsLCB4IC0gZHJhZ2kuZWwuX2RyYWcueCwgeSAtIGRyYWdpLmVsLl9kcmFnLnksIHgsIHksIGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBkcmFnVXAgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICBTbmFwLnVubW91c2Vtb3ZlKGRyYWdNb3ZlKS51bm1vdXNldXAoZHJhZ1VwKTtcbiAgICAgICAgdmFyIGkgPSBkcmFnLmxlbmd0aCxcbiAgICAgICAgICAgIGRyYWdpO1xuICAgICAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgICAgICBkcmFnaSA9IGRyYWdbaV07XG4gICAgICAgICAgICBkcmFnaS5lbC5fZHJhZyA9IHt9O1xuICAgICAgICAgICAgZXZlKFwic25hcC5kcmFnLmVuZC5cIiArIGRyYWdpLmVsLmlkLCBkcmFnaS5lbmRfc2NvcGUgfHwgZHJhZ2kuc3RhcnRfc2NvcGUgfHwgZHJhZ2kubW92ZV9zY29wZSB8fCBkcmFnaS5lbCwgZSk7XG4gICAgICAgICAgICBldmUub2ZmKFwic25hcC5kcmFnLiouXCIgKyBkcmFnaS5lbC5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgZHJhZyA9IFtdO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSBjbGljayBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSBjbGljayBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZGJsY2xpY2tcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSBkb3VibGUgY2xpY2sgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bmRibGNsaWNrXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgZG91YmxlIGNsaWNrIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZWRvd25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSBtb3VzZWRvd24gZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlZG93blxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIG1vdXNlZG93biBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQubW91c2Vtb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgbW91c2Vtb3ZlIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW5tb3VzZW1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSBtb3VzZW1vdmUgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlb3V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgbW91c2VvdXQgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bm1vdXNlb3V0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgbW91c2VvdXQgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50Lm1vdXNlb3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogQWRkcyBhIG1vdXNlb3ZlciBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2VvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgbW91c2VvdmVyIGV2ZW50IGhhbmRsZXIgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICBcbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5tb3VzZXVwXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgbW91c2V1cCBldmVudCBoYW5kbGVyIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVubW91c2V1cFxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhIG1vdXNldXAgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNoc3RhcnRcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIEFkZHMgYSB0b3VjaHN0YXJ0IGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaHN0YXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgdG91Y2hzdGFydCBldmVudCBoYW5kbGVyIGZyb20gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudG91Y2htb3ZlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgdG91Y2htb3ZlIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGVsZW1lbnRcbiAgICAgLSBoYW5kbGVyIChmdW5jdGlvbikgaGFuZGxlciBmb3IgdGhlIGV2ZW50XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQudW50b3VjaG1vdmVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgYSB0b3VjaG1vdmUgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNoZW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgdG91Y2hlbmQgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNoZW5kXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgdG91Y2hlbmQgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIFxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnRvdWNoY2FuY2VsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGEgdG91Y2hjYW5jZWwgZXZlbnQgaGFuZGxlciB0byB0aGUgZWxlbWVudFxuICAgICAtIGhhbmRsZXIgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciB0aGUgZXZlbnRcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgIFxcKi9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC51bnRvdWNoY2FuY2VsXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZW1vdmVzIGEgdG91Y2hjYW5jZWwgZXZlbnQgaGFuZGxlciBmcm9tIHRoZSBlbGVtZW50XG4gICAgIC0gaGFuZGxlciAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIHRoZSBldmVudFxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGZvciAodmFyIGkgPSBldmVudHMubGVuZ3RoOyBpLS07KSB7XG4gICAgICAgIChmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgICAgICBTbmFwW2V2ZW50TmFtZV0gPSBlbHByb3RvW2V2ZW50TmFtZV0gPSBmdW5jdGlvbiAoZm4sIHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgaWYgKFNuYXAuaXMoZm4sIFwiZnVuY3Rpb25cIikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMgPSB0aGlzLmV2ZW50cyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBldmVudE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBmOiBmbixcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuYmluZDogYWRkRXZlbnQodGhpcy5ub2RlIHx8IGRvY3VtZW50LCBldmVudE5hbWUsIGZuLCBzY29wZSB8fCB0aGlzKVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSB0aGlzLmV2ZW50cy5sZW5ndGg7IGkgPCBpaTsgaSsrKSBpZiAodGhpcy5ldmVudHNbaV0ubmFtZSA9PSBldmVudE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHNbaV0uZi5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBTbmFwW1widW5cIiArIGV2ZW50TmFtZV0gPVxuICAgICAgICAgICAgZWxwcm90b1tcInVuXCIgKyBldmVudE5hbWVdID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50cyA9IHRoaXMuZXZlbnRzIHx8IFtdLFxuICAgICAgICAgICAgICAgICAgICBsID0gZXZlbnRzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB3aGlsZSAobC0tKSBpZiAoZXZlbnRzW2xdLm5hbWUgPT0gZXZlbnROYW1lICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGV2ZW50c1tsXS5mID09IGZuIHx8ICFmbikpIHtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRzW2xdLnVuYmluZCgpO1xuICAgICAgICAgICAgICAgICAgICBldmVudHMuc3BsaWNlKGwsIDEpO1xuICAgICAgICAgICAgICAgICAgICAhZXZlbnRzLmxlbmd0aCAmJiBkZWxldGUgdGhpcy5ldmVudHM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKGV2ZW50c1tpXSk7XG4gICAgfVxuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmhvdmVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGhvdmVyIGV2ZW50IGhhbmRsZXJzIHRvIHRoZSBlbGVtZW50XG4gICAgIC0gZl9pbiAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGhvdmVyIGluXG4gICAgIC0gZl9vdXQgKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBvdXRcbiAgICAgLSBpY29udGV4dCAob2JqZWN0KSAjb3B0aW9uYWwgY29udGV4dCBmb3IgaG92ZXIgaW4gaGFuZGxlclxuICAgICAtIG9jb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBob3ZlciBvdXQgaGFuZGxlclxuICAgICA9IChvYmplY3QpIEBFbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8uaG92ZXIgPSBmdW5jdGlvbiAoZl9pbiwgZl9vdXQsIHNjb3BlX2luLCBzY29wZV9vdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW91c2VvdmVyKGZfaW4sIHNjb3BlX2luKS5tb3VzZW91dChmX291dCwgc2NvcGVfb3V0IHx8IHNjb3BlX2luKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuaG92ZXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJlbW92ZXMgaG92ZXIgZXZlbnQgaGFuZGxlcnMgZnJvbSB0aGUgZWxlbWVudFxuICAgICAtIGZfaW4gKGZ1bmN0aW9uKSBoYW5kbGVyIGZvciBob3ZlciBpblxuICAgICAtIGZfb3V0IChmdW5jdGlvbikgaGFuZGxlciBmb3IgaG92ZXIgb3V0XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by51bmhvdmVyID0gZnVuY3Rpb24gKGZfaW4sIGZfb3V0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnVubW91c2VvdmVyKGZfaW4pLnVubW91c2VvdXQoZl9vdXQpO1xuICAgIH07XG4gICAgdmFyIGRyYWdnYWJsZSA9IFtdO1xuICAgIC8vIFNJRVJSQSB1bmNsZWFyIHdoYXQgX2NvbnRleHRfIHJlZmVycyB0byBmb3Igc3RhcnRpbmcsIGVuZGluZywgbW92aW5nIHRoZSBkcmFnIGdlc3R1cmUuXG4gICAgLy8gU0lFUlJBIEVsZW1lbnQuZHJhZygpOiBfeCBwb3NpdGlvbiBvZiB0aGUgbW91c2VfOiBXaGVyZSBhcmUgdGhlIHgveSB2YWx1ZXMgb2Zmc2V0IGZyb20/XG4gICAgLy8gU0lFUlJBIEVsZW1lbnQuZHJhZygpOiBtdWNoIG9mIHRoaXMgbWVtYmVyJ3MgZG9jIGFwcGVhcnMgdG8gYmUgZHVwbGljYXRlZCBmb3Igc29tZSByZWFzb24uXG4gICAgLy8gU0lFUlJBIFVuY2xlYXIgYWJvdXQgdGhpcyBzZW50ZW5jZTogX0FkZGl0aW9uYWxseSBmb2xsb3dpbmcgZHJhZyBldmVudHMgd2lsbCBiZSB0cmlnZ2VyZWQ6IGRyYWcuc3RhcnQuPGlkPiBvbiBzdGFydCwgZHJhZy5lbmQuPGlkPiBvbiBlbmQgYW5kIGRyYWcubW92ZS48aWQ+IG9uIGV2ZXJ5IG1vdmUuXyBJcyB0aGVyZSBhIGdsb2JhbCBfZHJhZ18gb2JqZWN0IHRvIHdoaWNoIHlvdSBjYW4gYXNzaWduIGhhbmRsZXJzIGtleWVkIGJ5IGFuIGVsZW1lbnQncyBJRD9cbiAgICAvKlxcXG4gICAgICogRWxlbWVudC5kcmFnXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBhbiBlbGVtZW50J3MgZHJhZyBnZXN0dXJlXG4gICAgICoqXG4gICAgIC0gb25tb3ZlIChmdW5jdGlvbikgaGFuZGxlciBmb3IgbW92aW5nXG4gICAgIC0gb25zdGFydCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGRyYWcgc3RhcnRcbiAgICAgLSBvbmVuZCAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGRyYWcgZW5kXG4gICAgIC0gbWNvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIG1vdmluZyBoYW5kbGVyXG4gICAgIC0gc2NvbnRleHQgKG9iamVjdCkgI29wdGlvbmFsIGNvbnRleHQgZm9yIGRyYWcgc3RhcnQgaGFuZGxlclxuICAgICAtIGVjb250ZXh0IChvYmplY3QpICNvcHRpb25hbCBjb250ZXh0IGZvciBkcmFnIGVuZCBoYW5kbGVyXG4gICAgICogQWRkaXRpb25hbHkgZm9sbG93aW5nIGBkcmFnYCBldmVudHMgYXJlIHRyaWdnZXJlZDogYGRyYWcuc3RhcnQuPGlkPmAgb24gc3RhcnQsIFxuICAgICAqIGBkcmFnLmVuZC48aWQ+YCBvbiBlbmQgYW5kIGBkcmFnLm1vdmUuPGlkPmAgb24gZXZlcnkgbW92ZS4gV2hlbiBlbGVtZW50IGlzIGRyYWdnZWQgb3ZlciBhbm90aGVyIGVsZW1lbnQgXG4gICAgICogYGRyYWcub3Zlci48aWQ+YCBmaXJlcyBhcyB3ZWxsLlxuICAgICAqXG4gICAgICogU3RhcnQgZXZlbnQgYW5kIHN0YXJ0IGhhbmRsZXIgYXJlIGNhbGxlZCBpbiBzcGVjaWZpZWQgY29udGV4dCBvciBpbiBjb250ZXh0IG9mIHRoZSBlbGVtZW50IHdpdGggZm9sbG93aW5nIHBhcmFtZXRlcnM6XG4gICAgIG8geCAobnVtYmVyKSB4IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIHkgKG51bWJlcikgeSBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyBldmVudCAob2JqZWN0KSBET00gZXZlbnQgb2JqZWN0XG4gICAgICogTW92ZSBldmVudCBhbmQgbW92ZSBoYW5kbGVyIGFyZSBjYWxsZWQgaW4gc3BlY2lmaWVkIGNvbnRleHQgb3IgaW4gY29udGV4dCBvZiB0aGUgZWxlbWVudCB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuICAgICBvIGR4IChudW1iZXIpIHNoaWZ0IGJ5IHggZnJvbSB0aGUgc3RhcnQgcG9pbnRcbiAgICAgbyBkeSAobnVtYmVyKSBzaGlmdCBieSB5IGZyb20gdGhlIHN0YXJ0IHBvaW50XG4gICAgIG8geCAobnVtYmVyKSB4IHBvc2l0aW9uIG9mIHRoZSBtb3VzZVxuICAgICBvIHkgKG51bWJlcikgeSBwb3NpdGlvbiBvZiB0aGUgbW91c2VcbiAgICAgbyBldmVudCAob2JqZWN0KSBET00gZXZlbnQgb2JqZWN0XG4gICAgICogRW5kIGV2ZW50IGFuZCBlbmQgaGFuZGxlciBhcmUgY2FsbGVkIGluIHNwZWNpZmllZCBjb250ZXh0IG9yIGluIGNvbnRleHQgb2YgdGhlIGVsZW1lbnQgd2l0aCBmb2xsb3dpbmcgcGFyYW1ldGVyczpcbiAgICAgbyBldmVudCAob2JqZWN0KSBET00gZXZlbnQgb2JqZWN0XG4gICAgID0gKG9iamVjdCkgQEVsZW1lbnRcbiAgICBcXCovXG4gICAgZWxwcm90by5kcmFnID0gZnVuY3Rpb24gKG9ubW92ZSwgb25zdGFydCwgb25lbmQsIG1vdmVfc2NvcGUsIHN0YXJ0X3Njb3BlLCBlbmRfc2NvcGUpIHtcbiAgICAgICAgdmFyIGVsID0gdGhpcztcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgb3JpZ1RyYW5zZm9ybTtcbiAgICAgICAgICAgIHJldHVybiBlbC5kcmFnKGZ1bmN0aW9uIChkeCwgZHkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF0dHIoe1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IG9yaWdUcmFuc2Zvcm0gKyAob3JpZ1RyYW5zZm9ybSA/IFwiVFwiIDogXCJ0XCIpICsgW2R4LCBkeV1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBvcmlnVHJhbnNmb3JtID0gdGhpcy50cmFuc2Zvcm0oKS5sb2NhbDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHN0YXJ0KGUsIHgsIHkpIHtcbiAgICAgICAgICAgIChlLm9yaWdpbmFsRXZlbnQgfHwgZSkucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGVsLl9kcmFnLnggPSB4O1xuICAgICAgICAgICAgZWwuX2RyYWcueSA9IHk7XG4gICAgICAgICAgICBlbC5fZHJhZy5pZCA9IGUuaWRlbnRpZmllcjtcbiAgICAgICAgICAgICFkcmFnLmxlbmd0aCAmJiBTbmFwLm1vdXNlbW92ZShkcmFnTW92ZSkubW91c2V1cChkcmFnVXApO1xuICAgICAgICAgICAgZHJhZy5wdXNoKHtlbDogZWwsIG1vdmVfc2NvcGU6IG1vdmVfc2NvcGUsIHN0YXJ0X3Njb3BlOiBzdGFydF9zY29wZSwgZW5kX3Njb3BlOiBlbmRfc2NvcGV9KTtcbiAgICAgICAgICAgIG9uc3RhcnQgJiYgZXZlLm9uKFwic25hcC5kcmFnLnN0YXJ0LlwiICsgZWwuaWQsIG9uc3RhcnQpO1xuICAgICAgICAgICAgb25tb3ZlICYmIGV2ZS5vbihcInNuYXAuZHJhZy5tb3ZlLlwiICsgZWwuaWQsIG9ubW92ZSk7XG4gICAgICAgICAgICBvbmVuZCAmJiBldmUub24oXCJzbmFwLmRyYWcuZW5kLlwiICsgZWwuaWQsIG9uZW5kKTtcbiAgICAgICAgICAgIGV2ZShcInNuYXAuZHJhZy5zdGFydC5cIiArIGVsLmlkLCBzdGFydF9zY29wZSB8fCBtb3ZlX3Njb3BlIHx8IGVsLCB4LCB5LCBlKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBpbml0KGUsIHgsIHkpIHtcbiAgICAgICAgICAgIGV2ZShcInNuYXAuZHJhZ2luaXQuXCIgKyBlbC5pZCwgZWwsIGUsIHgsIHkpO1xuICAgICAgICB9XG4gICAgICAgIGV2ZS5vbihcInNuYXAuZHJhZ2luaXQuXCIgKyBlbC5pZCwgc3RhcnQpO1xuICAgICAgICBlbC5fZHJhZyA9IHt9O1xuICAgICAgICBkcmFnZ2FibGUucHVzaCh7ZWw6IGVsLCBzdGFydDogc3RhcnQsIGluaXQ6IGluaXR9KTtcbiAgICAgICAgZWwubW91c2Vkb3duKGluaXQpO1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcbiAgICAvKlxuICAgICAqIEVsZW1lbnQub25EcmFnT3ZlclxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogU2hvcnRjdXQgdG8gYXNzaWduIGV2ZW50IGhhbmRsZXIgZm9yIGBkcmFnLm92ZXIuPGlkPmAgZXZlbnQsIHdoZXJlIGBpZGAgaXMgdGhlIGVsZW1lbnQncyBgaWRgIChzZWUgQEVsZW1lbnQuaWQpXG4gICAgIC0gZiAoZnVuY3Rpb24pIGhhbmRsZXIgZm9yIGV2ZW50LCBmaXJzdCBhcmd1bWVudCB3b3VsZCBiZSB0aGUgZWxlbWVudCB5b3UgYXJlIGRyYWdnaW5nIG92ZXJcbiAgICBcXCovXG4gICAgLy8gZWxwcm90by5vbkRyYWdPdmVyID0gZnVuY3Rpb24gKGYpIHtcbiAgICAvLyAgICAgZiA/IGV2ZS5vbihcInNuYXAuZHJhZy5vdmVyLlwiICsgdGhpcy5pZCwgZikgOiBldmUudW5iaW5kKFwic25hcC5kcmFnLm92ZXIuXCIgKyB0aGlzLmlkKTtcbiAgICAvLyB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LnVuZHJhZ1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmVtb3ZlcyBhbGwgZHJhZyBldmVudCBoYW5kbGVycyBmcm9tIHRoZSBnaXZlbiBlbGVtZW50XG4gICAgXFwqL1xuICAgIGVscHJvdG8udW5kcmFnID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaSA9IGRyYWdnYWJsZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChpLS0pIGlmIChkcmFnZ2FibGVbaV0uZWwgPT0gdGhpcykge1xuICAgICAgICAgICAgdGhpcy51bm1vdXNlZG93bihkcmFnZ2FibGVbaV0uaW5pdCk7XG4gICAgICAgICAgICBkcmFnZ2FibGUuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgZXZlLnVuYmluZChcInNuYXAuZHJhZy4qLlwiICsgdGhpcy5pZCk7XG4gICAgICAgICAgICBldmUudW5iaW5kKFwic25hcC5kcmFnaW5pdC5cIiArIHRoaXMuaWQpO1xuICAgICAgICB9XG4gICAgICAgICFkcmFnZ2FibGUubGVuZ3RoICYmIFNuYXAudW5tb3VzZW1vdmUoZHJhZ01vdmUpLnVubW91c2V1cChkcmFnVXApO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xufSk7XG5cbi8vIENvcHlyaWdodCAoYykgMjAxMyBBZG9iZSBTeXN0ZW1zIEluY29ycG9yYXRlZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIFxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8gXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vIFxuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblNuYXAucGx1Z2luKGZ1bmN0aW9uIChTbmFwLCBFbGVtZW50LCBQYXBlciwgZ2xvYikge1xuICAgIHZhciBlbHByb3RvID0gRWxlbWVudC5wcm90b3R5cGUsXG4gICAgICAgIHBwcm90byA9IFBhcGVyLnByb3RvdHlwZSxcbiAgICAgICAgcmd1cmwgPSAvXlxccyp1cmxcXCgoLispXFwpLyxcbiAgICAgICAgU3RyID0gU3RyaW5nLFxuICAgICAgICAkID0gU25hcC5fLiQ7XG4gICAgU25hcC5maWx0ZXIgPSB7fTtcbiAgICAvKlxcXG4gICAgICogUGFwZXIuZmlsdGVyXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBDcmVhdGVzIGEgYDxmaWx0ZXI+YCBlbGVtZW50XG4gICAgICoqXG4gICAgIC0gZmlsc3RyIChzdHJpbmcpIFNWRyBmcmFnbWVudCBvZiBmaWx0ZXIgcHJvdmlkZWQgYXMgYSBzdHJpbmdcbiAgICAgPSAob2JqZWN0KSBARWxlbWVudFxuICAgICAqIE5vdGU6IEl0IGlzIHJlY29tbWVuZGVkIHRvIHVzZSBmaWx0ZXJzIGVtYmVkZGVkIGludG8gdGhlIHBhZ2UgaW5zaWRlIGFuIGVtcHR5IFNWRyBlbGVtZW50LlxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGYgPSBwYXBlci5maWx0ZXIoJzxmZUdhdXNzaWFuQmx1ciBzdGREZXZpYXRpb249XCIyXCIvPicpLFxuICAgICB8ICAgICBjID0gcGFwZXIuY2lyY2xlKDEwLCAxMCwgMTApLmF0dHIoe1xuICAgICB8ICAgICAgICAgZmlsdGVyOiBmXG4gICAgIHwgICAgIH0pO1xuICAgIFxcKi9cbiAgICBwcHJvdG8uZmlsdGVyID0gZnVuY3Rpb24gKGZpbHN0cikge1xuICAgICAgICB2YXIgcGFwZXIgPSB0aGlzO1xuICAgICAgICBpZiAocGFwZXIudHlwZSAhPSBcInN2Z1wiKSB7XG4gICAgICAgICAgICBwYXBlciA9IHBhcGVyLnBhcGVyO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmID0gU25hcC5wYXJzZShTdHIoZmlsc3RyKSksXG4gICAgICAgICAgICBpZCA9IFNuYXAuXy5pZCgpLFxuICAgICAgICAgICAgd2lkdGggPSBwYXBlci5ub2RlLm9mZnNldFdpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0ID0gcGFwZXIubm9kZS5vZmZzZXRIZWlnaHQsXG4gICAgICAgICAgICBmaWx0ZXIgPSAkKFwiZmlsdGVyXCIpO1xuICAgICAgICAkKGZpbHRlciwge1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgZmlsdGVyVW5pdHM6IFwidXNlclNwYWNlT25Vc2VcIlxuICAgICAgICB9KTtcbiAgICAgICAgZmlsdGVyLmFwcGVuZENoaWxkKGYubm9kZSk7XG4gICAgICAgIHBhcGVyLmRlZnMuYXBwZW5kQ2hpbGQoZmlsdGVyKTtcbiAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50KGZpbHRlcik7XG4gICAgfTtcbiAgICBcbiAgICBldmUub24oXCJzbmFwLnV0aWwuZ2V0YXR0ci5maWx0ZXJcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBldmUuc3RvcCgpO1xuICAgICAgICB2YXIgcCA9ICQodGhpcy5ub2RlLCBcImZpbHRlclwiKTtcbiAgICAgICAgaWYgKHApIHtcbiAgICAgICAgICAgIHZhciBtYXRjaCA9IFN0cihwKS5tYXRjaChyZ3VybCk7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2ggJiYgU25hcC5zZWxlY3QobWF0Y2hbMV0pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgZXZlLm9uKFwic25hcC51dGlsLmF0dHIuZmlsdGVyXCIsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBFbGVtZW50ICYmIHZhbHVlLnR5cGUgPT0gXCJmaWx0ZXJcIikge1xuICAgICAgICAgICAgZXZlLnN0b3AoKTtcbiAgICAgICAgICAgIHZhciBpZCA9IHZhbHVlLm5vZGUuaWQ7XG4gICAgICAgICAgICBpZiAoIWlkKSB7XG4gICAgICAgICAgICAgICAgJCh2YWx1ZS5ub2RlLCB7aWQ6IHZhbHVlLmlkfSk7XG4gICAgICAgICAgICAgICAgaWQgPSB2YWx1ZS5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQodGhpcy5ub2RlLCB7XG4gICAgICAgICAgICAgICAgZmlsdGVyOiBTbmFwLnVybChpZClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdmFsdWUgfHwgdmFsdWUgPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgIGV2ZS5zdG9wKCk7XG4gICAgICAgICAgICB0aGlzLm5vZGUucmVtb3ZlQXR0cmlidXRlKFwiZmlsdGVyXCIpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLmJsdXJcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBibHVyIGZpbHRlclxuICAgICAqKlxuICAgICAtIHggKG51bWJlcikgYW1vdW50IG9mIGhvcml6b250YWwgYmx1ciwgaW4gcGl4ZWxzXG4gICAgIC0geSAobnVtYmVyKSAjb3B0aW9uYWwgYW1vdW50IG9mIHZlcnRpY2FsIGJsdXIsIGluIHBpeGVsc1xuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgICA+IFVzYWdlXG4gICAgIHwgdmFyIGYgPSBwYXBlci5maWx0ZXIoU25hcC5maWx0ZXIuYmx1cig1LCAxMCkpLFxuICAgICB8ICAgICBjID0gcGFwZXIuY2lyY2xlKDEwLCAxMCwgMTApLmF0dHIoe1xuICAgICB8ICAgICAgICAgZmlsdGVyOiBmXG4gICAgIHwgICAgIH0pO1xuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5ibHVyID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgICAgICAgeCA9IDI7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRlZiA9IHkgPT0gbnVsbCA/IHggOiBbeCwgeV07XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnXFw8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPVwie2RlZn1cIi8+Jywge1xuICAgICAgICAgICAgZGVmOiBkZWZcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5ibHVyLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLnNoYWRvd1xuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIHNoYWRvdyBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBkeCAobnVtYmVyKSAjb3B0aW9uYWwgaG9yaXpvbnRhbCBzaGlmdCBvZiB0aGUgc2hhZG93LCBpbiBwaXhlbHNcbiAgICAgLSBkeSAobnVtYmVyKSAjb3B0aW9uYWwgdmVydGljYWwgc2hpZnQgb2YgdGhlIHNoYWRvdywgaW4gcGl4ZWxzXG4gICAgIC0gYmx1ciAobnVtYmVyKSAjb3B0aW9uYWwgYW1vdW50IG9mIGJsdXJcbiAgICAgLSBjb2xvciAoc3RyaW5nKSAjb3B0aW9uYWwgY29sb3Igb2YgdGhlIHNoYWRvd1xuICAgICAtIG9wYWNpdHkgKG51bWJlcikgI29wdGlvbmFsIGAwLi4xYCBvcGFjaXR5IG9mIHRoZSBzaGFkb3dcbiAgICAgKiBvclxuICAgICAtIGR4IChudW1iZXIpICNvcHRpb25hbCBob3Jpem9udGFsIHNoaWZ0IG9mIHRoZSBzaGFkb3csIGluIHBpeGVsc1xuICAgICAtIGR5IChudW1iZXIpICNvcHRpb25hbCB2ZXJ0aWNhbCBzaGlmdCBvZiB0aGUgc2hhZG93LCBpbiBwaXhlbHNcbiAgICAgLSBjb2xvciAoc3RyaW5nKSAjb3B0aW9uYWwgY29sb3Igb2YgdGhlIHNoYWRvd1xuICAgICAtIG9wYWNpdHkgKG51bWJlcikgI29wdGlvbmFsIGAwLi4xYCBvcGFjaXR5IG9mIHRoZSBzaGFkb3dcbiAgICAgKiB3aGljaCBtYWtlcyBibHVyIGRlZmF1bHQgdG8gYDRgLiBPclxuICAgICAtIGR4IChudW1iZXIpICNvcHRpb25hbCBob3Jpem9udGFsIHNoaWZ0IG9mIHRoZSBzaGFkb3csIGluIHBpeGVsc1xuICAgICAtIGR5IChudW1iZXIpICNvcHRpb25hbCB2ZXJ0aWNhbCBzaGlmdCBvZiB0aGUgc2hhZG93LCBpbiBwaXhlbHNcbiAgICAgLSBvcGFjaXR5IChudW1iZXIpICNvcHRpb25hbCBgMC4uMWAgb3BhY2l0eSBvZiB0aGUgc2hhZG93XG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgID4gVXNhZ2VcbiAgICAgfCB2YXIgZiA9IHBhcGVyLmZpbHRlcihTbmFwLmZpbHRlci5zaGFkb3coMCwgMiwgMykpLFxuICAgICB8ICAgICBjID0gcGFwZXIuY2lyY2xlKDEwLCAxMCwgMTApLmF0dHIoe1xuICAgICB8ICAgICAgICAgZmlsdGVyOiBmXG4gICAgIHwgICAgIH0pO1xuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5zaGFkb3cgPSBmdW5jdGlvbiAoZHgsIGR5LCBibHVyLCBjb2xvciwgb3BhY2l0eSkge1xuICAgICAgICBpZiAodHlwZW9mIGJsdXIgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgY29sb3IgPSBibHVyO1xuICAgICAgICAgICAgb3BhY2l0eSA9IGNvbG9yO1xuICAgICAgICAgICAgYmx1ciA9IDQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBjb2xvciAhPSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBvcGFjaXR5ID0gY29sb3I7XG4gICAgICAgICAgICBjb2xvciA9IFwiIzAwMFwiO1xuICAgICAgICB9XG4gICAgICAgIGNvbG9yID0gY29sb3IgfHwgXCIjMDAwXCI7XG4gICAgICAgIGlmIChibHVyID09IG51bGwpIHtcbiAgICAgICAgICAgIGJsdXIgPSA0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcGFjaXR5ID09IG51bGwpIHtcbiAgICAgICAgICAgIG9wYWNpdHkgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkeCA9PSBudWxsKSB7XG4gICAgICAgICAgICBkeCA9IDA7XG4gICAgICAgICAgICBkeSA9IDI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGR5ID09IG51bGwpIHtcbiAgICAgICAgICAgIGR5ID0gZHg7XG4gICAgICAgIH1cbiAgICAgICAgY29sb3IgPSBTbmFwLmNvbG9yKGNvbG9yKTtcbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVHYXVzc2lhbkJsdXIgaW49XCJTb3VyY2VBbHBoYVwiIHN0ZERldmlhdGlvbj1cIntibHVyfVwiLz48ZmVPZmZzZXQgZHg9XCJ7ZHh9XCIgZHk9XCJ7ZHl9XCIgcmVzdWx0PVwib2Zmc2V0Ymx1clwiLz48ZmVGbG9vZCBmbG9vZC1jb2xvcj1cIntjb2xvcn1cIi8+PGZlQ29tcG9zaXRlIGluMj1cIm9mZnNldGJsdXJcIiBvcGVyYXRvcj1cImluXCIvPjxmZUNvbXBvbmVudFRyYW5zZmVyPjxmZUZ1bmNBIHR5cGU9XCJsaW5lYXJcIiBzbG9wZT1cIntvcGFjaXR5fVwiLz48L2ZlQ29tcG9uZW50VHJhbnNmZXI+PGZlTWVyZ2U+PGZlTWVyZ2VOb2RlLz48ZmVNZXJnZU5vZGUgaW49XCJTb3VyY2VHcmFwaGljXCIvPjwvZmVNZXJnZT4nLCB7XG4gICAgICAgICAgICBjb2xvcjogY29sb3IsXG4gICAgICAgICAgICBkeDogZHgsXG4gICAgICAgICAgICBkeTogZHksXG4gICAgICAgICAgICBibHVyOiBibHVyLFxuICAgICAgICAgICAgb3BhY2l0eTogb3BhY2l0eVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLnNoYWRvdy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5ncmF5c2NhbGVcbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgYW4gU1ZHIG1hcmt1cCBzdHJpbmcgZm9yIHRoZSBncmF5c2NhbGUgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gYW1vdW50IChudW1iZXIpIGFtb3VudCBvZiBmaWx0ZXIgKGAwLi4xYClcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuZ3JheXNjYWxlID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIGFtb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVDb2xvck1hdHJpeCB0eXBlPVwibWF0cml4XCIgdmFsdWVzPVwie2F9IHtifSB7Y30gMCAwIHtkfSB7ZX0ge2Z9IDAgMCB7Z30ge2J9IHtofSAwIDAgMCAwIDAgMSAwXCIvPicsIHtcbiAgICAgICAgICAgIGE6IDAuMjEyNiArIDAuNzg3NCAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGI6IDAuNzE1MiAtIDAuNzE1MiAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGM6IDAuMDcyMiAtIDAuMDcyMiAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGQ6IDAuMjEyNiAtIDAuMjEyNiAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGU6IDAuNzE1MiArIDAuMjg0OCAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGY6IDAuMDcyMiAtIDAuMDcyMiAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGc6IDAuMjEyNiAtIDAuMjEyNiAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGg6IDAuMDcyMiArIDAuOTI3OCAqICgxIC0gYW1vdW50KVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLmdyYXlzY2FsZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5zZXBpYVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIHNlcGlhIGZpbHRlclxuICAgICAqKlxuICAgICAtIGFtb3VudCAobnVtYmVyKSBhbW91bnQgb2YgZmlsdGVyIChgMC4uMWApXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLnNlcGlhID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIGFtb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVDb2xvck1hdHJpeCB0eXBlPVwibWF0cml4XCIgdmFsdWVzPVwie2F9IHtifSB7Y30gMCAwIHtkfSB7ZX0ge2Z9IDAgMCB7Z30ge2h9IHtpfSAwIDAgMCAwIDAgMSAwXCIvPicsIHtcbiAgICAgICAgICAgIGE6IDAuMzkzICsgMC42MDcgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBiOiAwLjc2OSAtIDAuNzY5ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgYzogMC4xODkgLSAwLjE4OSAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGQ6IDAuMzQ5IC0gMC4zNDkgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBlOiAwLjY4NiArIDAuMzE0ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgZjogMC4xNjggLSAwLjE2OCAqICgxIC0gYW1vdW50KSxcbiAgICAgICAgICAgIGc6IDAuMjcyIC0gMC4yNzIgKiAoMSAtIGFtb3VudCksXG4gICAgICAgICAgICBoOiAwLjUzNCAtIDAuNTM0ICogKDEgLSBhbW91bnQpLFxuICAgICAgICAgICAgaTogMC4xMzEgKyAwLjg2OSAqICgxIC0gYW1vdW50KVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLnNlcGlhLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLnNhdHVyYXRlXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgc2F0dXJhdGUgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gYW1vdW50IChudW1iZXIpIGFtb3VudCBvZiBmaWx0ZXIgKGAwLi4xYClcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuc2F0dXJhdGUgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUNvbG9yTWF0cml4IHR5cGU9XCJzYXR1cmF0ZVwiIHZhbHVlcz1cInthbW91bnR9XCIvPicsIHtcbiAgICAgICAgICAgIGFtb3VudDogMSAtIGFtb3VudFxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLnNhdHVyYXRlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLmh1ZVJvdGF0ZVxuICAgICBbIG1ldGhvZCBdXG4gICAgICoqXG4gICAgICogUmV0dXJucyBhbiBTVkcgbWFya3VwIHN0cmluZyBmb3IgdGhlIGh1ZS1yb3RhdGUgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gYW5nbGUgKG51bWJlcikgYW5nbGUgb2Ygcm90YXRpb25cbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuaHVlUm90YXRlID0gZnVuY3Rpb24gKGFuZ2xlKSB7XG4gICAgICAgIGFuZ2xlID0gYW5nbGUgfHwgMDtcbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVDb2xvck1hdHJpeCB0eXBlPVwiaHVlUm90YXRlXCIgdmFsdWVzPVwie2FuZ2xlfVwiLz4nLCB7XG4gICAgICAgICAgICBhbmdsZTogYW5nbGVcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5odWVSb3RhdGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzKCk7XG4gICAgfTtcbiAgICAvKlxcXG4gICAgICogU25hcC5maWx0ZXIuaW52ZXJ0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgaW52ZXJ0IGZpbHRlclxuICAgICAqKlxuICAgICAtIGFtb3VudCAobnVtYmVyKSBhbW91bnQgb2YgZmlsdGVyIChgMC4uMWApXG4gICAgID0gKHN0cmluZykgZmlsdGVyIHJlcHJlc2VudGF0aW9uXG4gICAgXFwqL1xuICAgIFNuYXAuZmlsdGVyLmludmVydCA9IGZ1bmN0aW9uIChhbW91bnQpIHtcbiAgICAgICAgaWYgKGFtb3VudCA9PSBudWxsKSB7XG4gICAgICAgICAgICBhbW91bnQgPSAxO1xuICAgICAgICB9XG4vLyAgICAgICAgPGZlQ29sb3JNYXRyaXggdHlwZT1cIm1hdHJpeFwiIHZhbHVlcz1cIi0xIDAgMCAwIDEgIDAgLTEgMCAwIDEgIDAgMCAtMSAwIDEgIDAgMCAwIDEgMFwiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz1cInNSR0JcIi8+XG4gICAgICAgIHJldHVybiBTbmFwLmZvcm1hdCgnPGZlQ29tcG9uZW50VHJhbnNmZXI+PGZlRnVuY1IgdHlwZT1cInRhYmxlXCIgdGFibGVWYWx1ZXM9XCJ7YW1vdW50fSB7YW1vdW50Mn1cIi8+PGZlRnVuY0cgdHlwZT1cInRhYmxlXCIgdGFibGVWYWx1ZXM9XCJ7YW1vdW50fSB7YW1vdW50Mn1cIi8+PGZlRnVuY0IgdHlwZT1cInRhYmxlXCIgdGFibGVWYWx1ZXM9XCJ7YW1vdW50fSB7YW1vdW50Mn1cIi8+PC9mZUNvbXBvbmVudFRyYW5zZmVyPicsIHtcbiAgICAgICAgICAgIGFtb3VudDogYW1vdW50LFxuICAgICAgICAgICAgYW1vdW50MjogMSAtIGFtb3VudFxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLmludmVydC50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMoKTtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBTbmFwLmZpbHRlci5icmlnaHRuZXNzXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgYnJpZ2h0bmVzcyBmaWx0ZXJcbiAgICAgKipcbiAgICAgLSBhbW91bnQgKG51bWJlcikgYW1vdW50IG9mIGZpbHRlciAoYDAuLjFgKVxuICAgICA9IChzdHJpbmcpIGZpbHRlciByZXByZXNlbnRhdGlvblxuICAgIFxcKi9cbiAgICBTbmFwLmZpbHRlci5icmlnaHRuZXNzID0gZnVuY3Rpb24gKGFtb3VudCkge1xuICAgICAgICBpZiAoYW1vdW50ID09IG51bGwpIHtcbiAgICAgICAgICAgIGFtb3VudCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNuYXAuZm9ybWF0KCc8ZmVDb21wb25lbnRUcmFuc2Zlcj48ZmVGdW5jUiB0eXBlPVwibGluZWFyXCIgc2xvcGU9XCJ7YW1vdW50fVwiLz48ZmVGdW5jRyB0eXBlPVwibGluZWFyXCIgc2xvcGU9XCJ7YW1vdW50fVwiLz48ZmVGdW5jQiB0eXBlPVwibGluZWFyXCIgc2xvcGU9XCJ7YW1vdW50fVwiLz48L2ZlQ29tcG9uZW50VHJhbnNmZXI+Jywge1xuICAgICAgICAgICAgYW1vdW50OiBhbW91bnRcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBTbmFwLmZpbHRlci5icmlnaHRuZXNzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG4gICAgLypcXFxuICAgICAqIFNuYXAuZmlsdGVyLmNvbnRyYXN0XG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBSZXR1cm5zIGFuIFNWRyBtYXJrdXAgc3RyaW5nIGZvciB0aGUgY29udHJhc3QgZmlsdGVyXG4gICAgICoqXG4gICAgIC0gYW1vdW50IChudW1iZXIpIGFtb3VudCBvZiBmaWx0ZXIgKGAwLi4xYClcbiAgICAgPSAoc3RyaW5nKSBmaWx0ZXIgcmVwcmVzZW50YXRpb25cbiAgICBcXCovXG4gICAgU25hcC5maWx0ZXIuY29udHJhc3QgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG4gICAgICAgIGlmIChhbW91bnQgPT0gbnVsbCkge1xuICAgICAgICAgICAgYW1vdW50ID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU25hcC5mb3JtYXQoJzxmZUNvbXBvbmVudFRyYW5zZmVyPjxmZUZ1bmNSIHR5cGU9XCJsaW5lYXJcIiBzbG9wZT1cInthbW91bnR9XCIgaW50ZXJjZXB0PVwie2Ftb3VudDJ9XCIvPjxmZUZ1bmNHIHR5cGU9XCJsaW5lYXJcIiBzbG9wZT1cInthbW91bnR9XCIgaW50ZXJjZXB0PVwie2Ftb3VudDJ9XCIvPjxmZUZ1bmNCIHR5cGU9XCJsaW5lYXJcIiBzbG9wZT1cInthbW91bnR9XCIgaW50ZXJjZXB0PVwie2Ftb3VudDJ9XCIvPjwvZmVDb21wb25lbnRUcmFuc2Zlcj4nLCB7XG4gICAgICAgICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgICAgICAgIGFtb3VudDI6IC41IC0gYW1vdW50IC8gMlxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNuYXAuZmlsdGVyLmNvbnRyYXN0LnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcygpO1xuICAgIH07XG59KTtcblxuLy8gQ29weXJpZ2h0IChjKSAyMDE0IEFkb2JlIFN5c3RlbXMgSW5jb3Jwb3JhdGVkLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuLy9cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vXG4vLyBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuU25hcC5wbHVnaW4oZnVuY3Rpb24gKFNuYXAsIEVsZW1lbnQsIFBhcGVyLCBnbG9iLCBGcmFnbWVudCkge1xuICAgIHZhciBib3ggPSBTbmFwLl8uYm94LFxuICAgICAgICBpcyA9IFNuYXAuaXMsXG4gICAgICAgIGZpcnN0TGV0dGVyID0gL15bXmEtel0qKFt0Ym1scmNdKS9pLFxuICAgICAgICB0b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBcIlRcIiArIHRoaXMuZHggKyBcIixcIiArIHRoaXMuZHk7XG4gICAgICAgIH07XG4gICAgLypcXFxuICAgICAqIEVsZW1lbnQuZ2V0QWxpZ25cbiAgICAgWyBtZXRob2QgXVxuICAgICAqKlxuICAgICAqIFJldHVybnMgc2hpZnQgbmVlZGVkIHRvIGFsaWduIHRoZSBlbGVtZW50IHJlbGF0aXZlbHkgdG8gZ2l2ZW4gZWxlbWVudC5cbiAgICAgKiBJZiBubyBlbGVtZW50cyBzcGVjaWZpZWQsIHBhcmVudCBgPHN2Zz5gIGNvbnRhaW5lciB3aWxsIGJlIHVzZWQuXG4gICAgIC0gZWwgKG9iamVjdCkgQG9wdGlvbmFsIGFsaWdubWVudCBlbGVtZW50XG4gICAgIC0gd2F5IChzdHJpbmcpIG9uZSBvZiBzaXggdmFsdWVzOiBgXCJ0b3BcImAsIGBcIm1pZGRsZVwiYCwgYFwiYm90dG9tXCJgLCBgXCJsZWZ0XCJgLCBgXCJjZW50ZXJcImAsIGBcInJpZ2h0XCJgXG4gICAgID0gKG9iamVjdHxzdHJpbmcpIE9iamVjdCBpbiBmb3JtYXQgYHtkeDogLCBkeTogfWAgYWxzbyBoYXMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gYXMgYSB0cmFuc2Zvcm1hdGlvbiBzdHJpbmdcbiAgICAgPiBVc2FnZVxuICAgICB8IGVsLnRyYW5zZm9ybShlbC5nZXRBbGlnbihlbDIsIFwidG9wXCIpKTtcbiAgICAgKiBvclxuICAgICB8IHZhciBkeSA9IGVsLmdldEFsaWduKGVsMiwgXCJ0b3BcIikuZHk7XG4gICAgXFwqL1xuICAgIEVsZW1lbnQucHJvdG90eXBlLmdldEFsaWduID0gZnVuY3Rpb24gKGVsLCB3YXkpIHtcbiAgICAgICAgaWYgKHdheSA9PSBudWxsICYmIGlzKGVsLCBcInN0cmluZ1wiKSkge1xuICAgICAgICAgICAgd2F5ID0gZWw7XG4gICAgICAgICAgICBlbCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWwgPSBlbCB8fCB0aGlzLnBhcGVyO1xuICAgICAgICB2YXIgYnggPSBlbC5nZXRCQm94ID8gZWwuZ2V0QkJveCgpIDogYm94KGVsKSxcbiAgICAgICAgICAgIGJiID0gdGhpcy5nZXRCQm94KCksXG4gICAgICAgICAgICBvdXQgPSB7fTtcbiAgICAgICAgd2F5ID0gd2F5ICYmIHdheS5tYXRjaChmaXJzdExldHRlcik7XG4gICAgICAgIHdheSA9IHdheSA/IHdheVsxXS50b0xvd2VyQ2FzZSgpIDogXCJjXCI7XG4gICAgICAgIHN3aXRjaCAod2F5KSB7XG4gICAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgICAgIG91dC5keCA9IDA7XG4gICAgICAgICAgICAgICAgb3V0LmR5ID0gYngueSAtIGJiLnk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJiXCI6XG4gICAgICAgICAgICAgICAgb3V0LmR4ID0gMDtcbiAgICAgICAgICAgICAgICBvdXQuZHkgPSBieC55MiAtIGJiLnkyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwibVwiOlxuICAgICAgICAgICAgICAgIG91dC5keCA9IDA7XG4gICAgICAgICAgICAgICAgb3V0LmR5ID0gYnguY3kgLSBiYi5jeTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcImxcIjpcbiAgICAgICAgICAgICAgICBvdXQuZHggPSBieC54IC0gYmIueDtcbiAgICAgICAgICAgICAgICBvdXQuZHkgPSAwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiclwiOlxuICAgICAgICAgICAgICAgIG91dC5keCA9IGJ4LngyIC0gYmIueDI7XG4gICAgICAgICAgICAgICAgb3V0LmR5ID0gMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBvdXQuZHggPSBieC5jeCAtIGJiLmN4O1xuICAgICAgICAgICAgICAgIG91dC5keSA9IDA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBvdXQudG9TdHJpbmcgPSB0b1N0cmluZztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIC8qXFxcbiAgICAgKiBFbGVtZW50LmFsaWduXG4gICAgIFsgbWV0aG9kIF1cbiAgICAgKipcbiAgICAgKiBBbGlnbnMgdGhlIGVsZW1lbnQgcmVsYXRpdmVseSB0byBnaXZlbiBvbmUgdmlhIHRyYW5zZm9ybWF0aW9uLlxuICAgICAqIElmIG5vIGVsZW1lbnRzIHNwZWNpZmllZCwgcGFyZW50IGA8c3ZnPmAgY29udGFpbmVyIHdpbGwgYmUgdXNlZC5cbiAgICAgLSBlbCAob2JqZWN0KSBAb3B0aW9uYWwgYWxpZ25tZW50IGVsZW1lbnRcbiAgICAgLSB3YXkgKHN0cmluZykgb25lIG9mIHNpeCB2YWx1ZXM6IGBcInRvcFwiYCwgYFwibWlkZGxlXCJgLCBgXCJib3R0b21cImAsIGBcImxlZnRcImAsIGBcImNlbnRlclwiYCwgYFwicmlnaHRcImBcbiAgICAgPSAob2JqZWN0KSB0aGlzIGVsZW1lbnRcbiAgICAgPiBVc2FnZVxuICAgICB8IGVsLmFsaWduKGVsMiwgXCJ0b3BcIik7XG4gICAgICogb3JcbiAgICAgfCBlbC5hbGlnbihcIm1pZGRsZVwiKTtcbiAgICBcXCovXG4gICAgRWxlbWVudC5wcm90b3R5cGUuYWxpZ24gPSBmdW5jdGlvbiAoZWwsIHdheSkge1xuICAgICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm0oXCIuLi5cIiArIHRoaXMuZ2V0QWxpZ24oZWwsIHdheSkpO1xuICAgIH07XG59KTtcblxucmV0dXJuIFNuYXA7XG59KSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=