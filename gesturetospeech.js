const axios = require("axios");

function tts(text) {
  let body = {
    input: {
      text: text,
    },
    voice: {
      languageCode: "en-us",
      name: "en-US-Wavenet-D",
      ssmlGender: "MALE",
    },
    audioConfig: {
      audioEncoding: "MP3",
    },
  };

  return axios
    .post(
      "https://texttospeech.googleapis.com/v1/text:synthesize?key=" +
        process.env.API_KEY,
      body
    )
    .then((res) => {
      console.log(res.data);
      return [text, res.data.audioContent];
    })
    .catch((error) => {
      console.error(error);
    });
}

function handwritingToText(image) {
  let body = {
    requests: [
      {
        image: {
          content: image,
        },
        features: [
          {
            type: "DOCUMENT_TEXT_DETECTION",
          },
        ],
        imageContext: {
          languageHints: ["en-t-i0-handwrit"],
        },
      },
    ],
  };

  return axios
    .post(
      "https://vision.googleapis.com/v1/images:annotate?key=" +
        process.env.API_KEY,
      body
    )
    .then((res) => {
      console.log(res.data);
      let text = res.data.responses[0].fullTextAnnotation.text;
      return text;
    })
    .catch((error) => {
      console.error(error);
    });
}

module.exports = {
  handwritingToText,
  tts
}