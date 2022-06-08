const { User } = require('../models');
const { Op } = require("sequelize");
const jwt = require('jsonwebtoken');

exports.connectionHandler = (socket) =>  {
    socket.emit('connexion_acknowledgement')
    socket.on('disconnect', async reason => {
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
            //unset all invitations of user
            User.update({invited: '[]', invitedBy: '[]'}, {where: {pseudo: socket.userName}});
            const goneUser = await User.findOne({where: {pseudo: socket.userName}});
            //unset all invitations sent by user on other users
            const usersInvited = await User.findAll({where: {invitedBy: {[Op.regexp]: `[\\[,]${goneUser.id}[\\],]`}}});
            for(let user of usersInvited) {
                let invitedByArray = JSON.parse(user.invitedBy);
                invitedByArray = invitedByArray.filter(elt => elt !== goneUser.id);
                //console.log(invitedByArray);
                User.update({invitedBy: JSON.stringify(invitedByArray)}, {where: {id: user.id}});
            }
            //unset all invitations received by user from other users
            const usersInvitedBy = await User.findAll({where: {invited: {[Op.regexp]: `[\\[,]${goneUser.id}[\\],]`}}});
            console.log(usersInvitedBy);
            for(let user of usersInvitedBy) {
                let invitedArray = JSON.parse(user.invited);
                invitedArray = invitedArray.filter(elt => elt !== goneUser.id);
                console.log(invitedArray);
                User.update({invited: JSON.stringify(invitedArray)}, {where: {id:user.id}});
            }

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
                socket.join(user.pseudo);
                socket.nsp.to(user.pseudo).emit('message', 'message émis depuis votre room');
                socket.emit('socketNamed', JSON.stringify(data));
                socket.broadcast.emit('newUser', JSON.stringify(data));
            }
        })
    })

    socket.on('invite', async (user) => {
        console.log(`${socket.userName} a invité ${user}`);
        socket.nsp.to(user).emit('invitedBy', socket.userName);
        //////
        // TODO : enregistrer les invitations en bdd
        //////
        const inviter = await User.findOne({where: {pseudo: socket.userName}});
        const invited = await User.findOne({where: {pseudo: user}});
        // add invitation in inviter
        let invitedArray = JSON.parse(inviter.invited);
        if(!invitedArray.includes(invited.id)) {
            invitedArray.push(invited.id);
        }
        User.update({invited: JSON.stringify(invitedArray)}, {where: {id: inviter.id}})
        .then(console.log('invitation enregistrée chez l\'hôte'));

        // add invitation in invited
        let invitedByArray = JSON.parse(invited.invitedBy);
        if(!invitedByArray.includes(inviter.id)) {
            invitedByArray.push(inviter.id);
        }
        User.update({invitedBy: JSON.stringify(invitedByArray)}, {where: {id: invited.id}})
        .then(console.log('invitation enregistrée chez l\'invité'));
    })
}