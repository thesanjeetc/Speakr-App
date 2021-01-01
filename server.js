const express = require('express')
const path = require('path');
const {handwritingToText, tts} = require('./gesturetospeech')
const app = express()
const port = 3000

app.use(express.static(path.join(__dirname, "App/build")));

app.use(express.json({limit: '50mb'}))
app.use(express.urlencoded({limit: '50mb',extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
})

app.post('/gesturetospeech', (req, res) => {
  let body = req.body;
  let image = body.image;
  handwritingToText(image).then((text) => {
    tts(text).then(([text, audio]) => {
      console.log(text, audio);
      res.json({
        body: { audio: audio, text: text }
      })
    });
  });

})

app.listen(port)