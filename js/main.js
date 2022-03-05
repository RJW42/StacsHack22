var scene = new Phaser.Scene('Game');

scene.preload = () => {
    // Load all assets 
    //this.load.tilemap('map', 'assets/map/example_map.json', null, Phaser.Tilemap.TILED_JSON);
    //this.load.spritesheet('tileset', 'assets/map/tilesheet.png',32,32);
    scene.load.image('sprite','assets/sprites/sprite.png');
    scene.load.image('backgorund', 'assets/sprites/test.png')
}

scene.create = () => {
    console.log('yee');
    Client.send_new_player();
}

scene.add_new_player = (id, x, y) => {
    scene.add.image(x, y, 'sprite');
}

scene.remove_player = (id) => {
    scene.player_map[id].destroy();
    delete scene.player_map[id];
};

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    scene: scene
}

var game = new Phaser.Game(config);

