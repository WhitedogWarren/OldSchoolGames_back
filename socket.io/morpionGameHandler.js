const morpionManager = require('./gameManagers/morpionManager');

exports.morpionGameHandler = (socket, host) => {
    console.log(`${socket.userName} accepte l'invitation de ${host}`);
    const hostRoom = socket.nsp.to(host);
    const guestRoom = socket.nsp.to(socket.userName);

    hostRoom.emit('morpionStarts', 'Partie lancée, vous êtes l\'hôte');
    guestRoom.emit('morpionStarts', 'Partie lancée, vous êtes l\'invité');

    //////
    // TODO: start the game
    //////
    if(!socket.nsp.morpionGames) {
        socket.nsp.morpionGames = morpionManager.games;
    }
    socket.nsp.morpionGames.set(host, new morpionManager.MorpionGame(host, socket.userName));
    
    //////
    // TODO : remove invitations from db
    //////
    
    //////
    // TODO: add game related listeners ( V2 app.js line 195+)
    //////
    //cellPlayed
    socket.on('cellPlayed', (data) => { // jouer le coup
        io.to(data.gameHost).emit('message', data.player + ' joue en ' + data.cellPlayed);
        let returnOfPlay = morpionManager.games.get(data.gameHost).play(data.player, data.cellPlayed);
        if(returnOfPlay.error)
            console.log('returnOfPlay Error :' + returnOfPlay.error);
        else{
            console.log('Réponse : ' + returnOfPlay.message);
            io.to(data.gameHost).emit('drawCell', {token: returnOfPlay.token, cell: returnOfPlay.cellToDraw, turn: morpionManager.games.get(data.gameHost).turn});
            if(returnOfPlay.result){
                console.log('result.draw : ' + returnOfPlay.result.draw + '\nresult.gagnant : ' + returnOfPlay.result.gagnant + '\nCases : ' + returnOfPlay.result.cells);
                io.to(data.gameHost).emit('gameResult', returnOfPlay.result);
            }
        }
    });
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
        console.log('game left ! ' + data.user + ' quitte la partie de ' + data.gameHost);
    })

}