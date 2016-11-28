var bodyParser = require('body-parser');
var cons = require('consolidate');
var express = require('express');
var fs = require('fs');
var superagent = require('superagent');

//---helpers
var appPort, boltProtocol, boltHost, boltPort, boltReqid;

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (request, response, next) {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  next();
});
app.use('/api', function (request, response, next) {
  response.set('Content-Type', 'application/json');
  next();
});

app.use('**/assets', express.static(__dirname + '/assets'));
app.use('**/pages', express.static(__dirname + '/pages'));

app.set('views', __dirname);
app.engine('html', cons.handlebars);
app.set('view engine', 'html');

//----------initializers
app.post('/api/ini', function (req, res) { //Bolt will send needed info to this endpoint
  appPort = req.body.appPort,
  boltProtocol = req.body.protocol,
  boltHost = req.body.host;
  boltPort = req.body.port;
  boltReqid = req.body.reqid;

  res.send();
});

app.get('/index', function (req, res) {
  if (req.query.userid) {
    superagent
      .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/users?_id=' + req.query.userid)
      .end(function(error, usersResponse){
        //TODO: check error and usersResponse.body.error
        var user, users = usersResponse.body.body;
        if(users && users.length > 0) user = users[0]; 
        var title = "Settings (no logged in user)";
        if(user){
          title = "Settings (currently logged in as " + user.username + ")";
        }

        var scope = {
          title: "Settings",
          sub_title: title,
          version: "Demo Version",

          protocol: boltProtocol,
          host: boltHost,
          bolt_port: boltPort,
          reqid: boltReqid,

          username: user.username
        };
        res
          .set('Content-type', 'text/html')
          .render('index.html', scope);
      });
  }
  else {
    var scope = {
      title: "Settings",
      sub_title: "Settings (no logged in user)",
      version: "Demo Version",

      protocol: boltProtocol,
      host: boltHost,
      bolt_port: boltPort,
      reqid: boltReqid
    };
    res
      .set('Content-type', 'text/html')
      .render('index.html', scope);
  }
});

//-------------apps
app.get('/apps', function (req, res) {
  //get registered apps
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/apps')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var apps = usersResponse.body.body;

      var scope = {
        title: "Settings",
        sub_title: "Apps",

        apps: apps
      };
      res
        .set('Content-type', 'text/html')
        .render('apps.html', scope);
    });
});

//-------------roles
app.get('/roles', function (req, res) {
  //get registered roles
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/roles')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var roles = usersResponse.body.body;

      var scope = {
        title: "Settings",
        sub_title: "Roles",

        roles: roles
      };
      res
        .set('Content-type', 'text/html')
        .render('roles.html', scope);
    });
});

app.get('/roles/add', function (req, res) {
  var scope = {
    title: "Settings",
    sub_title: "New Role",

    protocol: boltProtocol,
    host: boltHost,
    bolt_port: boltPort,
    my_port: appPort,

    reqid: boltReqid
  };
  res
    .set('Content-type', 'text/html')
    .render('roles.add.html', scope);
});

//-----------------users

app.get('/users', function (req, res) {
  //get registered users
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/users')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var users = usersResponse.body.body;

      var scope = {
        title: "Settings",
        sub_title: "Users",

        protocol: boltProtocol,
        host: boltHost,
        bolt_port: boltPort,
        my_port: appPort,
        
        reqid: boltReqid,

        users: users
      };
      res
        .set('Content-type', 'text/html')
        .render('users.html', scope);
    });
});

app.get('/users/add', function (req, res) {
  var scope = {
    title: "Settings",
    sub_title: "New User",

    protocol: boltProtocol,
    host: boltHost,
    bolt_port: boltPort,
    my_port: appPort,

    reqid: boltReqid
  };
  res
    .set('Content-type', 'text/html')
    .render('users.add.html', scope);
});

app.get('/users/roles/:username', function (req, res) {
  //get user's roles
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/user-roles?user=' + req.params.username)
    .end(function(error, userRolesResponse){
      //TODO: check error and userRolesResponse.body.error
      var userRoles = userRolesResponse.body.body;

      superagent
        .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/roles')
        .end(function(rolesError, rolesResponse){
          var roles = rolesResponse.body.body;

          var scope = {
            title: "Settings",
            sub_title: "Roles for " + req.params.username,

            protocol: boltProtocol,
            host: boltHost,
            bolt_port: boltPort,
            my_port: appPort,

            reqid: boltReqid,

            roles: roles,
            userRoles: userRoles,
            username: req.params.username
          };
          res
            .set('Content-type', 'text/html')
            .render('users.roles.html', scope);
        });
    });
});

app.get('/users/:username', function (req, res) {
  //get user
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/users/' + req.params.username)
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var user = usersResponse.body.body;
      var scope;
      if(user){
        scope = {
          title: "Settings",
          sub_title: user.username,

          username: user.username,
          bolcked: user.isBlocked,
          visits: user.visits
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('user.html', scope);
    });
});

module.exports = app;