exports.morpionGameHandler = (socket, host) => {
    console.log(`${socket.userName} accepte l'invitation de ${host}`);
    const hostRoom = socket.nsp.to(host);
    const guestRoom = socket.nsp.to(socket.userName);

    hostRoom.emit('morpionStarts', 'Partie lancée, vous êtes l\'hôte');
    guestRoom.emit('morpionStarts', 'Partie lancée, vous êtes l\'invité');

    //////
    // TODO: start the game
    //////
}