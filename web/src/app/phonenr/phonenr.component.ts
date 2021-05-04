import { Component, OnInit } from '@angular/core';
import { WebSocketService } from '../websocket.service';

@Component({
  selector: 'app-phonenr',
  templateUrl: './phonenr.component.html',
  styleUrls: ['./phonenr.component.scss']
})
export class PhonenrComponent implements OnInit {
  public phoneNr: string;

  constructor(
    private webSocket: WebSocketService
  ) {
    this.phoneNr = '';
  }

  ngOnInit(): void {
    this.webSocket.connectPhoneNr()
      .subscribe((data: any) => this.phoneNr = data['twilio']);
  }

}
