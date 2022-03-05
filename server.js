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
var placeholder_id = 0
var connections = [] // Todo: store what conn is what player maybe 

io.on('connection', (socket) => {
    socket.on('connect_to_server', () => {
        // New Player Connected. The following code is specific to that player 
        socket.id = server.last_player_id++;
        console.log('new player: ', socket.id);
        placeholder_id = socket.id;

        connections.push(socket);

        // Todo: tell client some starting info e.g. init 
        socket.broadcast.emit('init', socket.id);

        // Get keyboard input 
        socket.on('movement', (keys) => {
            // Todo handle movement. 
            // Keys is a list of key codes. Use uppoer for letters 
            // Remember socket.id == player.id 
        });

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
global.phaserOnNodeFPS = FPS

// your MainScene
class MainScene extends Phaser.Scene {
  update(){
    var new_state = {
        players: [
            {
                x: 0,
                y: 0,
                id: 1
            }
        ]    
    };
    io.emit('update', {
        new_state
    });
  }
}

// prepare the config for Phaser
const config = {
  type: Phaser.HEADLESS,
  width: 800,
  height: 800,
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