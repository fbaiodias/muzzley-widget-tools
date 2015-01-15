var config  = require('./config');
var baseUrl = config.muzzley.url;

var muzzley = {};

muzzley.login = function login(username, password, cb) {
  $.ajax({
    type: 'POST',
    url: baseUrl + '/signin',
    dataType: 'json',
    data: {
      device: 'devtools',
      authType: 'email',
      email: username,
      password: password,
    },
    success: function(data){
      var response = data;
      cb(null, response);
    },
    error: function (data) {
      var response = data.responseJSON;
      cb(response);
    }
  });
}

muzzley.getWidgets = function getWidgets(cb) {
  $.ajax({
    type: 'GET',
    url: baseUrl + '/widgets',
    dataType: 'json',
    success: function(data){
      var response = data;
      cb(null, response);
    },
    error: function (data) {
      var response = data.responseJSON;
      cb(response);
    }
  });
}

muzzley.getWidget = function getWidget(id, cb) {
  $.ajax({
    type: 'GET',
    url: baseUrl + '/widgets/'+id,
    dataType: 'json',
    success: function(data){
      var response = data;
      cb(null, response);
    },
    error: function (data) {
      var response = data.responseJSON;
      cb(response);
    }
  });
}

muzzley.saveWidget = function saveWidget(id, widget, cb) {
  $.ajax({
    type: 'POST',
    url: baseUrl + '/widgets/'+localStorage.widgetId+'/editor',
    dataType: 'json',
    data: {
      html: widget.html,
      css: widget.css,
      js: widget.js
    },
    success: function(data){
      var response = data;
      cb(null, response);
    },
    error: function (data) {
      var response = data.responseJSON;
      cb(response);
    }
  });
}
