const { randomInt } = require('crypto');
const express = require('express');
const { Socket } = require('socket.io');
const app = express();
const server = require('http').Server(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    pingTimeout: 500
});
require('@geckos.io/phaser-on-nodejs')
const Phaser = require('phaser');
const { stat } = require('fs');
const { Body } = require('matter');

// Game Engine Code 
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
var removes = []

io.on('connection', (socket) => {
    socket.on('connect_to_server', () => {
        // New Player Connected. The following code is specific to that player 
        socket.id = server.last_player_id++;
        console.log('new player: ', socket.id);
        
        socket.player = {
            x: randomInt(0, 800),
            y: randomInt(0, 800),
            velx: 0,
            vely: 0,
            body: null,
        };

        state.players[socket.id] = socket.player;
        connections[socket.id] = socket;

        // Todo: tell client some starting info e.g. init 
        socket.emit('init', socket.id);

        // Get keyboard input 
        socket.on('movement', (keys) => {
            // Todo handle movement. 
            // Keys is a list of key codes. Use uppoer for letters 
            // Remember socket.id == player.id 
            
            state.players[socket.id].velx = 0;
            state.players[socket.id].vely = 0;
            augment =  0.001
            if(keys.right){
                state.players[socket.id].velx = augment;
            }
            if(keys.left)
                state.players[socket.id].velx = -augment;
            if(keys.up)
                state.players[socket.id].vely = -augment;
            if(keys.down)
                state.players[socket.id].vely = augment;
        });

        // Init logic to handle player disconnet 
        socket.on('disconnect', () => {
            // When a client disconects remove form the connections list 
            //socket.player.body.destroy();
            removes.push(socket.player.body);
            delete connections[socket.id];
            delete state.players[socket.id];
        });
    });
});

// Serverside Game Code 
const FPS = 60
global.phaserOnNodeFPS = FPS

// your MainScene
class MainScene extends Phaser.Scene {
  update(){
    // Remove any dead collisions 
    removes.forEach(body => {
        this.matter.world.remove(body);    
    })
    removes = [];

    // Init all players 
    for (const [key, value] of Object.entries(state.players)) {
        if(value.body == null){
            value.body = this.matter.bodies.rectangle(value.x, value.y, 21, 32);

            this.matter.world.add(value.body);
        }
        this.matter.body.applyForce(value.body, value.body.position, {x: value.velx, y: value.vely});
    }

    // Updating the players positions
    var send_state = {
        players: {

        }
    }

    for (const [key, value] of Object.entries(state.players)) {
        send_state.players[key] = {
            x: value.body.position.x,
            y: value.body.position.y
        }
    }
    
    io.emit('update', 
        send_state
    );
  }
}

// prepare the config for Phaser
const config = {
  type: Phaser.HEADLESS,
  width: 1600,
  height: 800,
  banner: false,
  audio: false,
  scene: [MainScene],
  fps: {
    target: FPS
  },
  physics: {
    default: 'matter',
    matter: {
        gravity: false,
        setBounds: true
    }
  }
}

// start the game
new Phaser.Game(config)