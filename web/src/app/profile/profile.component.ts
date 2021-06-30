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
import * as $ from 'jquery';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  public mobNumberPattern;
  private username;
  private phoneNr;
  private password;
  private email;
  private photo;
  private isValidFormSubmitted;

  constructor(
  ) {
    this.username = '';
    this.phoneNr = '';
    this.password = '';
    this.email = '';
    this.photo = '';
    this.isValidFormSubmitted = false;
    this.mobNumberPattern = '^[0-9\-]*$';
  }

  ngOnInit(): void {
  }

  onSubmit(f: NgForm): void {
    const m = f.value.m;
    if (m.length > 0) {
      console.log(m);
    }
    f.reset();
  }

}
