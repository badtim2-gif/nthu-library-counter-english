export type Role = "reader" | "librarian";

export type DialogueTurn = {
  role: Role;
  en: string;
  zh: string;
};

export type Pattern = {
  form: string;
  example: string;
  explanation: string;
};

export type GrammarPoint = {
  title: string;
  explanation: string;
};

export type VocabularyItem = {
  word: string;
  kk: string;
  meaning: string;
  pos: "n." | "v." | "adj." | "adv." | "prep." | "conj." | "phr.";
};

export type Scenario = {
  id: number;
  shortTitle: string;
  title: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  dialogue: DialogueTurn[];
  patterns: Pattern[];
  grammar: GrammarPoint[];
  vocabulary: VocabularyItem[];
};

export const CHECKED_AT = "2026-07-27";

export const scenarios: Scenario[] = [
  {
    id: 1,
    shortTitle: "首次啟用",
    title: "首次啟用圖書館權益聲明",
    summary: "協助第一次借書的讀者完成權益聲明並啟用借閱權限。",
    sourceLabel: "權益聲明與召回政策",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/privileges_sign.html",
    dialogue: [
      {
        role: "reader",
        en: "This is my first time borrowing books at the NTHU Library.",
        zh: "這是我第一次在清華大學圖書館借書。",
      },
      {
        role: "librarian",
        en: "Before you use the service, please sign the Statement [ˋstetmənt] of Patron's Privileges [ˋprɪvəlɪdʒɪz] online.",
        zh: "使用服務前，請先在線上簽署讀者權益聲明。",
      },
      {
        role: "reader",
        en: "Why do I need to complete [kəmˋplit] the statement?",
        zh: "我為什麼需要完成這份聲明？",
      },
      {
        role: "librarian",
        en: "It confirms [kənˋfɝmz] that you understand the borrowing regulations [͵rɛgjəˋleʃənz] and that your contact information is current.",
        zh: "它用來確認您了解借閱規定，而且聯絡資料是最新的。",
      },
      {
        role: "reader",
        en: "Will my borrowing privileges become active [ˋæktɪv] immediately [ɪˋmidɪətlɪ]?",
        zh: "我的借閱權限會立刻啟用嗎？",
      },
      {
        role: "librarian",
        en: "Yes, after signing in with your NTHU account and submitting [səbˋmɪtɪŋ] the statement, you may borrow materials.",
        zh: "會的，使用清華大學帳號登入並送出聲明後，您就可以借閱資料。",
      },
    ],
    patterns: [
      {
        form: "This is my first time + V-ing...",
        example: "This is my first time using this library card.",
        explanation: "用來表示第一次進行某項活動，後面接動名詞。",
      },
      {
        form: "Before you..., please...",
        example: "Before you borrow the book, please check your account.",
        explanation: "用來有禮貌地說明先後順序，先完成前項條件，再進行後項。",
      },
      {
        form: "Will ... become active immediately?",
        example: "Will my account become active immediately?",
        explanation: "用來詢問權限或服務是否會立即生效。",
      },
    ],
    grammar: [
      {
        title: "動名詞作為補語",
        explanation: "表示第一次做某事時，第一次之後可接動名詞，描述正在談論的活動。",
      },
      {
        title: "時間副詞子句",
        explanation: "表示在某動作之前時，時間子句使用現在式，主要子句再表達請求或結果。",
      },
    ],
    vocabulary: [
      { word: "statement", kk: "ˋstetmənt", meaning: "聲明", pos: "n." },
      { word: "patron", kk: "ˋpetrən", meaning: "讀者、使用者", pos: "n." },
      { word: "privilege", kk: "ˋprɪvəlɪdʒ", meaning: "權益、權限", pos: "n." },
      { word: "complete", kk: "kəmˋplit", meaning: "完成", pos: "v." },
      { word: "confirm", kk: "kənˋfɝm", meaning: "確認", pos: "v." },
      { word: "regulation", kk: "͵rɛgjəˋleʃən", meaning: "規定、規章", pos: "n." },
      { word: "submit", kk: "səbˋmɪt", meaning: "提交、送出", pos: "v." },
    ],
  },
  {
    id: 2,
    shortTitle: "館藏召回",
    title: "館藏被預約後的召回與新到期日",
    summary: "解釋召回通知、縮短後的到期日與讀者應採取的行動。",
    sourceLabel: "權益聲明與召回政策",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/privileges_sign.html",
    dialogue: [
      {
        role: "reader",
        en: "I received [rɪˋsivd] a recall [rɪˋkɔl] notice for a book that is not due yet.",
        zh: "我收到一本尚未到期書籍的召回通知。",
      },
      {
        role: "librarian",
        en: "Another reader has placed a hold, so the due date has been shortened [ˋʃɔrtənd].",
        zh: "另一位讀者已預約這本書，所以到期日縮短了。",
      },
      {
        role: "reader",
        en: "How is the revised [rɪˋvaɪzd] due date calculated [ˋkælkjə͵letɪd]?",
        zh: "新的到期日是如何計算的？",
      },
      {
        role: "librarian",
        en: "If more than fourteen days remained [rɪˋmend], the new due date is fourteen days from the recall request.",
        zh: "如果原本剩餘超過十四天，新到期日就是從召回申請日起算十四天。",
      },
      {
        role: "reader",
        en: "What happens if fewer than fourteen days remain?",
        zh: "如果剩不到十四天，會怎麼處理？",
      },
      {
        role: "librarian",
        en: "The original [əˋrɪdʒən!] due date stays the same, so please check your account and email regularly [ˋrɛgjəlɚlɪ].",
        zh: "原到期日會維持不變，因此請定期查看帳戶與電子郵件。",
      },
    ],
    patterns: [
      {
        form: "I received a notice for...",
        example: "I received a notice for this borrowed book.",
        explanation: "用來說明收到與特定館藏或服務有關的通知。",
      },
      {
        form: "How is ... calculated?",
        example: "How is the new due date calculated?",
        explanation: "用被動語態詢問日期、費用或數量的計算方式。",
      },
      {
        form: "What happens if...?",
        example: "What happens if I return it tomorrow?",
        explanation: "用來詢問某個條件發生時會有什麼結果。",
      },
    ],
    grammar: [
      {
        title: "現在完成式",
        explanation: "表示已經完成而且影響目前狀態的動作，例如他人已經預約館藏。",
      },
      {
        title: "條件句",
        explanation: "說明實際可能發生的條件時，條件子句使用現在式，主要子句說明其結果。",
      },
    ],
    vocabulary: [
      { word: "receive", kk: "rɪˋsiv", meaning: "收到", pos: "v." },
      { word: "recall", kk: "rɪˋkɔl", meaning: "召回", pos: "n." },
      { word: "shorten", kk: "ˋʃɔrtən", meaning: "縮短", pos: "v." },
      { word: "revised", kk: "rɪˋvaɪzd", meaning: "修訂後的", pos: "adj." },
      { word: "calculate", kk: "ˋkælkjə͵let", meaning: "計算", pos: "v." },
      { word: "remain", kk: "rɪˋmen", meaning: "剩餘、維持", pos: "v." },
      { word: "regularly", kk: "ˋrɛgjəlɚlɪ", meaning: "定期地", pos: "adv." },
    ],
  },
  {
    id: 3,
    shortTitle: "校外資源",
    title: "校外使用電子資源及校友限制",
    summary: "說明現職教職員生與校友使用授權電子資源的不同方式。",
    sourceLabel: "電子資源常見問題",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/faq/q_a5.html",
    dialogue: [
      {
        role: "reader",
        en: "I am an alumnus [əˋlʌmnəs], and I cannot access [ˋæksɛs] an electronic journal from home.",
        zh: "我是校友，目前無法從家中使用電子期刊。",
      },
      {
        role: "librarian",
        en: "Remote [rɪˋmot] access to licensed [ˋlaɪsənst] resources is limited to current NTHU faculty, staff, and students.",
        zh: "授權資源的校外使用僅限清華大學現職教職員生。",
      },
      {
        role: "reader",
        en: "Is there another way for alumni [əˋlʌmnaɪ] to use these resources?",
        zh: "校友還有其他方式可以使用這些資源嗎？",
      },
      {
        role: "librarian",
        en: "You are welcome to use the public computers inside the library.",
        zh: "歡迎您到館內使用公共電腦。",
      },
      {
        role: "reader",
        en: "How do current students connect [kəˋnɛkt] from off campus?",
        zh: "在校學生要如何從校外連線？",
      },
      {
        role: "librarian",
        en: "They may use the university VPN or sign in to their library account through e Search.",
        zh: "他們可以使用學校虛擬私人網路，或從電子資源整合查詢登入圖書館帳戶。",
      },
    ],
    patterns: [
      {
        form: "I cannot access...",
        example: "I cannot access the full text from home.",
        explanation: "用來說明無法開啟特定系統、資料庫或全文。",
      },
      {
        form: "... is limited to...",
        example: "Remote access is limited to current students.",
        explanation: "用來清楚說明服務的適用資格或限制範圍。",
      },
      {
        form: "Is there another way to...?",
        example: "Is there another way to read this article?",
        explanation: "在原方法不可行時，用來詢問替代方案。",
      },
    ],
    grammar: [
      {
        title: "被動語態表達限制",
        explanation: "說明服務受到規定限制時，使用被動語態能將焦點放在服務本身。",
      },
      {
        title: "情態動詞表達可行方法",
        explanation: "說明使用者可以採取的選項時，可使用情態動詞加原形動詞。",
      },
    ],
    vocabulary: [
      { word: "alumnus", kk: "əˋlʌmnəs", meaning: "男性校友", pos: "n." },
      { word: "alumni", kk: "əˋlʌmnaɪ", meaning: "校友們", pos: "n." },
      { word: "access", kk: "ˋæksɛs", meaning: "使用、存取", pos: "v." },
      { word: "remote", kk: "rɪˋmot", meaning: "遠端的、校外的", pos: "adj." },
      { word: "licensed", kk: "ˋlaɪsənst", meaning: "經授權的", pos: "adj." },
      { word: "electronic", kk: "ɪ͵lɛkˋtrɑnɪk", meaning: "電子的", pos: "adj." },
      { word: "connect", kk: "kəˋnɛkt", meaning: "連線", pos: "v." },
    ],
  },
  {
    id: 4,
    shortTitle: "館際借書",
    title: "館際借書取件與正確歸還方式",
    summary: "協助讀者取件，並提醒館際借書不可投入還書箱或自助還書機。",
    sourceLabel: "館際合作服務",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/interlibrary.html",
    dialogue: [
      {
        role: "reader",
        en: "I received a pickup [ˋpɪk͵ʌp] notice for an interlibrary [͵ɪntɚˋlaɪ͵brɛrɪ] loan.",
        zh: "我收到館際借書的取件通知。",
      },
      {
        role: "librarian",
        en: "Please collect [kəˋlɛkt] it at the appointed [əˋpɔɪntɪd] information desk during service hours.",
        zh: "請在服務時間內到指定的服務櫃檯領取。",
      },
      {
        role: "reader",
        en: "May I return the book through the self service machine or the book drop?",
        zh: "我可以透過自助還書機或還書箱歸還嗎？",
      },
      {
        role: "librarian",
        en: "No, loaned [lond] materials from another library must be returned to the information desk before the expiration [͵ɛkspəˋreʃən] date.",
        zh: "不可以，向他館借來的資料必須在期限前歸還服務櫃檯。",
      },
      {
        role: "reader",
        en: "Do I also need to return a photocopy [ˋfoto͵kɑpɪ]?",
        zh: "影印本也需要歸還嗎？",
      },
      {
        role: "librarian",
        en: "You may keep the copy, but the borrowed book must be returned on time to avoid overdue charges [ˋtʃɑrdʒɪz].",
        zh: "影印本可以保留，但借來的書必須準時歸還，以免產生逾期費用。",
      },
    ],
    patterns: [
      {
        form: "I received a pickup notice for...",
        example: "I received a pickup notice for my requested article.",
        explanation: "用來向櫃台說明已收到可領取資料的通知。",
      },
      {
        form: "May I return ... through...?",
        example: "May I return this item through the book drop?",
        explanation: "用來有禮貌地確認某種歸還方式是否可行。",
      },
      {
        form: "... must be returned to...",
        example: "The book must be returned to the information desk.",
        explanation: "用來強調資料必須歸還至指定地點。",
      },
    ],
    grammar: [
      {
        title: "情態動詞表達禮貌詢問",
        explanation: "向櫃台確認是否獲准進行某事時，可用較正式的情態動詞開頭。",
      },
      {
        title: "被動語態表達必要規定",
        explanation: "規定物品必須被歸還到特定地點時，可用被動語態搭配表示義務的情態動詞。",
      },
    ],
    vocabulary: [
      { word: "pickup", kk: "ˋpɪk͵ʌp", meaning: "取件、領取", pos: "n." },
      { word: "interlibrary", kk: "͵ɪntɚˋlaɪ͵brɛrɪ", meaning: "圖書館際的", pos: "adj." },
      { word: "collect", kk: "kəˋlɛkt", meaning: "領取、收集", pos: "v." },
      { word: "appointed", kk: "əˋpɔɪntɪd", meaning: "指定的", pos: "adj." },
      { word: "loaned", kk: "lond", meaning: "借出的", pos: "adj." },
      { word: "expiration", kk: "͵ɛkspəˋreʃən", meaning: "到期、期限屆滿", pos: "n." },
      { word: "photocopy", kk: "ˋfoto͵kɑpɪ", meaning: "影印本", pos: "n." },
      { word: "charge", kk: "tʃɑrdʒ", meaning: "費用", pos: "n." },
    ],
  },
  {
    id: 5,
    shortTitle: "指定參考書",
    title: "指定參考書查詢與使用",
    summary: "引導讀者依課程或教師查找指定參考書，並說明其短期使用性質。",
    sourceLabel: "指定參考書服務",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/research/reserve.html",
    dialogue: [
      {
        role: "reader",
        en: "My professor assigned [əˋsaɪnd] a book that is on course reserve [rɪˋzɝv].",
        zh: "我的教授指定了一本列為課程指定參考書的書。",
      },
      {
        role: "librarian",
        en: "You can search for reserve materials by department, instructor [ɪnˋstrʌktɚ], or course name.",
        zh: "您可以依系所、教師或課程名稱查詢指定參考資料。",
      },
      {
        role: "reader",
        en: "Where can I locate [ˋloket] the book after I find the record?",
        zh: "找到紀錄後，我可以到哪裡找到這本書？",
      },
      {
        role: "librarian",
        en: "Approved [əˋpruvd] reserve items are placed on the Smart Bookshelf at the designated [ˋdɛzɪg͵netɪd] library location.",
        zh: "核准的指定參考書會放在指定館舍的智慧書架。",
      },
      {
        role: "reader",
        en: "Can every type of library material be placed on reserve?",
        zh: "所有類型的圖書館資料都可以列為指定參考資料嗎？",
      },
      {
        role: "librarian",
        en: "Current journals, theses, and dissertations [͵dɪsɚˋteʃənz] cannot be placed on reserve.",
        zh: "當期期刊、碩士論文與博士論文不能列為指定參考資料。",
      },
    ],
    patterns: [
      {
        form: "... is on course reserve.",
        example: "This textbook is on course reserve.",
        explanation: "用來說明某項資料已列入課程指定參考書。",
      },
      {
        form: "You can search by...",
        example: "You can search by instructor or course name.",
        explanation: "用來說明查詢系統可使用的檢索欄位。",
      },
      {
        form: "Can every type of ... be...?",
        example: "Can every type of material be borrowed?",
        explanation: "用來確認某項規則是否適用於全部類型。",
      },
    ],
    grammar: [
      {
        title: "介系詞表示資料狀態",
        explanation: "表示資料被列為課程指定參考書時，可使用介系詞片語描述其服務狀態。",
      },
      {
        title: "被動語態表示館方處理",
        explanation: "強調資料被放置或被指定的結果時，可使用被動語態，不必特別指出執行者。",
      },
    ],
    vocabulary: [
      { word: "assign", kk: "əˋsaɪn", meaning: "指定、指派", pos: "v." },
      { word: "reserve", kk: "rɪˋzɝv", meaning: "保留、指定參考", pos: "n." },
      { word: "instructor", kk: "ɪnˋstrʌktɚ", meaning: "授課教師", pos: "n." },
      { word: "locate", kk: "ˋloket", meaning: "找到位置", pos: "v." },
      { word: "approved", kk: "əˋpruvd", meaning: "經核准的", pos: "adj." },
      { word: "designated", kk: "ˋdɛzɪg͵netɪd", meaning: "指定的", pos: "adj." },
      { word: "dissertation", kk: "͵dɪsɚˋteʃən", meaning: "博士論文", pos: "n." },
    ],
  },
  {
    id: 6,
    shortTitle: "館藏薦購",
    title: "館藏薦購、進度查詢與核准後預約",
    summary: "協助讀者提出薦購、掌握每月額度並追蹤處理結果。",
    sourceLabel: "館藏薦購",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/resource/rams.html",
    dialogue: [
      {
        role: "reader",
        en: "I would like to recommend [͵rɛkəˋmɛnd] an electronic book that is not in the collection [kəˋlɛkʃən].",
        zh: "我想薦購一本館藏目前沒有的電子書。",
      },
      {
        role: "librarian",
        en: "Please sign in to the library system and provide complete publication [͵pʌblɪˋkeʃən] information.",
        zh: "請登入圖書館系統，並提供完整的出版資訊。",
      },
      {
        role: "reader",
        en: "Is there a monthly [ˋmʌnθlɪ] limit on recommendations [͵rɛkəmɛnˋdeʃənz]?",
        zh: "每月的薦購數量有限制嗎？",
      },
      {
        role: "librarian",
        en: "Each person may recommend up to five items per month.",
        zh: "每人每月最多可以薦購五項資料。",
      },
      {
        role: "reader",
        en: "How can I track [træk] the progress and know whether it is approved?",
        zh: "我要如何追蹤進度並確認是否獲得核准？",
      },
      {
        role: "librarian",
        en: "Check your library account, and watch for email notifications [͵notəfəˋkeʃənz] because an approved item will be placed on hold for you.",
        zh: "請查看圖書館帳戶並留意電子郵件通知，獲准採購的資料會為您辦理預約。",
      },
    ],
    patterns: [
      {
        form: "I would like to recommend...",
        example: "I would like to recommend a new database.",
        explanation: "用來有禮貌地提出薦購某項館藏或資源。",
      },
      {
        form: "Is there a limit on...?",
        example: "Is there a limit on monthly requests?",
        explanation: "用來詢問數量、次數或資格是否有限制。",
      },
      {
        form: "How can I track...?",
        example: "How can I track the progress of my request?",
        explanation: "用來詢問如何查詢申請或服務的處理進度。",
      },
    ],
    grammar: [
      {
        title: "較委婉的意願表達",
        explanation: "向櫃台提出需求時，使用較委婉的說法，比直接使用現在式更有禮貌。",
      },
      {
        title: "數量上限的表達",
        explanation: "表示最多可申請的數量時，可使用表示上限的片語加數字。",
      },
    ],
    vocabulary: [
      { word: "recommend", kk: "͵rɛkəˋmɛnd", meaning: "推薦、薦購", pos: "v." },
      { word: "collection", kk: "kəˋlɛkʃən", meaning: "館藏", pos: "n." },
      { word: "publication", kk: "͵pʌblɪˋkeʃən", meaning: "出版物、出版資訊", pos: "n." },
      { word: "monthly", kk: "ˋmʌnθlɪ", meaning: "每月的", pos: "adj." },
      { word: "recommendation", kk: "͵rɛkəmɛnˋdeʃən", meaning: "薦購、推薦", pos: "n." },
      { word: "track", kk: "træk", meaning: "追蹤", pos: "v." },
      { word: "notification", kk: "͵notəfəˋkeʃən", meaning: "通知", pos: "n." },
    ],
  },
  {
    id: 7,
    shortTitle: "畢業離校",
    title: "畢業離校前的館藏、館際借書與費用查核",
    summary: "引導畢業生完成圖書館離校程序，並說明完成後三十天的入館權益。",
    sourceLabel: "畢業程序",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/before_graduated.html",
    dialogue: [
      {
        role: "reader",
        en: "I am completing [kəmˋplitɪŋ] my graduation clearance [ˋklɪrəns] and need to confirm my library status.",
        zh: "我正在辦理畢業離校，想確認圖書館狀態。",
      },
      {
        role: "librarian",
        en: "Please return all materials borrowed from NTHU, UST, and reciprocal [rɪˋsɪprək!] libraries, and settle [ˋsɛt!] all charges.",
        zh: "請歸還向清華大學、台灣聯大及互惠館借閱的所有資料，並結清全部費用。",
      },
      {
        role: "reader",
        en: "What should I check for interlibrary loan and document delivery [dɪˋlɪvərɪ] requests?",
        zh: "館際借書與文件傳遞申請需要確認哪些事項？",
      },
      {
        role: "librarian",
        en: "Make sure every requested item has been collected, returned, and fully paid for.",
        zh: "請確認所有申請資料都已領取、歸還並完成繳費。",
      },
      {
        role: "reader",
        en: "Can I still enter the library after the procedure [prəˋsidʒɚ] is complete?",
        zh: "完成離校程序後，我還可以進入圖書館嗎？",
      },
      {
        role: "librarian",
        en: "Your student card allows entry for thirty days, but borrowing and reservations [͵rɛzɚˋveʃənz] for equipment or spaces are no longer available.",
        zh: "您的學生證仍可在三十天內入館，但不再具有借閱以及預約設備或空間的權限。",
      },
    ],
    patterns: [
      {
        form: "I am completing ... and need to confirm...",
        example: "I am completing my clearance and need to confirm my status.",
        explanation: "用來說明目前正在辦理的程序及希望櫃台確認的事項。",
      },
      {
        form: "Make sure ... has been...",
        example: "Make sure every item has been returned.",
        explanation: "用來提醒對方確認某項必要程序已經完成。",
      },
      {
        form: "... is no longer available.",
        example: "The borrowing service is no longer available.",
        explanation: "用來說明某項服務或權限已經停止。",
      },
    ],
    grammar: [
      {
        title: "現在進行式描述辦理中的程序",
        explanation: "說明目前正在進行的離校或申請程序時，可使用現在進行式。",
      },
      {
        title: "現在完成式被動語態",
        explanation: "確認物品已被歸還或費用已被繳清時，可使用現在完成式的被動語態。",
      },
    ],
    vocabulary: [
      { word: "clearance", kk: "ˋklɪrəns", meaning: "離校查核、結清手續", pos: "n." },
      { word: "reciprocal", kk: "rɪˋsɪprək!", meaning: "互惠的", pos: "adj." },
      { word: "settle", kk: "ˋsɛt!", meaning: "結清、處理完畢", pos: "v." },
      { word: "delivery", kk: "dɪˋlɪvərɪ", meaning: "傳遞、交付", pos: "n." },
      { word: "procedure", kk: "prəˋsidʒɚ", meaning: "程序、手續", pos: "n." },
      { word: "reservation", kk: "͵rɛzɚˋveʃən", meaning: "預約", pos: "n." },
      { word: "equipment", kk: "ɪˋkwɪpmənt", meaning: "設備", pos: "n." },
    ],
  },
  {
    id: 8,
    shortTitle: "論文繳交",
    title: "學位論文上傳、授權及延後公開諮詢",
    summary: "回應研究生對論文上傳、授權文件、延後公開與後續修改的疑問。",
    sourceLabel: "二〇二六年論文授權新制公告",
    sourceUrl: "https://www.lib.nthu.edu.tw/news/list_en.html",
    dialogue: [
      {
        role: "reader",
        en: "My thesis [ˋθisɪs] has been accepted by the electronic submission [səbˋmɪʃən] system.",
        zh: "我的論文已經通過電子論文系統的審核。",
      },
      {
        role: "librarian",
        en: "Please follow the latest graduation notice and bring the required [rɪˋkwaɪrd] printed copy and signed authorization [͵ɔθərəˋzeʃən] documents to the designated desk.",
        zh: "請依最新畢業公告，將規定的紙本論文與簽名授權文件帶到指定櫃檯。",
      },
      {
        role: "reader",
        en: "I may apply for a patent [ˋpætnt], so can I request an embargo [ɛmˋbɑrgo]?",
        zh: "我可能會申請專利，可以申請延後公開嗎？",
      },
      {
        role: "librarian",
        en: "You may request a delayed release, but you must use the current form and provide supporting [səˋportɪŋ] documents.",
        zh: "您可以申請延後公開，但必須使用現行表格並提供證明文件。",
      },
      {
        role: "reader",
        en: "What should I do if I discover [dɪˋskʌvɚ] an error after graduation?",
        zh: "如果畢業後發現錯誤，我應該怎麼辦？",
      },
      {
        role: "librarian",
        en: "Contact the library before making any revision [rɪˋvɪʒən], because the requirements differ after the graduation procedure is complete.",
        zh: "修改前請先聯絡圖書館，因為完成畢業程序後的規定會有所不同。",
      },
    ],
    patterns: [
      {
        form: "... has been accepted by...",
        example: "My thesis has been accepted by the system.",
        explanation: "用來說明申請或文件已經通過某個系統或單位的審核。",
      },
      {
        form: "Can I request...?",
        example: "Can I request a delayed release?",
        explanation: "用來直接而有禮貌地詢問是否可以提出特定申請。",
      },
      {
        form: "What should I do if...?",
        example: "What should I do if I find an error?",
        explanation: "用來詢問遇到特定狀況時應採取的處理方式。",
      },
    ],
    grammar: [
      {
        title: "現在完成式被動語態",
        explanation: "表達文件已經被系統審核通過，而且結果與目前程序相關。",
      },
      {
        title: "條件子句與建議",
        explanation: "詢問假設狀況下的建議時，條件子句使用現在式，主要子句使用表示建議的情態動詞。",
      },
    ],
    vocabulary: [
      { word: "thesis", kk: "ˋθisɪs", meaning: "碩士論文、學位論文", pos: "n." },
      { word: "submission", kk: "səbˋmɪʃən", meaning: "提交、送審", pos: "n." },
      { word: "authorization", kk: "͵ɔθərəˋzeʃən", meaning: "授權", pos: "n." },
      { word: "patent", kk: "ˋpætnt", meaning: "專利", pos: "n." },
      { word: "embargo", kk: "ɛmˋbɑrgo", meaning: "延後公開、禁制", pos: "n." },
      { word: "supporting", kk: "səˋportɪŋ", meaning: "作為證明的、補充的", pos: "adj." },
      { word: "revision", kk: "rɪˋvɪʒən", meaning: "修訂、修改", pos: "n." },
    ],
  },
  {
    id: 9,
    shortTitle: "專案借書",
    title: "專案借書證申請、借閱上限及使用限制",
    summary: "說明研究用途大量借書的申請資格、兩百冊上限與證件限制。",
    sourceLabel: "圖書館借書證申請",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/id_application.html",
    dialogue: [
      {
        role: "reader",
        en: "I need to borrow a large number of books for a research project [ˋprɑdʒɛkt].",
        zh: "我的研究計畫需要借閱大量圖書。",
      },
      {
        role: "librarian",
        en: "Eligible [ˋɛlɪdʒəb!] NTHU researchers and students may apply for a project borrowing card.",
        zh: "符合資格的清華大學研究人員與學生可以申請專案借書證。",
      },
      {
        role: "reader",
        en: "What is the maximum [ˋmæksəməm] number of books I may borrow?",
        zh: "我最多可以借多少本書？",
      },
      {
        role: "librarian",
        en: "The project card allows up to two hundred books, subject to the fixed return date and applicable [ˋæplɪkəb!] conditions.",
        zh: "專案借書證最多可借兩百冊，但須遵守固定還書日及適用規定。",
      },
      {
        role: "reader",
        en: "Can I use the project card to enter the library?",
        zh: "我可以使用專案借書證進入圖書館嗎？",
      },
      {
        role: "librarian",
        en: "No, it is valid [ˋvælɪd] only for borrowing books, and you must also present your regular NTHU identification [aɪ͵dɛntəfəˋkeʃən].",
        zh: "不可以，它僅供借書使用，而且借書時還必須出示一般清華大學身分證件。",
      },
    ],
    patterns: [
      {
        form: "I need to borrow a large number of...",
        example: "I need to borrow a large number of research books.",
        explanation: "用來說明因研究或計畫需要大量借閱資料。",
      },
      {
        form: "What is the maximum number of...?",
        example: "What is the maximum number of items I may borrow?",
        explanation: "用來詢問借閱、預約或申請數量的最高上限。",
      },
      {
        form: "... is valid only for...",
        example: "This card is valid only for borrowing books.",
        explanation: "用來清楚限定證件或服務的有效用途。",
      },
    ],
    grammar: [
      {
        title: "表示資格的形容詞",
        explanation: "說明哪些人符合申請資格時，可用形容詞直接修飾使用者身分。",
      },
      {
        title: "表示用途限制的片語",
        explanation: "說明證件僅限特定用途時，可用表示有效的形容詞搭配表示用途的介系詞。",
      },
    ],
    vocabulary: [
      { word: "project", kk: "ˋprɑdʒɛkt", meaning: "專案、研究計畫", pos: "n." },
      { word: "eligible", kk: "ˋɛlɪdʒəb!", meaning: "符合資格的", pos: "adj." },
      { word: "researcher", kk: "rɪˋsɝtʃɚ", meaning: "研究人員", pos: "n." },
      { word: "maximum", kk: "ˋmæksəməm", meaning: "最高的、最大值", pos: "adj." },
      { word: "applicable", kk: "ˋæplɪkəb!", meaning: "適用的", pos: "adj." },
      { word: "valid", kk: "ˋvælɪd", meaning: "有效的", pos: "adj." },
      { word: "identification", kk: "aɪ͵dɛntəfəˋkeʃən", meaning: "身分證明", pos: "n." },
    ],
  },
  {
    id: 10,
    shortTitle: "交換生與台聯大",
    title: "交換生詢問 UST 跨校入館與借閱資格",
    summary: "協助交換生區分跨校入館、借書及代借申請的不同資格。",
    sourceLabel: "大學生與交換生服務",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/identity/undergra.html",
    dialogue: [
      {
        role: "reader",
        en: "I am an NTHU exchange [ɪksˋtʃendʒ] student, and I would like to visit another UST library.",
        zh: "我是清華大學交換生，想前往另一所台灣聯大圖書館。",
      },
      {
        role: "librarian",
        en: "You may visit another UST library by presenting [prɪˋzɛntɪŋ] your NTHU student identification card.",
        zh: "您可以出示清華大學學生證進入其他台灣聯大圖書館。",
      },
      {
        role: "reader",
        en: "May I borrow books there or submit [səbˋmɪt] an ALL4UST request?",
        zh: "我可以在那裡借書，或提出台灣聯大代借申請嗎？",
      },
      {
        role: "librarian",
        en: "Exchange students may visit, but they are not eligible [ˋɛlɪdʒəb!] for cross campus borrowing or the interlibrary circulation [͵sɝkjəˋleʃən] service.",
        zh: "交換生可以入館，但不具跨校借閱或館際流通服務的資格。",
      },
      {
        role: "reader",
        en: "What should I do if I need material that NTHU does not own?",
        zh: "如果清華大學沒有我需要的資料，我該怎麼辦？",
      },
      {
        role: "librarian",
        en: "Search the NTHU collection first, and then ask us about available [əˋveləb!] interlibrary loan or document delivery options.",
        zh: "請先查詢清華大學館藏，再向我們詢問可使用的館際借書或文件傳遞方案。",
      },
    ],
    patterns: [
      {
        form: "I would like to visit...",
        example: "I would like to visit another university library.",
        explanation: "用來禮貌表達想前往某個館舍或地點。",
      },
      {
        form: "May I borrow ... or submit...?",
        example: "May I borrow books or submit a request?",
        explanation: "用來同時確認兩種服務是否可使用。",
      },
      {
        form: "... are not eligible for...",
        example: "Exchange students are not eligible for this service.",
        explanation: "用來說明特定身分不符合某項服務資格。",
      },
    ],
    grammar: [
      {
        title: "情態動詞表達許可",
        explanation: "詢問是否允許使用服務時，可使用較正式且有禮貌的情態動詞。",
      },
      {
        title: "轉折連接詞",
        explanation: "前後兩項權益不同時，可使用轉折連接詞，先說明可入館，再補充不能借閱。",
      },
    ],
    vocabulary: [
      { word: "exchange", kk: "ɪksˋtʃendʒ", meaning: "交換、交流", pos: "n." },
      { word: "present", kk: "prɪˋzɛnt", meaning: "出示、呈交", pos: "v." },
      { word: "submit", kk: "səbˋmɪt", meaning: "提交", pos: "v." },
      { word: "eligible", kk: "ˋɛlɪdʒəb!", meaning: "符合資格的", pos: "adj." },
      { word: "cross campus", kk: "͵krɔsˋkæmpəs", meaning: "跨校的", pos: "adj." },
      { word: "circulation", kk: "͵sɝkjəˋleʃən", meaning: "流通、借閱服務", pos: "n." },
      { word: "available", kk: "əˋveləb!", meaning: "可使用的、可取得的", pos: "adj." },
    ],
  },
  {
    id: 11,
    shortTitle: "訪客入館",
    title: "訪客換證與臨時閱覽證使用規定",
    summary: "協助校外訪客了解換證入館、每日名額、使用限制與歸還規定。",
    sourceLabel: "入館須知",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/in_lib_service.html",
    dialogue: [
      {
        role: "reader",
        en: "I am a visitor [ˋvɪzɪtɚ], and I would like to use the Main Library this afternoon.",
        zh: "我是校外訪客，今天下午想進入總圖書館使用。",
      },
      {
        role: "librarian",
        en: "Visitors over eighteen may present [prɪˋzɛnt] a national identification card in exchange [ɪksˋtʃendʒ] for a temporary [ˋtɛmpə͵rɛrɪ] library card.",
        zh: "年滿十八歲的訪客可以出示身分證，換取臨時閱覽證。",
      },
      {
        role: "reader",
        en: "Is there a daily quota [ˋkwotə] for temporary cards?",
        zh: "臨時閱覽證每天有人數限制嗎？",
      },
      {
        role: "librarian",
        en: "Yes, cards are issued within the daily quota, so arriving earlier is recommended.",
        zh: "有，臨時閱覽證依每日限額發放，因此建議提早到館。",
      },
      {
        role: "reader",
        en: "May I borrow books with this card, and when should I return it?",
        zh: "我可以用這張證借書嗎？又應該何時歸還？",
      },
      {
        role: "librarian",
        en: "The card is for entry and reading only, and you must return it on the same day to avoid a late fee or handling [ˋhændlɪŋ] charge.",
        zh: "這張證只供入館閱覽，必須當天歸還，以免產生逾期費用或遺失處理費。",
      },
    ],
    patterns: [
      {
        form: "I would like to use...",
        example: "I would like to use the library this afternoon.",
        explanation: "用來禮貌說明想使用某項空間或服務。",
      },
      {
        form: "... may present ... in exchange for...",
        example: "Visitors may present identification in exchange for a temporary card.",
        explanation: "用來說明出示某項證件後可以換取另一項物品。",
      },
      {
        form: "Is there a daily quota for...?",
        example: "Is there a daily quota for visitor cards?",
        explanation: "用來詢問某項服務是否設有每日人數或數量限制。",
      },
    ],
    grammar: [
      {
        title: "表達目的的不定詞",
        explanation: "使用不定詞說明到館或申請服務的目的，語氣直接且自然。",
      },
      {
        title: "義務與期限",
        explanation: "使用表示義務的情態動詞，清楚說明證件必須在何時歸還。",
      },
    ],
    vocabulary: [
      { word: "visitor", kk: "ˋvɪzɪtɚ", meaning: "訪客", pos: "n." },
      { word: "temporary", kk: "ˋtɛmpə͵rɛrɪ", meaning: "臨時的", pos: "adj." },
      { word: "present", kk: "prɪˋzɛnt", meaning: "出示", pos: "v." },
      { word: "exchange", kk: "ɪksˋtʃendʒ", meaning: "交換、換取", pos: "v." },
      { word: "quota", kk: "ˋkwotə", meaning: "限額、配額", pos: "n." },
      { word: "eligible", kk: "ˋɛlɪdʒəb!", meaning: "符合資格的", pos: "adj." },
      { word: "handling", kk: "ˋhændlɪŋ", meaning: "處理、經辦", pos: "n." },
    ],
  },
  {
    id: 12,
    shortTitle: "線上續借",
    title: "線上續借、預約限制與新到期日",
    summary: "說明個人借閱狀況中的續借流程、預約限制及最大借期。",
    sourceLabel: "圖書資料借還常問問題",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/faq/q_a2.html",
    dialogue: [
      {
        role: "reader",
        en: "I would like to renew [rɪˋnu] a book without coming to the library.",
        zh: "我想續借一本書，但不方便親自到圖書館。",
      },
      {
        role: "librarian",
        en: "You can sign in to My Account [əˋkaʊnt], open your loan list, and select the renewal option.",
        zh: "您可以登入個人借閱狀況，開啟借閱清單後選擇續借。",
      },
      {
        role: "reader",
        en: "Why is the renewal option unavailable for this title?",
        zh: "為什麼這本書無法選擇續借？",
      },
      {
        role: "librarian",
        en: "An item cannot be renewed if another reader has reserved [rɪˋzɝvd] it or if it is already overdue [ˋovɚˋdu].",
        zh: "館藏若已被其他讀者預約，或本身已經逾期，就無法續借。",
      },
      {
        role: "reader",
        en: "How is the new due date calculated after a successful renewal?",
        zh: "成功續借後，新的到期日如何計算？",
      },
      {
        role: "librarian",
        en: "The new period starts on the renewal date and cannot extend [ɪkˋstɛnd] beyond the maximum [ˋmæksəməm] loan period for your status.",
        zh: "新借期從續借當天起算，而且不得超過您身分別適用的最大借期。",
      },
    ],
    patterns: [
      {
        form: "I would like to renew...",
        example: "I would like to renew this book online.",
        explanation: "用來禮貌表達希望延長借閱期限。",
      },
      {
        form: "... cannot be renewed if...",
        example: "The book cannot be renewed if another reader has reserved it.",
        explanation: "用來說明無法續借的條件或原因。",
      },
      {
        form: "How is the new due date calculated?",
        example: "How is the new due date calculated after renewal?",
        explanation: "用來詢問日期、費用或期限的計算方式。",
      },
    ],
    grammar: [
      {
        title: "條件子句",
        explanation: "使用條件子句說明預約或逾期時，續借功能會受到限制。",
      },
      {
        title: "被動語態",
        explanation: "強調館藏是否能被續借，而不必特別指出執行續借的人。",
      },
    ],
    vocabulary: [
      { word: "renew", kk: "rɪˋnu", meaning: "續借、更新", pos: "v." },
      { word: "account", kk: "əˋkaʊnt", meaning: "帳戶", pos: "n." },
      { word: "extend", kk: "ɪkˋstɛnd", meaning: "延長", pos: "v." },
      { word: "reserved", kk: "rɪˋzɝvd", meaning: "已被預約的", pos: "adj." },
      { word: "maximum", kk: "ˋmæksəməm", meaning: "最大的、最高的", pos: "adj." },
      { word: "overdue", kk: "ˋovɚˋdu", meaning: "逾期的", pos: "adj." },
      { word: "period", kk: "ˋpɪrɪəd", meaning: "期間、期限", pos: "n." },
    ],
  },
  {
    id: 13,
    shortTitle: "逾期停借",
    title: "圖書逾期、處理費與借閱權限制",
    summary: "協助讀者確認逾期費用、續借限制與恢復借閱權的方法。",
    sourceLabel: "圖書資料借還常問問題",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/faq/q_a2.html",
    dialogue: [
      {
        role: "reader",
        en: "I returned a book five days late and received an overdue [ˋovɚˋdu] notice.",
        zh: "我晚了五天還書，而且收到逾期通知。",
      },
      {
        role: "librarian",
        en: "The overdue fee [fi] is five New Taiwan dollars per item for each day after the due date.",
        zh: "超過到期日後，每冊每天會產生新臺幣五元的逾期處理費。",
      },
      {
        role: "reader",
        en: "Can I renew the item now to stop the fee from accumulating [əˋkjumjə͵letɪŋ]?",
        zh: "我現在可以續借，讓費用不要繼續累積嗎？",
      },
      {
        role: "librarian",
        en: "No, overdue items cannot be renewed, and your borrowing privileges [ˋprɪvəlɪdʒɪz] may be suspended [səˋspɛndɪd].",
        zh: "不可以，逾期館藏無法續借，而且您的借閱權可能會暫停。",
      },
      {
        role: "reader",
        en: "How can I check the amount and restore my borrowing privileges?",
        zh: "我要如何查詢金額並恢復借閱權？",
      },
      {
        role: "librarian",
        en: "Check the charges [tʃɑrdʒɪz] in My Account, return all overdue items, and settle [ˋsɛt!] the required fees.",
        zh: "請在個人借閱狀況查詢費用，歸還所有逾期館藏，並結清應繳款項。",
      },
    ],
    patterns: [
      {
        form: "I returned ... days late.",
        example: "I returned the book three days late.",
        explanation: "用來清楚說明歸還物品時已經逾期幾天。",
      },
      {
        form: "Can I ... to stop ... from...?",
        example: "Can I pay now to stop the fee from increasing?",
        explanation: "用來詢問某項行動是否能阻止後續影響。",
      },
      {
        form: "How can I restore...?",
        example: "How can I restore my borrowing privileges?",
        explanation: "用來詢問恢復權益、功能或資格的方法。",
      },
    ],
    grammar: [
      {
        title: "時間長度的表達",
        explanation: "數字加上時間單位可放在形容詞前，表示某項行為延遲了多久。",
      },
      {
        title: "阻止持續發生",
        explanation: "使用表示阻止的動詞搭配動名詞，說明希望停止費用繼續增加。",
      },
    ],
    vocabulary: [
      { word: "overdue", kk: "ˋovɚˋdu", meaning: "逾期的", pos: "adj." },
      { word: "fee", kk: "fi", meaning: "費用", pos: "n." },
      { word: "accumulate", kk: "əˋkjumjə͵let", meaning: "累積", pos: "v." },
      { word: "suspend", kk: "səˋspɛnd", meaning: "暫停", pos: "v." },
      { word: "privilege", kk: "ˋprɪvəlɪdʒ", meaning: "權益、權限", pos: "n." },
      { word: "settle", kk: "ˋsɛt!", meaning: "結清、處理妥當", pos: "v." },
      { word: "charge", kk: "tʃɑrdʒ", meaning: "應繳費用", pos: "n." },
    ],
  },
  {
    id: 14,
    shortTitle: "遺失賠償",
    title: "遺失或損壞館藏的通報與賠償",
    summary: "說明館藏遺失後的通報期限、替代版本、處理費與完成期限。",
    sourceLabel: "借還書服務說明",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/borrow_n_return.html",
    dialogue: [
      {
        role: "reader",
        en: "I may have lost a borrowed book, and its due date is next week.",
        zh: "我可能遺失了一本借來的書，下星期就到期了。",
      },
      {
        role: "librarian",
        en: "Please notify [ˋnotə͵faɪ] the library before the due date so we can begin the compensation [͵kɑmpɛnˋseʃən] procedure.",
        zh: "請在到期日前通知圖書館，以便開始辦理賠償程序。",
      },
      {
        role: "reader",
        en: "May I purchase a replacement [rɪˋplesmənt] copy?",
        zh: "我可以購買一本書來抵賠嗎？",
      },
      {
        role: "librarian",
        en: "Yes, it should match the original book, although a newer edition [ɪˋdɪʃən] may be accepted with approval.",
        zh: "可以，原則上應與原書相同；經館員同意後，也可能接受新版。",
      },
      {
        role: "reader",
        en: "Is there a deadline or an additional processing [ˋprɑsɛsɪŋ] fee?",
        zh: "賠償有完成期限或額外處理費嗎？",
      },
      {
        role: "librarian",
        en: "Complete the procedure within sixty days and pay the processing fee, or overdue charges may continue.",
        zh: "請在六十天內完成程序並繳交處理費，否則逾期費用可能繼續計算。",
      },
    ],
    patterns: [
      {
        form: "I may have lost...",
        example: "I may have lost a borrowed book.",
        explanation: "用來委婉說明目前尚未完全確定的遺失狀況。",
      },
      {
        form: "May I purchase a replacement...?",
        example: "May I purchase a replacement copy?",
        explanation: "用來詢問是否可以購買替代品作為賠償。",
      },
      {
        form: "... may be accepted with approval.",
        example: "A newer edition may be accepted with approval.",
        explanation: "用來說明某個替代方案必須取得同意後才可能被接受。",
      },
    ],
    grammar: [
      {
        title: "推測已發生的事情",
        explanation: "使用情態動詞搭配完成式，表達對過去事件的不確定推測。",
      },
      {
        title: "條件式被動語態",
        explanation: "強調替代版本在取得核准後才可能被接受。",
      },
    ],
    vocabulary: [
      { word: "damaged", kk: "ˋdæmɪdʒd", meaning: "損壞的", pos: "adj." },
      { word: "compensation", kk: "͵kɑmpɛnˋseʃən", meaning: "賠償", pos: "n." },
      { word: "replacement", kk: "rɪˋplesmənt", meaning: "替代品、補發品", pos: "n." },
      { word: "edition", kk: "ɪˋdɪʃən", meaning: "版本", pos: "n." },
      { word: "notify", kk: "ˋnotə͵faɪ", meaning: "通知", pos: "v." },
      { word: "processing", kk: "ˋprɑsɛsɪŋ", meaning: "處理、辦理", pos: "n." },
      { word: "out of print", kk: "aʊt əv prɪnt", meaning: "已絕版", pos: "phr." },
    ],
  },
  {
    id: 15,
    shortTitle: "架上協尋",
    title: "館藏顯示在架卻無法找到的協尋流程",
    summary: "引導讀者確認館藏位置、尋找鄰近區域並提出館藏協尋申請。",
    sourceLabel: "館藏狀態常問問題",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/faq/q_a3.html",
    dialogue: [
      {
        role: "reader",
        en: "The catalog [ˋkæt!͵ɔg] says this book is on shelf, but I cannot locate [ˋlo͵ket] it.",
        zh: "館藏目錄顯示這本書在架上，但我找不到。",
      },
      {
        role: "librarian",
        en: "Please check the nearby [ˋnɪrˋbaɪ] shelves, book carts, and reading tables first.",
        zh: "請先查看附近書架、書車及閱覽桌。",
      },
      {
        role: "reader",
        en: "I have checked those places. Can the library search for the missing [ˋmɪsɪŋ] item?",
        zh: "那些地方我都找過了，圖書館可以協尋這本書嗎？",
      },
      {
        role: "librarian",
        en: "Yes, please complete a Missing Items Search form at the Information Desk.",
        zh: "可以，請到服務櫃檯填寫館藏協尋申請。",
      },
      {
        role: "reader",
        en: "How long will the search take, and how will I receive the result?",
        zh: "協尋需要多久？結果會如何通知我？",
      },
      {
        role: "librarian",
        en: "We will search several times during one month and inform [ɪnˋfɔrm] you by email whether or not the item is found.",
        zh: "我們會在一個月內進行多次協尋，無論是否找到都會以電子郵件通知您。",
      },
    ],
    patterns: [
      {
        form: "The catalog says..., but...",
        example: "The catalog says the book is available, but I cannot find it.",
        explanation: "用來對照系統顯示的資訊與現場實際狀況。",
      },
      {
        form: "Can the library search for...?",
        example: "Can the library search for the missing item?",
        explanation: "用來詢問館員是否能協助尋找館藏。",
      },
      {
        form: "How will I receive the result?",
        example: "How will I receive the search result?",
        explanation: "用來詢問後續結果會透過何種方式通知。",
      },
    ],
    grammar: [
      {
        title: "轉折連接",
        explanation: "使用轉折連接詞對照目錄狀態與實際找不到館藏的情況。",
      },
      {
        title: "無論是否",
        explanation: "用來表示兩種相反結果都不會改變後續通知的安排。",
      },
    ],
    vocabulary: [
      { word: "catalog", kk: "ˋkæt!͵ɔg", meaning: "館藏目錄", pos: "n." },
      { word: "on shelf", kk: "ɑn ʃɛlf", meaning: "顯示在架", pos: "phr." },
      { word: "locate", kk: "ˋlo͵ket", meaning: "找到位置", pos: "v." },
      { word: "missing", kk: "ˋmɪsɪŋ", meaning: "找不到的、遺失的", pos: "adj." },
      { word: "nearby", kk: "ˋnɪrˋbaɪ", meaning: "附近的", pos: "adj." },
      { word: "search form", kk: "sɝtʃ fɔrm", meaning: "協尋申請表", pos: "phr." },
      { word: "inform", kk: "ɪnˋfɔrm", meaning: "通知、告知", pos: "v." },
    ],
  },
  {
    id: 16,
    shortTitle: "預約取書",
    title: "預約書取件、保留期限與取消申請",
    summary: "說明預約書到館通知、自助取書位置、保留期限與取消方式。",
    sourceLabel: "圖書資料借還常問問題",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/faq/q_a2.html",
    dialogue: [
      { role: "reader", en: "I received a pickup [ˋpɪk͵ʌp] notice for a book I reserved [rɪˋzɝvd].", zh: "我收到預約書到館的取件通知。" },
      { role: "librarian", en: "Books requested from the Main Library are available [əˋveləb!] at the Smart Bookshelf on the first floor.", zh: "總圖的預約書可在一樓預約自助取書區領取。" },
      { role: "reader", en: "How long will the reservation [͵rɛzɚˋveʃən] be retained [rɪˋtend] for me?", zh: "這筆預約會為我保留多久？" },
      { role: "librarian", en: "It is normally held for three days, with weekends and official holidays excluded from the count.", zh: "一般會保留三天，星期六、星期日及學校規定的假日不列入計算。" },
      { role: "reader", en: "What should I do if I cannot arrive before the deadline [ˋdɛd͵laɪn]?", zh: "如果我無法在期限前到館，應該怎麼辦？" },
      { role: "librarian", en: "Cancel [ˋkæns!] the request in My Account before it expires to avoid a pickup penalty [ˋpɛn!tɪ].", zh: "請在到期前於個人借閱狀況取消預約，以免產生未取書記點。" },
    ],
    patterns: [
      { form: "I received a pickup notice for...", example: "I received a pickup notice for my reserved book.", explanation: "用來說明已收到預約資料可領取的通知。" },
      { form: "How long will ... be retained?", example: "How long will the book be retained for me?", explanation: "用來詢問物品或申請會保留多長時間。" },
      { form: "... before it expires to avoid...", example: "Cancel the request before it expires to avoid a penalty.", explanation: "用來提醒在期限前採取行動，以避免不利結果。" },
    ],
    grammar: [
      { title: "未來式被動語態", explanation: "用來詢問預約物品在未來會被保留多久。" },
      { title: "表示避免的目的", explanation: "使用不定詞說明及時取消預約是為了避免產生記點。" },
    ],
    vocabulary: [
      { word: "pickup", kk: "ˋpɪk͵ʌp", meaning: "取件、領取", pos: "n." },
      { word: "reservation", kk: "͵rɛzɚˋveʃən", meaning: "預約", pos: "n." },
      { word: "retain", kk: "rɪˋten", meaning: "保留", pos: "v." },
      { word: "deadline", kk: "ˋdɛd͵laɪn", meaning: "截止期限", pos: "n." },
      { word: "cancel", kk: "ˋkæns!", meaning: "取消", pos: "v." },
      { word: "penalty", kk: "ˋpɛn!tɪ", meaning: "處罰、記點", pos: "n." },
      { word: "available", kk: "əˋveləb!", meaning: "可以領取的、可用的", pos: "adj." },
    ],
  },
  {
    id: 17,
    shortTitle: "討論室預約",
    title: "討論室預約、報到與逾時釋出",
    summary: "協助學生了解討論室人數、預約時數、報到及未到記點規定。",
    sourceLabel: "讀者討論室使用須知",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/policies/policy18.html",
    dialogue: [
      { role: "reader", en: "My classmates and I would like to reserve [rɪˋzɝv] a discussion [dɪˋskʌʃən] room.", zh: "我和同學想預約一間討論室。" },
      { role: "librarian", en: "You may reserve one through the library booking system within the next fourteen days.", zh: "您可以透過圖書館空間系統，預約未來十四天內的時段。" },
      { role: "reader", en: "How many participants [pɑrˋtɪsəpənts] are required, and how long may we use the room?", zh: "需要幾位使用者？一次可以使用多久？" },
      { role: "librarian", en: "A Main Library room requires three valid cards, and one reservation may last up to two hours.", zh: "總圖討論室需要三張有效證件，一次預約最長兩小時。" },
      { role: "reader", en: "What happens if one participant is late to check in?", zh: "如果其中一位使用者來不及報到，會怎麼樣？" },
      { role: "librarian", en: "All participants must check in within fifteen minutes, or the room will be released [rɪˋlist] and a no show may be recorded.", zh: "所有使用者必須在十五分鐘內完成報到，否則空間會被釋出，並可能留下未到紀錄。" },
    ],
    patterns: [
      { form: "We would like to reserve...", example: "We would like to reserve a discussion room.", explanation: "用來禮貌表達團體希望預約某個空間。" },
      { form: "How many ... are required?", example: "How many participants are required?", explanation: "用來詢問服務所要求的最低人數或數量。" },
      { form: "... must check in within...", example: "All participants must check in within fifteen minutes.", explanation: "用來說明必須在指定時間內完成報到。" },
    ],
    grammar: [
      { title: "團體主詞與一致性", explanation: "多人共同預約時使用複數主詞，動詞形式也要配合複數。" },
      { title: "否則的結果", explanation: "先說明必要條件，再接續未遵守條件時會發生的結果。" },
    ],
    vocabulary: [
      { word: "discussion", kk: "dɪˋskʌʃən", meaning: "討論", pos: "n." },
      { word: "reserve", kk: "rɪˋzɝv", meaning: "預約", pos: "v." },
      { word: "participant", kk: "pɑrˋtɪsəpənt", meaning: "參與者、使用者", pos: "n." },
      { word: "check in", kk: "tʃɛk ɪn", meaning: "報到", pos: "phr." },
      { word: "release", kk: "rɪˋlis", meaning: "釋出", pos: "v." },
      { word: "extend", kk: "ɪkˋstɛnd", meaning: "延長", pos: "v." },
      { word: "no show", kk: "no ʃo", meaning: "預約未到", pos: "phr." },
    ],
  },  {
    id: 18,
    shortTitle: "訪客無線網路",
    title: "訪客申請臨時無線網路帳號與連線排除",
    summary: "協助校外訪客申請臨時帳號、選擇正確網路及處理驗證問題。",
    sourceLabel: "無線網路常問問題",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/faq/q_a8.html",
    dialogue: [
      { role: "reader", en: "I am not an NTHU user. How can I access the wireless [ˋwaɪrlɪs] network?", zh: "我不是清華大學的使用者，要如何連接無線網路？" },
      { role: "librarian", en: "Please apply for a temporary [ˋtɛmpə͵rɛrɪ] wireless account at the library service counter.", zh: "請到圖書館服務櫃檯申請臨時無線網路帳號。" },
      { role: "reader", en: "I signed in, but the authentication [ɔ͵θɛntəˋkeʃən] page still will not connect.", zh: "我已經登入，但驗證頁面仍然無法連線。" },
      { role: "librarian", en: "Confirm that you selected the correct network, disconnect any unintended network, and reconnect [͵rikəˋnɛkt].", zh: "請確認選擇正確的網路，先中斷其他不需要的連線，再重新連接。" },
      { role: "reader", en: "Can I use the same account on more than one device [dɪˋvaɪs]?", zh: "同一個帳號可以在多個裝置上使用嗎？" },
      { role: "librarian", en: "Yes, and the connection will end automatically after the account has been idle [ˋaɪd!] for ten minutes.", zh: "可以，帳號閒置十分鐘後，系統會自動中斷連線。" },
    ],
    patterns: [
      { form: "How can I access...?", example: "How can I access the wireless network?", explanation: "用來詢問取得網路、資源或服務的方法。" },
      { form: "Confirm that you selected...", example: "Confirm that you selected the correct network.", explanation: "用來提醒使用者再次確認先前選擇是否正確。" },
      { form: "Can I use the same ... on...?", example: "Can I use the same account on two devices?", explanation: "用來詢問同一帳號或服務能否在不同設備上使用。" },
    ],
    grammar: [
      { title: "間接問句", explanation: "詢問方法時，疑問詞後接一般直述語序，使句子自然有禮。" },
      { title: "現在完成式被動語態", explanation: "強調帳號持續處於閒置狀態，而且狀態與自動斷線有關。" },
    ],
    vocabulary: [
      { word: "wireless", kk: "ˋwaɪrlɪs", meaning: "無線的", pos: "adj." },
      { word: "temporary", kk: "ˋtɛmpə͵rɛrɪ", meaning: "臨時的", pos: "adj." },
      { word: "authentication", kk: "ɔ͵θɛntəˋkeʃən", meaning: "身分驗證", pos: "n." },
      { word: "device", kk: "dɪˋvaɪs", meaning: "裝置", pos: "n." },
      { word: "idle", kk: "ˋaɪd!", meaning: "閒置的", pos: "adj." },
      { word: "reconnect", kk: "͵rikəˋnɛkt", meaning: "重新連接", pos: "v." },
      { word: "signal", kk: "ˋsɪgn!", meaning: "訊號", pos: "n." },
    ],
  },
  {
    id: 19,
    shortTitle: "列印影印",
    title: "列印付款、彩色輸出與卡紙處理",
    summary: "說明列印設備的付款方式、個人電腦限制、卡紙排除及收據申請。",
    sourceLabel: "影印服務常問問題",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/faq/q_a12.html",
    dialogue: [
      { role: "reader", en: "I need to print a color document. Can I send it from my personal laptop?", zh: "我需要彩色列印，可以從自己的筆記型電腦傳送嗎？" },
      { role: "librarian", en: "Personal laptop printing is unavailable because of driver compatibility [kəm͵pætəˋbɪlətɪ] and data security concerns.", zh: "基於驅動程式相容性與資料安全考量，目前不提供個人電腦列印。" },
      { role: "reader", en: "How can I pay for a printout [ˋprɪnt͵aʊt] or photocopy [ˋfoto͵kɑpɪ]?", zh: "列印或影印要如何付費？" },
      { role: "librarian", en: "You can pay with an EasyCard or coins, and remember to select [səˋlɛkt] the color option before printing.", zh: "可以使用悠遊卡或硬幣付款，彩色列印前請記得選擇彩色選項。" },
      { role: "reader", en: "Will I be charged if a paper jam [ˋpepɚ dʒæm] occurs?", zh: "如果發生卡紙，我還會被收費嗎？" },
      { role: "librarian", en: "No, follow the instructions on the screen, and report the machine location if the problem continues. You may also request a receipt [rɪˋsit] at the desk.", zh: "不會，請依螢幕指示處理；若問題持續，請回報設備位置。您也可以到櫃檯申請收據。" },
    ],
    patterns: [
      { form: "Can I send it from...?", example: "Can I send the document from my laptop?", explanation: "用來詢問是否能從特定設備傳送檔案或工作。" },
      { form: "How can I pay for...?", example: "How can I pay for a color printout?", explanation: "用來詢問某項服務接受哪些付款方式。" },
      { form: "Will I be charged if...?", example: "Will I be charged if a paper jam occurs?", explanation: "用來確認發生異常狀況時是否仍會被收費。" },
    ],
    grammar: [
      { title: "原因介系詞", explanation: "用來說明服務因相容性或安全考量而受到限制。" },
      { title: "未來式被動語態", explanation: "詢問未來發生特定狀況時，使用者是否會被收取費用。" },
    ],
    vocabulary: [
      { word: "printout", kk: "ˋprɪnt͵aʊt", meaning: "列印文件", pos: "n." },
      { word: "photocopy", kk: "ˋfoto͵kɑpɪ", meaning: "影印本、影印", pos: "n." },
      { word: "compatibility", kk: "kəm͵pætəˋbɪlətɪ", meaning: "相容性", pos: "n." },
      { word: "select", kk: "səˋlɛkt", meaning: "選擇", pos: "v." },
      { word: "paper jam", kk: "ˋpepɚ dʒæm", meaning: "卡紙", pos: "phr." },
      { word: "receipt", kk: "rɪˋsit", meaning: "收據", pos: "n." },
      { word: "coin", kk: "kɔɪn", meaning: "硬幣", pos: "n." },
    ],
  },
  {
    id: 20,
    shortTitle: "委託代借",
    title: "委託他人代借館藏的申請與使用",
    summary: "說明委託代借的申請、啟用時間、受託人資格與終止方式。",
    sourceLabel: "委託代借圖書資料規定",
    sourceUrl: "https://www.lib.nthu.edu.tw/en/use/policies/policy20.html",
    dialogue: [
      { role: "reader", en: "I cannot come to the library regularly. May I authorize [ˋɔθə͵raɪz] someone to borrow books for me?", zh: "我無法經常親自到館，可以委託他人代借圖書嗎？" },
      { role: "librarian", en: "Yes, complete the proxy [ˋprɑksɪ] borrowing form and present it at the service desk with your valid [ˋvælɪd] library card.", zh: "可以，請填寫委託代借申請表，並持有效借書證到服務櫃檯辦理。" },
      { role: "reader", en: "When will the authorization become effective [ɪˋfɛktɪv]?", zh: "委託代借何時會生效？" },
      { role: "librarian", en: "It becomes effective one day after the application is completed.", zh: "申請完成後的次日生效。" },
      { role: "reader", en: "What must the proxy borrower do when checking out materials?", zh: "受託人代借館藏時需要做什麼？" },
      { role: "librarian", en: "The trustee [trʌsˋti] must be a valid library patron, state that the transaction is proxy borrowing, and present their own card. You may terminate [ˋtɝmə͵net] the authorization at the desk.", zh: "受託人必須是有效讀者，借書時主動說明是委託代借並出示自己的證件；您也可以到櫃檯終止委託。" },
    ],
    patterns: [
      { form: "May I authorize someone to...?", example: "May I authorize someone to borrow books for me?", explanation: "用來詢問是否能正式授權他人代為處理事情。" },
      { form: "When will ... become effective?", example: "When will the authorization become effective?", explanation: "用來詢問申請或授權從何時開始生效。" },
      { form: "... must state that...", example: "The proxy borrower must state that this is an authorized transaction.", explanation: "用來說明辦理服務時必須主動告知的重要資訊。" },
    ],
    grammar: [
      { title: "授權他人做某事", explanation: "使用授權動詞搭配受詞及不定詞，表達正式委託關係。" },
      { title: "間接陳述內容", explanation: "使用連接詞帶出受託人必須向館員說明的完整內容。" },
    ],
    vocabulary: [
      { word: "authorize", kk: "ˋɔθə͵raɪz", meaning: "授權、委託", pos: "v." },
      { word: "proxy", kk: "ˋprɑksɪ", meaning: "代理人、代理的", pos: "n." },
      { word: "trustee", kk: "trʌsˋti", meaning: "受託人", pos: "n." },
      { word: "valid", kk: "ˋvælɪd", meaning: "有效的", pos: "adj." },
      { word: "submit", kk: "səbˋmɪt", meaning: "提交", pos: "v." },
      { word: "effective", kk: "ɪˋfɛktɪv", meaning: "生效的", pos: "adj." },
      { word: "terminate", kk: "ˋtɝmə͵net", meaning: "終止", pos: "v." },
    ],
  },
];

