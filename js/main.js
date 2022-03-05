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
    Client.send_new_player();
}

scene.update_state = (state) => {
    
}


var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    scene: scene
}

var game = new Phaser.Game(config);

