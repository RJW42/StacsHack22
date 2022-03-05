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
}

scene.update_state = (state) => {
    // Convert the state to client side 
    let new_state = null;


    // Update the state 
    scene.state = new_state;
}

scene.state = null;

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    scene: scene
}

var game = new Phaser.Game(config);

