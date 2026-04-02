// ================================================================
//  ★ 設定 ★  ここを自分の値に書き換えてください
// ================================================================
const CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN';
const SPREADSHEET_ID       = 'YOUR_SPREADSHEET_ID';
const SHEET_NAME           = 'applications';

// ================================================================
//  メイン : doPost（LIFF フォームからのデータ受信）
// ================================================================
function doPost(e) {
  try {
    const raw  = (e.parameter && e.parameter.payload)
               ? e.parameter.payload
               : e.postData.contents;
    const data = JSON.parse(raw);

    // ── 1. スプレッドシートに保存 ──
    saveToSheet(data);

    // ── 2. Push Message で「受け付けました」を送信 ──
    pushMessage(data.userId, [
      {
        type: 'text',
        text: '✅ お申し込みを受け付けました！\n\n'
            + '内容を確認の上、担当者よりご連絡いたします。\n'
            + 'しばらくお待ちくださいませ。'
      }
    ]);

    return HtmlService.createHtmlOutput('<html><body>OK</body></html>');

  } catch (err) {
    console.error('doPost error:', err);
    return HtmlService.createHtmlOutput('<html><body>ERROR</body></html>');
  }
}

// ================================================================
//  スプレッドシート保存
// ================================================================
function saveToSheet(data) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  let   sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'タイムスタンプ',
      'LINE userId',
      '店舗名',
      '担当者名',
      '業態',
      'HP / 掲載媒体URL',
      'GoogleビジネスプロフィールURL',
      '対策ワード①',
      '対策ワード②',
      '対策ワード③'
    ]);
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  const kw = data.keywords || [];

  sheet.appendRow([
    new Date(),
    data.userId       || '',
    data.shopName     || '',
    data.contactName  || '',
    data.businessType || '',
    data.hpUrl        || '',
    data.gbpUrl       || '',
    kw[0] || '',
    kw[1] || '',
    kw[2] || ''
  ]);
}

// ================================================================
//  Push Message 送信
// ================================================================
function pushMessage(userId, messages) {
  if (!userId) {
    console.error('pushMessage: userId is empty');
    return;
  }

  const res = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN
    },
    payload: JSON.stringify({
      to:       userId,
      messages: messages
    }),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  if (code !== 200) {
    console.error('LINE Push API error:', code, res.getContentText());
  }
}

// ================================================================
//  動作確認用
// ================================================================
function doGet(e) {
  return HtmlService.createHtmlOutput('<html><body>Server is running</body></html>');
}
