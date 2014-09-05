/** @jsx React.DOM */
var Primus = require('primus');
var React = require('react');

var p = Primus.connect();

var codes = require('../src/errorcodes');
var MessageModel = require('../src/models/message');

var users = {};
var messages = [];

var Header = React.createClass({
  render: function() {
    return (
      <div>
        <input id="drawer-toggle-left" type="checkbox" className="drawer-toggle" name="drawer-toggle" />
        <label htmlFor="drawer-toggle-left" className="drawer-toggle-label"></label>
        <header>TURNT OCTO BEAR</header>
        <nav className="drawer left">
          <UsersList users={this.props.users} />
          <ChangeNameForm onChangeName={this.props.onChangeName} user={this.props.user} />
        </nav>
      </div>
    );
  }
})

var UsersList = React.createClass({
  render: function() {
    // OK, list is array. Nice.
    var list = [];
    for (var prop in this.props.users) {
      if (this.props.users.hasOwnProperty(prop)) {
        list.push({
          name: this.props.users[prop].name,
          id: prop
        });
      }
    }
    var renderUser = function(user) {
      if (!user.id) {
        return '';
      }
      return <li key={user.id}><a> { user.name } </a></li>
    };
    return (
        <ul>{ list.map(renderUser) }</ul>
    );
  }
});

var Message = require('./jsx/message');
var MessageList = require('./jsx/messagelist')(Message);
var MessageForm = require('./jsx/messageform');

var ChangeNameForm = React.createClass({
  getInitialState: function() {
    return {newName: this.props.user};
  },

  onKey : function(e){
    this.setState({ newName : e.target.value });
  },

  handleSubmit : function(e){
    e.preventDefault();
    var newName = this.state.newName;
    this.props.onChangeName(newName);
  },

  render: function() {
    return(
      <div className='change_name_form'>
        <form onSubmit={this.handleSubmit}>
          <input onChange={this.onKey} value={this.state.newName} />
        </form>
      </div>
    );
  }
});

var ChatApp = React.createClass({

  getInitialState: function() {
    p.on('message', this.newMessage)
    p.on('emittererror', function(msg) {
      if (msg === codes.ERRORNONAME) {
      }
    });
    p.on('newname', this.userChangedName);
    p.on('left', this.userLeft);
    p.on('join', this.userJoined);
    // Init in next pass.
    var _this = this;
    setTimeout(function() {
      _this.init(_this.props.init);
    }, 1);

    return {users: {}, messages: [], text: '', user: this.props.init.name };
  },

  init: function(data) {
    var _this = this;
    data.messages.forEach(function(n) {
      _this.newMessage(n);
    });
    this.setState({ user: data.name, users: data.users });
    users = this.state.users;
  },

  newMessage: function(message) {
    message = new MessageModel(message);
    messages.push(message);
    this.setState({ messages : messages });
    document.body.scrollTop = document.body.scrollHeight;
  },

  userJoined: function(data) {
    users[data.id] = data;
    this.setState({ users : users, messages: messages});
  },

  userLeft: function(data) {
    delete users[data.id];
    this.setState({ users : users, messages: messages});
  },

  userChangedName: function(data) {
    var oldName = data.oldName;
    var newName = data.newName;
    users[data.id].name = newName;
    this.setState({ users : users, messages: messages});
  },

  handleMessageSubmit: function(message) {
    p.send('message', message);
  },

  handleChangeName : function(newName) {
    var that = this;
    var oldName = this.state.user;
    p.send('changename', newName);
  },

  render: function() {
    return (
      <div>
        <Header users={this.state.users} user={this.state.user} onChangeName={this.handleChangeName} />
        <div
          id="page-content">
          <MessageList messages={this.state.messages} />
          <MessageForm onMessageSubmit={this.handleMessageSubmit} user={this.state.user} />
        </div>
      </div>
    );
  }
});

p.on('init', function(data) {
  React.renderComponent(<ChatApp init={data} />, document.body);
});
