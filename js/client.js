var Client = {};
Client.socket = io.connect();

Client.socket.on('init',function(player_id){
    // Called on sucseful connection to server 
});

// All client side code 
Client.connect = function(){
    // Create new connection to server 
    Client.socket.emit('connect_to_server');
};

Client.socket.on('update', (state) => {
    scene.update_state(state);
})
