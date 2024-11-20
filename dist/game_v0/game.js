var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/lz-string/libs/lz-string.js
var require_lz_string = __commonJS({
  "node_modules/lz-string/libs/lz-string.js"(exports, module) {
    var LZString = function() {
      var f = String.fromCharCode;
      var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
      var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
      var baseReverseDic = {};
      function getBaseValue(alphabet, character) {
        if (!baseReverseDic[alphabet]) {
          baseReverseDic[alphabet] = {};
          for (var i = 0; i < alphabet.length; i++) {
            baseReverseDic[alphabet][alphabet.charAt(i)] = i;
          }
        }
        return baseReverseDic[alphabet][character];
      }
      var LZString2 = {
        compressToBase64: function(input) {
          if (input == null)
            return "";
          var res = LZString2._compress(input, 6, function(a) {
            return keyStrBase64.charAt(a);
          });
          switch (res.length % 4) {
            default:
            case 0:
              return res;
            case 1:
              return res + "===";
            case 2:
              return res + "==";
            case 3:
              return res + "=";
          }
        },
        decompressFromBase64: function(input) {
          if (input == null)
            return "";
          if (input == "")
            return null;
          return LZString2._decompress(input.length, 32, function(index) {
            return getBaseValue(keyStrBase64, input.charAt(index));
          });
        },
        compressToUTF16: function(input) {
          if (input == null)
            return "";
          return LZString2._compress(input, 15, function(a) {
            return f(a + 32);
          }) + " ";
        },
        decompressFromUTF16: function(compressed) {
          if (compressed == null)
            return "";
          if (compressed == "")
            return null;
          return LZString2._decompress(compressed.length, 16384, function(index) {
            return compressed.charCodeAt(index) - 32;
          });
        },
        //compress into uint8array (UCS-2 big endian format)
        compressToUint8Array: function(uncompressed) {
          var compressed = LZString2.compress(uncompressed);
          var buf = new Uint8Array(compressed.length * 2);
          for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
            var current_value = compressed.charCodeAt(i);
            buf[i * 2] = current_value >>> 8;
            buf[i * 2 + 1] = current_value % 256;
          }
          return buf;
        },
        //decompress from uint8array (UCS-2 big endian format)
        decompressFromUint8Array: function(compressed) {
          if (compressed === null || compressed === void 0) {
            return LZString2.decompress(compressed);
          } else {
            var buf = new Array(compressed.length / 2);
            for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
              buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
            }
            var result = [];
            buf.forEach(function(c) {
              result.push(f(c));
            });
            return LZString2.decompress(result.join(""));
          }
        },
        //compress into a string that is already URI encoded
        compressToEncodedURIComponent: function(input) {
          if (input == null)
            return "";
          return LZString2._compress(input, 6, function(a) {
            return keyStrUriSafe.charAt(a);
          });
        },
        //decompress from an output of compressToEncodedURIComponent
        decompressFromEncodedURIComponent: function(input) {
          if (input == null)
            return "";
          if (input == "")
            return null;
          input = input.replace(/ /g, "+");
          return LZString2._decompress(input.length, 32, function(index) {
            return getBaseValue(keyStrUriSafe, input.charAt(index));
          });
        },
        compress: function(uncompressed) {
          return LZString2._compress(uncompressed, 16, function(a) {
            return f(a);
          });
        },
        _compress: function(uncompressed, bitsPerChar, getCharFromInt) {
          if (uncompressed == null)
            return "";
          var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
          for (ii = 0; ii < uncompressed.length; ii += 1) {
            context_c = uncompressed.charAt(ii);
            if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
              context_dictionary[context_c] = context_dictSize++;
              context_dictionaryToCreate[context_c] = true;
            }
            context_wc = context_w + context_c;
            if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
              context_w = context_wc;
            } else {
              if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                if (context_w.charCodeAt(0) < 256) {
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 8; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                } else {
                  value = 1;
                  for (i = 0; i < context_numBits; i++) {
                    context_data_val = context_data_val << 1 | value;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = 0;
                  }
                  value = context_w.charCodeAt(0);
                  for (i = 0; i < 16; i++) {
                    context_data_val = context_data_val << 1 | value & 1;
                    if (context_data_position == bitsPerChar - 1) {
                      context_data_position = 0;
                      context_data.push(getCharFromInt(context_data_val));
                      context_data_val = 0;
                    } else {
                      context_data_position++;
                    }
                    value = value >> 1;
                  }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                  context_enlargeIn = Math.pow(2, context_numBits);
                  context_numBits++;
                }
                delete context_dictionaryToCreate[context_w];
              } else {
                value = context_dictionary[context_w];
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              context_dictionary[context_wc] = context_dictSize++;
              context_w = String(context_c);
            }
          }
          if (context_w !== "") {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
              if (context_w.charCodeAt(0) < 256) {
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 8; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for (i = 0; i < context_numBits; i++) {
                  context_data_val = context_data_val << 1 | value;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i = 0; i < 16; i++) {
                  context_data_val = context_data_val << 1 | value & 1;
                  if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              for (i = 0; i < context_numBits; i++) {
                context_data_val = context_data_val << 1 | value & 1;
                if (context_data_position == bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
          }
          value = 2;
          for (i = 0; i < context_numBits; i++) {
            context_data_val = context_data_val << 1 | value & 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value = value >> 1;
          }
          while (true) {
            context_data_val = context_data_val << 1;
            if (context_data_position == bitsPerChar - 1) {
              context_data.push(getCharFromInt(context_data_val));
              break;
            } else
              context_data_position++;
          }
          return context_data.join("");
        },
        decompress: function(compressed) {
          if (compressed == null)
            return "";
          if (compressed == "")
            return null;
          return LZString2._decompress(compressed.length, 32768, function(index) {
            return compressed.charCodeAt(index);
          });
        },
        _decompress: function(length, resetValue, getNextValue) {
          var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
          for (i = 0; i < 3; i += 1) {
            dictionary[i] = i;
          }
          bits = 0;
          maxpower = Math.pow(2, 2);
          power = 1;
          while (power != maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          switch (next = bits) {
            case 0:
              bits = 0;
              maxpower = Math.pow(2, 8);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              c = f(bits);
              break;
            case 1:
              bits = 0;
              maxpower = Math.pow(2, 16);
              power = 1;
              while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
              }
              c = f(bits);
              break;
            case 2:
              return "";
          }
          dictionary[3] = c;
          w = c;
          result.push(c);
          while (true) {
            if (data.index > length) {
              return "";
            }
            bits = 0;
            maxpower = Math.pow(2, numBits);
            power = 1;
            while (power != maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position == 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            switch (c = bits) {
              case 0:
                bits = 0;
                maxpower = Math.pow(2, 8);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                dictionary[dictSize++] = f(bits);
                c = dictSize - 1;
                enlargeIn--;
                break;
              case 1:
                bits = 0;
                maxpower = Math.pow(2, 16);
                power = 1;
                while (power != maxpower) {
                  resb = data.val & data.position;
                  data.position >>= 1;
                  if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue(data.index++);
                  }
                  bits |= (resb > 0 ? 1 : 0) * power;
                  power <<= 1;
                }
                dictionary[dictSize++] = f(bits);
                c = dictSize - 1;
                enlargeIn--;
                break;
              case 2:
                return result.join("");
            }
            if (enlargeIn == 0) {
              enlargeIn = Math.pow(2, numBits);
              numBits++;
            }
            if (dictionary[c]) {
              entry = dictionary[c];
            } else {
              if (c === dictSize) {
                entry = w + w.charAt(0);
              } else {
                return null;
              }
            }
            result.push(entry);
            dictionary[dictSize++] = w + entry.charAt(0);
            enlargeIn--;
            w = entry;
            if (enlargeIn == 0) {
              enlargeIn = Math.pow(2, numBits);
              numBits++;
            }
          }
        }
      };
      return LZString2;
    }();
    if (typeof define === "function" && define.amd) {
      define(function() {
        return LZString;
      });
    } else if (typeof module !== "undefined" && module != null) {
      module.exports = LZString;
    } else if (typeof angular !== "undefined" && angular != null) {
      angular.module("LZString", []).factory("LZString", function() {
        return LZString;
      });
    }
  }
});

