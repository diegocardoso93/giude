import ReactDOM from 'react-dom';
import './index.css';
//import App from './App';
//import registerServiceWorker from './registerServiceWorker';

import React, { Component } from 'react';
import { render } from 'react-dom';
import { Stage, Layer, Image } from 'react-konva';
import Card from './Card';
import { RedPoint } from './UnoImages';

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
          <Card symbol="2" color="red" x={20} y={10} />
          <Card symbol="4" color="#aa0000" x={20} y={10} />
          <Card symbol="9" color="red" x={100} y={100} />
          <Image image={this.state.image} />
        </Layer>
      </Stage>
    );
  }
}

render(<App />, document.getElementById('root'));
//registerServiceWorker();
