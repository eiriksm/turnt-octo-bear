/** @jsx React.DOM */
var React = require('react');
var MessageModel = require('../../src/models/message');

var MessageForm = React.createClass({

  getInitialState: function() {
    return {text: ''};
  },

  handleSubmit: function(e) {
    e.preventDefault();
    var message = new MessageModel({
      name: this.props.user,
      text: this.state.text
    });
    this.props.onMessageSubmit(message);
    this.setState({ text: '' });
  },

  changeHandler: function(e) {
    this.setState({ text : e.target.value });
  },

  render: function() {
    return(
      <div className='message-form'>
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.changeHandler} value={this.state.text} placeholder="Enter message" />
        </form>
      </div>
    );
  }
});

module.exports = MessageForm;
