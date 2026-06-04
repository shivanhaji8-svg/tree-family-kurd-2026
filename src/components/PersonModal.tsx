import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin, Clipboard, Trash2 } from 'lucide-react';
import { Person } from '../types';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    birthYear: string; 
    birthPlace: string; 
    notes: string;
    colorTheme?: 'teal' | 'blue' | 'emerald' | 'amber' | 'rose';
  }) => void;
  onDelete?: (personId: string) => void;
  personToEdit: Person | null; // Null if we are adding a son
  parentPerson: Person | null; // Null if no direct parent (i.e. patriarch)
  isRtl?: boolean;
}

export default function PersonModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  personToEdit,
  parentPerson,
  isRtl = true,
}: PersonModalProps) {
  const [name, setName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [notes, setNotes] = useState('');
  const [colorTheme, setColorTheme] = useState<'teal' | 'blue' | 'emerald' | 'amber' | 'rose'>('teal');

  // Load active details if editing
  useEffect(() => {
    if (personToEdit) {
      setName(personToEdit.name);
      setBirthYear(personToEdit.birthYear || '');
      setBirthPlace(personToEdit.birthPlace || '');
      setNotes(personToEdit.notes || '');
      setColorTheme(personToEdit.colorTheme || 'teal');
    } else {
      // Clear for new additions
      setName('');
      setBirthYear('');
      setBirthPlace('');
      setNotes('');
      setColorTheme('teal');
    }
  }, [personToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      birthYear: birthYear.trim(),
      birthPlace: birthPlace.trim(),
      notes: notes.trim(),
      colorTheme,
    });
    onClose();
  };

  const modalTitle = personToEdit
    ? (isRtl ? 'دەستکاریکردنی زانیارییەکان' : 'Edit Person Biography')
    : (isRtl ? 'تۆمارکردنی فرزەند (نزڵ - کوڕ)' : 'Add Son (Patrilineal Descendant)');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Header bar */}
        <div className="bg-[#24B1B1] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5" />
            <h3 className="font-bold text-base leading-tight">
              {modalTitle}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          
          {/* Direct Father representation */}
          {!personToEdit && parentPerson && (
            <div className="p-3 bg-[#24B1B1]/5 border border-[#24B1B1]/20 rounded-xl flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#24B1B1]"></span>
              <div className="text-xs">
                <span className="text-slate-400 block">{isRtl ? 'باوکی منداڵەکە (باوان):' : 'Ancestor Father Pointer:'}</span>
                <span className="font-bold text-[#24B1B1]">{parentPerson.name}</span>
              </div>
            </div>
          )}

          {/* Input Name */}
          <div className="space-y-1.5 animate-fade-in">
            <label className="block text-xs font-bold text-slate-600">
              {isRtl ? 'ناوی کەسەکە (مەرجە تەنها نێین بێت)*' : 'FullName of Son (Male lineage only)*'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={isRtl ? 'تکایە ناوی تەواو بنووسە...' : 'Enter full name...'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B1B1] bg-white"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Birth year input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                <span>{isRtl ? 'ساڵی لەدایکبوون' : 'Birth Year'}</span>
              </label>
              <input
                type="text"
                placeholder={isRtl ? 'نموونە: ١٨٩٥' : 'e.g. 1950'}
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B1B1] bg-white font-mono"
              />
            </div>

            {/* Birth place */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                <span>{isRtl ? 'زادگا (شوێن)' : 'Place of Origin'}</span>
              </label>
              <input
                type="text"
                placeholder={isRtl ? 'نموونە: سلێمانی یان هۆز' : 'e.g. Erbil, Sulaymaniyah'}
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B1B1] bg-white"
              />
            </div>
          </div>

          {/* Notes description input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 flex items-center gap-1">
              <Clipboard size={13} className="text-slate-400" />
              <span>{isRtl ? 'کورتە دەربارە / تێبینییەکان' : 'Biographical notes'}</span>
            </label>
            <textarea
              placeholder={isRtl ? 'هەر زانیارییەکی تر سەبارەت بەم نەوە دێرینە...' : 'Any further metadata...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#24B1B1] bg-white resize-none"
            />
          </div>

          {/* Theme Color Selector with 5 beautiful round choices */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-600">
              {isRtl ? 'ڕەنگی کارتی ناوەکە (٥ ڕەنگی جیاواز):' : 'Name Card Theme Color (5 choices):'}
            </label>
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
              {[
                { name: 'teal', hex: '#24B1B1', label: isRtl ? 'شینباو' : 'Teal' },
                { name: 'blue', hex: '#3B82F6', label: isRtl ? 'شین' : 'Blue' },
                { name: 'emerald', hex: '#10B981', label: isRtl ? 'سەوز' : 'Emerald' },
                { name: 'amber', hex: '#F59E0B', label: isRtl ? 'زەرد' : 'Amber' },
                { name: 'rose', hex: '#EE466E', label: isRtl ? 'مەیلاو' : 'Rose' },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColorTheme(c.name as any)}
                  className="relative w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: colorTheme === c.name ? '#0F172A' : 'transparent',
                    boxShadow: colorTheme === c.name ? '0 0 10px rgba(0,0,0,0.15)' : 'none',
                  }}
                  title={c.label}
                >
                  {colorTheme === c.name && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-sm block"></span>
                  )}
                </button>
              ))}
              <span className="text-[11px] font-extrabold text-slate-500 font-mono capitalize ml-auto">
                {colorTheme}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            {personToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(personToEdit.id)}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title={isRtl ? 'سڕینەوەی ئەم ناوە' : 'Delete Name Card'}
              >
                <Trash2 size={13} />
                <span>{isRtl ? 'دیلیت' : 'Delete'}</span>
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {isRtl ? 'پاشەکشە' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#24B1B1] hover:bg-[#1E9E9E] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                {isRtl ? 'پەسەندکردن و تۆمار' : 'Save Details'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
