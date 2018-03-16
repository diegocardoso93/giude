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
    qtt_players_wait: 0,
    player_id: -1
  };
  ws;
  constructor(props) {
    super(props);
    this.shuffle = this.shuffle.bind(this);
    this.requestFullscreen = this.requestFullscreen.bind(this);
    this.checkPlay = this.checkPlay.bind(this);
    this.setQttPlayer = this.setQttPlayer.bind(this);
    this.setReady = this.setReady.bind(this);
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
        this.setState({players: data.state.players, current_player: data.state.current_player, deck: data.state.deck, shuffled: true});
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

  checkPlay(cv, i) {
    console.log(cv, this.verifyCard(cv), this.state.player_id, this.state.current_player);
    if (this.state.player_id === this.state.current_player) {
      let {players, current_player, qtt_players} = this.state;
      let result = this.verifyCard(cv);
      let cards = players[current_player].cards;
      if (result > 0) {
        let next_state = this.state;
        next_state.current_player = ++current_player % qtt_players;
        next_state.players = players;
        next_state.deck.current = cards.splice(i, 1)[0];
        this.ws.send(JSON.stringify({gameId: 'uno', type: 'turn', state: next_state }));
        this.setState({
          players: next_state.players,
          current_player: next_state.current_player,
          deck: next_state.deck
        });
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

    return 0;
  }

  setQttPlayer(qtt) {
    this.ws.send(JSON.stringify({gameId: 'uno', type: 'initGame', qttPlayers: qtt}));
  }

  setReady() {
    this.ws.send(JSON.stringify({gameId: 'uno', type: 'initGame'}));
  }

  setColor(v) {

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
              <Card cv={0} x={200} y={116}/>
              <Card cv={this.state.deck.current} x={260} y={116}/>
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
        } else if (this.state.player_id === 0) {
          this.shuffle();
        }
        break;
      case 'colorSelect':
        sceneTempl.push(
          <Group key={-9}>
            <Rect
              x={40}
              y={20}
              width={30}
              height={30}
              fill={'red'}
              cornerRadius={4}
              onClick={(e) => this.setColor(0)}
              onTap={(e) => this.setColor(0)}
            />
            <Rect
              x={70}
              y={20}
              width={30}
              height={30}
              fill={'DodgerBlue'}
              cornerRadius={4}
              onClick={(e) => this.setColor(1)}
              onTap={(e) => this.setColor(1)}
            />
            <Rect
              x={110}
              y={20}
              width={30}
              height={30}
              fill={'yellow'}
              cornerRadius={4}
              onClick={(e) => this.setColor(2)}
              onTap={(e) => this.setColor(2)}
            />
            <Rect
              x={150}
              y={20}
              width={30}
              height={30}
              fill={'green'}
              cornerRadius={4}
              onClick={(e) => this.setColor(3)}
              onTap={(e) => this.setColor(3)}
            />
          </Group>
        );
      break;
    }

    //if (!this.state.fullscreen) {
    //  return (<button onClick={this.requestFullscreen}>Entrar em tela cheia.</button>);
    //}
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
