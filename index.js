var watch = require('watch');
var fs  = require('fs');
var swig  = require('swig');
var config  = require('./config');

swig.setDefaults({ autoescape: false });

var baseUrl = config.muzzley.url;

var tpl = swig.compileFile('assets/template.html');
var widget = {};

var authenticated = false;

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
      stylesheet: css.replace(/\"\/\//g, '"https://').replace(/\'\/\//g, '\'https://'),
      html: html.replace(/\"\/\//g, '"https://').replace(/\'\/\//g, '\'https://'),
      javascript: js.replace(/\"\/\//g, '"https://').replace(/\'\/\//g, '\'http://')
    });

    //console.log(html_string);

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

    saveWidget(html,css,js);
  } 

  if(widget.html && widget.html !== '') {
    getHtml();
  }
}

function findFiles(cb) {
  fs.readdir(widget.path, gotFiles);

  function gotFiles(err, files) {
    if(err || !files) {
      alert('Oh no, there was an error!!!');
      return console.log(err);
    }

    var filePatt = /\.[0-9a-z]{1,5}$/i;
    localStorage.widgetId = '';
    localStorage.activity = '';
      
    for(var i in files) {
      var m1 = (files[i]).match(filePatt);
      if(m1 && m1.length > 0) {
        switch(m1[0]) {
          case '.json':
            var configFile = require(widget.path + '/' + files[i]);
            localStorage.widgetId = configFile.id;
            localStorage.activity = configFile.activity;
          break;
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
    }

    console.log('localStorage config', JSON.stringify(localStorage.widgetId, null, 2));

    if(!localStorage.widgetId || localStorage.widgetId == '') {
      alert('No config.json file found!!');
      err = 'No config.json file found!!';
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
    if(!$(this).val() || $(this).val() == '') {
      return;
    }
    
    localStorage.path = $(this).val();
    changePath();
  });

  if(localStorage.path) {
    changePath();
  } else {
    chooser.trigger('click');  
  }
  
  $('#file').click(function(){
      chooser.click();
  }).show();

  $('#reload').click(update);

  $('#showDeveloperTools').click(showDeveloperTools);

  $('#showSettings').click(function() {
    $('.settings').animate({
      width: 'toggle'
    }, 200);
  });

  $('#showQRCode').click(function() {
    console.log(localStorage.activity);
    $('.qrcode').animate({
      opacity: 'toggle'
    }, 200);
    $('.qrcode').css('background', 'url('+ baseUrl +'/qrcode/'+localStorage.activity+') no-repeat center center rgba(0,0,0,0.3)');  
  });
  $('.qrcode').click(function() {
    console.log(localStorage.activity);
    $('.qrcode').animate({
      opacity: 'toggle'
    }, 200);
    $('.qrcode').css('background', 'url('+ baseUrl +'/qrcode/'+localStorage.activity+') no-repeat center center rgba(0,0,0,0.3)');  
  });

  $('#login').click(function() {
    $('#login').val('logging in...');

    localStorage.username = $('#username').val();
    localStorage.password = $('#password').val();

    login();
  });

  if(localStorage.username && localStorage.password) {
    $('#username').val(localStorage.username)
    $('#password').val(localStorage.password);

    $('#login').trigger('click');  
  }
});

function login() {
  console.log('Logging in!');
  $.ajax({
    type: 'POST',
    url: baseUrl + '/signin',
    data: {
      email: localStorage.username,
      password: localStorage.password
    },
    complete: function(data){
      console.log('Log in status', data.status);
      authenticated = true;
      $('.settings').animate({
        width: 'toggle'
      }, 200);
      $('#login').val('log in again');
    },
  });
}

function changePath () {
  if(localStorage.path && localStorage.path != '') {
    widget.path = localStorage.path;
    console.log('WIDGET PATH '+widget.path);
    findFiles(function(err, widget) {
      console.log(err || widget);

      update();
      createMonitor();
    });
  }
}

function saveWidget(html, css, js) {
  if(authenticated && localStorage.widgetId) {
    $.ajax({
      type: 'POST',
      url: baseUrl + '/widgets/'+localStorage.widgetId+'/editor',
      data: {
        html: html,
        css: css,
        js: js
      },
      complete: function(data){
        console.log('POST status', data.status);
      },
      //dataType: dataType
    });
  }
}
