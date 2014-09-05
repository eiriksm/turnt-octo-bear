var r = require('rethinkdb');
var Hapi = require('hapi');
var Good = require('good');
var Primus = require('primus');
var Emitter = require('primus-emitter');

var primusHandler = require('./primusHandler');

var server = new Hapi.Server('0.0.0.0', 9000);
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

server.pack.register(Good, function (err) {
  if (err) {
    throw err;
  }
});

exports.init = init;

function init(config, callback) {
  // Start by populating some tables.
  var dbName = config.dbName || 'turnt_bear';
  r.connect('localhost')
  .then(function(conn) {
    // Create a db.
    r.dbCreate(dbName).run(conn, function(e, res) {
      if (e) {
        // See if it is something serious.
        if (!e.msg.match(/exists/)) {
          throw(e);
        }
        // Go on, just a database exists error.
      }
      // Create the tables we need.
      ['messages'].forEach(function(n) {
        r.db(dbName).tableCreate(n).run(conn, function(e, res) {
          if (e) {
            if (!e.msg.match(/exists/)) {
              throw(e);
            }
          }
        });
      });
    });

    server.conn = conn;
    conn.use(dbName);
    // Start the server
    server.start(function () {
      server.log('info', 'Server running at: ' + server.info.uri);
      // Find last 10 messages.
      r.table('messages').orderBy(r.desc('time')).limit(10).run(conn, function(e, c) {
        if (e) {
          console.log(e);
          return;
        }
        c.toArray(function(er, re) {
          if (er) {
            console.log(er);
            return;
          }
          re = re.reverse();
          server.primus.dbmessages = re;
        });
      });
      // Start listening for changes in messages table.
      r.table('messages').changes().run(conn, function(err, cursor) {
        if (err) {
          // Meh.
          return;
        }
        if (!cursor) {
          // Whatever... whatever.
          return;
        }
        cursor.each(function(cursorErr, msg) {
          if (!msg.old_val && msg.new_val) {
            server.primus.send('message', msg.new_val);
            server.primus.dbmessages.push(msg.new_val);
            server.primus.dbmessages.splice(0, 1);
          }
        });
      });
    });
  })
  .error(function(e) {
    callback(e);
  });
}
