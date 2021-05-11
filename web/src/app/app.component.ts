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
import { WebSocketService } from './websocket.service';

@Component({
  selector: 'front-end',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public class: string;
  public phoneNr: string;
  title = 'ccai360';

  constructor(
    private webSocket: WebSocketService
  ) {
    this.class = '';
    this.phoneNr = '';
  }

  ngOnInit(): void {
    const me = this;
    this.webSocket.connect()
      .subscribe(function(data: any) {
        me.class = data['vertical'];
        me.phoneNr = data['twilio'];
      });
  }

}
