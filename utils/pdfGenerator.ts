import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 指定されたHTML要素をキャプチャしてPDF化し、Blobとして返す
 * @param elementId PDF化したいDOM要素のID
 */
export const generatePDFFromElement = async (elementId: string): Promise<Blob> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  // 1. html2canvasで要素をCanvas化
  // scale: 2 で高解像度化
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  
  // 2. jsPDFでPDF化
  // A4サイズ (210mm x 297mm)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  const imgProps = pdf.getImageProperties(imgData);
  const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

  // 画像をPDFに追加
  // 高さがA4より長い場合は複数ページにするロジックも追加可能だが、
  // 今回はレポートをA4 1枚に収める前提、または縮小して収める
  
  if (imgHeight > pdfHeight) {
    // ページまたぎが必要な場合（簡易実装として縮小または複数ページ）
    // 今回の要件では、1枚のレポートを想定。
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
  } else {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
  }

  return pdf.output('blob');
};

/**
 * 血圧のステータス判定 (赤、黄、青)
 */
export const getBloodPressureStatus = (sysStr: string, diaStr: string): 'red' | 'yellow' | 'blue' => {
  const sys = parseInt(sysStr);
  const dia = parseInt(diaStr);

  if (isNaN(sys) || isNaN(dia)) return 'blue'; // デフォルト

  // Cゾーン: 180以上 or 110以上 -> 赤 (Red Flag)
  if (sys >= 180 || dia >= 110) {
    return 'red';
  }
  
  // Bゾーン: 140以上 or 90以上 -> 黄 (中等度)
  if (sys >= 140 || dia >= 90) {
    return 'yellow';
  }

  // Aゾーン: 140未満 かつ 90未満 -> 青 (正常〜正常高値)
  return 'blue';
};

/**
 * 血圧のゾーン判定ロジック (アドバイス文言)
 */
export const getBloodPressureAdvice = (sysStr: string, diaStr: string): string => {
  const status = getBloodPressureStatus(sysStr, diaStr);

  if (status === 'red') {
    return '【重要】血圧の値がかなり高い範囲に入っています。体調が安定していても、できるだけ早く医療機関（かかりつけ医など）にご相談されることを強くおすすめします。';
  }
  
  if (status === 'blue') {
    return '血圧の値は大きな問題はなさそうです。今後も定期的な健診で様子を見ていきましょう。';
  }

  // yellow
  return '血圧がやや高めの範囲です。次回の健診や、かかりつけ医で一度ご相談されることをおすすめします。';
};