// src/shared/utils/utils.ts
var hasAllFlags = (a, b) => (a & b) === b;
var hasAnyFlag = (a, b) => b === 0 ? true : (a & b) !== 0;
var avg = (a, b) => (a + b) / 2;
var randomRange = (min, max) => Math.random() * (max - min) + min;
var randomRangeInt = (min, max) => Math.floor(randomRange(min, max));
var clamp = (value, min, max) => Math.max(min, Math.min(value, max));
var lerp = (a, b, t) => a + (b - a) * t;
var invLerp = (a, b, v) => (v - a) / (b - a || 1);
var remap = (iMin, iMax, oMin, oMax, v) => lerp(oMin, oMax, invLerp(iMin, iMax, v));
var isNumber = (v) => typeof v === "number";
var isString = (v) => typeof v === "string";
var isDefined = (v) => v !== void 0;
var isNull = (v) => v === null;
var isNonNullable = (v) => isDefined(v) && !isNull(v);
var uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
};
function getRandomWeightedIndex(weights, nullWeight = 0) {
  const tempWeights = [nullWeight, ...weights];
  let sum = tempWeights.reduce((a, c) => a + c, 0);
  const random = Math.random() * sum;
  if (random === 0) {
    return -1;
  }
  for (const [i, v] of tempWeights.entries()) {
    sum -= v;
    if (sum <= random) {
      return i - 1;
    }
  }
  return -1;
}
function getRandomWeightedItem(items, nullWeight = 0) {
  const index = getRandomWeightedIndex(items.map((x) => x.weight), nullWeight);
  const item = items[index];
  return item;
}
function pickOneFromPickProbability(items) {
  for (const item of items) {
    const random = randomRangeInt(1, (item.probability ?? 0) + 1);
    const pick = item.probability === random;
    if (pick) {
      return item;
    }
  }
  return void 0;
}
function toDecimals(value, decimals, rounding = Math.floor) {
  return rounding(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// src/shared/utils/assert.ts
function assertDefined(value, msg) {
  if (!isDefined(value)) {
    throw new TypeError(msg ?? "value is undefined");
  }
}
function assertNullable(value, msg) {
  if (isNonNullable(value)) {
    throw new TypeError(msg ?? "value is not null or undefined");
  }
}
function assertNonNullable(value, msg) {
  if (!isNonNullable(value)) {
    throw new TypeError(msg ?? "value is null or undefined");
  }
}
function assertType(value, func, msg) {
  if (!func(value)) {
    throw new TypeError(msg);
  }
}

// src/extensions/arrayExtensions.ts
Array.prototype.remove = function(item) {
  const index = this.indexOf(item);
  if (index === -1) {
    return false;
  }
  this.splice(index, 1);
  return true;
};
Array.prototype.replace = function(oldValue, newValue) {
  const index = this.indexOf(oldValue);
  if (index === -1) {
    return false;
  }
  this[index] = newValue;
  return true;
};
Array.prototype.clear = function() {
  this.splice(0);
};
Array.prototype.random = function() {
  const index = randomRangeInt(0, this.length);
  const value = this[index];
  assertDefined(value);
  return value;
};
Array.prototype.findStrict = function(predicate) {
  const item = this.find(predicate);
  assertDefined(item, "Item must exist when called with Array.findStrict()");
  return item;
};

// src/extensions/DOMExtensions.ts
if (typeof Document !== "undefined") {
  Document.prototype.querySelectorStrict = function(selectors) {
    const element = this.querySelector(selectors);
    assertDefined(element, `Element with selectors ${selectors} could not be found!`);
    return element;
  };
}
if (typeof Element !== "undefined") {
  Element.prototype.querySelectorStrict = function(selectors) {
    const element = this.querySelector(selectors);
    assertDefined(element, `Element with selectors ${selectors} could not be found!`);
    return element;
  };
  Element.prototype.getAttributeStrict = function(qualifiedName) {
    const attr = this.getAttribute(qualifiedName);
    assertType(attr, isString, `missing attribute: ${qualifiedName}`);
    return attr;
  };
}

// src/shared/utils/EventEmitter.ts
var EventEmitter = class {
  listeners = /* @__PURE__ */ new Map();
  listen(callback, opts) {
    const removeListener = () => this.removeListener(callback);
    const instance = { callback, opts, removeListener };
    this.listeners.set(callback, instance);
  }
  removeListener(callback) {
    this.listeners.delete(callback);
  }
  removeAllListeners() {
    this.listeners.clear();
  }
  invoke(value) {
    for (const [callback, listener] of this.listeners.entries()) {
      listener.callback(value, listener);
      if (listener.opts?.once) {
        this.listeners.delete(callback);
      }
    }
  }
};

// src/game/gameConfig/gameModRegister.json
var gameModRegister_default = {
  $schema: "gameModRegister.schema.json",
  list: [
    {
      id: "1ea84a",
      name: "Demo",
      url: "./gameMods/demo.jsonc",
      author: "MyzBai",
      description: "This mod acts as a demo. \nIt's made by the developer of this game.\nThe purpose of this mod is to showcase the base game and may contain a lot of missing features."
    }
  ]
};

// src/shared/customElements/CustomElement.ts
var CustomElement = class extends HTMLElement {
  cloneNode(deep) {
    super.cloneNode(deep);
    this.init?.();
    return this;
  }
  disconnectedCallback() {
  }
};

// src/shared/customElements/ProgressElement.ts
var ProgressElement = class extends CustomElement {
  static name = "progress-element";
  _value = 0;
  valueElement;
  constructor() {
    super();
    this.valueElement = document.createElement("div");
    this.valueElement.classList.add("value");
  }
  set value(v) {
    this._value = Number.isFinite(v) ? v : 1;
    this.update();
  }
  get value() {
    return this._value;
  }
  update() {
    const pct = this._value * 100;
    this.valueElement.style.width = CSS.percent(pct).toString();
  }
  init() {
    this.appendChild(this.valueElement);
    const inner = document.createElement("div");
    inner.classList.add("inner");
    this.valueElement.appendChild(inner);
    this.update();
  }
};

// src/shared/customElements/customElements.ts
function createCustomElement(ctor) {
  const name = ctor.name;
  if (!customElements.get(name)) {
    customElements.define(name, ctor);
  }
  const element = document.createElement(name);
  element.init?.();
  return element;
}

// src/game/effects/effectSystems.ts
var sortByDamage = (a, b) => b.damage - a.damage;
var BaseEffectSystem = class {
  constructor(type) {
    this.type = type;
    this.element = this.createElement();
    this.timeSpan = this.element.querySelectorStrict("[data-time]");
    this.stackSpan = this.element.querySelectorStrict("[data-stacks]");
    this.progressBar = this.element.querySelectorStrict(ProgressElement.name);
  }
  element;
  timeSpan;
  stackSpan;
  progressBar;
  _effectInstances = [];
  time = 0;
  sort = (a, b) => b.time - a.time;
  get effectInstances() {
    return this._effectInstances;
  }
  update() {
    let maxTime = 0;
    for (const effectInstance of this._effectInstances) {
      effectInstance.time = this.duration * effectInstance.timePct;
      maxTime = Math.max(maxTime, effectInstance.time);
    }
  }
  addEffect(effect) {
    this.effectInstances.push(effect);
    this.time = effect.time;
    this.update();
    this.updateElements();
  }
  removeEffect(effect) {
    this._effectInstances.remove(effect);
    this.updateElements();
  }
  clear() {
    this._effectInstances = [];
  }
  updateElements() {
    const stacks = Math.min(this._effectInstances.length, this.maxStacks);
    const visible = stacks > 0 && this.time > 0;
    this.element.classList.toggle("hidden", !visible);
    if (!visible) {
      return;
    }
    this.timeSpan.textContent = `${this.time.toFixed()}s`;
    this.stackSpan.textContent = stacks.toFixed();
    const pct = this.time / this.duration;
    this.progressBar.value = pct;
  }
  dealDamageOverTime(effectInstances, dt) {
    const count = Math.min(effectInstances.length, this.maxStacks);
    for (let i = 0; i < count; i++) {
      const instance = effectInstances[i];
      if (!instance) {
        break;
      }
      const damage = instance.damage * dt;
      combat.dealDamageOverTime(damage, instance.type);
    }
  }
  tick(dt) {
    let maxTime = 0;
    for (let i = this._effectInstances.length - 1; i >= 0; i--) {
      const effectInstance = this._effectInstances[i];
      if (!effectInstance) {
        continue;
      }
      effectInstance.time -= dt;
      maxTime = Math.max(effectInstance.time, maxTime);
      if (effectInstance.time <= 0) {
        this.removeEffect(effectInstance);
      }
      effectInstance.timePct = effectInstance.time / this.duration;
    }
    this.time = Math.min(maxTime, this.duration);
  }
  createElement() {
    const li = document.createElement("li");
    li.classList.add("hidden", "s-effect");
    li.insertAdjacentHTML("beforeend", `<div><span>${this.type}</span> | Time: <span data-time></span> | Stacks: <span data-stacks></span></div>`);
    const progressBar = createCustomElement(ProgressElement);
    progressBar.classList.add("progress-bar");
    li.appendChild(progressBar);
    return li;
  }
  serialize() {
    return this._effectInstances.map((x) => ({ type: x.type, timePct: x.timePct, effectivenessFactor: x.effectivenessFactor }));
  }
};
var BleedSystem = class extends BaseEffectSystem {
  type = "Bleed";
  constructor() {
    super("Bleed");
    this.sort = sortByDamage;
  }
  get maxStacks() {
    return player.stats.maxBleedStackCount.value;
  }
  get duration() {
    return player.stats.bleedDuration.value;
  }
  update() {
    super.update();
    for (const instance of this._effectInstances) {
      instance.damage = lerp(player.stats.minBleedDamage.value, player.stats.maxBleedDamage.value, instance.effectivenessFactor);
    }
    this._effectInstances.sort(this.sort);
  }
  tick(dt) {
    this.dealDamageOverTime(this._effectInstances, dt);
    super.tick(dt);
  }
};
var BurnSystem = class extends BaseEffectSystem {
  type = "Burn";
  constructor() {
    super("Burn");
    this.sort = sortByDamage;
  }
  get maxStacks() {
    return player.stats.maxBurnStackCount.value;
  }
  get duration() {
    return player.stats.burnDuration.value;
  }
  update() {
    super.update();
    for (const instance of this._effectInstances) {
      instance.damage = lerp(player.stats.minBurnDamage.value, player.stats.maxBurnDamage.value, instance.effectivenessFactor);
    }
    this._effectInstances.sort(this.sort);
  }
  tick(dt) {
    this.dealDamageOverTime(this._effectInstances, dt);
    super.tick(dt);
  }
};

// src/game/effects/Effects.ts
var effectTypes = ["Bleed", "Burn"];
var Effects = class {
  onEffectChanged = new EventEmitter();
  systems = {
    Bleed: new BleedSystem(),
    Burn: new BurnSystem()
  };
  init() {
    gameLoopAnim.registerCallback(() => this.updateElements());
    gameLoop.registerCallback((dt) => this.tick(dt));
    player.onStatsChange.listen(() => this.updateInstances());
    const effectListContainer = combat.page.querySelectorStrict("[data-effect-list]");
    effectListContainer.replaceChildren();
    for (const system of Object.values(this.systems)) {
      effectListContainer.appendChild(system.element);
    }
  }
  setup() {
    this.updateValues();
    this.updateElements();
  }
  clear() {
    for (const system of Object.values(this.systems)) {
      system.clear();
    }
  }
  updateValues() {
    for (const system of Object.values(this.systems)) {
      system.update();
    }
  }
  updateElements() {
    for (const system of Object.values(this.systems)) {
      system.updateElements();
    }
  }
  hasEffect(type) {
    return this.getSystem(type).effectInstances.length > 0;
  }
  reset() {
    this.removeAllEffects();
  }
  getSystem(type) {
    const system = this.systems[type];
    return system;
  }
  addEffects(...effects) {
    for (const effectData of effects) {
      const system = this.getSystem(effectData.type);
      const instance = {
        type: effectData.type,
        timePct: effectData.timePct || 1,
        time: 0,
        effectivenessFactor: effectData.effectivenessFactor
      };
      system.addEffect(instance);
      this.onEffectChanged.invoke(effectData.type);
    }
    this.updateInstances();
  }
  clearEffectsByType(types) {
    for (const type of types) {
      const system = this.getSystem(type);
      system.clear();
      this.onEffectChanged.invoke(type);
    }
    player.updateStats();
    combat.enemy?.updateStats();
  }
  removeAllEffects() {
    this.clear();
    this.updateElements();
  }
  updateInstances() {
    this.updateValues();
  }
  tick(dt) {
    for (const system of Object.values(this.systems)) {
      const instanceCount = system.effectInstances.length;
      if (instanceCount === 0) {
        continue;
      }
      system.tick(dt);
      if (system.effectInstances.length !== instanceCount) {
        this.onEffectChanged.invoke(system.type);
      }
    }
  }
  serialize(save) {
    save.effects = { effectList: Object.values(this.systems).flatMap((x) => x.serialize()) };
  }
  deserialize({ effects: save }) {
    if (!save) {
      return;
    }
    for (const serializedEffect of save.effectList ?? []) {
      if (!serializedEffect) {
        continue;
      }
      if (!isString(serializedEffect.type)) {
        continue;
      }
      const system = this.getSystem(serializedEffect.type);
      system.effectInstances.push({
        type: serializedEffect.type,
        timePct: serializedEffect.timePct || 0,
        time: 0,
        effectivenessFactor: serializedEffect.effectivenessFactor
      });
    }
  }
};

// src/game/calc/calcMod.ts
var isConditionTag = (tag) => tag.type === "Condition";
function calcModBase(modName, config) {
  return calcModSum("Base", modName, config);
}
function calcModInc(modName, config) {
  return Math.max(0, 1 + calcModSum("Inc", modName, config) / 100);
}
function calcModMore(modName, config) {
  return Math.max(0, calcModSum("More", modName, config));
}
function calcModIncMore(modName, base, config) {
  if (base <= 0)
    return 0;
  const inc = calcModInc(modName, config);
  const more = calcModMore(modName, config);
  return base * inc * more;
}
function calcModTotal(modName, config) {
  const base = calcModBase(modName, config);
  if (base === 0) {
    return 0;
  }
  const inc = calcModInc(modName, config);
  const more = calcModMore(modName, config);
  return base * inc * more;
}
function calcModFlag(modName, config) {
  return Math.min(calcModSum("Flag", modName, config), 1);
}
function calcModSum(valueType, names, config) {
  names = Array.isArray(names) ? names : [names];
  let result = valueType === "More" ? 1 : 0;
  const modDB = config.source?.modDB;
  assertDefined(modDB, "modDB is undefined");
  const modList = names.flatMap((x) => modDB.getModListByName(x)).filter(isDefined).filter((x) => x.valueType === valueType);
  const override = modList.find((x) => x.override);
  if (isDefined(override)) {
    return evalMod(override, config) || 0;
  }
  for (const mod of modList) {
    const value = evalMod(mod, config);
    switch (valueType) {
      case "More":
        result *= 1 + value / 100;
        break;
      default:
        result += value;
    }
  }
  return result;
}
function evalMod(mod, config) {
  if (!hasAllFlags(config.flags || 0, mod.modFlagsAll || 0)) {
    return 0;
  }
  if (!hasAnyFlag(config.flags || 0, mod.modFlagsAny || 0)) {
    return 0;
  }
  if (mod.reference) {
    if (!config.reference) {
      return 0;
    }
    if (mod.reference.type !== config.reference.type) {
      return 0;
    }
    if (mod.reference.name && mod.reference.name !== config.reference.name) {
      return 0;
    }
  }
  const conditionsPassed = evalConditions(mod.extends?.filter(isConditionTag) || [], config);
  if (!conditionsPassed) {
    return 0;
  }
  let value = mod.negate ? -mod.value : mod.value;
  for (const tag of mod.extends || []) {
    if (tag.type === "Multiplier") {
      const multiplier = config.source?.stats?.[tag.statName] || 1;
      value *= multiplier;
    } else if (tag.type === "PerStat") {
      value /= tag.value || 1;
      value /= tag.div || 1;
      const statValue = config.source?.stats?.[tag.statName] || 0;
      value *= statValue;
    }
  }
  return value;
}
function evalConditions(conditions, config) {
  for (const condition of conditions) {
    let flag = condition.flagsAny || condition.flagsAll || 0;
    if (condition.negate) {
      flag = flag & ~flag;
    }
    let targetConditionFlags = 0;
    switch (condition.target) {
      case "Self":
        targetConditionFlags = config.source?.conditionFlags || 0;
        break;
      case "Other":
        targetConditionFlags = config.target?.conditionFlags || 0;
        break;
    }
    if (condition.flagsAny !== 0) {
      if (!hasAnyFlag(targetConditionFlags, flag)) {
        return false;
      }
    } else if (condition.flagsAll !== 0) {
      if (!hasAllFlags(targetConditionFlags, flag)) {
        return false;
      }
    }
  }
  return true;
}

// src/game/mods/types.ts
var ModifierFlags = /* @__PURE__ */ ((ModifierFlags2) => {
  ModifierFlags2[ModifierFlags2["None"] = 0] = "None";
  ModifierFlags2[ModifierFlags2["Attack"] = 1] = "Attack";
  ModifierFlags2[ModifierFlags2["Physical"] = 2] = "Physical";
  ModifierFlags2[ModifierFlags2["Elemental"] = 4] = "Elemental";
  ModifierFlags2[ModifierFlags2["Chaos"] = 8] = "Chaos";
  ModifierFlags2[ModifierFlags2["Skill"] = 16] = "Skill";
  ModifierFlags2[ModifierFlags2["Bleed"] = 32] = "Bleed";
  ModifierFlags2[ModifierFlags2["Burn"] = 64] = "Burn";
  ModifierFlags2[ModifierFlags2["DOT"] = 96] = "DOT";
  ModifierFlags2[ModifierFlags2["Ailment"] = 128] = "Ailment";
  return ModifierFlags2;
})(ModifierFlags || {});
var ModifierTagList = [
  "Global",
  "Damage",
  "DamageOverTime",
  "Attack",
  "Physical",
  "Elemental",
  "Speed",
  "Mana",
  "Critical",
  "Ailment",
  "Bleed",
  "Burn",
  "Duration",
  "Skill",
  "Aura",
  "Attribute",
  "Life"
];

// src/game/utils/utils.ts
var compareValueTypes = (v1, v2) => typeof v1 === typeof v2;
function getFormattedTag(tag) {
  return `<span data-tag="${tag.toLowerCase()}">${tag}</span>`;
}
function getResourceByName(name) {
  const id = game.gameConfig.resources.findStrict((x) => x.name === name).id;
  const resource = game.resources[id];
  assertDefined(resource);
  return resource;
}
function evalCost(cost) {
  const stat = getResourceByName(cost.name);
  return stat.value >= cost.value;
}
function subtractCost(cost) {
  const resource = getResourceByName(cost.name);
  resource.subtract(cost.value);
}

// src/game/calc/calcStats.ts
function extractStats(stats) {
  return Object.keys(stats).reduce((a, key) => {
    const value = stats[key]?.value;
    if (isNumber(value)) {
      a[key] = value;
    }
    return a;
  }, {});
}
function applyStatValues(stats, values) {
  for (const key of Object.keys(stats)) {
    const stat = stats[key];
    const value = values[key];
    if (!isDefined(value)) {
      continue;
    }
    if (compareValueTypes(value, stat.value)) {
      stat.set(value);
    }
  }
}
function calcPlayerCombatStats(player2) {
  const stats = player2.stats;
  const config = {
    source: {
      type: "Player",
      ...player2,
      modDB: player2.modDB
    }
  };
  config.flags = config.flags ?? 0;
  stats.strength = calcModTotal(["Attribute", "Strength"], config);
  stats.dexterity = calcModTotal(["Attribute", "Dexterity"], config);
  stats.intelligence = calcModTotal(["Attribute", "Intelligence"], config);
  stats.maxMana = calcModTotal("MaxMana", config);
  stats.manaRegeneration = calcModTotal("ManaRegen", config);
  config.flags |= 16 /* Skill */;
  stats.attackManaCost = calcModTotal("AttackManaCost", config);
  config.flags &= ~16 /* Skill */;
  if (config.target) {
    config.target = {
      type: "Enemy",
      stats: extractStats(config.target.stats || {}),
      conditionFlags: config.target.conditionFlags,
      modDB: config.target.modDB
    };
  }
  config.flags = 1 /* Attack */;
  stats.hitChance = calcModBase("HitChance", config) / 100;
  const clampedHitChance = clamp(stats.hitChance, 0, 1);
  stats.attackSpeed = calcModTotal("AttackSpeed", config);
  stats.criticalHitChance = calcModBase("CriticalHitChance", config) / 100;
  const clampedCritChance = clamp(stats.criticalHitChance, 0, 1);
  stats.criticalHitMultiplier = (150 + calcModBase("CriticalHitMultiplier", config)) / 100;
  stats.criticalHitMultiplier = Math.min(stats.criticalHitMultiplier, 100);
  let attackDps = 0;
  {
    const baseDamageResult = calcBaseAttackDamage(config, avg);
    const critDamageMultiplier = 1 + clampedCritChance * (stats.criticalHitMultiplier - 1);
    attackDps = baseDamageResult.totalBaseDamage * clampedHitChance * stats.attackSpeed * critDamageMultiplier;
    stats.minPhysicalDamage = baseDamageResult.minPhysicalDamage * critDamageMultiplier;
    stats.maxPhysicalDamage = baseDamageResult.maxPhysicalDamage * critDamageMultiplier;
    stats.minElementalDamage = baseDamageResult.minElementalDamage * critDamageMultiplier;
    stats.maxElementalDamage = baseDamageResult.maxElementalDamage * critDamageMultiplier;
  }
  let bleedDps = 0;
  {
    config.flags = 2 /* Physical */ | 32 /* Bleed */;
    stats.bleedChanceOnHit = calcModBase("BleedChance", config) / 100;
    stats.bleedDuration = calcModTotal(["BleedDuration", "AilmentDuration"], config);
    stats.maxBleedStackCount = calcModBase("BleedStack", config);
    const { min, max } = calcAilmentBaseDamage("Physical", config);
    const stacksPerSecond = clampedHitChance * stats.bleedChanceOnHit * stats.attackSpeed * stats.bleedDuration;
    const maxStacks = Math.min(stacksPerSecond, stats.maxBleedStackCount);
    stats.baseBleedDamageMultiplier = calcModTotal("BaseBleedDamageMultiplier", config) / 100;
    stats.bleedDamageMultiplier = 1 + calcModTotal("DamageOverTimeMultiplier", config) / 100;
    stats.minBleedDamage = min * stats.baseBleedDamageMultiplier * stats.bleedDamageMultiplier;
    stats.maxBleedDamage = max * stats.baseBleedDamageMultiplier * stats.bleedDamageMultiplier;
    const avgDamage = avg(stats.minBleedDamage, stats.maxBleedDamage);
    bleedDps = avgDamage * maxStacks;
  }
  let burnDps = 0;
  {
    config.flags = 4 /* Elemental */ | 64 /* Burn */;
    stats.burnChanceOnHit = calcModBase("BurnChance", config) / 100;
    stats.burnDuration = calcModTotal(["BurnDuration", "AilmentDuration"], config);
    stats.maxBurnStackCount = calcModBase("BurnStack", config);
    const { min, max } = calcAilmentBaseDamage("Elemental", config);
    const stacksPerSecond = clampedHitChance * stats.burnChanceOnHit * stats.attackSpeed * stats.burnDuration;
    const maxStacks = Math.min(stacksPerSecond, stats.maxBurnStackCount);
    stats.baseBurnDamageMultiplier = calcModTotal("BaseBurnDamageMultiplier", config) / 100;
    stats.burnDamageMultiplier = 1 + calcModTotal("DamageOverTimeMultiplier", config) / 100;
    stats.minBurnDamage = min * stats.baseBurnDamageMultiplier * stats.burnDamageMultiplier;
    stats.maxBurnDamage = max * stats.baseBurnDamageMultiplier * stats.burnDamageMultiplier;
    const baseDamage = avg(stats.minBurnDamage, stats.maxBurnDamage);
    burnDps = baseDamage * maxStacks;
  }
  const ailmentDps = bleedDps + burnDps;
  stats.dps = attackDps + ailmentDps;
  config.flags = 0;
  stats.auraDurationMultiplier = calcModIncMore("AuraDuration", 1, config);
  stats.lingeringBurn = calcModFlag("LingeringBurn", config);
  return stats;
}
function calcPlayerPersistantStats(player2) {
  const stats = player2.stats;
  const config = {
    source: {
      type: "Player",
      ...player2,
      modDB: player2.modDB
    }
  };
  config.flags = config.flags ?? 0;
  stats.maxAura = calcModBase("AuraSlot", config);
  stats.maxArtifacts = calcModBase("MaxArtifact", config);
  stats.insightCapacity = calcModBase("Insight", config);
  return stats;
}
function calcCombatContextStats(ctx) {
  const config = {
    flags: 0,
    source: { modDB: ctx.modDB, stats: ctx.stats }
  };
  const baseEnemyCount = ctx.stats.baseEnemyCount + calcModBase("EnemyCount", config);
  const maxEnemyCount = calcModIncMore("EnemyCount", baseEnemyCount, config);
  return { maxEnemyCount };
}
function calcEnemyStats(enemy) {
  const stats = extractStats(enemy.stats || {});
  const config = {
    flags: 0,
    source: { type: "Enemy", conditionFlags: enemy.conditionFlags, stats, modDB: enemy.modDB }
  };
  const baseLife = stats.baseLife;
  stats.maxLife = calcModIncMore("Life", baseLife, config);
  stats.evadeChance = calcModBase("Evade", config) / 100;
  stats.reducedDamageTakenMultiplier = calcModIncMore("DamageTaken", 1, config);
  applyStatValues(enemy.stats || {}, stats);
}
function calcEnemyResourceDrop(enemy, resources) {
  const stats = extractStats(enemy.stats || {});
  const out = {};
  for (const resource of resources) {
    const config = {
      source: { type: "Enemy", conditionFlags: enemy.conditionFlags, modDB: enemy.modDB, stats },
      reference: { type: "Resource", name: resource.name }
    };
    const resourceChance = calcModTotal("ResourceChanceOnEnemyDeath", config);
    if (resourceChance >= randomRange(0, 100)) {
      out[resource.id] = calcModTotal("ResourceAmountOnEnemyDeath", config);
    }
  }
  return out;
}

// src/game/calc/calcDamage.ts
var DamageTypes = ["Physical", "Elemental"];
var DamageTypeFlags = {
  Physical: 1 << 0,
  Elemental: 1 << 1
};
var damageNamesMetaTable = (() => {
  const names = [];
  const length = Object.values(DamageTypeFlags).reduce((a, v) => a + v);
  for (let i = 0; i <= length; i++) {
    const flagList = ["Damage"];
    for (const [key, flag] of Object.entries(DamageTypeFlags)) {
      if (flag & i) {
        flagList.push(`${key}Damage`);
      }
    }
    names.push(flagList);
  }
  return names;
})();
function calcAttack(source, enemy) {
  const stats = extractStats(source.stats);
  const enemyStats = extractStats(enemy.stats);
  const hitChance = stats.hitChance;
  const hitFac = randomRange(0, 1);
  const hit = hitChance >= hitFac;
  if (!hit) {
    return;
  }
  const enemyEvade = enemyStats.evadeChance;
  const evadeFac = randomRange(0, 1);
  if (evadeFac < enemyEvade) {
    return;
  }
  const attackEffectiveness = randomRange(0, 1);
  const critChance = stats.criticalHitChance;
  const critFac = randomRange(0, 1);
  const crit = critChance >= critFac;
  let critMultiplier = 1;
  if (crit) {
    critMultiplier = stats.criticalHitMultiplier;
  }
  const finalMultiplier = critMultiplier;
  const minPhysicalDamage = stats.minPhysicalDamage;
  const maxPhysicalDamage = stats.maxPhysicalDamage;
  const physicalDamage = lerp(minPhysicalDamage, maxPhysicalDamage, attackEffectiveness);
  const minElementalDamage = stats.minElementalDamage;
  const maxElementalDamage = stats.maxElementalDamage;
  const elementalDamage = lerp(minElementalDamage, maxElementalDamage, attackEffectiveness);
  const reducedDamageMultiplier = enemy.stats.reducedDamageTakenMultiplier.value;
  const totalDamage = (physicalDamage + elementalDamage) * finalMultiplier * reducedDamageMultiplier;
  const effects = [];
  {
    if (physicalDamage > 0) {
      const bleedChance = stats.bleedChanceOnHit;
      if (bleedChance >= randomRange(0, 1)) {
        effects.push({ type: "Bleed", effectivenessFactor: attackEffectiveness });
      }
    }
    if (elementalDamage > 0) {
      const burnChance = stats.burnChanceOnHit;
      if (burnChance >= randomRange(0, 1)) {
        effects.push({ type: "Burn", effectivenessFactor: attackEffectiveness });
      }
    }
  }
  return {
    hit,
    crit,
    physicalDamage,
    elementalDamage,
    totalDamage,
    effects
  };
}
function calcBaseAttackDamage(config, calcMinMax) {
  config.flags = config.flags || 0;
  const conversionTable = generateConversionTable(config);
  const output = {
    totalBaseDamage: 0,
    minPhysicalDamage: 0,
    maxPhysicalDamage: 0,
    minElementalDamage: 0,
    maxElementalDamage: 0
  };
  const damageMultiplier = config.source.stats.attackEffectiveness / 100;
  let totalBaseDamage = 0;
  for (const damageType of Object.keys(DamageTypeFlags)) {
    const bit = ModifierFlags[damageType];
    config.flags |= bit;
    let { min, max } = calcDamage(damageType, config, conversionTable);
    min *= damageMultiplier;
    max *= damageMultiplier;
    output[`min${damageType}Damage`] = min;
    output[`max${damageType}Damage`] = max;
    const baseDamage = calcMinMax(min, max);
    totalBaseDamage += baseDamage;
    config.flags &= ~bit;
  }
  output.totalBaseDamage = totalBaseDamage;
  return output;
}
function calcDamage(damageType, config, conversionTable, damageFlag = 0) {
  damageFlag |= DamageTypeFlags[damageType];
  let addMin = 0;
  let addMax = 0;
  for (const type of DamageTypes) {
    if (type === damageType) {
      break;
    }
    const conversionValue = conversionTable[type] || {};
    const convMulti = conversionValue[damageType] || 0;
    if (convMulti > 0) {
      const { min: min2, max: max2 } = calcDamage(type, config, conversionTable, damageFlag);
      addMin += min2 * convMulti;
      addMax += max2 * convMulti;
    }
  }
  const baseMin = calcModBase("MinDamage", config);
  const baseMax = calcModBase("MaxDamage", config);
  const modNames = damageNamesMetaTable[damageFlag];
  assertDefined(modNames);
  const min = calcModIncMore(modNames, baseMin, config) + addMin;
  const max = calcModIncMore(modNames, baseMax, config) + addMax;
  return { min, max };
}
function calcAilmentBaseDamage(damageType, config, typeFlags = 0) {
  const conversionTable = generateConversionTable(config);
  let { min, max } = calcDamage(damageType, config, conversionTable, typeFlags);
  const convMulti = conversionTable[damageType]?.multi || 1;
  const attackEffectiveness = config.source.stats.attackEffectiveness / 100;
  min *= attackEffectiveness;
  max *= attackEffectiveness;
  return { min: min * convMulti, max: max * convMulti };
}
function generateConversionTable(config) {
  const conversionTable = {};
  const damageTypeFlagKeys = Object.keys(DamageTypeFlags);
  for (let i = 0; i < damageTypeFlagKeys.length; i++) {
    const damageType = damageTypeFlagKeys[i];
    assertDefined(damageType);
    const globalConv = {};
    const skillConv = {};
    const add = {};
    let globalTotal = 0;
    let skillTotal = 0;
    for (let j = i + 1; j < damageTypeFlagKeys.length; j++) {
      const otherDamageType = damageTypeFlagKeys[i];
      const convertedToName = `${damageType}ConvertedTo${otherDamageType}`;
      globalConv[otherDamageType] = calcModBase(convertedToName, config);
      globalTotal += globalConv[otherDamageType] || 0;
      skillConv[otherDamageType] = calcModBase(convertedToName, config);
      skillTotal += skillConv[otherDamageType] || 0;
      add[otherDamageType] = calcModBase(`${damageType}GainAs${otherDamageType}`, config);
    }
    const fac = skillTotal > 100 ? 100 / skillTotal : (100 - skillTotal) / globalTotal;
    for (const key of Object.keys(skillConv)) {
      skillConv[key] = (skillConv[key] || 0) * fac;
    }
    const conversionValues = { multi: 1 };
    for (const key of Object.keys(globalConv)) {
      const value = conversionValues[key];
      const skillConvValue = skillConv[key] || 0;
      const addValue = add[key] || 0;
      conversionValues[key] = ((value || 0) + skillConvValue + addValue) / 100;
    }
    conversionValues.multi = 1 - Math.min((globalTotal + skillTotal) / 100, 1);
    conversionTable[damageType] = conversionValues;
  }
  return conversionTable;
}

// src/shared/utils/Value.ts
var Value = class {
  constructor(defaultValue) {
    this.defaultValue = defaultValue;
    this._value = defaultValue;
  }
  _value;
  listeners = {
    change: new EventEmitter(),
    set: new EventEmitter(),
    add: new EventEmitter(),
    subtract: new EventEmitter()
  };
  mutated = false;
  get value() {
    return this._value;
  }
  set(v, silent = false) {
    if (v === this._value) {
      return;
    }
    this._value = v;
    if (!silent) {
      this.listeners.set.invoke({ curValue: this._value, change: v });
      this.listeners.change.invoke({ curValue: this._value, change: v });
    }
    this.mutated = true;
  }
  add(v) {
    if (v === 0) {
      return;
    }
    this._value += v;
    this.listeners.add.invoke({ curValue: this._value, change: v });
    this.listeners.change.invoke({ curValue: this._value, change: v });
    this.mutated = true;
  }
  subtract(v) {
    if (v === 0) {
      return;
    }
    this._value -= v;
    this.listeners.subtract.invoke({ curValue: this._value, change: v });
    this.listeners.change.invoke({ curValue: this._value, change: v });
    this.mutated = true;
  }
  reset() {
    this.mutated = false;
    this._value = this.defaultValue;
    Object.values(this.listeners).forEach((x) => x.removeAllListeners());
  }
  addListener(type, callback) {
    this.listeners[type].listen(callback);
  }
  removeListener(type, callback) {
    this.listeners[type].removeListener(callback);
  }
  registerTargetValueCallback(targetValue, callback) {
    if (this._value >= targetValue) {
      callback(this._value);
      return;
    }
    const listener = () => {
      if (this._value >= targetValue) {
        callback(this._value);
        this.removeListener("change", listener);
      }
    };
    this.addListener("change", listener);
  }
};

// src/game/statistics/Statistic.ts
var Statistic = class extends Value {
  constructor(options = {}) {
    super(options.defaultValue || 0);
    this.options = options;
    options.type = options.type || "number";
    this.sticky = options.sticky || false;
    this.mutated = false;
    this.options.accumulators?.forEach((x) => this.addAccumulator(x));
  }
  sticky;
  texts;
  // static extractEnumType<T extends readonly string[]>(arr: T): T extends readonly (infer U)[] ? U : never {
  //     return arr as any;
  // }
  get visible() {
    if (this.options.hiddenBeforeMutation && !this.mutated) {
      return false;
    }
    return isString(this.options.label);
  }
  setDefault() {
    this.set(this.options.defaultValue ?? 0);
  }
  setText(text) {
    this.texts = this.texts || [];
    if (!this.texts.includes(text)) {
      this.texts.push(text);
    }
    this.set(this.texts.indexOf(text));
    this.mutated = true;
  }
  getText() {
    return this.texts?.[this.value];
  }
  reset() {
    super.reset();
    this.sticky = this.options.sticky || false;
    this.mutated = false;
  }
  addAccumulator(stat) {
    this.options.accumulators = this.options.accumulators || [];
    this.addListener("add", ({ change }) => stat.add(change));
    this.options.accumulators.push(stat);
  }
};

// src/game/statistics/stats.ts
function createGameStats(parent) {
  const maxLevel = new Statistic();
  const statList = {
    timePlayed: new Statistic({ label: "Time Played", isTime: true }),
    maxLevel,
    level: new Statistic({ sticky: true, label: "Level", defaultValue: 1, statFormat: (self2) => [self2, "/", maxLevel] }),
    world: new Statistic({ defaultValue: 1 }),
    totalDamage: new Statistic(),
    totalAttackDamage: new Statistic(),
    totalDamageOverTime: new Statistic(),
    totalPhysicalAttackDamage: new Statistic(),
    totalPhysicalDamage: new Statistic(),
    totalElementalAttackDamage: new Statistic(),
    totalElementalDamage: new Statistic(),
    totalBleedDamage: new Statistic(),
    totalBurnDamage: new Statistic(),
    totalHitCount: new Statistic(),
    totalCriticalHitCount: new Statistic(),
    totalMana: new Statistic()
  };
  if (parent) {
    Object.entries(statList).forEach(([statName, stat]) => {
      const parentStat = parent[statName];
      assertDefined(parentStat);
      stat.addAccumulator(parentStat);
    });
  }
  return statList;
}
function createResources(resources) {
  const resourceStats = [];
  for (const resource of resources) {
    const stat = new Statistic({ label: resource.name, sticky: resource.sticky, hiddenBeforeMutation: resource.hiddenBeforeMutation });
    resourceStats.push(stat);
  }
  return resourceStats.reduce((a, c) => {
    const key = resources.findStrict((x) => x.name === c.options.label).id;
    a[key] = c;
    return a;
  }, {});
}
function createCombatStats() {
  const maxEnemyCount = new Statistic({ computed: true });
  const enemyCount = new Statistic({ label: "Enemies", sticky: true, computed: true, statFormat: (self2) => [self2, "/", maxEnemyCount] });
  return {
    maxEnemyCount,
    enemyCount
  };
}
function createPlayerStats(gameStats) {
  const maxMana = new Statistic({ defaultValue: Infinity, computed: true });
  const minPhysicalDamage = new Statistic({ computed: true });
  const maxPhysicalDamage = new Statistic({ computed: true });
  const minElementalDamage = new Statistic({ computed: true });
  const maxElementalDamage = new Statistic({ computed: true });
  return {
    guildClass: new Statistic({ label: "Player Class", type: "text", computed: true, hiddenBeforeMutation: true }),
    dps: new Statistic({ label: "DPS", sticky: true, computed: true, decimals: 1, hoverTip: "Damage Per Second" }),
    totalHitCount: new Statistic({ accumulators: [gameStats.totalHitCount] }),
    hitChance: new Statistic({ label: "Hit Chance", sticky: true, computed: true, multiplier: 100, suffix: "%" }),
    attackSpeed: new Statistic({ label: "Attack Speed", sticky: true, computed: true, decimals: 2, hoverTip: "Attacks Per Second" }),
    attackManaCost: new Statistic({ label: "Attack Mana Cost", computed: true }),
    attackEffectiveness: new Statistic({ computed: true }),
    attackTime: new Statistic(),
    //Mana
    maxMana,
    mana: new Statistic({ label: "Mana", sticky: true, defaultValue: Infinity, statFormat: (self2) => [self2, "/", maxMana], accumulators: [gameStats.totalMana] }),
    manaRegeneration: new Statistic({ label: "Mana Regeneration", "decimals": 1, computed: true, sticky: true }),
    //Physical
    physicalAttackDamage: new Statistic({ label: "Physical Attack Damage", computed: true, statFormat: () => [minPhysicalDamage, "-", maxPhysicalDamage] }),
    minPhysicalDamage,
    maxPhysicalDamage,
    //Elemental
    elementalAttackDamage: new Statistic({ label: "Elemental Attack Damage", computed: true, statFormat: () => [minElementalDamage, "-", maxElementalDamage] }),
    minElementalDamage,
    maxElementalDamage,
    //Crit
    criticalHitChance: new Statistic({ label: "Critical Hit Chance", computed: true, multiplier: 100, suffix: "%" }),
    criticalHitMultiplier: new Statistic({ label: "Critical Hit Multiplier", computed: true, multiplier: 100, suffix: "%" }),
    //Bleed
    bleedChanceOnHit: new Statistic({ label: "Bleed Chance", computed: true, multiplier: 100, suffix: "%" }),
    bleedDuration: new Statistic({ label: "Bleed Duration", computed: true, suffix: "s", decimals: 1 }),
    maxBleedStackCount: new Statistic({ label: "Maximum Bleed Stacks", computed: true }),
    minBleedDamage: new Statistic({ computed: true }),
    maxBleedDamage: new Statistic({ computed: true }),
    baseBleedDamageMultiplier: new Statistic({ computed: true }),
    bleedDamageMultiplier: new Statistic({ computed: true }),
    //Burn
    burnChanceOnHit: new Statistic({ label: "Burn Chance", computed: true, multiplier: 100, suffix: "%" }),
    burnDuration: new Statistic({ label: "Burn Duration", computed: true, decimals: 1, suffix: "s" }),
    maxBurnStackCount: new Statistic({ label: "Maximum Burn Stacks", computed: true }),
    baseBurnDamageMultiplier: new Statistic({ computed: true }),
    burnDamageMultiplier: new Statistic({ computed: true }),
    minBurnDamage: new Statistic({ computed: true }),
    maxBurnDamage: new Statistic({ computed: true }),
    lingeringBurn: new Statistic({ computed: true, type: "boolean" }),
    //Attributes
    strength: new Statistic({ label: "Strength", computed: true }),
    dexterity: new Statistic({ label: "Dexterity", computed: true }),
    intelligence: new Statistic({ label: "Intelligence", computed: true }),
    //Skills
    maxAura: new Statistic({ computed: true }),
    auraDurationMultiplier: new Statistic({ computed: true }),
    insightCapacity: new Statistic({ computed: true }),
    maxArtifacts: new Statistic({ computed: true }),
    guildTokenCount: new Statistic(),
    trainingMultiplier: new Statistic({ defaultValue: 1, computed: true }),
    explorationMultiplier: new Statistic({ defaultValue: 1, computed: true }),
    meditationMultiplier: new Statistic({ defaultValue: 1, computed: true })
  };
}
function createEnemyStats() {
  return {
    baseLife: new Statistic({}),
    maxLife: new Statistic({ label: "Max Life", sticky: true }),
    life: new Statistic({ label: "Life", sticky: true, valueColorTag: "life" }),
    evadeChance: new Statistic({ computed: true }),
    reducedDamageTakenMultiplier: new Statistic({ computed: true })
  };
}
function serializeStats(stats) {
  const obj = /* @__PURE__ */ Object.create({});
  for (const [key, stat] of Object.entries(stats)) {
    const hasChanged = [(stat.options.sticky || false) !== stat.sticky, !stat.options.computed && stat.mutated].some((x) => x);
    if (!hasChanged) {
      continue;
    }
    obj[key] = { sticky: stat.sticky, value: stat.value };
  }
  return obj;
}
function deserializeStats(statList, serializedStats) {
  for (const [key, serializedStat] of Object.entries(serializedStats)) {
    if (!isDefined(serializedStat?.value)) {
      continue;
    }
    const stat = statList[key];
    if (!isDefined(stat)) {
      continue;
    }
    if (compareValueTypes(serializedStat.value, stat.value)) {
      stat.set(serializedStat.value);
    }
    if (isDefined(serializedStat.sticky)) {
      stat.sticky = serializedStat.sticky;
    }
  }
}

// src/shared/customElements/ModalElement.ts
var ModalElement = class extends CustomElement {
  static name = "modal-element";
  set minWidth(v) {
    this.querySelectorStrict("[data-body]").style.minWidth = v;
  }
  get body() {
    return this.querySelectorStrict("[data-body]");
  }
  init() {
    const content = document.createElement("div");
    content.classList.add("s-content");
    this.appendChild(content);
    content.insertAdjacentHTML("beforeend", '<div class="title hidden" data-title></div>');
    content.insertAdjacentHTML("beforeend", '<div class="s-body" data-body></div>');
    content.insertAdjacentHTML("beforeend", '<div class="s-buttons" data-buttons></div>');
    const backdrop = document.createElement("div");
    backdrop.classList.add("backdrop");
    backdrop.addEventListener("mousedown", this.remove.bind(this));
    this.appendChild(backdrop);
    document.body.appendChild(this);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
      this.focus();
    }
  }
  setTitle(text) {
    const titleElement = this.querySelectorStrict("[data-title]");
    titleElement.textContent = text;
    titleElement.classList.toggle("hidden", text.length === 0);
  }
  setBodyText(text) {
    this.querySelectorStrict("[data-body]").textContent = text;
  }
  addBodyElement(element) {
    this.querySelectorStrict("[data-body]").appendChild(element);
  }
  async setButtons(buttons, align = "horizontal") {
    return new Promise((resolve) => {
      const buttonElements = [];
      for (const buttonData of buttons) {
        const button = document.createElement("button");
        button.setAttribute("type", "submit");
        if (buttonData.type) {
          button.setAttribute("data-role", buttonData.type);
        }
        button.textContent = buttonData.text;
        button.addEventListener("click", async () => {
          await buttonData.callback?.();
          this.remove();
          resolve(buttonData.waitId);
        });
        buttonElements.push(button);
      }
      const buttonsElement = this.querySelectorStrict("[data-buttons]");
      buttonsElement.replaceChildren(...buttonElements);
      buttonsElement.style.display = "flex";
      buttonsElement.style.flexDirection = align === "horizontal" ? "column" : "row";
    });
  }
};

// src/game/mods/combatCtxModTemplates.ts
var combatCtxModTemplateList = [
  { desc: "#% More Enemy Life", stats: [{ name: "Life", valueType: "More" }], target: "Enemy", id: "0c0148" },
  { desc: "#% More Enemies", stats: [{ name: "EnemyCount", valueType: "More" }], id: "d4b6e5" },
  { desc: "Enemies Drop #% More Resources On Death", stats: [{ name: "ResourceAmountOnEnemyDeath", valueType: "Inc", reference: { type: "Resource" } }], id: "7e7466" }
];

// src/game/mods/modUtils.ts
function createModTags(statList) {
  const generateModTags = function* () {
    for (const stat of statList) {
      switch (stat.name) {
        case "AttackSpeed":
          yield "Speed";
          break;
        case "AilmentDuration":
        case "BleedDuration":
        case "BurnDuration":
          yield "Duration";
          yield "Ailment";
          break;
        case "LingeringBurn":
          yield "Ailment";
          break;
        case "Attribute":
        case "Strength":
        case "Dexterity":
        case "Intelligence":
          yield "Attribute";
          break;
        case "AuraDuration":
          yield "Aura";
          yield "Duration";
          break;
        case "BleedChance":
          yield "Bleed";
          yield "Ailment";
          break;
        case "BleedStack":
          yield "Bleed";
          break;
        case "BurnChance":
          yield "Burn";
          break;
        case "CriticalHitChance":
        case "CriticalHitMultiplier":
          yield "Critical";
          break;
        case "DamageOverTimeMultiplier":
          yield "Damage";
          break;
        case "Damage":
        case "MinDamage":
        case "MaxDamage":
        case "MinPhysicalDamage":
        case "MaxPhysicalDamage":
        case "MinElementalDamage":
        case "MaxElementalDamage":
        case "PhysicalDamage":
        case "ElementalDamage":
          yield "Damage";
          break;
        case "ManaRegen":
        case "MaxMana":
          yield "Mana";
          break;
      }
      const flags = (stat.modFlagsAny ?? 0) | (stat.modFlagsAll ?? 0);
      if (hasAnyFlag(flags, 1 /* Attack */)) {
        yield "Attack";
      }
      if (hasAnyFlag(flags, 2 /* Physical */)) {
        yield "Physical";
      }
      if (hasAnyFlag(flags, 4 /* Elemental */)) {
        yield "Elemental";
      }
      if (hasAnyFlag(flags, 32 /* Bleed */)) {
        yield "Bleed";
      }
      if (hasAnyFlag(flags, 64 /* Burn */)) {
        yield "Burn";
      }
      if (hasAnyFlag(flags, 96 /* DOT */)) {
        yield "DamageOverTime";
      }
      if (hasAnyFlag(flags, 128 /* Ailment */)) {
        yield "Ailment";
      }
    }
  };
  return [...new Set(generateModTags())];
}
function sortModifiers(modList) {
  const descriptions = modTemplateList.map((x) => x.desc);
  modList.sort((a, b) => descriptions.indexOf(typeof a === "string" ? Modifier.getTemplate(a)?.desc ?? "" : a.template.desc) - descriptions.indexOf(typeof b === "string" ? Modifier.getTemplate(b)?.desc ?? "" : b.template.desc));
}
function extractModifier(list, desc) {
  const template = list.find((x) => x.desc === desc);
  assertDefined(template);
  return template;
}
function getModGroupList(modText, modGroupsList, filterName) {
  const modGroup = modGroupsList.find((x) => x.some((x2) => x2.text === modText)) ?? [];
  return modGroup.filter((x) => !x.filter || x.filter.length === 0 || x.filter.some((x2) => x2 === filterName));
}
function calcModTier(modText, modGroupList) {
  const index = modGroupList.map((x) => x.text).indexOf(modText);
  return Math.abs(index - modGroupList.length);
}

// src/game/mods/playerModTemplates.ts
var generalPlayerModTemplateList = [
  { desc: "#% Increased Damage", stats: [{ name: "Damage", valueType: "Inc" }], id: "45cb6e" },
  { desc: "#% Increased Attack Damage", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 1 /* Attack */ }], id: "090fda" },
  { desc: "#% Increased Physical Attack Damage", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 1 /* Attack */ | 2 /* Physical */ }], id: "b8fdf4" },
  { desc: "#% Increased Elemental Attack Damage", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 1 /* Attack */ | 4 /* Elemental */ }], id: "556d9d" },
  { desc: "#% Increased Physical Damage", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 2 /* Physical */ }], id: "230cba" },
  { desc: "#% Increased Elemental Damage", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 4 /* Elemental */ }], id: "a2501d" },
  { desc: "#% More Attack Damage", stats: [{ name: "Damage", valueType: "More", modFlagsAll: 1 /* Attack */ }], id: "a8c4ed" },
  { desc: "#% More Physical Attack Damage", stats: [{ name: "Damage", valueType: "More", modFlagsAll: 1 /* Attack */ | 2 /* Physical */ }], id: "3f55a8" },
  { desc: "#% More Elemental Attack Damage", stats: [{ name: "Damage", valueType: "More", modFlagsAll: 1 /* Attack */ | 4 /* Elemental */ }], id: "b7e353" },
  { desc: "#% More Physical Damage", stats: [{ name: "Damage", valueType: "More", modFlagsAll: 2 /* Physical */ }], id: "1acbcd" },
  { desc: "#% More Elemental Damage", stats: [{ name: "Damage", valueType: "More", modFlagsAll: 4 /* Elemental */ }], id: "a67808" },
  { desc: "#% More Damage", stats: [{ name: "Damage", valueType: "More" }], id: "647b68" },
  { desc: "Adds # To # Physical Damage", stats: [{ name: "MinDamage", valueType: "Base", modFlagsAll: 2 /* Physical */ }, { name: "MaxDamage", valueType: "Base", modFlagsAll: 2 /* Physical */ }], id: "35fe5d" },
  { desc: "Adds # To # Elemental Damage", stats: [{ name: "MinDamage", valueType: "Base", modFlagsAll: 4 /* Elemental */ }, { name: "MaxDamage", valueType: "Base", modFlagsAll: 4 /* Elemental */ }], id: "f798af" },
  { desc: "#% Increased Attack Speed", stats: [{ name: "AttackSpeed", valueType: "Inc" }], id: "a9714e" },
  { desc: "#% More Attack Speed", stats: [{ name: "AttackSpeed", valueType: "More" }], id: "5fa13d" },
  { desc: "#% Increased Maximum Mana", stats: [{ name: "MaxMana", valueType: "Inc" }], id: "29a502" },
  { desc: "+# Maximum Mana", stats: [{ name: "MaxMana", valueType: "Base" }], id: "a12998" },
  { desc: "+# Mana Regeneration", stats: [{ name: "ManaRegen", valueType: "Base" }], id: "b63646" },
  { desc: "#% Increased Mana Regeneration", stats: [{ name: "ManaRegen", valueType: "Inc" }], id: "012b35" },
  { desc: "+##% Of Maximum Mana Regeneration", stats: [{ name: "ManaRegen", valueType: "Base", extends: [{ type: "PerStat", statName: "maxMana", div: 100 }] }], id: "6214e1" },
  { desc: "#% Increased Aura Duration", stats: [{ name: "AuraDuration", valueType: "Inc" }], id: "9e1042" },
  { desc: "+#% Chance To Bleed", stats: [{ name: "BleedChance", valueType: "Base" }], id: "8d66dc" },
  { desc: "#% Increased Bleed Damage", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 32 /* Bleed */ }], id: "3ef1f1" },
  { desc: "#% More Bleed Damage", stats: [{ name: "Damage", valueType: "More", modFlagsAll: 32 /* Bleed */ }], id: "3fb3a5" },
  { desc: "#% Increased Bleed Duration", stats: [{ name: "BleedDuration", valueType: "Inc" }], id: "b2e5e2" },
  { desc: "+# Maximum Bleed Stack", stats: [{ name: "BleedStack", valueType: "Base" }], id: "e9f87c" },
  { desc: "+#% Bleed Damage Multiplier", stats: [{ name: "DamageOverTimeMultiplier", valueType: "Base", modFlagsAll: 32 /* Bleed */ }], id: "aac96b" },
  { desc: "+#% Chance To Burn", stats: [{ name: "BurnChance", valueType: "Base" }], id: "6fc5fb" },
  { desc: "#% Increased Burn Damage", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 64 /* Burn */ }], id: "76a311" },
  { desc: "#% More Burn Damage", stats: [{ name: "Damage", valueType: "More", modFlagsAll: 64 /* Burn */ }], id: "e04515" },
  { desc: "#% Increased Burn Duration", stats: [{ name: "BurnDuration", valueType: "Inc" }], id: "650378" },
  { desc: "+# Maximum Burn Stack", stats: [{ name: "BurnStack", valueType: "Base" }], id: "cb3565" },
  { desc: "+#% Burn Damage Multiplier", stats: [{ name: "DamageOverTimeMultiplier", valueType: "Base", modFlagsAll: 64 /* Burn */ }], id: "c1c53f" },
  { desc: "+#% Critical Hit Chance", stats: [{ name: "CriticalHitChance", valueType: "Base" }], id: "71540b" },
  { desc: "+#% Critical Hit Multiplier", stats: [{ name: "CriticalHitMultiplier", valueType: "Base" }], id: "3ba4ed" },
  { desc: "+#% Hit Chance", stats: [{ name: "HitChance", valueType: "Base" }], id: "796465" },
  { desc: "-#% Hit Chance", stats: [{ name: "HitChance", valueType: "Base", negate: true }], id: "a953ee" },
  { desc: "#% Increased Ailment Duration", stats: [{ name: "AilmentDuration", valueType: "Inc" }], id: "823b17" },
  { desc: "#% More Damage Over Time", stats: [{ name: "Damage", valueType: "More", modFlagsAny: 96 /* DOT */ }], id: "b07ed8" },
  { desc: "+# To All Attributes", stats: [{ name: "Attribute", valueType: "Base" }], id: "1a540a" },
  { desc: "+# Strength", stats: [{ name: "Strength", valueType: "Base" }], id: "fa36b3" },
  { desc: "+# Dexterity", stats: [{ name: "Dexterity", valueType: "Base" }], id: "f15046" },
  { desc: "+# Intelligence", stats: [{ name: "Intelligence", valueType: "Base" }], id: "9382d2" },
  { desc: "#% Increased Strength", stats: [{ name: "Strength", valueType: "Inc" }], id: "30136a" },
  { desc: "#% Increased Attack Damage Per # Strength", stats: [{ name: "Damage", valueType: "Inc", modFlagsAll: 1 /* Attack */, extends: [{ type: "PerStat", statName: "strength", index: 1 }] }], id: "30330f" },
  { desc: "#% Increased Dexterity", stats: [{ name: "Dexterity", valueType: "Inc" }], id: "ff267e" },
  { desc: "#% Increased Attack Speed Per # Dexterity", stats: [{ name: "AttackSpeed", valueType: "Inc", extends: [{ type: "PerStat", statName: "dexterity", index: 1 }] }], id: "de97b1" },
  { desc: "+#% Hit Chance Per # Dexterity", stats: [{ name: "HitChance", valueType: "Base", extends: [{ type: "PerStat", statName: "dexterity", index: 1 }] }], id: "a2a83b" },
  { desc: "+#% Critical Hit Chance Per # Dexterity", stats: [{ name: "CriticalHitChance", valueType: "Base", extends: [{ type: "PerStat", statName: "dexterity", index: 1 }] }], id: "a28612" },
  { desc: "#% Increased Intelligence", stats: [{ name: "Intelligence", valueType: "Inc" }], id: "ed7c87" },
  { desc: "#% More Increased Mana Per # Intelligence", stats: [{ name: "MaxMana", valueType: "Inc", extends: [{ type: "PerStat", statName: "intelligence", index: 1 }] }], id: "0f6507" },
  { desc: "+# Maximum Mana Per # Intelligence", stats: [{ name: "MaxMana", valueType: "Base", extends: [{ type: "PerStat", statName: "intelligence", index: 1 }] }], id: "e2fb4f" },
  { desc: "#% Reduced Mana Cost Of Skills", stats: [{ name: "AttackSkillCost", valueType: "Inc", negate: true }], id: "f8655d" },
  { desc: "+#% Damage Over Time Multiplier", stats: [{ name: "DamageOverTimeMultiplier", valueType: "Base" }], id: "142327" },
  { desc: "Burn Lingers", stats: [{ name: "LingeringBurn", valueType: "Flag" }], id: "5d6b21" },
  { desc: "+#% Increased Attack Skills Experience Gain", stats: [{ name: "AttackSkillExpMultiplier", valueType: "Base" }], id: "69ca51" },
  { desc: "+#% Increased Aura Skills Experience Gain", stats: [{ name: "AuraSkillExpMultiplier", valueType: "Base" }], id: "118098" },
  { desc: "+#% Increased Passive Skills Experience Gain", stats: [{ name: "PassiveSkillExpMultiplier", valueType: "Base" }], id: "80ad3c" },
  { desc: "+#% Increased Artifacts Found", stats: [{ name: "ArtifactFind", valueType: "Base" }], id: "fdcab4" }
];
var persistentPlayerModTemplateList = [
  { desc: "+# Maximum Artifacts", stats: [{ name: "MaxArtifact", valueType: "Base" }], id: "51cc9c" },
  { desc: "+# Additional Aura Slots", stats: [{ name: "AuraSlot", valueType: "Base" }], id: "45357c" },
  { desc: "+# Maximum Insight", stats: [{ name: "Insight", valueType: "Base" }], id: "419541" }
];
var permanentPlayerModTemplateList = [
  { desc: "#% Base Bleed Damage Multiplier", stats: [{ name: "BaseBleedDamageMultiplier", valueType: "Base", override: true }], id: "01f233" },
  { desc: "#% Base Burn Damage Multiplier", stats: [{ name: "BaseBurnDamageMultiplier", valueType: "Base", override: true }], id: "7519a5" },
  { desc: "# Base Bleed Duration", stats: [{ name: "BleedDuration", valueType: "Base", override: true }], id: "1ec53c" },
  { desc: "# Base Burn Duration", stats: [{ name: "BurnDuration", valueType: "Base", override: true }], id: "b56e1d" }
];
var playerStartModTemplateList = [
  extractModifier(permanentPlayerModTemplateList, "#% Base Bleed Damage Multiplier"),
  extractModifier(permanentPlayerModTemplateList, "# Base Bleed Duration"),
  extractModifier(permanentPlayerModTemplateList, "#% Base Burn Damage Multiplier"),
  extractModifier(permanentPlayerModTemplateList, "# Base Burn Duration"),
  extractModifier(generalPlayerModTemplateList, "Adds # To # Physical Damage"),
  extractModifier(generalPlayerModTemplateList, "Adds # To # Elemental Damage"),
  extractModifier(generalPlayerModTemplateList, "+# Maximum Bleed Stack"),
  extractModifier(generalPlayerModTemplateList, "+# Maximum Burn Stack"),
  extractModifier(generalPlayerModTemplateList, "+# Strength"),
  extractModifier(generalPlayerModTemplateList, "+# Dexterity"),
  extractModifier(generalPlayerModTemplateList, "+# Intelligence"),
  extractModifier(generalPlayerModTemplateList, "#% Increased Attack Damage Per # Strength"),
  extractModifier(generalPlayerModTemplateList, "#% Increased Attack Speed Per # Dexterity"),
  extractModifier(generalPlayerModTemplateList, "+#% Hit Chance Per # Dexterity"),
  extractModifier(generalPlayerModTemplateList, "+#% Critical Hit Chance Per # Dexterity"),
  extractModifier(generalPlayerModTemplateList, "+# Maximum Mana Per # Intelligence"),
  extractModifier(generalPlayerModTemplateList, "+# Maximum Mana"),
  extractModifier(generalPlayerModTemplateList, "+# Mana Regeneration"),
  extractModifier(generalPlayerModTemplateList, "+##% Of Maximum Mana Regeneration")
];
var playerModTemplateList = [...generalPlayerModTemplateList, ...persistentPlayerModTemplateList, ...permanentPlayerModTemplateList];

