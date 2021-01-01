import React, { useState } from "react";
import axios from "axios";
import Menu from "./Icons/menu.png";
import Close from "./Icons/close.png";
import Delete from "./Icons/delete.png";

const Speech = (props) => {
  const [played, setPlayed] = useState(true);
  let baseClass = [
    "w-full h-16 text-white justify-between rounded-lg mt-6 tex-center pt-5 pl-6 pr-6 hoverbtn flex",
  ];
  baseClass.push(played ? "bg-teal-700" : "bg-indigo-700");
  return (
    <div className={baseClass.join(" ")}>
      <p
        className="w-full h-full"
        onClick={() => {
          var snd = new Audio(props.audio);
          snd.onended = () => {
            setPlayed(true);
          };
          setPlayed(false);
          snd.play();
        }}
      >
        {props.text}
      </p>
      <img
        src={Delete}
        className="object-right h-6"
        alt={"Delete"}
        onClick={() => props.delete()}
      />
    </div>
  );
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      menu: false,
    };

    this.text = [];
    this.numChar = -1;
    this.draw = false;
    this.spoken = false;
    this.initAngle = [0, 0];

    this.letterWidth = 400;
    this.letterHeight = 750;
    this.letterSize = 0.6;
    this.lineWidth = 50;
    this.border = 250;

    this.speech = [["hi"]];

    /* eslint-disable no-undef */
    this.sensor = new AbsoluteOrientationSensor({
      frequency: 60,
    });

    this.sensor.addEventListener("reading", (e) => this.readSensor(e));

    /* eslint-enable no-undef */
  }

  readSensor(e) {
    let q = e.target.quaternion;
    let angles = this.toEuler(q);

    if (!this.draw) {
      this.initAngle = angles;
      this.draw = true;
    }

    let pos = angles.map((angle, i) => this.calcDist(angle, i));
    this.text[this.numChar][0].push(pos[0]);
    this.text[this.numChar][1].push(pos[1]);
  }

  calcDist(angle, i) {
    angle = (angle - this.initAngle[i]) * (180 / Math.PI);
    angle = angle < 0 ? angle + 360 : angle;
    angle = angle > 180 ? angle - 360 : angle;
    let dist = -1 * Math.tan(angle * (Math.PI / 180));
    return dist;
  }

  // Wikipedia Implementation
  toEuler(q) {
    let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
    let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    let roll = Math.atan2(sinr_cosp, cosr_cosp);

    let siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
    let cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
    let yaw = Math.atan2(siny_cosp, cosy_cosp);
    return [yaw, roll];
  }

  createCanvas(num) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width", this.border * 2 + num * this.letterWidth);
    canvas.setAttribute("height", this.border * 2 + this.letterHeight);

    var ctx = canvas.getContext("2d");
    ctx.lineJoin = "round";
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = "white";

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return [canvas, ctx];
  }

  renderText(ctx) {
    ctx.beginPath();

    this.text.forEach((char, i) => {
      let xpos = char[0];
      let ypos = char[1];

      let xmin = Math.min(...xpos);
      let ymin = Math.min(...ypos);

      if (xmin > 0) xmin = 0;
      if (ymin > 0) ymin = 0;

      let xrange = Math.max(...xpos) - xmin;
      let yrange = Math.max(...ypos) - ymin;

      let xmulti = (this.letterSize * this.letterWidth) / xrange;
      let ymulti = (this.letterSize * this.letterHeight) / yrange;
      let multi = Math.min(xmulti, ymulti);

      let xoffset = this.border + (this.letterWidth - xrange * multi) / 2;
      let yoffset = this.border + (this.letterHeight - yrange * multi) / 2;

      let letterOffset = i * this.letterWidth;

      for (let j = 0; j < xpos.length; j++) {
        let x = xoffset + (Math.abs(xmin) + xpos[j]) * multi + letterOffset;
        let y = yoffset + (Math.abs(ymin) + ypos[j]) * multi;

        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    });

    ctx.stroke();
  }

  drawChange(draw) {
    if (draw) {
      if (this.spoken) {
        this.clear();
        this.spoken = false;
      }
      this.numChar += 1;
      this.text[this.numChar] = [[], []];
      this.sensor.start();
    } else {
      this.sensor.stop();
      this.draw = false;
    }
  }

  clear() {
    this.text = [];
    this.numChar = -1;
  }

  speak() {
    if (this.text.length > 0) {
      this.spoken = true;
      var [canvas, ctx] = this.createCanvas(this.text.length);
      this.renderText(ctx);
      let image = canvas.toDataURL();
      this.appendImage(image);
      this.toAudio(image.split(";base64,").pop());
    }
  }

  appendImage(img) {
    let canvasBox = document.getElementById("canvasContainer");
    canvasBox.innerHTML = "";
    let i = new Image();
    i.src = img;
    i.width = window.innerWidth;
    i.style = "position:absolute;";
    i.height =
      (this.letterHeight / (this.text.length * this.letterWidth)) *
      window.innerWidth;
    canvasBox.appendChild(i);
  }

  toAudio(img) {
    axios
      .post(
        "/gesturetospeech",
        {
          image: img,
        }
      )
      .then((res) => {
        console.log(res.data);
        let audio = "data:audio/wav;base64," + res.data.audio;
        let text = res.data.text;
        this.speech.push([text, audio]);
        var snd = new Audio(audio);
        snd.play();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  render() {
    return (
      <div className=" w-screen h-screen bg-black overflow text-white flex flex-wrap p-1">
        <div className="w-12 right-0 absolute z-50 h-12 p-2 m-6">
          <img
            src={this.state.menu ? Close : Menu}
            alt="menu"
            onClick={() => {
              this.setState({ menu: !this.state.menu });
            }}
          />
        </div>
        {this.state.menu && (
          <div className="w-screen h-screen absolute z-40 bg-white pl-6 pr-6 pt-32">
            <div className="h-full w-full overflow-y-scroll pb-6">
              {this.speech.map(([text, audio], i) => {
                return (
                  <Speech
                    audio={audio}
                    text={text}
                    key={i}
                    delete={() => {
                      this.speech.splice(i, 1);
                      this.setState({});
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}
        <div id="canvasContainer" className="w-screen" />
        <div
          className=" drawBtn bg-black w-full  noselect flex"
          onTouchStart={() => this.drawChange(true)}
          onTouchEnd={() => this.drawChange(false)}
        >
          <div className=" h-full w-full m-auto mt-1 pl-4 pr-4 pt-64">
            <div className="border-b-8 border-blue-600 hoverbtn m-auto noselect text-gray-100 flex bg-blue-800  w-full rounded-lg h-full">
              <p className="m-auto">DRAW</p>
            </div>
          </div>
        </div>
        <div className=" w-full noselect flex">
          <div
            className=" calBtn w-1/2 noselect flex pr-3 p-4"
            onClick={() => this.speak()}
          >
            <div className="border-b-8 border-teal-600 hoverbtn m-auto noselect flex bg-teal-800 text-gray-100  w-full h-full rounded-lg">
              <p className="m-auto">SPEAK</p>
            </div>
          </div>
          <div
            className=" delBtn text-gray-100 w-1/2 noselect flex pl-3 p-4"
            onClick={() => this.clear()}
          >
            <div className="border-b-8 border-red-600 hoverbtn m-auto noselect flex bg-red-800 w-full h-full rounded-lg">
              <p className="m-auto">CLEAR</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
