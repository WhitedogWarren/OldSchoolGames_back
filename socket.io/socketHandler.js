const { User } = require('../models');
const jwt = require('jsonwebtoken');

exports.connectionHandler = (socket) =>  {
    socket.emit('connexion_acknowledgement')
    socket.on('disconnect', reason => {
        if(socket.userName) {
            let data = {
                pseudo: socket.userName,
                userList: []
            }
            //socket.nsp.socket is the Map of every socket instance of io server
            //here we add them to data.userList
            socket.nsp.sockets.forEach((value, key, map) => {
                data.userList.push(value.userName);
            })
                
            socket.broadcast.emit('userLeft', JSON.stringify(data));
        }
        //console.log(socket.nsp.sockets);
    })
    socket.on('setRoom', (token) => {
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        const userId = decodedToken.userId;
        User.findOne({where: { id: userId}})
        .then(user => {
            if(user) {
                socket.userName = user.pseudo;
                let data = {
                    pseudo: socket.userName,
                    userList: []
                }
                //socket.nsp.socket is the Map of every socket instance of io server
                //here we add them to data.userList
                socket.nsp.sockets.forEach((value, key, map) => {
                    data.userList.push(value.userName);
                })
                socket.emit('socketNamed', JSON.stringify(data));
                
                socket.broadcast.emit('newUser', JSON.stringify(data));
            }
        })
    })
}