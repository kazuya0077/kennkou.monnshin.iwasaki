import { BodyPartDefinition } from './types';

// 病歴の選択肢
export const DISEASE_OPTIONS = [
  '高血圧',
  '糖尿病',
  '脂質異常症',
  '心臓の病気',
  '脳の病気',
  '骨粗しょう症',
  '関節の病気',
  '呼吸器の病気',
  '腎臓の病気',
];

// 健診状況の選択肢 (シンプル化)
export const CHECKUP_SIMPLE_OPTIONS = [
  'ある',
  'ない',
  '分からない',
];

// 3KQ 選択肢
export const YES_NO_UNKNOWN = [
  { value: 'はい', label: 'はい' },
  { value: 'いいえ', label: 'いいえ' },
  { value: '分からない', label: '分からない' },
];

// ボディマップの症状選択肢
export const SYMPTOM_TYPES = [
  '痛い',
  'しびれる',
  '感覚がにぶい',
];

// ボディマップの左右区分
export const SIDE_OPTIONS = [
  '右',
  '左',
  '両側',
  '中央',
];

// ボディマップの座標定義 (SVG coordinate system: 0-300 width, 0-500 height)
export const BODY_PART_ZONES: BodyPartDefinition[] = [
  { id: 'head', label: '頭', defaultSide: '中央', cx: 150, cy: 30, r: 20 },
  { id: 'neck', label: '首', defaultSide: '中央', cx: 150, cy: 65, r: 15 }, // 首を追加
  { id: 'r_shoulder', label: '肩', defaultSide: '右', cx: 100, cy: 100, r: 20 },
  { id: 'l_shoulder', label: '肩', defaultSide: '左', cx: 200, cy: 100, r: 20 },
  { id: 'chest', label: '胸・背中', defaultSide: '中央', cx: 150, cy: 120, r: 25 },
  { id: 'r_elbow', label: '肘', defaultSide: '右', cx: 80, cy: 160, r: 15 },
  { id: 'l_elbow', label: '肘', defaultSide: '左', cx: 220, cy: 160, r: 15 },
  { id: 'r_hand', label: '手首・手', defaultSide: '右', cx: 60, cy: 210, r: 15 },
  { id: 'l_hand', label: '手首・手', defaultSide: '左', cx: 240, cy: 210, r: 15 },
  { id: 'waist', label: '腰', defaultSide: '中央', cx: 150, cy: 200, r: 25 },
  { id: 'r_hip', label: '股関節', defaultSide: '右', cx: 120, cy: 240, r: 20 },
  { id: 'l_hip', label: '股関節', defaultSide: '左', cx: 180, cy: 240, r: 20 },
  { id: 'r_knee', label: '膝', defaultSide: '右', cx: 120, cy: 330, r: 20 },
  { id: 'l_knee', label: '膝', defaultSide: '左', cx: 180, cy: 330, r: 20 },
  { id: 'r_foot', label: '足首・足', defaultSide: '右', cx: 120, cy: 420, r: 20 },
  { id: 'l_foot', label: '足首・足', defaultSide: '左', cx: 180, cy: 420, r: 20 },
];
