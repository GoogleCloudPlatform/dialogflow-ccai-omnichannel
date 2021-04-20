/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { Component, AfterViewInit } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketService } from '../websocket.service';

declare const StereoAudioRecorder: any;
declare const require: any;

@Component({
  selector: 'app-chat-microphone',
  templateUrl: './chat.microphone.component.html',
  styleUrls: ['./chat.microphone.component.scss']
})
export class MicrophoneComponent implements AfterViewInit {
  server: any;
  messages: any;
  destroyed$ = new Subject();

  // @ViewChild('audio') audio;

  public utterance: any;
  public recordAudio: any;
  // tslint:disable-next-line:no-inferrable-types
  public startDisabled: boolean = false;
  // tslint:disable-next-line:no-inferrable-types
  public stopDisabled: boolean = true;

  constructor(
    private webSocket: WebSocketService
  ) {
    this.messages = [];
  }

  onStart() {
    const me = this;
    me.startDisabled = true;
    me.stopDisabled = false;
    // make use of HTML 5/WebRTC, JavaScript getUserMedia()
    // to capture the browser microphone stream
    navigator.mediaDevices.getUserMedia({
        audio: true
    }).then(function(stream: MediaStream) {
        me.recordAudio = new RecordRTC(stream, {
            type: 'audio',
            mimeType: 'audio/webm',
            sampleRate: 44100, // this sampleRate should be the same in your server code

            // MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
            // CanvasRecorder, GifRecorder, WhammyRecorder
            recorderType: RecordRTC.StereoAudioRecorder,

            // Dialogflow / STT requires mono audio
            numberOfAudioChannels: 1,

            // get intervals based blobs
            // value in milliseconds
            // as you might not want to make detect calls every seconds
            timeSlice: 5000,

            // only for audio track
            // audioBitsPerSecond: 128000,

            // used by StereoAudioRecorder
            // the range 22050 to 96000.
            // let us force 16khz recording:
            desiredSampRate: 16000,

            // as soon as the stream is available
            async ondataavailable(blob) {
              // 3
              // making use of socket.io-stream for bi-directional
              // streaming, create a stream
              /*var stream = ss.createStream();
              // stream directly to server
              // it will be temp. stored locally
              ss(socket).emit('stream', stream, {
                  name: 'stream.wav',
                  size: blob.size
              });
              // pipe the audio blob to the read stream
              ss.createBlobReadStream(blob).pipe(stream);*/

              const buffer = await blob.arrayBuffer();
              console.log(buffer);
              me.webSocket.sendAudio(buffer);
          }
        });
        me.recordAudio.startRecording();
        // recording started
    }).catch(function(error) {
        console.error(error);
    });
  }

  onStop() {
    // recording stopped
    this.startDisabled = false;
    this.stopDisabled = true;
    // stop audio recorder
    this.recordAudio.stopRecording();
  }

  // reset() {
  //
  // }

  ngAfterViewInit(): void {
    this.webSocket.connectAudio().pipe(
      takeUntil(this.destroyed$)
    ).subscribe();
  }

}
