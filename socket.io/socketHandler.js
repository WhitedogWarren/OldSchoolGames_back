exports.socketHandler = (socket) =>  {
    //console.log('coucou from ws handler');
    socket.emit('connexion_acknowledgement')
    socket.on('test', () => {
        console.log('Test emmited');
        socket.emit('message', 'hello from socket.io');
    })
}