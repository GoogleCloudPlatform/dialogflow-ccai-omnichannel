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
      var isMsg = true;
      me.webSocket.connectChat().pipe(
        takeUntil(this.destroyed$)
      ).subscribe(agentResponse => {
        me.messages.push({
          text: agentResponse.responseMessages[0].text.text,
          class: 'agent balloon'
        });
      });
      me.webSocket.sendChat({'web-event' : 'WELCOME' });
    }

    intentMatching(query: any): void {
      this.webSocket.sendChat({'web-text-message' : query });
      this.messages.push({
        text: query,
        class: 'user balloon'
      });
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