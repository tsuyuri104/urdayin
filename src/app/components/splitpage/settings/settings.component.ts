import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  constructor(
    private sGroupName: GroupNameService
    , private sUrdayin: UrdayinService) {

  }
  public async ngOnInit(): Promise<void> {
  }

}
