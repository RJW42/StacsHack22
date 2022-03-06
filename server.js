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

app.get('/backend/',function(req,res){
    res.sendFile(__dirname+'/backend.html');
});


server.listen(42564,function(){ // Listens to port 8081
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
    dead_body_pos: {x: 700, y: 400},
    dead_body_body: null,
    reset_ball: false,
}
var connections = {} // Todo: store what conn is what player maybe 
var removes = []

io.on('connection', (socket) => {
    socket.on('connect_to_server_backend', (data) => {
        if(data.password !== 'ligma'){
            console.log('bad password');
            socket.disconnect();1
            return;
        }
        console.log('good password to backend')

        socket.emit('connected');

        socket.on('start', () => {
            console.log('starting game');
            state.game_state = PLAYING
        });

        socket.on('reset', () => {
            console.log('resetting game');
            state.team_0_score = 0;
            state.team_1_score = 0;
            state.reset_ball = true;
        })

        socket.on('purge', () => {
            return;
            /*
            console.log('purging game');
            state.players = {
            
                },
            state.game_state = WAITING_FOR_PLAYERS;
            state.time_left = 0;
            state.team_0_score = 0;
            state.team_1_score = 0;
            state.team_0_count = 0;
            state.team_1_count = 0;
            state.reset_ball = true;
            
            for(const [id_, socket_] of Object.entries(connections)){
                removes.push(socket_.player.body);
                socket_.disconnect();
            }

            connections = {};
            */
        })
    });

    socket.on('connect_to_server', (data) => {
        // New Player Connected. The following code is specific to that player 
        socket.id = server.last_player_id++;
        console.log('new player: ', socket.id);

        if(data.username.length > 10){
            data.username = data.username.slice(0, 10);
        }
        
        socket.player = {
            x: randomInt(0, 1400),
            y: randomInt(0, 800),
            velx: 0,
            vely: 0,
            team: 0,
            body: null,
            username: data.username
        };

        if(state.team_0_count < state.team_1_count){
            // Add to team 0
            console.log(' - Team 0', state.team_1_count + 1);
            state.team_0_count++;
            socket.player.team = 0;
        } else {
            // Add to team 1
            console.log(' - Team 1: ', state.team_1_count + 1);
            state.team_1_count++;
            socket.player.team = 1;
        } 

        state.players[socket.id] = socket.player;
        connections[socket.id] = socket;

        // Give Client Socket info 
        console.log(socket.player.team);
        socket.emit('init', {
            id: socket.id, 
            team: socket.player.team
        });

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
                state.team_1_count--;
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
  create(){
    state.dead_body_body = this.matter.bodies.rectangle(
        state.dead_body_pos.x, state.dead_body_pos.y, 32, 32, {
            friction: 0.0001
        }
    );
    state.dead_body_body.restitution = 1;

    state.team_0_goal = this.matter.bodies.rectangle(
        8, 400, 16, 128, {isStatic: true}
    );
    state.team_0_goal.setOnCollideWith(state.dead_body_body, (pair) => {
        this.goal_left();
    })
    state.team_1_goal = this.matter.bodies.rectangle(
        1400 - 8, 400, 16, 128, {isStatic: true}
    );
    state.team_1_goal.setOnCollideWith(state.dead_body_body, (pair) => {
        this.goal_right();
    })

    this.matter.world.add(state.dead_body_body);
    this.matter.world.add(state.team_0_goal);
    this.matter.world.add(state.team_1_goal);
  }

  update(){
    // Update game state 
    this.update_game_state();

    if(state.reset_ball){
        this.matter.body.setPosition(state.dead_body_body, {x: 700, y: 400});
        this.matter.body.setVelocity(state.dead_body_body, {x: 0, y: 0});
        state.reset_ball = false;
    }

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
        team_1_count: state.team_1_count,
        dead_body_pos: {
            x: state.dead_body_body.position.x,
            y: state.dead_body_body.position.y
        },
        team_0_goal_pos: {
            x: state.team_0_goal.position.x,
            y: state.team_0_goal.position.y
        },
        team_1_goal_pos: {
            x: state.team_1_goal.position.x,
            y: state.team_1_goal.position.y
        }
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
            team: value.team,
            username: value.username
        }
    }
    
    io.emit('update', 
        send_state
    );
  }

  goal_left(){
    state.team_1_score++;
    this.matter.body.setPosition(state.dead_body_body, {x: 700, y: 400});
    this.matter.body.setVelocity(state.dead_body_body, {x: 0, y: 0});
    
  }

  goal_right(){
    state.team_0_score++;
    this.matter.body.setPosition(state.dead_body_body, {x: 700, y: 400});
    this.matter.body.setVelocity(state.dead_body_body, {x: 0, y: 0});
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
  width: 1400,
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