// src/game/mods/enemyModTemplates.ts
var enemyModTemplateList = [
  { desc: "#% Reduced Damage Taken", stats: [{ name: "DamageTaken", valueType: "Inc", negate: true }], id: "b1be9a" },
  { desc: "+#% Evade Chance", stats: [{ name: "Evade", valueType: "Base" }], id: "e2297b" },
  { desc: "#% More Life", stats: [{ name: "Life", valueType: "More" }], id: "fbefc9" },
  { desc: "#% Less Life", stats: [{ name: "Life", valueType: "More", negate: true }], id: "6a0379" },
  { desc: "#% Increased Life", stats: [{ name: "Life", valueType: "Inc" }], id: "3d298b" },
  { desc: "#% Reduced Life", stats: [{ name: "Life", valueType: "Inc", negate: true }], id: "7e6b87" },
  { desc: "#% Chance To Drop # @Resource On Death", stats: [{ name: "ResourceChanceOnEnemyDeath", valueType: "Base", reference: { type: "Resource" } }, { name: "ResourceAmountOnEnemyDeath", valueType: "Base", reference: { type: "Resource" } }], id: "31827b" }
];

// src/game/mods/modTemplates.ts
var worldModTemplateList = [
  ...persistentPlayerModTemplateList,
  ...combatCtxModTemplateList
];
var modTemplateList = [
  ...playerModTemplateList,
  ...enemyModTemplateList,
  ...combatCtxModTemplateList
];

// src/game/gameConfig/GameConfig.ts
var GAME_CONFIG_VERSION = "v0";
var ReferenceNames = ["Resource"];

// src/shared/utils/constants.ts
var ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

// src/shared/utils/textParsing.ts
var numberRangeRegex = /((?<min>[0-9]+(\.[0-9]+)?)([-](?<max>[0-9]+(\.[0-9]+)?))?)/;
var numberRegex = /([0-9]+(\.[0-9]+)?)/;
var integerRegex = /([0]|[1-9][0-9]+)/;
var referenceRegex = new RegExp(`@(?<type>${ReferenceNames.join("|")}){(?<name>\\w+)}`);
var costRegex = new RegExp(`(?<value>${integerRegex.source}) (?<name>\\w+)`);
var rankNumeralsRegex = new RegExp(`\\b(?<rank>${ROMAN_NUMERALS.join("|")})$`);
function parseTextValues(text) {
  try {
    const matches = [...text.matchAll(new RegExp(numberRangeRegex, "g"))];
    const values = [];
    for (const match of matches) {
      assertDefined(match.groups, `failed matching groups on mod: (${text})`);
      const { min, max } = match.groups;
      if (!min) {
        throw Error(`failed matching min value on mod: (${text})`);
      }
      values.push({
        min: parseFloat(min),
        max: parseFloat(max ?? min),
        value: parseFloat(min),
        startIndex: match.index || 0,
        text: match[0]
      });
    }
    return values;
  } catch (error) {
    console.error("parseTextValues failed", text);
  }
}
function parseTextReferences(text) {
  const match = text.match(referenceRegex);
  const groups = match?.groups;
  if (!groups) {
    return;
  }
  assertDefined(groups["type"]);
  assertDefined(groups["name"]);
  const type = ReferenceNames.find((x) => x === groups["type"]);
  assertDefined(type);
  const name = groups["name"];
  return { type, name };
}
function pluralizeWords(text) {
  text = text.replace(/\b(time)\b/gi, "$1s");
  return text;
}

// src/game/mods/Modifier.ts
var Modifier = class _Modifier {
  constructor(text, template, rangeValues, reference) {
    this.text = text;
    this.template = template;
    this.rangeValues = rangeValues;
    this.reference = reference;
  }
  weight = 0;
  get desc() {
    return _Modifier.parseDescription(this);
  }
  get values() {
    return this.rangeValues.map((x) => x.value);
  }
  extractStatModifiers() {
    const stats = [];
    for (const [index, stat] of this.template.stats.entries()) {
      const value = stat.valueType === "Flag" ? { value: 1, min: 1, max: 1, decimals: 0 } : this.rangeValues[index];
      if (!value) {
        continue;
      }
      if (this.reference) {
        stat.reference = this.reference;
      }
      const newStat = { ...stat, ...value };
      for (const tag of newStat.extends || []) {
        if (tag.type === "PerStat") {
          const value2 = this.rangeValues[tag.index || -1]?.value;
          tag.value = value2;
        }
      }
      stats.push(newStat);
    }
    return stats;
  }
  static extractStatModifierList(...items) {
    return items.flatMap((x) => x.extractStatModifiers());
  }
  static toDescription(text) {
    return this.modFromText(text).desc;
  }
  static parseDescription(mod) {
    const regex = /(@\w+|#+)/g;
    let i = 0;
    const replacer = (_, $1) => {
      if ($1.startsWith("@")) {
        assertDefined(mod.reference?.name, "mod is missing a name in reference property");
        return mod.reference.name;
      } else if ($1.startsWith("#")) {
        const rangeValue = mod.rangeValues[i++];
        assertDefined(rangeValue);
        const { value, decimalCount } = rangeValue;
        return value.toFixed(decimalCount);
      }
      throw new Error(`failed parsing mod description: (${mod.text} > ${mod.template.desc})`);
    };
    return mod.template.desc.replace(regex, replacer);
  }
  static modListFromTexts(texts) {
    return texts.map((text) => _Modifier.modFromText(text)).filter((x) => x instanceof _Modifier);
  }
  static modFromText(text) {
    const template = _Modifier.getTemplate(text);
    if (!template) {
      console.warn(`invalid mod: ${text}`);
      return _Modifier.empty();
    }
    const textValues = parseTextValues(text);
    if (!textValues) {
      return _Modifier.empty();
    }
    const valueRanges = [];
    for (const [i, valueRange] of textValues.entries()) {
      const decimalCount = Math.max(0, (template.desc.match(/#+/g)?.[i]?.length || 0) - 1);
      valueRanges.push({ ...valueRange, decimalCount });
    }
    const references = parseTextReferences(text);
    return new _Modifier(text, template, valueRanges, references);
  }
  static getTemplate(text) {
    const desc = text.replace(/@(\w+){\w+}/, "@$1").replace(/{[^}]+}/g, "#");
    return modTemplateList.find((x) => x.desc.replace(/#+/g, "#").replace(/@\w+{}/, "") === desc);
  }
  sort(other) {
    return modTemplateList.findIndex((x) => x.desc === this.template.desc) - modTemplateList.findIndex((x) => x.desc === other.template.desc);
  }
  static sort(a, b) {
    return a.sort(b);
  }
  compare(other) {
    return this.template.desc === other.template.desc;
  }
  static compare(a, b) {
    return a.compare(b);
  }
  copy() {
    const copy = _Modifier.modFromText(this.text);
    copy.setValues(this.values);
    return copy;
  }
  setValues(values) {
    if (values.length !== this.rangeValues.length) {
      console.error(`${this.template.desc} has incompatible stats`);
      return;
    }
    for (let i = 0; i < this.rangeValues.length; i++) {
      const rangeValue = this.rangeValues[i];
      if (rangeValue) {
        rangeValue.value = clamp(values[i] ?? rangeValue.min, rangeValue.min, rangeValue.max);
      }
    }
  }
  randomizeValues() {
    for (const rangeValue of this.rangeValues) {
      const pow = Math.pow(10, rangeValue.decimalCount + 1);
      const min = rangeValue.min * pow;
      const max = rangeValue.min === rangeValue.max ? min : rangeValue.max * pow + 1 * pow;
      rangeValue.value = Math.floor(randomRangeInt(min, max) / pow);
    }
  }
  static empty() {
    const template = { desc: "[Removed]", stats: [], id: "" };
    return new _Modifier(template.desc, template, []);
  }
  static serialize(...modList) {
    return modList.map((x) => ({ srcId: x.template.id, values: x.values }));
  }
  static deserialize(...modList) {
    return modList.reduce((a, c) => {
      if (!c.text) {
        return a;
      }
      const mod = _Modifier.modFromText(c.text);
      const template = _Modifier.getTemplate(c.text);
      if (template) {
        mod.setValues((c.values ?? []).filter(isNumber));
        a.push(mod);
      }
      return a;
    }, []);
  }
};

// src/game/utils/dom.ts
function createModListElement(modList) {
  sortModifiers(modList);
  const modListElement = document.createElement("ul");
  modListElement.classList.add("g-mod-list");
  modListElement.setAttribute("data-mod-list", "");
  for (const mod of modList) {
    const desc = isString(mod) ? Modifier.toDescription(mod) : mod.desc;
    modListElement.insertAdjacentHTML("beforeend", `<li>${desc}</li>`);
  }
  return modListElement;
}
function createLevelModal(opts) {
  const modal = createCustomElement(ModalElement);
  modal.classList.add("g-level-modal");
  modal.setTitle(`${opts.title} Lv.${opts.level.value.toFixed()}`);
  if (opts.info) {
    modal.body.insertAdjacentHTML("beforeend", opts.info);
  }
  const levelData = opts.levelData[opts.level.value - 1];
  assertDefined(levelData);
  if (levelData.modList) {
    const modListElement = createModListElement(levelData.modList);
    modal.body.appendChild(modListElement);
  }
  const upgradeCost = levelData.upgradeCost;
  if (upgradeCost) {
    const upgradeButton = document.createElement("button");
    let text = "Upgrade";
    if (upgradeCost.value > 0) {
      text += `
${upgradeCost.value.toFixed()} ${upgradeCost.name}`;
    }
    upgradeButton.toggleAttribute("disabled", !evalCost(upgradeCost));
    upgradeButton.textContent = text;
    upgradeButton.addEventListener("click", () => {
      subtractCost(upgradeCost);
      opts.level.add(1);
      modal.remove();
      createLevelModal(opts);
    });
    modal.body.appendChild(upgradeButton);
    const callback = () => {
      upgradeButton.toggleAttribute("disabled", !evalCost(upgradeCost));
    };
    const resource = getResourceByName(upgradeCost.name);
    resource.addListener("change", callback);
    new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry?.target === modal && !entry.isIntersecting) {
        resource.removeListener("change", callback);
      }
    }).observe(modal);
  }
}
async function fadeOut() {
  return new Promise((resolve) => {
    const fadeElement = document.createElement("div");
    fadeElement.setAttribute("data-fade", "");
    fadeElement.style.cssText = `
                position: absolute;
                inset: 0;
                background-color: black;
                z-index: 50;
                opacity: 0;
                text-align: center;
                padding-top: 5em;
            `;
    document.body.appendChild(fadeElement);
    const anim = fadeElement.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1e3, fill: "forwards" });
    anim.addEventListener("finish", () => {
      resolve();
    });
  });
}
async function fadeIn() {
  return new Promise((resolve) => {
    const fadeElement = document.body.querySelectorStrict("[data-fade]");
    const anim = fadeElement.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1e3, fill: "forwards" });
    anim.addEventListener("finish", () => {
      fadeElement.remove();
      resolve();
    });
  });
}
function createTitleElement(params) {
  const titleElement = document.createElement("div");
  titleElement.classList.add("g-title");
  if (params.levelClickCallback) {
    const span = document.createElement("span");
    span.classList.add("g-clickable-text");
    span.innerHTML = `${params.label} Lv.<var data-level>1</var>`;
    span.addEventListener("click", params.levelClickCallback);
    titleElement.appendChild(span);
  } else {
    titleElement.textContent = params.label;
  }
  if (params.helpText) {
    const helpIcon = document.createElement("div");
    helpIcon.classList.add("g-help-icon", "help-icon");
    helpIcon.textContent = "?";
    helpIcon.addEventListener("click", () => {
      const modal = createCustomElement(ModalElement);
      modal.setTitle(params.label);
      const text = isString(params.helpText) ? params.helpText : params.helpText?.() ?? "";
      modal.setBodyText(text);
    });
    titleElement.appendChild(helpIcon);
  }
  return titleElement;
}

// src/game/combat/Combat.ts
var Combat = class {
  events = {
    contextChanged: new EventEmitter(),
    enemyHit: new EventEmitter(),
    enemyDeath: new EventEmitter()
  };
  stats = createCombatStats();
  page;
  effectHandler;
  lifebarElement;
  attackWaitTime = 0;
  autoAttackLoopId;
  _ctx = null;
  constructor() {
    this.page = document.createElement("div");
    this.page.classList.add("p-combat", "hidden");
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Combat</div>');
    this.lifebarElement = game.page.querySelectorStrict("[data-combat-overview] [data-life-bar]");
    const enemyLabel = game.page.querySelectorStrict("[data-combat-overview] [data-enemy-name]");
    enemyLabel.addEventListener("click", () => {
      const modal = createCustomElement(ModalElement);
      modal.minWidth = "15em";
      modal.setTitle("Enemy Modifiers");
      modal.addBodyElement(createModListElement(this.ctx?.enemy.modList ?? []));
    });
    const effectsElement = document.createElement("fieldset");
    effectsElement.insertAdjacentHTML("beforeend", "<legend>Effects</legend>");
    effectsElement.classList.add("s-effects");
    effectsElement.insertAdjacentHTML("beforeend", '<ul class="effect-list" data-effect-list></ul>');
    this.page.appendChild(effectsElement);
    this.effectHandler = new Effects();
    game.addPage(this.page, "Combat", "combat");
    this.attackLoop = this.attackLoop.bind(this);
  }
  get ctx() {
    return this._ctx;
  }
  get enemy() {
    return this.ctx?.enemy;
  }
  processEnemyDeath() {
    assertDefined(this._ctx);
    if (game.gameConfig.resources) {
      const resources = calcEnemyResourceDrop(this._ctx.enemy, game.gameConfig.resources);
      for (const [id, value] of Object.entries(resources)) {
        game.resources[id]?.add(value ?? 0);
        statistics.updateStats("Resources");
      }
    }
    const removeBurn = player.stats.lingeringBurn.value === 0;
    const effectTypesToRemove = [...effectTypes];
    if (!removeBurn) {
      effectTypesToRemove.remove("Burn");
    }
    this.effectHandler.clearEffectsByType(effectTypesToRemove);
    this.events.enemyDeath.invoke({ ctx: this._ctx, enemy: this._ctx.enemy });
    this._ctx.next();
    if (this._ctx.completed) {
      return;
    }
    player.updateStats();
    this.stats.enemyCount.set(this._ctx.enemyCount);
    this.updateElements();
    statistics.updateStats("Combat");
  }
  updateElements() {
    this.updateLifebar();
    game.page.querySelectorStrict("[data-combat-overview] [data-enemy-name]").textContent = this._ctx?.enemy.enemyData.name ?? "unknown";
  }
  startAutoAttack() {
    const calcAttackTime = () => 1 / player.stats.attackSpeed.value;
    this.attackWaitTime = calcAttackTime();
    player.stats.attackSpeed.addListener("change", () => {
      this.attackWaitTime = calcAttackTime();
    });
    this.autoAttackLoopId = gameLoop.registerCallback(this.attackLoop);
  }
  stopAutoAttack() {
    if (this.autoAttackLoopId) {
      gameLoop.unregister(this.autoAttackLoopId);
    }
  }
  attackLoop(dt) {
    player.stats.attackTime.add(dt);
    if (player.stats.attackTime.value >= this.attackWaitTime) {
      const manaCost = player.stats.attackManaCost.value;
      if (player.stats.mana.value < manaCost) {
        return;
      }
      player.stats.mana.subtract(manaCost);
      this.performAttack();
      player.stats.attackTime.set(0);
    }
  }
  performAttack() {
    assertDefined(this._ctx);
    const enemy = this.enemy;
    assertDefined(enemy, "enemy is undefined");
    const result = calcAttack({ stats: player.stats, modDB: player.modDB }, enemy);
    if (!result) {
      return;
    }
    this.events.enemyHit.invoke({ enemy, ctx: this._ctx });
    game.stats.totalPhysicalAttackDamage.add(result.physicalDamage);
    game.stats.totalElementalAttackDamage.add(result.elementalDamage);
    game.stats.totalHitCount.add(1);
    if (result.crit) {
      game.stats.totalCriticalHitCount.add(1);
    }
    this.dealDamage(result.totalDamage);
    if (result.effects.length > 0) {
      this.effectHandler.addEffects(...result.effects);
    }
  }
  updateLifebar() {
    const life = this._ctx?.enemy?.life ?? 0;
    const maxLife = this._ctx?.enemy?.stats.maxLife.value ?? 0;
    const value = life / maxLife;
    this.lifebarElement.value = value;
  }
  updateLifebarName() {
    if (this._ctx) {
      game.page.querySelectorStrict("[data-combat-overview] [data-enemy-name]").textContent = this._ctx.enemy.enemyData.name;
    }
    game.page.querySelectorStrict("[data-combat-overview] [data-enemy]").classList.toggle("hidden", !this._ctx);
  }
  init() {
    this._ctx = null;
    statistics.createGroup("Combat", this.stats);
    this.effectHandler.init();
    gameLoopAnim.registerCallback(this.updateLifebar.bind(this), { delay: 100 });
  }
  startCombat(ctx) {
    if (this.autoAttackLoopId) {
      this.stopAutoAttack();
    }
    this._ctx = ctx;
    this._ctx.active = true;
    this.stats.maxEnemyCount.set(ctx.maxEnemyCount);
    this.stats.enemyCount.set(ctx.enemyCount);
    statistics.updateStats("Combat");
    this.updateLifebarName();
    this.updateElements();
    this.startAutoAttack();
  }
  stopCombat(ctx) {
    if (ctx !== this._ctx) {
      throw Error("cannot stop combat context as it is not the active context");
    }
    this._ctx = null;
    this.events.contextChanged.invoke({ oldCtx: ctx, newCtx: null });
    this.effectHandler.removeAllEffects();
    this.stopAutoAttack();
    this.updateLifebarName();
  }
  dealDamageOverTime(damage, type) {
    this.dealDamage(damage);
    game.stats.totalDamage.add(damage);
    const damageType = type === "Bleed" ? "Physical" : "Elemental";
    game.stats[`total${damageType}Damage`].add(damage);
    game.stats[`total${type}Damage`].add(damage);
    game.stats.totalDamage.add(damage);
    game.stats[`total${type}Damage`].add(damage);
    game.stats[`total${damageType}Damage`].add(damage);
  }
  dealDamage(damage) {
    assertDefined(this._ctx);
    this._ctx.enemy.life -= damage;
    if (this._ctx.enemy.life <= 0) {
      this.processEnemyDeath();
    }
  }
  reset() {
    this._ctx = null;
    this.effectHandler.reset();
    Object.values(this.events).forEach((x) => x.removeAllListeners());
    Object.values(this.stats).forEach((x) => x.reset());
  }
};

// src/game/components/Component.ts
var Component = class {
  constructor(name) {
    this.name = name;
    this.page = document.createElement("div");
    this.page.classList.add(`p-${name}`, "hidden");
    game.page.appendChild(this.page);
  }
  page;
};

// src/game/tasks/taskTemplates.ts
var taskTemplates = [
  { desc: "Deal # Total Physical Attack Damage", progress: (data) => data.gameStats.totalPhysicalAttackDamage.value / data.value },
  { desc: "Deal # Total Elemental Attack Damage", progress: (data) => data.gameStats.totalElementalAttackDamage.value / data.value },
  { desc: "Deal # Total Physical Damage", progress: (data) => data.gameStats.totalPhysicalDamage.value / data.value },
  { desc: "Deal # Total Elemental Damage", progress: (data) => data.gameStats.totalElementalDamage.value / data.value },
  { desc: "Deal # Total Bleed Damage", progress: (data) => data.gameStats.totalBleedDamage.value / data.value },
  { desc: "Deal # Total Burn Damage", progress: (data) => data.gameStats.totalBurnDamage.value / data.value },
  { desc: "Perform # Critical Hits", progress: (data) => data.gameStats.totalCriticalHitCount.value / data.value },
  { desc: "Regenerate # Mana", progress: (data) => data.gameStats.totalMana.value / data.value }
];

