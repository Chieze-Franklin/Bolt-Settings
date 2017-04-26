var bodyParser = require('body-parser');
var exphbs = require('express3-handlebars');
var express = require('express');
var fs = require('fs');
var superagent = require('superagent');
var session = require("client-sessions"/*"express-session"*/);

//---helpers
var __app = {
  displayName: "Settings",
  name: "bolt-settings"
};
var __bolt = {};
var __user;
var __year = new Date().getFullYear();

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

app.set('views', __dirname + '/views');
app.engine('html', exphbs.create({
  defaultLayout: 'main.html',
  layoutsDir: app.get('views') + '/layouts',
  partialsDir: [app.get('views') + '/partials']
}).engine);
app.set('view engine', 'html');

//----------initializers
app.post('/api/ini', function (req, res) { //Bolt will send needed info to this endpoint
  __app.port = req.body.appPort;
  __app.token = req.body.appToken;
  __bolt.protocol = req.body.protocol;
  __bolt.host = req.body.host;
  __bolt.port = req.body.port;

  res.send();
});

app.get('/', function (req, res) {
  if (req.query.user) {
    superagent
      .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/users/@current')
      .set('X-Bolt-App-Token', __app.token)
      .set('X-Bolt-User-Token', req.query.user)
      .end(function(error, usersResponse){
        //TODO: check error and usersResponse.body.error
        __user = usersResponse.body.body; 
        if (__user && !__user.displayPic) __user.displayPic = 'public/bolt/users/user.png';

        var scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year
        };
        res
          .set('Content-type', 'text/html')
          .render('index.html', scope);
      });
  }
  else {
    var success = encodeURIComponent(__bolt.protocol + '://' + __bolt.host + ':' + __app.port);
    res.redirect(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/login?success=' + success);
  }
});

//-------------apps
app.get('/apps', function (req, res) {
  //get registered apps
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/apps')
    .end(function(error, appsResponse){
      //TODO: check error and appsResponse.body.error
      var apps = appsResponse.body.body;

      var scope = {
        app: __app,
        bolt:  __bolt,
        user: __user,
        year: __year,

        section: "Apps (" + apps.length + ")",

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
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/apps/' + req.params.name)
    .end(function(error, appResponse){
      //TODO: check error and appResponse.body.error
      var app = appResponse.body.body;
      var scope;
      if(app){
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: app.displayName,

          boltApp: app
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('app.html', scope);
    });
});

app.get('/apps-add', function (req, res) {
  var scope = {
    app: __app,
    bolt:  __bolt,
    user: __user,
    year: __year,

    section: "Add App"
  };
  res
    .set('Content-type', 'text/html')
    .render('apps-add.html', scope);
});

app.get('/apps-sideload/:path', function (req, res) {
  superagent
    .post(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/apps/reg-package')
    .send({ path: req.params.path })
    .end(function(error, response){
      //TODO: check error and response.body.error
      var package = response.body.body;
      //TODO: show package.bolt.dependencies

      var scope = {};

      if(package){
        var startup = false;
        if (package.bolt.startup) startup = package.bolt.startup;
        var system = false;
        if (package.bolt.system) system = package.bolt.system;
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: "Sideload " + (package.bolt.displayName || package.name),

          path: req.params.path,
          displayName: package.bolt.displayName || package.name,
          startup: startup,
          system: system,
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
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/roles')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var roles = usersResponse.body.body;

      var scope = {
        app: __app,
        bolt:  __bolt,
        user: __user,
        year: __year,

        section: "Roles (" + roles.length + ")",

        roles: roles
      };
      res
        .set('Content-type', 'text/html')
        .render('roles.html', scope);
    });
});

app.get('/roles-add', function (req, res) {
  var scope = {
    app: __app,
    bolt:  __bolt,
    user: __user,
    year: __year,

    section: "Add Role"
  };
  res
    .set('Content-type', 'text/html')
    .render('roles-add.html', scope);
});

app.get('/roles/:name', function (req, res) {
  //get role
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/roles/' + req.params.name)
    .end(function(error, userResponse){
      //TODO: check error and userResponse.body.error
      var role = userResponse.body.body;
      var scope;
      if(role){
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: role.displayName,

          role: role
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('role.html', scope);
    });
});

//-----------------users

app.get('/users', function (req, res) {
  //get registered users
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/users')
    .end(function(error, usersResponse){
      //TODO: check error and usersResponse.body.error
      var users = usersResponse.body.body;

      var scope = {
        app: __app,
        bolt:  __bolt,
        user: __user,
        year: __year,

        section: "Users (" + users.length + ")",

        users: users
      };
      res
        .set('Content-type', 'text/html')
        .render('users.html', scope);
    });
});

app.get('/users-add', function (req, res) {
  var scope = {
    app: __app,
    bolt:  __bolt,
    user: __user,
    year: __year,

    section: "Add User"
  };
  res
    .set('Content-type', 'text/html')
    .render('users-add.html', scope);
});

app.get('/users/roles/:username', function (req, res) {
  //get user's roles
  superagent
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/user-roles?user=' + req.params.username)
    .end(function(error, userRolesResponse){
      //TODO: check error and userRolesResponse.body.error
      var userRoles = userRolesResponse.body.body;

      superagent
        .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/roles')
        .end(function(rolesError, rolesResponse){
          var roles = rolesResponse.body.body;
          var indicesToRem = [];
          for(var a = 0; a < userRoles.length; a++) {
            for (var b = 0; b < roles.length; b++) {
              if (userRoles[a].role == roles[b].name) {
                userRoles[a].roleInfo = roles[b];
                indicesToRem.push(b);
                break;
              }
            }
          }
          for(var a = indicesToRem.length - 1; a > -1; --a) {
            roles.splice(indicesToRem[a], 1);
          }
          
          var scope = {
            app: __app,
            bolt:  __bolt,
            user: __user,
            year: __year,

            section: "User's Roles",

            roles: roles,
            rolesHasElements: (roles.length > 0),
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
    .get(__bolt.protocol + '://' + __bolt.host + ':' + __bolt.port + '/api/users/' + req.params.username)
    .end(function(error, userResponse){
      //TODO: check error and userResponse.body.error
      var user = userResponse.body.body;
      var scope;
      if(user){
        scope = {
          app: __app,
          bolt:  __bolt,
          user: __user,
          year: __year,

          section: user.displayName,

          boltUser: user
        };
      }
        
      res
        .set('Content-type', 'text/html')
        .render('user.html', scope);
    });
});

module.exports = app;