/**
 * Created by Cricri on 16/07/2015.
 */
var express = require("express");
var app = express()
var server = require('http').Server(app);
var io = require('socket.io')(server);
var fs = require('fs');

var path = require('path');

app.get('/',function(req,res){
    res.sendFile(path.resolve('../public/index.html'));
});

app.use(express.static(__dirname+"/../public"));
//app.use("/js", express.static(__dirname + '/js'));

var store = require('store2');
var players = store.namespace('players');


//Generate random map
var Dungeon = require("./js/dungeon.js");
var dungeon = new Dungeon(64,5,15,10,20);
dungeon.new_map();

//console.log(dungeon);

io.sockets.on('connection',function(socket){
    console.log('Client connecté:'+socket.id);

    //new user
    socket.on('new_player',function(username){
        console.log('nouvelle utilisateur:'+username);
        socket.username = username; 

        //place player on map
        var player_position = dungeon.placeNewPlayer();

        console.log(players.getAll());

        //send map to current player
        socket.emit('dungeon',dungeon);

        

        //save player
        players(socket.id,{id:socket.id,username:username,x:player_position.x,y:player_position.y});

        //send the new player to everyone
        socket.broadcast.emit('new_player',players.get(socket.id));
        
        socket.emit('getAllPlayers',players.getAll());

        //send player
        socket.emit('current_player',players.get(socket.id));

        console.log(players.getAll());
    });

    socket.on('move_player',function(player){
        console.log(player);
        players.set(socket.id,{username:socket.username,x:player.x,y:player.y});
        socket.broadcast.emit('player_move',player);
        console.log(players.getAll());
    });

    //user disconnected
    socket.on('disconnect',function(){
        console.log('Client déconnecté: '+socket.user);
        socket.broadcast.emit('user_disconnect',socket.user);
       
        players.remove(socket.id);
        console.log(players.getAll());
    });
});








server.listen(8080);