// src/game/tasks/Task.ts
var Task = class {
  text;
  desc;
  textData;
  constructor(text) {
    try {
      this.text = text;
      const extractValues = () => {
        const matches = [...text.matchAll(new RegExp(`\\{(${numberRegex.source})\\}`, "gd"))];
        return matches.map((match) => {
          const indices = match.indices?.[0];
          assertDefined(indices);
          assertDefined(match[1]);
          const value = parseFloat(match[1]);
          return { value, indices };
        });
      };
      const extractReferences = () => {
        const matches = [...text.matchAll(new RegExp(referenceRegex.source, "gd"))];
        return matches.map((match) => {
          const indices = match.indices?.[0];
          assertDefined(indices);
          assertDefined(match[2]);
          const value = match[2];
          return { value, indices };
        });
      };
      this.textData = {
        values: extractValues(),
        references: extractReferences()
      };
      this.desc = text.replace(/{[^}]+}/g, "#").replace(/@(\w+)({[^}]+})/g, "@$1");
    } catch (error) {
      console.error(error);
      throw new Error(`invalid task description: ${text}`);
    }
  }
  get completed() {
    return this.getProgess() >= 1;
  }
  get pct() {
    return Math.min(this.getProgess(), 1);
  }
  getProgess() {
    const template = taskTemplates.find((x) => x.desc === pluralizeWords(this.desc));
    assertDefined(template, "invalid description");
    const values = this.textData.values.map((x) => x.value);
    const references = this.textData.references.map((x) => x.value);
    const pct = template.progress({
      gameStats: game.stats,
      playerStats: player.stats,
      value: values[0] ?? 0,
      values,
      reference: references[0] ?? "",
      references
    });
    return pct;
  }
  createHTML() {
    let offset = 0;
    const html = [...this.textData.values, ...this.textData.references].sort((a, b) => a.indices[0] - b.indices[0]).reduce((a, c) => {
      a += this.text.substring(offset, c.indices[0]).concat(`<var data-type="${typeof c.value}">${c.value.toString()}</var>`);
      offset = c.indices[1];
      return a;
    }, "").concat(this.text.substring(offset));
    return `<div>${html}</div>`;
  }
};

// src/game/components/achievements/Achievements.ts
var Achievements = class extends Component {
  constructor(data) {
    super("achievements");
    this.data = data;
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Achievements</div>');
    this.page.insertAdjacentHTML("beforeend", '<ul class="g-scroll-list-v" data-achievement-list></ul>');
    const container = this.page.querySelectorStrict("[data-achievement-list]");
    for (const achievementData of data.achievementList) {
      const achievement = new Achievement(this, achievementData);
      container.appendChild(achievement.element);
      this.achievements.push(achievement);
    }
    setTimeout(() => {
      this.achievements.forEach((x) => {
        x.updateLabel();
        x.tryCompletion();
      });
    }, 1);
    game.tickSecondsEvent.listen(() => {
      const visible = !this.page.classList.contains("hidden");
      this.achievements.forEach((x) => {
        x.tryCompletion();
        if (visible) {
          x.updateLabel();
        }
      });
    });
  }
  achievements = [];
};
var Achievement = class {
  constructor(achievements, data) {
    this.achievements = achievements;
    this.data = data;
    this.task = new Task(data.description);
    this.element = this.createElement();
  }
  task;
  element;
  completed = false;
  get taskCompleted() {
    return this.task.completed;
  }
  tryCompletion() {
    if (!this.taskCompleted || this.completed) {
      return;
    }
    this.updateLabel();
    this.completed = true;
    this.element.querySelectorStrict("[data-pct]").setAttribute("data-valid", "");
  }
  updateLabel() {
    if (this.completed) {
      return;
    }
    this.element.querySelectorStrict("[data-pct]").textContent = `${(this.task.pct * 100).toFixed()}%`;
  }
  createElement() {
    const element = document.createElement("div");
    element.classList.add("s-achievement", "g-field");
    const textData = parseTextValues(this.task.text)?.[0];
    assertDefined(textData);
    element.insertAdjacentHTML("beforeend", this.task.createHTML());
    element.insertAdjacentHTML("beforeend", "<var data-pct></var>");
    return element;
  }
};

// src/shared/customElements/TextInputDropdownElement.ts
var TextInputDropdownElement = class extends CustomElement {
  static name = "text-input-dropdown-element";
  input;
  prevValue;
  inputAnchor = "bottom left";
  boxAnchor = "top left";
  dropdownList = [];
  abortController;
  validator = (text) => text.length > 0 ? this.dropdownList.includes(text) : true;
  onInputChange;
  onInputOpen;
  constructor() {
    super();
    this.input = document.createElement("input");
    this.input.setAttribute("spellcheck", "false");
    this.input.setAttribute("type", "text");
    this.input.addEventListener("mouseup", (e) => {
      e.stopPropagation();
      if (!this.isOpen) {
        this.openContent();
      } else {
        this.closeDropdownContentElement();
      }
    }, { capture: true });
    this.input.addEventListener("input", () => {
      for (const child of this.dropdownContentElement.children) {
        const include = child.textContent?.toLowerCase().includes(this.input.value.toLowerCase());
        child.classList.toggle("hidden", !include);
      }
    });
    this.closeDropdownContentElement = this.closeDropdownContentElement.bind(this);
    this.updateDropdownContentElementPosition = this.updateDropdownContentElementPosition.bind(this);
  }
  get validText() {
    return this.validator(this.input.value);
  }
  get dropdownContentElement() {
    return this.querySelector("[data-dropdown-content]") ?? this.createDropdownContentElement();
  }
  get isOpen() {
    return !this.dropdownContentElement.classList.contains("hidden");
  }
  createDropdownContentElement() {
    const element = document.createElement("div");
    element.classList.add("s-dropdown-content", "hidden");
    element.setAttribute("data-dropdown-content", "");
    this.appendChild(element);
    return element;
  }
  updateBackgroundState() {
    const valid = this.validator(this.input.value);
    this.setAttribute("data-state", valid ? "valid" : "invalid");
  }
  openContent() {
    this.onInputOpen?.();
    const elements = [];
    for (const item of this.dropdownList || []) {
      const li = document.createElement("li");
      li.classList.add("g-list-item");
      li.textContent = item;
      li.addEventListener("mouseup", () => {
        this.input.value = li.textContent || "";
        this.input.dispatchEvent(new Event("change", { bubbles: true }));
        this.closeDropdownContentElement();
      }, { capture: true });
      elements.push(li);
    }
    this.dropdownContentElement.replaceChildren(...elements);
    this.dropdownContentElement.classList.toggle("hidden", elements.length === 0);
    this.appendChild(this.dropdownContentElement);
    if (elements.length > 0) {
      this.abortController = new AbortController();
      this.updateDropdownContentElementPosition();
      document.addEventListener("mouseup", (e) => {
        if (e.currentTarget !== this) {
          this.closeDropdownContentElement();
        }
      }, { signal: this.abortController.signal });
    }
    this.dropdownContentElement.style.width = CSS.px(Math.max(this.clientWidth, this.dropdownContentElement.getBoundingClientRect().width)).toString();
  }
  closeDropdownContentElement(e) {
    if (e?.target instanceof Element) {
      if (this.contains(e.target)) {
        return;
      }
      if (e.target.tagName.toLowerCase() !== "input") {
        e.stopPropagation();
      }
    }
    this.dropdownContentElement.remove();
    this.abortController?.abort();
    this.updateBackgroundState();
    if (this.prevValue !== this.input.value) {
      this.prevValue = this.input.value;
      this.onInputChange?.({ text: this.input.value, index: this.dropdownList.indexOf(this.input.value), valid: this.validText });
    }
  }
  updateDropdownContentElementPosition() {
    const inputRect = this.input.getBoundingClientRect();
    const boxRect = this.dropdownContentElement.getBoundingClientRect();
    let left = inputRect.left;
    let top = inputRect.top;
    if (this.inputAnchor.includes("bottom")) {
      top += inputRect.height;
    }
    if (this.inputAnchor.includes("right")) {
      left += inputRect.width;
    }
    if (this.boxAnchor.includes("bottom")) {
      top -= boxRect.height;
    }
    if (this.boxAnchor.includes("right")) {
      left -= boxRect.width;
    }
    left = Number.isFinite(left) ? left : 0;
    top = Number.isFinite(top) ? top : 0;
    this.dropdownContentElement.style.left = CSS.px(left + 4).toString();
    this.dropdownContentElement.style.top = CSS.px(top + 6).toString();
    const newBoxRect = this.dropdownContentElement.getBoundingClientRect();
    const maxHeight = game.page.getBoundingClientRect().bottom - newBoxRect.top;
    this.dropdownContentElement.style.maxHeight = CSS.px(Number.isFinite(maxHeight) ? maxHeight : 0).toString();
  }
  init() {
    this.replaceChildren(this.input);
  }
  setReadonly(state = true) {
    this.input.toggleAttribute("readonly", state);
  }
  setInputText(text) {
    this.input.value = text ?? "";
    this.prevValue = this.input.value;
  }
  setDropdownList(items) {
    this.dropdownList = items;
    const value = items[0];
    if (!this.input.value) {
      this.setInputText(value);
    }
  }
  setInputAnchor(position) {
    this.inputAnchor = position;
    this.updateDropdownContentElementPosition();
  }
  setBoxAnchor(position) {
    this.boxAnchor = position;
    this.updateDropdownContentElementPosition();
  }
  validate() {
    this.updateBackgroundState();
  }
};

// src/game/utils/rankObjectUtils.ts
function createRankObject(data) {
  const rankData = data.rankList[0];
  assertDefined(rankData, "rankList must contain at last 1 item");
  const rankObject = {
    ...createAssignableObject(data),
    curExp: 0,
    maxExp: rankData.exp ?? 0,
    selectedRank: 1,
    curRank: 1,
    maxRank: 1,
    rankList: data.rankList,
    rankData: (rank) => {
      const rankData2 = rankObject.rankList[rank - 1];
      assertDefined(rankData2, "rank is outside the range of rankList");
      return rankData2;
    }
  };
  updateRankObjectListItemElement(rankObject);
  return rankObject;
}
function tryUnlockNextRank(rankObj) {
  if (rankObj.maxRank >= rankObj.rankList.length) {
    return false;
  }
  rankObj.maxRank = rankObj.curRank + 1;
  const data = rankObj.rankList[rankObj.maxRank - 1];
  assertDefined(data, "maxRank outside the bounds of rankList");
  rankObj.curExp = 0;
  rankObj.maxExp = data.exp ?? 0;
  updateRankObjectListItemElement(rankObj);
  return true;
}
function updateRankObjectListItemElement(rankObj) {
  const nameText = rankObj.name;
  const rankText = rankObj.rankList.length > 1 ? ` ${ROMAN_NUMERALS[rankObj.curRank - 1]}` : void 0;
  const rankIndicator = rankText && rankObj.assigned ? `${rankObj.curRank !== rankObj.maxRank ? "^" : ""}` : "";
  rankObj.element.textContent = `${nameText}${rankText}${rankIndicator}`;
  if (rankObj.assigned) {
    rankObj.element.setAttribute("data-tag", "valid");
  } else {
    rankObj.element.removeAttribute("data-tag");
  }
}
function getRankExpPct(rankObj) {
  if (rankObj.selectedRank < rankObj.maxRank) {
    return 1;
  }
  return rankObj.curExp / rankObj.maxExp;
}
function addRankExp(rankObj, multiplier) {
  if (rankObj.curExp >= rankObj.maxExp) {
    rankObj.curExp = rankObj.maxExp;
    return;
  }
  rankObj.curExp += 1 * multiplier;
  if (rankObj.curExp >= rankObj.maxExp) {
    rankObj.curExp = rankObj.maxExp;
  }
}
function createRankDropdown(rankObj, callback) {
  const element = createCustomElement(TextInputDropdownElement);
  element.setReadonly();
  const updateDropdownList = () => {
    element.setDropdownList(rankObj.rankList.slice(0, rankObj.maxRank).map((_, i) => `${rankObj.name} ${ROMAN_NUMERALS[i]}`));
    element.setInputText(`${rankObj.name} ${ROMAN_NUMERALS[rankObj.selectedRank - 1]}`);
  };
  updateDropdownList();
  element.onInputOpen = () => {
    updateDropdownList();
  };
  element.onInputChange = ({ index }) => {
    rankObj.selectedRank = index + 1;
    callback(rankObj);
  };
  return element;
}
function deserializeRankObject(rankObj, data) {
  rankObj.curRank = data.curRank ?? 1;
  rankObj.maxRank = data.maxRank ?? 1;
  rankObj.selectedRank = rankObj.curRank;
  rankObj.maxExp = rankObj.rankData(rankObj.maxRank).exp ?? 0;
  rankObj.curExp = rankObj.maxExp * (data.expFac ?? 0);
}

// src/game/utils/objectUtils.ts
function createAssignableObject(data) {
  return {
    id: data.id,
    name: data.name,
    selected: false,
    unlocked: false,
    assigned: false,
    element: createObjectListElement({ id: data.id, name: data.name })
  };
}
function createObjectListElement(obj) {
  const element = document.createElement("li");
  element.classList.add("g-list-item", "hidden");
  element.setAttribute("data-id", obj.id);
  element.textContent = obj.name;
  return element;
}
function createObjectPropertyElement(propertyList) {
  const element = document.createElement("ul");
  element.setAttribute("data-property-list", "");
  for (const [key, value] of propertyList) {
    element.insertAdjacentHTML("beforeend", `<li class="g-field"><div>${key}</div><div>${value}<div></li>`);
  }
  return element;
}
function createObjectInfoElements(objInfo) {
  const element = document.createElement("div");
  element.classList.add("g-item-info");
  element.setAttribute("data-item-info", "");
  const titleElement = document.createElement("div");
  titleElement.classList.add("g-title");
  titleElement.textContent = objInfo.name;
  const contentElement = document.createElement("div");
  contentElement.classList.add("s-content");
  contentElement.setAttribute("data-content", "");
  let rankDropdownElement = void 0;
  if (objInfo.rankObj && objInfo.onRankChange) {
    rankDropdownElement = createRankDropdown(objInfo.rankObj, objInfo.onRankChange);
  }
  const propertyListElement = objInfo.propertyList ? createObjectPropertyElement(objInfo.propertyList) : void 0;
  const modListElement = objInfo.modList ? createModListElement(objInfo.modList) : void 0;
  let expBar = void 0;
  if (objInfo.rankObj && objInfo.rankObj.rankData(objInfo.rankObj.selectedRank).exp) {
    expBar = createCustomElement(ProgressElement);
    expBar.value = getRankExpPct(objInfo.rankObj);
  }
  contentElement.append(...Object.values([rankDropdownElement, propertyListElement, modListElement, expBar].filter(isDefined)));
  element.append(titleElement, contentElement);
  return { element, titleElement, contentElement, rankDropdownElement, propertyListElement, modListElement, expBar };
}
function unlockObject(obj) {
  obj.unlocked = true;
  obj.element.classList.remove("hidden");
  obj.element.removeAttribute("disabled");
}

// src/game/components/character/SkillPage.ts
var SkillPage = class {
  selectSkill(skill) {
    this.skillList.forEach((x) => {
      x.selected = x === skill;
      x.element.classList.toggle("selected", x.selected);
    });
    if (skill) {
      this.showSkill(skill);
    } else {
      this.page.querySelector("[data-item-info]")?.replaceChildren();
    }
  }
  assignSkill(skill) {
    if (skill.assigned) {
      return;
    }
    skill.curRank = skill.selectedRank;
    skill.assigned = true;
    updateRankObjectListItemElement(skill);
  }
  unassignSkill(skill) {
    skill.assigned = false;
    skill.curRank = 1;
    updateRankObjectListItemElement(skill);
  }
};

// src/game/components/character/attackSkills/AttackSkills.ts
var AttackSkills = class extends SkillPage {
  page;
  skillList = [];
  constructor(characterLevel, data) {
    super();
    this.page = document.createElement("div");
    this.page.classList.add("p-attack-skills");
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Skill List</div>');
    this.page.insertAdjacentHTML("beforeend", '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
    this.page.insertAdjacentHTML("beforeend", "<div data-item-info></div>");
    this.skillList = data.attackSkillList.reduce((skillList, skillData) => {
      const attackSkill = {
        type: "Attack",
        ...createRankObject(skillData)
      };
      attackSkill.element.addEventListener("click", this.selectSkill.bind(this, attackSkill));
      this.page.querySelectorStrict("[data-skill-list]").appendChild(attackSkill.element);
      skillList.push(attackSkill);
      characterLevel.registerTargetValueCallback(skillData.requirements?.characterLevel ?? 1, unlockObject.bind(this, attackSkill));
      return skillList;
    }, []);
    const firstSkill = this.skillList.findStrict((x) => x.unlocked);
    assertDefined(firstSkill, "no attack skill available, at least 1 attack skill must be available");
    firstSkill.assigned = true;
    this.assignSkill(firstSkill);
    this.selectSkill(this.activeSkill);
    combat.events.enemyHit.listen(this.attackSkillExpCallback.bind(this));
  }
  get selectedSkill() {
    return this.skillList.findStrict((x) => x.selected);
  }
  get activeSkill() {
    return this.skillList.findStrict((x) => x.assigned);
  }
  get canAssignSkill() {
    return this.selectedSkill !== this.activeSkill;
  }
  showSkill(skill) {
    const rankData = skill.rankData(skill.selectedRank);
    const propertyList = [
      ["Attack Speed", rankData.attackSpeed.toFixed(2)],
      ["Attack Effectiveness", rankData.attackEffectiveness.toFixed()],
      ["Mana Cost", rankData.manaCost.toFixed()]
    ];
    const itemInfoElements = createObjectInfoElements({
      name: skill.name,
      propertyList,
      modList: rankData.modList,
      rankObj: skill,
      onRankChange: this.showSkill.bind(this)
    });
    this.page.querySelector("[data-item-info]")?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);
    const button = document.createElement("button");
    const updateButton = () => {
      let disabled = true;
      const tag = "valid";
      const label = "Assign";
      if (skill.assigned) {
        disabled = false;
        if (skill.selectedRank === skill.curRank) {
          disabled = true;
        }
      } else {
        disabled = false;
      }
      button.textContent = label;
      button.setAttribute("data-tag", tag);
      button.toggleAttribute("disabled", disabled);
    };
    button.addEventListener("click", () => {
      this.assignSkill(skill);
      updateButton();
    });
    updateButton();
    itemInfoElements.contentElement.appendChild(button);
  }
  assignSkill(skill) {
    this.unassignSkill(this.activeSkill);
    super.assignSkill(skill);
    const rankData = skill.rankList[skill.curRank - 1];
    assertDefined(rankData);
    const statModList = [
      ...Modifier.extractStatModifierList(...Modifier.modListFromTexts(rankData.modList)),
      { name: "AttackSpeed", valueType: "Base", value: rankData.attackSpeed, override: true },
      { name: "AttackManaCost", value: rankData.manaCost, valueType: "Base" }
    ];
    player.stats.attackEffectiveness.set(rankData.attackEffectiveness);
    player.modDB.replace("AttackSkill", statModList);
  }
  updateSkillInfo() {
    const expbar = this.page.querySelector(`[data-item-info] ${ProgressElement.name}`);
    if (expbar) {
      expbar.value = getRankExpPct(this.selectedSkill);
    }
  }
  attackSkillExpCallback() {
    if (this.activeSkill.curRank !== this.activeSkill.maxRank) {
      return;
    }
    addRankExp(this.activeSkill, player.stats.trainingMultiplier.value);
    if (this.activeSkill.curExp === this.activeSkill.maxExp) {
      tryUnlockNextRank(this.activeSkill);
    }
    this.updateSkillInfo();
  }
  serialize() {
    return {
      skillId: this.activeSkill.id,
      skillList: this.skillList.map((x) => ({ id: x.id, curRank: x.curRank, maxRank: x.maxRank, expFac: x.curExp / x.maxExp }))
    };
  }
  deserialize(save) {
    for (const skillData of save?.skillList?.filter(isDefined) ?? []) {
      const skill = this.skillList.find((x) => x.id === skillData?.id);
      if (!skill) {
        continue;
      }
      unlockObject(skill);
      deserializeRankObject(skill, skillData);
    }
    const activeSkill = this.skillList.find((x) => x.id === save?.skillId);
    if (activeSkill) {
      this.assignSkill(activeSkill);
    }
    this.selectSkill(this.activeSkill);
    this.updateSkillInfo();
  }
};

// src/game/components/character/auraSkills/AuraSkills.ts
var AuraSkills = class extends SkillPage {
  page;
  skillSlotList = [];
  skillList;
  constructor(characterLevel, data) {
    super();
    this.page = document.createElement("div");
    this.page.classList.add("p-aura-skills");
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Skill Slots</div>');
    this.page.insertAdjacentHTML("beforeend", '<ul class="s-skill-slot-list g-scroll-list-v" data-skill-slot-list></ul>');
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Skill List</div>');
    this.page.insertAdjacentHTML("beforeend", '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
    this.page.insertAdjacentHTML("beforeend", "<div data-item-info></div>");
    this.skillList = data.auraSkillList.reduce((skillList, skillData) => {
      const auraSkill = {
        type: "Aura",
        ...createRankObject(skillData)
      };
      auraSkill.element.addEventListener("click", this.selectSkill.bind(this, auraSkill));
      this.page.querySelectorStrict("[data-skill-list]").appendChild(auraSkill.element);
      skillList.push(auraSkill);
      characterLevel.registerTargetValueCallback(skillData.requirements?.characterLevel ?? 1, unlockObject.bind(this, auraSkill));
      return skillList;
    }, []);
    this.skillSlotList[0]?.element.click();
    if (this.skillSlotList[0]) {
      this.selectSkillSlot(this.skillSlotList[0]);
    }
    this.selectSkill(this.skillList.find((x) => x.unlocked));
    gameLoopAnim.registerCallback(() => {
      this.skillSlotList.forEach((x) => this.updateSkillSlotProgressBar(x));
    });
    player.stats.auraDurationMultiplier.addListener("change", ({ curValue }) => {
      this.skillSlotList.filter((x) => x.skill).forEach((x) => {
        const pct = x.time / x.duration;
        const rankData = x.skill?.rankList[x.skill.curRank - 1];
        assertDefined(rankData);
        const duration = (rankData.baseDuration || 0) * (curValue / 100);
        x.time = duration * pct;
        x.duration = duration;
      });
    });
    game.tickSecondsEvent.listen(() => {
      this.skillSlotList.map((x) => x.skill).filter((x) => x?.type === "Aura").forEach((x) => this.auraSkillExpCallback(x));
    });
    player.stats.maxAura.addListener("change", this.updateSkillSlots.bind(this));
    this.updateSkillSlots();
  }
  get selectedSkillSlot() {
    return this.skillSlotList.find((x) => x.selected);
  }
  get selectedSkill() {
    return this.skillList.find((x) => x.selected);
  }
  updateSkillSlots() {
    const count = player.stats.maxAura.value - this.skillSlotList.length;
    for (let i = 0; i < count; i++) {
      this.createSkillSlot();
    }
    if (!this.selectedSkillSlot && this.skillSlotList[0]) {
      this.selectSkillSlot(this.skillSlotList[0]);
    }
  }
  createSkillSlot() {
    const element = this.createSkillSlotElement();
    const progressBar = element.querySelectorStrict(ProgressElement.name);
    const slot = {
      selected: false,
      element,
      progressBar,
      skill: null,
      time: 0,
      duration: 0
    };
    slot.element.addEventListener("click", this.selectSkillSlot.bind(this, slot));
    this.skillSlotList.push(slot);
    this.page.querySelectorStrict("[data-skill-slot-list]").appendChild(element);
  }
  createSkillSlotElement() {
    const element = document.createElement("li");
    element.classList.add("skill-slot");
    element.setAttribute("data-skill-slot", "");
    const title = document.createElement("div");
    title.classList.add("s-title");
    title.insertAdjacentHTML("beforeend", "<span data-skill-name>[Empty Slot]</span>");
    element.appendChild(title);
    const progressBar = createCustomElement(ProgressElement);
    progressBar.classList.add("progress-bar");
    element.appendChild(progressBar);
    return element;
  }
  selectSkillSlot(skillSlot) {
    if (skillSlot?.skill && skillSlot.selected) {
      skillSlot.skill.element.click();
    }
    this.skillSlotList.forEach((x) => x.selected = x === skillSlot);
    this.skillSlotList.forEach((x) => x.element.classList.toggle("selected", x === skillSlot));
    if (this.selectedSkill) {
      this.showSkill(this.selectedSkill);
    }
  }
  updateSkillSlotProgressBar(skillSlot) {
    const skill = skillSlot.skill;
    if (!skill) {
      return;
    }
    const rankData = skill.rankList[skill.curRank - 1];
    assertDefined(rankData);
    skillSlot.progressBar.value = (skillSlot.time || 0) / (rankData.baseDuration || 1);
  }
  clearSkillSlot(skillSlot) {
    if (!skillSlot.skill) {
      return;
    }
    this.stopActiveSkill(skillSlot);
    super.unassignSkill(skillSlot.skill);
    skillSlot.element.classList.remove("m-has-skill");
    skillSlot.element.querySelectorStrict("[data-skill-name]").textContent = "[Empty Slot]";
    skillSlot.progressBar.value = 0;
    skillSlot.skill.assigned = false;
    skillSlot.skill = null;
  }
  startActiveSkill(skillSlot) {
    assertNonNullable(skillSlot.skill, "skill slot contains no skill");
    assertNullable(skillSlot.loopId);
    const callbackId = gameLoop.registerCallback(() => {
      if (!skillSlot.skill || skillSlot.loopId) {
        gameLoop.unregister(callbackId);
        return;
      }
      const manaCost = skillSlot.skill.rankData(skillSlot.skill.curRank).manaCost;
      const sufficientMana = manaCost <= player.stats.mana.value;
      if (!sufficientMana) {
        return;
      }
      gameLoop.unregister(callbackId);
      player.stats.mana.subtract(manaCost);
      skillSlot.time = skillSlot.skill.rankData(skillSlot.skill.curRank).baseDuration * player.stats.auraDurationMultiplier.value;
      this.triggerSkillInSlot(skillSlot);
    });
  }
  triggerSkillInSlot(skillSlot) {
    assertNonNullable(skillSlot.skill);
    assertNullable(skillSlot.loopId);
    this.applySkillModifiers(skillSlot.skill);
    skillSlot.loopId = gameLoop.registerCallback(this.processActiveSkill.bind(this, skillSlot));
  }
  processActiveSkill(skillSlot, dt) {
    if (!skillSlot.skill) {
      return;
    }
    if (skillSlot.time <= 0) {
      skillSlot.time = 0;
      this.stopActiveSkill(skillSlot);
      this.startActiveSkill(skillSlot);
      return;
    }
    skillSlot.time -= dt;
  }
  stopActiveSkill(skillSlot) {
    if (skillSlot.loopId) {
      gameLoop.unregister(skillSlot.loopId);
    }
    skillSlot.loopId = null;
    if (skillSlot.skill) {
      this.removeSkillModifiers(skillSlot.skill);
    }
    skillSlot.time = 0;
    this.updateSkillSlotProgressBar(skillSlot);
  }
  showSkill(skill) {
    const rankData = skill.rankData(skill.selectedRank);
    const propertyList = [
      ["Duration", rankData.baseDuration.toFixed()],
      ["Mana Cost", rankData.manaCost.toFixed()]
    ];
    const itemInfoElements = createObjectInfoElements({
      name: skill.name,
      propertyList,
      modList: rankData.modList,
      rankObj: skill,
      onRankChange: (item) => this.showSkill(item)
    });
    this.page.querySelector("[data-item-info]")?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);
    const updateButton = () => {
      let disabled = true;
      let tag = "valid";
      let label = "Assign";
      if (skill.assigned) {
        disabled = false;
        if (skill.selectedRank === skill.curRank) {
          disabled = false;
          tag = "invalid";
          label = "Remove";
        }
      } else {
        disabled = false;
      }
      button.textContent = label;
      button.toggleAttribute("disabled", disabled);
      button.setAttribute("data-tag", tag);
    };
    const button = document.createElement("button");
    button.addEventListener("click", () => {
      if (this.selectedSkillSlot?.skill === skill) {
        if (skill.selectedRank === skill.curRank) {
          this.clearSkillSlot(this.selectedSkillSlot);
        } else {
          this.assignAuraSkillSlot(this.selectedSkillSlot, skill);
          this.startActiveSkill(this.selectedSkillSlot);
        }
      } else if (this.selectedSkillSlot) {
        this.assignAuraSkillSlot(this.selectedSkillSlot, skill);
        this.startActiveSkill(this.selectedSkillSlot);
      }
      updateButton();
    });
    updateButton();
    itemInfoElements.contentElement.appendChild(button);
  }
  updateSkillInfo() {
    if (!this.selectedSkill) {
      return;
    }
    const expbar = this.page.querySelector(`[data-item-info] ${ProgressElement.name}`);
    if (expbar) {
      expbar.value = getRankExpPct(this.selectedSkill);
    }
  }
  assignAuraSkillSlot(skillSlot, skill) {
    if (skillSlot.skill) {
      this.clearSkillSlot(skillSlot);
    }
    super.assignSkill(skill);
    skillSlot.element.querySelectorStrict("[data-skill-name]").textContent = `${skill.name} ${ROMAN_NUMERALS[skill.curRank - 1]}`;
    skillSlot.element.classList.add("m-has-skill");
    skillSlot.skill = skill;
    skillSlot.duration = skill.rankData(skill.curRank).baseDuration;
  }
  applySkillModifiers(skill) {
    const modList = Modifier.modListFromTexts(skill.rankData(skill.curRank).modList);
    player.modDB.add(`AuraSkill/${skill.name}`, Modifier.extractStatModifierList(...modList));
  }
  removeSkillModifiers(skill) {
    player.modDB.removeBySource(`AuraSkill/${skill.name}`);
  }
  auraSkillExpCallback(auraSkill) {
    if (auraSkill.curRank !== auraSkill.maxRank) {
      return;
    }
    addRankExp(auraSkill, player.stats.trainingMultiplier.value + player.stats.meditationMultiplier.value);
    if (auraSkill.curExp === auraSkill.maxExp) {
      tryUnlockNextRank(auraSkill);
    }
    this.updateSkillInfo();
  }
  serialize() {
    return {
      skillList: this.skillList.filter((x) => x.unlocked).map((x) => {
        const data = {
          id: x.id,
          curRank: x.curRank,
          maxRank: x.maxRank,
          expFac: x.curExp / x.maxExp
        };
        const skillSlot = this.skillSlotList.find((slot) => slot.skill === x);
        if (skillSlot) {
          data.skillSlot = {
            index: this.skillSlotList.indexOf(skillSlot),
            timePct: skillSlot.time / skillSlot.duration
          };
        }
        return data;
      })
    };
  }
  deserialize(save) {
    for (const skillData of save?.skillList?.filter(isDefined) || []) {
      const skill = this.skillList.find((x) => x.id === skillData?.id);
      if (skill) {
        unlockObject(skill);
        deserializeRankObject(skill, skillData);
        if (skillData.skillSlot) {
          const skillSlot2 = this.skillSlotList[skillData.skillSlot.index ?? -1];
          if (!skillSlot2) {
            continue;
          }
          this.assignAuraSkillSlot(skillSlot2, skill);
          const timePct = skillData.skillSlot.timePct ?? 0;
          skillSlot2.time = skillSlot2.duration * (timePct ?? 0);
          if (timePct > 0) {
            skillSlot2.time = skillSlot2.duration * (timePct || 0);
            this.triggerSkillInSlot(skillSlot2);
          } else {
            this.startActiveSkill(skillSlot2);
          }
        }
      }
    }
    const skillSlot = this.skillSlotList[0];
    skillSlot?.element.click();
    if (!skillSlot || !skillSlot.skill) {
      this.skillList.find((x) => x.unlocked)?.element.click();
    }
  }
};

