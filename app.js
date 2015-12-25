var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var _  =require('underscore')(app, 'ut');

//redirection
app.get('/',function(req,res){
    res.sendFile(__dirname + '/index.html');
});

app.use(function(req,res,next){
    res.redirect('/');
});




/* ============================================= */
/*                    GAME
/* ============================================= */
var players = [];

//sockets
io.sockets.on('connection',function(socket){
    console.log('Client connecté');

    //new user
    socket.on('new_user',function(user){
        console.log('nouvelle utilisateur:'+user);
        socket.user = user;
        socket.broadcast.emit('new_user',user);
        players.push({pseudo:user,x:0,y:0});
        console.log(players);
    });

    socket.on('move',function(player){
        
    });

    //user disconnected
    socket.on('disconnect',function(){
        console.log('Client déconnecté: '+socket.user);
        socket.broadcast.emit('user_disconnect',socket.user);
       
       //remove player
        players = players.filter(function (player) {
            return player.pseudo !== socket.user;
        });
    });
});












server.listen(8080);