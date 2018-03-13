const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const app = express();
const server = require('http').createServer();

app.use(express.static(path.join(__dirname, '/public')));

/*
* GameStruct: {gameId: name, state: [init,waiting,running,stop]}
* */

class GameManager {
  constructor() {
    this.games = {
      'uno': {
        state: 'init',
        qttPlayers: -1,
        sharedState: {},
        cTurn: 0,
        playersReady: 0
      }
    };
  }

  setQttPlayers(gameId, qtt) {
    this.games[gameId]['qttPlayers'] = qtt;
  }

  updateState(gameId, state) {
    this.games[gameId]['sharedState'] = state;
  }

  playerJoin(gameId) {
    this.games[gameId].playersReady++;
  }
}

let GM, bootstrapped=0;
const wss = new WebSocket.Server({server: server});

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    console.log(data);

    let directMessage = (dataSend) => {
      wss.clients.forEach((client) => {
        if (client === ws && client.readyState === WebSocket.OPEN) {
          console.log('direct', dataSend);
          client.send(dataSend);
        }
      });
    };
    let broadcastMessage = (dataSend) => {
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          console.log('broadcast', dataSend);
          client.send(dataSend);
        }
      });
    };

    /*
    * {type: 'initGame', qttPlayers: 2, gameId: 'uno'}
    * */
    let pd = JSON.parse(data);
    let dataSend = '';
    if (pd.type === 'reqBootstrap') {
      if (typeof GM === 'undefined') {
        GM = new GameManager();
      }
      if (bootstrapped){
        if (GM.games[pd.gameId].playersReady === GM.games[pd.gameId].qttPlayers) {
          dataSend = JSON.stringify({type: 'bootstrapped', value: 3});
        } else if (GM.games[pd.gameId].qttPlayers === -1) {
          dataSend = JSON.stringify({type: 'bootstrapped', value: 2});
        } else {
          dataSend = JSON.stringify({type: 'bootstrapped', value: bootstrapped});
        }
      } else {
        dataSend = JSON.stringify({type: 'bootstrapped', value: bootstrapped});
        bootstrapped++;
      }
      directMessage(dataSend);
    } else if (pd.type === 'initGame') {
      if (GM.games[pd.gameId].qttPlayers === -1) {
        GM.setQttPlayers(pd.gameId, pd.qttPlayers);
      }

      // modificar, cada jogador tera um botao de pronto (players: pronto?)
      GM.playerJoin(pd.gameId);
      broadcastMessage(JSON.stringify({type: 'playerJoin', wait: GM.games[pd.gameId].qttPlayers - GM.games[pd.gameId].playersReady}));
    } else if (pd.type === 'turn') {
      GM.updateState(pd.gameId, pd.state);
    }
  });
});

server.on('request', app);
server.listen(8080, () => {
  console.log('Listening on http://localhost:8080');
});