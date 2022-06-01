//const { io } = require("../../front/public/socket.io/socket.io.esm.min");

exports.socketHandler = (socket) =>  {
    console.log('coucou from ws handler');
    socket.on('test', () => {
        console.log('Test emmited');
        socket.emit('message', 'hello from socket.io');
    })
}