// src/game/components/character/passiveSkills/PassiveSkills.ts
var Passives = class extends SkillPage {
  constructor(characterLevel, data) {
    super();
    this.data = data;
    this.page = document.createElement("div");
    this.page.classList.add("p-passive-skills");
    const toolbarElement = document.createElement("div");
    toolbarElement.classList.add("s-toolbar", "g-toolbar");
    const insightElement = document.createElement("div");
    insightElement.classList.add("s-insight", "g-clickable-text");
    insightElement.insertAdjacentHTML("beforeend", "<span>Insight: <var data-insight></var></span>");
    insightElement.addEventListener("click", () => {
      const modal = createCustomElement(ModalElement);
      modal.classList.add("insight-capacity-enhancer");
      modal.setTitle("Insight Capacity");
      modal.body.insertAdjacentHTML("beforeend", `<div style="text-align: center;">Insight: ${this.insightRemaining}/${this.insightCapacityEnhancerList.filter((x) => x.obtained).reduce((a, c) => a += c.insight, 0)}</div>`);
      const table = document.createElement("table");
      const tBody = document.createElement("tbody");
      const map = this.insightCapacityEnhancerList.reduce((a, c) => {
        const item = a.get(c.name) ?? { name: c.name, curCount: 0, maxCount: 0 };
        item.curCount += Number(c.obtained);
        item.maxCount++;
        a.set(c.name, item);
        return a;
      }, /* @__PURE__ */ new Map());
      for (const [name, data2] of map) {
        tBody.insertAdjacentHTML("beforeend", `<tr><td>${name}</td><td>${data2.curCount}/${data2.maxCount}</td></tr>`);
      }
      table.appendChild(tBody);
      modal.body.appendChild(table);
      this.page.appendChild(modal);
    });
    toolbarElement.appendChild(insightElement);
    const clearElement = document.createElement("span");
    clearElement.classList.add("g-clickable-text", "clear");
    clearElement.textContent = "Clear";
    clearElement.addEventListener("click", this.clearPassives.bind(this));
    toolbarElement.appendChild(clearElement);
    this.page.appendChild(toolbarElement);
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Passive List</div>');
    this.page.insertAdjacentHTML("beforeend", '<ul class="s-skill-list g-scroll-list-v" data-skill-list></ul>');
    this.page.insertAdjacentHTML("beforeend", "<div data-item-info></div>");
    this.insightCapacityEnhancerList = data.insightCapacityEnhancerList.map((x) => ({ ...x, obtained: false }));
    this.skillList = data.passiveSkillList.reduce((skillList, skillData) => {
      const passiveSkill = {
        type: "Passive",
        insightCost: skillData.insightCost,
        ...createRankObject(skillData)
      };
      passiveSkill.element.addEventListener("click", this.selectSkill.bind(this, passiveSkill));
      this.page.querySelectorStrict("[data-skill-list]").appendChild(passiveSkill.element);
      skillList.push(passiveSkill);
      characterLevel.registerTargetValueCallback(skillData.requirements?.characterLevel ?? 1, unlockObject.bind(this, passiveSkill));
      return skillList;
    }, []);
    this.selectSkill(this.skillList.find((x) => x.unlocked));
    this.updateInsightValueElement();
    game.tickSecondsEvent.listen(this.passiveSkillExpCallback.bind(this));
    combat.events.enemyDeath.listen(this.tryGetInsightCapacityEnhancer.bind(this));
    player.stats.insightCapacity.addListener("change", () => {
      this.updateInsightValueElement();
    });
  }
  page;
  skillList;
  insightCapacityEnhancerList;
  get selectedPassive() {
    return this.skillList.findStrict((x) => x.selected);
  }
  get insightRemaining() {
    return player.stats.insightCapacity.value - this.insightAllocated;
  }
  get insightAllocated() {
    return this.skillList.filter((x) => x.assigned).map((x) => x.insightCost).reduce((a, b) => a += b, 0);
  }
  updateInsightValueElement() {
    this.page.querySelectorStrict("[data-insight]").textContent = this.insightRemaining.toFixed();
  }
  showSkill(passive) {
    const propertyList = [];
    propertyList.push(["Insight", passive.insightCost.toFixed()]);
    const itemInfoElements = createObjectInfoElements({
      name: passive.name,
      propertyList,
      modList: passive.rankData(passive.selectedRank).modList,
      rankObj: passive,
      onRankChange: (item) => this.showSkill(item)
    });
    this.page.querySelector("[data-item-info]")?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);
    const button = document.createElement("button");
    const updateButton = () => {
      let disabled = true;
      let tag = "valid";
      let label = "Allocate";
      if (passive.assigned) {
        disabled = false;
        if (passive.selectedRank === passive.curRank) {
          tag = "invalid";
          label = "Deallocate";
        }
      } else if (passive.insightCost <= this.insightRemaining) {
        disabled = false;
      }
      button.textContent = label;
      button.setAttribute("data-tag", tag);
      button.toggleAttribute("disabled", disabled);
    };
    button.addEventListener("click", () => {
      if (passive.assigned) {
        if (passive.selectedRank !== passive.curRank) {
          this.unassignSkill(passive);
          this.assignSkill(passive);
        } else {
          this.unassignSkill(passive);
        }
      } else {
        this.assignSkill(passive);
      }
      updateButton();
    });
    updateButton();
    itemInfoElements.contentElement.appendChild(button);
  }
  updatePassiveInfo() {
    if (!this.selectedPassive) {
      return;
    }
    const expbar = this.page.querySelector(`[data-item-info] ${ProgressElement.name}`);
    if (expbar) {
      expbar.value = getRankExpPct(this.selectedPassive);
    }
  }
  applyInsightCapacityEnhancersAsModifiers() {
    const list = this.insightCapacityEnhancerList.filter((x) => x.obtained);
    player.modDB.replace("Passive/InsightCapacityEnhancer", list.map((x) => ({ name: "Insight", value: x.insight, valueType: "Base" })));
  }
  assignSkill(passive) {
    super.assignSkill(passive);
    this.updateInsightValueElement();
    const rankData = passive.rankList[passive.curRank - 1];
    assertDefined(rankData);
    player.modDB.add(`Passive/${passive.name}`, Modifier.extractStatModifierList(...Modifier.modListFromTexts(rankData.modList)));
    this.fixNegativeInsightRemaining();
  }
  unassignSkill(passive) {
    super.unassignSkill(passive);
    this.updateInsightValueElement();
    player.modDB.removeBySource(`Passive/${passive.name}`);
  }
  fixNegativeInsightRemaining() {
    if (this.insightRemaining >= 0) {
      return;
    }
    const passive = this.skillList.findLast((x) => x.assigned);
    assertDefined(passive, "cannot have negative insight without any allocated passives");
    this.unassignSkill(passive);
    this.fixNegativeInsightRemaining();
  }
  tryGetInsightCapacityEnhancer() {
    const candidates = this.insightCapacityEnhancerList.filter((x) => !x.obtained);
    const candidate = pickOneFromPickProbability(candidates);
    if (!candidate) {
      return;
    }
    candidate.obtained = true;
    this.applyInsightCapacityEnhancersAsModifiers();
    setTimeout(() => {
      this.updateInsightValueElement();
      this.selectSkill(this.selectedPassive);
    }, 100);
    const skillsPage = this.page.closest('[data-page-content="character"]');
    assertNonNullable(skillsPage);
    notifications.addNotification({
      title: `${candidate.name}`,
      description: "Your insight has been increased"
    });
  }
  clearPassives() {
    this.skillList.filter((x) => x.assigned).forEach((x) => this.unassignSkill(x));
    if (this.selectedPassive) {
      this.showSkill(this.selectedPassive);
    }
  }
  passiveSkillExpCallback() {
    const passives = this.skillList.filter((x) => x.assigned && x.curExp < x.maxExp);
    for (const passive of passives) {
      if (passive.curRank !== passive.maxRank) {
        return;
      }
      addRankExp(passive, player.stats.meditationMultiplier.value);
      if (passive.curExp === passive.maxExp) {
        tryUnlockNextRank(passive);
      }
    }
    this.updatePassiveInfo();
  }
  serialize() {
    return {
      insightCapacityEnhancerList: this.insightCapacityEnhancerList.filter((x) => x.obtained).map((x) => ({ id: x.id })),
      passiveList: this.skillList.filter((x) => x.unlocked).map((x) => ({ id: x.id, allocated: x.assigned, curRank: x.curRank, maxRank: x.maxRank, expFac: x.curExp / x.maxExp }))
    };
  }
  deserialize(save) {
    for (const data of save?.insightCapacityEnhancerList?.filter(isDefined) || []) {
      const insightCapacityEnhancer = this.insightCapacityEnhancerList.find((x) => x.id === data.id);
      if (!insightCapacityEnhancer) {
        continue;
      }
      insightCapacityEnhancer.obtained = true;
    }
    this.applyInsightCapacityEnhancersAsModifiers();
    player.updateStatsDirect();
    for (const data of save?.passiveList?.filter(isDefined) || []) {
      const passive = this.skillList.find((x) => x.id === data?.id);
      if (!passive) {
        continue;
      }
      unlockObject(passive);
      deserializeRankObject(passive, data);
      if (data.allocated && passive.insightCost <= this.insightRemaining) {
        this.assignSkill(passive);
      }
    }
    this.selectSkill(this.skillList.find((x) => x.assigned) ?? this.skillList.find((x) => x.unlocked));
  }
};

// src/shared/customElements/TabMenuElement.ts
var TabMenuElement = class _TabMenuElement extends CustomElement {
  static name = "tab-menu-element";
  pageList = [];
  init() {
    this.setDirection("vertical");
    this.classList.add("g-scroll-list-v");
  }
  setDirection(dir) {
    this.setAttribute("data-direction", dir);
  }
  appendMenuItem(menuItem, id) {
    menuItem.classList.add("g-list-item");
    this.appendChild(menuItem);
    menuItem.addEventListener("click", () => {
      this.querySelectorAll("[data-page-target]").forEach((x) => {
        x.classList.toggle("selected", x === menuItem);
        x.toggleAttribute("disabled", x === menuItem);
      });
      this.pageList.forEach((x) => x.classList.toggle("hidden", x.getAttribute("data-page-content") !== id));
    });
  }
  addMenuItem(label, id, index) {
    const element = document.createElement("li");
    element.textContent = label;
    element.setAttribute("data-page-target", id);
    index = index ?? this.children.length;
    element.setAttribute("data-index", index.toFixed());
    this.appendMenuItem(element, id);
    return element;
  }
  removeMenuItem(item) {
    this.pageList = this.pageList.filter((x) => x.getAttribute("data-page-content") !== item.getAttribute("data-page-target"));
  }
  registerPageElement(pageElement, id) {
    pageElement.classList.add("hidden");
    pageElement.setAttribute("data-page-content", id);
    this.pageList.push(pageElement);
    if (!this.querySelector(".selected")) {
      this.querySelector(`[data-page-target="${id}"]`)?.click();
    }
  }
  getMenuItemById(id) {
    return this.querySelector(`[data-page-target="${id}"]`);
  }
  sort() {
    const comparer = (a, b) => a.getAttribute("data-index")?.localeCompare(b.getAttribute("data-index") || "", void 0, { numeric: true }) || 0;
    this.append(...[...this.querySelectorAll("li")].sort(comparer));
  }
  *generateTabMenuAnectors(from, targetPageName = "") {
    if (!from) {
      return;
    }
    if (targetPageName.length > 0) {
      const menu = from.querySelector(`:scope > ${_TabMenuElement.name}`);
      if (menu) {
        const menuItem = menu.querySelector(`[data-page-target="${targetPageName}"]`);
        if (menuItem) {
          yield [menuItem, from];
        }
      }
    }
    if (from.hasAttribute("data-page-content")) {
      targetPageName = from.getAttribute("data-page-content") ?? targetPageName;
    }
    const next = from.parentElement ?? from.nextElementSibling;
    return yield* this.generateTabMenuAnectors(next, targetPageName);
  }
};

// src/game/mods/ModDB.ts
var ModDB = class {
  mods;
  onChange = new EventEmitter();
  constructor(modDB) {
    this.mods = modDB ? new Map(modDB.mods) : /* @__PURE__ */ new Map();
  }
  getModListByName(name) {
    return [...this.mods.get(name) || []];
  }
  extractAllMods() {
    return [...this.mods.values()].flatMap((x) => x);
  }
  add(source, statModList) {
    this.addModList(source, statModList);
    this.onChange.invoke(void 0);
  }
  removeBySource(source) {
    this.remove(source);
    this.onChange.invoke(void 0);
  }
  replace(source, statModList) {
    this.remove(source);
    this.add(source, statModList);
  }
  clear() {
    this.mods.clear();
    this.onChange.removeAllListeners();
  }
  addModList(source, statModList) {
    for (const mod of statModList) {
      let arr = this.mods.get(mod.name);
      if (!arr) {
        arr = [];
        this.mods.set(mod.name, arr);
      }
      arr.push({
        ...mod,
        source
      });
    }
  }
  remove(source) {
    for (const [name, arr] of this.mods) {
      this.mods.set(name, arr.filter((x) => x.source !== source));
    }
  }
};

// src/config.ts
var ENVIRONMENT = "production";
function resolveGamePathFromVersion(version, filename) {
  return `dist/game_${version}/${filename}`;
}

// src/game/Player.ts
var Player = class {
  onStatsChange = new EventEmitter();
  modDB = new ModDB();
  stats = createPlayerStats(game.stats);
  manaBar;
  statUpdatePending = false;
  constructor() {
    this.manaBar = game.page.querySelectorStrict("[data-combat-overview] [data-mana-bar]");
  }
  init() {
    statistics.createGroup("Player", this.stats);
    this.modDB.onChange.listen(this.updateStats.bind(this));
    if (game.gameConfig.playerStartModList) {
      const statModifiers = Modifier.extractStatModifierList(...Modifier.modListFromTexts(game.gameConfig.playerStartModList));
      this.modDB.add("Player", statModifiers);
    }
    this.stats.mana.addListener("change", (mana) => {
      const maxMana = this.stats.maxMana.value;
      if (mana.curValue > maxMana) {
        this.stats.mana.set(maxMana, true);
      }
    });
    gameLoop.registerCallback((dt) => {
      const manaRegen = this.stats.manaRegeneration.value * dt;
      this.stats.mana.add(manaRegen);
    });
    gameLoopAnim.registerCallback(() => this.updateManaBar());
  }
  reset() {
    this.statUpdatePending = false;
    this.onStatsChange.removeAllListeners();
    this.modDB.clear();
    Object.values(this.stats).forEach((x) => x.reset());
  }
  setup() {
    if (!this.stats.guildClass.texts) {
      this.stats.guildClass.options.label = void 0;
    }
    this.updateStatsDirect();
    if (this.stats.mana.value === Infinity) {
      this.stats.mana.set(this.stats.maxMana.value);
    }
    this.updateManaBar();
  }
  updateManaBar() {
    if (this.stats.maxMana.value <= 0) {
      return;
    }
    const value = this.stats.mana.value / this.stats.maxMana.value;
    this.manaBar.value = value;
  }
  updateStats() {
    if (this.statUpdatePending) {
      return;
    }
    this.statUpdatePending = true;
    if (ENVIRONMENT === "development" && gameLoop.state === "Stopped" && game.initializationStage === 4 /* Done */) {
      this.updateStatsDirect();
      statistics.updateStats("Player");
      this.statUpdatePending = false;
      return;
    }
    gameLoop.registerCallback(() => {
      this.statUpdatePending = false;
      this.updateStatsDirect();
      this.onStatsChange.invoke(void 0);
    }, { once: true });
  }
  updateStatsDirect(updateFlags = 3 /* All */) {
    const playerOptions = {
      modDB: this.modDB,
      stats: extractStats(this.stats)
    };
    if (hasAnyFlag(updateFlags, 1 /* Combat */)) {
      const result = calcPlayerCombatStats(playerOptions);
      applyStatValues(this.stats, result);
    }
    if (hasAnyFlag(updateFlags, 2 /* Persistent */)) {
      const result = calcPlayerPersistantStats(playerOptions);
      applyStatValues(this.stats, result);
    }
    statistics.updateStats("Player");
  }
  serialize(save) {
    save.player = { stats: serializeStats(this.stats) };
  }
  deserialize({ player: save }) {
    const stats = save?.stats;
    if (stats) {
      deserializeStats(this.stats, stats);
    }
    this.updateStatsDirect();
  }
};

// src/game/components/character/Character.ts
var Character = class extends Component {
  constructor(data) {
    super("character");
    this.data = data;
    const titleElement = createTitleElement({
      label: "Character",
      levelClickCallback: data.levelList ? this.openCharacterLevelModal.bind(this) : void 0,
      helpText: this.getHelpText.bind(this)
    });
    this.page.appendChild(titleElement);
    const menu = createCustomElement(TabMenuElement);
    menu.classList.add("s-menu");
    menu.setDirection("horizontal");
    this.page.appendChild(menu);
    if (data.attackSkills) {
      this.attackSkills = new AttackSkills(this.level, data.attackSkills);
      menu.addMenuItem("Attack", "attack", 0);
      menu.registerPageElement(this.attackSkills.page, "attack");
      this.page.append(this.attackSkills.page);
    }
    const auraSkillsData = data.auraSkills;
    if (auraSkillsData) {
      this.level.registerTargetValueCallback(auraSkillsData.requirements?.characterLevel ?? 1, () => {
        this.auraSkills = new AuraSkills(this.level, auraSkillsData);
        menu.addMenuItem("Aura", "aura", 1);
        menu.registerPageElement(this.auraSkills.page, "aura");
        menu.sort();
        this.page.append(this.auraSkills.page);
      });
    }
    if (data.passiveSkills) {
      this.passiveSkills = new Passives(this.level, data.passiveSkills);
      menu.addMenuItem("Passive", "passive", 2);
      menu.registerPageElement(this.passiveSkills.page, "passive");
      this.page.appendChild(this.passiveSkills.page);
    }
    this.updateCharacterLevel();
    this.level.addListener("change", this.updateCharacterLevel.bind(this));
  }
  attackSkills;
  auraSkills;
  passiveSkills;
  level = new Value(1);
  getHelpText() {
    return `
        [Attack]
        Attack skills contains two base stats not available anywhere else, Attack speed and Attack effectiveness.
        Attack speed determines your base attack speed.
        Attack Effectiveness determines the base damage of both attacks and damage over time.
        ${this.auraSkills ? `
        [Aura]
        Aura skills are temporary buffs. They cost mana and they last for a duration.
        ` : ""}
        [Passive]
        Passives requires insight. You gain insight by killing enemies and collecting insight capacity items.`;
  }
  openCharacterLevelModal() {
    assertDefined(this.data.levelList);
    createLevelModal({
      title: "Character",
      level: this.level,
      levelData: this.data.levelList
    });
  }
  updateCharacterLevel() {
    if (!this.data.levelList) {
      return;
    }
    this.page.querySelectorStrict("[data-level]").textContent = this.level.value.toFixed();
    const modList = this.data.levelList[this.level.value - 1]?.modList ?? [];
    player.modDB.replace("Character", Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
    player.updateStatsDirect(2 /* Persistent */);
  }
  serialize(save) {
    save.character = {
      level: this.level.value,
      attackSkills: this.attackSkills?.serialize(),
      auraSkills: this.auraSkills?.serialize(),
      passiveSkills: this.passiveSkills?.serialize()
    };
  }
  deserialize({ character: save }) {
    if (isNumber(save?.level)) {
      this.level.set(save.level);
    }
    if (save?.attackSkills) {
      this.attackSkills?.deserialize(save.attackSkills);
    }
    if (save?.auraSkills) {
      this.auraSkills?.deserialize(save.auraSkills);
    }
    if (save?.passiveSkills) {
      this.passiveSkills?.deserialize(save.passiveSkills);
    }
  }
};

// src/game/components/blacksmith/craftTemplates.ts
var craftTemplates = [
  { desc: "Reforge item with new random modifiers", type: "Reforge", target: "All", id: "44f6fd" },
  { desc: "Add new modifier", type: "Add", target: "All", id: "0488a4" },
  { desc: "Remove modifier", type: "Remove", target: "Single", id: "a4f8f8" },
  { desc: "Upgrade modifier", type: "Upgrade", target: "Single", id: "1f89b1" },
  { desc: "Randomize numerical values of a modifier", type: "Randomize Numericals", target: "Single", id: "2eb926" },
  { desc: "Randomize all numerical values", type: "Randomize Numericals", target: "All", id: "5d2686" }
];
var devCraftTemplates = [
  { desc: "[Dev] Reforge High DPS", type: "Reforge", target: "All", id: "22dc2d" }
];

// src/game/components/blacksmith/CraftManager.ts
var CraftManager = class _CraftManager {
  static reforge(candidateModList, weights) {
    const reforgeModCount = getRandomWeightedIndex(weights) + 1;
    const newModList = _CraftManager.generateMods([], candidateModList, reforgeModCount);
    return newModList;
  }
  static addModifier(modList, candidateModList) {
    const mod = this.generateMods(modList, candidateModList, 1)[0];
    assertDefined(mod, "failed generating modifier");
    return mod;
  }
  static upgradeModifier(mod, modGroupsList) {
    const modGroup = getModGroupList(mod.text, modGroupsList);
    const index = modGroup.findIndex((x) => x.text === mod.text) + 1;
    const modText = modGroup[index]?.text;
    assertDefined(modText, "failed upgrading modifier. index out of range");
    const newMod = Modifier.modFromText(modText);
    newMod.randomizeValues();
    return newMod;
  }
  static calcSuccessRate(craft, ctx, mod) {
    const type = craft.template.type;
    if (type === "Add") {
      return remap(ctx.maxModCount - 1, 1, craft.successRates.min, craft.successRates.max, ctx.modList.length);
    }
    if (type === "Remove") {
      assertDefined(mod);
      return remap(ctx.maxModCount, 1, craft.successRates.min, craft.successRates.max, ctx.modList.length);
    }
    if (type === "Upgrade") {
      assertDefined(mod);
      const modGroup = getModGroupList(mod.text, ctx.modGroupsList, ctx.filterName);
      const tier = calcModTier(mod.text, modGroup);
      const minChance = modGroup.length === 1 ? craft.successRates.max : craft.successRates.min;
      const maxChance = craft.successRates.max;
      return remap(2, modGroup.length, minChance, maxChance, tier);
    }
    if (type === "Randomize Numericals") {
      if (craft.template.target === "Single") {
        assertDefined(mod);
        const modGroup = getModGroupList(mod.text, ctx.modGroupsList, ctx.filterName);
        const tier = calcModTier(mod.text, modGroup);
        const minChance = modGroup.length === 1 ? craft.successRates.max : craft.successRates.min;
        const maxChance = craft.successRates.max;
        return remap(tier, modGroup.length, minChance, maxChance, modGroup.length);
      } else if (craft.template.target === "All") {
        return remap(1, ctx.maxModCount, craft.successRates.min, craft.successRates.max, ctx.modList.length);
      }
    }
    return 100;
  }
  static generateMods(itemModList, candidateModList, count) {
    const tagWeightMultiplier = 2;
    const tagWeights = ModifierTagList.reduce((a, c) => {
      a[c] = 1;
      return a;
    }, {});
    const addTagWeight = (mod) => createModTags(mod.template.stats).forEach((x) => tagWeights[x] *= tagWeightMultiplier);
    itemModList.forEach((x) => addTagWeight(x));
    const newModList = [];
    for (let i = 0; i < count; i++) {
      candidateModList = candidateModList.filter((x) => !itemModList.concat(newModList).some((y) => x.template.desc === y.template.desc));
      if (candidateModList.length === 0) {
        return [];
      }
      const candidateCopyList = candidateModList.map((x) => {
        const tags = createModTags(x.template.stats);
        const weight = tags.reduce((a, c) => a *= tagWeights[c], x.weight);
        return { ...x, weight };
      });
      const candidate = getRandomWeightedItem(candidateCopyList);
      if (!candidate) {
        continue;
      }
      const mod = Modifier.modFromText(candidate.text);
      mod.randomizeValues();
      addTagWeight(mod);
      newModList.push(mod);
    }
    return newModList;
  }
};

// src/game/mods/ModifierInfoPopup.ts
var ModifierInfoPopup = class {
  constructor(mod, additionalProperties = []) {
    this.mod = mod;
    this.additionalProperties = additionalProperties;
    const modal = createCustomElement(ModalElement);
    modal.minWidth = "10em";
    modal.setTitle("Modifier Info");
    const body = document.createElement("div");
    body.style.textAlign = "left";
    this.addTags(body, [...createModTags(mod.template.stats)]);
    this.addAdditionalProperties(body, additionalProperties);
    this.addDesc(body, mod);
    modal.body.appendChild(body);
  }
  addTags(body, tags) {
    body.insertAdjacentHTML("beforeend", `<div>Tags: ${tags.map((x) => getFormattedTag(x)).join(", ")}</div>`);
  }
  addAdditionalProperties(body, properties) {
    for (const [name, value] of properties) {
      body.insertAdjacentHTML("beforeend", `<div>${name}: ${value}</div>`);
    }
  }
  addDesc(body, mod) {
    const regex = /\{([^}]+)\}/g;
    let i = 0;
    const desc = mod.text.replace(regex, (_, $1) => {
      const rangeValue = mod.rangeValues[i++];
      assertDefined(rangeValue);
      const { value, decimalCount } = rangeValue;
      const valueText = value.toFixed(decimalCount);
      return `${valueText}(${$1})`;
    });
    body.insertAdjacentHTML("beforeend", `<div class="g-mod-desc" style="text-align: center; padding-top: 0.3em;">${desc}</div>`);
  }
};

// src/game/mods/modUtilsDOM.ts
function* generateModListElements(params) {
  sortModifiers(params.modList);
  for (const mod of params.modList) {
    const element = document.createElement("li");
    element.setAttribute("data-info", "");
    element.setAttribute("data-mod", mod.template.id);
    element.textContent = mod.desc;
    element.addEventListener("click", () => {
      const additionalProperties = [];
      if (params.modGroupsList) {
        const tier = calcModTier(mod.text, getModGroupList(mod.text, params.modGroupsList));
        additionalProperties.push(["Tier", tier.toFixed()]);
      }
      new ModifierInfoPopup(mod, additionalProperties);
    });
    yield element;
  }
}

// src/game/components/blacksmith/Crafting.ts
var Crafting = class {
  constructor(ctx) {
    this.ctx = ctx;
  }
  craftAction = new EventEmitter();
  //#region Process Templates
  async processCraft(mod) {
    assertDefined(this.ctx.item.modListCrafting);
    assertNonNullable(this.ctx.craft);
    const successRate = CraftManager.calcSuccessRate(this.ctx.craft, {
      filterName: this.ctx.item.name,
      maxModCount: this.ctx.item.maxModCount,
      modGroupsList: this.ctx.modGroupsList,
      modList: this.ctx.item.modListCrafting
    }, mod);
    if (randomRangeInt(0, 100) > Math.floor(successRate)) {
      return this.triggerItemDestroyAnim();
    }
    if (this.ctx.craft.template.type === "Reforge") {
      this.processReforge();
    } else {
      switch (this.ctx.craft.template.type) {
        case "Add":
          this.processAdd();
          break;
        case "Remove":
          assertDefined(mod);
          this.processRemove(mod);
          break;
        case "Upgrade":
          assertDefined(mod);
          this.processUpgrade(mod);
          break;
        case "Randomize Numericals":
          this.processRandomizedNumericals(mod);
          break;
      }
      if (this.ctx.craft.cost) {
        subtractCost(this.ctx.craft.cost);
      }
    }
  }
  processReforge() {
    assertDefined(this.ctx.craft);
    switch (this.ctx.craft.template.desc) {
      case "[Dev] Reforge High DPS":
        this.performReforgeDevCraft();
        break;
      case "Reforge item with new random modifiers":
        this.performReforgeCraft();
        break;
    }
  }
  processAdd() {
    assertDefined(this.ctx.item.modListCrafting);
    const mod = CraftManager.addModifier(this.ctx.item.modListCrafting, this.ctx.candidateModList());
    this.ctx.item.modListCrafting.push(mod);
  }
  processRemove(mod) {
    assertDefined(this.ctx.item.modListCrafting);
    this.ctx.item.modListCrafting.remove(mod);
  }
  processUpgrade(mod) {
    assertDefined(this.ctx.item.modListCrafting);
    const newMod = CraftManager.upgradeModifier(mod, this.ctx.modGroupsList);
    this.ctx.item.modListCrafting.replace(mod, newMod);
  }
  processRandomizedNumericals(mod) {
    assertDefined(this.ctx.item.modListCrafting);
    switch (this.ctx.craft?.template.target) {
      case "All":
        this.ctx.item.modListCrafting.forEach((x) => x.randomizeValues());
        break;
      case "Single":
        assertDefined(mod);
        mod.randomizeValues();
        break;
    }
  }
  //#endregion
  //#region Craft
  performReforgeDevCraft() {
    const stats = extractStats(player.stats);
    const curDps = calcPlayerCombatStats({ stats, modDB: player.modDB }).dps;
    const modDB = new ModDB(player.modDB);
    let lastDps = curDps;
    let modList = [];
    for (let i = 0; i < 100; i++) {
      const newModList = CraftManager.reforge(this.ctx.candidateModList(), [0, 0, 0, 0, 0, 1]);
      modDB.replace("ReforgeDevCraft", Modifier.extractStatModifierList(...newModList));
      const dps = calcPlayerCombatStats({ stats, modDB }).dps;
      if (dps > lastDps || modList.length === 0) {
        modList = newModList;
        lastDps = dps;
      }
    }
    this.ctx.item.modListCrafting = modList;
  }
  performReforgeCraft() {
    assertDefined(this.ctx.item.modListCrafting);
    const advancedReforge = this.ctx.item.advancedReforge;
    const useAdvReforge = (advancedReforge?.maxReforgeCount ?? 0) > 0;
    let reforgeCount = 1;
    if (advancedReforge && useAdvReforge) {
      reforgeCount = advancedReforge.maxReforgeCount;
    }
    let success = false;
    for (let i = 0; i < reforgeCount; i++) {
      if (this.ctx.craft?.cost) {
        if (!evalCost(this.ctx.craft.cost)) {
          break;
        }
        subtractCost(this.ctx.craft.cost);
      }
      const newModList = CraftManager.reforge(this.ctx.candidateModList(), this.ctx.item.reforgeWeights);
      this.ctx.item.modListCrafting = newModList;
      if (advancedReforge && useAdvReforge) {
        const evaluateModItem = (modItem) => {
          const mod = newModList.find((x) => x.template.desc === modItem.text);
          if (!mod) {
            return false;
          }
          const modTier = calcModTier(mod.text, getModGroupList(mod.text, this.ctx.modGroupsList));
          if (modTier > modItem.tier) {
            return false;
          }
          return true;
        };
        success = advancedReforge.modItems.filter((x) => x.text.length > 0 && x.tier > 0).every(evaluateModItem);
        if (success) {
          break;
        }
      }
    }
    if (useAdvReforge) {
      void this.triggerAdvReforgeOutcomeAnim(success);
    }
  }
  //#endregion Craft
  //#region Other
  async triggerItemDestroyAnim() {
    const craftAreaElement = this.ctx.craftAreaElement.querySelectorStrict("[data-craft-area]");
    const animations = [...this.ctx.craftAreaElement.querySelectorAll("[data-mod]")].map((x) => {
      return new Promise((resolve) => {
        x.animate([
          { offset: 0, opacity: 1, filter: "blur(0px)" },
          { offset: 1, opacity: 0, filter: "blur(10px)" }
        ], 600).addEventListener("finish", resolve.bind(this, void 0));
      });
    });
    animations.push(new Promise((resolve) => {
      craftAreaElement.animate([
        { offset: 0, opacity: 1 },
        { offset: 1, opacity: 0 }
      ], 600).addEventListener("finish", resolve.bind(this, void 0));
    }));
    document.body.style.pointerEvents = "none";
    await Promise.allSettled(animations);
    this.ctx.craftAreaElement.querySelectorStrict("[data-craft-backdrop]").click();
    craftAreaElement.style.opacity = "1";
    document.body.style.pointerEvents = "all";
    this.craftAction.invoke("Cancel");
  }
  async triggerAdvReforgeOutcomeAnim(success) {
    const animate = new Promise((resolve) => {
      const outline = "1px solid rgba(255, 255, 255, 0)";
      const anim = this.ctx.craftAreaElement.querySelectorStrict("[data-craft-area]").animate([
        { outline },
        { offset: 0.8, outlineColor: success ? "green" : "red" },
        { offset: 1, outline }
      ], 1e3);
      anim.addEventListener("finish", () => {
        resolve();
      });
    });
    await animate;
  }
  //#endregion Other
};

