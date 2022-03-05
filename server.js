const { randomInt } = require('crypto');
const express = require('express');
const { Socket } = require('socket.io');
const app = express();
const server = require('http').Server(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use('/css',express.static(__dirname + '/css'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/assets',express.static(__dirname + '/assets'));

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html');
});

app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html'); 
});

server.listen(8081,function(){ // Listens to port 8081
    console.log('Listening on '+server.address().port);
});

server.last_player_id = 0;


// Main Server Code 
io.on('connection', (socket) => {
    socket.on('newplayer', () => {
        // New Player Connected. The following code is specific to that player 
        socket.player = {
            id: server.last_player_id++,
            x : random_int(100, 400),
            y : random_int(100, 400)
        };

        socket.emit('allplayers', get_all_players());
        socket.broadcast.emit('newplayer', socket.player);

        socket.on('disconnect', () => {
            console.log('disconnect');
            io.emit('remove', socket.player.id);
        });

        console.log('new player');
    });
    console.log('connection');
});


// Server side functions 
function get_all_players() {
    var players = [];
    for (const [_, socket] of io.of("/").sockets) {
        var player = socket.player;
        if(player) players.push(player);
    }
    return players;
}

function random_int(low, high){
    return Math.floor(Math.random() * (high - low) + low);
}