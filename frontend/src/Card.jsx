import React, { Component } from 'react';
import { Stage, Shape, Layer, Rect, RegularPolygon, Text, Group } from 'react-konva';
import Konva from 'konva';

import { CardsMap, CardsVal, CardsColor } from './CardsMap';

class Card extends React.Component {
  constructor(props) {
    super(props);
    this.handleTap = this.handleTap.bind(this);
  }
  handleTap() {
  };
  componentDidMount() {
    console.log(this.props)
  }

  numeralLayout() {
    return (
      <Group>
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
          fill={CardsColor[CardsMap[this.props.cv]]}
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
          x={20 + this.props.x}
          y={25 + this.props.y}
          fontSize={36}
          fontFamily={'Arial Black'}
          fill={CardsColor[CardsMap[this.props.cv]]}
          text={CardsVal[CardsMap[this.props.cv]]}
          shadowColor='black'
          shadowBlur={1}
          shadowOffset={{x: 1, y: 1}}
          shadowOpacity={1}
        />

        <Text
          x={10 + this.props.x}
          y={10 + this.props.y}
          fontSize={14}
          fontFamily={'Arial'}
          fill={'white'}
          text={CardsVal[CardsMap[this.props.cv]]}
          shadowColor='black'
          shadowBlur={1}
          shadowOffset={{x: 1, y: 1}}
          shadowOpacity={1}
        />
        <Text
          x={48 + this.props.x}
          y={69 + this.props.y}
          fontSize={14}
          fontFamily={'Arial'}
          fill={'white'}
          text={CardsVal[CardsMap[this.props.cv]]}
          shadowColor='black'
          shadowBlur={1}
          shadowOffset={{x: 1, y: 1}}
          shadowOpacity={1}
        />
      </Group>
    );
  }

  nonNumeralLayout() {
    return <Group></Group>;
  }

  add4Layout() {
    return (
      <Group>
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
          fill={'black'}
          cornerRadius={4}
        />
        <Rect
          x={16 + this.props.x}
          y={36 + this.props.y}
          width={12}
          height={20}
          fill='red'
          shadowColor='white'
          shadowBlur={1}
          shadowOffset={{x: 2, y: 2}}
          shadowOpacity={1}
        />
        <Rect
          x={26 + this.props.x}
          y={28 + this.props.y}
          width={12}
          height={20}
          fill='blue'
          shadowColor='white'
          shadowBlur={1}
          shadowOffset={{x: 2, y: 2}}
          shadowOpacity={1}
        />
        <Rect
          x={26 + this.props.x}
          y={44 + this.props.y}
          width={12}
          height={20}
          fill='yellow'
          shadowColor='white'
          shadowBlur={1}
          shadowOffset={{x: 2, y: 2}}
          shadowOpacity={1}
        />
        <Rect
          x={36 + this.props.x}
          y={36 + this.props.y}
          width={12}
          height={20}
          fill='green'
          shadowColor='white'
          shadowBlur={1}
          shadowOffset={{x: 2, y: 2}}
          shadowOpacity={1}
        />
        <Text
          x={10 + this.props.x}
          y={10 + this.props.y}
          fontSize={12}
          fontFamily={'Arial'}
          fill={'white'}
          text={'+4'}
        />
      </Group>
    );
  }

  changeColorLayout() {
    return (
      <Group>
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
          fill={'black'}
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

        <Shape
          sides={4}
          x={33 + this.props.x}
          y={45 + this.props.y}
          width={45}
          height={60}
          sceneFunc={function (ctx) {
            let colors = ['red','green','yellow','blue'];
            let shapes = [
              [[0, -20],[0, 0],[-17, 0],[-17, -11]],
              [[0, 20],[0, 0],[17, 0],[17, 11]],
              [[0, 20],[0, 0],[-17, 0],[-17, 11]],
              [[0, -20],[0, 0],[17, 0],[17, -11]],
            ];
            shapes.forEach((shape, sk) => {
              let first = true;
              ctx.beginPath();
              shape.forEach((point, i) => {
                if (first) {
                  ctx.moveTo(parseInt(point[0], 10), parseInt(point[1], 10));
                  first = false;
                }else {
                  ctx.lineTo(parseInt(point[0], 10), parseInt(point[1], 10));
                }
              });
              ctx.closePath();
              this.fill(colors[sk]);
              ctx.fillStrokeShape(this);
            });
          }}
        />

        <Shape
          sides={4}
          x={16 + this.props.x}
          y={17 + this.props.y}
          width={10}
          height={15}
          sceneFunc={function (ctx) {
            let colors = ['red','green','yellow','blue'];
            let shapes = [
              [[0, -6],[0, 0],[-4, 0],[-4, -2]],
              [[0, 6],[0, 0],[4, 0],[4, 2]],
              [[0, 6],[0, 0],[-4, 0],[-4, 2]],
              [[0, -6],[0, 0],[4, 0],[4, -2]],
            ];
            shapes.forEach((shape, sk) => {
              let first = true;
              ctx.beginPath();
              shape.forEach((point, i) => {
                if (first) {
                  ctx.moveTo(parseInt(point[0], 10), parseInt(point[1], 10));
                  first = false;
                }else {
                  ctx.lineTo(parseInt(point[0], 10), parseInt(point[1], 10));
                }
              });
              ctx.closePath();
              this.fill(colors[sk]);
              ctx.fillStrokeShape(this);
            });
          }}
        />
        <Shape
          sides={4}
          x={50 + this.props.x}
          y={78 + this.props.y}
          width={10}
          height={15}
          sceneFunc={function (ctx) {
            let colors = ['red','green','yellow','blue'];
            let shapes = [
              [[0, -6],[0, 0],[-4, 0],[-4, -2]],
              [[0, 6],[0, 0],[4, 0],[4, 2]],
              [[0, 6],[0, 0],[-4, 0],[-4, 2]],
              [[0, -6],[0, 0],[4, 0],[4, -2]],
            ];
            shapes.forEach((shape, sk) => {
              let first = true;
              ctx.beginPath();
              shape.forEach((point, i) => {
                if (first) {
                  ctx.moveTo(parseInt(point[0], 10), parseInt(point[1], 10));
                  first = false;
                }else {
                  ctx.lineTo(parseInt(point[0], 10), parseInt(point[1], 10));
                }
              });
              ctx.closePath();
              this.fill(colors[sk]);
              ctx.fillStrokeShape(this);
            });
          }}
        />
      </Group>
    );
  }

  render() {
    let cardLayout;
    if (CardsMap[this.props.cv] === "CC") {
      cardLayout = this.changeColorLayout();
    } else if (CardsMap[this.props.cv] === "AD4") {
      cardLayout = this.add4Layout();
    } else if ([
        "REB", "RER", "RET",
        "BLB", "BLR", "BLT",
        "YEB", "YER", "YET",
        "PIB", "PIR", "PIT"
      ].indexOf(CardsMap[this.props.cv]) > -1) {
      cardLayout = this.nonNumeralLayout();
    } else {
      cardLayout = this.numeralLayout();
    }

    return (
      <Group
        draggable={true}
        onTap={this.handleTap}>
        { cardLayout }
      </Group>
    );
  }
}

export default Card;
