turnt-octo-bear
===============
[![Build Status](https://travis-ci.org/eiriksm/turnt-octo-bear.svg?branch=master)](https://travis-ci.org/eiriksm/turnt-octo-bear)
[![Dependency Status](https://david-dm.org/eiriksm/turnt-octo-bear.svg?theme=shields.io)](https://david-dm.org/eiriksm/turnt-octo-bear)

An extremely persistent chat application

## What is it?
It is a real-time chat application that only shows messages after they are saved to the database.

## Why is that?
Because I wanted to try [RethinkDB changefeeds](http://www.rethinkdb.com/api/javascript/#changes).

## What does it mean in practice?
It means that if you want to send a "chat-message", the message will not show up simply because you clicked the send button. But rather because RethinkDB has said it is saved in the database. Same goes for the "chat-messages" you receive from others. They are not sent over websockets as they come in, they are sent over websockets when RethinkDB says they are saved in the database.

So, an extremely persistent chat application.

## You keep saying "chat-messages" in quotes. Why is that?
That is because you are not actually seeing text when you chat with someone. You are seeing a random svg representation of the message. So as it may seem like you are sending messages and they end up as random svgs, you are actually sending the same "random" svgs each time you send the same text. 

Or to put it more correctly. Your message is used as the random seed in generating random "artworks".

## I see what that text says, but can you please show it in an animated gif?
Sure

![Chatting with a conversation with substance](https://raw.github.com/eiriksm/turnt-octo-bear/master/chat.gif)
