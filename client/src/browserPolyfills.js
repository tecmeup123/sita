/**
 * Enhanced Browser Polyfills for Node.js Compatibility
 * 
 * This module provides polyfills for commonly used Node.js modules and utilities
 * that might be referenced in libraries but need to run in a browser environment.
 * 
 * We use proper module exports pattern to prevent "has been externalized" warnings from Vite.
 */

// Buffer implementation using Uint8Array with additional helper methods
class BufferPolyfill extends Uint8Array {
  constructor(arg, encodingOrOffset, length) {
    if (typeof arg === 'number') {
      super(arg);
    } else if (arg instanceof Uint8Array) {
      super(arg);
    } else if (Array.isArray(arg)) {
      super(arg);
    } else if (typeof arg === 'string') {
      const encoding = encodingOrOffset || 'utf8';
      if (encoding === 'hex') {
        const hexString = arg.startsWith('0x') ? arg.substring(2) : arg;
        const bytes = hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];
        super(bytes);
      } else {
        // Default to UTF-8
        const encoder = new TextEncoder();
        super(encoder.encode(arg));
      }
    } else {
      super(0);
    }
  }

  // Static methods
  static from(arg, encodingOrOffset, length) {
    if (!arg) return new BufferPolyfill(0);
    
    if (typeof arg === 'string') {
      return new BufferPolyfill(arg, encodingOrOffset);
    }
    
    if (arg instanceof Uint8Array) {
      const buffer = new BufferPolyfill(arg.length);
      buffer.set(arg);
      return buffer;
    }
    
    return new BufferPolyfill(arg);
  }
  
  static alloc(size, fill = 0, encoding) {
    const buffer = new BufferPolyfill(size);
    if (fill !== 0) {
      buffer.fill(fill);
    }
    return buffer;
  }
  
  static concat(list, totalLength) {
    if (!totalLength && list.length > 0) {
      totalLength = list.reduce((acc, buf) => acc + buf.length, 0);
    }
    
    const result = new BufferPolyfill(totalLength);
    let offset = 0;
    
    for (const buf of list) {
      const bufArray = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      result.set(bufArray, offset);
      offset += bufArray.length;
    }
    
    return result;
  }

  // Instance methods
  copy(target, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
    const sourceBuffer = this.subarray(sourceStart, sourceEnd);
    target.set(sourceBuffer, targetStart);
    return sourceBuffer.length;
  }
  
  slice(start, end) {
    return new BufferPolyfill(super.slice(start, end));
  }
  
  toString(encoding = 'utf8', start = 0, end = this.length) {
    const slice = this.subarray(start, end);
    
    if (encoding === 'hex') {
      return Array.from(slice)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Default to UTF-8
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(slice);
  }
  
  // Add common Buffer methods used in crypto operations
  readUInt8(offset) {
    return this[offset];
  }
  
  readUInt16LE(offset) {
    return this[offset] | (this[offset + 1] << 8);
  }
  
  readUInt32LE(offset) {
    return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000);
  }
  
  writeUInt8(value, offset) {
    this[offset] = value & 0xff;
    return offset + 1;
  }
  
  writeUInt16LE(value, offset) {
    this[offset] = value & 0xff;
    this[offset + 1] = (value >>> 8) & 0xff;
    return offset + 2;
  }
  
  writeUInt32LE(value, offset) {
    this[offset] = value & 0xff;
    this[offset + 1] = (value >>> 8) & 0xff;
    this[offset + 2] = (value >>> 16) & 0xff;
    this[offset + 3] = (value >>> 24) & 0xff;
    return offset + 4;
  }
}

// Enhanced EventEmitter with full Node.js-compatible API
class EventEmitterPolyfill {
  constructor() {
    this._events = {};
    this._maxListeners = 10;
  }
  
  setMaxListeners(n) {
    this._maxListeners = n;
    return this;
  }
  
  getMaxListeners() {
    return this._maxListeners;
  }
  
  _addListener(event, listener, prepend) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    
    if (prepend) {
      this._events[event].unshift(listener);
    } else {
      this._events[event].push(listener);
    }
    
    // Emit warning if more than max listeners
    if (this._events[event].length > this._maxListeners) {
      console.warn(`Warning: Possible EventEmitter memory leak detected. ${this._events[event].length} ${event} listeners added.`);
    }
    
    return this;
  }
  
  addListener(event, listener) {
    return this._addListener(event, listener, false);
  }
  
  on(event, listener) {
    return this.addListener(event, listener);
  }
  
  prependListener(event, listener) {
    return this._addListener(event, listener, true);
  }
  
  once(event, listener) {
    const onceWrapper = (...args) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };
    onceWrapper._original = listener;
    return this.addListener(event, onceWrapper);
  }
  
  prependOnceListener(event, listener) {
    const onceWrapper = (...args) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };
    onceWrapper._original = listener;
    return this.prependListener(event, onceWrapper);
  }
  
  removeListener(event, listener) {
    if (!this._events[event]) return this;
    
    this._events[event] = this._events[event].filter(l => {
      return l !== listener && (!l._original || l._original !== listener);
    });
    
    return this;
  }
  
  off(event, listener) {
    return this.removeListener(event, listener);
  }
  
  removeAllListeners(event) {
    if (event) {
      delete this._events[event];
    } else {
      this._events = {};
    }
    return this;
  }
  
  listeners(event) {
    return this._events[event] ? [...this._events[event]] : [];
  }
  
  emit(event, ...args) {
    if (!this._events[event]) return false;
    
    const listeners = [...this._events[event]];
    for (const listener of listeners) {
      try {
        listener.apply(this, args);
      } catch (err) {
        console.error(err);
      }
    }
    
    return true;
  }
}

