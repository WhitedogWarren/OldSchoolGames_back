const { User } = require('../models');
const { Op } = require("sequelize");
const jwt = require('jsonwebtoken');

exports.connectionHandler = (socket) =>  {
    //emit connexion aknowledgment to user
    socket.emit('connexion_acknowledgement');
    //check if user is registered and authorized, create a room, then send him user list
    socket.on('setRoom', (token) => {
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
        const userId = decodedToken.userId;
        User.findOne({attributes: ['pseudo'], where: { id: userId}})
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
                //send a message to user room
                socket.join(user.pseudo);
                socket.nsp.to(user.pseudo).emit('message', 'message émis depuis votre room');
                //send a message to user socket with connected users list
                socket.emit('socketNamed', JSON.stringify(data));
                socket.broadcast.emit('newUser', JSON.stringify(data));
            }
        })
    })
    socket.on('disconnect', async reason => {
        if(socket.userName) {
            //unset all invitations of user
            User.update({invited: '[]', invitedBy: '[]'}, {where: {pseudo: socket.userName}});
            
            const goneUser = await User.findOne({where: {pseudo: socket.userName}});
            //unset all invitations sent by user on other users
            const usersInvitedBy = await User.findAll({attributes: ['id', 'pseudo', 'invited', 'invitedBy'] , where: {invitedBy: {[Op.substring]: goneUser.pseudo}}});
            for(let user of usersInvitedBy) {
                let invitedByArray = JSON.parse(user.invitedBy);
                invitedByArray = invitedByArray.filter(elt => elt !== goneUser.pseudo);
                User.update({invitedBy: JSON.stringify(invitedByArray)}, {where: {id: user.id}})
                .then(() => {
                    User.findOne({attributes: ['invited', 'invitedBy'], where: {id: user.id}})
                    .then((userInvites) => {
                        let parsedValues = {
                            invited: JSON.parse(userInvites.dataValues.invited),
                            invitedBy: JSON.parse(userInvites.dataValues.invitedBy)
                        }
                        socket.nsp.to(user.pseudo).emit('invitesList', JSON.stringify(parsedValues));
                    })
                });
            }
            
            //unset all invitations received by user from other users
            const usersInvited = await User.findAll({attributes: ['id', 'pseudo', 'invited', 'invitedBy'] , where: {invited: {[Op.substring]: goneUser.pseudo}}});
            for(let user of usersInvited) {
                let invitedArray = JSON.parse(user.invited);
                invitedArray = invitedArray.filter(elt => elt !== goneUser.pseudo);
                User.update({invited: JSON.stringify(invitedArray)}, {where: {id:user.id}})
                .then(() => {
                    User.findOne({attributes: ['invited', 'invitedBy'], where: {id: user.id}})
                    .then((userInvites) => {
                        let parsedValues = {
                            invited: JSON.parse(userInvites.dataValues.invited),
                            invitedBy: JSON.parse(userInvites.dataValues.invitedBy)
                        }
                        socket.nsp.to(user.pseudo).emit('invitesList', JSON.stringify(parsedValues));
                    })
                });
            }
            //broadcast disconnection
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
    })
    

    socket.on('invite', async (user) => {
        console.log(`${socket.userName} a invité ${user}`);
        socket.nsp.to(user).emit('invitedBy', socket.userName);
        // save invites in db
        const inviter = await User.findOne({where: {pseudo: socket.userName}});
        const invited = await User.findOne({where: {pseudo: user}});
        
        // emit invites lists to both host and guest
        const hostPromise = new Promise((resolve, reject) => { // add invitation in inviter
            let invitedArray = JSON.parse(inviter.invited);
            if(!invitedArray.includes(invited.pseudo)) {
                invitedArray.push(invited.pseudo);
            }
            User.update({invited: JSON.stringify(invitedArray)}, {where: {id: inviter.id}})
            .then(() => {
                User.findOne({attributes: ['invited', 'invitedBy'], where: {id: inviter.id}})
                .then(user => resolve(user.dataValues))
            })
        })
        const guestPromise = new Promise((resolve, reject) => { // add invitation in invited
            let invitedByArray = JSON.parse(invited.invitedBy);
            if(!invitedByArray.includes(inviter.pseudo)) {
                invitedByArray.push(inviter.pseudo);
            }
            User.update({invitedBy: JSON.stringify(invitedByArray)}, {where: {id: invited.id}})
            .then(() => {
                User.findOne({attributes: ['invited', 'invitedBy'], where: {id: invited.id}})
                .then(user => resolve(user.dataValues))
            });
        })
        Promise.all([hostPromise, guestPromise]).then((values) => {
            //parse values to get arrays
            values[0].invited = JSON.parse(values[0].invited);
            values[0].invitedBy = JSON.parse(values[0].invitedBy);
            values[1].invited = JSON.parse(values[1].invited);
            values[1].invitedBy = JSON.parse(values[1].invitedBy);
            //send invites lists to both host and guest
            socket.nsp.to(socket.userName).emit('invitesList', JSON.stringify(values[0]));
            socket.nsp.to(user).emit('invitesList', JSON.stringify(values[1]));
        })
    })
}