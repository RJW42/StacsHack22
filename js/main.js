var scene = new Phaser.Scene('Game');
var title_scene = new Phaser.Scene('Title');
var username = "";


title_scene.preload = () => {
    title_scene.load.plugin('rexinputtextplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexinputtextplugin.min.js', true);
    title_scene.input_key = title_scene.input.keyboard.addKey('enter');
}

title_scene.create = () => {
    title_scene.input_text = title_scene.add.rexInputText(700, 400, 500, 50, {
        type: 'text',
        text: '...',
        fontSize: '50px',
        color: 'black',
        borderColor: 'black',
        border: 1,
    });
    title_scene.add.text(180, 375, 'Username: ', {
        fontSize: 50,
        color: 'black',
    });
}

title_scene.update = () => {
    if(title_scene.input_key.isDown && title_scene.input_text.text.length > 3 && title_scene.input_text.text != '...'){
        username = title_scene.input_text.text;
        title_scene.scene.start('Game');
    }
}

scene.connected = false;

const PLAYING = 0; //Symbol('Playing');
const WAITING_FOR_PLAYERS = 1; //Symbol('Waiting');
const COUNT_DOWN = 2; //Symbol('CountDown');
const SPECTATING = 3;

var usernames_set = false;

scene.dead_body_obj = null;

scene.preload = () => {
    // Load all assets 
    scene.load.image('player', 'assets/sprites/player.png');
    scene.load.image('team', 'assets/sprites/team.png');
    scene.load.image('enemy', 'assets/sprites/enemy.png');
    scene.load.image('dead_body', 'assets/sprites/dead_body.png');
    scene.load.image('enemy_goal', 'assets/sprites/enemy_goal.png');
    scene.load.image('player_goal', 'assets/sprites/player_goal.png');
    scene.keys = {
        up: scene.input.keyboard.addKey('W'),
        down: scene.input.keyboard.addKey('S'),
        left: scene.input.keyboard.addKey('A'),
        right: scene.input.keyboard.addKey('D'),
        space: scene.input.keyboard.addKey('space'),
    }
    scene.score_text = scene.add.text(0, 0, 'Waiting For Players', {
        fontSize: 60,
        color: 'black',
    });
    scene.goal_text = scene.add.text(0, 60, '', {
        fontSize: 60,
        color: 'black',
    })
}

scene.create = () => {
    console.log('Start');
    Client.connect(username);
}

scene.update = () => {
    // Check if state is set 
    if(scene.state == null)
        return;
    scene.get_usernames();

    // State set render the state 
    for(const [player_id, player] of Object.entries(scene.state.players)){
        player.obj.x = player.x
        player.obj.y = player.y
        if(player.obj.texture.key === '__MISSING'){
            if(player_id == scene.player_id){
                player.obj.setTexture('player');
            }else if(player.team == scene.player_team){
                player.obj.setTexture('team')
            }else{
                player.obj.setTexture('enemy');
                console.log(player, scene.player_team)
            }
        }
    }

    if(scene.dead_body_obj != null) {
        scene.dead_body_obj.x = scene.state.dead_body_pos.x
        scene.dead_body_obj.y = scene.state.dead_body_pos.y
    }
    if(scene.player_goal_obj != null){
        if(scene.player_team == 0){
            scene.player_goal_obj.x = scene.state.team_0_goal_pos.x;
            scene.player_goal_obj.y = scene.state.team_0_goal_pos.y;
            scene.enemy_goal_obj.x = scene.state.team_1_goal_pos.x;
            scene.enemy_goal_obj.y = scene.state.team_1_goal_pos.y;
        } else {
            scene.player_goal_obj.x = scene.state.team_1_goal_pos.x;
            scene.player_goal_obj.y = scene.state.team_1_goal_pos.y;
            scene.enemy_goal_obj.x = scene.state.team_0_goal_pos.x;
            scene.enemy_goal_obj.y = scene.state.team_0_goal_pos.y;
        }
    }

    // Draw Text
    scene.draw_text();

    // Send keyboard input 
    keys = {
        up: scene.keys.up.isDown,
        down: scene.keys.down.isDown,
        left: scene.keys.left.isDown,
        right: scene.keys.right.isDown,
        space: scene.keys.space.isDown,
    }
    Client.socket.emit('movement', keys);
}

