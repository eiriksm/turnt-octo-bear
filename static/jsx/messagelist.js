/** @jsx React.DOM */
var React = require('react');
var Message;

var MessageList = React.createClass({
  render: function() {
    var renderMessage = function(message) {
      if (!message.id) {
        return;
      }
      return <Message name={message.name} text={message.text} key={message.id} time={message.time} />
    }
    return (
      <div className='messages'>
        { this.props.messages.map(renderMessage)}
      </div>
    );
  }
});

module.exports = function(m) {
  Message = m;
  return MessageList;
}
