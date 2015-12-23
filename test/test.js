'use strict';
var should = require('should');
var app = require('../src/app');

describe('App export', function() {
  it('Should export a function', function() {
    app.init.should.be.instanceOf(Function);
  });
})

describe('App functionality', function() {
  it('Should start when we tell it to', function(done) {
    this.timeout(5000);
    app.init({}, function(e) {
      should(e).equal(null);
      done();
    });
  });
});