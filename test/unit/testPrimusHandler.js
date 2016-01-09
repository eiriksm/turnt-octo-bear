var proxyquire = require('proxyquire')
var util = require('util');
var EventEmitter = require('events');
require('should');
var serverSent = [];
var clientSent = [];
var savedMessages = [];
var cStub = {
  use: function() {}
}
function StubEmitter() {
  EventEmitter.call(this);
}
util.inherits(StubEmitter, EventEmitter);
var hStub = new StubEmitter();
hStub.send = function() {
  clientSent.push(arguments);
}
var pStub = new StubEmitter();
pStub.users = {};
pStub.send = function() {
  serverSent.push(arguments);
}
var connectReturn = {
  then: function(fn) {
    fn(cStub)
    return this
  },
  error: function(fn) {
    this.errorCallback = fn;
  },
  triggerError: function(err) {
    this.errorCallback(err);
  }
  
}
var rStub = {
  connect: function() {
    return connectReturn;
  }
}
var dbStub = {
  saveMessage: function(conn, msg) {
    savedMessages.push(msg);
  }
}

var ph = proxyquire('../../src/primusHandler', {
  'rethinkdb': rStub,
  './db': dbStub
});

describe('Primus handler', function() {
  it('Should export a function', function() {
    ph.should.be.instanceOf(Function);
  });
  it('Should start if we just want it to', function(done) {
    ph(hStub, pStub);
    done();
  });
  it('Should send messages back and forth', function(done) {
    ph(hStub, pStub);
    var newId = 'messageid' + Date.now();
    hStub.emit('message', {id: newId, text: newId, time: Date.now()});
    savedMessages[0].id.should.equal(newId)
    // Change name.
    hStub.emit('changename', newId);
    serverSent[serverSent.length - 1][1].newName.should.equal(newId);
    // Try to change name to blank and send a message.
    hStub.emit('changename', null);
    hStub.emit('message', {id: newId, text: newId});
    clientSent[clientSent.length - 1][1].should.equal('ERRORNONAME');
    // ...and send end event.
    hStub.emit('end');
    Object.keys(pStub.users).length.should.equal(0);
    serverSent[serverSent.length - 1][0].should.equal('left');
    // Call the error function to increase coverage (tm)
    connectReturn.triggerError(new Error('horrible problem (tm) for coverage'));
    done()
  })
});