export const posSpeech: Record<VocabularyItem["pos"], string> = {
  "n.": "名詞",
  "v.": "動詞",
  "adj.": "形容詞",
  "adv.": "副詞",
  "prep.": "介系詞",
  "conj.": "連接詞",
  "phr.": "片語",
};

export function stripForSpeech(text: string): string {
  return text
    .replace(/\[[^\]]*]/g, "")
    .replace(/\bNTHU\b/g, "N, T, H, U")
    .replace(/\bUST\b/g, "U, S, T")
    .replace(/\bVPN\b/g, "V, P, N")
    .replace(/\bALL4UST\b/g, "All Four U, S, T")
    .replace(/[*\/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const pad = (value: number) => String(value).padStart(2, "0");
const audioBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const audioAssetPath = (path: string) => `${audioBasePath}${path}`;

export const audioPaths = {
  dialogue: (scenarioId: number, turnIndex: number, language: "en" | "zh") =>
    audioAssetPath(
      `/audio/s${pad(scenarioId)}-t${pad(turnIndex + 1)}-${language}.mp3`,
    ),
  pattern: (scenarioId: number, patternIndex: number, language: "en" | "zh") =>
    audioAssetPath(
      `/audio/s${pad(scenarioId)}-p${pad(patternIndex + 1)}-${language}.mp3`,
    ),
  grammar: (scenarioId: number, grammarIndex: number) =>
    audioAssetPath(`/audio/s${pad(scenarioId)}-g${pad(grammarIndex + 1)}-zh.mp3`),
  vocabWord: (scenarioId: number, vocabIndex: number) =>
    audioAssetPath(`/audio/s${pad(scenarioId)}-v${pad(vocabIndex + 1)}-word.mp3`),
  vocabMeaning: (scenarioId: number, vocabIndex: number) =>
    audioAssetPath(`/audio/s${pad(scenarioId)}-v${pad(vocabIndex + 1)}-meaning.mp3`),
  alphabet: (letter: string) =>
    audioAssetPath(`/audio/alphabet-${letter.toLowerCase()}.mp3`),
};

export const allAudioPaths = [
  ...scenarios.flatMap((scenario) => [
    ...scenario.dialogue.flatMap((_, index) => [
      audioPaths.dialogue(scenario.id, index, "en"),
      audioPaths.dialogue(scenario.id, index, "zh"),
    ]),
    ...scenario.patterns.flatMap((_, index) => [
      audioPaths.pattern(scenario.id, index, "en"),
      audioPaths.pattern(scenario.id, index, "zh"),
    ]),
    ...scenario.grammar.map((_, index) => audioPaths.grammar(scenario.id, index)),
    ...scenario.vocabulary.flatMap((_, index) => [
      audioPaths.vocabWord(scenario.id, index),
      audioPaths.vocabMeaning(scenario.id, index),
    ]),
  ]),
  ..."abcdefghijklmnopqrstuvwxyz".split("").map(audioPaths.alphabet),
];
