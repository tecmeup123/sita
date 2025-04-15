// This file provides more extensive polyfills for Node.js modules in the browser environment
// These are specifically for the @ckb-ccc/ccc library which depends on Node.js modules

// Buffer implementation
class BufferPolyfill {
  constructor(arg, encodingOrOffset, length) {
    // Handle different constructor formats
    if (typeof arg === 'number') {
      // Buffer.alloc(size)
      this._bytes = new Uint8Array(arg);
    } else if (arg instanceof Uint8Array) {
      // From Uint8Array
      this._bytes = arg;
    } else if (Array.isArray(arg)) {
      // From array of numbers
      this._bytes = new Uint8Array(arg);
    } else if (typeof arg === 'string') {
      // From string with encoding
      const encoding = encodingOrOffset || 'utf8';
      if (encoding === 'hex') {
        // Handle hex encoding
        const hexString = arg.startsWith('0x') ? arg.substring(2) : arg;
        this._bytes = new Uint8Array(
          hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        );
      } else {
        // Default to utf8
        const encoder = new TextEncoder();
        this._bytes = encoder.encode(arg);
      }
    } else if (arg === null || arg === undefined) {
      this._bytes = new Uint8Array(0);
    } else {
      console.warn('Unsupported Buffer constructor arguments', arg, encodingOrOffset, length);
      this._bytes = new Uint8Array(0);
    }
    
    // Make buffer array-like
    this.length = this._bytes.length;
    for (let i = 0; i < this._bytes.length; i++) {
      this[i] = this._bytes[i];
    }
  }
  
  // Buffer.from static methods
  static from(arg, encodingOrOffset, length) {
    return new BufferPolyfill(arg, encodingOrOffset, length);
  }
  
  static alloc(size, fill, encoding) {
    const buffer = new BufferPolyfill(size);
    if (fill !== undefined) {
      if (typeof fill === 'string') {
        const fillBuffer = BufferPolyfill.from(fill, encoding);
        for (let i = 0; i < size; i += fillBuffer.length) {
          fillBuffer.copy(buffer, i, 0, Math.min(fillBuffer.length, size - i));
        }
      } else if (typeof fill === 'number') {
        for (let i = 0; i < size; i++) {
          buffer[i] = fill;
        }
      }
    }
    return buffer;
  }
  
  static concat(list, totalLength) {
    if (totalLength === undefined) {
      totalLength = list.reduce((acc, buf) => acc + buf.length, 0);
    }
    
    const result = BufferPolyfill.alloc(totalLength);
    let offset = 0;
    for (const buf of list) {
      buf.copy(result, offset);
      offset += buf.length;
    }
    return result;
  }

  // Instance methods  
  copy(target, targetStart, sourceStart, sourceEnd) {
    targetStart = targetStart || 0;
    sourceStart = sourceStart || 0;
    sourceEnd = sourceEnd || this.length;
    
    const sourceSlice = this._bytes.slice(sourceStart, sourceEnd);
    for (let i = 0; i < sourceSlice.length; i++) {
      target[targetStart + i] = sourceSlice[i];
    }
    
    return sourceSlice.length;
  }
  
  slice(start, end) {
    return new BufferPolyfill(this._bytes.slice(start, end));
  }
  
  toString(encoding, start, end) {
    start = start || 0;
    end = end || this.length;
    
    const slice = this._bytes.slice(start, end);
    
    if (encoding === 'hex') {
      return Array.from(slice)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Default to UTF-8
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(slice);
    }
  }
  
  // Add more Buffer methods as needed
  readUInt8(offset) {
    return this[offset];
  }
  
  readUInt16LE(offset) {
    return this[offset] | (this[offset + 1] << 8);
  }
  
  readUInt32LE(offset) {
    return (
      this[offset] |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
    );
  }
  
  writeUInt8(value, offset) {
    this[offset] = value & 0xff;
    return offset + 1;
  }
  
  writeUInt16LE(value, offset) {
    this[offset] = value & 0xff;
    this[offset + 1] = (value >> 8) & 0xff;
    return offset + 2;
  }
  
  writeUInt32LE(value, offset) {
    this[offset] = value & 0xff;
    this[offset + 1] = (value >> 8) & 0xff;
    this[offset + 2] = (value >> 16) & 0xff;
    this[offset + 3] = (value >> 24) & 0xff;
    return offset + 4;
  }
}

