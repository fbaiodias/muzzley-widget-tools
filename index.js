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

var wrapper;
var pathChooser;

$(document).ready(function() {
  wrapper = $('<div/>').css({height:0,width:0,'overflow':'hidden'});
  pathChooser = $(':file').wrap(wrapper);

  pathChooser.change(function(){
    if(!$(this).val() || $(this).val() == '') {
      return;
    }

    var user = currentAccount();
    user.path = $(this).val();
    saveAccount(user);

    createFileMonitor($(this).val());
  });

  $('#file').click(function(){
    pathChooser.click();
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
    login($('#username').val(), $('#password').val(), $('#muzzleyEnv').val());
  });

  var user = currentAccount();

  if(user) {
    $('#username').val(user.username);
    $('#password').val(user.password);
    $('#muzzleyEnv').val(user.muzzleyEnv);

    if(user.username && user.password && user.muzzleyEnv) {
      $('#login').trigger('click');
    }
  }
});

function getAccountKey(muzzleyEnv, id) {
  return 'accounts\:'+muzzleyEnv+'\:'+id;
}

function saveAccount(account) {
  var key = getAccountKey(account.muzzleyEnv, account.id);
  localStorage.setItem(key, JSON.stringify(account));
}

function getAccount(muzzleyEnv, id) {
  var key = getAccountKey(muzzleyEnv, id);
  var value = localStorage.getItem(key);
  return value && JSON.parse(value);
}

function currentAccount () {
  return localStorage.lastMuzzleyEnv && localStorage.lastUser && getAccount(localStorage.lastMuzzleyEnv, localStorage.lastUser);
}

function login(username, password, muzzleyEnv) {
  console.log('Logging in!');
  muzzley.login(username, password, muzzleyEnv, function (err, response) {
    console.log('Log in', response);
    if(err || !response || !response.success) {
      $('#login').val(response && response.message || 'login error');
      return;
    }

    var user = response.user;

    // Save account if it's new
    if(!getAccount(muzzleyEnv, user.id)) {
      var user = response.user;
      user.username = username;
      user.password = password;
      user.muzzleyEnv = muzzleyEnv;

      saveAccount(user);
    }

    localStorage.lastMuzzleyEnv = muzzleyEnv;
    localStorage.lastUser = user.id;

    if(!getAccount(muzzleyEnv, user.id).path) {
      pathChooser.trigger('click');
    }
    else {
      createFileMonitor(getAccount(muzzleyEnv, user.id).path);
    }

    authenticated = true;
    $('.settings').animate({
      width: 'toggle'
    }, 200);
    $('#login').val('log in again');

    getWidgets();
  });
}

function createFileMonitor(path) {
  fileManager.createMonitor(path, function (monitor) {
    monitor.on('update', function(widget) {
      console.log('update', arguments);
      if(authenticated) {
        saveWidget(widget, function (err) {
          if(err) {
            updateWidgetMessage(widget.id, 'Error uploading files!', 'warning');
            return;
          }

          updateWidgetMessage(widget.id, 'Files uploaded!', 'check');
        });
      }
    })
    monitor.on('error', function() {
      console.log('error', arguments);
    })
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
              '<a class="download button"><i class="fa fa-cloud-download"></i> Download</a>' +
              // '<a class="upload button">Upload</a>' +
            '</div>' +
            '<div class="message"></div>' +
          '</div>';
}

function handleWidgetClickView(id) {
  console.log('handleWidgetClickView', id);
}

function handleWidgetClickDownload(id) {
  console.log('handleWidgetClickDownload', id);
  muzzley.getWidget(id, function(err, response) {
    console.log('response', response);
    var widget = fileManager.generateWidgetPaths(currentAccount().path, response);

    widget.js = widget.js || widget.javascript;
    widget.css = widget.css || widget.stylesheet;
    delete(widget.javascript);
    delete(widget.stylesheet);

    console.log('widget', widget);

    fileManager.writeFiles(widget, function(err, widget) {
      if(err) {
        updateWidgetMessage(widget.id, 'Error downloading files!', 'warning');
        return console.log('error saving files', err);
      }

      console.log('files downloaded!');
      updateWidgetMessage(widget.id, 'Files downloaded!', 'check');
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

function saveWidget(widget, cb) {
  var data = {
    html: widget.html,
    css: widget.css,
    js: widget.js
  };
  muzzley.saveWidget(widget.id, data, function(err, response) {
    console.log('save widget', response);
    if(cb) {
      cb(err, response);
    }
  });
}

function updateWidgetMessage(id, message, icon) {
  var now = new Date();

  var html =  '<i class="fa fa-'+icon+'"></i> ' + message + ' ' +
              '<abbr class="timeago" title="'+ now.toISOString()+'">' +
                now +
              '</abbr>';

  $('#widget-'+id+' .message').html(html);

  $('#widget-'+id+' .message abbr.timeago').timeago();
}
