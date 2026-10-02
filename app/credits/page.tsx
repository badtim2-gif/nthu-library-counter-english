import type { Metadata } from "next";
import { assetPath } from "../paths";
import { CHECKED_AT, scenarios } from "../scenarios";

export const metadata: Metadata = {
  title: "素材來源與授權｜清大圖書館英語情境練習室",
  description: "清大圖書館英語情境練習室的素材來源、第三方授權及著作權聲明。",
};

const officialSources = Array.from(
  new Map(
    scenarios.map((scenario) => [
      scenario.sourceUrl,
      { label: scenario.sourceLabel, url: scenario.sourceUrl },
    ]),
  ).values(),
).sort((a, b) => a.label.localeCompare(b.label, "zh-Hant"));

const syntheticVoices = [
  ["英文讀者", "Kokoro-82M v1.0 / am_fenrir"],
  ["英文館員", "Kokoro-82M-v1.1-zh / af_maple"],
  ["英文解說", "Kokoro-82M v1.0 / am_puck"],
  ["中文讀者／館員／解說", "Kokoro-82M-v1.1-zh / zm_010"],
] as const;

export default function CreditsPage() {
  return (
    <main className="credits-page">
      <header className="credits-hero">
        <a className="credits-back" href={assetPath("/")}>← 返回英語情境練習室</a>
        <p className="credits-eyebrow">SOURCES · LICENSES · COPYRIGHT</p>
        <h1>素材來源、第三方授權及著作權聲明</h1>
        <p>
          本頁說明網站教學內容、語音、視覺素材及軟體套件的來源與利用條件。
          政策資料最後查核日期為 <time dateTime={CHECKED_AT}>{CHECKED_AT}</time>。
        </p>
      </header>

      <div className="credits-content">
        <section className="credits-card" aria-labelledby="copyright-heading">
          <h2 id="copyright-heading">專案權利狀態</h2>
          <p>
            本專案目前未授予專案整體的開源或開放內容授權。除另有標示的第三方素材外，原創程式、教學對話、翻譯、文法與單字編排及視覺設計，由各自適法權利人保留權利。公開放置於 GitHub 不等於授權他人重製、散布、改作或商業利用。
          </p>
          <p className="credits-note">
            本網站目前發布於個人 GitHub Pages 網域，並非清大官方網域。該部署位置本身不證明校方已核定為官方網站，也不代表校方已對著作權或商標作出授權。職務著作的權利歸屬，應依法、契約與校方核定判斷。
            {" "}<a href="https://github.com/badtim2-gif/nthu-library-counter-english/blob/main/LICENSE" target="_blank" rel="noreferrer">閱讀專案 LICENSE ↗</a>
          </p>
        </section>

        <section className="credits-card" aria-labelledby="content-heading">
          <h2 id="content-heading">教學內容與政策資料</h2>
          <p>
            二十個情境依清大圖書館公開服務資訊重新整理及改寫，並非官方規章原文。
            每一課均附資料來源；服務資格、期限與流程如有變動，仍以官方網站最新公告為準。
          </p>
          <ul className="source-list">
            {officialSources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="credits-card" aria-labelledby="audio-heading">
          <h2 id="audio-heading">語音素材</h2>
          <h3>教學合成語音</h3>
          <p>
            對話、句型、文法及單字的 682 個預錄音檔，由本專案自行編寫或改寫的文字稿，
            以本機執行的 Kokoro 開源語音模型產生，並非擷取自有聲書、影片或真人錄音。
          </p>
          <dl className="voice-list">
            {syntheticVoices.map(([role, voice]) => (
              <div key={voice}><dt>{role}</dt><dd><code>{voice}</code></dd></div>
            ))}
          </dl>
          <p className="credits-note">
            使用的 <a href="https://huggingface.co/hexgrad/Kokoro-82M" target="_blank" rel="noreferrer">Kokoro-82M v1.0</a>
            {" "}與 <a href="https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh" target="_blank" rel="noreferrer">Kokoro-82M-v1.1-zh</a>
            {" "}模型倉庫均標示採 Apache License 2.0。模型修訂版、權重及聲線雜湊、逐檔成品 SHA-256 與技術驗證結果，
            記錄於公開專案的 <code>kokoro-audio-sources.json</code> 及 <code>audio-report.json</code>。
            <a href={assetPath("/audio/KOKORO-APACHE-2.0.txt")}>下載 Apache 2.0 授權全文</a>。
            聲線名稱僅為模型內部識別碼，不表示任何真人參與、代言或背書；本批音檔在本機離線產生，未使用 Azure 語音服務。
          </p>

          <h3>真人 A–Z 字母錄音</h3>
          <p>
            字母 A–Z 使用 <a href="https://www.wyndesor.com" target="_blank" rel="noreferrer">Brannon Wyndesor</a> 的
            {" "}<a href="https://opengameart.org/content/a-z-male-voice" target="_blank" rel="noreferrer">A-Z Male Voice</a>，
            依 <a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a> 授權。
          </p>
          <p>
            本專案將原始 WAV 轉為 24 kHz 單聲道 MP3、進行響度正規化、加入首尾安全靜音，
            並將 B 額外降低 2 dB。加工後的字母音檔依相同 CC BY-SA 3.0 條件提供；
            完整雜湊及加工參數記錄於公開專案的 <code>alphabet-audio-sources.json</code>。
          </p>
          <p className="credits-note">
            若再散布字母音檔或其改作，應保留作者與來源標示、連結授權、說明修改，並對改作採相同授權。這些義務適用於字母錄音及其改作，不會自動將整個網站或獨立程式碼改授權為 CC BY-SA。
          </p>

        </section>

        <section className="credits-card" aria-labelledby="software-heading">
          <h2 id="software-heading">軟體與第三方套件</h2>
          <p>
            網站以 Next.js、React、React DOM 及 Drizzle ORM 等開源軟體建置。
            主要授權為 MIT 或 Apache-2.0；間接依賴另包含 BSD、ISC、0BSD、CC BY 4.0，
            以及建置工具所使用的 Apache-2.0／LGPL 元件。各套件仍依其原始授權條款利用。
          </p>
          <p>
            套件版本固定於 <code>pnpm-lock.yaml</code>；較完整的第三方說明見專案
            {" "}<a href="https://github.com/badtim2-gif/nthu-library-counter-english/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noreferrer">THIRD_PARTY_NOTICES.md ↗</a>。
          </p>
          <p>
            <a href={assetPath("/third-party-packages.json")}>下載完整正式套件授權清單（JSON）</a>
          </p>
        </section>

        <section className="credits-card" aria-labelledby="visual-heading">
          <h2 id="visual-heading">圖像、名稱與聲明</h2>
          <p>
            應用程式圖示與社群分享圖為本專案製作的識別圖像；網站未使用第三方攝影作品或圖庫照片。校名、圖書館名稱、校徽與標準字的權利由校方依法管理；本專案無權且不嘗試對第三人授予任何校方商標權利。
          </p>
          <p>
            如欲將相關名稱或標誌用於其他專案、宣傳或商業活動，應依
            {" "}<a href="https://www.nthu.edu.tw/files/cis/trademarkofnthu.pdf" target="_blank" rel="noreferrer">《國立清華大學商標使用管理要點》↗</a>
            {" "}向校方確認授權，或自行確認是否符合適用法律之合理使用；不得暗示校方授權、贊助、推薦或背書。
            本網站並非校方政策或規章的正式發布頁面，不取代正式規章、個案審查或館員答覆。
            發現來源、授權或內容標示有誤時，請透過清大圖書館官方聯絡管道反映，以便查核及修正。
          </p>
        </section>
      </div>

      <footer className="credits-footer">
        <a href={assetPath("/")}>返回首頁</a>
        <span>最後更新：2026-09-26</span>
      </footer>
    </main>
  );
}
