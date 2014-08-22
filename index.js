var watch = require('watch');
var fs  = require('fs');
var swig  = require('swig');

swig.setDefaults({ autoescape: false });

var tpl = swig.compileFile('assets/template.html');
var widget = {}

function createMonitor() {
  watch.createMonitor(widget.path, function (monitor) {
    //monitor.files['/home/mikeal/.zshrc'] // Stat object for my zshrc.
    monitor.on('created', function (f, stat) {
      // Handle new files
    });
    monitor.on('changed', function (f, curr, prev) {
      // Handle file changes
      console.log('changed', f, curr, prev);
      update();
    });
    monitor.on('removed', function (f, stat) {
      // Handle removed files
    });
    //monitor.stop(); // Stop watching
  });
}

function update() {
  var html;
  var js;
  var css;

  var message = document.getElementById('message');
  message.innerText = 'Loading...';

  function getHtml() {
    fs.readFile(widget.html, function read(err, data) {
      if (err) {
        console.log(err);
      }
      html = data.toString('utf8');
      getJs();
    });
  }

  function getJs() {
    fs.readFile(widget.js, function read(err, data) {
      if (err) {
        console.log(err);
      }
      js = data.toString('utf8');
      getCss();
    });
  }

  function getCss() {
    fs.readFile(widget.css, function read(err, data) {
      if (err) {
        console.log(err);
      }
      css = data.toString('utf8');
      render();
    });
  }

  function render() {
    var html_string = tpl({
      stylesheet: css,
      html: html,
      javascript: js
    });

    var iframe = document.getElementById('test_iframe');
    
    var iframedoc = iframe.document;
    if (iframe.contentDocument) {
      iframedoc = iframe.contentDocument;
    }
    else if (iframe.contentWindow) {
      iframedoc = iframe.contentWindow.document;
    }
    if (iframedoc){
      // Put the content in the iframe
      iframedoc.open();
      iframedoc.writeln(html_string);
      iframedoc.close();
    } else {
      //just in case of browsers that don't support the above 3 properties.
      //fortunately we don't come across such case so far.
      alert('Cannot inject dynamic contents into iframe.');
    }
  
    message.innerText = widget.path;
  } 

  getHtml();
}

function findFiles(cb) {
  fs.readdir(widget.path, gotFiles);

  function gotFiles(err, files) {
    var filePatt = /\.[0-9a-z]{1,5}$/i;
    for(var i in files) {
      var m1 = (files[i]).match(filePatt);
      switch(m1[0]) {
        case '.html':
          widget.html = widget.path + '/' + files[i];
        break;
        case '.js':
          widget.js = widget.path + '/' + files[i];
        break;
        case '.css':
          widget.css = widget.path + '/' + files[i];
        break;
      }
    }

    cb(err, widget);
  }
}

function showDeveloperTools() {
  require('nw.gui').Window.get().showDevTools();
}

$(document).ready(function() {
  var wrapper = $('<div/>').css({height:0,width:0,'overflow':'hidden'});
  var chooser = $(':file').wrap(wrapper);

  chooser.change(function(){
    if(!$(this).val()) {
      return;
    }
    
    widget.path = $(this).val();
    console.log('WIDGET PATH '+widget.path);
    findFiles(function(err, widget) {
      console.log(err || widget);

      update();
      createMonitor();
    });
  })

  chooser.trigger('click');  

  $('#file').click(function(){
      chooser.click();
  }).show();

  $("#reload").click(update);

  $("#showDeveloperTools").click(showDeveloperTools);
});
