/**
 * HealthCheck Pro Backend Script
 * 
 * 機能:
 * 1. スプレッドシートへのデータ行追加
 * 2. Google DriveへのPDF保存 (Base64デコード)
 * 
 * デプロイ手順:
 * 1. 左側の「サービス」+ボタンから「Drive API」を追加する（PDF保存に必要）。
 * 2. 「デプロイ」->「新しいデプロイ」-> 種類「ウェブアプリ」。
 * 3. 説明: 「v1」など。
 * 4. 次のユーザーとして実行: 「自分 (Me)」。
 * 5. アクセスできるユーザー: 「全員 (Anyone)」。※ここが重要
 * 6. 発行されたURLをReactアプリ側で設定。
 */

function doPost(e) {
  // CORS対策: JSONとして返す
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // データ受け取り
    // e.postData.contents は文字列として来るのでパースする
    const jsonString = e.postData.contents;
    const data = JSON.parse(jsonString);

    // 1. スプレッドシート処理
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("回答データ");
    if (!sheet) {
      sheet = ss.insertSheet("回答データ");
    }

    // ヘッダー行 (初回のみ)
    if (sheet.getLastRow() === 0) {
      const headers = [
        "日時", "氏名", "年齢", "性別", "身長(cm)", "体重(kg)", "BMI", 
        "気になっていること", "部位まとめ", "既往歴", "既往歴その他", 
        "服薬内容", "一般健診", "特定健診", "転倒歴あり", "転倒回数", "転倒けが", 
        "不安定感", "転倒恐怖", "転倒リスク判定", 
        "収縮期血圧", "拡張期血圧", "血圧コメント", "PDFリンク"
      ];
      sheet.appendRow(headers);
    }

    // 2. PDF保存処理
    let fileUrl = "なし";
    if (data.pdfFile) {
      // Base64デコード
      const decodedBytes = Utilities.base64Decode(data.pdfFile);
      const blob = Utilities.newBlob(decodedBytes, "application/pdf", 
        `HealthCheck_${data.fullName}_${Utilities.formatDate(new Date(), "JST", "yyyyMMdd_HHmm")}.pdf`
      );
      
      // ルートフォルダに保存（特定のフォルダに入れたい場合は DriveApp.getFolderById("ID") を使用）
      const file = DriveApp.createFile(blob);
      
      // 権限設定: リンクを知っている全員が閲覧可能にする（必要に応じて変更）
      // ※ 組織のポリシーによっては機能しない場合があります。その場合はこの行を削除してください。
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    }

    // 3. 行データ作成
    // スプレッドシートの列順序に合わせて配列を作成
    const rowData = [
      new Date(),            // 日時
      data.fullName,
      data.age,
      data.gender,
      data.height,
      data.weight,
      data.bmi,
      data.concerns,
      data.bodyPartsSummary, // "右膝:痛み:7/..."
      data.diseasesStr,      // "高血圧,糖尿病"
      data.historyOther,
      data.medications,
      data.checkupGeneral,   // 新:一般健診
      data.checkupSpecific,  // 新:特定健診
      data.fallHistory,
      data.fallCount,
      data.fallInjury,
      data.unstableFeeling,
      data.fearOfFalling,
      data.fallRiskJudgment,
      data.bpSystolic,
      data.bpDiastolic,
      data.bpComment,
      fileUrl
    ];

    // スプレッドシートに追加
    sheet.appendRow(rowData);

    // 成功レスポンス
    return output.setContent(JSON.stringify({
      status: 'success',
      message: 'Data saved successfully',
      fileUrl: fileUrl
    }));

  } catch (error) {
    // エラーレスポンス
    return output.setContent(JSON.stringify({
      status: 'error',
      message: error.toString()
    }));
  }
}

// GETリクエスト（テスト用）
function doGet(e) {
  const output = ContentService.createTextOutput();
  return output.setContent(JSON.stringify({ status: 'active', message: 'GAS Web App is running' }));
}