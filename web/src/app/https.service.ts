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
import { HttpClient } from '@angular/common/http';
import { environment } from './../environments/environment';

@Injectable()
export class HttpsService {
  API_URL = environment.serverUrl;

  constructor(private http: HttpClient) { }

  getUser(email: string, password: string) {
    return this.http.post<any>(`${this.API_URL}/api/auth/login`, {
        email,
        password,
    });
  }

  createUser(email: string, password: string, username: string, phoneNr: string) {
    return this.http.post<any>(`${this.API_URL}/api/auth/register/`, {
        username,
        password,
        email,
        phoneNr
    });
  }

  resetPassword(email: string) {
    return this.http.post<any>(`${this.API_URL}/api/auth/reset/`, {
        email
    });
  }

  callMe(phoneNr: string, name: string) {
    return this.http.post<any>(`${this.API_URL}/api/callme/`, { From: phoneNr, Name: name });
  }

  /*setSession(auth) {
    localStorage.setItem('token', auth.token);
    var usersUrl = `${this.server}/users/current/?format=json`
    this.http.get(usersUrl).subscribe(user => {
        localStorage.setItem('user', JSON.stringify(user));
    });
  }*/

}