// src/game/components/blacksmith/CraftTable.ts
var CraftTable = class {
  constructor(ctx) {
    this.ctx = ctx;
    this.crafting = new Crafting(ctx);
    this.crafting.craftAction.listen((e) => {
      switch (e) {
        case "Cancel":
          this.cancel();
          break;
      }
    });
    this.element = document.createElement("div");
    this.element.classList.add("craft-table");
    this.element.insertAdjacentHTML("beforeend", '<div class="g-title">Craft Table</div>');
    this.createToolbar();
    this.craftListElement = document.createElement("ul");
    this.craftListElement.classList.add("s-craft-list", "g-scroll-list-v");
    this.craftListElement.setAttribute("data-craft-list", "");
    this.craftListElement.insertAdjacentHTML("beforeend", "<li><div>Description</div><div data-cost>Cost</div><div data-resource>Resource</div></li>");
    this.element.appendChild(this.craftListElement);
    this.stopCrafting();
    if (ENVIRONMENT === "development") {
      this.addCraft({ desc: "[Dev] Reforge High DPS", successRates: { min: 100, max: 100 } });
    }
    for (const craftData of ctx.craftList) {
      this.addCraft(craftData);
    }
    this.updateCraftListItemStates();
    Object.values(game.resources).forEach((x) => x.addListener("change", () => {
      if (game.initializationStage >= 4 /* Done */) {
        this.updateCraftListItemStates();
      }
    }));
    new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        this.updateCraftList();
      }
    }).observe(this.craftListElement);
  }
  craftAction = new EventEmitter();
  element;
  crafting;
  craftListElement;
  craftList = [];
  abortController = null;
  createToolbar() {
    const toolbarElement = document.createElement("div");
    toolbarElement.classList.add("s-toolbar", "g-toolbar");
    toolbarElement.setAttribute("data-toolbar", "");
    const startCraftingButton = document.createElement("button");
    startCraftingButton.setAttribute("data-start-crafting-button", "");
    startCraftingButton.textContent = "Craft";
    startCraftingButton.addEventListener("click", this.startCrafting.bind(this));
    const compareButton = document.createElement("button");
    compareButton.setAttribute("data-compare-button", "");
    compareButton.textContent = "Compare";
    compareButton.addEventListener("click", this.openCompareModal.bind(this));
    const confirmButton = document.createElement("button");
    confirmButton.setAttribute("data-confirm-button", "");
    confirmButton.setAttribute("data-role", "confirm");
    confirmButton.textContent = "Confirm";
    confirmButton.addEventListener("click", this.confirm.bind(this));
    const cancelButton = document.createElement("button");
    cancelButton.setAttribute("data-cancel-button", "");
    cancelButton.setAttribute("data-role", "cancel");
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", this.cancel.bind(this));
    toolbarElement.append(startCraftingButton, compareButton, confirmButton, cancelButton);
    this.element.appendChild(toolbarElement);
    const advReforgeElement = document.createElement("button");
    advReforgeElement.classList.add("hidden", "advanced-reforge");
    advReforgeElement.setAttribute("data-advanced-reforge-button", "");
    advReforgeElement.textContent = "Adv. Reforge";
    advReforgeElement.addEventListener("click", () => {
      this.openAdvancedReforgeModal();
    });
    toolbarElement.appendChild(advReforgeElement);
  }
  updateToolbar() {
    this.element.querySelectorStrict("[data-start-crafting-button]").classList.toggle("hidden", !!this.ctx.item.modListCrafting);
    this.element.querySelectorStrict("[data-compare-button]").classList.toggle("hidden", !this.ctx.item.modListCrafting);
    this.element.querySelectorStrict("[data-confirm-button]").classList.toggle("hidden", !this.ctx.item.modListCrafting);
    this.element.querySelectorStrict("[data-cancel-button]").classList.toggle("hidden", !this.ctx.item.modListCrafting);
  }
  updateCraftListItemStates() {
    for (const craft of this.craftList) {
      craft.element.classList.toggle("selected", craft === this.ctx.craft);
      const disabled = !this.evalCraft(craft);
      craft.element.toggleAttribute("disabled", disabled);
    }
  }
  createBackdrop() {
    const element = document.createElement("div");
    element.classList.add("craft-backdrop");
    element.setAttribute("data-craft-backdrop", "");
    element.addEventListener("click", () => {
      element.remove();
      this.clearCraftSelection();
    });
    this.ctx.craftAreaElement.append(element);
  }
  removeBackdrop() {
    this.ctx.craftAreaElement.querySelector("[data-craft-backdrop]")?.click();
  }
  updateSuccessRateAttribute(e) {
    assertDefined(this.ctx.item.modListCrafting);
    const craftAreaElement = this.ctx.craftAreaElement.querySelectorStrict("[data-craft-area]");
    craftAreaElement.removeAttribute("data-success-rate");
    if (!this.ctx.craft) {
      return;
    }
    let mod;
    if (e.target instanceof HTMLElement && e.target.hasAttribute("data-mod") && e.target.getAttribute("data-craft") !== "false") {
      const id = e.target.getAttribute("data-mod");
      mod = this.ctx.item.modListCrafting.find((x) => x.template.id === id);
    }
    const successRate = CraftManager.calcSuccessRate(this.ctx.craft, {
      filterName: this.ctx.item.name,
      maxModCount: this.ctx.item.maxModCount,
      modList: this.ctx.item.modListCrafting,
      ...this.ctx
    }, mod);
    craftAreaElement.setAttribute("data-success-rate", successRate.toFixed());
  }
  selectCraftById(id) {
    this.ctx.craft = this.craftList.find((x) => x.template.id === id) ?? null;
    this.abortController?.abort();
    const craftAreaElement = this.ctx.craftAreaElement.querySelectorStrict("[data-craft-area]");
    craftAreaElement.querySelectorAll("[data-craft]").forEach((x) => {
      x.removeAttribute("data-craft");
    });
    this.updateCraftListItemStates();
    if (!this.ctx.craft) {
      return;
    }
    assertDefined(this.ctx.item.modListCrafting);
    this.abortController = new AbortController();
    switch (this.ctx.craft.template.target) {
      case "All":
        craftAreaElement.querySelectorStrict("[data-mod-list]").setAttribute("data-craft", "");
        break;
      case "Single":
        craftAreaElement.querySelectorAll("[data-mod]").forEach((x) => x.setAttribute("data-craft", ""));
        break;
    }
    if (this.ctx.craft.template.type === "Upgrade") {
      const modElementList = [...craftAreaElement.querySelectorAll("[data-mod]")];
      for (const modElement of modElementList) {
        const id2 = modElement.getAttribute("data-mod");
        const mod = this.ctx.item.modListCrafting.findStrict((x) => x.template.id === id2);
        const tier = calcModTier(mod.text, getModGroupList(mod.text, this.ctx.modGroupsList));
        const craftable = tier > 1;
        modElement.setAttribute("data-craft", String(craftable));
      }
    }
    if (this.ctx.craft.template.type === "Randomize Numericals") {
      const modElementList = [...craftAreaElement.querySelectorAll("[data-mod]")];
      for (const modElement of modElementList) {
        const id2 = modElement.getAttribute("data-mod");
        const mod = this.ctx.item.modListCrafting.find((x) => x.template.id === id2);
        const craftable = !!mod && mod.rangeValues.some((x) => x.min !== x.max);
        modElement.setAttribute("data-craft", String(craftable));
      }
    }
    craftAreaElement.querySelectorAll("[data-craft]").forEach((x) => {
      assertNonNullable(this.abortController);
      x.addEventListener("mouseover", this.updateSuccessRateAttribute.bind(this), { signal: this.abortController.signal });
      x.addEventListener("click", this.performCraft.bind(this), { capture: true, signal: this.abortController.signal });
    });
    this.createBackdrop();
  }
  startCrafting() {
    this.ctx.item.modListCrafting = [];
    this.craftAction.invoke({ item: this.ctx.item, type: "Change" });
    this.updateToolbar();
    this.updateCraftListItemStates();
  }
  async performCraft(e) {
    assertDefined(this.ctx.item.modListCrafting);
    e.stopPropagation();
    const modId = e.target instanceof HTMLElement ? e.target.getAttribute("data-mod") : void 0;
    const mod = modId ? this.ctx.item.modListCrafting.findStrict((x) => x.template.id === modId) : void 0;
    await this.crafting.processCraft(mod);
    this.craftAction.invoke({ item: this.ctx.item, type: "Change" });
    const craft = this.ctx.craft;
    if (craft) {
      this.removeBackdrop();
      if (this.evalCraft(craft)) {
        this.selectCraftById(craft.template.id);
      }
    }
  }
  evalCraft(craft) {
    let valid = false;
    if (this.ctx.item.modListCrafting) {
      switch (craft.template.type) {
        case "Reforge":
          valid = true;
          break;
        case "Add":
          valid = this.ctx.item.modListCrafting.length < this.ctx.item.maxModCount && CraftManager.generateMods(this.ctx.item.modListCrafting, this.ctx.candidateModList(), 1).length !== 0;
          break;
        case "Remove":
        case "Upgrade":
        case "Randomize Numericals":
          valid = this.ctx.item.modListCrafting.length !== 0;
          break;
      }
    }
    if (craft.cost && !evalCost(craft.cost)) {
      valid = false;
    }
    return valid;
  }
  confirm() {
    this.craftAction.invoke({ item: this.ctx.item, type: "Confirm" });
    this.stopCrafting();
  }
  cancel() {
    this.stopCrafting();
    this.craftAction.invoke({ item: this.ctx.item, type: "Cancel" });
  }
  stopCrafting() {
    delete this.ctx.item.modListCrafting;
    this.updateToolbar();
    this.clearCraftSelection();
    this.updateCraftListItemStates();
  }
  clearCraftSelection() {
    this.selectCraftById(null);
  }
  openCompareModal() {
    assertDefined(this.ctx.item.modListCrafting);
    const modal = createCustomElement(ModalElement);
    modal.setTitle("Compare");
    const element = document.createElement("div");
    element.classList.add("s-compare");
    const stats = extractStats(player.stats);
    const dps1 = calcPlayerCombatStats({ stats, modDB: player.modDB }).dps;
    const modDB = new ModDB(player.modDB);
    modDB.replace(`Blacksmith/${this.ctx.item.name}`, Modifier.extractStatModifierList(...this.ctx.item.modListCrafting));
    const dps2 = calcPlayerCombatStats({ stats, modDB }).dps;
    const dpsCompareElement = document.createElement("div");
    dpsCompareElement.classList.add("dps-compare");
    dpsCompareElement.innerHTML = `<span data-tag="${dps2 > dps1 ? "valid" : dps2 < dps1 ? "invalid" : ""}">DPS: <var>${dps1.toFixed(0)}</var> \u2192 <var>${dps2.toFixed(0)}</var></span>`;
    element.appendChild(dpsCompareElement);
    const createModListElement2 = (modList) => {
      const element2 = document.createElement("ul");
      element2.classList.add("g-mod-list");
      element2.append(...generateModListElements({ modList, modGroupsList: this.ctx.modGroupsList }));
      return element2;
    };
    const a = createModListElement2(this.ctx.item.modList);
    const b = createModListElement2(this.ctx.item.modListCrafting);
    element.append(a, b);
    const missingModifiers = this.ctx.item.modList.filter((x) => !(this.ctx.item.modListCrafting ?? []).some((y) => y.template === x.template));
    [...a.querySelectorAll("[data-mod]")].filter((x) => missingModifiers.find((y) => y.desc === x.textContent)).forEach((x) => x.setAttribute("data-tag", "invalid"));
    const additions = this.ctx.item.modListCrafting.filter((x) => !this.ctx.item.modList.some((y) => y.template === x.template));
    [...b.querySelectorAll("[data-mod]")].filter((x) => additions.find((y) => y.desc === x.textContent)).forEach((x) => x.setAttribute("data-tag", "valid"));
    modal.addBodyElement(element);
    this.element.appendChild(modal);
  }
  openAdvancedReforgeModal() {
    const modal = createCustomElement(ModalElement);
    modal.classList.add("adv-reforge-modal");
    const bodyElement = document.createElement("div");
    bodyElement.classList.add("s-adv-reforge");
    const createMaxReforgeCountInputElement = () => {
      const label = document.createElement("span");
      label.classList.add("max-reforge-count-label");
      label.textContent = "Max Reforge Count";
      const input = document.createElement("input");
      input.classList.add("max-reforge-count-input");
      label.setAttribute("data-max-reforge-count-input", "");
      input.setAttribute("type", "number");
      const advancedReforge = this.ctx.item.advancedReforge;
      assertDefined(advancedReforge);
      input.addEventListener("change", () => {
        const value = parseInt(input.value || "0");
        advancedReforge.maxReforgeCount = value;
      });
      input.value = advancedReforge.maxReforgeCount.toFixed();
      bodyElement.append(label, input);
    };
    const createRowElement = (modItem) => {
      const modTextDropdown = createCustomElement(TextInputDropdownElement);
      modTextDropdown.setInputText(modItem.text);
      const modListSet = new Set(this.ctx.candidateModList().map((x) => x.template.desc));
      const none = "None";
      modTextDropdown.setDropdownList([none, ...modListSet]);
      modTextDropdown.onInputChange = ({ text }) => {
        modItem.text = text === none ? "" : text;
        if (modItem.text.length === 0) {
          modTextDropdown.setInputText("");
        }
        updateTierInput();
      };
      const updateTierInput = () => {
        const modText = modItem.text;
        const modList = this.ctx.candidateModList().filter((x) => x.template.desc === modText);
        const modListCount = modList.length;
        const filterList = [...Array(modListCount)].map((_, i) => `Tier ${i + 1}`);
        tierDropdown.setDropdownList(filterList);
        modItem.tier = Math.min(modItem.tier || 1, modListCount);
        tierDropdown.setInputText(filterList[modItem.tier - 1] ?? "");
      };
      const tierDropdown = createCustomElement(TextInputDropdownElement);
      tierDropdown.setReadonly();
      tierDropdown.onInputChange = ({ index }) => {
        modItem.tier = index + 1;
      };
      updateTierInput();
      const row = document.createElement("div");
      row.classList.add("s-row");
      row.append(modTextDropdown, tierDropdown);
      return row;
    };
    createMaxReforgeCountInputElement();
    const conditionsElement = document.createElement("div");
    conditionsElement.classList.add("s-conditions");
    conditionsElement.insertAdjacentHTML("beforeend", "<div>Conditions</div>");
    for (let i = 0; i < this.ctx.item.maxModCount; i++) {
      assertDefined(this.ctx.item.advancedReforge);
      const modItem = this.ctx.item.advancedReforge.modItems[i] ?? { text: "", tier: 0 };
      assertDefined(modItem);
      this.ctx.item.advancedReforge.modItems[i] = modItem;
      const rowElement = createRowElement(modItem);
      conditionsElement.appendChild(rowElement);
    }
    bodyElement.appendChild(conditionsElement);
    modal.addBodyElement(bodyElement);
    this.element.appendChild(modal);
  }
  initItem(item) {
    this.ctx.item = item;
    this.updateToolbar();
    this.updateCraftListItemStates();
  }
  unlockAdvReforge() {
    this.element.querySelectorStrict("[data-advanced-reforge-button]").classList.remove("hidden");
  }
  addCraft(craftData) {
    const template = [...craftTemplates, ...devCraftTemplates].findStrict((x) => x.desc === craftData.desc);
    const element = document.createElement("li");
    element.classList.add("g-list-item");
    element.setAttribute("data-craft-id", template.id);
    const resource = this.craftList.length === 0 ? "A Very Long Resource Name" : "Gold";
    element.insertAdjacentHTML("beforeend", `<div>${template.desc}</div><var data-cost>0</var><var data-resource>${resource}</var>`);
    element.addEventListener("click", this.selectCraftById.bind(this, template.id));
    this.craftListElement.appendChild(element);
    const craft = {
      template,
      desc: template.desc,
      element,
      successRates: craftData.successRates,
      cost: craftData.cost
    };
    this.craftList.push(craft);
    this.updateCraftList();
  }
  updateCraftList() {
    this.craftListElement.querySelectorAll("[data-craft-id]").forEach((x) => {
      const id = x.getAttribute("data-craft-id");
      const cost = this.craftList.findStrict((x2) => x2.template.id === id).cost;
      x.querySelectorStrict("[data-resource]").textContent = cost ? cost.name : "";
      x.querySelectorStrict("[data-cost]").textContent = cost ? cost.value.toFixed() : "";
    });
    requestAnimationFrame(() => {
      setTimeout(() => {
        const calcWidth = (elements) => {
          let maxWidth = 0;
          for (const element of elements) {
            maxWidth = Math.max(maxWidth, element.offsetWidth);
          }
          elements.forEach((x) => x.style.minWidth = CSS.px(maxWidth).toString());
          return maxWidth;
        };
        calcWidth([...this.craftListElement.querySelectorAll("[data-cost]")]);
        calcWidth([...this.craftListElement.querySelectorAll("[data-resource]")]);
      }, 100);
    });
  }
};

// src/game/components/blacksmith/Blacksmith.ts
var Blacksmith = class extends Component {
  constructor(data) {
    super("blacksmith");
    this.data = data;
    const titleElement = createTitleElement({
      label: "Blacksmith",
      levelClickCallback: data.levelList ? this.openBlacksmithLevelModal.bind(this) : void 0,
      helpText: this.getHelpText()
    });
    this.page.appendChild(titleElement);
    const itemListDropdownParent = document.createElement("div");
    itemListDropdownParent.classList.add("s-item-dropdown");
    const itemListDropdown = createCustomElement(TextInputDropdownElement);
    itemListDropdown.setReadonly();
    itemListDropdown.setDropdownList(data.itemList.map((x) => x.name));
    itemListDropdown.onInputChange = ({ index }) => {
      const item = this.itemList[index];
      assertDefined(item);
      this.updateModListElements(item);
      this.craftTable.initItem(item);
    };
    itemListDropdownParent.appendChild(itemListDropdown);
    this.page.appendChild(itemListDropdownParent);
    const craftAreaElement = document.createElement("div");
    craftAreaElement.classList.add("s-craft-area");
    craftAreaElement.setAttribute("data-craft-area", "");
    this.page.appendChild(craftAreaElement);
    craftAreaElement.insertAdjacentHTML("beforeend", '<ul class="s-mod-list g-mod-list" data-mod-list></ul>');
    this.itemList = this.data.itemList.map((x) => ({
      id: x.id,
      name: x.name,
      modList: [],
      reforgeWeights: x.reforgeWeights,
      maxModCount: x.reforgeWeights.length,
      advancedReforge: data.crafting.advancedReforge ? { maxReforgeCount: 0, modItems: [] } : void 0
    }));
    const firstItem = this.itemList[0];
    assertDefined(firstItem);
    this.craftTable = new CraftTable({
      item: firstItem,
      craftAreaElement: this.page,
      craft: null,
      craftList: data.crafting.craftList,
      modGroupsList: this.modGroupsList,
      candidateModList: () => {
        return this.candidateModList.filter((x) => !x.filter || x.filter.includes(this.craftTable.ctx.item.name));
      }
    });
    this.page.appendChild(this.craftTable.element);
    for (const modList of data.modLists) {
      const groupList = [];
      this.modGroupsList.push(groupList);
      for (const modData of modList) {
        this.level.registerTargetValueCallback(modData.level, () => {
          const template = modTemplateList.findStrict((x) => x.desc === Modifier.getTemplate(modData.mod)?.desc);
          this.candidateModList.push({ text: modData.mod, template, weight: modData.weight, filter: modData.itemFilter });
          groupList.push({ text: modData.mod, filter: modData.itemFilter });
        });
      }
    }
    this.craftTable.craftAction.listen(({ item, type }) => {
      switch (type) {
        case "Confirm":
          assertDefined(item.modListCrafting);
          item.modList = item.modListCrafting;
          this.applyModifiers(item);
          break;
        case "Cancel":
          delete item.modListCrafting;
          break;
      }
      this.updateModListElements(item);
    });
    this.updateBlacksmithLevel();
    this.level.addListener("change", this.updateBlacksmithLevel.bind(this));
    if (data.crafting.advancedReforge) {
      this.level.registerTargetValueCallback(data.crafting.advancedReforge.requirements.blacksmithLevel, this.craftTable.unlockAdvReforge.bind(this.craftTable));
    }
  }
  modGroupsList = [];
  candidateModList = [];
  craftTable;
  level = new Value(1);
  itemList;
  getHelpText() {
    return `Craft your items using the craft table.
        New and better modifiers become available as you level up the blacksmith.`;
  }
  updateModListElements(item) {
    const modList = item.modListCrafting ?? item.modList;
    this.page.querySelectorStrict("[data-mod-list]").replaceChildren(...generateModListElements({ modList, modGroupsList: this.modGroupsList }));
  }
  openBlacksmithLevelModal() {
    assertDefined(this.data.levelList);
    createLevelModal({
      title: "Blacksmith",
      level: this.level,
      levelData: this.data.levelList
    });
  }
  updateBlacksmithLevel() {
    if (!this.data.levelList) {
      return;
    }
    this.page.querySelectorStrict("[data-level]").textContent = this.level.value.toFixed();
    const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
    player.modDB.replace("BlacksmithUpgrade", Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
    player.updateStatsDirect(2 /* Persistent */);
  }
  applyModifiers(item) {
    player.modDB.replace(`Blacksmith/${item.name}`, Modifier.extractStatModifierList(...item.modList));
  }
  serialize(save) {
    save.blacksmith = {
      level: this.level.value ?? 0,
      itemList: this.itemList.map((item) => ({
        id: item.id,
        modList: item.modList.map((mod) => ({ srcId: this.data.modLists.flatMap((x) => x).findStrict((y) => y.mod === mod.text).id, values: mod.values })),
        modListCrafting: item.modListCrafting?.map((mod) => ({ srcId: this.data.modLists.flatMap((x) => x).findStrict((y) => y.mod === mod.text).id, values: mod.values })) ?? void 0,
        advReforge: item.advancedReforge ? { count: item.advancedReforge.maxReforgeCount, modItems: item.advancedReforge.modItems } : void 0
      }))
    };
  }
  deserialize({ blacksmith: save }) {
    if (!save) {
      return;
    }
    if (isNumber(save.level)) {
      this.level.set(save.level);
    }
    for (const itemData of save.itemList ?? []) {
      const srcItem = this.itemList.find((x) => x.id === itemData?.id);
      if (!srcItem) {
        continue;
      }
      srcItem.modList = Modifier.deserialize(...itemData?.modList?.map((x) => ({
        text: this.data.modLists.flatMap((y) => y).find((y) => y.id === x?.srcId)?.mod,
        srcId: x?.srcId,
        values: x?.values
      })) ?? []);
      srcItem.modListCrafting = itemData?.modListCrafting ? Modifier.deserialize(...itemData?.modListCrafting?.map((x) => ({
        text: this.data.modLists.flatMap((y) => y).find((y) => y.id === x?.srcId)?.mod,
        srcId: x?.srcId,
        values: x?.values
      })) ?? []) : void 0;
      if (srcItem.advancedReforge && itemData?.advReforge) {
        srcItem.advancedReforge = { maxReforgeCount: itemData.advReforge.count ?? 0, modItems: itemData.advReforge.modItems?.map((x) => ({ text: x?.text ?? "", tier: x?.tier ?? 0 })) ?? [] };
      }
    }
    this.itemList.forEach((x) => this.applyModifiers(x));
    if (this.itemList[0]) {
      if (this.itemList[0].modListCrafting) {
        this.craftTable.initItem(this.itemList[0]);
      }
      this.updateModListElements(this.itemList[0]);
    }
  }
};

// src/game/statistics/statRequirements.ts
function evaluateStatRequirements(requirement, callback) {
  const requirements = [];
  if (requirement?.curLevel) {
    requirements.push({ stat: game.stats.level, value: requirement.curLevel });
  }
  if (requirement?.world) {
    requirements.push({ stat: game.stats.world, value: requirement.world });
  }
  let count = 0;
  if (count === requirements.length) {
    callback();
    return;
  }
  for (const requirement2 of requirements) {
    requirement2.stat.registerTargetValueCallback(requirement2.value, () => {
      count++;
      if (count === requirements.length) {
        callback();
      }
    });
  }
}

// src/game/components/guildHall/GuildHall.ts
var GuildHall = class extends Component {
  constructor(data) {
    super("guildHall");
    this.data = data;
    const titleElement = document.createElement("div");
    titleElement.classList.add("g-title");
    titleElement.textContent = "Guild Hall";
    if (data.levelList) {
      titleElement.innerHTML = `<span class="g-clickable-text">Guild Hall Lv.<var data-level>1</var></span>`;
      titleElement.addEventListener("click", this.openGuildHallLevelModal.bind(this));
      this.updateGuildHallLevel();
    }
    this.page.appendChild(titleElement);
    const toolbar = document.createElement("div");
    toolbar.classList.add("g-toolbar", "s-toolbar");
    const resetClassElement = document.createElement("div");
    resetClassElement.insertAdjacentHTML("beforeend", '<span class="g-clickable-text">Reset</span>');
    resetClassElement.addEventListener("click", this.resetClass.bind(this));
    toolbar.appendChild(resetClassElement);
    this.page.appendChild(toolbar);
    this.page.insertAdjacentHTML("beforeend", '<ul class="g-scroll-list-v guild-class-list" data-guild-class-list></ul>');
    this.page.insertAdjacentHTML("beforeend", "<div data-item-info></div>");
    this.guildClassList = [];
    const fragment = document.createDocumentFragment();
    for (const guild of this.data.guildList) {
      const element = document.createElement("div");
      element.classList.add("g-title");
      element.insertAdjacentHTML("beforeend", `<span class="g-clickable-text">${guild.name}</span>`);
      element.addEventListener("click", () => {
        const modal = createCustomElement(ModalElement);
        modal.setTitle(`${guild.name} Guild`);
        const modList = this.data.guildList.findStrict((x) => x.name === guild.name).modList;
        const modListElement = createModListElement(modList);
        modal.addBodyElement(modListElement);
      });
      fragment.appendChild(element);
      for (const guildClassData of this.data.guildClassList.filter((x) => x.guildName === guild.name)) {
        const guildClass = {
          ...createAssignableObject(guildClassData),
          data: guildClassData
        };
        guildClass.element.addEventListener("click", this.selectGuildClass.bind(this, guildClass));
        this.guildClassList.push(guildClass);
        this.level.registerTargetValueCallback(guildClassData.requirements?.guildHallLevel ?? 1, unlockObject.bind(this, guildClass));
        fragment.appendChild(guildClass.element);
      }
    }
    this.page.querySelectorStrict("[data-guild-class-list]").append(fragment);
    player.stats.guildClass.texts = ["None"];
    this.guildClassList.find((x) => x.unlocked)?.element.click();
    this.page.querySelector("[data-class-list] li")?.click();
    this.level.addListener("change", this.updateGuildHallLevel.bind(this));
  }
  guildClassList;
  activeGuildClass = null;
  level = new Value(1);
  get selectedGuildClass() {
    return this.guildClassList.find((x) => x.selected);
  }
  openGuildHallLevelModal() {
    const modal = createCustomElement(ModalElement);
    modal.setTitle(`Guild Hall Lv.${this.level.value.toFixed()}`);
    const body = document.createElement("div");
    const upgradeButton = document.createElement("button");
    upgradeButton.textContent = "Upgrade";
    const cost = this.data.levelList?.[this.level.value - 1]?.upgradeCost;
    if (cost) {
      upgradeButton.toggleAttribute("disabled", evalCost(cost));
      upgradeButton.textContent += `
${cost.value.toFixed()}${cost.name}`;
    }
    upgradeButton.addEventListener("click", () => {
      this.level.add(1);
      this.openGuildHallLevelModal();
    });
    body.appendChild(upgradeButton);
    const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
    const modListElement = createModListElement(modList);
    body.appendChild(modListElement);
    modal.addBodyElement(body);
  }
  updateGuildHallLevel() {
    const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
    Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList));
    player.modDB.replace("GuildHall", Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
    player.updateStatsDirect(2 /* Persistent */);
  }
  selectGuildClass(guildClass) {
    this.guildClassList.forEach((x) => {
      x.selected = x === guildClass;
      x.element.classList.toggle("selected", x.selected);
    });
    if (guildClass) {
      this.showClassInfo(guildClass);
    } else {
      this.page.querySelector("[data-item-info]")?.replaceChildren();
    }
  }
  showClassInfo(guildClass) {
    const elements = createObjectInfoElements({
      name: guildClass.name,
      modList: guildClass.data.modList
    });
    this.page.querySelector("[data-item-info]")?.replaceWith(elements.element) ?? this.page.appendChild(elements.element);
    const button = document.createElement("button");
    const updateButton = () => {
      button.textContent = "Assign";
      button.setAttribute("data-tag", "valid");
    };
    updateButton();
    button.toggleAttribute("disabled", !guildClass.unlocked || player.stats.guildClass.value !== 0);
    button.addEventListener("click", () => {
      this.assignClass(guildClass);
      updateButton();
    });
    elements.contentElement.appendChild(button);
  }
  resetClass() {
    this.assignClass(null);
  }
  assignClass(guildClass) {
    this.activeGuildClass = guildClass;
    if (guildClass) {
      player.stats.guildClass.setText(guildClass.name);
      player.modDB.replace("GuildClass", Modifier.extractStatModifierList(...Modifier.modListFromTexts(guildClass.data.modList)));
      const guild = this.data.guildList.findStrict((x) => x.name === guildClass.data.guildName);
      player.modDB.replace("Guild", Modifier.extractStatModifierList(...Modifier.modListFromTexts(guild.modList)));
    } else {
      player.stats.guildClass.setDefault();
      player.modDB.removeBySource("Guild");
      player.modDB.removeBySource("GuildClass");
      if (this.selectedGuildClass) {
        this.selectGuildClass(this.selectedGuildClass);
      }
    }
    if (this.activeGuildClass) {
      this.selectGuildClass(this.activeGuildClass);
    }
    this.page.querySelectorAll("[data-guild-class-list] [data-id]").forEach((x) => x.classList.toggle("m-text-green", x.getAttribute("data-id") === guildClass?.id));
    statistics.updateStats("Player");
  }
  serialize(save) {
    save.guildHall = {
      level: this.level.value,
      classId: this.activeGuildClass?.data.id
    };
  }
  deserialize({ guildHall: save }) {
    if (this.data.levelList && save?.level) {
      this.level.set(save?.level);
    }
    const guildClass = this.guildClassList.find((x) => x.data.id === save?.classId);
    if (guildClass) {
      this.assignClass(guildClass);
      this.selectGuildClass(guildClass);
    }
  }
};

