const { randomInt } = require('crypto');
const express = require('express');
const { Socket } = require('socket.io');
const app = express();
const server = require('http').Server(app);
const { Server } = require('socket.io');
const io = new Server(server);
require('@geckos.io/phaser-on-nodejs')
const Phaser = require('phaser')


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
    socket.on('connect_to_server', () => {
        // New Player Connected. The following code is specific to that player 
        socket.id = server.last_player_id++;
        console.log('new player: ', socket.id);

        connections.push(socket);

        // Todo: tell client some starting info e.g. init 
        socket.broadcast.emit('init', socket.id);

        // Init logic to handle player disconnet 
        socket.on('disconnect', () => {
            // When a client disconects remove form the connections list 
            console.log('player disconnet: ', socket.id);
            var index = 0;
            for(var i = 0; i < connections.length; i++){
                if(connections[i].id == socket.id){
                    index = i;
                    break;
                }
            }
            connections.splice(index, 1);
        });
    });
});

// Serverside Game Code 
const FPS = 30
global.phaserOnNodeFPS = FPS // default is 60

// your MainScene
var x = 0;

class MainScene extends Phaser.Scene {
  update(){
    io.emit('update', {
        x: x
    });
    x += 1;
    if(x > 600)
     x = 0;
  }
}

// prepare the config for Phaser
const config = {
  type: Phaser.HEADLESS,
  width: 1280,
  height: 720,
  banner: false,
  audio: false,
  scene: [MainScene],
  fps: {
    target: FPS
  },
  physics: {
    default: 'matter',
  }
}

// start the game
new Phaser.Game(config)

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