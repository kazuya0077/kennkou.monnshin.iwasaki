// フォームデータの型定義
// スプレッドシートの列構成に厳密に合わせるためのベース
export interface PatientData {
  // Step 1: 基本情報
  fullName: string;
  age: string; // 入力は数字だが、空文字許容のためstring扱い
  gender: '男' | '女' | '答えたくない' | '';
  height: string;
  weight: string;
  bmi: string; // 計算結果

  // Step 2: 気になること
  concerns: string;

  // Step 3: ボディマップ
  // 保存時は文字列結合されるが、Stateとしては配列で管理
  bodyParts: BodyPartRecord[];

  // Step 4: 病歴・服薬
  diseases: string[]; // チェックボックスの配列
  historyOther: string; // 既往歴：その他
  medications: string; // 服薬内容

  // Step 5: 健診受診状況 (2問に分離)
  checkupGeneral: 'ある' | 'ない' | '分からない' | ''; // 一般健診
  checkupSpecific: 'ある' | 'ない' | '分からない' | ''; // 特定健診

  // Step 6: 転倒リスク (3KQ)
  fallHistory: 'はい' | 'いいえ' | '';
  fallCount: string; // 1回, 2回, 3回以上
  fallInjury: 'あり' | 'なし' | '';
  unstableFeeling: 'はい' | 'いいえ' | '';
  fearOfFalling: 'はい' | 'いいえ' | '';
  fallRiskJudgment: '転倒の危険がある' | '今は低い' | '未判定' | '';

  // Step 7: 血圧
  bpSystolic: string; // 収縮期 (上の血圧)
  bpDiastolic: string; // 拡張期 (下の血圧)
  bpComment: string; // 自動生成されるコメント
}

// ボディマップの個別の記録
export interface BodyPartRecord {
  id: string; // ユニークID
  partName: string; // 部位名 (例: 膝, 首)
  side: '右' | '左' | '両側' | '中央'; // 左右区分
  symptom: string; // 症状
  level: number; // 強さ 0-10
}

// ボディマップの定義用
export interface BodyPartDefinition {
  id: string;
  label: string; // デフォルトのラベル
  defaultSide?: '中央' | '右' | '左'; // デフォルトの方向
  cx: number;
  cy: number;
  r?: number; // 円の場合
}