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
    this.games[gameId].sharedState = state;
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

    let unicastMessage = (dataSend) => {
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
    let broadcastAll = (dataSend) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          console.log('broadcastAll', dataSend);
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
      unicastMessage(dataSend);
    } else if (pd.type === 'initGame') {
      if (GM.games[pd.gameId].qttPlayers === -1) {
        GM.setQttPlayers(pd.gameId, pd.qttPlayers);
        broadcastAll(JSON.stringify({type: 'bootstrapped', value: 1, qttPlayers: pd.qttPlayers}));
      } else {
        GM.playerJoin(pd.gameId);
        let qttPlayerWait = GM.games[pd.gameId].qttPlayers - GM.games[pd.gameId].playersReady;
        unicastMessage(JSON.stringify({type: 'playerJoin', wait: qttPlayerWait, playerId: GM.games[pd.gameId].playersReady-1}));
        if (qttPlayerWait === 0 ) {
          broadcastAll(JSON.stringify({type: 'playerJoin', wait: -1}));
        }
      }
    } else if (pd.type === 'turn') {
      console.log(pd);
      GM.updateState(pd.gameId, {players: pd.state.players, current_player: pd.state.current_player, deck: pd.state.deck});
      console.log(GM.games[pd.gameId].sharedState);
      broadcastMessage(JSON.stringify({type: 'turn', state: GM.games[pd.gameId].sharedState}));
    }
  });
});

server.on('request', app);
server.listen(8080, () => {
  console.log('Listening on http://localhost:8080');
});