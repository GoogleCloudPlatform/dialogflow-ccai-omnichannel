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
import { Component, AfterContentInit, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketService } from '../websocket.service';
import { AngularFireAuth } from '@angular/fire/auth';
import * as $ from 'jquery';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  providers:  [ WebSocketService ]
})
export class ChatComponent implements OnInit, AfterContentInit {
    server: any;
    messages: any;
    userCountry: string;
    destroyed$ = new Subject();
    authState: any;

    constructor(
      public auth: AngularFireAuth,
      private webSocket: WebSocketService
    ) {
      this.messages = [];
      this.authState = this.auth.authState;
      this.userCountry = '';
    }

    async ngOnInit() {
      const me = this;

      this.setUserLocation();

      me.webSocket.connectChat().pipe(
        takeUntil(this.destroyed$)
      ).subscribe(async agentResponse => {

        if(!agentResponse.error){
          const messages = agentResponse.responseMessages;
          var i = 0;
          for(i; i<messages.length; i++) {
            if(messages[i].text){
              const m = messages[i].text.text;
              await this.task(i, m);
            }
          }
        } else {
          console.log(`server error: ${agentResponse.error}`);
        }
      });
    }

    async ngAfterContentInit() {
      const me = this;
      me.authState.subscribe((user: any) => {
        if(user){
          me.webSocket.sendChat({'web-event' : 'INIT',
          user: user?.uid,
          country: this.userCountry
        });
        } else {
          me.messages[0] = {
            text: 'Hi there, in order to help you better, please login.',
            class: 'agent balloon'
          };
        }
      });
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

    async intentMatching(query: any) {
      const user = await this.auth.currentUser;
      this.webSocket.sendChat({'web-text-message' : query,
      user: user?.uid,
      country: this.userCountry });
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

    async setUserLocation() {
      fetch('https://extreme-ip-lookup.com/json/')
      .then( res => res.json())
      .then(response => {
          this.userCountry = response.countryCode;
       })
       .catch(e => {
        this.userCountry = 'N/A';
       })
    }
}
