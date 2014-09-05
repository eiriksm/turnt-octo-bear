var uuid = require('node-uuid');

module.exports = function(name) {
  this.name = name;
  this.id = uuid.v4();
};
