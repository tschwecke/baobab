/**
 * Cursor Abstraction
 * ===================
 *
 * Part selection into an immutable data tree.
 */
var EventEmitter = require('emmett'),
    mixins = require('./mixins.js');
    helpers = require('./helpers.js'),
    types = require('./typology.js');

/**
 * Main Class
 */
function Cursor(root, path) {
  var self = this;

  // Extending event emitter
  EventEmitter.call(this);

  // Enforcing array
  path = path || [];
  path = (typeof path === 'string') ? [path] : path;

  // Properties
  this.root = root;
  this.path = path;
  this.relevant = this.get() !== undefined;

  // Root listeners
  this.root.on('update', function(e) {
    var log = e.data.log,
        shouldFire = false,
        c, p, l, m, i, j;

    // If selector listens at root, we fire
    if (!self.path.length)
      return self.emit('update');

    // Checking update log to see whether the cursor should update.
    root:
    for (i = 0, l = log.length; i < l; i++) {
      c = log[i];

      for (j = 0, m = c.length; j < m; j++) {
        p = c[j];

        // If path is not relevant to us, we break
        if (p !== self.path[j])
          break;

        // If we reached last item and we are relevant, we fire
        if (j + 1 === m || j + 1 === self.path.length) {
          shouldFire = true;
          break root;
        }
      }
    }

    // Handling relevancy
    var data = self.get() !== undefined;

    if (self.relevant) {
      if (data && shouldFire) {
        self.emit('update');
      }
      else {
        self.emit('irrelevant');
        self.relevant = false;
      }
    }
    else {
      if (data && shouldFire) {
        self.emit('relevant');
        self.emit('update');
        self.relevant = true;
      }
    }
  });

  // Making mixin
  this.mixin = mixins.cursor(this);
}

helpers.inherits(Cursor, EventEmitter);

/**
 * Private prototype
 */
Cursor.prototype._stack = function(spec) {
  this.root._stack(helpers.pathObject(this.path, spec));
  return this;
};

/**
 * Prototype
 */
Cursor.prototype.select = function(path) {
  if (!path)
    throw Error('precursors.Cursor.select: invalid path.');

  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (!types.check(path, 'path'))
    throw Error('precursors.Cursor.select: invalid path.');
  return new Cursor(this.root, this.path.concat(path));
};

Cursor.prototype.up = function() {
  if (this.path.length)
    return new Cursor(this.root, this.path.slice(0, -1));
  else
    return new Cursor(this.root, []);
};

Cursor.prototype.get = function(path) {
  if (arguments.length > 1)
    path = Array.prototype.slice.call(arguments);

  if (path)
    return this.root.get(this.path.concat(path));
  else
    return this.root.get(this.path);
};

Cursor.prototype.set = function(value) {
  return this.update({$set: value});
};

Cursor.prototype.push = function(value) {
  return this.update({$push: value});
};

Cursor.prototype.unshift = function(value) {
  return this.update({$unshift: value});
};

Cursor.prototype.append = function(value) {
  return this.update({$append: value});
};

Cursor.prototype.prepend = function(value) {
  return this.update({$prepend: value});
};

Cursor.prototype.update = function(spec) {
  return this._stack(spec);
};

/**
 * Output
 */
Cursor.prototype.toJS = function() {
  return this.get().toJS();
};
Cursor.prototype.toJSON = Cursor.prototype.toJS;
Cursor.prototype.toString = function() {
  return 'Cursor ' + this.get().toString().replace(/^[^{]+\{/, '{');
};
Cursor.prototype.inspect = Cursor.prototype.toString;
Cursor.prototype.toSource = Cursor.prototype.toString;

/**
 * Export
 */
module.exports = Cursor;