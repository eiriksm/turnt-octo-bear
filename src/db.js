'use strict';

var r = require('rethinkdb');

exports.saveMessage = saveMessage;

function saveMessage(conn, msg) {
  r.table('messages').insert(msg).run(conn)
  .error(function(e) {
    console.log(e);
  });
}
