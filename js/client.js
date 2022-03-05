var Client = {};
Client.socket = io.connect();

Client.socket.on('newplayer',function(data){
    // Called on sucseful connection to server 
});

// All client side code 
Client.send_new_player = function(){
    Client.socket.emit('newplayer');
};

Client.socket.on('update', (state) => {
    scene.update_state(state);
})