// src/game/components/treasury/artifacts/Artifacts.ts
var Artifacts = class {
  page;
  onArtifactFound = new EventEmitter();
  artifactList;
  constructor(data) {
    this.page = document.createElement("div");
    this.page.classList.add("p-artifacts");
    this.page.insertAdjacentHTML("beforeend", '<div class="g-toolbar" data-artifacts-counter><span>Artifacts: <var data-cur>0</var>/<var data-max></var></span></div>');
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Artifact List</div>');
    this.page.insertAdjacentHTML("beforeend", '<ul class="artifact-list g-scroll-list-v" data-artifact-list></ul>');
    this.page.insertAdjacentHTML("beforeend", "<div data-item-info></div>");
    this.artifactList = data.artifactList.reduce((artifactList, artifactData) => {
      const artifact = {
        probability: artifactData.probability ?? 0,
        ...createRankObject(artifactData)
      };
      artifact.element.addEventListener("click", this.selectArtifact.bind(this, artifact));
      this.page.querySelectorStrict("[data-artifact-list]").appendChild(artifact.element);
      artifactList.push(artifact);
      return artifactList;
    }, []);
    this.updateArtifactsCounter();
    combat.events.enemyDeath.listen(() => {
      this.tryUnlockArtifact();
    });
    player.stats.maxArtifacts.addListener("change", this.updateArtifactsCounter.bind(this));
    this.onArtifactFound.listen(this.artifactAddExp.bind(this));
    if (ENVIRONMENT === "development") {
      window.addEventListener("Dev:AddArtifact", (e) => {
        const artifact = this.artifactList.find((x) => x.name.toLowerCase() === e.detail.toLowerCase());
        if (!artifact) {
          console.log("no artifact available");
          return;
        }
        unlockObject(artifact);
        this.onArtifactFound.invoke(artifact);
      }, { signal: game.abortSignal });
    }
  }
  get selectedArtifact() {
    return this.artifactList.find((x) => x.selected);
  }
  get artifactCount() {
    return this.artifactList.filter((x) => x.assigned).length;
  }
  updateArtifactsCounter() {
    const element = this.page.querySelectorStrict("[data-artifacts-counter]");
    element.querySelectorStrict("[data-cur]").textContent = this.artifactCount.toFixed();
    element.querySelectorStrict("[data-max]").textContent = player.stats.maxArtifacts.value.toFixed();
  }
  selectArtifact(artifact) {
    this.artifactList.forEach((x) => {
      x.selected = x === artifact;
      x.element.classList.toggle("selected", x.selected);
    });
    if (artifact) {
      this.showArtifact(artifact);
    } else {
      this.page.querySelector("[data-item-info]")?.replaceChildren();
    }
  }
  assignArtifact(artifact) {
    artifact.assigned = true;
    updateRankObjectListItemElement(artifact);
    player.modDB.add(`Artifact/${artifact.name}`, Modifier.extractStatModifierList(...Modifier.modListFromTexts(artifact.rankData(artifact.curRank).modList)));
    this.updateArtifactsCounter();
  }
  unassignArtifact(artifact) {
    artifact.assigned = false;
    artifact.element.removeAttribute("data-tag");
    player.modDB.removeBySource(`Artifact/${artifact.name}`);
    this.updateArtifactsCounter();
  }
  showArtifact(artifact) {
    const itemInfoElements = createObjectInfoElements({
      name: artifact.name,
      modList: artifact.rankData(artifact.selectedRank).modList,
      rankObj: artifact,
      onRankChange: (item) => this.showArtifact(item)
    });
    this.page.querySelector("[data-item-info]")?.replaceWith(itemInfoElements.element) ?? this.page.appendChild(itemInfoElements.element);
    const button = document.createElement("button");
    const updateButton = () => {
      let disabled = true;
      if (artifact.assigned) {
        disabled = false;
      } else if (this.artifactCount < player.stats.maxArtifacts.value) {
        disabled = false;
      }
      button.textContent = artifact.assigned ? "Unassign" : "Assign";
      button.toggleAttribute("disabled", disabled);
      button.setAttribute("data-tag", !artifact.assigned ? "valid" : "invalid");
    };
    button.addEventListener("click", () => {
      if (artifact.assigned) {
        this.unassignArtifact(artifact);
        if (artifact.selectedRank !== artifact.curRank) {
          artifact.curRank = artifact.selectedRank;
          this.assignArtifact(artifact);
        }
      } else {
        artifact.curRank = artifact.selectedRank;
        this.assignArtifact(artifact);
      }
      updateButton();
    });
    updateButton();
    itemInfoElements.contentElement.appendChild(button);
    this.updateArtifactInfo();
  }
  updateArtifactInfo() {
    const selectedArtifact = this.selectedArtifact;
    if (!selectedArtifact) {
      return;
    }
    const expbar = this.page.querySelector(`[data-item-info] ${ProgressElement.name}`);
    if (expbar) {
      expbar.value = getRankExpPct(selectedArtifact);
    }
  }
  tryUnlockArtifact() {
    const candidates = this.artifactList.filter((x) => x.curRank !== x.rankList.length);
    const candidate = pickOneFromPickProbability(candidates);
    if (!candidate) {
      return;
    }
    if (!candidate.unlocked) {
      unlockObject(candidate);
      notifications.addNotification({
        title: `New Artifact: ${candidate.name}`,
        elementId: candidate.id
      });
    }
    this.onArtifactFound.invoke(candidate);
  }
  artifactAddExp(artifact) {
    addRankExp(artifact, 1);
    if (artifact.curExp === artifact.maxExp) {
      tryUnlockNextRank(artifact);
    }
    if (artifact.selected) {
      this.updateArtifactInfo();
    }
  }
  serialize() {
    return {
      artifactNameList: this.artifactList.filter((x) => x.unlocked).map((x) => ({ id: x.id, assigned: x.assigned, expFac: x.curExp / x.maxExp }))
    };
  }
  deserialize(save) {
    for (const data of save?.artifactNameList?.filter(isDefined) || []) {
      const artifact2 = this.artifactList.find((x) => x.id === data.id);
      if (!artifact2) {
        continue;
      }
      artifact2.curExp = artifact2.maxExp * (data.expFac ?? 0);
      unlockObject(artifact2);
      if (data.assigned) {
        this.assignArtifact(artifact2);
        if (!this.selectedArtifact) {
          this.selectArtifact(artifact2);
        }
      }
    }
    const artifact = this.artifactList.find((x) => x.assigned || x.selected || x.unlocked);
    if (artifact) {
      this.selectArtifact(artifact);
    }
  }
};

// src/game/components/treasury/Treasury.ts
var Treasury = class extends Component {
  constructor(data) {
    super("treasury");
    this.data = data;
    const titleElement = createTitleElement({
      label: "Treasury",
      levelClickCallback: data.levelList ? this.openTreasuryLevelModal.bind(this) : void 0
    });
    this.page.appendChild(titleElement);
    const menu = createCustomElement(TabMenuElement);
    menu.classList.add("s-menu");
    menu.setDirection("horizontal");
    this.page.appendChild(menu);
    if (data.artifacts) {
      this.artifacts = new Artifacts(data.artifacts);
      menu.addMenuItem("Artifacts", "artifacts", 0);
      menu.registerPageElement(this.artifacts.page, "artifacts");
      this.page.append(this.artifacts.page);
    }
    this.updateTreasuryLevel();
    this.level.addListener("change", this.updateTreasuryLevel.bind(this));
  }
  level = new Value(1);
  artifacts;
  openTreasuryLevelModal() {
    assertDefined(this.data.levelList);
    createLevelModal({
      title: "Treasury",
      level: this.level,
      levelData: this.data.levelList
    });
  }
  updateTreasuryLevel() {
    if (!this.data.levelList) {
      return;
    }
    this.page.querySelectorStrict("[data-level]").textContent = this.level.value.toFixed();
    const modList = this.data.levelList?.[this.level.value - 1]?.modList ?? [];
    player.modDB.replace("Treasury", Modifier.extractStatModifierList(...Modifier.modListFromTexts(modList)));
    player.updateStatsDirect(2 /* Persistent */);
  }
  serialize(save) {
    save.treasury = {
      level: this.level.value,
      artifacts: this.artifacts?.serialize()
    };
  }
  deserialize({ treasury: save }) {
    if (isNumber(save?.level)) {
      this.level.set(save.level);
    }
    this.artifacts?.deserialize(save?.artifacts);
  }
};

// src/game/components/Components.ts
var Components = class {
  components = {
    guildHall: { label: "Guild Hall", constr: GuildHall },
    character: { label: "Character", constr: Character },
    blacksmith: { label: "Blacksmith", constr: Blacksmith },
    treasury: { label: "Treasury", constr: Treasury },
    achievements: { label: "Achievements", constr: Achievements }
  };
  componentList = [];
  addComponent(name) {
    const components = game.gameConfig.components ?? {};
    const componentData = components[name];
    assertDefined(componentData, `gameConfig does not contain the component: ${name}`);
    const instance = new this.components[name].constr(componentData);
    const label = this.components[name].label;
    const { menuItem } = game.addPage(instance.page, label, name);
    this.componentList.push(instance);
    if (game.initializationStage === 4 /* Done */) {
      notifications.addNotification({ title: `You Have Unlocked ${label}` });
      game.addElementHighlight(menuItem);
    }
  }
  init() {
    for (const key of Object.keys(this.components)) {
      const data = game.gameConfig.components?.[key];
      if (!data) {
        continue;
      }
      const requirements = "requirements" in data ? data.requirements ?? {} : {};
      evaluateStatRequirements(requirements, () => {
        this.addComponent(key);
      });
    }
  }
  setup() {
    for (const component of this) {
      component.setup?.();
    }
  }
  has(name) {
    return this.componentList.some((x) => x.name === name);
  }
  reset() {
    this.componentList.forEach((x) => {
      x.dispose?.();
      x.page.remove();
      const menuItem = game.menu.querySelectorStrict(`[data-page-target="${x.name}"]`);
      game.menu.removeMenuItem(menuItem);
      menuItem?.remove();
    });
    this.componentList.clear();
  }
  serialize(save) {
    for (const component of this.componentList) {
      component.serialize?.(save);
    }
  }
  deserialize(save) {
    for (const component of this.componentList) {
      component.deserialize?.(save);
    }
  }
  *[Symbol.iterator]() {
    for (const component of this.componentList) {
      yield component;
    }
  }
};

// src/shared/customElements/AccordionElement.ts
var AccordionElement = class extends CustomElement {
  static name = "accordion-element";
  header;
  contentParent;
  content;
  onToggle = new EventEmitter();
  _isOpen = false;
  constructor() {
    super();
    this.header = document.createElement("div");
    this.header.classList.add("header");
    this.header.setAttribute("data-header", "");
    this.header.insertAdjacentHTML("beforeend", '<div class="title" data-title></div>');
    this.header.addEventListener("click", this.open.bind(this));
    this.contentParent = document.createElement("div");
    this.contentParent.classList.add("content-parent");
    this.content = document.createElement("div");
    this.content.classList.add("s-content");
    this.content.setAttribute("data-content", "");
    this.contentParent.appendChild(this.content);
  }
  get isOpen() {
    return this._isOpen;
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.header.removeEventListener("click", this.open.bind(this));
  }
  init() {
    this.replaceChildren(this.header, this.contentParent);
  }
  open() {
    if (!this.content.firstChild?.hasChildNodes()) {
      return;
    }
    this.toggle(!this.isOpen);
  }
  setTitle(title) {
    this.header.querySelectorStrict("[data-title]").textContent = title;
  }
  setTitleElement(element) {
    this.header.querySelectorStrict("[data-title]").replaceWith(element);
  }
  setContentElements(...element) {
    this.content.replaceChildren(...element);
    this.header.classList.toggle("has-content", this.content.childElementCount > 0);
  }
  toggle(open) {
    this._isOpen = isDefined(open) ? open : !this._isOpen;
    this.header.classList.toggle("open", this.isOpen);
    this.onToggle.invoke(this.isOpen);
  }
};

// src/game/statistics/Statistics.ts
var Statistics = class {
  page;
  statisticsGroups = /* @__PURE__ */ new Map();
  constructor() {
    this.page = document.createElement("div");
    this.page.classList.add("p-statistics", "hidden");
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Statistics</div>');
    this.page.insertAdjacentHTML("beforeend", '<ul class="g-scroll-list-v" data-stat-group-list></ul>');
    game.addPage(this.page, "Statistics", "statistics");
  }
  init() {
    gameLoopAnim.registerCallback(this.updateAll.bind(this), { delay: 1e3 });
  }
  updateAll() {
    for (const group of this.statisticsGroups.values()) {
      this.updateGroup(group);
    }
  }
  updateStats(name) {
    const group = this.statisticsGroups.get(name);
    if (!group) {
      console.error(`${name} has not been added to statistics`);
      return;
    }
    this.updateGroup(group);
  }
  createGroup(name, statCollection) {
    if (this.statisticsGroups.has(name)) {
      return this.statisticsGroups.get(name);
    }
    const pageGroup = createCustomElement(AccordionElement);
    pageGroup.setTitle(name);
    const body = document.createElement("ul");
    for (const [statName, stat] of Object.entries(statCollection).filter((x) => x[1].options.label)) {
      const li = this.createStatElement(statName, stat);
      body.appendChild(li);
    }
    pageGroup.setContentElements(body);
    pageGroup.toggle(true);
    const stickyGroup = createCustomElement(AccordionElement);
    stickyGroup.setTitle(name);
    this.page.querySelectorStrict("[data-stat-group-list]").appendChild(pageGroup);
    game.page.querySelectorStrict("[data-sticky-stat-group-list]").appendChild(stickyGroup);
    pageGroup.querySelectorAll("[data-stat]").forEach((element) => element.addEventListener("click", () => {
      const statName = element.getAttributeStrict("data-stat");
      const stat = statCollection[statName];
      if (!stat) {
        return;
      }
      stat.sticky = !stat.sticky;
      if (stat.sticky) {
        this.insertSideGroupStatElement(group, statName);
      } else {
        group.stickyGroup.querySelector(`[data-stat="${statName}"]`)?.remove();
      }
      this.updateGroup(group, { [statName]: stat });
    }));
    const group = { pageGroup, stickyGroup, statCollection };
    this.statisticsGroups.set(name, group);
    for (const [statName, stat] of Object.entries(group.statCollection)) {
      if (stat.sticky) {
        this.insertSideGroupStatElement(group, statName);
      }
    }
    this.updateGroup(group);
    stickyGroup.toggle(true);
    return group;
  }
  insertSideGroupStatElement(group, statName) {
    const stat = group.statCollection[statName];
    assertDefined(stat);
    const li = this.createStatElement(statName, stat);
    const statValueText = this.formatVariableText(stat);
    li.querySelectorStrict("[data-stat-value]").textContent = statValueText;
    const statNames = Object.keys(group.statCollection);
    const elements = [...group.stickyGroup.content.querySelectorAll("[data-stat]")];
    elements.push(li);
    elements.sort((a, b) => statNames.indexOf(a.getAttribute("data-stat") ?? "") - statNames.indexOf(b.getAttribute("data-stat") ?? ""));
    group.stickyGroup.setContentElements(...elements);
  }
  createStatElement(statName, stat) {
    const li = document.createElement("li");
    li.classList.add("g-field");
    li.setAttribute("data-stat", statName);
    li.insertAdjacentHTML("beforeend", `<div>${stat.options.label}</div><div class="value" data-stat-value data-tag="${stat.options.valueColorTag}"></div>`);
    li.title = stat.options.hoverTip || "";
    return li;
  }
  updateGroup(group, statCollection) {
    if (!group.pageGroup.isOpen && !group.stickyGroup.isOpen) {
      return;
    }
    statCollection = statCollection ?? group.statCollection;
    for (const [statName, stat] of Object.entries(statCollection)) {
      const visible = stat.visible;
      group.pageGroup.querySelector(`[data-stat="${statName}"]`)?.classList.toggle("hidden", !visible);
      group.stickyGroup.querySelector(`[data-stat="${statName}"]`)?.classList.toggle("hidden", !visible);
      if (!visible) {
        continue;
      }
      const label = stat.options.label;
      if (!isString(label)) {
        continue;
      }
      const statValueText = this.formatVariableText(stat);
      const pageGroupStatElement = group.pageGroup.querySelectorStrict(`[data-stat="${statName}"]`);
      pageGroupStatElement.classList.toggle("sticky", stat.sticky);
      pageGroupStatElement.querySelectorStrict("[data-stat-value]").textContent = statValueText;
      if (stat.sticky) {
        const sideElement = group.stickyGroup.content.querySelector(`[data-stat="${statName}"] [data-stat-value]`);
        if (!sideElement) {
          this.insertSideGroupStatElement(group, statName);
        }
        group.stickyGroup.content.querySelectorStrict(`[data-stat="${statName}"] [data-stat-value]`).textContent = statValueText;
      }
    }
    group.stickyGroup.classList.toggle("hidden", Object.values(group.statCollection).every((x) => !x.sticky || !x.visible));
    group.pageGroup.classList.toggle("hidden", Object.values(group.statCollection).every((x) => !x.visible));
  }
  formatVariableText(statistic) {
    const formatDate = (value) => {
      const date = /* @__PURE__ */ new Date(0);
      date.setSeconds(value);
      return date.toISOString().substring(11, 19);
    };
    const formatNumber = (statistic2, options) => {
      let value = statistic2.value;
      if (options.isTime) {
        return formatDate(value);
      }
      if (isNumber(options.multiplier)) {
        value *= 100;
      }
      if (isNumber(options.decimals)) {
        value = toDecimals(value, options.decimals);
      } else {
        value = Math.floor(value);
      }
      let string = value.toString();
      if (isString(options.suffix)) {
        string += options.suffix || "";
      }
      return string;
    };
    if (statistic.value === Infinity) {
      return "\u221E";
    }
    if (statistic.texts) {
      return statistic.getText() || "Error";
    }
    if (statistic.options.statFormat) {
      let string = "";
      for (const item of statistic.options.statFormat(statistic)) {
        if (isString(item)) {
          string += item;
          continue;
        }
        if (item === statistic) {
          string += formatNumber(item, item.options);
        } else {
          string += this.formatVariableText(item);
        }
      }
      return string;
    }
    switch (statistic.options.type) {
      case "number":
        return formatNumber(statistic, statistic.options);
      case "boolean":
        return statistic.value === 0 ? "False" : "True";
    }
    return statistic.value.toFixed();
  }
  reset() {
    this.statisticsGroups.forEach((x) => {
      x.pageGroup.remove();
      x.stickyGroup.remove();
    });
    this.statisticsGroups.clear();
  }
  serialize(save) {
    const groups = {};
    for (const [key, group] of this.statisticsGroups.entries()) {
      groups[key] = {
        pageHeaderOpenState: group.pageGroup.isOpen,
        sideHeaderOpenState: group.stickyGroup.isOpen
      };
    }
    save.statistics = { groups };
  }
  deserialize({ statistics: save }) {
    if (!save) {
      return;
    }
    if (save.groups) {
      for (const [groupName, states] of Object.entries(save.groups)) {
        const group = this.statisticsGroups.get(groupName);
        if (group) {
          group.pageGroup.toggle(states?.pageHeaderOpenState ?? true);
          group.stickyGroup.toggle(states?.sideHeaderOpenState ?? true);
        }
      }
    }
  }
};

// src/shared/utils/LoopWorker.ts
var LoopWorker = class {
  worker;
  constructor() {
    const blob = new Blob([`(${workerScript.toString()})();`]);
    const blobURL = window.URL.createObjectURL(blob);
    this.worker = new Worker(blobURL);
    this.worker.addEventListener("message", () => this.onMessage());
    this.worker.onmessage = this.onMessage.bind(this);
  }
  postMessage(data) {
    this.worker.postMessage(data);
  }
  onMessage() {
  }
  terminate() {
    this.worker.terminate();
  }
};
var workerScript = () => {
  const WAIT_TIME = 1e3;
  let loopId;
  const loop = () => {
    let remainder = 0;
    let now = performance.now();
    clearTimeout(loopId);
    const loop2 = () => {
      loopId = self.setTimeout(() => {
        let time = performance.now() - now + remainder;
        now = performance.now();
        if (time >= WAIT_TIME) {
          self.postMessage(void 0);
          time -= 1e3;
        }
        remainder = time;
        loop2();
      }, WAIT_TIME);
    };
    loop2();
  };
  self.addEventListener("message", (e) => {
    switch (e.data.state) {
      case "start":
        loop();
        break;
      case "stop":
        clearTimeout(loopId);
        break;
    }
  });
};

// src/shared/utils/Loop.ts
var TARGET_TICK_RATE = 1e3 / 60;
var DELTA_TIME_SECONDS = TARGET_TICK_RATE / 1e3;
var Loop = class {
  _state = "Stopped";
  loop;
  constructor(type = "Default") {
    switch (type) {
      case "Default":
        this.loop = new DefaultLoop();
        break;
      case "WebWorker":
        this.loop = new WebWorkerLoop();
        break;
      case "Animation":
        this.loop = new AnimationLoop();
        break;
    }
  }
  get state() {
    return this._state;
  }
  get loopType() {
    return this.loop.type;
  }
  setLoopType(type) {
    if (this.loopType === type) {
      return;
    }
    const state = this._state;
    const instanceMap = this.loop.instanceMap;
    if (state === "Running") {
      this.stop();
    }
    this.loop?.dispose?.();
    switch (type) {
      case "WebWorker":
        this.loop = new WebWorkerLoop();
        break;
      case "Animation":
        this.loop = new AnimationLoop();
        break;
      default:
        this.loop = new DefaultLoop();
        break;
    }
    instanceMap.forEach((value, key) => this.loop.instanceMap.set(key, value));
    if (state === "Running") {
      this.start();
    }
  }
  setSpeed(speed) {
    BaseLoop.speedMultiplier = Math.round(speed);
  }
  registerCallback(callback, options) {
    const id = uuid();
    const instance = {
      time: 0,
      id,
      callback,
      options
    };
    this.loop.instanceMap.set(id, instance);
    return id;
  }
  unregister(id) {
    this.loop.unregister(id);
  }
  reset() {
    this.loop.instanceMap.clear();
  }
  toggleState() {
    switch (this._state) {
      case "Running":
        this.stop();
        break;
      case "Stopped":
        this.start();
        break;
    }
  }
  start() {
    if (this._state === "Running") {
      return;
    }
    this._state = "Running";
    this.loop.start();
  }
  stop() {
    this._state = "Stopped";
    this.loop.stop();
  }
};
var BaseLoop = class _BaseLoop {
  static speedMultiplier = 1;
  instanceMap = /* @__PURE__ */ new Map();
  lastTime = 0;
  remainder = 0;
  unregister(id) {
    this.instanceMap.delete(id);
  }
  start() {
    this.remainder = 0;
    this.lastTime = performance.now();
  }
  tick() {
    const frameTime = Math.min(performance.now() - this.lastTime, 2e3);
    let time = frameTime + this.remainder;
    while (time >= TARGET_TICK_RATE) {
      time -= TARGET_TICK_RATE / _BaseLoop.speedMultiplier;
      for (const instance of this.instanceMap.values()) {
        instance.time += TARGET_TICK_RATE;
        const targetWaitTime = instance.options?.delay ?? TARGET_TICK_RATE;
        if (instance.time < targetWaitTime) {
          continue;
        }
        instance.callback(DELTA_TIME_SECONDS, instance);
        if (instance.options?.once) {
          this.instanceMap.delete(instance.id);
        } else {
          instance.time -= targetWaitTime;
        }
      }
    }
    this.remainder = time;
    this.lastTime = performance.now();
  }
  skipTime(time) {
    this.remainder += time;
  }
};
var DefaultLoop = class extends BaseLoop {
  type = "Default";
  loopId = -1;
  start() {
    clearTimeout(this.loopId);
    super.start();
    const loop = () => {
      this.loopId = window.setTimeout(() => {
        super.tick();
        if (this.loopId) {
          loop();
        }
      }, TARGET_TICK_RATE);
    };
    loop();
  }
  stop() {
    window.clearTimeout(this.loopId);
    this.loopId = -1;
  }
};
var WebWorkerLoop = class extends BaseLoop {
  type = "WebWorker";
  worker;
  constructor() {
    super();
    this.worker = new LoopWorker();
    this.worker.onMessage = () => {
      super.tick();
    };
  }
  start() {
    this.worker.postMessage({ state: "start" });
    super.start();
  }
  stop() {
    this.worker.postMessage({ state: "stop" });
  }
  dispose() {
    this.worker.terminate();
  }
};
var AnimationLoop = class extends BaseLoop {
  type = "Animation";
  requestId = 0;
  start() {
    cancelAnimationFrame(this.requestId);
    super.start();
    const loop = () => {
      this.requestId = requestAnimationFrame(() => {
        super.tick();
        if (this.requestId > 0) {
          loop();
        }
      });
    };
    loop();
  }
  stop() {
    cancelAnimationFrame(this.requestId);
    this.requestId = 0;
  }
};

// src/shared/utils/saveManager.ts
var lzString = __toESM(require_lz_string(), 1);
function saveGame(data) {
  saveData("game", Object.fromEntries(data));
}
function loadGame(id) {
  const text = loadText("game");
  const map = new Map(Object.entries(JSON.parse(text)));
  return id ? map.get(id) : map;
}
function saveData(name, data) {
  const text = JSON.stringify(data);
  const compressed = lzString.compressToEncodedURIComponent(text);
  localStorage.setItem(name, compressed);
}
function loadText(name) {
  const compressed = localStorage.getItem(name);
  if (!compressed) {
    return "{}";
  }
  const uncompressed = lzString.decompressFromEncodedURIComponent(compressed);
  return uncompressed;
}

// src/game/dev.ts
function initDevTools() {
  console.groupCollapsed("Dev tools enabled");
  console.log("Dev tools: window.modero");
  console.log("Press Space to toggle Game Loop", "(state indicated by * in tab title)");
  console.groupEnd();
  document.body.addEventListener("keydown", toggleLoop);
  return {
    save: () => game.gameConfigId && game.saveGame(),
    printSave: () => game.gameConfigId && loadGame(game.gameConfigId),
    game,
    player,
    combat,
    getEnemy: () => combat.enemy,
    setLevel: (level) => game.stats.level.set(level),
    addResource: (name, amount) => {
      Object.values(game.resources).find((x) => x.options.label?.toLowerCase() === name.toLowerCase())?.add(amount);
      statistics.updateStats("Resources");
    },
    addArtifact: (baseName) => window.dispatchEvent(new CustomEvent("Dev:AddArtifact", { detail: baseName })),
    setLoopSpeed: (speed) => {
      gameLoop.setSpeed(speed);
    },
    dispose: () => {
      document.body.removeEventListener("keydown", toggleLoop);
    }
  };
}
function toggleLoop(e) {
  if (e.code !== "Space" || document.activeElement?.tagName.toLowerCase() === "input") {
    return;
  }
  e.preventDefault();
  gameLoop.toggleState();
  gameLoopAnim.toggleState();
  document.title = document.title.startsWith("*") ? document.title.slice(1) : `*${document.title}`;
}

