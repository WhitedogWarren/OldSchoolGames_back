const games = new Map();

class MorpionGame {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.token = new Map([['player1', "X"], ['player2', "O"]]);
        this.turn = player1;
        this.reload = new Map([['player1', false], ['player2', false]]);
        // A coller dans le prototype ?
        this.cells = {c11: false, c12: false, c13: false, c21: false, c22: false, c23: false, c31: false, c32: false, c33: false};
        
        this.play = function(player, cell) {
            let message = '';
            let result = false;
            if(player != this.turn)
                return {error: 'Wrong turn', message: 'Ce n\'est pas votre tour!', result: result};
            if(this.cells[cell])
                return {error: 'Already played', message: 'case déjà jouée!', result: result};
            if(!this.cells.hasOwnProperty(cell))
                return {error: 'Wrong cell name', message: 'Cette case n\'existe pas', result: result};
            // Fin de levée des erreurs, coup valide
            let tokenToReturn;
            if(player == this.player1)
                tokenToReturn = this.token.get('player1');
            if( player == this.player2)
                 tokenToReturn = this.token.get('player2')
            this.cells[cell] = player;
            // Tester victoire
            //établir les cellules valides
            let vectors = [-11, -10, -9, +1, +11, +10, +9, -1];
            let cellNumber = cell.substring(1) - 0;
            let validvectors = [];
            for(let vector of vectors){
                let vectorCell = 'c' + (cellNumber + vector);
                if(this.cells.hasOwnProperty(vectorCell))
                    validvectors.push(vector);
            }
            for(let testedVector of validvectors){
                if(this.cells['c' + (cellNumber + testedVector)] == player){ 
                    if(this.cells.hasOwnProperty('c' + (cellNumber - testedVector)) && this.cells['c' + (cellNumber - testedVector)] == player)
                        result = {draw: false, gagnant: player, cells: ['c' + (cellNumber - testedVector), 'c' + cellNumber, 'c' + (cellNumber + testedVector)]}
                    if(this.cells.hasOwnProperty('c' + (cellNumber + (testedVector*2))) && this.cells['c' + (cellNumber + (testedVector*2))] == player){
                        result = {draw: false, gagnant: player, cells: ['c' + cellNumber, 'c' + (cellNumber + testedVector), 'c' + (cellNumber + (testedVector*2))]};
                    }
                }
            }
            // Tester match nul
            let playbleCells = [];
            for(let cell in this.cells){
                if(!this.cells[cell])
                    playbleCells.push(cell);
            }
            if(playbleCells.length === 0){
                result = {draw: true, gagnant: false, cells:false};
            }
            //fin du tour, changer de joueur
            this.turn == this.player1 ? this.turn = this.player2 : this.turn = this.player1;
            // Retourner la réponse
            return {message: 'fin de this.play', token: tokenToReturn, cellToDraw: cell, result: result};
        }//fin this.play
    }//fin constructor
}// fin MorpionGame

module.exports = {
    games: games,
    MorpionGame: MorpionGame
}