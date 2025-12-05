import React, { useState, useEffect } from 'react';
import { PatientData } from './types';
import { DISEASE_OPTIONS, CHECKUP_SIMPLE_OPTIONS, YES_NO_ONLY } from './constants';
import { BodyMap } from './components/BodyMap';
import { RadioCard, CheckboxCard, ActionButton } from './components/UI';
import { generatePDFFromElement, getBloodPressureAdvice, getBloodPressureStatus } from './utils/pdfGenerator';
import { Activity, ChevronRight, ChevronLeft, Save, AlertTriangle, CheckCircle, FileText, Download, X, Loader2 } from 'lucide-react';

// 初期データ
const INITIAL_DATA: PatientData = {
  fullName: '',
  age: '',
  gender: '',
  height: '',
  weight: '',
  bmi: '',
  concerns: '',
  bodyParts: [],
  diseases: [],
  historyOther: '',
  medications: '',
  checkupGeneral: '',
  checkupSpecific: '',
  fallHistory: '',
  fallCount: '',
  fallInjury: '',
  unstableFeeling: '',
  fearOfFalling: '',
  fallRiskJudgment: '',
  bpSystolic: '',
  bpDiastolic: '',
  bpComment: ''
};

// 指定されたGAS URL (ユーザーには変更させない固定値)
const DEFAULT_API_URL = "https://script.google.com/macros/s/AKfycbwu7-olfE2RSK1xrQxz9EpL1DC-IBs-mAkOrO-zHO99LNUlm37YWaWtXAt39CDVBfHd/exec";

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PatientData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [progressMessage, setProgressMessage] = useState('');
  
  // API URL is now constant and hidden from UI manipulation
  const apiUrl = DEFAULT_API_URL;

  // --- Logic & Calculations ---

  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    if (!isNaN(h) && !isNaN(w) && h > 0) {
      const bmiVal = w / ((h / 100) ** 2);
      setFormData(prev => ({ ...prev, bmi: bmiVal.toFixed(1) }));
    } else {
      setFormData(prev => ({ ...prev, bmi: '' }));
    }
  }, [formData.height, formData.weight]);

  useEffect(() => {
    const { fallHistory, unstableFeeling, fearOfFalling } = formData;
    let judgment: PatientData['fallRiskJudgment'] = '未判定';

    // 全て選択されている場合のみ判定を行う
    if (fallHistory && unstableFeeling && fearOfFalling) {
      if (fallHistory === 'はい' || unstableFeeling === 'はい' || fearOfFalling === 'はい') {
        judgment = '転倒の危険がある';
      } else {
        judgment = '今は低い';
      }
    } else {
      judgment = '未判定';
    }

    if (formData.fallRiskJudgment !== judgment) {
      setFormData(prev => ({ ...prev, fallRiskJudgment: judgment }));
    }
  }, [formData.fallHistory, formData.unstableFeeling, formData.fearOfFalling]);

  useEffect(() => {
    if (formData.bpSystolic && formData.bpDiastolic) {
      const advice = getBloodPressureAdvice(formData.bpSystolic, formData.bpDiastolic);
      if (formData.bpComment !== advice) {
        setFormData(prev => ({ ...prev, bpComment: advice }));
      }
    }
  }, [formData.bpSystolic, formData.bpDiastolic]);

  // --- Handlers ---

  const handleInputChange = (field: keyof PatientData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDiseaseToggle = (disease: string) => {
    setFormData(prev => {
      const current = prev.diseases;
      if (current.includes(disease)) {
        return { ...prev, diseases: current.filter(d => d !== disease) };
      } else {
        return { ...prev, diseases: [...current, disease] };
      }
    });
  };

  // ステップごとのバリデーション
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        // 氏名は必須
        return !!formData.fullName;
      case 6:
        // 3KQは全て回答必須
        return formData.fallHistory !== '' && 
               formData.unstableFeeling !== '' && 
               formData.fearOfFalling !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isStepValid()) {
      window.scrollTo(0, 0);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    window.scrollTo(0, 0);
    setCurrentStep(prev => prev - 1);
  };

  const handlePreviewPDF = async () => {
    try {
      const blob = await generatePDFFromElement('pdf-report-content');
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      alert('PDF生成に失敗しました: ' + e);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const blob = await generatePDFFromElement('pdf-report-content');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HealthCheck_${formData.fullName}_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert('PDF生成に失敗しました: ' + e);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setProgressMessage('PDFレポートを作成しています...\nこれには数秒かかる場合があります');

    try {
      // PDF生成処理の前に少し待機してUIを描画させる
      await new Promise(resolve => setTimeout(resolve, 100));

      const pdfBlob = await generatePDFFromElement('pdf-report-content');
      
      setProgressMessage('データを送信準備中...');
      
      // Blob to Base64 (Promisified)
      const base64PDF = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });

      setProgressMessage('Googleスプレッドシートへ保存中...');

      const payload = {
        ...formData,
        bodyPartsSummary: formData.bodyParts.map(p => `${p.side === '中央' ? '' : p.side}${p.partName}（${p.symptom}：${p.level}/10）`).join('／'),
        diseasesStr: formData.diseases.join(','),
        pdfFile: base64PDF
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSubmitStatus('success');
      } else {
        throw new Error(result.message || 'Unknown error');
      }

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_DATA);
    setCurrentStep(1);
    setSubmitStatus('idle');
  };

  // Helper to get color class for BP
  const getBpColorClass = (sys: string, dia: string) => {
    const status = getBloodPressureStatus(sys, dia);
    switch(status) {
      case 'red': return 'border-red-500 bg-red-50 text-red-900';
      case 'yellow': return 'border-yellow-500 bg-yellow-50 text-yellow-900';
      case 'blue': return 'border-blue-500 bg-blue-50 text-blue-900';
      default: return 'border-blue-500 bg-blue-50 text-blue-900';
    }
  };

  // --- Rendering Steps ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">基本情報の入力</h2>
            
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">氏名 <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => handleInputChange('fullName', e.target.value)}
                  className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-medical-500 focus:ring-4 focus:ring-medical-50 transition-all font-bold text-lg"
                  placeholder="例：山田 太郎"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">年齢</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.age}
                      onChange={e => handleInputChange('age', e.target.value)}
                      className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-medical-500 focus:ring-4 focus:ring-medical-50 transition-all font-bold text-lg"
                      placeholder=""
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">歳</span>
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">性別</label>
                   <div className="flex gap-3">
                     {['男', '女', '答えたくない'].map(g => (
                       <RadioCard
                         key={g}
                         name="gender"
                         value={g}
                         label={g}
                         checked={formData.gender === g}
                         onChange={(val) => handleInputChange('gender', val)}
                         className="flex-1 justify-center"
                       />
                     ))}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-start">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">身長</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.height}
                      onChange={e => handleInputChange('height', e.target.value)}
                      className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-medical-500 transition-all font-bold text-lg"
                      placeholder="160"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">体重</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={e => handleInputChange('weight', e.target.value)}
                      className="w-full p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-medical-500 transition-all font-bold text-lg"
                      placeholder="60"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">kg</span>
                  </div>
                </div>
                <div className="bg-slate-100 p-4 rounded-xl text-center border-2 border-slate-200 flex flex-col justify-center h-[92px]">
                  <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">BMI</span>
                  <span className="text-2xl font-bold text-slate-800">{formData.bmi || '--'}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">身体の気になること</h2>
            <div>
              <label className="block text-lg font-bold text-slate-700 mb-4">
                身体のことで気になっていることを<br/>自由に教えてください
              </label>
              <textarea
                value={formData.concerns}
                onChange={e => handleInputChange('concerns', e.target.value)}
                className="w-full h-64 p-5 border-2 border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-medical-500 focus:ring-4 focus:ring-medical-50 resize-none text-lg leading-relaxed shadow-sm"
                placeholder="例）歩くと右膝の内側が痛くなる、長時間立つと腰が重い など"
                maxLength={200}
              />
              <div className="text-right text-sm text-slate-500 mt-2 font-bold">
                {formData.concerns.length} / 200文字
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8 animate-fade-in h-full">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">痛む・気になる部位</h2>
            <BodyMap 
              records={formData.bodyParts}
              onChange={(records) => handleInputChange('bodyParts', records)}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">これまでの病気・服薬</h2>
             
             <div>
               <label className="block text-lg font-bold text-slate-700 mb-4">
                 これまでにかかったことのある病気（複数選択）
               </label>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {DISEASE_OPTIONS.map(disease => (
                   <CheckboxCard
                     key={disease}
                     label={disease}
                     checked={formData.diseases.includes(disease)}
                     onChange={() => handleDiseaseToggle(disease)}
                   />
                 ))}
                 <CheckboxCard
                   label="その他"
                   checked={formData.diseases.includes('その他')}
                   onChange={() => handleDiseaseToggle('その他')}
                 />
               </div>
               
               {formData.diseases.includes('その他') && (
                 <div className="mt-4 animate-fade-in">
                    <label className="block text-sm font-bold text-slate-700 mb-2">その他の病気名</label>
                    <input
                      type="text"
                      value={formData.historyOther}
                      onChange={e => handleInputChange('historyOther', e.target.value)}
                      className="w-full p-3 border-2 border-slate-200 bg-white text-slate-900 rounded-lg outline-none focus:border-medical-500"
                      placeholder="具体的な病名を入力"
                    />
                 </div>
               )}
             </div>

             <div className="pt-6 border-t border-slate-200">
                <label className="block text-lg font-bold text-slate-700 mb-4">
                  現在飲んでいる薬があれば教えてください
                </label>
                <textarea
                  value={formData.medications}
                  onChange={e => handleInputChange('medications', e.target.value)}
                  className="w-full h-32 p-4 border-2 border-slate-200 bg-white text-slate-900 rounded-xl outline-none focus:border-medical-500 focus:ring-4 focus:ring-medical-50 resize-none"
                  placeholder="例）血圧の薬、痛み止め など"
                />
             </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">健康診断の受診状況</h2>
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <p className="font-bold text-lg text-slate-800 mb-4">
                  1. 一般健診を受けたことがありますか？
                </p>
                <div className="flex flex-col gap-3">
                  {CHECKUP_SIMPLE_OPTIONS.map(option => (
                    <RadioCard
                      key={`gen-${option}`}
                      name="checkupGeneral"
                      value={option}
                      label={option}
                      checked={formData.checkupGeneral === option}
                      onChange={val => handleInputChange('checkupGeneral', val)}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="font-bold text-lg text-slate-800 mb-4">
                  2. 特定健診（メタボ健診など）を受けたことがありますか？
                </p>
                <div className="flex flex-col gap-3">
                  {CHECKUP_SIMPLE_OPTIONS.map(option => (
                    <RadioCard
                      key={`spec-${option}`}
                      name="checkupSpecific"
                      value={option}
                      label={option}
                      checked={formData.checkupSpecific === option}
                      onChange={val => handleInputChange('checkupSpecific', val)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
           <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">転倒リスクチェック (3KQ) <span className="text-red-600 text-sm">*必須</span></h2>
             
             {/* Q1 */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="font-bold text-lg text-slate-800 mb-4">Q1. 過去1年に転んだことはありますか？</p>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  {YES_NO_ONLY.map(({value, label}) => (
                    <RadioCard
                      key={value}
                      name="fallHistory"
                      value={value}
                      label={label}
                      checked={formData.fallHistory === value}
                      onChange={val => handleInputChange('fallHistory', val)}
                      className="flex-1 justify-center"
                    />
                  ))}
                </div>

                {formData.fallHistory === 'はい' && (
                  <div className="mt-6 bg-slate-50 p-5 rounded-xl border border-medical-200 space-y-5 animate-fade-in">
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">転倒の回数</label>
                       <input 
                         type="text"
                         value={formData.fallCount}
                         onChange={e => handleInputChange('fallCount', e.target.value)}
                         placeholder="例：2回"
                         className="w-full p-3 border border-slate-300 rounded-lg bg-white"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-slate-700 mb-2">転倒によるけが</label>
                       <div className="flex gap-3">
                         {['あり', 'なし'].map(opt => (
                            <label key={opt} className="flex items-center bg-white px-4 py-2 rounded border border-slate-300 cursor-pointer hover:bg-slate-50">
                              <input 
                                type="radio" 
                                name="fallInjury" 
                                value={opt}
                                checked={formData.fallInjury === opt}
                                onChange={e => handleInputChange('fallInjury', e.target.value)}
                                className="mr-2 accent-medical-600 w-4 h-4"
                              /> 
                              <span className="font-bold text-slate-700">{opt}</span>
                            </label>
                         ))}
                       </div>
                     </div>
                  </div>
                )}
             </div>

             {/* Q2 */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="font-bold text-lg text-slate-800 mb-4">Q2. 立っているときや歩いているときに、不安定だと感じることはありますか？</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {YES_NO_ONLY.map(({value, label}) => (
                    <RadioCard
                      key={value}
                      name="unstableFeeling"
                      value={value}
                      label={label}
                      checked={formData.unstableFeeling === value}
                      onChange={val => handleInputChange('unstableFeeling', val)}
                      className="flex-1 justify-center"
                    />
                  ))}
                </div>
             </div>

             {/* Q3 */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="font-bold text-lg text-slate-800 mb-4">Q3. 転ぶのがこわいと感じますか？</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {YES_NO_ONLY.map(({value, label}) => (
                    <RadioCard
                      key={value}
                      name="fearOfFalling"
                      value={value}
                      label={label}
                      checked={formData.fearOfFalling === value}
                      onChange={val => handleInputChange('fearOfFalling', val)}
                      className="flex-1 justify-center"
                    />
                  ))}
                </div>
             </div>
           </div>
        );

      case 7:
        const bpColorClass = getBpColorClass(formData.bpSystolic, formData.bpDiastolic);
        
        return (
          <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">血圧の入力</h2>
            
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-center">
              <div className="w-full max-w-xs">
                <label className="block text-center text-sm font-bold text-slate-500 mb-2 tracking-widest">収縮期 (上)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.bpSystolic}
                    onChange={e => handleInputChange('bpSystolic', e.target.value)}
                    className="w-full py-4 px-6 border-2 border-slate-200 bg-white text-slate-900 text-4xl font-bold rounded-2xl outline-none focus:border-medical-500 text-center"
                    placeholder="---"
                  />
                  <span className="absolute right-4 bottom-4 text-slate-400 font-bold">mmHg</span>
                </div>
              </div>
              <div className="text-3xl text-slate-300 font-light">/</div>
              <div className="w-full max-w-xs">
                <label className="block text-center text-sm font-bold text-slate-500 mb-2 tracking-widest">拡張期 (下)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.bpDiastolic}
                    onChange={e => handleInputChange('bpDiastolic', e.target.value)}
                    className="w-full py-4 px-6 border-2 border-slate-200 bg-white text-slate-900 text-4xl font-bold rounded-2xl outline-none focus:border-medical-500 text-center"
                    placeholder="---"
                  />
                  <span className="absolute right-4 bottom-4 text-slate-400 font-bold">mmHg</span>
                </div>
              </div>
            </div>

            {/* コメントプレビュー */}
            {formData.bpComment && (
              <div className={`p-6 rounded-xl border-l-8 shadow-sm flex gap-4 ${bpColorClass}`}>
                <Activity className="flex-shrink-0 mt-1" />
                <div>
                  <p className="font-bold text-lg mb-2">判定結果</p>
                  <p className="leading-relaxed font-medium">{formData.bpComment}</p>
                </div>
              </div>
            )}
          </div>
        );
        
      case 8:
        return (
          <div className="space-y-8 animate-fade-in">
             <h2 className="text-2xl font-bold text-slate-800 border-b pb-4">内容の確認と保存</h2>
             
             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
               <Row label="氏名" value={formData.fullName} />
               <Row label="年齢 / 性別" value={`${formData.age}歳 / ${formData.gender}`} />
               <Row label="体格" value={`身長:${formData.height}cm / 体重:${formData.weight}kg / BMI:${formData.bmi}`} />
               <Row label="血圧" value={`上:${formData.bpSystolic} / 下:${formData.bpDiastolic}`} />
               <Row label="気になること" value={formData.concerns} />
               <Row label="部位" value={
                 formData.bodyParts.length > 0 
                  ? formData.bodyParts.map(p => `${p.side === '中央' ? '' : p.side}${p.partName}（${p.symptom}：${p.level}/10）`).join('、') 
                  : 'なし'
               } />
               <Row label="病歴" value={formData.diseases.join(', ') + (formData.historyOther ? ` (${formData.historyOther})` : '')} />
               <Row label="健診" value={`一般:${formData.checkupGeneral} / 特定:${formData.checkupSpecific}`} />
               <Row label="転倒リスク" value={formData.fallRiskJudgment} highlight={formData.fallRiskJudgment === '転倒の危険がある'} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <ActionButton onClick={handlePreviewPDF} variant="secondary" className="bg-white">
                  <FileText size={20} />
                  PDFプレビュー
                </ActionButton>
                <ActionButton onClick={handleDownloadPDF} variant="secondary" className="bg-white">
                  <Download size={20} />
                  PDFダウンロード
                </ActionButton>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  const Row = ({ label, value, highlight = false }: { label: string, value: string | undefined, highlight?: boolean }) => (
    <div className="flex flex-col sm:flex-row p-4 sm:items-center hover:bg-slate-50 transition-colors">
      <div className="sm:w-1/3 font-bold text-slate-500 text-sm sm:text-base mb-1 sm:mb-0">{label}</div>
      <div className={`sm:w-2/3 font-medium ${highlight ? 'text-red-600 font-bold' : 'text-slate-900'}`}>
        {value || <span className="text-slate-300 italic">未入力</span>}
      </div>
    </div>
  );

  // --- Main Render ---

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 max-w-md w-full text-center space-y-8 animate-scale-in">
          <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={48} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-3">送信完了</h2>
            <p className="text-slate-600 leading-relaxed">
              データが保存され、PDFがドライブにアップロードされました。
            </p>
          </div>
          <ActionButton onClick={resetForm} variant="success" className="w-full justify-center">
            新しい入力を始める
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 text-slate-900">
      {/* Hidden PDF Report Template */}
      <div className="fixed left-[-9999px] top-0">
        <PdfReportTemplate data={formData} />
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-fade-in p-4 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full">
            <Loader2 className="w-12 h-12 text-medical-600 animate-spin mb-4" strokeWidth={2.5} />
            <p className="text-lg font-bold text-slate-800 animate-pulse whitespace-pre-wrap leading-relaxed">{progressMessage}</p>
            <p className="text-xs text-slate-400 mt-4 font-bold">画面を閉じないでください</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 text-medical-700">
            <div className="bg-medical-50 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-medical-600" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">HealthCheck Pro</h1>
          </div>
          <div className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
            Step {currentStep} / 8
          </div>
        </div>
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className="h-full bg-medical-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(14,165,233,0.5)]"
            style={{ width: `${(currentStep / 8) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-10 min-h-[60vh] transition-all">
          {renderStepContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex justify-between gap-4">
          <ActionButton
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            variant="secondary"
            className="flex-1"
          >
            <ChevronLeft size={20} />
            戻る
          </ActionButton>

          {currentStep < 8 ? (
            <ActionButton
              onClick={handleNext}
              disabled={!isStepValid()}
              variant="primary"
              className="flex-[2]"
            >
              次へ
              <ChevronRight size={20} />
            </ActionButton>
          ) : (
            <ActionButton
              onClick={handleSubmit}
              disabled={isSubmitting}
              variant={isSubmitting ? "secondary" : "success"}
              className="flex-[2]"
            >
              {isSubmitting ? '処理中...' : 'GASで保存'}
              {!isSubmitting && <Save size={20} />}
            </ActionButton>
          )}
        </div>
      </footer>
      
      {/* Error Toast */}
      {submitStatus === 'error' && (
        <div className="fixed top-24 right-4 max-w-sm bg-red-50 border-l-4 border-red-500 text-red-900 p-4 rounded shadow-2xl flex items-start gap-3 z-50 animate-slide-in">
          <AlertTriangle className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-lg mb-1">エラーが発生しました</p>
            <p>データを送信できませんでした。設定したGASのURLが正しいか確認してください。</p>
          </div>
          <button onClick={() => setSubmitStatus('idle')} className="ml-auto text-red-400 hover:text-red-700 p-1">
             <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

// --- PDF Report Template (Dynamic Size Layout) ---
const PdfReportTemplate: React.FC<{ data: PatientData }> = ({ data }) => {
  // Determine color class for PDF report based on BP
  const bpColorClass = (sys: string, dia: string) => {
    const status = getBloodPressureStatus(sys, dia);
    switch(status) {
      case 'red': return 'bg-red-50 border-red-500 text-red-900';
      case 'yellow': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'blue': return 'bg-blue-50 border-blue-500 text-blue-900';
      default: return 'bg-blue-50 border-blue-500 text-blue-900';
    }
  };

  const bpClass = bpColorClass(data.bpSystolic, data.bpDiastolic);
  const sys = parseInt(data.bpSystolic);
  const dia = parseInt(data.bpDiastolic);

  return (
    // Note: We use w-[210mm] to simulate A4 width, but let height be auto
    <div id="pdf-report-content" className="w-[210mm] bg-white text-black p-[15mm] text-sm leading-relaxed box-border font-sans">
      
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">健康チェック結果レポート</h1>
          <p className="text-slate-500">作成日: {new Date().toLocaleDateString('ja-JP', {year:'numeric', month:'long', day:'numeric'})}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{data.fullName} 様</p>
          <p className="text-slate-600">{data.age}歳 / {data.gender}</p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="space-y-6">
        
        {/* Basic Info */}
        <section>
          <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-600 mb-3">基本測定</h2>
          <div className="grid grid-cols-2 gap-4">
             <div className="border p-3 rounded">
               <span className="block text-slate-500 text-xs font-bold">体格</span>
               <span className="font-bold text-lg">
                 {data.height}cm / {data.weight}kg (BMI: {data.bmi})
               </span>
             </div>
             <div className="border p-3 rounded flex flex-col justify-between">
               <span className="block text-slate-500 text-xs font-bold mb-1">血圧</span>
               <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${sys >= 140 ? 'text-red-600' : 'text-slate-900'}`}>
                    {data.bpSystolic}
                  </span>
                  <span className="text-slate-400">/</span>
                  <span className={`text-2xl font-bold ${dia >= 90 ? 'text-red-600' : 'text-slate-900'}`}>
                    {data.bpDiastolic}
                  </span>
                  <span className="text-sm ml-1">mmHg</span>
               </div>
             </div>
          </div>
          {data.bpComment && (
            <div className={`mt-2 p-3 border rounded text-sm ${bpClass}`}>
              <strong>【判定結果】</strong> {data.bpComment}
            </div>
          )}
          {/* BP Legend */}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs bg-white border border-slate-200 rounded p-2">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded-full flex-shrink-0"></div>
               <span>正常: 上140未満 かつ 下90未満</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-yellow-100 border border-yellow-500 rounded-full flex-shrink-0"></div>
               <span>注意: 上140~179 または 下90~109</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-red-100 border border-red-500 rounded-full flex-shrink-0"></div>
               <span>高度: 上180以上 または 下110以上</span>
            </div>
          </div>
        </section>

        {/* Concerns */}
        <section>
          <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-600 mb-3">気になること</h2>
          <div className="border p-4 rounded min-h-[80px] bg-slate-50">
            {data.concerns || '特になし'}
          </div>
        </section>

        {/* Body Map - Updated Table Layout */}
        <section>
          <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-600 mb-3">痛む・気になる部位</h2>
          {data.bodyParts.length > 0 ? (
            <table className="w-full text-sm border-collapse border border-slate-300">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-300 p-2 text-left w-1/3">部位</th>
                  <th className="border border-slate-300 p-2 text-left w-1/3">症状</th>
                  <th className="border border-slate-300 p-2 text-center w-1/3">強さ (0-10)</th>
                </tr>
              </thead>
              <tbody>
                {data.bodyParts.map((p, i) => (
                  <tr key={i} className="bg-white">
                    <td className="border border-slate-300 p-2 font-bold">{p.side === '中央' ? '' : p.side + ' '}{p.partName}</td>
                    <td className="border border-slate-300 p-2">{p.symptom}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{p.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 border p-4 rounded text-center">記録なし</p>
          )}
        </section>

        {/* History */}
        <section>
          <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-600 mb-3">既往歴・服薬</h2>
          <div className="space-y-2 border p-4 rounded">
            <div className="flex gap-2">
              <span className="font-bold w-20 flex-shrink-0 text-slate-600">既往歴:</span>
              <span className="font-bold">{data.diseases.join(', ') || 'なし'} {data.historyOther && `(${data.historyOther})`}</span>
            </div>
            <div className="border-t my-2"></div>
            <div className="flex gap-2">
              <span className="font-bold w-20 flex-shrink-0 text-slate-600">服薬:</span>
              <span>{data.medications || 'なし'}</span>
            </div>
          </div>
        </section>

        {/* Checkups */}
        <section>
          <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-600 mb-3">健診受診状況</h2>
          <div className="grid grid-cols-2 gap-4">
             <div className="border p-3 rounded bg-slate-50">
               <span className="text-slate-500 text-xs block mb-1">一般健診</span>
               <span className="font-bold text-lg">{data.checkupGeneral}</span>
             </div>
             <div className="border p-3 rounded bg-slate-50">
               <span className="text-slate-500 text-xs block mb-1">特定健診</span>
               <span className="font-bold text-lg">{data.checkupSpecific}</span>
             </div>
          </div>
        </section>

        {/* Fall Risk */}
        <section>
          <h2 className="text-lg font-bold bg-slate-100 p-2 border-l-4 border-slate-600 mb-3">転倒リスク評価</h2>
          <div className="p-4 border-2 border-slate-200 rounded-lg flex justify-between items-center">
             <div className="space-y-1 text-sm">
               <p>1. 過去1年の転倒: <b>{data.fallHistory}</b> {data.fallHistory === 'はい' && `(${data.fallCount}, 怪我${data.fallInjury})`}</p>
               <p>2. 不安定感: <b>{data.unstableFeeling}</b></p>
               <p>3. 転倒恐怖: <b>{data.fearOfFalling}</b></p>
             </div>
             <div className="text-right">
               <p className="text-sm font-bold text-slate-500">判定結果</p>
               <p className="text-2xl font-bold">{data.fallRiskJudgment}</p>
             </div>
          </div>
        </section>

      </div>
      
      {/* Footer */}
      <div className="mt-12 pt-4 border-t text-center text-slate-400 text-xs">
        HealthCheck Pro Report System
      </div>
    </div>
  );
};

export default App;