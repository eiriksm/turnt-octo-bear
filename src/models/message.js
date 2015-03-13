'use strict';

module.exports = function(data) {
  if (typeof data === 'string') {
    // Support creating a message with only message as param.
    data = {
      text: data
    };
  }
  if (!data || !data.text) {
    throw new Error('No text in the message!');
  }
  this.text = data.text;
  this.time = data.time || new Date();
  this.color = data.color || 'default';
  this.name = data.name || 'System';
  if (data.id) {
    this.id = data.id;
  }
};
