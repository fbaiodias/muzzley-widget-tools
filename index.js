var watch = require('watch');
var fs  = require('fs');
var config  = require('./config');

require('nw.gui').Window.get().showDevTools();

var baseUrl = config.muzzley.url;

var widgets = [];
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
  muzzley.login(localStorage.username, localStorage.password, function (err, response) {
    console.log('Log in', response);
    if(err || !response || !response.success) {
      $('#login').val(response && response.message || 'login error');
      return;
    }

    authenticated = true;
    $('.settings').animate({
      width: 'toggle'
    }, 200);
    $('#login').val('log in again');

    getWidgets();
  });
}

function getWidgets() {
  console.log('Getting widgets!');
  muzzley.getWidgets(function(err, response) {
    console.log('widgets', response);
    if(err) {
      return;
    }
    renderWidgetList(response);
  });
}

function renderWidgetList(widgets) {
  $('#widgets-list').html('');

  function getWidgetId(el) {
    if(el.classList.contains('widget')) {
      return el.id.split('-')[1];
    }
    return el.parentNode && getWidgetId(el.parentNode) || {};
  }

  widgets.forEach(function(widget) {
    $('#widgets-list').append(buildWidgetListElement(widget));

    $('#widget-'+widget.id+' .name').on('click', function (ev) {
      handleWidgetClickView(getWidgetId(ev.target));
    });

    $('#widget-'+widget.id+' .download').on('click', function (ev) {
      handleWidgetClickDownload(getWidgetId(ev.target));
    });

    $('#widget-'+widget.id+' .upload').on('click', function (ev) {
      handleWidgetClickUpload(getWidgetId(ev.target));
    });
  });
}

function buildWidgetListElement(widget) {
  return  '<div class="widget" id="widget-' + widget.id + '">' +
            '<div class="name">' + widget.name + '</div>' +
            '<div><b>ID:</b> ' + widget.id + '</div>' +
            '<div><b>UUID:</b> ' + widget.uuid + '</div>' +
            '<div>' +
              '<a class="download button">Download</a>' +
              '<a class="upload button">Upload</a>' +
            '</div>'
          '</div>';
}

function handleWidgetClickView(id) {
  console.log('handleWidgetClickView', id);
}

function handleWidgetClickDownload(id) {
  console.log('handleWidgetClickDownload', id);
  muzzley.getWidget(id, function(err, response) {
    console.log('widget', response);
  });
}

function handleWidgetClickUpload(id) {
  console.log('handleWidgetClickUpload', id);
}


function getWidget(id) {
  console.log('Getting widget', id);
  muzzley.getWidget(id, function(err, response) {
    console.log('widgets', response);
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
    var data = {
      html: html,
      css: css,
      js: js
    };
    muzzley.saveWidget(localStorage.widgetId, data, function(err, response) {
      console.log('seve widget', response);
    });
  }
}
