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

const PLAYING = 0; //Symbol('Playing');
const WAITING_FOR_PLAYERS = 1; //Symbol('Waiting');
const COUNT_DOWN = 2; //Symbol('CountDown');
const PLAYERS_PER_TEAM = 1;


// Main Server Code 
var state = {
    players: {

    },
    game_state: WAITING_FOR_PLAYERS,
    time_left: 0,
    team_0_score: 0,
    team_1_score: 0,
    team_0_count: 0,
    team_1_count: 0,
}
var connections = {} // Todo: store what conn is what player maybe 
var removes = []
var team_0_inc = true;

io.on('connection', (socket) => {
    socket.on('connect_to_server', () => {
        // New Player Connected. The following code is specific to that player 
        socket.id = server.last_player_id++;
        console.log('new player: ', socket.id);
        
        socket.player = {
            x: randomInt(0, 1600),
            y: randomInt(0, 800),
            velx: 0,
            vely: 0,
            team: 0,
            body: null,
        };

        if(team_0_inc && state.team_0_count < PLAYERS_PER_TEAM){
            // Add to team 0
            console.log(' - Team 0');
            state.team_0_count++;
            socket.player.team = 0;
        }else if(state.team_1_count < PLAYERS_PER_TEAM){
            // Add to team 1
            console.log(' - Team 1');
            state.team_1_count++;
            socket.player.team = 1;
        }else {
            // Todo remove player 
            socket.disconnect();
            return;
        }
        team_0_inc = !team_0_inc;

        state.players[socket.id] = socket.player;
        connections[socket.id] = socket;

        // Give Client Socket info 
        socket.emit('init', socket.id);

        // Get keyboard input 
        socket.on('movement', (keys) => {
            // Todo handle movement. 
            // Keys is a list of key codes. Use uppoer for letters 
            // Remember socket.id == player.id 
            if(state.game_state != PLAYING)
                return;

            state.players[socket.id].velx = 0;
            state.players[socket.id].vely = 0;
            augment =  0.001

            if(keys.right)
                state.players[socket.id].velx = augment;
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
            //if(!socket.player.spectating)
            removes.push(socket.player.body);
            //else
            if(socket.player.team == 0)
                state.team_0_count--;
            else 
                state.team_1_count++;
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
    // Update game state 
    this.update_game_state();

    // Remove any dead collisions 
    removes.forEach(body => {
        this.matter.world.remove(body);    
    })
    removes = [];

    // Init all players 
    for (const [key, value] of Object.entries(state.players)) {
        // if(value.spectating)
        //     continue;
        if(value.body == null){
            value.body = this.matter.bodies.rectangle(value.x, value.y, 21, 32);

            this.matter.world.add(value.body);
        }
        this.matter.body.applyForce(value.body, value.body.position, {x: value.velx, y: value.vely});
    }

    // Updating the players positions
    var send_state = {
        players: {

        },
        game_state: state.game_state,
        time_left: state.time_left,
        team_0_score: state.team_0_score,
        team_1_score: state.team_1_score,
        team_0_count: state.team_0_count,
        team_1_count: state.team_1_count
    }

    for (const [key, value] of Object.entries(state.players)) {
        var x, y;

        //if(value.spectating){
            //x = 0;
            //y = 0;
        //}else{
            x = value.body.position.x;
            y = value.body.position.y;
        //}
        
        send_state.players[key] = {
            x: x,
            y: y,
            //spectating: value.spectating,
            team: value.team
        }
    }
    
    io.emit('update', 
        send_state
    );
  }

  update_game_state() {
    if(state.game_state == WAITING_FOR_PLAYERS && 
        state.team_0_count == PLAYERS_PER_TEAM && 
        state.team_1_count == PLAYERS_PER_TEAM){
        // Enough players to start game 
        state.game_state = COUNT_DOWN;
        state.time_left = 3.0;
    } else if(state.game_state == COUNT_DOWN){
        // Update timer and check if can advance 
        state.time_left -= 1.0/60.0;
        if(state.time_left <= 0){
            state.game_state = PLAYING;
        }
    } 
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