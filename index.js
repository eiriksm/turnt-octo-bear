'use strict';
require('./src/app').init({}, function(e) {
  if (e) {
    throw new Error(e);
  }
});
