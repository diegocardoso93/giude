import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
//import registerServiceWorker from './registerServiceWorker';

import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Image } from 'react-konva';
import Card from './Card';
import { RedPoint } from './UnoImages';

const Deck = Array.from(new Array(56), (x, i) => i);

class App extends Component {
  state = {
    image: null
  };
  componentDidMount() {
    const image = new window.Image();
    image.src = RedPoint;
    image.onload = () => {
      this.setState({
        image: image
      });
    };
  }
  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          <Card cv={2} x={20} y={10} />
          <Card cv={41} x={40} y={10} />
          <Card cv={48} x={20} y={10} />
          <Card cv={52} x={20} y={10} />
          <Image image={this.state.image} />
        </Layer>
      </Stage>
    );
  }
}

render(<App />, document.getElementById('root'));
//registerServiceWorker();
