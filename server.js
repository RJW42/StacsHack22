const { randomInt } = require('crypto');
const express = require('express');
const { Socket } = require('socket.io');
const app = express();
const server = require('http').Server(app);
const { Server } = require('socket.io');
const io = new Server(server);
require('@geckos.io/phaser-on-nodejs')
const Phaser = require('phaser');
const { stat } = require('fs');


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
var state = {
    players: {

    }
}
var connections = {} // Todo: store what conn is what player maybe 

io.on('connection', (socket) => {
    socket.on('connect_to_server', () => {
        // New Player Connected. The following code is specific to that player 
        socket.id = server.last_player_id++;
        console.log('new player: ', socket.id);
        
        state.players[socket.id] = {
            x: 0,
            y: 0,
            velx: 0,
            vely: 0
        };

        connections[socket.id] = socket;

        // Todo: tell client some starting info e.g. init 
        socket.broadcast.emit('init', socket.id);

        // Get keyboard input 
        socket.on('movement', (keys) => {
            // Todo handle movement. 
            // Keys is a list of key codes. Use uppoer for letters 
            // Remember socket.id == player.id 
            if(keys.right)
                state.players[socket.id].velx += 1;
            if(keys.left)
                state.players[socket.id].velx -= 1;
            if(keys.up)
                state.players[socket.id].vely -= 1;
            if(keys.down)
                state.players[socket.id].vely += 1;
        });

        // Init logic to handle player disconnet 
        socket.on('disconnect', () => {
            // When a client disconects remove form the connections list 
            delete connections[socket.id];
            delete state.players[socket.id];
        });
    });
});

// Serverside Game Code 
const FPS = 30
global.phaserOnNodeFPS = FPS

// your MainScene
class MainScene extends Phaser.Scene {
  update(){
    // Updating the players positions
    for (const [key, value] of Object.entries(state.players)) {
        state.players[key].x += state.players[key].velx
        state.players[key].y += state.players[key].vely
    }
    
    io.emit('update', 
        state
    );
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