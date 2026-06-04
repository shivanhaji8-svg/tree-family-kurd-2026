import React, { useState, useEffect } from 'react';
import { X, Copy, Check, AlertCircle, FileJson, Download } from 'lucide-react';
import { TreeData } from '../types';

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: TreeData;
  onImport: (importedData: TreeData) => void;
  isRtl: boolean;
}

export default function JsonModal({
  isOpen,
  onClose,
  currentData,
  onImport,
  isRtl,
}: JsonModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Initialize textarea with current JSON data when opening the modal
  useEffect(() => {
    if (isOpen) {
      const formatted = JSON.stringify(currentData, null, 2);
      setJsonText(formatted);
      setValidationError(null);
      setIsValid(true);
      setCopied(false);
    }
  }, [isOpen, currentData]);

  if (!isOpen) return null;

  // Validate JSON structure dynamically
  const handleTextChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setValidationError(isRtl ? 'شوێنەکە چۆڵە!' : 'JSON is empty!');
      setIsValid(false);
      return;
    }

    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error(isRtl ? 'پێویستە فۆرماتی JSON ئۆبجێکت بێت' : 'Root must be a JSON object');
      }
      if (!Array.isArray(parsed.members)) {
        throw new Error(isRtl ? 'پێویستە لیستی ئەندامەکان (members) بوونی هەبێت' : 'Array "members" is required');
      }
      setValidationError(null);
      setIsValid(true);
    } catch (err: any) {
      setValidationError(err.message || 'Invalid JSON format');
      setIsValid(false);
    }
  };

  // Copy current JSON code to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Paste text from clipboard directly
  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        handleTextChange(clipboardText);
      }
    } catch (err) {
      // Fallback alert or message if clipboard API is restricted by iframe policy
      alert(
        isRtl
          ? 'نەتوانرا لە کیبۆرد ڕاستەوخۆ پەست بکرێت بەهۆی بەربەستی وێبگەڕەکە؛ تکایە کلیلی Ctrl+V یان دەستی بەکار بهێنە بۆ نوسینی JSON'
          : 'Unable to access clipboard automatically due to browser iframe security. Please use Ctrl+V/manual pasting in the text box.'
      );
    }
  };

  // Submit and update states
  const handleApply = () => {
    if (!isValid) return;
    try {
      const parsed = JSON.parse(jsonText) as TreeData;
      onImport(parsed);
      onClose();
    } catch (err) {
      alert(isRtl ? 'هەڵەیەک لە بارکردندا دروست بوو!' : 'An error occurred during submission!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-[#24B1B1]" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider">
              {isRtl ? 'دەستکاریکردنی ڕاستەوخۆی نووسینی JSON' : 'Interactive JSON Code Workspace'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border-b border-amber-100 p-4 text-xs text-amber-800 space-y-1">
          <p className="font-bold">
            {isRtl
              ? '💡 لێرە دەتوانیت کوپی (Copy) و پەیست (Paste) بکەیت بۆ گواستنەوەی پڕۆژەکە یان پاشەکەوتکردن.'
              : '💡 Here, you can visually view, copy, edit, or paste your family tree JSON directly.'}
          </p>
          <p className="opacity-90">
            {isRtl
              ? 'دەتوانیت نووسینی JSON لە شوێنێکی تر وەربگریت و لێرە دایبنێیت، یان بە دەستکاری بچووک ناوەکان نوێ بکەیتەوە.'
              : 'Any external backup JSON string can be pasted here to load its tree representation instantly.'}
          </p>
        </div>

        {/* Editor Area */}
        <div className="p-6 flex-1 flex flex-col min-h-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">
                {isRtl ? 'زاراوەی فۆرماتی داڕشتە:' : 'Tree Structure Code:'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-extrabold font-mono ${
                  isValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isValid
                  ? (isRtl ? '✓ فۆرماتی تەواو و ڕاستە' : '✓ Format is Valid')
                  : (isRtl ? '✗ هەڵە لە پێکهاتەدا' : '✗ Structure Error')}
              </span>
            </div>

            {/* Quick action buttons (Copy / Paste) */}
            <div className="flex items-center gap-2 font-mono">
              <button
                onClick={handlePaste}
                className="px-2.5 py-1 text-[11px] font-bold border border-slate-200 hover:border-slate-350 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                type="button"
              >
                <span>{isRtl ? 'پەیستکردن (Paste)' : 'Paste Code'}</span>
              </button>
              <button
                onClick={handleCopy}
                className={`px-2.5 py-1 text-[11px] font-bold border rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
                }`}
                type="button"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? (isRtl ? 'کۆپی کرا!' : 'Copied!') : (isRtl ? 'کۆپیکردن (Copy)' : 'Copy JSON')}</span>
              </button>
            </div>
          </div>

          {/* Text Area JSON Editor */}
          <div className="flex-1 min-h-[220px] relative border border-slate-250 rounded-xl overflow-hidden shadow-inner flex flex-col bg-slate-950">
            {/* Header Line Numbers/Visual Decor */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-500 font-mono select-none">
              <span>json_editor.json - (READ/WRITE WORKSPACE)</span>
              <span>UTF-8</span>
            </div>

            <textarea
              className="flex-1 w-full p-4 font-mono text-xs text-teal-400 bg-slate-950 focus:outline-none resize-none overflow-y-auto leading-relaxed"
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='{ "projectName": "...", "members": [] }'
              spellCheck={false}
              style={{ direction: 'ltr' }}
            />
          </div>

          {/* Validation Feedback Warning line */}
          {validationError && (
            <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-headShake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <div>
                <span className="font-extrabold">{isRtl ? 'هەڵەی زانیاری:' : 'Syntax Alert:'} </span>
                <span className="font-medium">{validationError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex items-center justify-end gap-3 close-panel font-bold text-xs">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 hover:bg-slate-150 text-slate-600 rounded-xl transition-colors cursor-pointer"
          >
            {isRtl ? 'پاشەکشە / لادان' : 'Close Workspace'}
          </button>

          <button
            onClick={handleApply}
            disabled={!isValid}
            type="button"
            className={`px-5 py-2 rounded-xl text-white transition-all shadow-sm flex items-center gap-1.5 ${
              isValid
                ? 'bg-[#24B1B1] hover:bg-[#1E9E9E] cursor-pointer'
                : 'bg-slate-300 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download size={14} />
            <span>{isRtl ? 'جێبەجێکردن و هاوردەکردن' : 'Apply and Import Tree'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