// src/shared/utils/date.ts
function getFormattedTimeSince(time = Date.now()) {
  const timeSince = getTimeSince(time);
  let formattedTime = timeSince.time.toFixed();
  switch (timeSince.type) {
    case "days":
      formattedTime += ` ${timeSince.time > 1 ? "days" : "day"} ago`;
      break;
    case "hours":
      formattedTime += ` ${timeSince.time > 1 ? "hours" : "hour"} ago`;
      break;
    case "minutes":
      formattedTime += ` ${timeSince.time > 1 ? "minutes" : "minute"} ago`;
      break;
    case "seconds":
      formattedTime += ` ${timeSince.time > 1 ? "seconds" : "second"} ago`;
      break;
  }
  return formattedTime;
}
function getTimeSince(time = Date.now()) {
  const oldDate = new Date(time);
  const newDate = /* @__PURE__ */ new Date();
  const timeDiff = newDate.getTime() - oldDate.getTime();
  const msToSeconds = 1e3;
  const msToMinutes = msToSeconds * 60;
  const msToHours = msToMinutes * 60;
  const msToDays = msToHours * 24;
  const days = Math.floor(timeDiff / msToDays);
  if (days > 0) {
    return { time: days, type: "days" };
  }
  const hours = Math.floor(timeDiff / msToHours);
  if (hours > 0) {
    return { time: hours, type: "hours" };
  }
  const minutes = Math.floor(timeDiff / msToMinutes);
  if (minutes > 0) {
    return { time: minutes, type: "minutes" };
  }
  const seconds = Math.floor(timeDiff / msToSeconds);
  return { time: seconds, type: "seconds" };
}

// src/game/Notifications.ts
var Notifications = class {
  page;
  notificationListElement;
  notificationList = [];
  constructor() {
    this.page = document.createElement("div");
    this.page.classList.add("p-notifications", "hidden");
    this.page.setAttribute("data-page-content", "notifications");
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title">Notifications</div>');
    const toolbarElement = this.createToolbarElement();
    this.page.appendChild(toolbarElement);
    this.notificationListElement = document.createElement("ul");
    this.notificationListElement.classList.add("s-notifications-list", "g-scroll-list-v");
    this.notificationListElement.setAttribute("data-notifications-list", "");
    this.page.appendChild(this.notificationListElement);
    game.page.appendChild(this.page);
    game.addPage(this.page, "Notifications", "notifications");
    new MutationObserver(() => {
      if (!this.pageVisible) {
        this.notificationList.forEach((x) => x.element.classList.remove("outline"));
        return;
      }
      for (const notification of this.notificationList.filter((x) => !x.seen)) {
        this.triggerNotificationOutline(notification);
      }
      this.updateMenuName();
      this.updateNotificationTimes();
    }).observe(this.page, { attributes: true, attributeFilter: ["class"] });
  }
  get pageVisible() {
    return !this.page.classList.contains("hidden");
  }
  createToolbarElement() {
    const element = document.createElement("div");
    element.classList.add("s-toolbar", "g-toolbar");
    const markAllAsSeen = document.createElement("span");
    markAllAsSeen.classList.add("g-clickable-text", "clear");
    markAllAsSeen.textContent = "Mark all as seen";
    markAllAsSeen.addEventListener("click", () => {
      for (const notification of this.notificationList) {
        this.seeNotification(notification);
      }
      this.updateMenuName();
    });
    element.appendChild(markAllAsSeen);
    return element;
  }
  seeNotification(notification) {
    notification.seen = true;
    if (notification.elementId) {
      game.removeHighlightElement(notification.elementId);
    }
    notification.element.classList.remove("outline");
  }
  triggerNotificationOutline(notification) {
    notification.element.classList.add("outline");
    if (!notification.elementId) {
      notification.seen = true;
    }
  }
  updateMenuName() {
    const unseenNotificationCount = this.notificationList.filter((x) => !x.seen).length;
    const menuItem = game.menu.getMenuItemById("notifications");
    if (menuItem) {
      menuItem.textContent = `Notifications${unseenNotificationCount > 0 ? ` (${unseenNotificationCount})` : ""}`;
    }
  }
  updateNotificationTimes() {
    for (const notification of this.notificationList) {
      const timeElement = notification.element.querySelectorStrict("[data-time]");
      timeElement.textContent = getFormattedTimeSince(notification.time);
    }
  }
  createNotificationElement(entry) {
    const formattedTime = getFormattedTimeSince(entry.time || Date.now());
    const element = document.createElement("li");
    element.insertAdjacentHTML("beforeend", `<div class="title"><span>${entry.title}</span><span class="time g-text-small g-text-mute" data-time>${formattedTime}</span></div>`);
    if (entry.description) {
      element.insertAdjacentHTML("beforeend", `<div class="description g-text-small">${entry.description}</div>`);
    }
    return element;
  }
  addNotification(entry) {
    const element = this.createNotificationElement({ ...entry });
    this.notificationListElement.insertBefore(element, this.notificationListElement.firstElementChild);
    const notification = {
      elementId: void 0,
      ...entry,
      seen: entry.seen ?? false,
      time: entry.time ?? Date.now(),
      element
    };
    this.notificationList.push(notification);
    if (entry.elementId && !entry.seen) {
      game.addElementHighlight(entry.elementId, () => {
        notification.seen = true;
        this.updateMenuName();
      });
    }
    if (this.pageVisible && !notification.seen) {
      this.triggerNotificationOutline(notification);
    }
    this.updateMenuName();
  }
  reset() {
    this.notificationList.splice(0);
    this.notificationListElement.replaceChildren();
    this.updateMenuName();
  }
  serialize(save) {
    save.notifications = {
      notificationList: this.notificationList.map((x) => ({
        title: x.title,
        description: x.description,
        elementId: x.elementId,
        seen: x.seen,
        time: x.time
      }))
    };
  }
  deserialize({ notifications: save }) {
    for (const serializedNotification of save?.notificationList ?? []) {
      if (!isString(serializedNotification?.title)) {
        continue;
      }
      const entry = {
        title: serializedNotification.title,
        description: serializedNotification.description,
        elementId: serializedNotification.elementId,
        time: serializedNotification.time,
        seen: serializedNotification.seen
      };
      this.addNotification(entry);
    }
    this.updateMenuName();
  }
};

// src/game/combat/Enemy.ts
var Enemy = class {
  constructor(enemyData) {
    this.enemyData = enemyData;
    this.stats.baseLife.set(enemyData.baseLife);
    this.modList = Modifier.modListFromTexts([...enemyData.enemyModList]);
    this.modList.forEach((x) => x.randomizeValues());
    this.modDB.add("EnemyMod", Modifier.extractStatModifierList(...this.modList));
    this.stats.maxLife.set(1);
    this.stats.life.set(this.stats.maxLife.value);
    this.updateStats();
  }
  modDB = new ModDB();
  stats = createEnemyStats();
  modList;
  get life() {
    return this.stats.life.value;
  }
  set life(v) {
    v = clamp(v, 0, this.maxLife);
    this.stats.life.set(v);
  }
  get maxLife() {
    return this.stats.maxLife.value;
  }
  get lifeFac() {
    return clamp(this.life / this.maxLife, 0, 1);
  }
  updateStats() {
    const lifeFac = this.lifeFac;
    calcEnemyStats(this);
    this.life = this.maxLife * lifeFac;
  }
  getConditionFlags() {
    let flags = 0;
    if (combat.effectHandler.hasEffect("Bleed")) {
      flags |= 1 /* Bleed */;
    }
    if (combat.effectHandler.hasEffect("Burn")) {
      flags |= 2 /* Burn */;
    }
    return flags;
  }
  serialize() {
    return {
      lifeRatio: this.lifeFac,
      modList: this.modList.map((x) => ({ srcId: x.template.id, values: x.values }))
    };
  }
  deserialize(save) {
    if (isNumber(save.lifeRatio)) {
      this.life = this.stats.maxLife.value * save.lifeRatio;
    }
    if (save.modList) {
      for (const serializedMod of save.modList.filter(isDefined)) {
        const mod = this.modList.find((x) => x.template.id === serializedMod.srcId);
        if (mod && serializedMod.values) {
          mod.setValues(serializedMod.values.filter(isNumber));
        }
      }
    }
    this.modDB.replace("EnemyMod", Modifier.extractStatModifierList(...this.modList));
    this.updateStats();
  }
};

// src/game/combat/CombatContext.ts
var CombatContext = class {
  constructor(data) {
    this.data = data;
    this.name = data.name;
    this.modDB = new ModDB();
    this.onComplete = new EventEmitter();
    this._enemyCount = 1;
    this._maxEnemyCount = 0;
    this._enemy = this.generateEnemy();
    this.updateModList(data.combatModList ?? []);
  }
  name;
  modDB;
  onComplete;
  _modList = [];
  _completed = false;
  _enemy;
  _enemyCount;
  _maxEnemyCount;
  active = false;
  get completed() {
    return this._completed;
  }
  set completed(v) {
    this._completed = v;
  }
  get enemy() {
    return this._enemy;
  }
  get enemyCount() {
    return clamp(this._enemyCount, 1, this._maxEnemyCount);
  }
  get maxEnemyCount() {
    return Math.ceil(this._maxEnemyCount);
  }
  get interruptable() {
    return this.data.interruptable ?? false;
  }
  updateModList(modList) {
    this._modList = Modifier.modListFromTexts(modList);
    this.updateModifiers();
    this._enemy.updateStats();
  }
  updateModifiers() {
    const combatModList = this._modList.filter((x) => combatCtxModTemplateList.find((y) => y === x.template && !y.target));
    this.modDB.replace("Combat", Modifier.extractStatModifierList(...combatModList));
    const enemyModList = this._modList.filter((x) => combatCtxModTemplateList.find((y) => y === x.template && y.target === "Enemy"));
    this.enemy.modDB.replace("Combat", Modifier.extractStatModifierList(...enemyModList));
    const playerModList = this._modList.filter((x) => combatCtxModTemplateList.find((y) => y === x.template && y.target === "Player"));
    player.modDB.replace("Combat", Modifier.extractStatModifierList(...playerModList));
    this.calcStats();
  }
  calcStats() {
    const { maxEnemyCount } = calcCombatContextStats({ stats: { baseEnemyCount: this.data.enemyBaseCount }, modDB: this.modDB });
    this._maxEnemyCount = this.data.enemyCountOverride ?? maxEnemyCount;
  }
  generateEnemy() {
    const candidate = this.createEnemyCandidate();
    return this.createEnemyFromCandidate(candidate);
  }
  createEnemyCandidate() {
    const candidates = this.data.candidates;
    let candidate;
    if (candidates.length === 1) {
      candidate = candidates[0];
    } else {
      const weights = candidates.length === 1 ? [1] : candidates.map((x) => x.weight ?? 1);
      const weightedIndex = getRandomWeightedIndex(weights);
      candidate = candidates[weightedIndex];
    }
    assertDefined(candidate, "failed creating enemy");
    return candidate;
  }
  createEnemyFromCandidate(candidate) {
    const enemyData = {
      id: candidate.id,
      name: candidate.name ?? "Enemy",
      baseLife: this.data.enemyBaseLife,
      enemyModList: candidate.modList ?? []
    };
    return new Enemy(enemyData);
  }
  next() {
    if (this.enemyCount >= this.maxEnemyCount) {
      this.completed = true;
      this.onComplete.invoke(this);
      return;
    }
    this._enemyCount++;
    this._enemy = this.generateEnemy();
    this.updateModifiers();
  }
  serialize() {
    return {
      active: this.active,
      enemyId: this._enemy.enemyData.id,
      enemyCount: this.enemyCount,
      enemy: this._enemy?.serialize()
    };
  }
  deserialize(save) {
    this._enemyCount = Math.floor(Math.min(save.enemyCount || this._maxEnemyCount, this._maxEnemyCount));
    const enemyRef = this.data.candidates.find((x) => x.id === save.enemyId);
    if (save.enemy && enemyRef) {
      this._enemy = this.createEnemyFromCandidate({ ...enemyRef });
      this._enemy.deserialize(save.enemy);
    }
    if (save.active) {
      combat.startCombat(this);
    }
  }
};

// src/game/world/World.ts
var World = class {
  page;
  combatCtx = null;
  constructor() {
    this.page = document.createElement("div");
    this.page.classList.add("p-world", "hidden");
    const { menuItem } = game.addPage(this.page, "World", "world");
    menuItem.classList.add("hidden");
    this.page.insertAdjacentHTML("beforeend", '<div class="g-title" data-row="1">World</div>');
    this.page.insertAdjacentHTML("beforeend", '<div class="label" data-label data-row="2"></div>');
    this.page.insertAdjacentHTML("beforeend", '<button style="visibility: hidden;" data-next-world-button>Next World</button>');
    this.page.insertAdjacentElement("beforeend", createModListElement([]));
    this.page.querySelectorStrict("[data-next-world-button]").addEventListener("click", async () => {
      game.stats.world.add(1);
      await fadeOut();
      await game.softReset();
      await fadeIn();
    });
  }
  get data() {
    const data = game.gameConfig.world.worldList[game.stats.world.value - 1];
    assertDefined(data);
    return data;
  }
  get enemyBaseCount() {
    return game.gameConfig.world.enemyBaseCountList[game.stats.level.value - 1] ?? Infinity;
  }
  get enemyBaseLife() {
    const enemyBaseLifeList = game.gameConfig.world.enemyBaseLifeList;
    const index = clamp(game.stats.level.value - 1, 0, enemyBaseLifeList.length - 1);
    const baseLife = enemyBaseLifeList[index];
    assertDefined(baseLife);
    return baseLife;
  }
  createCombatContext() {
    const combatContext = new CombatContext({
      name: "World",
      enemyBaseCount: this.enemyBaseCount,
      enemyBaseLife: this.enemyBaseLife,
      candidates: [...this.generateEnemyCandidates()],
      combatModList: this.data.modList,
      interruptable: true
    });
    combatContext.onComplete.listen(() => {
      if (game.stats.level.value < game.stats.maxLevel.value) {
        game.stats.level.add(1);
      }
      this.combatCtx = this.createCombatContext();
      combat.startCombat(this.combatCtx);
    });
    return combatContext;
  }
  *generateEnemyCandidates() {
    for (const enemyData of game.gameConfig.world.enemyList) {
      if (enemyData.level) {
        if (enemyData.level.min > game.stats.level.value) {
          continue;
        }
        if (enemyData.level.max && enemyData.level.max < game.stats.level.value) {
          continue;
        }
      }
      if (enemyData.world) {
        if (enemyData.world.min > game.stats.world.value) {
          continue;
        }
        if (enemyData.world.max && enemyData.world.max < game.stats.world.value) {
          continue;
        }
      }
      yield enemyData;
    }
  }
  updateMainMenuItem() {
    game.page.querySelectorStrict('[data-main-menu] [data-page-target="world"]').classList.toggle("hidden", game.stats.world.value === 1 && game.stats.level.value !== game.stats.maxLevel.value);
  }
  init() {
    game.stats.level.addListener("change", this.updateMainMenuItem.bind(this));
    game.stats.level.addListener("change", ({ curValue }) => {
      if (curValue !== game.stats.maxLevel.value) {
        return;
      }
      this.combatCtx = this.createCombatContext();
      combat.startCombat(this.combatCtx);
      if (game.stats.world.value === game.gameConfig.world.worldList.length) {
        return;
      }
      this.page.querySelectorStrict("[data-next-world-button]").style.visibility = "visible";
    });
    combat.events.contextChanged.listen(({ oldCtx, newCtx }) => {
      if (!newCtx && oldCtx !== this.combatCtx) {
        if (!this.combatCtx) {
          this.combatCtx = this.createCombatContext();
        }
        combat.startCombat(this.combatCtx);
      }
    });
    game.stats.level.set(1);
  }
  setup() {
    this.page.querySelectorStrict("[data-label]").textContent = `World ${game.stats.world.value.toFixed()}`;
    const modList = Modifier.modListFromTexts(this.data.modList ?? []);
    this.page.querySelectorStrict("[data-mod-list]").replaceWith(createModListElement(modList));
    this.combatCtx?.updateModList(this.data.modList);
    if (!this.combatCtx) {
      this.combatCtx = this.createCombatContext();
    }
    combat.startCombat(this.combatCtx);
    this.updateMainMenuItem();
  }
  reset() {
    this.combatCtx = null;
    this.page.querySelectorStrict("[data-next-world-button]").style.visibility = "hidden";
    this.page.querySelectorStrict("[data-mod-list]").replaceWith(createModListElement([]));
  }
  serialize(save) {
    save.world = {
      combatCtx: this.combatCtx?.serialize()
    };
  }
  deserialize({ world: save }) {
    if (save?.combatCtx) {
      this.combatCtx = this.createCombatContext();
      this.combatCtx.deserialize(save.combatCtx);
    }
  }
};

// src/home/dom.ts
function createModEntryInfoElement(modEntryData) {
  const element = document.createElement("div");
  element.setAttribute("data-mod-entry-info", "");
  const titleElement = document.createElement("div");
  titleElement.classList.add("g-title");
  titleElement.textContent = modEntryData.name;
  const contentElement = document.createElement("div");
  contentElement.classList.add("s-content");
  contentElement.insertAdjacentHTML("beforeend", `<div>Author: ${modEntryData.author}</div>`);
  contentElement.insertAdjacentHTML("beforeend", `<div class="s-desc">${modEntryData.description}</div>`);
  element.append(titleElement, contentElement);
  return { element, contentElement };
}

// src/game/game.ts
var mainMenuNames = [
  "combat",
  "character",
  "blacksmith",
  "treasury",
  "guildHall",
  "world",
  "achievements",
  "statistics",
  "notifications"
];
var GameInitializationStage = /* @__PURE__ */ ((GameInitializationStage2) => {
  GameInitializationStage2[GameInitializationStage2["None"] = 0] = "None";
  GameInitializationStage2[GameInitializationStage2["Init"] = 1] = "Init";
  GameInitializationStage2[GameInitializationStage2["Deserialize"] = 2] = "Deserialize";
  GameInitializationStage2[GameInitializationStage2["Setup"] = 3] = "Setup";
  GameInitializationStage2[GameInitializationStage2["Done"] = 4] = "Done";
  return GameInitializationStage2;
})(GameInitializationStage || {});
var Game = class {
  pageShadowHost;
  page;
  components = new Components();
  tickSecondsEvent = new EventEmitter();
  _gameConfig;
  _gameConfigId;
  stats = createGameStats();
  _resources = {};
  _initializationStage = 0 /* None */;
  _abortController = new AbortController();
  constructor() {
    this.pageShadowHost = document.createElement("div");
    this.pageShadowHost.classList.add("game-page-shadow-host");
    this.pageShadowHost.setAttribute("data-page-content", "game");
    this.pageShadowHost.setAttribute("data-game-page-shadow-host", "");
    const shadowRoot = this.pageShadowHost.attachShadow({ mode: "open" });
    this.page = document.createElement("main");
    this.page.classList.add("p-game");
    shadowRoot.appendChild(this.page);
    document.body.appendChild(this.pageShadowHost);
    this.page.insertAdjacentHTML("beforeend", `<span class="title" onclick="location.hash = 'home'">Modero</span>`);
    const combatOverview = document.createElement("div");
    combatOverview.classList.add("s-combat-overview");
    combatOverview.setAttribute("data-combat-overview", "");
    const playerBar = document.createElement("div");
    playerBar.classList.add("s-player-bar");
    playerBar.insertAdjacentHTML("beforeend", '<span class="player-name" data-player-name>Player</span>');
    const manabar = createCustomElement(ProgressElement);
    manabar.classList.add("s-mana-bar");
    manabar.setAttribute("data-mana-bar", "");
    playerBar.appendChild(manabar);
    const enemyBar = document.createElement("div");
    enemyBar.setAttribute("data-enemy", "");
    enemyBar.classList.add("s-enemy-bar");
    enemyBar.insertAdjacentHTML("beforeend", '<span class="enemy-name" data-enemy-name></span>');
    const lifebar = createCustomElement(ProgressElement);
    lifebar.classList.add("s-life-bar");
    lifebar.setAttribute("data-life-bar", "");
    enemyBar.appendChild(lifebar);
    combatOverview.append(playerBar, enemyBar);
    this.page.appendChild(combatOverview);
    const modTitleElement = document.createElement("span");
    modTitleElement.classList.add("title");
    modTitleElement.setAttribute("data-mod-title", "");
    modTitleElement.addEventListener("click", () => {
      const modEntry = gameModRegister_default.list.findStrict((x) => x.id === this.gameConfigId);
      const modal = createCustomElement(ModalElement);
      modal.setTitle(this.gameConfigName ?? "undefined");
      modal.addBodyElement(createModEntryInfoElement(modEntry).contentElement);
      modal.style.textAlign = "center";
    });
    this.page.appendChild(modTitleElement);
    const menu = createCustomElement(TabMenuElement);
    menu.classList.add("s-menu");
    menu.setAttribute("data-main-menu", "");
    this.page.appendChild(menu);
    this.page.insertAdjacentHTML("beforeend", '<ul class="sticky-stat-group-list g-scroll-list-v" data-sticky-stat-group-list></ul>');
  }
  get menu() {
    return this.page.querySelectorStrict(TabMenuElement.name);
  }
  get gameConfig() {
    const gameConfig = this._gameConfig;
    assertDefined(gameConfig);
    return gameConfig;
  }
  get hasGameConfig() {
    return !!this._gameConfig;
  }
  get gameConfigId() {
    return this._gameConfigId;
  }
  get gameConfigName() {
    return gameModRegister_default.list.find((x) => x.id === this.gameConfigId)?.name;
  }
  get initializationStage() {
    return this._initializationStage;
  }
  get abortSignal() {
    return this._abortController.signal;
  }
  get resources() {
    return this._resources;
  }
  async init(gameConfig, gameConfigId, save) {
    if (this._gameConfig) {
      this.reset();
    }
    this._gameConfigId = gameConfigId;
    this._gameConfig = gameConfig;
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    statistics.createGroup("General", this.stats);
    if (gameConfig.resources) {
      this._resources = createResources(gameConfig.resources);
      statistics.createGroup("Resources", this._resources);
      Object.values(this._resources).forEach((x) => x.addListener("change", statistics.updateStats.bind(statistics, "Resources")));
    }
    this._initializationStage = 1 /* Init */;
    this.stats.maxLevel.set(gameConfig.world.enemyBaseLifeList.length + 1);
    statistics.init();
    combat.init();
    player.init();
    world.init();
    this.components.init();
    this.page.querySelectorStrict('[data-page-target="combat"]').click();
    if (save) {
      this._initializationStage = 2 /* Deserialize */;
      this.deserialize(save);
    }
    this._initializationStage = 3 /* Setup */;
    player.setup();
    world.setup();
    combat.effectHandler.setup();
    this.components.setup();
    this.saveGame();
    statistics.updateAll();
    gameLoop.registerCallback(() => {
      this.tickSecondsEvent.invoke(void 0);
    }, { delay: 1e3 });
    this.tickSecondsEvent.listen(() => {
      this.stats.timePlayed.add(1);
    });
    gameLoop.registerCallback(() => {
      this.saveGame();
    }, { delay: 1e3 * 10 });
    if (ENVIRONMENT !== "development") {
      gameLoop.start();
      gameLoopAnim.start();
    }
    const configName = gameModRegister_default.list.find((x) => x.id === gameConfigId)?.name ?? "undefined";
    this.page.querySelectorStrict("[data-mod-title]").textContent = configName;
    await this.loadPage();
    this._initializationStage = 4 /* Done */;
    window.addEventListener("beforeunload", () => {
      if (this.page.checkVisibility()) {
        this.saveGame();
      }
    }, { signal: this._abortController.signal });
  }
  async loadPage() {
    document.body.appendChild(this.pageShadowHost);
    this.pageShadowHost.shadowRoot?.querySelector('link[rel="stylesheet"]')?.remove();
    return new Promise((resolve, error) => {
      const linkElement = document.createElement("link");
      linkElement.setAttribute("rel", "stylesheet");
      linkElement.setAttribute("type", "text/css");
      linkElement.setAttribute("href", resolveGamePathFromVersion(GAME_CONFIG_VERSION, "style.css"));
      linkElement.addEventListener("error", () => error(), { once: true });
      linkElement.addEventListener("load", () => resolve(), { once: true });
      this.page.appendChild(linkElement);
    });
  }
  reset() {
    this.components.reset();
    this.tickSecondsEvent.removeAllListeners();
    gameLoop.reset();
    gameLoopAnim.reset();
    Object.values(this.stats).forEach((x) => x.reset());
    world.reset();
    combat.reset();
    player.reset();
    statistics.reset();
    notifications.reset();
  }
  async softReset() {
    assertNonNullable(game.gameConfig);
    assertDefined(game.gameConfigId);
    this.stats.level.set(1, true);
    this.saveGame();
    const save = loadGame(game.gameConfigId);
    assertDefined(save);
    const newSave = {
      ...save.meta,
      game: { stats: save.game?.stats }
    };
    void await game.init(game.gameConfig, game.gameConfigId, newSave);
  }
  addPage(pageElement, label, id) {
    const menuItem = this.menu.addMenuItem(label, id, mainMenuNames.indexOf(id));
    this.menu.registerPageElement(pageElement, id);
    this.menu.after(pageElement);
    this.menu.sort();
    return { menuItem };
  }
  addElementHighlight(arg, onRemove) {
    const element = arg instanceof HTMLElement ? arg : this.page.querySelector(`[data-id="${arg}"]`);
    if (!element || element.classList.contains("selected")) {
      return;
    }
    element.setAttribute("data-highlight", "");
    const removeHighlight = ((e) => {
      if (e.type === "mouseover" && !e.ctrlKey) {
        return;
      }
      element.removeAttribute("data-highlight");
      this.updateHighlightMenuItems(element);
      element.removeEventListener("click", removeHighlight);
      element.removeEventListener("mouseover", removeHighlight);
      onRemove?.();
    }).bind(this);
    element.addEventListener("click", removeHighlight);
    element.addEventListener("mouseover", removeHighlight);
    this.updateHighlightMenuItems(element);
  }
  removeHighlightElement(arg) {
    const element = arg instanceof HTMLElement ? arg : this.page.querySelector(`[data-id="${arg}"]`);
    if (!element) {
      return;
    }
    element.removeAttribute("data-highlight");
    this.updateHighlightMenuItems(element);
  }
  clearHighlights() {
    this.page.querySelectorAll("[data-highlight]").forEach((x) => x.removeAttribute("data-highlight"));
  }
  updateHighlightMenuItems(element) {
    for (const [menuItem, pageElement] of this.menu.generateTabMenuAnectors(element)) {
      const pageId = menuItem.getAttribute("data-page-target");
      const highlightedElementsCount = pageElement.querySelector(`[data-page-content="${pageId}"]`)?.querySelectorAll("[data-highlight]").length ?? 0;
      menuItem.toggleAttribute("data-highlight", highlightedElementsCount > 0);
    }
  }
  saveGame() {
    assertDefined(this._gameConfigId);
    const saves = loadGame();
    const oldSave = saves.get(this._gameConfigId);
    const serialization = {
      meta: { gameConfigId: this._gameConfigId, createdAt: oldSave?.meta?.createdAt || Date.now(), lastSavedAt: Date.now() }
    };
    this.serialize(serialization);
    saves.set(this._gameConfigId, serialization);
    saveGame(saves);
  }
  dispose() {
    this.pageShadowHost.remove();
    this._abortController.abort();
    console.log("dispose");
  }
  serialize(save) {
    save.game = {
      stats: serializeStats(this.stats),
      resources: serializeStats(this.resources)
    };
    world.serialize(save);
    statistics.serialize(save);
    player.serialize(save);
    world.serialize(save);
    combat.effectHandler.serialize(save);
    notifications.serialize(save);
    this.components.serialize(save);
    save.elementHighlightIdList = [...game.page.querySelectorAll("[data-highlight]")].map((x) => x.getAttribute("data-id")).filter(isNonNullable);
    const name = this.menu.querySelectorStrict(".selected")?.getAttribute("data-page-target");
    sessionStorage.setItem("main-menu", name || "");
  }
  deserialize(save) {
    for (const id of save.elementHighlightIdList ?? []) {
      if (id) {
        this.addElementHighlight(id);
      }
    }
    deserializeStats(game.stats, save.game?.stats || {});
    deserializeStats(game.resources, save.game?.resources || {});
    statistics.deserialize(save);
    player.deserialize(save);
    world.deserialize(save);
    this.components.deserialize(save);
    world.deserialize(save);
    combat.effectHandler.deserialize(save);
    notifications.deserialize(save);
    this.menu.querySelector(`[data-page-target="${sessionStorage.getItem("main-menu")}"]`)?.click();
  }
};
var gameLoop = new Loop("Default");
var gameLoopAnim = new Loop("Animation");
var game = new Game();
var statistics = new Statistics();
var combat = new Combat();
var player = new Player();
var notifications = new Notifications();
var world = new World();
async function init(args) {
  try {
    await game.init(args[0], args[1], args[2]);
  } catch (error) {
    dispose();
    throw error;
  }
  document.addEventListener("visibilitychange", toggleLoopType);
  if (ENVIRONMENT === "development") {
    window.modero = { ...window.modero, ...initDevTools() };
  } else {
    document.querySelector("[data-live-server-proxy]")?.remove();
  }
}
function dispose() {
  game.dispose();
  if (ENVIRONMENT === "development") {
    window.modero?.dispose();
  }
}
function toggleLoopType() {
  if (document.hidden) {
    gameLoop.setLoopType("WebWorker");
  } else {
    gameLoop.setLoopType("Default");
  }
}
export {
  Game,
  GameInitializationStage,
  combat,
  dispose,
  game,
  gameLoop,
  gameLoopAnim,
  init,
  mainMenuNames,
  notifications,
  player,
  statistics,
  world
};
//# sourceMappingURL=game.js.map
