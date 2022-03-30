import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { RouteName } from 'src/app/classes/route-name';
import { InputsOfLogin } from 'src/app/interfaces/component/input-of-frm-login';
import { Notice } from 'src/app/interfaces/document/notice';
import { AuthService } from 'src/app/services/auth.service';
import { ComponentControlService } from 'src/app/services/component-control.service';
import { NoticesService } from 'src/app/services/notices.service';
import { ConfigService } from 'src/app/services/config.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  //#region 変数

  /**
   * ログイン入力項目
   */
  public login: InputsOfLogin = {
    email: "",
    password: ""
  }
  public notices: Notice[] = [];
  public version: string = "";
  public isLoadFinished: boolean = false;

  //#endregion

  //#region コンストラクタ
  constructor(
    private router: Router
    , private sAuth: AuthService
    , private sNotices: NoticesService
    , private sComponentControl: ComponentControlService
    , private sConfig: ConfigService) {

  }
  //#endregion

  //#region イベント

  //#region ngOnInit
  /**
   * 初期設定
   */
  async ngOnInit(): Promise<void> {
    this.version = this.sConfig.version;
    this.sComponentControl.onSharedIsContentPageChanged(false);
    await this.getNotices();

  }
  //#endregion

  ngOnDestroy(): void {
    this.sComponentControl.onSharedIsContentPageChanged(true);
  }

  //#endregion

  //#region メソッド

  //#region loginProcess
  /**
   * ログイン処理
   */
  public loginProcess(): void {
    this.sAuth.login(this.login.email, this.login.password)
      .then(() => {
        this.router.navigateByUrl(RouteName.REGISTER)
      })
      .catch((error) => {
        alert(error);
      });
  }
  //#endregion

  //#region getNotices
  /**
   * 更新情報を取得する
   */
  private async getNotices(): Promise<void> {

    this.isLoadFinished = false;

    // スケルトン表示のため、空の要素を設定する
    const empty: Notice = {
      version: '',
      detail: ['', ''],
      date: new Timestamp(0, 0),
    };
    this.notices.push(empty);
    this.notices.push(empty);
    this.notices.push(empty);

    const snaps = await this.sNotices.getNotices();

    this.notices = [];

    snaps.forEach((snap) => {
      this.notices.push(<Notice>snap.data());
    });

    // 読み込み終了
    this.isLoadFinished = true;
  }
  //#endregion

  //#endregion
}