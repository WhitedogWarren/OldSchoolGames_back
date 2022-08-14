const { User } = require('../models');
const { Op, Sequelize } = require("sequelize");
const jwt = require('jsonwebtoken');
const {parse: pgParse} = require('postgres-array');
const morpionGameManager = require('./morpionGameHandler');

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
            User.update({invited: [], invitedBy: []}, {where: {pseudo: socket.userName}});
            
            const goneUser = await User.findOne({where: {pseudo: socket.userName}});
            
            const usersInvitedBy = await User.findAll({attributes: ['pseudo', 'invited', 'invitedBy'] , where: {invitedBy: {[Op.contains]: [goneUser.pseudo]}}});
            
            const usersInvited = await User.findAll({attributes: ['pseudo', 'invited', 'invitedBy'] , where: {invited: {[Op.contains]: [goneUser.pseudo]}}});
            
            //update "invited" and "invitedBy" fields of other users            
            await User.update({invitedBy: Sequelize.fn('array_remove', Sequelize.col('invitedBy'), goneUser.pseudo)}, {where: {invitedBy: {[Op.contains]: [goneUser.pseudo]}}});
            await User.update({invited: Sequelize.fn('array_remove', Sequelize.col('invited'), goneUser.pseudo)}, {where: {invited: {[Op.contains]: [goneUser.pseudo]}}});

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
            console.log('userList : ', data.userList);
            socket.broadcast.emit('userLeft', JSON.stringify(data));

            
            // send invites lists to updated users.
            
            for(let user of usersInvitedBy) {
                socket.nsp.to(user.dataValues.pseudo).emit('invitesList', {
                    invited: user.dataValues.invited.filter(elt => elt !== goneUser.pseudo),
                    invitedBy: user.dataValues.invitedBy.filter(elt => elt !== goneUser.pseudo)
                });
            }
            for(let user of usersInvited) {
                socket.nsp.to(user.dataValues.pseudo).emit('invitesList', {
                    invited: user.dataValues.invited.filter(elt => elt !== goneUser.pseudo),
                    invitedBy: user.dataValues.invitedBy.filter(elt => elt !== goneUser.pseudo)
                })
            }
        }
    })

    //////
    // TODO : adapter à la nouvelle BDD
    //////
    socket.on('invite', async (user) => {
        console.log(`${socket.userName} a invité ${user}`);
        socket.nsp.to(user).emit('invitedBy', socket.userName);
        // save invites in db
        const inviter = await User.findOne({where: {pseudo: socket.userName}});
        const invited = await User.findOne({where: {pseudo: user}});
        
        // emit invites lists to both host and guest
        const hostPromise = new Promise((resolve, reject) => { // add invitation in inviter
            let invitedArray = pgParse(inviter.invited);
            if(!invitedArray.includes(invited.pseudo)) {
                invitedArray.push(invited.pseudo);
            }
            User.update({invited: invitedArray}, {where: {id: inviter.id}})
            .then(() => {
                User.findOne({attributes: ['invited', 'invitedBy'], where: {id: inviter.id}})
                .then(user => resolve(user.dataValues))
            })
        })
        const guestPromise = new Promise((resolve, reject) => { // add invitation in invited
            let invitedByArray = pgParse(invited.invitedBy);
            if(!invitedByArray.includes(inviter.pseudo)) {
                invitedByArray.push(inviter.pseudo);
            }
            User.update({invitedBy: invitedByArray}, {where: {id: invited.id}})
            .then(() => {
                User.findOne({attributes: ['invited', 'invitedBy'], where: {id: invited.id}})
                .then(user => resolve(user.dataValues))
            });
        })
        Promise.all([hostPromise, guestPromise]).then((values) => {
            console.log(values);
            socket.nsp.to(socket.userName).emit('invitesList', JSON.stringify(values[0]));
            socket.nsp.to(user).emit('invitesList', JSON.stringify(values[1]));
        })
    })

    socket.on('setGame', host => {
        console.log('setGame : ', `${host} invite ${socket.userName}`);
        morpionGameManager.morpionGameHandler(socket, host);
    })
}