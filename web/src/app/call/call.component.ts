import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { WebSocketService } from '../websocket.service';

@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.scss'],
  providers:  [ WebSocketService ]
})
export class CallComponent {
  public phone: string;
  public name: string;
  public mobNumberPattern;
  public isValidFormSubmitted: boolean;

  constructor(
    private webSocket: WebSocketService
  ) {
    this.name = '';
    this.phone = '';
    this.isValidFormSubmitted = false;
    this.mobNumberPattern = '^[0-9\-]*$';
  }

  onSubmit(f: NgForm): void {
    this.phone = f.value.phone;
    this.name = f.value.name;
    this.isValidFormSubmitted = false;
    if (f.invalid) {
        return;
    }
    if (this.phone.length > 0) {
      this.isValidFormSubmitted = true;
      this.webSocket.callMe(this.phone, this.name).pipe().subscribe(data => {
        console.log(data);
    });
    }
    f.reset();
  }
}
