'use strict';
var r = require('rethinkdb');
var Hapi = require('hapi');
var Primus = require('primus');
var Emitter = require('primus-emitter');
var async = require('async');
var Inert = require('inert');

var primusHandler = require('./primusHandler');

var server = new Hapi.Server();
server.connection({port: 9009});
server.primus = new Primus(server.listener, {
  transformer: 'engine.io'
});
server.primus.use('emitter', Emitter);
server.primus.save('./static/primus.js');
server.primus.users = {};
server.primus.on('connection', function(spark) {
  // Send it to our primus handler, but make sure we can access the primus
  // object as well.
  return primusHandler(spark, server.primus);
});
server.register(Inert, function () {});
server.route({
  method: 'GET',
  path: '/',
  handler: {
    file: {
      path: './static/index.html'
    }
  }
});

server.route({
  method: 'GET',
  path: '/static/{path*}',
  handler: {
    directory: {
      path: './static',
      index: true
    }
  }
});

var options = {
  opsInterval: 1000,
  reporters: [{
    reporter: require('good-console'),
    events: { log: '*', response: '*' }
  }]
};

server.register({
  register: require('good'),
  options: options
}, function (err) {
  if (err) {
    console.error(err);
  }
});

exports.init = init;

function connectToDatabase(config, callback) {
  server.log('debug', 'Connecting to database server.');
  var dbName = config.dbName || 'turnt_bear';
  r.connect('localhost')
  .then(function(conn) {
    callback(null, conn, dbName);
  })
  .error(function(e) {
    callback(e);
  });
}

function createDatabase(conn, dbName, callback) {
  server.log('debug', 'Creating database.');
  r.dbCreate(dbName).run(conn, function(e) {
    if (e) {
      if (!e.msg.match(/exists/)) {
        callback(e);
      }
      else {
        server.log('debug', 'Database ' + dbName + ' already existed. Moving on.');
        callback(null, conn, dbName);
      }
    }
    else {
      callback(null, conn, dbName);
    }
  });
}

function createTables(conn, dbName, callback) {
  server.log('debug', 'Creating tables.');
  async.each(['messages'], function(n, cb) {
    server.log('debug', 'Creating table ' + n);
    r.db(dbName).tableCreate(n).run(conn, function(error) {
      if (error) {
        if (!error.msg.match(/exists/)) {
          cb(error);
        }
        else {
          server.log('debug', 'Table ' + n + ' already existed. Moving on.');
          cb(null);
        }
      }
      else {
        server.log('debug', 'Table ' + n + ' created.');
        cb(null);
      }
    });
  }, function(err) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, conn, dbName);
    }
  });
}

function startServer(conn, dbName, callback) {
  server.log('debug', 'Trying to start server');
  server.conn = conn;
  conn.use(dbName);
  // Start the server
  server.start(function (err) {
    if (err) {
      callback(err);
      return;
    }
    server.log('info', 'Server running at: ' + server.info.uri);
    // Find last 10 messages.
    r.table('messages').orderBy(r.desc('time')).limit(10).run(conn, function(e, c) {
      if (e) {
        console.log(e);
        return;
      }
      c.toArray(function(er, re) {
        if (er) {
          return;
        }
        re = re.reverse();
        server.primus.dbmessages = re;
      });
    });
    // Start listening for changes in messages table.
    r.table('messages').changes().run(conn, function(dbErr, cursor) {
      if (dbErr) {
        // Meh.
        callback();
        return;
      }
      if (!cursor) {
        // Whatever... whatever.
        callback();
        return;
      }
      cursor.each(function(cursorErr, msg) {
        if (cursorErr) {
          throw cursorErr;
        }
        if (!msg.old_val && msg.new_val) {
          server.primus.send('message', msg.new_val);
          server.primus.dbmessages.push(msg.new_val);
          server.primus.dbmessages.splice(0, 1);
        }
        callback();
      });
    });
  });
}

function init(config, callback) {
  async.waterfall([
    function(cb) {
      // First function to just pass the config.
      cb(null, config);
    },
    connectToDatabase,
    createDatabase,
    createTables,
    startServer
  ], callback);
}
