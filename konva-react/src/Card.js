import React, { Component } from 'react';
import { Stage, Shape, Layer, Rect, RegularPolygon, Text, Group } from 'react-konva';
import Konva from 'konva';

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }
  state = {
    color: 'red'
  };
  handleClick() {
    this.setState({
      color: Konva.Util.getRandomColor()
    });
  };
  componentDidMount() {
    console.log(this.props)
  }
  render() {
    return (
      <Group
        draggable={true}
        onTouchStart={this.handleClick}>
        <Rect
          x={5 + this.props.x}
          y={5 + this.props.y}
          width={56}
          height={85}
          fill={'white'}
          shadowBlur={5}
          cornerRadius={6}
        />
        <Rect
          x={9 + this.props.x}
          y={9 + this.props.y}
          width={48}
          height={77}
          fill={this.props.color}
          cornerRadius={4}
        />
        <RegularPolygon
          sides={6}
          x={33 + this.props.x}
          y={45 + this.props.y}
          width={45}
          height={60}
          fill={'white'}
        />
        <Text
          x={21.5 + this.props.x}
          y={26.5 + this.props.y}
          fontSize={36}
          fontFamily={'Arial Black'}
          fill={'black'}
          text={this.props.symbol}
        />
        <Text
          x={20 + this.props.x}
          y={25 + this.props.y}
          fontSize={36}
          fontFamily={'Arial Black'}
          fill={this.props.color}
          text={this.props.symbol}
        />

        <Text
          x={11 + this.props.x}
          y={11 + this.props.y}
          fontSize={14}
          fontFamily={'Arial'}
          fill={'black'}
          text={this.props.symbol}
        />
        <Text
          x={10 + this.props.x}
          y={10 + this.props.y}
          fontSize={14}
          fontFamily={'Arial'}
          fill={'white'}
          text={this.props.symbol}
        />
        <Text
          x={49 + this.props.x}
          y={70 + this.props.y}
          fontSize={14}
          fontFamily={'Arial'}
          fill={'black'}
          text={this.props.symbol}
        />
        <Text
          x={48 + this.props.x}
          y={69 + this.props.y}
          fontSize={14}
          fontFamily={'Arial'}
          fill={'white'}
          text={this.props.symbol}
        />
    </Group>
    );
  }
}

export default Card;
