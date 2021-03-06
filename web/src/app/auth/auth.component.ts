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
 import { HttpsService } from '../https.service';
 import { AngularFireAuth } from '@angular/fire/auth';
 import firebase from 'firebase/app';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  providers:  [ HttpsService ]
})
export class AuthComponent {

  constructor(public auth: AngularFireAuth) {
  }

  async loginGoogle() {
    const signInObj = await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    if(signInObj.user) {
      location.href = '/';
    }
  }

  async login() {
    const email = 'TODO';
    const password = 'TODO';
    const signInObj = await this.auth.signInWithEmailAndPassword(email, password);
    if(signInObj.user) {
      location.href = '/';
    }
  }

  edit() {
    location.href = '/profile';
  }

  async logout() {
    await this.auth.signOut();
    location.href = '/';
  }

}
