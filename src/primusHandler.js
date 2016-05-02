'use strict';
var r = require('rethinkdb');

var codes = require('./errorcodes');
var db = require('./db');
var Message = require('./models/message');
var User = require('./models/user');

module.exports = handler;
var p;

function handler(handlerSpark, primus) {
  var initClient = function(spark) {
    var name = 'Guest' + Math.floor(Math.random() * 999);
    var user = new User(name);
    primus.users[user.id] = user;
    var welcome = {
      users: primus.users,
      name: name,
      messages: primus.dbmessages
    };
    // Send a notice.
    p.send('join', {name: name, id: user.id});

    spark.send('init', welcome);
    spark.on('message', function(msg) {
      if (!user.name) {
        spark.send('emittererror', codes.ERRORNONAME);
        return;
      }
      // No faking of name or time.
      msg.name = user.name;
      if (msg.time) {
        delete msg.time;
      }
      msg = new Message(msg);
      db.saveMessage(spark.conn, msg);

    });
    spark.on('changename', function(data) {
      p.send('newname', {oldName: user.name, newName: data, id: user.id});
      user.name = data;
      primus.users[user.id] = user;
    });
    spark.on('end', function() {
      // Better remove that person from the array too.
      delete primus.users[user.id];
      p.send('left', user);
    });
  };

  if (!p) {
    p = primus;
  }
  // Open a rethinkDB connection per client.
  r.connect('localhost')
  .then(function(conn) {
    handlerSpark.conn = conn;
    conn.use('turnt_bear');
    initClient(handlerSpark);
  })
  .error(function(e) {
    // @todo.
    console.log(e);
  });


}
