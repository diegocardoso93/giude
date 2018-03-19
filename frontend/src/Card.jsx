import React, { Component } from 'react';
import { Stage, Shape, Layer, Rect, RegularPolygon, Text, Group, Ring } from 'react-konva';
import Konva from 'konva';

import { CardsMap, CardsVal, CardsColor } from './CardsMap';

class Card extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    console.log(this.props)
  }

  giudeLayout() {
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

        <Shape
          sides={4}
          x={33 + this.props.x}
          y={45 + this.props.y}
          width={45}
          height={60}
          sceneFunc={function (ctx) {
            let colors = ['red','green','yellow','DodgerBlue'];
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

        <Text
          x={17 + this.props.x}
          y={35 + this.props.y}
          fontSize={8}
          fontFamily={'Arial Black'}
          fill={'black'}
          text={'  giude\n4 cores'}
        />
      </Group>
    );
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
    if (["RET", "BLT", "YET", "GRT"].indexOf(CardsMap[this.props.cv]) > -1) {
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

          <Rect
            x={20 + this.props.x}
            y={36 + this.props.y}
            width={16}
            height={24}
            fill='white'
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 0, y: 0}}
            shadowOpacity={1}
            cornerRadius={2}
          />
          <Rect
            x={22 + this.props.x}
            y={38 + this.props.y}
            width={12}
            height={20}
            fill={CardsColor[CardsMap[this.props.cv]]}
            cornerRadius={2}
          />
          <Rect
            x={30 + this.props.x}
            y={30 + this.props.y}
            width={16}
            height={24}
            fill={'white'}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 0, y: 0}}
            shadowOpacity={1}
            cornerRadius={2}
          />
          <Rect
            x={32 + this.props.x}
            y={32 + this.props.y}
            width={12}
            height={20}
            fill={CardsColor[CardsMap[this.props.cv]]}
            cornerRadius={2}
          />
          <Text
            x={10 + this.props.x}
            y={10 + this.props.y}
            fontSize={12}
            fontFamily={'Arial'}
            fill={'white'}
            text={'+2'}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 1, y: 1}}
            shadowOpacity={1}
          />
        </Group>
      );
    } else if (["RER", "BLR", "YER", "GRR"].indexOf(CardsMap[this.props.cv]) > -1){
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

          <Ring
            x={16 + this.props.x}
            y={16 + this.props.y}
            width={4}
            height={4}
            fill={'white'}
            innerRadius={5}
            outerRadius={3}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 0, y: 0}}
            shadowOpacity={1}
          />
          <Rect
            x={18 + this.props.x}
            y={11 + this.props.y}
            width={3}
            height={10}
            fill={'white'}
            rotation={45}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 0, y: 0}}
            shadowOpacity={1}
          />
          <Ring
            x={51 + this.props.x}
            y={79 + this.props.y}
            width={4}
            height={4}
            fill={'white'}
            innerRadius={5}
            outerRadius={3}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 0, y: 0}}
            shadowOpacity={1}
          />
          <Rect
            x={53 + this.props.x}
            y={74 + this.props.y}
            width={3}
            height={10}
            fill={'white'}
            rotation={45}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 0, y: 0}}
            shadowOpacity={1}
          />
          <Rect
            x={41 + this.props.x}
            y={32 + this.props.y}
            width={6}
            height={26}
            fill={CardsColor[CardsMap[this.props.cv]]}
            rotation={45}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 1, y: 1}}
            shadowOpacity={1}
          />
          <Ring
            x={33 + this.props.x}
            y={44 + this.props.y}
            width={20}
            height={20}
            fill={CardsColor[CardsMap[this.props.cv]]}
            innerRadius={16}
            outerRadius={13}
            shadowColor='black'
            shadowBlur={1}
            shadowOffset={{x: 1, y: 1}}
            shadowOpacity={1}
            cornerRadius={2}
          />
        </Group>
      );
    } else if (["REB", "BLB", "YEB", "GRB"].indexOf(CardsMap[this.props.cv]) > -1) {
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

          <Shape
            sides={6}
            x={30 + this.props.x}
            y={45 + this.props.y}
            width={10}
            height={15}
            sceneFunc={function (ctx) {
              let colors = ['red','red'];
              let shapes = [
                [[8 , -12],[8, -4],[5, -6],[-8, 5],[3, -8],[0, -11]],
                [[8 , -12],[8, -4],[5, -6],[-8, 5],[3, -8],[0, -11]],
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
          x={14 + this.props.x}
          y={34 + this.props.y}
          width={16}
          height={24}
          fill='white'
          shadowColor='black'
          shadowBlur={1}
          shadowOffset={{x: 1, y: 1}}
          shadowOpacity={1}
          cornerRadius={2}
        />
        <Rect
          x={16 + this.props.x}
          y={36 + this.props.y}
          width={12}
          height={20}
          fill='red'
          cornerRadius={2}
        />
        <Rect
          x={24 + this.props.x}
          y={26 + this.props.y}
          width={16}
          height={24}
          fill='white'
          shadowColor='black'
          shadowBlur={1}
          shadowOffset={{x: 0, y: 0}}
          shadowOpacity={1}
          cornerRadius={2}
        />
        <Rect
          x={26 + this.props.x}
          y={28 + this.props.y}
          width={12}
          height={20}
          fill='DodgerBlue'
          shadowColor='white'
          cornerRadius={2}
        />
        <Rect
          x={24 + this.props.x}
          y={42 + this.props.y}
          width={16}
          height={24}
          fill='white'
          shadowColor='black'
          shadowBlur={1}
          shadowOffset={{x: 0, y: 0}}
          shadowOpacity={1}
          cornerRadius={2}
        />
        <Rect
          x={26 + this.props.x}
          y={44 + this.props.y}
          width={12}
          height={20}
          fill='yellow'
          cornerRadius={2}
        />
        <Rect
          x={34 + this.props.x}
          y={34 + this.props.y}
          width={16}
          height={24}
          fill='white'
          shadowColor='black'
          shadowBlur={1}
          shadowOffset={{x: 0, y: 0}}
          shadowOpacity={1}
          cornerRadius={2}
        />
        <Rect
          x={36 + this.props.x}
          y={36 + this.props.y}
          width={12}
          height={20}
          fill='green'
          shadowColor='white'
          cornerRadius={2}
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
    let selectedColorTmpl =
        <Rect
          x={14 + this.props.x}
          y={24 + this.props.y}
          width={40}
          height={42}
          fill={this.props['color']}
          shadowBlur={5}
          cornerRadius={6}
        />;

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
            let colors = ['red','green','yellow','DodgerBlue'];
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
            let colors = ['red','green','yellow','DodgerBlue'];
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
            let colors = ['red','green','yellow','DodgerBlue'];
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
        { selectedColorTmpl }
      </Group>
    );
  }

  render() {
    let cardLayout;
    if (CardsMap[this.props.cv] === "GID") {
      cardLayout = this.giudeLayout();
    } else if (CardsMap[this.props.cv] === "CC") {
      cardLayout = this.changeColorLayout();
    } else if (CardsMap[this.props.cv] === "AD4") {
      cardLayout = this.add4Layout();
    } else if ([
        "REB", "RER", "RET",
        "BLB", "BLR", "BLT",
        "YEB", "YER", "YET",
        "GRB", "GRR", "GRT"
      ].indexOf(CardsMap[this.props.cv]) > -1) {
      cardLayout = this.nonNumeralLayout();
    } else {
      cardLayout = this.numeralLayout();
    }

    return (
      <Group
        draggable={this.props.draggable}
        onTap={this.props.onTap}
        onClick={this.props.onClick}>
        { cardLayout }
      </Group>
    );
  }
}

export default Card;
