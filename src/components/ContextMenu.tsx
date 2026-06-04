import React, { useEffect, useRef } from 'react';
import { UserPlus, Edit3, Trash2, Crosshair, X } from 'lucide-react';
import { Person } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  person: Person | null;
  onClose: () => void;
  onAddSon: (parentId: string) => void;
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
  onCenterView: () => void;
  isRtl?: boolean;
}

export default function ContextMenu({
  x,
  y,
  person,
  onClose,
  onAddSon,
  onEdit,
  onDelete,
  onCenterView,
  isRtl = true,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust coordinates so the menu does not overflow the right or bottom edges of the screen
  const menuWidth = 220;
  const menuHeight = person ? 180 : 60;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 bg-white/95 backdrop-blur-md text-slate-800 shadow-2xl rounded-xl border border-slate-200 py-1.5 min-w-[200px] transition-all animate-in fade-in zoom-in-95 duration-100 ${
        isRtl ? 'text-right' : 'text-left'
      }`}
      style={{ left: adjustedX, top: adjustedY, direction: isRtl ? 'rtl' : 'ltr' }}
    >
      <div className="flex items-center justify-between px-3 py-1 bg-slate-50 border-b border-slate-150 mb-1.5 rounded-t-xl">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {person ? (isRtl ? 'بژاردەکان' : 'Options') : (isRtl ? 'شوێنی کار' : 'Workspace')}
        </span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
          <X size={12} />
        </button>
      </div>

      {person ? (
        <>
          <div className="px-3 py-1 mb-1 border-b border-slate-100 pb-2">
            <p className="text-[13px] font-bold text-teal-700 truncate">{person.name}</p>
            <p className="text-[10px] text-slate-400">{isRtl ? 'باوان: باوکی' : 'Patrilineal ancestry'}</p>
          </div>

          <button
            onClick={() => {
              onAddSon(person.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-teal-600 transition-colors"
          >
            <UserPlus size={15} className="text-teal-500" />
            <span>{isRtl ? 'فرزەند زیاد بکە' : 'Add Son'}</span>
          </button>

          <button
            onClick={() => {
              onEdit(person);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
          >
            <Edit3 size={15} className="text-indigo-500" />
            <span>{isRtl ? 'دەستکاری ناو / زانیاری' : 'Edit Names / Notes'}</span>
          </button>

          <div className="border-t border-slate-100 my-1"></div>

          <button
            onClick={() => {
              onDelete(person.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <Trash2 size={15} className="text-red-500" />
            <span>{isRtl ? 'کەسەکە بسڕەوە' : 'Delete Person'}</span>
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            onCenterView();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-teal-600 transition-colors"
        >
          <Crosshair size={15} className="text-teal-500" />
          <span>{isRtl ? 'ناوەندکردنی دیمەن' : 'Center View'}</span>
        </button>
      )}
    </div>
  );
}
