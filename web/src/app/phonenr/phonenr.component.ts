import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-phonenr',
  templateUrl: './phonenr.component.html',
  styleUrls: ['./phonenr.component.scss']
})
export class PhonenrComponent implements OnInit {
  public phoneNr: string;

  constructor() {
    this.phoneNr = "123";
  }

  ngOnInit(): void {
  }

}
