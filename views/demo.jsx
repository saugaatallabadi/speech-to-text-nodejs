/* eslint no-param-reassign: 0 */
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import {
  Icon, Tabs, Pane, Alert,
} from 'watson-react-components';
import recognizeMicrophone from 'watson-speech/speech-to-text/recognize-microphone';
import recognizeFile from 'watson-speech/speech-to-text/recognize-file';
import ModelDropdown from './model-dropdown.jsx';
import Transcript from './transcript.jsx';
import { Keywords, getKeywordsSummary } from './keywords.jsx';
import SpeakersView from './speaker.jsx';
import Translation from './Translation.js';
import ActionItems from './ActionItems.js';
import samples from '../src/data/samples.json';
import cachedModels from '../src/data/models.json';
import Test from './Test.js';
import { Send, Download } from 'react-feather';

const ERR_MIC_NARROWBAND = 'Microphone transcription cannot accommodate narrowband voice models, please select a broadband one.';

export class Demo extends Component {
  constructor(props) {
    // console.log(React.version);
    super();
    this.state = {
      emailBody:'',
      mailText:"Send Transcript",
      speaker0:false,
      speaker1:false,
      speaker2:false,
      speaker3:false,
      speaker4:false,
      speaker5:false,
      speak0:null,
      speak1:null,
      speak2:null,
      speak3:null,
      speak4:null,
      speak5:null,
      actionItems:[],
      model: 'en-US_BroadbandModel',
      rawMessages: [],
      formattedMessages: [],
      audioSource: null,
      speakerLabels: true,
      keywords: this.getKeywords('en-US_BroadbandModel'),
      rammerToken: null,
      text:[],
      translations:null,
      // transcript model and keywords are the state that they were when the button was clicked.
      // Changing them during a transcription would cause a mismatch between the setting sent to the
      // service and what is displayed on the demo, and could cause bugs.
      settingsAtStreamStart: {
        model: '',
        keywords: [],
        speakerLabels: false,
      },
      error: null,
    };

    this.handleSampleClick = this.handleSampleClick.bind(this);
    this.handleSample1Click = this.handleSample1Click.bind(this);
    this.handleSample2Click = this.handleSample2Click.bind(this);
    this.reset = this.reset.bind(this);
    this.captureSettings = this.captureSettings.bind(this);
    this.stopTranscription = this.stopTranscription.bind(this);
    this.getRecognizeOptions = this.getRecognizeOptions.bind(this);
    this.isNarrowBand = this.isNarrowBand.bind(this);
    this.handleMicClick = this.handleMicClick.bind(this);
    this.handleUploadClick = this.handleUploadClick.bind(this);
    this.handleUserFile = this.handleUserFile.bind(this);
    this.handleUserFileRejection = this.handleUserFileRejection.bind(this);
    this.playFile = this.playFile.bind(this);
    this.handleStream = this.handleStream.bind(this);
    this.handleRawMessage = this.handleRawMessage.bind(this);
    this.handleFormattedMessage = this.handleFormattedMessage.bind(this);
    this.handleTranscriptEnd = this.handleTranscriptEnd.bind(this);
    this.getKeywords = this.getKeywords.bind(this);
    this.handleModelChange = this.handleModelChange.bind(this);
    this.supportsSpeakerLabels = this.supportsSpeakerLabels.bind(this);
    this.handleSpeakerLabelsChange = this.handleSpeakerLabelsChange.bind(this);
    this.handleKeywordsChange = this.handleKeywordsChange.bind(this);
    this.getKeywordsArr = this.getKeywordsArr.bind(this);
    this.getKeywordsArrUnique = this.getKeywordsArrUnique.bind(this);
    this.getFinalResults = this.getFinalResults.bind(this);
    this.getCurrentInterimResult = this.getCurrentInterimResult.bind(this);
    this.getFinalAndLatestInterimResult = this.getFinalAndLatestInterimResult.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  reset() {
    if (this.state.audioSource) {
      this.stopTranscription();
    }
    this.setState({ rawMessages: [], formattedMessages: [], error: null });
  }

  /**
     * The behavior of several of the views depends on the settings when the
     * transcription was started. So, this stores those values in a settingsAtStreamStart object.
     */
  captureSettings() {
    const { model, speakerLabels } = this.state;
    this.setState({
      settingsAtStreamStart: {
        model,
        keywords: this.getKeywordsArrUnique(),
        speakerLabels,
      },
    });
  }

  stopTranscription() {
    if (this.stream) {
      this.stream.stop();
      let lastFormattedMessages=this.state.formattedMessages[this.state.formattedMessages.length-1]
      // console.log(lastFormattedMessages);
      var text = [];
      var emailBody=''
      for (var i of lastFormattedMessages.results) {
        text.push(this.getSpeakerName(i.speaker).concat(": "+i.alternatives[0].transcript));
        emailBody = emailBody + this.getSpeakerName(i.speaker).concat(": "+i.alternatives[0].transcript+'<br/>')
        // console.log(this.getSpeakerName(i.speaker).concat(": "+i.alternatives[0].transcript))
      }
      // console.log('??')
      this.setState({ text, emailBody }, ()=>this.callTranslateApi());
      this.callRammerApi(lastFormattedMessages);
      // this.stream.removeAllListeners();
      // this.stream.recognizeStream.removeAllListeners();
    }
    this.setState({ audioSource: null });
  }

  callTranslateApi() {
    // console.log("!!");

    if (this.state.text != null) {

      // console.log("!!");
      fetch("https://gateway-wdc.watsonplatform.net/language-translator/api/v3/translate?version=2018-05-01", {
        method: 'POST',
        headers: {
          'Authorization': "Basic YXBpa2V5Olh5eTRKLXNyZm1oUUctWDFUN2dHdWRrRGVFX3hidEZSTWZKbGpwVFJ0Sk9i",
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "text": this.state.text,
          "model_id": "en-ar"
        }),
      }).then((response) => {
        if (response.status != 200) {
          console.log(response);
          console.log("error calling api");
        }
        else if (response.status == 200) {
          response.json().then(responseJson => {
            // console.log(responseJson);
            this.setState({translations:responseJson.translations});
          })
        }
      }).catch(error => {
        console.log(error);
      });
    }
  }

