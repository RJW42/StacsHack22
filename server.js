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


server.listen(8081,function(){ // Listens to port 8081
    console.log('Listening on '+server.address().port);
});

server.last_player_id = 0;


// Main Server Code 
var state = {}
var connections = [] // Todo: store what conn is what player maybe 

io.on('connection', (socket) => {
    socket.on('newplayer', () => {
        // New Player Connected. The following code is specific to that player 
        socket.player = {
            id: server.last_player_id++,
            x : random_int(100, 400),
            y : random_int(100, 400)
        };

        connections.push(socket);

        // Todo: tell client some starting info e.g. init 
        socket.broadcast.emit('newplayer', socket.player);

        socket.on('disconnect', () => {
            // Todo: remove client form connections list 
            // Todo: update state to remove clients player 
        });

        console.log('new player');
    });
    console.log('connection');
});

// Serverside Game Code 
setInterval(() => {
    // Update State 
    
    // Send State
    io.emit('update', state);
    
    // Check for inputs 
}, 33);



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