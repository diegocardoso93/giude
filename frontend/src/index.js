import './index.css';
//import App from './App';
//import registerServiceWorker from './registerServiceWorker';

import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Image, Rect, Group, Text } from 'react-konva';
import Card from './Card';
import { RedPoint } from './UnoImages';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom'
import { CardsMap } from './CardsMap';

class Home extends Component {
  state = {
    image: null,
    redirect: null,
  };
  constructor(props) {
    super(props);
    this.goToUno = this.goToUno.bind(this);
  }
  componentDidMount() {
    const image = new window.Image();
    image.src = RedPoint;
    image.onload = () => {
      this.setState({
        image: image
      });
    };
  }

  goToUno() {
    this.setState({
      redirect: 'uno'
    });
  }

  render() {
    if (this.state.redirect === 'uno') {
      return <Redirect to='/uno'/>;
    }

    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Image image={this.state.image} onClick={this.goToUno} onTap={this.goToUno}/>

          <Rect
            x={9 + this.props.x}
            y={9 + this.props.y}
            width={48}
            height={77}
            fill={'black'}
            cornerRadius={4}
            onClick={this.goToUno}
            onTap={this.goToUno}
          />
        </Layer>
      </Stage>
    );
  }
}

/*
* gstate: 'waitQttPlayers', 'waitJoin', 'waitMove', 'play'
* */
class Uno extends Component {
  state = {
    qtt_players: 0,
    players: [],
    shuffled: false,
    fullscreen: false,
    current_player: 0,
    deck: { cards: Array.from(new Array(55), (x, i) => i+1), current: 0},
    scene: '',
    action: '',
    qtt_players_wait: 0,
    player_id: -1,

    color: '',
    rotation: 'h',
    buy2: -1,
    buy4: -1,

    buying: -1
  };