// Enhanced EventEmitter implementation
class EventEmitterPolyfill {
  constructor() {
    this.events = {};
    this.maxListeners = 10;
  }
  
  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }
  
  getMaxListeners() {
    return this.maxListeners;
  }
  
  _addListener(event, listener, prepend) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    if (this.events[event].length >= this.maxListeners) {
      console.warn(`Warning: Possible EventEmitter memory leak detected. ${this.events[event].length} ${event} listeners added.`);
    }
    
    if (prepend) {
      this.events[event].unshift(listener);
    } else {
      this.events[event].push(listener);
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
    
    return this.addListener(event, onceWrapper);
  }
  
  prependOnceListener(event, listener) {
    const onceWrapper = (...args) => {
      this.removeListener(event, onceWrapper);
      listener.apply(this, args);
    };
    
    return this.prependListener(event, onceWrapper);
  }
  
  removeListener(event, listener) {
    if (!this.events[event]) return this;
    
    this.events[event] = this.events[event].filter(l => l !== listener);
    
    return this;
  }
  
  off(event, listener) {
    return this.removeListener(event, listener);
  }
  
  removeAllListeners(event) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    
    return this;
  }
  
  listeners(event) {
    return this.events[event] || [];
  }
  
  emit(event, ...args) {
    if (!this.events[event]) return false;
    
    this.events[event].forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (err) {
        console.error('Error in EventEmitter listener:', err);
      }
    });
    
    return true;
  }
}

// Stream implementation
class Transform {
  constructor(options) {
    this.options = options || {};
    this.emitter = new EventEmitterPolyfill();
    this._readableState = { flowing: null };
    this._writableState = {};
  }
  
  _transform(chunk, encoding, callback) {
    // Default implementation just passes through
    callback(null, chunk);
  }
  
  _flush(callback) {
    callback();
  }
  
  on(event, listener) {
    this.emitter.on(event, listener);
    return this;
  }
  
  once(event, listener) {
    this.emitter.once(event, listener);
    return this;
  }
  
  removeListener(event, listener) {
    this.emitter.removeListener(event, listener);
    return this;
  }
  
  emit(event, ...args) {
    return this.emitter.emit(event, ...args);
  }
  
  pipe(destination) {
    this.on('data', chunk => {
      destination.write(chunk);
    });
    
    this.on('end', () => {
      destination.end();
    });
    
    return destination;
  }
  
  push(chunk) {
    if (chunk === null) {
      this.emit('end');
    } else if (chunk !== undefined) {
      this.emit('data', chunk);
    }
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
          if (callback) callback(err);
          this.emit('error', err);
          return;
        }
        
        if (transformedChunk) {
          this.push(transformedChunk);
        }
        
        if (callback) callback();
      });
      
      return true;
    } catch (err) {
      if (callback) callback(err);
      this.emit('error', err);
      return false;
    }
  }
  
  end(chunk, encoding, callback) {
    if (chunk) {
      this.write(chunk, encoding);
    }
    
    this._flush(err => {
      if (err) {
        if (callback) callback(err);
        this.emit('error', err);
        return;
      }
      
      this.push(null);
      if (callback) callback();
    });
    
    return this;
  }
}

// Util implementation
const utilPolyfill = {
  debuglog: (section) => {
    return (...args) => {
      console.debug(`[${section}]`, ...args);
    };
  },
  
  inspect: (obj, options) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  },
  
  isBuffer: (obj) => {
    return obj instanceof BufferPolyfill;
  },
  
  isString: (obj) => {
    return typeof obj === 'string';
  },
  
  isNumber: (obj) => {
    return typeof obj === 'number';
  },
  
  isObject: (obj) => {
    return obj !== null && typeof obj === 'object';
  }
};

// Export the polyfills
if (typeof window !== 'undefined') {
  // Buffer polyfill
  window.Buffer = window.Buffer || BufferPolyfill;
  
  // EventEmitter polyfill
  window.EventEmitter = window.EventEmitter || EventEmitterPolyfill;
  window.events = window.events || {
    EventEmitter: EventEmitterPolyfill
  };
  
  // Stream polyfill
  window.stream = window.stream || {
    Transform: Transform
  };
  
  // Util polyfill
  window.util = window.util || utilPolyfill;
  
  // Process polyfill
  window.process = window.process || {
    env: {
      NODE_ENV: 'production'
    },
    nextTick: (callback, ...args) => {
      setTimeout(() => callback(...args), 0);
    }
  };
  
  // Global polyfill
  window.global = window.global || window;
  
  console.log('Node.js polyfills loaded for browser environment');
}

export {
  BufferPolyfill as Buffer,
  EventEmitterPolyfill as EventEmitter,
  Transform,
  utilPolyfill as util
};