scene.draw_text = () => {
    switch(scene.state.game_state){
        case PLAYING:
            //var player_score = (scene.player_team == 0) ? scene.state.team_0_score : scene.state.team_1_score;
            //var enemy_score = (scene.player_team == 1) ? scene.state.team_0_score : scene.state.team_1_score;
            scene.score_text.setText('Score: ' + scene.state.team_0_score + '-' + scene.state.team_1_score);
            break;
        case WAITING_FOR_PLAYERS:
            break;
        case COUNT_DOWN:
            scene.score_text.setText('T -' + Math.round(scene.state.time_left));
            break;
        //case SPECTATING:
            //scene.score_text.setText('Spectating');
    }
}

scene.update_state = (server_state) => {
    //console.log(server_state);
    if(!scene.loaded)
        return;

    // Convert the state to client side 
    let new_state = {
        id: 0,
        team: 0,
        players: {},
        game_state: server_state.game_state,
        time_left: server_state.time_left,
        team_0_score: server_state.team_0_score,
        team_1_score: server_state.team_1_score,
        dead_body_pos: server_state.dead_body_pos,
        team_0_goal_pos: server_state.team_0_goal_pos,
        team_1_goal_pos: server_state.team_1_goal_pos,
        last_colision: server_state.last_colision
    }

    for(var player_id in server_state.players) {
        // Check if player is already created 
        var obj;

        if(scene.state.players[player_id]){
            obj = scene.state.players[player_id].obj;
        } else {
            usernames_set = false;
            console.log('sprite', player_id, server_state.players[player_id].team);
            if(player_id == scene.player_id){
                obj = scene.add.sprite(-50, -50, 'player');
            }else if(server_state.players[player_id].team == scene.player_team){
                obj = scene.add.sprite(-50, -50, 'team');
            }else{
                obj = scene.add.sprite(-50, -50, 'enemy');
                console.log(server_state.players[player_id], scene.player_team)
            }
        }

        new_state.players[player_id] = {
            x: server_state.players[player_id].x,
            y: server_state.players[player_id].y,
            obj: obj,
            team: server_state.players[player_id].team,
            username: server_state.players[player_id].username
        }
    }

    if(scene.dead_body_obj == null)
        scene.dead_body_obj = scene.add.sprite(-50, -50, 'dead_body');
    if(scene.player_goal_obj == null){
        scene.player_goal_obj = scene.add.sprite(-50, -50, 'player_goal');
        scene.enemy_goal_obj = scene.add.sprite(-50, -50, 'enemy_goal');
    }

    //if(new_state.players[scene.player_id].spectating)
        //new_state.game_state = SPECTATING;

    // Check for deleted players 
    for(var player_id in scene.state.players){
        if(!new_state.players[player_id]){
            scene.state.players[player_id].obj.destroy(true);
            usernames_set = false;
        }
    }

    // Update the state 
    scene.state = new_state;
}

scene.get_usernames = () => {
    if(scene.state == null)
        return;
    if(usernames_set)
        return;
    usernames_set = true;

    // Get all usernames 
    var usernames = {
        team_0: "",
        team_1: ""
    }

    for(var player_id in scene.state.players){
        var player = scene.state.players[player_id];
        if(player.team == 0){
            usernames.team_0 = usernames.team_0.concat("<li>",player.username,"</li>");
        } else {
            usernames.team_1 = usernames.team_1.concat("<li>",player.username,"</li>");
        }
    }

    console.log(usernames);

    // Set those usernames 
    $('#team-0-column').html('<ul><li><h2>Team 0</h2></li>' + usernames.team_0 + '</ul>');
    $('#team-1-column').html('<ul><li><h2>Team 1</h2></li>' + usernames.team_1 + '</ul>');
}

scene.state = {
    id: 0,
    players: {}
};

var config = {
    type: Phaser.AUTO,
    width: 1400,
    height: 800,
    dom: {
        createContainer: true
    },        
    scene: [title_scene, scene],
    parent: 'game',
    backgroundColor: '#70a4c9',
}

var game = new Phaser.Game(config);

