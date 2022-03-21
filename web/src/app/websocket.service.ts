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
import { Injectable } from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { retryWhen, switchMap, delay, filter, map } from 'rxjs/operators';
import { environment } from './../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
    connectionChat$: any
    connectionAudio$: any
    RETRY_SECONDS = 10;
    API_URL = environment.serverUrl;

    constructor(private http: HttpClient) { }

    connectAudio(): Observable<any> {
        return of(this.API_URL).pipe(
          filter(apiUrl => !!apiUrl),
          // https becomes wws, http becomes ws
          map(apiUrl => apiUrl.replace(/^http/, 'ws') + '/api/web-audio/'),
          switchMap(wsUrl => {
             if (this.connectionAudio$) {
              return this.connectionAudio$;
             } else {
              this.connectionAudio$ = webSocket({
                url: wsUrl,
                binaryType: 'arraybuffer',
                serializer: v => v as ArrayBuffer, // https://golb.hplar.ch/2020/04/rxjs-websocket.html
                /*serializer: (msg: Uint8Array) => {
                  console.log('here');
                  const offset = msg.byteOffset;
                  const length = msg.byteLength;
                  return msg.buffer.slice(offset, offset + length);
                },*/
                deserializer: msg => new Uint8Array(msg.data as ArrayBuffer)
              });
              return this.connectionAudio$;
            }
          }),
          retryWhen((errors) => errors.pipe(delay(this.RETRY_SECONDS)))
        );
    }

    connect() {
      return this.http.get(`${this.API_URL}/api/web/`);
    }

    connectChat(): Observable<any> {
      console.log('connect chat');
      return of(this.API_URL).pipe(
        filter(apiUrl => !!apiUrl),
        // https becomes wws, http becomes ws
        map(apiUrl => apiUrl.replace(/^http/, 'ws') + '/api/web-chat/'),
        switchMap(wsUrl => {
           if (this.connectionChat$) {
            return this.connectionChat$;
           } else {
            this.connectionChat$ = webSocket({
              url: wsUrl
            });
            return this.connectionChat$;
          }
        }),
        retryWhen((errors) => errors.pipe(delay(this.RETRY_SECONDS)))
      );
    }

    sendAudio(data: any) {
      if (this.connectionAudio$) {
        this.connectionAudio$.next(data);
      } else {
        console.error('Did not send data, open a connection first');
      }
    }

    sendChat(data: any) {
      if (this.connectionChat$) {
        this.connectionChat$.next(data);
      } else {
        console.error('Did not send data, open a connection first');
      }
    }

    closeConnections() {
      if (this.connectionAudio$) {
        this.connectionAudio$.complete();
        this.connectionAudio$ = null;
      }
      if (this.connectionChat$) {
        this.connectionChat$.complete();
        this.connectionChat$ = null;
      }
    }
    ngOnDestroy() {
      this.closeConnections();
    }
}