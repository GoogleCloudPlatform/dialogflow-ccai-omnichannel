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
import { HttpsService } from '../https.service';
import * as $ from 'jquery';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  providers:  [ HttpsService ]
})
export class ProfileComponent implements OnInit {
  public mobNumberPattern;
  public passwordMatch;
  private username;
  private phoneNr;
  private password;
  private email;
  private isValidFormSubmitted;

  constructor(
    private https: HttpsService
  ) {
    this.username = '';
    this.phoneNr = '';
    this.password = '';
    this.email = '';
    this.isValidFormSubmitted = false;
    this.mobNumberPattern = '^[0-9\-]*$';
    this.passwordMatch = false;
  }

  ngOnInit(): void {
  }

  onSubmit(f: NgForm): void {
    this.username = f.value.username;
    this.phoneNr = f.value.phoneNr;
    this.email = f.value.email;
    this.password = f.value.password;

    // TODO check if passwords are similar

    this.https.createUser(this.email, this.password, this.username, `+${this.phoneNr}`).pipe().subscribe(data => {
      console.log(data);
    });

    // if user is logged in, prefill the fields

    f.reset();
  }

}
