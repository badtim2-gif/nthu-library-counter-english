# 素材來源、第三方授權及著作權聲明

最後更新：2026-09-26

## 專案權利狀態

本專案目前未授予專案整體的開源或開放內容授權。除本文件明確列出的第三方素材外，原創程式、教學對話、翻譯、文法與單字編排及視覺設計，由各自適法權利人保留權利。公開放置於 GitHub 不等於授權他人重製、散布、改作或商業利用；完整邊界見專案根目錄的 `LICENSE`。

本網站目前發布於個人 GitHub Pages 網域，並非清大官方網域。該部署位置本身不證明校方已核定為官方網站，也不代表校方已對著作權或商標作出授權。職務上完成之著作的著作人與著作財產權歸屬，應依適用法律、契約與校方核定判斷；本頁不代替權利人或校方作成最終聲明。第三方素材仍依各自授權條款利用。

## 教學內容及官方資料來源

二十個教學情境由本專案依國立清華大學圖書館公開服務資訊重新整理及改寫，並非官方規章原文。每一課在網站內顯示對應來源與查核日期；服務資格、期限與流程如有變動，仍以官方網站最新公告為準。

目前引用的官方頁面包括：

- [權益聲明與召回政策](https://www.lib.nthu.edu.tw/en/use/privileges_sign.html)
- [電子資源常見問題](https://www.lib.nthu.edu.tw/en/use/faq/q_a5.html)
- [館際合作服務](https://www.lib.nthu.edu.tw/en/use/interlibrary.html)
- [指定參考書服務](https://www.lib.nthu.edu.tw/en/research/reserve.html)
- [館藏薦購](https://www.lib.nthu.edu.tw/en/resource/rams.html)
- [畢業程序](https://www.lib.nthu.edu.tw/en/use/before_graduated.html)
- [圖書館公告](https://www.lib.nthu.edu.tw/news/list_en.html)
- [圖書館借書證申請](https://www.lib.nthu.edu.tw/en/use/id_application.html)
- [大學生與交換生服務](https://www.lib.nthu.edu.tw/en/use/identity/undergra.html)
- [入館須知](https://www.lib.nthu.edu.tw/en/use/in_lib_service.html)
- [圖書資料借還常問問題](https://www.lib.nthu.edu.tw/en/use/faq/q_a2.html)
- [借還書服務說明](https://www.lib.nthu.edu.tw/en/use/borrow_n_return.html)
- [館藏狀態常問問題](https://www.lib.nthu.edu.tw/en/use/faq/q_a3.html)
- [讀者討論室使用須知](https://www.lib.nthu.edu.tw/en/use/policies/policy18.html)
- [無線網路常問問題](https://www.lib.nthu.edu.tw/en/use/faq/q_a8.html)
- [影印服務常問問題](https://www.lib.nthu.edu.tw/en/use/faq/q_a12.html)
- [委託代借圖書資料規定](https://www.lib.nthu.edu.tw/en/use/policies/policy20.html)

政策資料查核日期記錄於 `app/scenarios.ts`。

## 語音素材

### 教學合成語音

對話、句型、文法及單字的 682 個預錄音檔，由本專案自行編寫或改寫的文字稿，以本機執行的 Kokoro 開源語音模型產生，並非擷取自有聲書、影片或真人錄音。

使用的模型及聲線：

- 英文讀者：Kokoro-82M v1.0，`am_fenrir`
- 英文館員：Kokoro-82M-v1.1-zh，`af_maple`
- 英文解說：Kokoro-82M v1.0，`am_puck`
- 中文讀者、館員及解說：Kokoro-82M-v1.1-zh，`zm_010`

兩個模型倉庫均標示採 [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)（專案內保存授權全文：`public/audio/KOKORO-APACHE-2.0.txt`）；模型來源為 [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) 與 [hexgrad/Kokoro-82M-v1.1-zh](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh)。產製時固定模型修訂版與權重雜湊；英文基礎語速為 0.8、中文為 0.9，英文長句再校正至約 120 WPM。成品統一為 24 kHz、單聲道、48 kbps MP3，並進行響度與真峰值檢查。

每個音檔的文字、模型、聲線、速度及用途記錄於 `tests/audio-manifest.json`；模型版本、聲線雜湊、逐檔成品 SHA-256 與技術檢查結果記錄於 `public/audio/kokoro-audio-sources.json` 及 `public/audio/audio-report.json`。聲線名稱僅為模型內部識別碼，不表示任何真人參與、代言或背書。這批音檔在本機離線產生，不需使用 Azure 帳號或付費語音服務。

### 真人 A–Z 字母錄音

- 作品：A-Z Male Voice
- 作者：Brannon Wyndesor
- 來源：https://opengameart.org/content/a-z-male-voice
- 授權：[Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/)
- 修改：轉換為 24 kHz 單聲道 MP3、響度正規化、加入首尾安全靜音，並將 B 額外降低 2 dB。

加工後的字母音檔依相同 CC BY-SA 3.0 條件提供。完整來源檔雜湊、加工參數及成品雜湊記錄於 `public/audio/alphabet-audio-sources.json`。若再散布這 26 個音檔或其改作，應保留作者與來源標示、連結授權條款、說明修改，並依相同授權分享改作。此義務適用於字母錄音及其改作，不會僅因音檔與其他獨立檔案一併收錄，就自動將整個網站改授權為 CC BY-SA。

## 圖像素材

目前網站使用的應用程式圖示 `public/img_20260726120102.png` 及社群分享圖 `public/og.png` 為本專案製作的識別圖像，未使用第三方攝影作品或圖庫照片。

## 開源軟體

正式執行的直接套件包括：

| 套件 | 固定版本 | 授權 |
| --- | ---: | --- |
| Next.js | 16.2.6 | MIT |
| React | 19.2.6 | MIT |
| React DOM | 19.2.6 | MIT |
| Drizzle ORM | 0.45.2 | Apache-2.0 |

建置與間接依賴另包含 MIT、Apache-2.0、BSD、ISC、0BSD、CC BY 4.0，以及 Apache-2.0／LGPL 授權元件。完整版本由 `package.json` 及 `pnpm-lock.yaml` 固定；各套件仍依其原始授權條款利用。可在安裝鎖定版本依賴後執行 `pnpm licenses list --prod` 產生當次完整清單。

## 名稱、標誌與免責聲明

「國立清華大學」、「清大」、「NTHU」、圖書館名稱、校徽及標準字的權利由校方依法管理；本專案無權且不嘗試對第三人授予任何校方商標權利。如欲將相關名稱或標誌用於其他專案、宣傳或商業活動，應依[《國立清華大學商標使用管理要點》](https://www.nthu.edu.tw/files/cis/trademarkofnthu.pdf)向校方確認授權，或自行確認是否符合適用法律之合理使用。不得暗示校方授權、贊助、推薦或背書。

本網站為圖書館英語教育與服務訓練用的教學練習工具，並非校方政策或規章的正式發布頁面，不取代正式規章、個案審查或館員答覆。
