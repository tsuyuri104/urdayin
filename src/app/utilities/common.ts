import { DatePipe } from "@angular/common"

export class Common {

    //#region dateToString
    /**
     * 日付型を文字列に変換する
     * @param date 
     * @returns 文字列yyyyMMdd
     */
    public static dateToString(date: Date): string {
        return this.dateToStringFormat(date, 'yyyyMMdd');
    }
    //#endregion

    //#region dateToStringYearMonth
    /**
     * 日付を文字列に変換する（年月用）
     * @param date 
     * @returns 文字列yyyyMM
     */
    public static dateToStringYearMonth(date: Date): string {
        return this.dateToStringFormat(date, 'yyyyMM');
    }
    //#endregion

    //#region stringToDate
    /**
     * 文字列から日付型に変換する
     * @param strDate 文字列yyyyMMdd
     * @returns 日付型
     */
    public static stringToDate(strDate: string): Date {
        const y: number = Number(strDate.substring(0, 4));
        const m: number = Number(strDate.substring(4, 6)) - 1;
        const d: number = Number(strDate.substring(6, 8));
        return new Date(y, m, d);
    }
    //#endregion

    //#region dateToStringFormat
    /**
     * 日付を指定のフォーマットで文字列に変換する
     * @param date 
     * @param format 
     * @returns 
     */
    private static dateToStringFormat(date: Date, format: string): string {
        const datepipe: DatePipe = new DatePipe('en-US');
        let formatted: string | null = datepipe.transform(date, format);
        return formatted == null ? "" : formatted;
    }
    //#endregion
}
