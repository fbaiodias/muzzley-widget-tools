var watch = require('watch');
var fs = require('fs');
var config = require('./config');
var fileManager = require('./lib/fileManager');

require('nw.gui').Window.get().showDevTools();

var baseUrl = config.muzzley.url;

var widgets = [];
var widget = {};

var authenticated = false;

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
  });

  if(!localStorage.path) {
    chooser.trigger('click');
  }

  $('#file').click(function(){
    chooser.click();
  }).show();

  // $('#reload').click(update);

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
    console.log('response', response);
    var widget = fileManager.generateWidgetPaths(localStorage.path, response);

    widget.js = widget.js || widget.javascript;
    widget.css = widget.css || widget.stylesheet;
    delete(widget.javascript);
    delete(widget.stylesheet);

    console.log('widget', widget);

    fileManager.writeFiles(widget, function(err, widget) {
      if(err) {
        return console.log('error saving files', err);
      }

      console.log('files saved!');
    });
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

function saveWidget(widget) {
  if(authenticated) {
    var data = {
      html: widget.html,
      css: widget.css,
      js: widget.js
    };
    muzzley.saveWidget(widget.id, data, function(err, response) {
      console.log('seve widget', response);
    });
  }
}
