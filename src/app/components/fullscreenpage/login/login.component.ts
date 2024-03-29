import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router'
import { RouteName } from 'src/app/consts/route-name';
import { InputsOfLogin } from 'src/app/interfaces/component/input-of-frm-login';
import { Notice } from 'src/app/interfaces/document/notice';
import { AuthService } from 'src/app/services/auth.service';
import { NoticesService } from 'src/app/services/notices.service';
import { ConfigService } from 'src/app/services/config.service';
import { Timestamp } from 'firebase/firestore';
import { DateUtil } from 'src/app/utilities/date-util';

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
  public isLoaded: boolean = false;

  //#endregion

  //#region コンストラクタ
  constructor(
    private router: Router
    , private sAuth: AuthService
    , private sNotices: NoticesService
    , private sConfig: ConfigService) {

  }
  //#endregion

  //#region イベント

  //#region ngOnInit
  /**
   * 初期設定
   */
  public ngOnInit(): void {
    this.version = this.sConfig.version;
    this.getNotices();
  }
  //#endregion

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

  //#region isWithinFewDays
  /**
   * 最近の更新情報か判定する
   * @param ts リリース日（タイムスタンプ型）
   * @returns 
   */
  public isWithinFewDays(ts: Timestamp): boolean {
    const noticeDate: Date = ts.toDate();
    const today: Date = new Date();
    const fewDaysAgo: Date = DateUtil.addDate(today, -3);
    return noticeDate > fewDaysAgo;
  }
  //#endregion

  //#region getNotices
  /**
   * 更新情報を取得する
   */
  private async getNotices(): Promise<void> {

    this.isLoaded = false;

    // スケルトン表示のため、空の要素を設定する
    const empty: Notice = {
      version: '',
      detail: ['', ''],
      date: new Timestamp(0, 0),
    };
    this.notices.push(empty);
    this.notices.push(empty);
    this.notices.push(empty);

    this.sNotices.getNotices()
      .subscribe(snaps => {
        this.notices = [];
        snaps.forEach((snap) => {
          this.notices.push(snap);
        });

        // 読み込み終了
        this.isLoaded = true;
      });

  }
  //#endregion

  //#endregion
}
