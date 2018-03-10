import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
//import registerServiceWorker from './registerServiceWorker';

import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Image, Rect, Group } from 'react-konva';
import Card from './Card';
import { RedPoint } from './UnoImages';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom'

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

class Uno extends Component {
  state = {
    qtd_players: 4,
    players: [],
    shuffled: false,
    fullscreen: false
  };
  Deck = { cards: Array.from(new Array(55), (x, i) => i+1), current: 0};
  constructor(props) {
    super(props);
    this.shuffle = this.shuffle.bind(this);
    this.requestFullscreen = this.requestFullscreen.bind(this);
    this.checkPlay = this.checkPlay.bind(this);
  }
  shuffle() {
    if (this.Deck.cards.length > 0) {
      let players = this.state.players;
      players.forEach((p, i) => {
        for (let i = 0; i < 7; i++) {
          p.cards.push(this.withdrawCard());
        }
      });
      this.Deck.current = this.withdrawCard();
      this.setState({players: players, shuffled: true});
    }
  }
  withdrawCard() {
    return this.Deck.cards.splice(parseInt(Math.random() * this.Deck.cards.length), 1)[0];
  }
  componentDidMount() {
    let players = this.state.players;
    for (let x=0;x<this.state.qtd_players;x++) {
      players[x] = { cards: [] };
    }
    this.setState({
      players: players
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

  checkPlay(cv) {
    console.log(cv);
  }

  verifyCard() {

  }

  render() {
    console.log(this.state.players);
    // Sorteio de cartas
    let playerCardsTempl = [], deckTempl = [];
    if (this.state.shuffled > 0) {
      this.state.players.forEach((player, p) => {
        if (p === 0) {
          let cards = [];
          player.cards.forEach((cv, i) => {
            cards.push(<Card key={i} cv={cv} x={90+(30*i)} y={220} onClick={(e) => this.checkPlay(cv)}/>);
          });
          playerCardsTempl.push(
            <Group key={p}>
              { cards }
            </Group>);
        } else if (p === 1) {
          let cards = [];
          player.cards.forEach((cv, i) => {
            cards.push(<Card key={i} cv={0} x={90+(30*i)} y={10}/>);
          });
          playerCardsTempl.push(
            <Group key={p}>
              { cards }
            </Group>);
        } else if (p === 2) {
          let cards = [];
          player.cards.forEach((cv, i) => {
            cards.push(<Card key={i} cv={0} x={10} y={10+(20*i)}/>);
          });
          playerCardsTempl.push(
            <Group key={p}>
              { cards }
            </Group>);
        } else if (p === 3) {
          let cards = [];
          player.cards.forEach((cv, i) => {
            cards.push(<Card key={i} cv={0} x={450} y={10+(20*i)}/>);
          });
          playerCardsTempl.push(
            <Group key={p}>
              { cards }
            </Group>);
        }
      });

      deckTempl.push(
        <Group key={-1}>
          <Card cv={0} x={200} y={116}/>
          <Card cv={this.Deck.current} x={260} y={116}/>
        </Group>
      )
    }

    //if (!this.state.fullscreen) {
    //  return (<button onClick={this.requestFullscreen}>Entrar em tela cheia.</button>);
    //}
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          { deckTempl }
          { playerCardsTempl }
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
