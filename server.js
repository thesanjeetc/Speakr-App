const express = require('express')
const path = require('path');
const {handwritingToText, tts} = require('./gesturetospeech')
const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, "App/build")));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.post('/gesturetospeech', (req, res) => {
  let body = JSON.parse(req.body);
  let image = body.image;
  handwritingToText(image).then((text) => {
    tts(text).then(([text, audio]) => {
      console.log(text, audio);
      res.json({
        body: JSON.stringify({ audio: audio, text: text }),
      })
    });
  });
})

app.listen(port)