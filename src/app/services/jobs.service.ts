import { Injectable } from '@angular/core';
import { addDoc, collection, collectionGroup, DocumentData, getDocs, getFirestore, query, QuerySnapshot, where } from 'firebase/firestore';
import { Daily } from '../interfaces/document/daily';
import { Jobs } from '../interfaces/document/jobs';
import { DateUtil } from '../utilities/date-util';
import { DailyService } from './daily.service';
import { UrdayinService } from './urdayin.service';

@Injectable({
  providedIn: 'root'
})
export class JobsService {

  //#region 内部クラス

  public FIELD_NAME = class {
    public static readonly JOB: string = "job";
    public static readonly HOURS: string = "hours";
    public static readonly DATE: string = "date";
    public static readonly USER: string = "user";
    public static readonly INDEX: string = "index";
  }

  //#endregion

  //#region コンストラクタ
  constructor(private sUrdayin: UrdayinService, private sDaily: DailyService) {

  }
  //#endregion

  //#region メソッド

  //#region getData
  /**
   * 仕事データを取得する
   * @param email 対象のユーザーのメールアドレス
   * @param date 対象の年月日
   * @returns 仕事データ
   */
  public async getData(email: string, date: string): Promise<Jobs[]> {
    const db = getFirestore();
    const q = query(collection(db, this.sUrdayin.COLLECTION_NAME, email, this.sUrdayin.SUB_COLLECTION_NAME.DAILY, date, this.sDaily.SUB_COLLECTION_NAME.JOBS));
    const docs = await getDocs(q);
    return this.convertJobsArray(docs);
  }
  //#endregion

  //#region getDataForCsv
  /**
   * CSV出力用のデータを取得する
   * @param email 対象のユーザーのメールアドレス
   * @param yearmonth 対象の年月
   * @returns 出力対象のデータ
   */
  public async getDataForCsv(email: string, yearmonth: string): Promise<string[][]> {
    //１ヶ月分のデータを取得する
    const jobDocs: Jobs[] = await this.getDataOneMonth(email, yearmonth);

    //月の一日を取得する
    const firstDate: Date = DateUtil.getFirstDateFromYearMonth(yearmonth);

    //月の最終日を取得する
    const lastDate: Date = DateUtil.getLastDateFromYearMonth(yearmonth);

    //CSVに書き込む内容
    let contents: string[][] = [];
    let lineHeader: string[] = [];
    lineHeader.push("集約グループ");
    lineHeader.push("作業内容");

    //日単位で処理する
    const daysInMonth: number = lastDate.getDate();
    for (let i = 0; i < daysInMonth; i++) {

      //日付を取得する
      const tmpDate: Date = DateUtil.addDate(firstDate, i);
      const strTmpDate: string = DateUtil.toString(tmpDate);

      //ヘッダー行用
      lineHeader.push(strTmpDate);

      ///対象の仕事データを取得する
      const jobs: Jobs[] = jobDocs.filter(doc => doc.date === strTmpDate);

      //仕事データ単位で処理する
      jobs.forEach(job => {

        let targetIndex: number = contents.findIndex(line => line[0] === job.group_name && line[1] === job.job);
        let targetLine: string[] = [];
        let targetLineLength: number = 0;
        let maxEmptyColIndex: number = i;

        ///すでに格納されている場合は取り出す
        if (targetIndex >= 0) {
          targetLine = contents[targetIndex];
          targetLineLength = targetLine.length;
        }

        if (targetLineLength === 0) {
          //ない場合は作業内容を追加する
          targetLine.push(job.group_name);
          targetLine.push(job.job);
        } else {
          //ある場合は空白セルの列を１つずらす
          maxEmptyColIndex += 2;
        }

        //前日分までデータが存在しているか
        if (targetLineLength - 1 < (i + 2)) {
          //存在してない場合は、前日分まで０を追加する
          for (let j = targetLineLength; j < maxEmptyColIndex; j++) {
            targetLine.push("0");
          }
        }

        //処理日の工数を追加する
        targetLine.push(job.hours.toString());

        //CSVの内容として格納する
        if (targetIndex < 0) {
          contents.push(targetLine);
        } else {
          contents[targetIndex] = targetLine;
        }
      });
    }

    //集約グループ単位でソートする
    contents.sort(function (a, b) {
      //集約グループ名
      if (a[0] < b[0]) {
        return -1;
      }
      if (a[0] > b[0]) {
        return 1;
      }

      //作業内容
      if (a[1] < b[1]) {
        return -1;
      }

      if (a[1] > b[1]) {
        return 1;
      }

      return 0;
    });

    //日付のヘッダー行を追加する
    contents.unshift(lineHeader);

    return contents;
  }
  //#endregion

