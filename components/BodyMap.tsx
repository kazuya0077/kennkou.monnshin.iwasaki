import React, { useState, useEffect } from 'react';
import { BODY_PART_ZONES, SYMPTOM_TYPES } from '../constants';
import { BodyPartRecord, BodyPartDefinition } from '../types';
import { PlusCircle, Trash2, X } from 'lucide-react';

interface BodyMapProps {
  records: BodyPartRecord[];
  onChange: (records: BodyPartRecord[]) => void;
}

export const BodyMap: React.FC<BodyMapProps> = ({ records, onChange }) => {
  const [selectedZone, setSelectedZone] = useState<BodyPartDefinition | null>(null);
  
  // Modal State
  const [partName, setPartName] = useState('');
  const [side, setSide] = useState('');
  const [symptom, setSymptom] = useState(SYMPTOM_TYPES[0]);
  const [level, setLevel] = useState(5);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (selectedZone) {
      setPartName(selectedZone.label);
      // クリックされたゾーンの defaultSide をそのまま使用する
      setSide(selectedZone.defaultSide || '中央');
      setSymptom(SYMPTOM_TYPES[0]);
      setLevel(5);
      setIsModalOpen(true);
    }
  }, [selectedZone]);

  const handleZoneClick = (zone: BodyPartDefinition) => {
    setSelectedZone(zone);
  };

  const handleAddRecord = () => {
    if (!selectedZone) return;

    const newRecord: BodyPartRecord = {
      id: Date.now().toString(),
      partName,
      side: side as any,
      symptom,
      level
    };

    if (records.length >= 20) {
      alert('登録できるのは20部位までです');
      return;
    }

    onChange([...records, newRecord]);
    setIsModalOpen(false);
    setSelectedZone(null);
  };

  const handleRemoveRecord = (id: string) => {
    onChange(records.filter(r => r.id !== id));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedZone(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Stick Figure Area */}
      <div className="flex-shrink-0 mx-auto lg:mx-0 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 relative w-[340px] flex flex-col items-center select-none">
        <h3 className="text-sm font-bold text-slate-500 mb-4 bg-slate-100 px-4 py-1 rounded-full">図の部位をタップしてください</h3>
        
        {/* SVG Container */}
        <div className="relative">
          {/* R/L Labels - Positioned to not overlap and be visible */}
          <div className="absolute top-10 left-0 w-full h-full pointer-events-none z-0 flex justify-between px-2">
            <div className="flex flex-col items-center justify-center h-full w-12">
               <span className="text-6xl font-black text-slate-300 select-none writing-vertical-rl">右</span>
            </div>
            <div className="flex flex-col items-center justify-center h-full w-12">
               <span className="text-6xl font-black text-slate-300 select-none writing-vertical-rl">左</span>
            </div>
          </div>

          <svg width="300" height="460" viewBox="0 0 300 460" className="cursor-pointer touch-manipulation z-10 relative">
            {/* Stick Figure Lines */}
            <g stroke="#334155" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              {/* Torso */}
              <line x1="150" y1="50" x2="150" y2="200" />
              {/* Shoulders */}
              <line x1="100" y1="100" x2="200" y2="100" />
              {/* Arms */}
              <line x1="100" y1="100" x2="80" y2="160" /> {/* R upper */}
              <line x1="80" y1="160" x2="60" y2="210" />  {/* R lower */}
              <line x1="200" y1="100" x2="220" y2="160" /> {/* L upper */}
              <line x1="220" y1="160" x2="240" y2="210" /> {/* L lower */}
              {/* Hips */}
              <line x1="150" y1="200" x2="120" y2="240" />
              <line x1="150" y1="200" x2="180" y2="240" />
              {/* Legs */}
              <line x1="120" y1="240" x2="120" y2="330" />
              <line x1="120" y1="330" x2="120" y2="420" />
              <line x1="180" y1="240" x2="180" y2="330" />
              <line x1="180" y1="330" x2="180" y2="420" />
            </g>
            
            {/* Head Circle */}
            <circle cx="150" cy="30" r="20" fill="#ffffff" stroke="#334155" strokeWidth="3" />

            {/* Interactive Zones */}
            {BODY_PART_ZONES.map((zone) => (
              <g key={zone.id} onClick={() => handleZoneClick(zone)} className="group">
                {/* Hit Area (Invisible but clickable) */}
                <circle
                  cx={zone.cx}
                  cy={zone.cy}
                  r={zone.r + 8} 
                  fill="transparent" 
                  className="hover:fill-medical-500/20 cursor-pointer transition-colors"
                />
                {/* Visible Marker (Shows on hover) */}
                <circle 
                  cx={zone.cx} 
                  cy={zone.cy} 
                  r="6" 
                  className="fill-medical-500 opacity-30 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm" 
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* List Area */}
      <div className="flex-grow w-full">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-full min-h-[460px] flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>登録された部位</span>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{records.length}/20</span>
          </h3>

          {records.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-8">
              <p>まだ登録がありません</p>
              <p className="text-sm mt-2">左の図から部位を選んでください</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
              {records.map((record) => (
                <div key={record.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-medical-300 transition-all">
                  <div>
                    <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
                      <span className="text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-normal">{record.side}</span>
                      {record.partName}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 flex items-center gap-3">
                      <span className="font-bold text-medical-600 bg-medical-50 px-2 py-0.5 rounded">
                        {record.symptom}
                      </span>
                      <span>
                        強さ: <span className="font-bold text-slate-900">{record.level}</span>
                        <span className="text-slate-400 text-xs">/10</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveRecord(record.id)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-3 rounded-full transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modern Modal Form */}
      {isModalOpen && selectedZone && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-medical-500 rounded-full"></span>
                詳細入力
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-8 overflow-y-auto">
              
              {/* 部位表示 */}
              <div className="text-center bg-slate-50 py-6 rounded-xl border border-slate-100">
                 <p className="text-sm text-slate-500 font-bold mb-1">選択部位</p>
                 <p className="text-3xl font-bold text-medical-700">
                    {side === '中央' ? '' : side} {partName}
                 </p>
              </div>

              {/* 症状の種類 (Chips) */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">どんな症状ですか？</label>
                <div className="grid grid-cols-3 gap-3">
                  {SYMPTOM_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSymptom(type)}
                      className={`
                        py-3 px-2 rounded-xl border-2 transition-all font-bold text-sm
                        ${symptom === type
                          ? 'border-medical-600 bg-medical-50 text-medical-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Slider */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-4 flex justify-between items-end">
                  <span>痛みの強さ</span>
                  <span className="text-4xl font-bold text-medical-600 leading-none">{level}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-medical-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2 font-medium">
                  <span>0 (全くない)</span>
                  <span>5 (中くらい)</span>
                  <span>10 (最大)</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0">
              <button
                onClick={closeModal}
                className="px-5 py-3 text-slate-600 bg-white border-2 border-slate-200 hover:bg-slate-50 rounded-xl font-bold transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddRecord}
                className="flex-1 px-8 py-3 bg-medical-600 text-white rounded-xl font-bold hover:bg-medical-700 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <PlusCircle size={20} />
                部位を追加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};