  getSpeakerName(num){
    if(num==0&&this.state.speak0!=null){
      return this.state.speak0;
    }
    else if(num==1&&this.state.speak1!=null){
        return this.state.speak1;
    }    
    else if(num==2&&this.state.speak2!=null){
      return this.state.speak2;
    } 
    else if(num==3&&this.state.speak3!=null){
        return this.state.speak3;
    } 
    else if(num==4&&this.state.speak4!=null){
      return this.state.speak4;
    } 
    else if(num==5&&this.state.speak5!=null){
      return this.state.speak5;
    } 
    else {
      return num!=null?"Speaker "+num:"Someone";
    }
  }

  callRammerApi(messages){
    let actionItems=[];
    // console.log(messages.results[0]);
    for (var i of messages.results) {
      let item =
        {
          "payload": {
              "content": i.alternatives[0].transcript,
              "contentType": "text/plain"
          },
          "from": {
              "name": typeof i.speaker!=='undefined'?this.getSpeakerName(i.speaker):"Someone"
              // typeof i.speaker!=='undefined'?"Speaker " + i.speaker:"Someone"
          }
        }
        actionItems.push(item);
      // console.log(i.alternatives[0].transcript);
    }

    if(this.state.rammerToken!=null){
      fetch("https://api.rammer.ai/v1/insights", {
        method: 'POST',
        headers: {
        'X-API-KEY': this.state.rammerToken,
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insightTypes: [
            "action_item"
          ],
          messages: actionItems,
          config: {}
        }),
      }).then((response) => {
          if (response.status != 200) {
            console.log("error calling api");
          }
          else if (response.status == 200) {
            response.json().then(responseJson => {
              this.setState({actionItems:responseJson.insights})
            })
          }
      }).catch(error => {
          console.log(error);
      });
    }
  }

  getRecognizeOptions(extra) {
    const keywords = this.getKeywordsArrUnique();
    return Object.assign({
      // formats phone numbers, currency, etc. (server-side)
      access_token: this.state.accessToken,
      token: this.state.token,
      smart_formatting: true,
      format: true, // adds capitals, periods, and a few other things (client-side)
      model: this.state.model,
      objectMode: true,
      interim_results: true,
      // note: in normal usage, you'd probably set this a bit higher
      word_alternatives_threshold: 0.01,
      keywords,
      keywords_threshold: keywords.length
        ? 0.01
        : undefined, // note: in normal usage, you'd probably set this a bit higher
      timestamps: true, // set timestamps for each word - automatically turned on by speaker_labels
      // includes the speaker_labels in separate objects unless resultsBySpeaker is enabled
      speaker_labels: this.state.speakerLabels,
      // combines speaker_labels and results together into single objects,
      // making for easier transcript outputting
      resultsBySpeaker: this.state.speakerLabels,
      // allow interim results through before the speaker has been determined
      speakerlessInterim: this.state.speakerLabels,
      url: this.state.serviceUrl,
    }, extra);
  }

  isNarrowBand(model) {
    model = model || this.state.model;
    return model.indexOf('Narrowband') !== -1;
  }

  handleMicClick() {
    if (this.state.audioSource === 'mic') {
      this.stopTranscription();
      return;
    }
    this.reset();
    this.setState({ audioSource: 'mic' });

    // The recognizeMicrophone() method is a helper method provided by the watson-speech package
    // It sets up the microphone, converts and downsamples the audio, and then transcribes it
    // over a WebSocket connection
    // It also provides a number of optional features, some of which are enabled by default:
    //  * enables object mode by default (options.objectMode)
    //  * formats results (Capitals, periods, etc.) (options.format)
    //  * outputs the text to a DOM element - not used in this demo because it doesn't play nice
    // with react (options.outputElement)
    //  * a few other things for backwards compatibility and sane defaults
    // In addition to this, it passes other service-level options along to the RecognizeStream that
    // manages the actual WebSocket connection.
    this.handleStream(recognizeMicrophone(this.getRecognizeOptions()));
  }

  handleUploadClick() {
    if (this.state.audioSource === 'upload') {
      this.stopTranscription();
    } else {
      this.dropzone.open();
    }
  }

  handleUserFile(files) {
    const file = files[0];
    if (!file) {
      return;
    }
    this.reset();
    this.setState({ audioSource: 'upload' });
    this.playFile(file);
  }

  handleUserFileRejection() {
    this.setState({ error: 'Sorry, that file does not appear to be compatible.' });
  }

  handleSample1Click() {
    this.handleSampleClick(1);
  }

  handleSample2Click() {
    this.handleSampleClick(2);
  }


  handleSampleClick(which) {
    if (this.state.audioSource === `sample-${which}`) {
      this.stopTranscription();
    } else {
      const filename = samples[this.state.model] && samples[this.state.model][which - 1].filename;
      if (!filename) {
        this.handleError(`No sample ${which} available for model ${this.state.model}`, samples[this.state.model]);
      }
      this.reset();
      this.setState({ audioSource: `sample-${which}` });
      this.playFile(`audio/${filename}`);
    }
  }

  /**
   * @param {File|Blob|String} file - url to an audio file or a File
   * instance fro user-provided files.
   */
  playFile(file) {
    // The recognizeFile() method is a helper method provided by the watson-speach package
    // It accepts a file input and transcribes the contents over a WebSocket connection
    // It also provides a number of optional features, some of which are enabled by default:
    //  * enables object mode by default (options.objectMode)
    //  * plays the file in the browser if possible (options.play)
    //  * formats results (Capitals, periods, etc.) (options.format)
    //  * slows results down to realtime speed if received faster than realtime -
    // this causes extra interim `data` events to be emitted (options.realtime)
    //  * combines speaker_labels with results (options.resultsBySpeaker)
    //  * outputs the text to a DOM element - not used in this demo because it doesn't play
    //  nice with react (options.outputElement)
    //  * a few other things for backwards compatibility and sane defaults
    // In addition to this, it passes other service-level options along to the RecognizeStream
    // that manages the actual WebSocket connection.
    this.handleStream(recognizeFile(this.getRecognizeOptions({
      file,
      play: true, // play the audio out loud
      // use a helper stream to slow down the transcript output to match the audio speed
      realtime: true,
    })));
  }

  handleStream(stream) {
    console.log(stream);
    // cleanup old stream if appropriate
    if (this.stream) {
      this.stream.stop();
      this.stream.removeAllListeners();
      this.stream.recognizeStream.removeAllListeners();
    }
    this.stream = stream;
    this.captureSettings();

    // grab the formatted messages and also handle errors and such
    stream.on('data', this.handleFormattedMessage).on('end', this.handleTranscriptEnd).on('error', this.handleError);

    // when errors occur, the end event may not propagate through the helper streams.
    // However, the recognizeStream should always fire a end and close events
    stream.recognizeStream.on('end', () => {
      if (this.state.error) {
        this.handleTranscriptEnd();
      }
    });

    // grab raw messages from the debugging events for display on the JSON tab
    stream.recognizeStream
      .on('message', (frame, json) => this.handleRawMessage({ sent: false, frame, json }))
      .on('send-json', json => this.handleRawMessage({ sent: true, json }))
      .once('send-data', () => this.handleRawMessage({
        sent: true, binary: true, data: true, // discard the binary data to avoid waisting memory
      }))
      .on('close', (code, message) => this.handleRawMessage({ close: true, code, message }));

    // ['open','close','finish','end','error', 'pipe'].forEach(e => {
    //     stream.recognizeStream.on(e, console.log.bind(console, 'rs event: ', e));
    //     stream.on(e, console.log.bind(console, 'stream event: ', e));
    // });
  }

  handleRawMessage(msg) {
    const { rawMessages } = this.state;
    this.setState({ rawMessages: rawMessages.concat(msg) });
  }

  handleFormattedMessage(msg) {
    const { formattedMessages } = this.state;
    this.setState({ formattedMessages: formattedMessages.concat(msg) });
    this.renderRadioButtons(formattedMessages.concat(msg))
  }

  handleTranscriptEnd() {
    // note: this function will be called twice on a clean end,
    // but may only be called once in the event of an error
    this.setState({ audioSource: null });
  }

  componentDidMount() {
    this.fetchToken();
    this.fetchRammerToken();
    // tokens expire after 60 minutes, so automatcally fetch a new one ever 50 minutes
    // Not sure if this will work properly if a computer goes to sleep for > 50 minutes
    // and then wakes back up
    // react automatically binds the call to this
    // eslint-disable-next-line
    this.setState({ tokenInterval: setInterval(this.fetchToken, 50 * 60 * 1000) });
  }

  fetchRammerToken(){
    fetch("https://api.rammer.ai/oauth2/token:generate", {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify({
          type: "application",
          appId: "715f39786269407663706677722e6e74",
          appSecret: "a3bd34bb265e4905bc01f1b3c9acc850af66910b79374677bb7e9ddc57278401"
      }),
    }).then((response) => {
      if (response.status != 200) {
        console.log("error fetching API token");
      }
      else if (response.status == 200) {
        response.json().then(responseJson => {
          this.setState({rammerToken:responseJson.accessToken});
          console.log('got token');
        })
      }
    }).catch(error => {
      console.log(error);
    });
  }

  componentWillUnmount() {
    clearInterval(this.state.tokenInterval);
  }

  fetchToken() {
    return fetch('/api/v1/credentials').then((res) => {
      if (res.status !== 200) {
        throw new Error('Error retrieving auth token');
      }
      return res.json();
    }) // todo: throw here if non-200 status
      .then(creds => this.setState({ ...creds })).catch(this.handleError);
  }

  getKeywords(model) {
    // a few models have more than two sample files, but the demo can only handle
    // two samples at the moment
    // so this just takes the keywords from the first two samples
    const files = samples[model];
    return (files && files.length >= 2 && `${files[0].keywords}, ${files[1].keywords}`) || '';
  }

  handleModelChange(model) {
    this.reset();
    this.setState({
      model,
      keywords: this.getKeywords(model),
      speakerLabels: this.supportsSpeakerLabels(model),
    });

    // clear the microphone narrowband error if it's visible and a broadband model was just selected
    if (this.state.error === ERR_MIC_NARROWBAND && !this.isNarrowBand(model)) {
      this.setState({ error: null });
    }

    // clear the speaker_lables is not supported error - e.g.
    // speaker_labels is not a supported feature for model en-US_BroadbandModel
    if (this.state.error && this.state.error.indexOf('speaker_labels is not a supported feature for model') === 0) {
      this.setState({ error: null });
    }
  }

  supportsSpeakerLabels(model) {
    model = model || this.state.model;
    // todo: read the upd-to-date models list instead of the cached one
    return cachedModels.some(m => m.name === model && m.supported_features.speaker_labels);
  }

  handleSpeakerLabelsChange() {
    this.setState(prevState => ({ speakerLabels: !prevState.speakerLabels }));
  }

  handleKeywordsChange(e) {
    this.setState({ keywords: e.target.value });
  }

  // cleans up the keywords string into an array of individual, trimmed, non-empty keywords/phrases
  getKeywordsArr() {
    return this.state.keywords.split(',').map(k => k.trim()).filter(k => k);
  }

  // cleans up the keywords string and produces a unique list of keywords
  getKeywordsArrUnique() {
    return this.state.keywords
      .split(',')
      .map(k => k.trim())
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  getFinalResults() {
    return this.state.formattedMessages.filter(r => r.results
      && r.results.length && r.results[0].final);
  }

  getCurrentInterimResult() {
    const r = this.state.formattedMessages[this.state.formattedMessages.length - 1];

    // When resultsBySpeaker is enabled, each msg.results array may contain multiple results.
    // However, all results in a given message will be either final or interim, so just checking
    // the first one still works here.
    if (!r || !r.results || !r.results.length || r.results[0].final) {
      return null;
    }
    return r;
  }

  getFinalAndLatestInterimResult() {
    const final = this.getFinalResults();
    const interim = this.getCurrentInterimResult();
    if (interim) {
      final.push(interim);
    }
    return final;
  }

  handleError(err, extra) {
    console.error(err, extra);
    if (err.name === 'UNRECOGNIZED_FORMAT') {
      err = 'Unable to determine content type from file name or header; mp3, wav, flac, ogg, opus, and webm are supported. Please choose a different file.';
    } else if (err.name === 'NotSupportedError' && this.state.audioSource === 'mic') {
      err = 'This browser does not support microphone input.';
    } else if (err.message === '(\'UpsamplingNotAllowed\', 8000, 16000)') {
      err = 'Please select a narrowband voice model to transcribe 8KHz audio files.';
    } else if (err.message === 'Invalid constraint') {
      // iPod Touch does this on iOS 11 - there is a microphone, but Safari claims there isn't
      err = 'Unable to access microphone';
    }
    this.setState({ error: err.message || err });
  }

  renderRadioButtons(messages){
    
    let speaker0=false;
    let speaker1=false;
    let speaker2=false;
    let speaker3=false;
    let speaker4=false;
    let speaker5=false;

    for(var message of messages[messages.length-1].results){
      // console.log(message);
      if(message.speaker=="0"){
        speaker0=true;
      }
      else if(message.speaker=="1"){
        speaker1=true;
      }
      else if(message.speaker=="2"){
        speaker2=true;
      }
      else if(message.speaker=="3"){
        speaker3=true;
      }
      else if(message.speaker=="4"){
        speaker4=true;
      }
      else if(message.speaker=="5"){
        speaker5=true;
      }
    }
    this.setState({speaker0,speaker1,speaker2,speaker3,speaker4,speaker5});

    return(
      <div style={{textAlign:'center'}}>hi</div>
    )
  }

  sendTranscript(){
    console.log(this.state.emailBody);
    fetch("https://api.sendgrid.com/v3/mail/send", {
        method: 'POST',
        headers: {
          'Authorization': "Bearer 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",
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "personalizations": [
            {
              "to": [
                {
                  "email": "jakeblankenship@aol.com"
                },
                {
                  "email": "saugaatallabadi@gmail.com"
                }
              ]
            }
          ],
          "from": {
            "email": "smart.meetings@pwc.com"
          },
          "subject": "File Attached: Minutes of the Meeting (Arabic)",
          "content": [
            {
              "type": "text/html",
              "value": '<!doctype html><html> <head> <meta name="viewport" content="width=device-width" /> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />'+
              this.state.emailBody+
              '<style> /* ------------------------------------- GLOBAL RESETS ------------------------------------- */ img { border: none; -ms-interpolation-mode: bicubic; max-width: 750px; } body { background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; } table { border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; } table td { font-family: sans-serif; font-size: 14px; vertical-align: top; } /* ------------------------------------- BODY & CONTAINER ------------------------------------- */ .body { background-color: #f6f6f6; width: 100%; } /* Set a max-width, and make it display as block so it will automatically stretch to that width, but will also shrink down on a phone or something */ .container { display: block; Margin: 0 auto !important; /* makes it centered */ max-width: 700px; padding: 10px; width: 700px; } /* This should also be a block element, so that it will fill 100% of the .container */ .content { box-sizing: border-box; display: block; Margin: 0 auto; max-width: 700px; padding: 10px; } /* ------------------------------------- HEADER, FOOTER, MAIN ------------------------------------- */ .main { background: #ffffff; border-radius: 3px; width: 100%; } .wrapper { box-sizing: border-box; padding: 20px; } .content-block { padding-bottom: 10px; padding-top: 10px; } .footer { clear: both; Margin-top: 10px; text-align: center; width: 100%; } .footer td, .footer p, .footer span, .footer a { color: #000000; font-size: 12px; text-align: center; } /* ------------------------------------- TYPOGRAPHY ------------------------------------- */ h1, h2, h3, h4 { color: #000000; font-family: sans-serif; font-weight: 400; line-height: 1.4; margin: 0; Margin-bottom: 30px; } h1 { font-size: 35px; font-weight: 300; text-align: center; text-transform: capitalize; } p, ul, ol { font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; Margin-bottom: 15px; } p li, ul li, ol li { list-style-position: inside; margin-left: 5px; } a { color: #000000; text-decoration: underline; } /* ------------------------------------- BUTTONS ------------------------------------- */ .btn { box-sizing: border-box; width: 100%; } .btn > tbody > tr > td { padding-bottom: 4px; } .btn table { width: auto; } .btn table td { background-color: #000000; border-radius: 5px; text-align: center; } .btn a { background-color: #000000; border: solid 1px #E0301E; border-radius: 5px; box-sizing: border-box; color: #E0301E; cursor: pointer; display: inline-block; font-size: 8px; font-weight: bold; margin: 0; padding: 6px 15px; text-decoration: none; text-transform: none; } .btn-primary table td { background-color: #E0301E; } .btn-primary a { background-color: #E0301E; border-color: #E0301E; color: #ffffff; } /* ------------------------------------- OTHER STYLES THAT MIGHT BE USEFUL ------------------------------------- */ .last { margin-bottom: 0; } .first { margin-top: 0; } .align-center { text-align: center; } .align-right { text-align: right; } .align-left { text-align: left; } .clear { clear: both; } .mt0 { margin-top: 0; } .mb0 { margin-bottom: 0; } .preheader { color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0; } .powered-by a { text-decoration: none; } hr { border: 0; border-bottom: 1px solid #000000; Margin: 20px 0; } /* ------------------------------------- RESPONSIVE AND MOBILE FRIENDLY STYLES ------------------------------------- */ @media only screen and (max-width: 620px) { table[class=body] h1 { font-size: 28px !important; margin-bottom: 10px !important; } table[class=body] p, table[class=body] ul, table[class=body] ol, table[class=body] td, table[class=body] span, table[class=body] a { font-size: 16px !important; } table[class=body] .wrapper, table[class=body] .article { padding: 10px !important; } table[class=body] .content { padding: 0 !important; } table[class=body] .container { padding: 0 !important; width: 100% !important; } table[class=body] .main { border-left-width: 0 !important; border-radius: 0 !important; border-right-width: 0 !important; } table[class=body] .btn table { width: 100% !important; } table[class=body] .btn a { width: 100% !important; } table[class=body] .img-responsive { height: auto !important; max-width: 100% !important; width: auto !important; }} /* ------------------------------------- PRESERVE THESE STYLES IN THE HEAD ------------------------------------- */ @media all { .ExternalClass { width: 100%; } .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; } .apple-link a { color: inherit !important; font-family: inherit !important; font-size: inherit !important; font-weight: inherit !important; line-height: inherit !important; text-decoration: none !important; } .btn-primary table td:hover { background-color: #E0301E !important; } .btn-primary a:hover { background-color: #E0301E !important; border-color: #E0301E !important; } } </style> </head> <body class=""> <table border="0" cellpadding="0" cellspacing="0" class="body"> <tr> <td> </td> <td class="container"> <div class="content"> <!-- START CENTERED WHITE CONTAINER --> <span class="preheader" ></span> <table class="main"> <!-- START MAIN CONTENT AREA --> <tr> <td class="wrapper" style =" width: 85%";> <img src ="https://i.imgur.com/I9mE877.png"  style =" width: 100%";> <table border="0" cellpadding="0" cellspacing="0"> <tr> <td><span style="color: #000000; "> <p>Hi there!</p> <p>Please find attached the file requested: Client - Operations, Business Continuity Plan </p> <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary"> <tbody> <tr> <table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary"> <tbody> <tr> <td align="left"> <table border="0" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <a href="https://docs.google.com/presentation/d/1-a9aEQZnzUGm46RbYD_EEXHDwYNm79yVbA_jRvMOwyw/edit?usp=sharing" target="_blank">Click here to learn more about BCM.ai!</a> </td> </tr> </tbody> </table> </td> </tr> </tbody> </table> <p></p> <p>Warm Regards</p></span> </td> </tr> </table> </td> </tr> <!-- END MAIN CONTENT AREA --> </table> <!-- START FOOTER --> <div class="footer"> <table border="0" cellpadding="0" cellspacing="0"> <tr> <td class="content-block"> <span class="apple-link"></span> <br> This email is powered by BCM.ai </br> </td> </tr> </table> </div> <!-- END FOOTER --> <!-- END CENTERED WHITE CONTAINER --> </div> </td> <td> </td> </tr> </table> </body></html>'
            }
          ],
        
           "attachments": [{  
                    "filename": "Client - Operations, Business Continuity Plan.docx",
                    "content" :"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"
                    +"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"
                    +"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"
                    +"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"
                }]
        }),
      }).then((response) => {
        if (response.status != 202) {
          console.log(response);
          console.log("error calling api");
        }
        else if (response.status == 202) {
          this.setState({mailText:"Mail Sent"})
          // response.json().then(responseJson => {
          // })
        }
      }).catch(error => {
        console.log(error);
    });
  }

  render() {
    const {
      token, accessToken, audioSource, error, model, speakerLabels, settingsAtStreamStart,
      formattedMessages, rawMessages,
    } = this.state;

    const buttonsEnabled = !!token || !!accessToken;
    const buttonClass = buttonsEnabled
      ? 'base--button'
      : 'base--button base--button_black';

    let micIconFill = '#000000';
    let micButtonClass = buttonClass;
    if (audioSource === 'mic') {
      micButtonClass += ' mic-active';
      micIconFill = '#FFFFFF';
    } else if (!recognizeMicrophone.isSupported) {
      micButtonClass += ' base--button_black';
    }

    const err = error
      ? (
        <Alert type="error" color="red">
          <p className="base--p">
            {error}
          </p>
        </Alert>
      )
      : null;

    const messages = this.getFinalAndLatestInterimResult();
    const micBullet = (typeof window !== 'undefined' && recognizeMicrophone.isSupported)
      ? <li className="base--li">Use your microphone to record audio. For best results, use broadband models for microphone input.</li>
      : <li className="base--li base--p_light">Use your microphone to record audio. (Not supported in current browser)</li>;// eslint-disable-line

    return (
      <Dropzone
        // onDropAccepted={this.handleUserFile}
        // onDropRejected={this.handleUserFileRejection}
        // maxSize={200 * 1024 * 1024}
        // accept="audio/wav, audio/mp3, audio/mpeg, audio/l16, audio/ogg, audio/flac, .mp3, .mpeg, .wav, .ogg, .opus, .flac" // eslint-disable-line
        disableClick
        className="dropzone _container _container_large"
        activeClassName="dropzone-active"
        rejectClassName="dropzone-reject"
        // ref={(node) => {
        //   this.dropzone = node;
        // }}
      >

        {/* <div className="drop-info-container">
          <div className="drop-info">
            <h1>Drop an audio file here.</h1>
            <p>Watson Speech to Text supports .mp3, .mpeg, .wav, .opus, and
              .flac files up to 200mb.
            </p>
          </div>
        </div> */}

        {/* <h2 className="base--h2">Transcribe Audio</h2> */}

        {/* <ul className="base--ul">
          {micBullet}
          <li className="base--li">Upload pre-recorded audio (.mp3, .mpeg, .wav, .flac, or .opus only).</li>
          <li className="base--li">Play one of the sample audio files.*</li>
        </ul>

        <div className="smalltext">
          *Both US English broadband sample audio files are covered under the
          Creative Commons license.
        </div> */}

        {/* <div style={{
          paddingRight: '3em',
          paddingBottom: '2em',
        }}
        >
          The returned result includes the recognized text, {' '}
          <a className="base--a" href="https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-output#word_alternatives">word alternatives</a>, {' '}
          and <a className="base--a" href="https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-output#keyword_spotting">spotted keywords</a>. {' '}
          Some models can <a className="base--a" href="https://cloud.ibm.com/docs/services/speech-to-text?topic=speech-to-text-output#speaker_labels">detect multiple speakers</a>; this may slow down performance.
        </div> */}
        {/* <div className="flex setup">
          <div className="column"> */}

            {/* <p>Voice Model:
              <ModelDropdown
                model={model}
                token={token || accessToken}
                onChange={this.handleModelChange}
              />
            </p>

            <p className={this.supportsSpeakerLabels() ? 'base--p' : 'base--p_light'}>
              <input
                className="base--checkbox"
                type="checkbox"
                checked={speakerLabels}
                onChange={this.handleSpeakerLabelsChange}
                disabled={!this.supportsSpeakerLabels()}
                id="speaker-labels"
              />
              <label className="base--inline-label" htmlFor="speaker-labels">
                Detect multiple speakers {this.supportsSpeakerLabels() ? '' : ' (Not supported on current model)'}
              </label>
            </p> */}

          {/* </div>
          <div className="column">

            <p>Keywords to spot: <input
              value={this.getKeywordsArrUnique().join()}
              onChange={this.handleKeywordsChange}
              type="text"
              id="keywords"
              placeholder="Type comma separated keywords here (optional)"
              className="base--input"
            />
            </p>

          </div>
        </div> */}


        <div className="flex buttons">

          <button type="button" className={micButtonClass} onClick={this.handleMicClick}>
            <Icon type={audioSource === 'mic' ? 'stop' : 'microphone'} fill={micIconFill} /> Record Audio
          </button>
          
          <button type="button" className={buttonClass} onClick={()=>this.sendTranscript()}>
            <Icon type={'link-out'} /> {this.state.mailText}
          </button>

        </div>

        {/* {err} */}

        <Tabs selected={0}>
          <Pane label="Transcription">
            {settingsAtStreamStart.speakerLabels
              ? <SpeakersView messages={messages} 
                  speaker0={this.state.speak0}
                  speaker1={this.state.speak1}
                  speaker2={this.state.speak2}
                  speaker3={this.state.speak3}
                  speaker4={this.state.speak4}
                  speaker5={this.state.speak5}/>
              : <Transcript messages={messages} />}
          </Pane>
          <Pane label={"Arabic Translation"}>
            <Translation ref="Translation"
              messages={messages}
              raw={rawMessages} formatted={formattedMessages} translations={this.state.translations}
            />
          </Pane>
          <Pane label="Action Items">
            <ActionItems ref="ActionItems" messages={messages} 
              raw={rawMessages} formatted={formattedMessages} actionItems={this.state.actionItems}
            />
          </Pane>
          {/* <Pane label="JSON">
            <JSONView raw={rawMessages} formatted={formattedMessages} />
          </Pane>  */}
        </Tabs>
        <div className="flex buttons">
          Speaker 0:&nbsp;&nbsp;&nbsp; 
        <button type="button" className={buttonClass} onClick={null}>
          Sami
          </button>
          <button type="button" className={buttonClass} onClick={null}>
          Nadine
          </button>
          <button type="button" className={buttonClass} onClick={null}>
          Diego
          </button>
        </div>

        <div className="flex buttons">
          Speaker 1:&nbsp;&nbsp;&nbsp;
        <button type="button" className={buttonClass} onClick={null}>
          Sami
          </button>
          <button type="button" className={buttonClass} onClick={null}>
          Nadine
          </button>
          <button type="button" className={buttonClass} onClick={null}>
          Diego
          </button>
        </div>

        <div className="flex buttons">
          Speaker 2:&nbsp;&nbsp;&nbsp;
        <button type="button" className={buttonClass} onClick={null}>
          Sami
          </button>
          <button type="button" className={buttonClass} onClick={null}>
          Nadine
          </button>
          <button type="button" className={buttonClass} onClick={null}>
          Diego
          </button>





        </div>

        
      </Dropzone>
    );
  }
};

export default Demo;
