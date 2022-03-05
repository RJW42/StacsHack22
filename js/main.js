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
    if(scene.state == null)
        return;
    if(scene.obj == null)
        scene.obj = scene.add.sprite(scene.state.x, 100, 'sprite');
    scene.obj.x = scene.state.x
}

scene.update_state = (state) => {
    scene.state = state;
}

scene.state = null;

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 800,
    scene: scene
}

var game = new Phaser.Game(config);

