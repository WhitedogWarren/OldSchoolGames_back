const morpionManager = require('./gameManagers/morpionManager');
const { User } = require('../models');
const { Op, Sequelize } = require('sequelize');

exports.morpionGameHandler = async (socket, host) => {
    console.log(`${socket.userName} accepte l'invitation de ${host}`);
    const hostRoom = socket.nsp.to(host);
    const guestRoom = socket.nsp.to(socket.userName);
    let hostSocket;
    socket.nsp.sockets.forEach((value, key, map) => {
        if(value.userName === host) {
            hostSocket = value;
        }
    });

    //store a reference to host in guest socket
    socket.game = host;

    hostRoom.emit('morpionStarts', {guest: socket.userName});
    guestRoom.emit('morpionStarts', {host: host});

    // start the game
    if(!socket.nsp.morpionGames) {
        socket.nsp.morpionGames = morpionManager.games;
    }
    socket.nsp.morpionGames.set(host, new morpionManager.MorpionGame(host, socket.userName));
    
    //////
    // remove invitations from db
    //////
    
    //remove host from guest's "invitedBy" field
    User.update({invitedBy: Sequelize.fn('array_remove', Sequelize.col('invitedBy'), host)}, {where: {pseudo: socket.userName}})

    //remove all invites sent by guest in guest DB entry
    User.update({invited: []}, {where: {pseudo: socket.userName}});
    //remove all invites sent by host in host DB entry
    User.update({invited: []}, {where: {pseudo: host}});

    //remove all invites sent by host and guest from other users' DB entries
    User.update({invitedBy: Sequelize.fn('array_remove', Sequelize.col('invitedBy'), socket.userName)}, {where: { invitedBy: {[Op.contains]: [socket.userName]}}});
    User.update({invitedBy: Sequelize.fn('array_remove', Sequelize.col('invitedBy'), host)}, {where: { invitedBy: {[Op.contains]: [host]}}});
    
    //////////////
    //
    // game related eventListeners
    //
    //////////////

    //////
    //cellPlayed
    //////
    function cellPlayed(data)  {
        console.log(data);
        let game = socket.nsp.morpionGames.get(data.gameHost);
        console.log(game.turn);
        let playResponse = game.play(data.player, data.cellPlayed);
        console.log(playResponse);
        if(playResponse.error) {
            
            socket.nsp.to(data.player).emit('error', playResponse.message);
        }
        else {
            let responseData = {
                message: `${data.player} joue en ${data.cellPlayed}`,
                token: playResponse.token,
                cellToDraw: playResponse.cellToDraw,
                result: playResponse.result
            }
            if(playResponse.result) {
                if(playResponse.result.draw) {
                    responseData.message = 'Match nul !';
                }
                if(playResponse.result.gagnant) {
                    responseData.message = `${playResponse.result.gagnant} gagne la partie`;
                }
            }
            hostRoom.emit('gameMessage', responseData);
            guestRoom.emit('gameMessage', responseData);
        }
    }
    socket.on('cellPlayed', data => cellPlayed(data));
    hostSocket.on('cellPlayed', data => cellPlayed(data));
    //////
    //gameRelaod
    //////
    function gameReload(data) {
        console.log('reload ' + data.host + " from : " + data.from);
        let otherPlayer
        let askingPlayer
        if(data.host == data.from){
            otherPlayer = 'player2';
            askingPlayer = 'player1';
        }
        else{
            otherPlayer = 'player1';
            askingPlayer = 'player2';
        }
        //if reload has already been asked, reload game
        if(morpionManager.games.get(data.host).reload.get(otherPlayer)){
            let reloadGuest = morpionManager.games.get(data.host).player2;
            morpionManager.games.set(data.host, new morpionManager.MorpionGame(data.host, reloadGuest));
            hostRoom.emit('reloadGame', {host: data.host, guest: morpionManager.games.get(data.host).player2});
            guestRoom.emit('reloadGame', {host: data.host, guest: morpionManager.games.get(data.host).player2});
        }
        // else, store the demand and notify users.
        else{
            morpionManager.games.get(data.host).reload.set(askingPlayer, true);
            hostRoom.emit('reloadAsked', {host: data.host, by: data.from});
            guestRoom.emit('reloadAsked', {host: data.host, by: data.from});
        }
    }
    socket.on('gameReload', data => {
        gameReload(data);
    });
    hostSocket.on('gameReload', data => {
        gameReload(data);
    });
    //////
    //gameLeave
    //////
    function gameleave(data) {
        console.log('game left ! ' + data.user + ' quitte la partie de ' + data.gameHost);
        // notify the other player
        if(data.user == socket.userName) {
            hostSocket.emit('gameLeft', data.user);
        }
        if(data.user == data.gameHost) {
            socket.emit('gameLeft', data.user);
        }
        //close the game
        morpionManager.games.delete(data.gameHost);
    }
    // when a player emits gameLeave event
    socket.on('gameLeave', (data) => {
        gameleave(data);
    })
    hostSocket.on('gameLeave', (data) => {
        gameleave(data);
    })
    // deal with players signout and disconnection
    socket.on('disconnecting', () => {
        gameleave({user: socket.userName, gameHost: socket.game});
    })
    hostSocket.on('disconnecting', () => {
        gameleave({user: hostSocket.userName, gameHost: hostSocket.userName});
    })
}