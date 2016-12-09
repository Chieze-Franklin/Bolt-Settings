var bodyParser = require('body-parser');
var cons = require('consolidate');
var express = require('express');
var fs = require('fs');
var superagent = require('superagent');
var session = require("client-sessions"/*"express-session"*/);

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
  if (req.query.user) {
    superagent
      .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/users/@current')
      .set('X-Bolt-Req-Id', boltReqid)
      .set('X-Bolt-User-Token', req.query.user)
      .end(function(error, usersResponse){
        //TODO: check error and usersResponse.body.error
        var user = usersResponse.body.body; 
        var title = "Settings (no logged in user)";
        if(user){
          title = "Settings (currently logged in as " + user.displayName + ")";
        }

        var scope = {
          title: "Settings",
          sub_title: title,
          version: "Demo Version",

          protocol: boltProtocol,
          host: boltHost,
          bolt_port: boltPort,
          reqid: boltReqid,

          username: user.name
        };
        res
          .set('Content-type', 'text/html')
          .render('index.html', scope);
      });
  }
  else {
    //var scope = {
    //  title: "Settings",
    //  sub_title: "Settings (no logged in user)",
    //  version: "Demo Version",
//
    //  protocol: boltProtocol,
    //  host: boltHost,
    //  bolt_port: boltPort,
    //  reqid: boltReqid
    //};
    //res
    //  .set('Content-type', 'text/html')
    //  .render('index.html', scope);
    var success = encodeURIComponent(boltProtocol + '://' + boltHost + ':' + appPort + '/index');
    res.redirect(boltProtocol + '://' + boltHost + ':' + boltPort + '/login?success=' + success);
  }
});

//-------------apps
app.get('/apps', function (req, res) {
  //get registered apps
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/apps')
    .end(function(error, appsResponse){
      //TODO: check error and appsResponse.body.error
      var apps = appsResponse.body.body;

      var scope = {
        title: "Settings",
        sub_title: "Apps",

        protocol: boltProtocol,
        host: boltHost,
        bolt_port: boltPort,
        my_port: appPort,

        reqid: boltReqid,

        apps: apps
      };
      res
        .set('Content-type', 'text/html')
        .render('apps.html', scope);
    });
});

app.get('/apps/:name', function (req, res) {
  //get app
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/apps/' + req.params.name)
    .end(function(error, appResponse){
      //TODO: check error and appResponse.body.error
      var app = appResponse.body.body;
      var scope;
      if(app){
        scope = {
          title: "Settings",
          sub_title: app.displayName,

          protocol: boltProtocol,
          host: boltHost,
          bolt_port: boltPort,
          my_port: appPort,

          reqid: boltReqid,

          app: app
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('app.html', scope);
    });
});

app.get('/apps-add', function (req, res) {
  var scope = {
    title: "Settings",
    sub_title: "New App",

    protocol: boltProtocol,
    host: boltHost,
    bolt_port: boltPort,
    my_port: appPort,

    reqid: boltReqid
  };
  res
    .set('Content-type', 'text/html')
    .render('apps-add.html', scope);
});

app.get('/apps-sideload/:path', function (req, res) {
  superagent
    .post(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/apps/reg-package')
    .send({ path: req.params.path })
    .end(function(error, response){
      //TODO: check error and response.body.error
      var package = response.body.body;

      if(package){
        var scope = {
          title: "Settings",
          sub_title: "Sideload App",

          path: req.params.path,
          displayName: package.bolt.displayName || package.name,
          startup: package.bolt.startup || false,
          system: package.bolt.system || false,

          protocol: boltProtocol,
          host: boltHost,
          bolt_port: boltPort,
          my_port: appPort,
          
          reqid: boltReqid
        };
      }

      res
        .set('Content-type', 'text/html')
        .render('apps-sideload.html', scope);
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

        protocol: boltProtocol,
        host: boltHost,
        bolt_port: boltPort,
        my_port: appPort,

        reqid: boltReqid,

        roles: roles
      };
      res
        .set('Content-type', 'text/html')
        .render('roles.html', scope);
    });
});

app.get('/roles-add', function (req, res) {
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
    .render('roles-add.html', scope);
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

app.get('/users-add', function (req, res) {
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
    .render('users-add.html', scope);
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
            .render('users-roles.html', scope);
        });
    });
});

app.get('/users/:username', function (req, res) {
  //get user
  superagent
    .get(boltProtocol + '://' + boltHost + ':' + boltPort + '/api/users/' + req.params.username)
    .end(function(error, userResponse){
      //TODO: check error and userResponse.body.error
      var user = userResponse.body.body;
      var scope;
      if(user){
        scope = {
          title: "Settings",
          sub_title: user.displayName,

          protocol: boltProtocol,
          host: boltHost,
          bolt_port: boltPort,
          my_port: appPort,

          reqid: boltReqid,

          user: user
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('user.html', scope);
    });
});

module.exports = app;