import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
  isRtl?: boolean;
}

export default function KeyboardShortcutsHelp({ onClose, isRtl = true }: KeyboardShortcutsHelpProps) {
  const shortcuts = [
    { keys: ['Ctrl', 'S'], descKurd: 'پاراستنی پڕۆژە (Save)', descEng: 'Save Project' },
    { keys: ['Ctrl', 'O'], descKurd: 'هاوردەکردنی پڕۆژە (Import)', descEng: 'Import JSON Project' },
    { keys: ['Ctrl', 'E'], descKurd: 'هەناردنی وێنە (JPG)', descEng: 'Export Tree as JPG/PNG' },
    { keys: ['Ctrl', 'P'], descKurd: 'هەناردن بۆ چاپگە / PDF', descEng: 'Export Tree to PDF / Print' },
    { keys: ['Ctrl', 'Z'], descKurd: 'بگەڕێوە بۆ دواوە (Undo/پاشەکشە)', descEng: 'Undo last change / Restore deleted' },
    { keys: ['Delete'], descKurd: 'سڕینەوەی خانەی دیاریکراو', descEng: 'Remove Selected Node' },
    { keys: ['F11'], descKurd: 'مۆدی تەواوی شاشە (Full Screen)', descEng: 'Toggle Full Screen Workspace' },
    { keys: ['Click & Drag'], descKurd: 'وەشاندن و کێشانی کانڤاس بۆ جوڵە', descEng: 'Pan & Drag canvas to move' },
    { keys: ['Double Click'], descKurd: 'دەستکاری خێرای ناوەکە', descEng: 'Double click node to inline edit' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        <div className="bg-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6" />
            <h3 className="font-bold text-lg">
              {isRtl ? 'کورتکراوەکانی تەختەکلیل' : 'Keyboard Shortcuts'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-teal-700 transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 mb-4">
            {isRtl 
              ? 'بۆ کارکردنی خێراتر و لێهاتوانەتر، دەتوانیت ئەم کورتکراوانە بەکاربهێنیت لە کاتی کارکردن لەسەر شاشەی درەختی خێزانی کورد:'
              : 'For a fluid workflow like Adobe XD or Illustrator, use these keyboard shortcuts inside Family Kurd:'}
          </p>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {shortcuts.map((shortcut, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-slate-700">
                  {isRtl ? shortcut.descKurd : shortcut.descEng}
                </div>
                <div className="flex items-center gap-1.5" style={{ direction: 'ltr' }}>
                  {shortcut.keys.map((key, kIdx) => (
                    <React.Fragment key={kIdx}>
                      <kbd className="px-2 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded shadow-sm">
                        {key}
                      </kbd>
                      {kIdx < shortcut.keys.length - 1 && <span className="text-slate-400 text-xs">+</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
            >
              {isRtl ? 'باشە، داخستن' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
