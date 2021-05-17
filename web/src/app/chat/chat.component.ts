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
import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketService } from '../websocket.service';
import * as $ from 'jquery';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
    server: any;
    messages: any;
    destroyed$ = new Subject();

    constructor(
      private webSocket: WebSocketService
    ) {
      this.messages = [];
    }

    ngOnInit(): void {
      const me = this;
      me.webSocket.connectChat().pipe(
        takeUntil(this.destroyed$)
      ).subscribe(async agentResponse => {

        // console.log(agentResponse);

        if(!agentResponse.error){
          const messages = agentResponse.responseMessages; var i = 0;
          for(i; i<messages.length; i++) {
            const m = messages[i].text.text;
            await this.task(i, m);
          }
        } else {
          console.log(`server error: ${agentResponse.error}`);
        }
      });
      me.webSocket.sendChat({'web-event' : 'WELCOME-WEB' });
    }

    async task(i: number, m: string){
      const me = this;
      var seconds = 2000;
      const totalChars = m.length;
      const factor = totalChars / 75; // a sentence has an avarage of 75 - 100 characters
      if(factor > 1) seconds = factor * 2000;
      if(factor > 4) seconds = 8000;

      me.messages.push({
        class: 'spinner'
      });

      await me.timer(seconds);

      me.messages[me.messages.length-1] = { // TODO
        text: m,
        class: 'agent balloon'
      };
      $('.chatarea').stop().animate({ scrollTop: $('.chatarea')[0].scrollHeight}, 2000);
    }

    timer(ms: number) {
      return new Promise(res => setTimeout(res, ms));
    }

    intentMatching(query: any): void {
      this.webSocket.sendChat({'web-text-message' : query });
      this.messages.push({
        text: query,
        class: 'user balloon'
      });
      $('.chatarea').stop().animate({ scrollTop: $('.chatarea')[0].scrollHeight}, 1000);
    }

    onSubmit(f: NgForm): void {
      const m = f.value.m;
      if (m.length > 0) {
        this.intentMatching(m);
      }
      f.reset();
    }

    onKeyDown(): void {
      // send user message to server
      // this.server.emit('typing');
      // show this in the interface
    }

    ngOnDestroy() {
      this.destroyed$.next();
    }
}
