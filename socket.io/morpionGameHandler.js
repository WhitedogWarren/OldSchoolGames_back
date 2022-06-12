const morpionManager = require('./gameManagers/morpionManager');

exports.morpionGameHandler = (socket, host) => {
    console.log(`${socket.userName} accepte l'invitation de ${host}`);
    const hostRoom = socket.nsp.to(host);
    const guestRoom = socket.nsp.to(socket.userName);
    let hostSocket;
    socket.nsp.sockets.forEach((value, key, map) => {
        if(value.userName === host) {
            hostSocket = value;
        }
    });

    console.log('host : ', hostSocket.userName);
    hostRoom.emit('morpionStarts', {guest: socket.userName});
    guestRoom.emit('morpionStarts', {host: host});

    // start the game
    if(!socket.nsp.morpionGames) {
        socket.nsp.morpionGames = morpionManager.games;
    }
    socket.nsp.morpionGames.set(host, new morpionManager.MorpionGame(host, socket.userName));
    
    //////
    // TODO : remove invitations from db
    //////
    
    //////
    // game related eventListeners
    //////

    //cellPlayed
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
            hostRoom.emit('gameMessage', responseData);
            guestRoom.emit('gameMessage', responseData);
        }
    }
    //////
    // TODO : check if there is a result and if so notify players
    //////
    socket.on('cellPlayed', data => cellPlayed(data));
    hostSocket.on('cellPlayed', data => cellPlayed(data));
    
    //////
    // TODO : control and correct these old handlers
    //////
    //gameRelaod
    socket.on('gameReload', (data) => {
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
        if(morpionManager.games.get(data.host).reload.get(otherPlayer)){ //relancer le jeu
            let reloadGuest = morpionManager.games.get(data.host).player2;
            morpionManager.games.set(data.host, new morpionManager.MorpionGame(data.host, reloadGuest));
            io.to(data.host).emit('reloadGame', {host: data.host, guest: morpionManager.games.get(data.host).player2});
        }
        else{ //enregistrer la demande de reload et prévenir les joueurs
            morpionManager.games.get(data.host).reload.set(askingPlayer, true);
            io.to(data.host).emit('reloadAsked', {host: data.host, by: data.from});
        }
    })
    //gameLeave
    socket.on('gameLeave', (data) => {
        //////
        // TODO : notify the other player and close the game
        //////
        console.log('game left ! ' + data.user + ' quitte la partie de ' + data.gameHost);
    })
}