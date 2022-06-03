const { User } = require('../models');
const jwt = require('jsonwebtoken');

exports.connectionHandler = (socket) =>  {
    //console.log('coucou from ws handler');
    socket.emit('connexion_acknowledgement')
    socket.on('test', () => {
        console.log('Test emmited');
        socket.emit('message', 'hello from socket.io');
    })
    socket.on('disconnect', reason => {
        if(socket.userName) {
            socket.broadcast.emit('userLeft', socket.userName);
        }
    })
    socket.on('setRoom', (token) => {
        console.log(token);
         const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        const userId = decodedToken.userId;
        User.findOne({where: { id: userId}})
        .then(user => {
            if(user) {
                console.log(user.pseudo);
                socket.userName = user.pseudo;
                socket.emit('socketNamed', socket.userName);
                //console.log(socket.nsp.sockets);
                //socket.nsp.emit('newUser', 'un utilisateur se connecte');
                socket.broadcast.emit('newUser', socket.userName);
            }
        })
    })
}