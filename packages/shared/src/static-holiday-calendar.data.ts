import type { StaticHolidayCalendar } from "./static-holiday-calendar";

export const DEFAULT_STATUTORY_HOLIDAY_CALENDAR: StaticHolidayCalendar = {
  region: "CN",
  years: [
    {
      year: 2026,
      status: "verified",
      machineSource: {
        provider: "manual_from_authoritative_notice",
        url: "https://www.gov.cn/zhengce/content/202511/content_7047090.htm",
        syncedAt: "2026-05-22T00:00:00.000+08:00",
        coveredYears: [2026]
      },
      authorityVerification: {
        status: "verified",
        url: "https://www.gov.cn/zhengce/content/202511/content_7047090.htm",
        title: "国务院办公厅关于2026年部分节假日安排的通知",
        verifiedAt: "2026-05-22",
        documentNumber: "国办发明电〔2025〕7号"
      },
      holidays: [
        { name: "元旦", year: 2026, startDate: "2026-01-01", endDate: "2026-01-03" },
        { name: "春节", year: 2026, startDate: "2026-02-15", endDate: "2026-02-23" },
        { name: "清明节", year: 2026, startDate: "2026-04-04", endDate: "2026-04-06" },
        { name: "劳动节", year: 2026, startDate: "2026-05-01", endDate: "2026-05-05" },
        { name: "端午节", year: 2026, startDate: "2026-06-19", endDate: "2026-06-21" },
        { name: "中秋节", year: 2026, startDate: "2026-09-25", endDate: "2026-09-27" },
        { name: "国庆节", year: 2026, startDate: "2026-10-01", endDate: "2026-10-07" }
      ]
    },
    {
      year: 2027,
      status: "pending_publication",
      machineSource: {
        provider: "pending_authoritative_notice",
        url: "https://www.gov.cn/zhengce/",
        syncedAt: "2026-05-22T00:00:00.000+08:00",
        coveredYears: [2027]
      },
      authorityVerification: {
        status: "pending_publication"
      },
      holidays: []
    }
  ]
} as const;