  ws;
  constructor(props) {
    super(props);
    this.shuffle = this.shuffle.bind(this);
    this.requestFullscreen = this.requestFullscreen.bind(this);
    this.checkPlay = this.checkPlay.bind(this);
    this.setQttPlayer = this.setQttPlayer.bind(this);
    this.setReady = this.setReady.bind(this);
    this.setColor = this.setColor.bind(this);
  }
  shuffle() {
    if (this.state.deck.cards.length > 0) {
      let players = this.state.players;
      players.forEach((p, i) => {
        for (let i = 0; i < 7; i++) {
          p.cards.push(this.withdrawCard());
        }
      });
      this.state.deck.current = this.withdrawCard();
      this.setState({players: players, shuffled: true});
      let next_state = this.state;
      next_state.shuffled = true;
      next_state.deck = this.state.deck;
      next_state.players = players;
      this.ws.send(JSON.stringify({gameId: 'uno', type: 'turn', state: next_state }));
    }
  }
  withdrawCard() {
    // @TODO: if wCard != "cartas especiais"
    // let wCard = parseInt(Math.random() * this.state.deck.cards.length)
    return this.state.deck.cards.splice(parseInt(Math.random() * this.state.deck.cards.length), 1)[0];
  }
  componentDidMount() {
    this.ws = new WebSocket('ws://localhost:8080');
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({gameId: 'uno', type: 'reqBootstrap'}));
    };
    this.ws.onmessage = (m) => {
      console.log(m);
      let data = JSON.parse(m.data);
      console.log(data);
      if (data.type === 'bootstrapped') {
        if (data.value === 0) {
          this.setState({scene: 'qttPlayerSelect'});
        }  else if (data.value === 1) {
          this.setState({scene: 'reqPlayerReady', qtt_players: data.qttPlayers});
        }  else if (data.value === 2) {
          this.setState({scene: 'waitQttPlayer'});
        }else if (data.value === 3) {
          this.setState({scene: 'maxQttPlayer'});
        }
      } else if (data.type === 'playerJoin') {
        if (data.wait >= 0) {
          this.setState({
            scene: 'waitPlayerJoin',
            qtt_players_wait: data.wait,
            player_id: data.playerId
          });
        } else {
          this.gameInit();
        }
      } else if (data.type === 'turn') {
        if (data.state['rotation'] && data.state['rotation'].length > 0) {
          this.setState({
            players: data.state.players,
            current_player: data.state.current_player,
            deck: data.state.deck,
            shuffled: true,
            rotation: data.state['rotation']
          });
        } else if (data.state['buy2'] >= 0) { // two cards animation
          this.setState({players: data.state.players, current_player: data.state.current_player, deck: data.state.deck, shuffled: true, buy2: data.state.buy2});
        } else if (data.state['buy4'] >=0 ) { // four cards animation
          this.setState({players: data.state.players, current_player: data.state.current_player, deck: data.state.deck, shuffled: true, buy4: data.state.buy4});
        } else if (data.state['color'].length > 0) {
          this.setState({players: data.state.players, current_player: data.state.current_player, deck: data.state.deck, shuffled: true, color: data.state['color']});
        } else {
          this.setState({players: data.state.players, current_player: data.state.current_player, deck: data.state.deck, shuffled: true});
        }
      }
    };
  }

  gameInit() {
    let players = this.state.players;
    for (let x=0;x<this.state.qtt_players;x++) {
      players[x] = { cards: [] };
    }
    this.setState({
      players: players,
      scene: 'gameInit'
    });
  }

  requestFullscreen(e) {
    let docelem = document.documentElement;
    if (docelem.requestFullscreen) {
      docelem.requestFullscreen();
    } else if (docelem.mozRequestFullScreen) {
      docelem.mozRequestFullScreen();
    } else if (docelem.webkitRequestFullscreen) {
      docelem.webkitRequestFullscreen();
    } else if (docelem.msRequestFullscreen) {
      docelem.msRequestFullscreen();
    }
    this.setState({fullscreen: true});
  }

  withdrawCardMe() {
    if (this.state.player_id === this.state.current_player) {
      let {players, current_player, deck, qtt_players, rotation} = this.state;
      players[current_player].cards.push(this.withdrawCard());
      current_player = rotation === 'h' ? ++current_player % qtt_players : (--current_player >= 0) ? current_player : qtt_players - 1;
      this.setState({
        players: players,
        current_player: current_player,
        deck: deck
      });
      this.ws.send(JSON.stringify({
        gameId: 'uno',
        type: 'turn',
        state: this.state,
        color: ''
      }));
    }
  }

  buyCard(initBuy) {
    if (this.state.player_id === this.state.current_player) {
      let {players, current_player, deck, buying, buy4, buy2} = this.state;
      players[current_player].cards.push(this.withdrawCard());
      if (buying === 0) {
        let next_state = this.state;
        next_state.buy4 = -1;
        next_state.buy2 = -1;
        this.setState({
          players: players,
          current_player: current_player,
          deck: deck,
          buying: buying-1,
          buy4: -1,
          buy2: -1
        });
        this.ws.send(JSON.stringify({
          gameId: 'uno',
          type: 'turn',
          state: next_state,
          color: ''
        }));
      } else {
        if (initBuy > 0) {
          buying = initBuy-1;
        }
        this.setState({
          players: players,
          current_player: current_player,
          deck: deck,
          buying: buying-1,
          buy4: buy4,
          buy2: buy2
        });
      }
    }
  }

  checkPlay(cv, i) {
    console.log(cv, this.verifyCard(cv), this.state.player_id, this.state.current_player);
    if (this.state.player_id === this.state.current_player) {
      let {players, current_player, qtt_players} = this.state;
      let result = this.verifyCard(cv);
      console.log(result);
      let cards = players[current_player].cards;
      if (result > 0) {
        let next_state = this.state;
        next_state.players = players;
        next_state.deck.current = cards.splice(i, 1)[0];
        next_state.color = '';
        next_state.buy2 = -1;
        next_state.buy4 = -1;
        if (result === 1) {
          next_state.current_player = current_player;
          this.setState({
            players: next_state.players,
            current_player: next_state.current_player,
            deck: next_state.deck,
            action: 'colorSelect'
          });
        } else if (result === 2) {
          current_player = next_state.rotation === 'h' ? ++current_player % qtt_players : (--current_player>=0) ? current_player : qtt_players-1;
          next_state.current_player = current_player;
          next_state.buy4 = current_player;
          this.setState({
            players: next_state.players,
            current_player: next_state.current_player,
            deck: next_state.deck,
            buy4: current_player
          });
        } else if (result === 4) {
          let next_state = this.state;
          next_state.rotation = this.state.rotation === 'h' ? 'ah' : 'h';
          next_state.current_player = next_state.rotation === 'h' ? ++current_player % qtt_players : (--current_player>=0) ? current_player : qtt_players-1;
          this.setState({
            players: next_state.players,
            current_player: next_state.current_player,
            deck: next_state.deck,
            rotation: next_state.rotation
          });
        } else if (result === 5) {
          let next_state = this.state;
          current_player = next_state.rotation === 'h' ? ++current_player % qtt_players : (--current_player>=0) ? current_player : qtt_players-1;
          next_state.current_player = next_state.rotation === 'h' ? ++current_player % qtt_players : (--current_player>=0) ? current_player : qtt_players-1;
          this.setState({
            players: next_state.players,
            current_player: next_state.current_player,
            deck: next_state.deck
          });
        } else if (result === 6) {
          current_player = next_state.rotation === 'h' ? ++current_player % qtt_players : (--current_player>=0) ? current_player : qtt_players-1;
          next_state.current_player = current_player;
          next_state.buy2 = current_player;
          this.setState({
            players: next_state.players,
            current_player: next_state.current_player,
            deck: next_state.deck,
            buy2: current_player
          });
        } else {
          let next_state = this.state;
          next_state.current_player = next_state.rotation === 'h' ? ++current_player % qtt_players : (--current_player>=0) ? current_player : qtt_players-1;
          this.setState({
            players: next_state.players,
            current_player: next_state.current_player,
            deck: next_state.deck
          });
        }
        console.log('me',next_state)
        this.ws.send(JSON.stringify({gameId: 'uno', type: 'turn', state: next_state, current_player: next_state.current_player}));
      }
    }
  }

  verifyCard(cin) {
    if ("CC" === CardsMap[cin]) {
      return 1;
    }
    if ("AD4" === CardsMap[cin]) {
      return 2;
    }
    // same color
    if ((["RE1", "RE2", "RE3", "RE4", "RE5", "RE6", "RE7", "RE8", "RE9", "REB", "RER", "RET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE1", "RE2", "RE3", "RE4", "RE5", "RE6", "RE7", "RE8", "RE9"].indexOf(CardsMap[cin]) > -1)
      ||(["BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7", "BL8", "BL9", "BLB", "BLR", "BLT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7", "BL8", "BL9"].indexOf(CardsMap[cin]) > -1)
      ||(["YE1", "YE2", "YE3", "YE4", "YE5", "YE6", "YE7", "YE8", "YE9", "YEB", "YER", "YET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["YE1", "YE2", "YE3", "YE4", "YE5", "YE6", "YE7", "YE8", "YE9"].indexOf(CardsMap[cin]) > -1)
      ||(["GR1", "GR2", "GR3", "GR4", "GR5", "GR6", "GR7", "GR8", "GR9", "GRB", "GRR", "GRT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["GR1", "GR2", "GR3", "GR4", "GR5", "GR6", "GR7", "GR8", "GR9"].indexOf(CardsMap[cin]) > -1)
    ) {
      return 3;
    }
    if ((["RE1", "BL1", "YE1", "GR1"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE1", "BL1", "YE1", "GR1"].indexOf(CardsMap[cin]) > -1)
      ||(["RE2", "BL2", "YE2", "GR2"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE2", "BL2", "YE2", "GR2"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE3", "BL3", "YE3", "GR3"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE3", "BL3", "YE3", "GR3"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE4", "BL4", "YE4", "GR4"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE4", "BL4", "YE4", "GR4"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE5", "BL5", "YE5", "GR5"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE5", "BL5", "YE5", "GR5"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE6", "BL6", "YE6", "GR6"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE6", "BL6", "YE6", "GR6"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE7", "BL7", "YE7", "GR7"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE7", "BL7", "YE7", "GR7"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE8", "BL8", "YE8", "GR8"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE8", "BL8", "YE8", "GR8"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE9", "BL9", "YE9", "GR9"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RE9", "BL9", "YE9", "GR9"].indexOf(CardsMap[cin]) > -1)) {
      return 3;
    }
    if ((["REB", "BLB", "YEB", "GRB"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["REB", "BLB", "YEB", "GRB"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE1", "RE2", "RE3", "RE4", "RE5", "RE6", "RE7", "RE8", "RE9", "REB", "RER", "RET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "REB")
    || (["BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7", "BL8", "BL9", "BLB", "BLR", "BLT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "BLB")
    || (["YE1", "YE2", "YE3", "YE4", "YE5", "YE6", "YE7", "YE8", "YE9", "YEB", "YER", "YET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "YEB")
    || (["GR1", "GR2", "GR3", "GR4", "GR5", "GR6", "GR7", "GR8", "GR9", "GRB", "GRR", "GRT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "GRB")) {
      return 4;
    }
    if ((["RER", "BLR", "YER", "GRR"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RER", "BLR", "YER", "GRR"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE1", "RE2", "RE3", "RE4", "RE5", "RE6", "RE7", "RE8", "RE9", "REB", "RER", "RET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "RER")
    || (["BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7", "BL8", "BL9", "BLB", "BLR", "BLT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "BLR")
    || (["YE1", "YE2", "YE3", "YE4", "YE5", "YE6", "YE7", "YE8", "YE9", "YEB", "YER", "YET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "YER")
    || (["GR1", "GR2", "GR3", "GR4", "GR5", "GR6", "GR7", "GR8", "GR9", "GRB", "GRR", "GRT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "GRR")) {
      return 5;
    }
    if ((["RET", "BLT", "YET", "GRT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && ["RET", "BLT", "YET", "GRT"].indexOf(CardsMap[cin]) > -1)
    ||  (["RE1", "RE2", "RE3", "RE4", "RE5", "RE6", "RE7", "RE8", "RE9", "REB", "RER", "RET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "RET")
    || (["BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7", "BL8", "BL9", "BLB", "BLR", "BLT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "BLT")
    || (["YE1", "YE2", "YE3", "YE4", "YE5", "YE6", "YE7", "YE8", "YE9", "YEB", "YER", "YET"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "YET")
    || (["GR1", "GR2", "GR3", "GR4", "GR5", "GR6", "GR7", "GR8", "GR9", "GRB", "GRR", "GRT"].indexOf(CardsMap[this.state.deck.current]) > -1
      && CardsMap[cin] === "GRT")) {
      return 6;
    }
    if ((this.state.color === 'red' && ["RE1", "RE2", "RE3", "RE4", "RE5", "RE6", "RE7", "RE8", "RE9", "REB", "RER", "RET", "CC", "AD4"].indexOf(CardsMap[cin]) > -1)
    || (this.state.color === 'DodgerBlue' && ["BL1", "BL2", "BL3", "BL4", "BL5", "BL6", "BL7", "BL8", "BL9", "BLB", "BLR", "BLT", "CC", "AD4"].indexOf(CardsMap[cin]) > -1)
    || (this.state.color === 'yellow' && ["YE1", "YE2", "YE3", "YE4", "YE5", "YE6", "YE7", "YE8", "YE9", "YEB", "YER", "YET", "CC", "AD4"].indexOf(CardsMap[cin]) > -1)
    || (this.state.color === 'green' && ["GR1", "GR2", "GR3", "GR4", "GR5", "GR6", "GR7", "GR8", "GR9", "GRB", "GRR", "GRT", "CC", "AD4"].indexOf(CardsMap[cin]) > -1)
    ) {
      return 7;
    }
    if ("AD4" === CardsMap[this.state.deck.current]) {
      return 8;
    }
    return 0;
  }

  setQttPlayer(qtt) {
    this.ws.send(JSON.stringify({gameId: 'uno', type: 'initGame', qttPlayers: qtt}));
  }

  setReady() {
    this.ws.send(JSON.stringify({gameId: 'uno', type: 'initGame'}));
  }

  setColor(v) {
    let colors = ['red','DodgerBlue','yellow','green'];
    let next_state = this.state;
    next_state.color = colors[v];
    next_state.action = '';
    let {current_player, qtt_players} = this.state;
    next_state.current_player = next_state.rotation === 'h' ? ++current_player % qtt_players : (--current_player>=0) ? current_player : qtt_players-1;
    this.ws.send(JSON.stringify({gameId: 'uno', type: 'turn', state: this.state}));
    this.setState({
      ...next_state
    });
  }

  render() {
    console.log(this.state);
    let sceneTempl = [], deckTempl = [], playerCardsTempl = [];
    switch (this.state.scene) {
      case "qttPlayerSelect":
        sceneTempl.push(
          <Group key={-9}>
            <Rect
              x={40}
              y={20}
              width={30}
              height={30}
              fill={'black'}
              cornerRadius={4}
              onClick={(e) => this.setQttPlayer(1)}
              onTap={(e) => this.setQttPlayer(1)}
            />
            <Rect
              x={70}
              y={20}
              width={30}
              height={30}
              fill={'red'}
              cornerRadius={4}
              onClick={(e) => this.setQttPlayer(2)}
              onTap={(e) => this.setQttPlayer(2)}
            />
            <Rect
              x={110}
              y={20}
              width={30}
              height={30}
              fill={'blue'}
              cornerRadius={4}
              onClick={(e) => this.setQttPlayer(3)}
              onTap={(e) => this.setQttPlayer(3)}
            />
            <Rect
              x={150}
              y={20}
              width={30}
              height={30}
              fill={'blue'}
              cornerRadius={4}
              onClick={(e) => this.setQttPlayer(4)}
              onTap={(e) => this.setQttPlayer(4)}
            />
          </Group>
        );
      break;
      case 'waitQttPlayer':
        sceneTempl.push(
          <Text key={-99}
            x={17}
            y={35}
            fontSize={14}
            fontFamily={'Arial Black'}
            fill={'black'}
            text={' Desculpe, primeiro quem iniciou deve decidir \na quantidade de jogadores'}
          />
        );
      break;
      case 'reqPlayerReady':
        sceneTempl.push(
          <Group>
            <Text key={-99}
              x={17}
              y={35}
              fontSize={14}
              fontFamily={'Arial Black'}
              fill={'black'}
              text={' Pronto para jogar? Aperte o botao abaixo quando estiver pronto para jogar'}
            />
            <Rect
              x={150}
              y={40}
              width={30}
              height={30}
              fill={'navy'}
              cornerRadius={4}
              onClick={(e) => this.setReady()}
              onTap={(e) => this.setReady()}
            />
          </Group>
        );
      break;
      case 'waitPlayerJoin':
        sceneTempl.push(
          <Text key={-99}
                x={17}
                y={35}
                fontSize={14}
                fontFamily={'Arial Black'}
                fill={'black'}
                text={' Preparado\n aguardando outros jogadores se conectarem...'}
          />
        );
      break;
      case 'gameInit':
        // Sorteio de cartas
        if (this.state.shuffled) {
          deckTempl.push(
            <Group key={-1}>
              <Card cv={0} x={200} y={116} onClick={(e) => this.withdrawCardMe()} onTap={(e) => this.withdrawCardMe()}/>
              <Card cv={this.state.deck.current} x={260} y={116} color={this.state.color}/>
            </Group>
          );
          this.state.players.forEach((player, p) => {
            if (p === this.state.player_id) {
              let cards = [];
              player.cards.forEach((cv, i) => {
                cards.push(<Card key={i} cv={cv}
                                 x={90 + (30 * i)} y={220}
                                 onClick={(e) => this.checkPlay(cv, i)}
                                 onTap={(e) => this.checkPlay(cv, i)}/>);
              });
              playerCardsTempl.push(
                <Group key={p}>
                  {cards}
                </Group>);
            } else if (p === 1 || (p === 0 && this.state.player_id === 1)) {
              let cards = [];
              player.cards.forEach((cv, i) => {
                cards.push(<Card key={i} cv={0}
                                 x={90 + (30 * i)}
                                 y={10}/>);
              });
              playerCardsTempl.push(
                <Group key={p}>
                  {cards}
                </Group>);
            } else if (p === 2 || (p === 0 && this.state.player_id === 2)) {
              let cards = [];
              player.cards.forEach((cv, i) => {
                cards.push(<Card key={i} cv={0} x={10}
                                 y={10 + (20 * i)}/>);
              });
              playerCardsTempl.push(
                <Group key={p}>
                  {cards}
                </Group>);
            } else if (p === 3 || (p === 0 && this.state.player_id === 3)) {
              let cards = [];
              player.cards.forEach((cv, i) => {
                cards.push(<Card key={i} cv={0} x={450}
                                 y={10 + (20 * i)}/>);
              });
              playerCardsTempl.push(
                <Group key={p}>
                  {cards}
                </Group>);
            }
          });

          if (this.state.action === 'colorSelect') {
            sceneTempl.push(
              <Group key={-9}>
                <Rect
                  x={115}
                  y={10}
                  width={300}
                  height={280}
                  fill={'black'}
                />
                <Text key={-99}
                      x={195}
                      y={50}
                      fontSize={14}
                      fontFamily={'Arial Black'}
                      fill={'white'}
                      text={'Escolha uma cor'}
                />
                <Rect
                  x={200}
                  y={100}
                  width={60}
                  height={60}
                  fill={'red'}
                  cornerRadius={4}
                  onClick={(e) => this.setColor(0)}
                  onTap={(e) => this.setColor(0)}
                />
                <Rect
                  x={270}
                  y={100}
                  width={60}
                  height={60}
                  fill={'DodgerBlue'}
                  cornerRadius={4}
                  onClick={(e) => this.setColor(1)}
                  onTap={(e) => this.setColor(1)}
                />
                <Rect
                  x={200}
                  y={170}
                  width={60}
                  height={60}
                  fill={'yellow'}
                  cornerRadius={4}
                  onClick={(e) => this.setColor(2)}
                  onTap={(e) => this.setColor(2)}
                />
                <Rect
                  x={270}
                  y={170}
                  width={60}
                  height={60}
                  fill={'green'}
                  cornerRadius={4}
                  onClick={(e) => this.setColor(3)}
                  onTap={(e) => this.setColor(3)}
                />
              </Group>
            );
          }

          if (this.state.buy4 === this.state.player_id) {
            this.buyCard(this.state.buying === -1 ? 4 : 0);
          }
          if (this.state.buy2 === this.state.player_id) {
            this.buyCard(this.state.buying === -1 ? 2 : 0);
          }

        } else if (this.state.player_id === 0) {
          this.shuffle();
        }
        break;
    }

    //if (!this.state.fullscreen) {
    //  return (<button onClick={this.requestFullscreen}>Entrar em tela cheia.</button>);
    //}

    console.log(window.innerHeight, window.innerWidth);

    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          { deckTempl }
          { playerCardsTempl }
          { sceneTempl }
          <Rect
            x={9 + this.props.x}
            y={9 + this.props.y}
            width={30}
            height={30}
            fill={'black'}
            cornerRadius={4}
            onClick={this.shuffle}
            onTap={this.shuffle}
          />


        </Layer>
      </Stage>
    );
  }
}

class App extends Component {
  render() {
    return (
      <Router>
        <div>
          <Route exact path="/" component={Home}/>
          <Route path="/uno" component={Uno}/>
        </div>
      </Router>
    );
  }
}

render(<App />, document.getElementById('root'));
//registerServiceWorker();
