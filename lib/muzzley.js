var config  = require('./config');

var muzzley = {};

muzzley.login = function login(username, password, muzzleyEnv, cb) {
  var baseUrl = config.muzzley[muzzleyEnv];

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
  var baseUrl = config.muzzley[localStorage.lastMuzzleyEnv];

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
  var baseUrl = config.muzzley[localStorage.lastMuzzleyEnv];

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
  var baseUrl = config.muzzley[localStorage.lastMuzzleyEnv];

  $.ajax({
    type: 'POST',
    url: baseUrl + '/widgets/'+id+'/editor',
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
