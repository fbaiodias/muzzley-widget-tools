var EventEmitter = require('events').EventEmitter;
var util = require('util');
var watch = require('watch');
var fs  = require('fs');
var path = require('path');
var async = require('async');
var slug = require('slug')
// var config  = require('./config');

var widgets = [];

var fileManager = module.exports = {};

fileManager.createMonitor = function createMonitor(basePath, cb) {
  var self = this;

  watch.createMonitor(basePath, function (monitor) {
    var emitter = new EventEmitter();

    monitor.on('created', function (f, stat) {
      // Handle new files
      var dirname = path.dirname(f);
      var fileName = path.basename(f);
    });

    monitor.on('changed', function (f, curr, prev) {
      // Handle file changes
      var dirname = path.dirname(f);
      var fileName = path.basename(f);

      // console.log('changed', fileName, 'on', dirname, curr, prev);

      self.findFiles(dirname, function(err, widget) {
        if(err) {
          return emitter.emit('error', err);
        }

        // console.log('findFiles', widget);

        self.readFiles(widget, function(err, widget) {
          if(err) {
            return emitter.emit('error', err);
          }

          // console.log('readFiles', widget);

          emitter.emit('update', widget);
        });
      });
    });

    monitor.on('removed', function (f, stat) {
      // Handle removed files
      var dirname = path.dirname(f);
      var fileName = path.basename(f);
    });

    //monitor.stop(); // Stop watching
    cb(emitter);
  });
}

fileManager.findFiles = function findFiles(widgetPath, cb) {
  fs.readdir(widgetPath, gotFiles);

  function gotFiles(err, files) {
    if(err || !files) {
      return cb(err);
    }

    var filePatt = /\.[0-9a-z]{1,5}$/i;
    var widget = {
      name: path.basename(widgetPath),
      paths: {
        base: widgetPath
      }
    };

    for(var i in files) {
      var m1 = (files[i]).match(filePatt);
      if(m1 && m1.length > 0) {
        switch(m1[0]) {
          case '.json':
            widget.paths.config = widget.paths.base + '/' + files[i];
            var widgetConfig = require(widget.paths.config);
            widget.id = widgetConfig.id;
          break;
          case '.html':
            widget.paths.html = widget.paths.base + '/' + files[i];
          break;
          case '.js':
            widget.paths.js = widget.paths.base + '/' + files[i];
          break;
          case '.css':
            widget.paths.css = widget.paths.base + '/' + files[i];
          break;
        }
      }
    }

    cb(null, widget);
  }
}

fileManager.readFiles = function readFiles(widget, done) {
  async.parallel([
    function getHtml(cb) {
      fs.readFile(widget.paths.html, function read(err, data) {
        if (err) {
          return cb(err);
        }
        widget.html = data.toString('utf8');
        cb();
      });
    },
    function getJs(cb) {
      fs.readFile(widget.paths.js, function read(err, data) {
        if (err) {
          return cb(err);
        }
        widget.js = data.toString('utf8');
        cb();
      });
    },
    function getCss(cb) {
      fs.readFile(widget.paths.css, function read(err, data) {
        if (err) {
          return cb(err);
        }
        widget.css = data.toString('utf8');
        cb();
      });
    }
  ], function(err) {
    done(err, widget);
  });
}


fileManager.generateWidgetPaths = function generate(basePath, widget, cb) {
  widget.paths = widget.paths || {};

  var widgetPath = widget.paths.base || path.join(basePath, slug(widget.name));

  widget.paths = {
    base: widgetPath,
    html: widget.paths.html || path.join(widgetPath, 'index.html'),
    js: widget.paths.js || path.join(widgetPath, 'index.js'),
    css: widget.paths.css || path.join(widgetPath, 'index.css'),
    config: widget.paths.config || path.join(widgetPath, 'config.json'),
  }

  if(cb) {
    cb(null, widget);
  } else {
    return widget;
  }
}


fileManager.writeFiles = function writeFiles(widget, done) {
  this.ensureExists(widget.paths.base, function(err) {
    if(err) {
      return cb(err);
    }

    async.parallel([
      function writeHtml(cb) {
        fs.writeFile(widget.paths.html, widget.html, cb);
      },
      function writeJs(cb) {
        fs.writeFile(widget.paths.js, widget.js, cb);
      },
      function writeCss(cb) {
        fs.writeFile(widget.paths.css, widget.css, cb);
      },
      function writeConfig(cb) {
        fs.writeFile(widget.paths.config, JSON.stringify(widget, null, 2), cb);
      },
    ], function(err) {
      done(err, widget);
    });
  });
}


fileManager.ensureExists = function ensureExists(path, mask, cb) {
  if (typeof mask == 'function') { // allow the `mask` parameter to be optional
    cb = mask;
    mask = 0777;
  }
  fs.mkdir(path, mask, function(err) {
    if (err) {
      if (err.code == 'EEXIST') cb(null); // ignore the error if the folder already exists
      else cb(err); // something else went wrong
    } else cb(null); // successfully created folder
  });
}