// Transform stream implementation
class Transform extends EventEmitterPolyfill {
  constructor(options) {
    super();
    this.options = options || {};
    this.readableHighWaterMark = options?.readableHighWaterMark || 16384;
    this.writableHighWaterMark = options?.writableHighWaterMark || 16384;
    this._writableState = { ended: false };
    this._readableState = { ended: false };
    this._buffer = [];
  }
  
  _transform(chunk, encoding, callback) {
    callback(null, chunk);
  }
  
  _flush(callback) {
    callback();
  }
  
  on(event, listener) {
    return super.on(event, listener);
  }
  
  once(event, listener) {
    return super.once(event, listener);
  }
  
  removeListener(event, listener) {
    return super.removeListener(event, listener);
  }
  
  emit(event, ...args) {
    return super.emit(event, ...args);
  }
  
  pipe(destination) {
    this.on('data', chunk => {
      try {
        destination.write(chunk);
      } catch (err) {
        console.error('Error writing to destination:', err);
      }
    });
    
    this.on('end', () => {
      try {
        destination.end();
      } catch (err) {
        console.error('Error ending destination:', err);
      }
    });
    
    return destination;
  }
  
  push(chunk) {
    if (chunk === null) {
      this._readableState.ended = true;
      this.emit('end');
      return false;
    }
    
    this._buffer.push(chunk);
    this.emit('data', chunk);
    return true;
  }
  
  write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
      encoding = 'utf8';
    }
    
    try {
      this._transform(chunk, encoding, (err, transformedChunk) => {
        if (err) {
          this.emit('error', err);
          if (callback) callback(err);
          return;
        }
        
        if (transformedChunk) {
          this.push(transformedChunk);
        }
        
        if (callback) callback();
      });
      return true;
    } catch (err) {
      this.emit('error', err);
      if (callback) callback(err);
      return false;
    }
  }
  
  end(chunk, encoding, callback) {
    if (chunk) {
      this.write(chunk, encoding, () => {
        this._flush((err) => {
          if (err) {
            this.emit('error', err);
            if (callback) callback(err);
            return;
          }
          
          this._writableState.ended = true;
          this.push(null);
          if (callback) callback();
        });
      });
    } else {
      this._flush((err) => {
        if (err) {
          this.emit('error', err);
          if (callback) callback(err);
          return;
        }
        
        this._writableState.ended = true;
        this.push(null);
        if (callback) callback();
      });
    }
    return this;
  }
}

// Apply polyfills if we're in a browser environment
if (typeof window !== 'undefined') {
  // Console message for developers
  console.log("Node.js polyfills loaded for browser environment");
  
  // Buffer
  window.Buffer = window.Buffer || BufferPolyfill;
  
  // Process
  window.process = window.process || {
    env: {
      NODE_ENV: import.meta.env.MODE || 'production',
      // Add any environment variables needed here
    },
    nextTick: (callback, ...args) => setTimeout(() => callback(...args), 0),
    browser: true,
    version: '0.0.0',
    versions: { node: '0.0.0' }
  };
  
  // Global
  window.global = window.global || window;
  
  // Events
  window.events = {
    EventEmitter: EventEmitterPolyfill
  };
  
  // Stream
  window.stream = {
    Transform
  };
  
  // Util
  window.util = {
    debuglog: (name) => {
      return (...args) => {
        if (console && console.debug) {
          console.debug(`[${name}]`, ...args);
        }
      };
    },
    inspect: (obj, options) => {
      try {
        return JSON.stringify(obj, null, 2);
      } catch (e) {
        return String(obj);
      }
    },
    inherits: (ctor, superCtor) => {
      if (ctor === undefined || ctor === null) {
        throw new TypeError('The constructor to "inherits" must not be null or undefined');
      }
      if (superCtor === undefined || superCtor === null) {
        throw new TypeError('The super constructor to "inherits" must not be null or undefined');
      }
      if (superCtor.prototype === undefined) {
        throw new TypeError('The super constructor to "inherits" must have a prototype');
      }
      ctor.super_ = superCtor;
      Object.setPrototypeOf(ctor.prototype, superCtor.prototype);
    },
    types: {
      isBuffer: (obj) => obj instanceof BufferPolyfill,
      isFunction: (obj) => typeof obj === 'function',
      isString: (obj) => typeof obj === 'string',
      isNumber: (obj) => typeof obj === 'number',
      isObject: (obj) => obj !== null && typeof obj === 'object'
    }
  };
  
  // Export for modules that might use require/import
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      Buffer: BufferPolyfill,
      events: { EventEmitter: EventEmitterPolyfill },
      stream: { Transform },
      util: window.util
    };
  }
}