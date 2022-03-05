var Client = {};
Client.socket = io.connect();

Client.socket.on('newplayer',function(data){
    scene.add_new_player(data.id,data.x,data.y);
});

Client.socket.on('allplayers',function(data){
    for(var i = 0; i < data.length; i++){
        scene.add_new_player(data[i].id,data[i].x,data[i].y);
    }

    Client.socket.on('remove',function(id){
        scene.remove_player(id);
    });
});

// All client side code 
Client.send_new_player = function(){
    Client.socket.emit('newplayer');
};

Client.socket.on('newplayer', (data) => {
    scene.add_new_player(data.id, data.x, data.y);
})

Client.socket.on('allplayers', (data) => {
    for(var i = 0; i < data.length; i++){
        scene.add_new_player(data[i].id, data[i].x, data[i].y);
    }

    Client.socket.on('remove', (id) => {
        remove_player(id);
    });
});