  //#region getDataOneMonth
  /**
   * １ヶ月分の仕事データを取得する
   * @param email 対象のユーザーのメールアドレス
   * @param yearmonth 対象の年月
   * @returns 対象のデータ
   */
  public async getDataOneMonth(email: string, yearmonth: string): Promise<Jobs[]> {
    const db = getFirestore();
    const q = query(collectionGroup(db, this.sDaily.SUB_COLLECTION_NAME.JOBS), where(this.FIELD_NAME.USER, "==", email), where(this.FIELD_NAME.DATE, ">=", yearmonth + "01"), where(this.FIELD_NAME.DATE, "<=", yearmonth + "31"));
    const docs = await getDocs(q);
    return this.convertJobsArray(docs);
  }
  //#endregion

  //#region insertJobData
  /**
   * 仕事データを登録する
   * @param inputData 
   * @param email 
   * @param date 
   */
  public insertJobData(inputData: Daily, email: string, date: string): void {
    const db = getFirestore();

    //仕事データ整形
    const jobs: Jobs[] = <Jobs[]>inputData.jobs;

    let index: number = 0;
    jobs.forEach(job => {

      //空の仕事データは処理スキップ
      if (this.isEmptyJobData(job)) {
        return;
      }

      //仕事データ整形
      job.user = email;
      job.date = date;
      job.index = index;
      index++;

      //仕事データを更新する
      const ref2 = collection(db, this.sUrdayin.COLLECTION_NAME, email, this.sUrdayin.SUB_COLLECTION_NAME.DAILY, date, this.sDaily.SUB_COLLECTION_NAME.JOBS);
      addDoc(ref2, job);
    });
  }
  //#endregion

  //#region isEmptyJobData
  /**
   * 空の仕事データか判定する
   * @param job 
   * @returns 
   */
  private isEmptyJobData(job: Jobs): boolean {
    //稼働０と仕事内容空白は空データと判定する
    if (job.hours === 0 && job.job === "") {
      return true;
    }
    return false;
  }
  //#endregion

  //#region convertJobsArray
  /**
   * スナップショットから仕事データ配列に変換する（ソート込み）
   * @param docs 
   * @returns 
   */
  private convertJobsArray(docs: QuerySnapshot<DocumentData>): Jobs[] {

    //配列に変換
    let jobs: Jobs[] = [];
    docs.forEach(snap => {
      jobs.push(<Jobs>snap.data());
    });

    //ソート
    jobs.sort((a, b) => (a.index === undefined ? 0 : a.index) - (b.index === undefined ? 0 : b.index));

    return jobs;
  }
  //#endregion

  //#region initializeSyokei
  /**
   * 小計カウント用配列を初期化する
   * （日付の数だけ要素を用意し、値には０を設定する）
   * @param daysInMonth 
   * @returns 
   */
  private initializeSyokei(daysInMonth: number): number[] {
    let syokei: number[] = [];

    for (let i = 0; i < daysInMonth; i++) {
      syokei.push(0);
    }

    return syokei;
  }
  //#endregion

  //#region stuffSyokeiRow
  /**
   * 小計行用配列に要素を入れる
   * @param groupName 
   * @param syokeiCount 
   * @returns 
   */
  private stuffSyokeiRow(groupName: string, syokeiCount: number[]): string[] {

    let syoukeiRow: string[] = [];
    syoukeiRow.push(groupName);
    syoukeiRow.push("小計");
    syokeiCount.forEach(dayHours => {
      syoukeiRow.push(dayHours.toString());
    });

    return syoukeiRow;
  }
  //#endregion

  //#endregion
}
