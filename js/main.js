var scene = new Phaser.Scene('Game');

scene.preload = () => {
    // Load all assets 
    //this.load.tilemap('map', 'assets/map/example_map.json', null, Phaser.Tilemap.TILED_JSON);
    //this.load.spritesheet('tileset', 'assets/map/tilesheet.png',32,32);
    scene.load.image('sprite','assets/sprites/sprite.png');
    scene.load.image('backgorund', 'assets/sprites/test.png')
}

scene.create = () => {
    console.log('Start');
    Client.connect();
}

scene.update = () => {
    // Check if state is set 
    if(scene.state == null)
        return;

    // State set render the state 
    for(var player_id in scene.state.players){
        scene.state.players[player_id].obj.x = scene.state.players[player_id].x
        scene.state.players[player_id].obj.y = scene.state.players[player_id].y
    }
}

scene.update_state = (server_state) => {
    // Convert the state to client side 
    let new_state = {
        id: 0,
        players: {}
    }

    for(var player_id in server_state.players) {
        // Check if player is already created 
        var obj;

        if(scene.state.players[player_id]){
            obj = scene.state.players[player_id].obj;
        } else {
            console.log('sprite', player_id);
            obj = scene.add.sprite(0, 0, 'sprite');;
        }

        new_state.players[player_id] = {
            x: server_state.players[player_id].x,
            y: server_state.players[player_id].y,
            obj: obj
        }
    }

    // Update the state 
    scene.state = new_state;
}

scene.state = {
    id: 0,
    players: {}
};

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    scene: scene
}

var game = new Phaser.Game(config);

