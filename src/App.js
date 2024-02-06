import React, { useState } from 'react';
import { Container } from 'reactstrap';
import { getTokenOrRefresh } from './token_util';
import './custom.css'
import { ResultReason } from 'microsoft-cognitiveservices-speech-sdk';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

export default function App() {
    const [displayText, setDisplayText] = useState('INITIALIZED: ready to test speech...');
    const [player, updatePlayer] = useState({ p: undefined, muted: false });
    const [hasil, setHasil] = useState({ p: undefined, muted: false });


    async function sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'id-ID';
        // speechConfig.speechRecognitionLanguage = 'jv-ID';

        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        setDisplayText('speak into your microphone...');

        recognizer.recognizeOnceAsync(result => {
            if (result.reason === ResultReason.RecognizedSpeech) {
                setDisplayText(`RECOGNIZED: Text=${result.text}`);
                setHasil(result.text);
            } else {
                setDisplayText('ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.');
            }
        });
    }

    async function textToSpeech() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechSynthesisLanguage = "id-ID";
        speechConfig.speechSynthesisVoiceName = "id-ID-GadisNeural";

        const myPlayer = new speechsdk.SpeakerAudioDestination();
        updatePlayer(p => { p.p = myPlayer; return p; });
        const audioConfig = speechsdk.AudioConfig.fromSpeakerOutput(player.p);

        let synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, audioConfig);

        // const textToSpeak = 'Proklamasi, kami bangsa Indonesia dengan ini menyatakan kemerdekaan Indonesia.';
        setDisplayText(`speaking text: ${hasil}...`);
        synthesizer.speakTextAsync(
            hasil,
            result => {
                let text;
                if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
                    text = `synthesis finished for "${hasil}".\n`
                } else if (result.reason === speechsdk.ResultReason.Canceled) {
                    text = `synthesis failed. Error detail: ${result.errorDetails}.\n`
                }
                synthesizer.close();
                synthesizer = undefined;
                setDisplayText(text);
            },
            function (err) {
                setDisplayText(`Error: ${err}.\n`);

                synthesizer.close();
                synthesizer = undefined;
            });
    }

    async function handleMute() {
        updatePlayer(p => {
            if (!p.muted) {
                p.p.pause();
                return { p: p.p, muted: true };
            } else {
                p.p.resume();
                return { p: p.p, muted: false };
            }
        });
    }

    async function fileChange(event) {
        const audioFile = event.target.files[0];
        console.log(audioFile);
        const fileInfo = audioFile.name + ` size=${audioFile.size} bytes `;

        setDisplayText(fileInfo);

        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = 'en-US';

        const audioConfig = speechsdk.AudioConfig.fromWavFileInput(audioFile);
        const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizeOnceAsync(result => {
            let text;
            if (result.reason === ResultReason.RecognizedSpeech) {
                text = `RECOGNIZED: Text=${result.text}`
            } else {
                text = 'ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.';
            }

            setDisplayText(fileInfo + text);
        });
    }

    return (
        <Container className="app-container">
            <h1 className="display-4 mb-3">Speech sample app</h1>

            <div className="row main-container">
                <div className="col-6">
                    <i className="fas fa-microphone fa-lg mr-2" onClick={() => sttFromMic()}></i>
                    Text from your mic.

                    <div className="mt-2" hidden>
                        <label htmlFor="audio-file"><i className="fas fa-file-audio fa-lg mr-2"></i></label>
                        <input
                            type="file"
                            id="audio-file"
                            onChange={(e) => fileChange(e)}
                            style={{ display: "none" }}
                        />
                        Convert speech to text from an audio file.
                    </div>
                    <div className="mt-2">
                        <i className="fas fa-volume-up fa-lg mr-2" onClick={() => textToSpeech()}></i>
                        Text to speech.
                    </div>
                    <div className="mt-2" hidden>
                        <i className="fas fa-volume-mute fa-lg mr-2" onClick={() => handleMute()}></i>
                        Pause/resume text to speech output.
                    </div>

                </div>
                <div className="col-6 output-display rounded">
                    <code>{displayText}</code>
                </div>
            </div>
        </Container>
    );
}