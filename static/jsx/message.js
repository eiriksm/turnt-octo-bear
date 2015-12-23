/** @jsx React.DOM */
var React = require('react');
var msg2svg = require('msg2svg');

var Message = React.createClass({
  render: function() {
    // Nooo. This looks like a hack.
    var a = msg2svg(document, this.props.text, {width: 240, height: 100});

    var tmp = document.createElement("div");
    tmp.appendChild(a[0][0]);
    var date = new Date(this.props.time);
    return(
      <div className="message">
        <div className="meta">
          <strong>{ this.props.name } </strong>(<em>{ date.getHours() + ':' + date.getMinutes() }</em>):
        </div>
        <div dangerouslySetInnerHTML={{__html: tmp.innerHTML}} />
        <div className="title">
          "{this.props.text}"
        </div>
      </div>
    )
  }
});

module.exports = Message;
