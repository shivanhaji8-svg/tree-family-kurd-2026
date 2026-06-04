import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Layers,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  Download,
  Upload,
  Printer,
  Image as ImageIcon,
  Plus,
  HelpCircle,
  Phone,
  MessageCircle,
  Calendar,
  Save,
  Trash2,
  Undo2,
  RefreshCw,
  Clock,
  User,
  Activity,
  FileJson
} from 'lucide-react';
import { Person, FamilyPhoto, TreeData, ViewMode } from './types';
import TreeView from './components/TreeView';
import TableView from './components/TableView';
import PersonModal from './components/PersonModal';
import JsonModal from './components/JsonModal';
import ContextMenu from './components/ContextMenu';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { exportTreeAsImage, exportTreeAsSVG } from './utils/canvasExporter';

// Custom seed data to welcome the user and demonstrate multi-generational Kurdish family trees immediately
const SEED_MEMBERS: Person[] = [
  {
    id: 'root-1',
    name: 'حاجی ئەحمەدی بەرزنجی',
    parentId: null,
    birthYear: '1880',
    birthPlace: 'سلێمانی',
    notes: 'باپیری گەورە و دامەزرێنەری زنجیرەیی بنەماڵە.',
    createdAt: new Date('2026-06-04T09:43:00Z').toISOString(),
  },
  {
    id: 'son-1',
    name: 'مام سەعید ئەحمەد',
    parentId: 'root-1',
    birthYear: '1912',
    birthPlace: 'سلێمانی',
    notes: 'کوڕی گەورەی حاجی ئەحمەد.',
    createdAt: new Date('2026-06-04T09:43:10Z').toISOString(),
  },
  {
    id: 'son-2',
    name: 'مام خەلیل ئەحمەد',
    parentId: 'root-1',
    birthYear: '1918',
    birthPlace: 'هەولێر',
    notes: 'دووەم کوڕی حاجی ئەحمەد کە کۆچی کرد بۆ هەولێر.',
    createdAt: new Date('2026-06-04T09:43:20Z').toISOString(),
  },
  {
    id: 'grandson-1',
    name: 'شێروان سەعید ئەحمەد',
    parentId: 'son-1',
    birthYear: '1945',
    birthPlace: 'سلێمانی',
    notes: 'کادیری ژیری کۆمەڵایەتی.',
    createdAt: new Date('2026-06-04T09:43:30Z').toISOString(),
  },
  {
    id: 'grandson-2',
    name: 'ئاسۆ سەعید ئەحمەد',
    parentId: 'son-1',
    birthYear: '1948',
    birthPlace: 'دەربەندیخان',
    notes: '',
    createdAt: new Date('2026-06-04T09:43:40Z').toISOString(),
  },
  {
    id: 'grandson-3',
    name: 'ڕێبین خەلیل ئەحمەد',
    parentId: 'son-2',
    birthYear: '1952',
    birthPlace: 'هەولێر',
    notes: 'ئەندازیاری شارستانی.',
    createdAt: new Date('2026-06-04T09:43:50Z').toISOString(),
  },
  {
    id: 'great-grandson-1',
    name: 'دانا ڕێبین خەلیل',
    parentId: 'grandson-3',
    birthYear: '1985',
    birthPlace: 'هەولێر',
    notes: 'گەشەپێدەر لە بواری تەکنەلۆجیا.',
    createdAt: new Date('2026-06-04T09:44:00Z').toISOString(),
  }
];

const SEED_PHOTOS: FamilyPhoto[] = [
  {
    id: 'photo-1',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 100 100"><rect width="100%" height="100%" fill="%2324b1b1" opacity="0.3"/><circle cx="50" cy="40" r="18" fill="%2324b1b1"/><path d="M20,80 Q50,55 80,80 Z" fill="%2324b1b1"/></svg>',
    caption: 'وینەیەکی کۆنی حاجی ئەحمەدی بەرزنجی',
    dateAdded: '٢٠٢٦-٠٦-٠٤',
    personId: 'root-1'
  }
];

const STORAGE_KEY = 'family_kurd_data_v1';

const sanitizePhotos = (rawPhotos: FamilyPhoto[] | undefined): FamilyPhoto[] => {
  if (!rawPhotos || !Array.isArray(rawPhotos)) return [];
  return rawPhotos.filter(
    (p) => p && typeof p.url === 'string' && p.url.trim() !== ''
  );
};

export default function App() {
  // --- STATE CORE ---
  const [projectName, setProjectName] = useState('شێجەرەی خێزانی کورد');
  const [authorName, setAuthorName] = useState('Shivan Haji');
  const [phoneNumber, setPhoneNumber] = useState('07515470405');
  const [whatsappNumber, setWhatsappNumber] = useState('07515470405');
  const [members, setMembers] = useState<Person[]>([]);
  const [photos, setPhotos] = useState<FamilyPhoto[]>([]);
  
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isRtl, setIsRtl] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [isWorkspaceFullScreen, setIsWorkspaceFullScreen] = useState(false);
  
  // Highlighting & Search inside Tree View Canvas
  const [canvasSearchQuery, setCanvasSearchQuery] = useState('');

  // Modals / Dropdowns / Overlay trackers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [parentPerson, setParentPerson] = useState<Person | null>(null);
  
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; person: Person | null } | null>(null);
  const [activeSelectedNodeId, setActiveSelectedNodeId] = useState<string | null>(null);
  const [deletePersonTarget, setDeletePersonTarget] = useState<Person | null>(null);

  // History track for absolute Undo/Restore functionality
  const [historyStack, setHistoryStack] = useState<{ members: Person[]; photos: FamilyPhoto[] }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- INITIALIZATION & AUTO-SAVE ---
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TreeData;
        setProjectName(parsed.projectName || 'شێجەرەی خێزانی کورد');
        setAuthorName(parsed.authorName || 'Shivan Haji');
        setPhoneNumber(parsed.phoneNumber || '07515470405');
        setWhatsappNumber(parsed.whatsappNumber || '07515470405');
        setMembers(parsed.members || []);
        setPhotos(sanitizePhotos(parsed.photos));
        setLastSaved(parsed.lastSavedAt || '');
      } catch (err) {
        console.error('Failed to parse from LocalStorage. Seeding instead:', err);
        seedInitialTree();
      }
    } else {
      seedInitialTree();
    }
  }, []);

  const seedInitialTree = () => {
    setProjectName('شێجەرەی خێزانی کورد');
    setMembers(SEED_MEMBERS);
    setPhotos(SEED_PHOTOS);
    const seedTime = new Date().toLocaleTimeString();
    setLastSaved(seedTime);
    saveDataToDisk(SEED_MEMBERS, SEED_PHOTOS, 'شێجەرەی خێزانی کورد', seedTime);
  };

  const saveDataToDisk = (
    currentMembers: Person[],
    currentPhotos: FamilyPhoto[],
    currentProjName: string,
    timeStr: string
  ) => {
    const dataPayload: TreeData = {
      projectName: currentProjName,
      authorName,
      phoneNumber,
      whatsappNumber,
      lastSavedAt: timeStr,
      members: currentMembers,
      photos: sanitizePhotos(currentPhotos),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataPayload));
  };

  // Centralized, race-condition-free data update engine
  const updateTreeData = (nextMembers: Person[], nextPhotos: FamilyPhoto[]) => {
    // Snapshot current state in history stack to support undo/restore functionality
    setHistoryStack((prev) => {
      const updated = [...prev, { members, photos }];
      if (updated.length > 50) {
        updated.shift(); // Keep maximum 50 states for resource-friendliness
      }
      return updated;
    });

    const sanitized = sanitizePhotos(nextPhotos);
    setMembers(nextMembers);
    setPhotos(sanitized);
    const saveTime = new Date().toLocaleTimeString();
    setLastSaved(saveTime);
    saveDataToDisk(nextMembers, sanitized, projectName, saveTime);
  };

  // Restore the previous tree configuration (Undo deletions, additions, edits, etc.)
  const handleUndo = () => {
    setHistoryStack((prev) => {
      if (prev.length === 0) return prev;
      const nextStack = [...prev];
      const lastState = nextStack.pop();
      if (lastState) {
        const sanitized = sanitizePhotos(lastState.photos);
        setMembers(lastState.members);
        setPhotos(sanitized);
        const saveTime = new Date().toLocaleTimeString();
        setLastSaved(saveTime);
        saveDataToDisk(lastState.members, sanitized, projectName, saveTime);
      }
      return nextStack;
    });
  };

  // Trigger auto-saves on state modifications
  const handleMembersChange = (next: Person[]) => {
    updateTreeData(next, photos);
  };

  const handlePhotosChange = (next: FamilyPhoto[]) => {
    updateTreeData(members, next);
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = e.target.value;
    setProjectName(nextName);
    const saveTime = new Date().toLocaleTimeString();
    setLastSaved(saveTime);
    saveDataToDisk(members, photos, nextName, saveTime);
  };

  // Force Save Manual Action
  const handleForceSave = () => {
    const saveTime = new Date().toLocaleTimeString();
    setLastSaved(saveTime);
    saveDataToDisk(members, photos, projectName, saveTime);
    alert(
      isRtl
        ? `✓ پڕۆژەکە بە سەرکەوتوویی پارێزرا لە مێمۆری ناوخۆدا لە کاتژمێر: ${saveTime}`
        : `✓ Project successfully saved in LocalStorage at: ${saveTime}`
    );
  };

  // --- CRUD ACTIONS ---
  
  // Add direct son modal initializer
  const handleAddSonTrigger = (parentId: string) => {
    const parentNode = members.find((m) => m.id === parentId) || null;
    setParentPerson(parentNode);
    setPersonToEdit(null);
    setIsModalOpen(true);
  };

  // Add individual completely new Patriarch (Root node)
  const handleAddPatriarchTrigger = () => {
    setParentPerson(null);
    setPersonToEdit(null);
    setIsModalOpen(true);
  };

  // Edit details overlay trigger
  const handleEditTrigger = (person: Person) => {
    setPersonToEdit(person);
    setParentPerson(null);
    setIsModalOpen(true);
  };

  // Delete node trigger (opens beautiful dual-mode choice modal)
  const handleDeleteTrigger = (personId: string) => {
    const target = members.find((m) => m.id === personId);
    if (!target) return;
    setDeletePersonTarget(target);
  };

  // Method 1: Delete only this single sibling / name and lift children up
  const executeSingleDelete = (personId: string) => {
    const target = members.find((m) => m.id === personId);
    if (!target) return;

    const parentIdPointer = target.parentId; // Can be string or null

    // Update children's parent references to point to the deleted target's parent
    const nextMembers = members
      .map((m) => {
        if (m.parentId === personId) {
          return { ...m, parentId: parentIdPointer };
        }
        return m;
      })
      .filter((m) => m.id !== personId);

    // Also clean up associated photo references
    const nextPhotos = photos.map((p) => {
      if (p.personId === personId) {
        return { ...p, personId: undefined };
      }
      return p;
    });

    updateTreeData(nextMembers, nextPhotos);

    if (activeSelectedNodeId === personId) {
      setActiveSelectedNodeId(null);
    }
    setDeletePersonTarget(null);
  };

  // Method 2: Delete node and all direct descendants recursively
  const executeCascadeDelete = (personId: string) => {
    const target = members.find((m) => m.id === personId);
    if (!target) return;

    const offspringIds: string[] = [];
    function collectDescendants(id: string) {
      const directChildren = members.filter((m) => m.parentId === id);
      for (const child of directChildren) {
        offspringIds.push(child.id);
        collectDescendants(child.id);
      }
    }
    collectDescendants(personId);

    const purgeList = [personId, ...offspringIds];
    const nextMembers = members.filter((m) => !purgeList.includes(m.id));

    // Also clean up photo references
    const nextPhotos = photos.map((p) => {
      if (p.personId && purgeList.includes(p.personId)) {
        return { ...p, personId: undefined };
      }
      return p;
    });

    updateTreeData(nextMembers, nextPhotos);

    if (activeSelectedNodeId === personId) {
      setActiveSelectedNodeId(null);
    }
    setDeletePersonTarget(null);
  };

  // Modal Save/Submit Action (Common for block Edit and Add)
  const handleModalSubmit = (fields: {
    name: string;
    birthYear: string;
    birthPlace: string;
    notes: string;
    colorTheme?: 'teal' | 'blue' | 'emerald' | 'amber' | 'rose';
  }) => {
    if (personToEdit) {
      // Edit operation
      const updatedMembers = members.map((m) => {
        if (m.id === personToEdit.id) {
          return {
            ...m,
            ...fields,
          };
        }
        return m;
      });
      handleMembersChange(updatedMembers);
    } else {
      // Add operation
      const newPerson: Person = {
        id: `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: fields.name,
        parentId: parentPerson ? parentPerson.id : null,
        birthYear: fields.birthYear,
        birthPlace: fields.birthPlace,
        notes: fields.notes,
        createdAt: new Date().toISOString(),
        colorTheme: fields.colorTheme || 'teal',
      };
      
      handleMembersChange([...members, newPerson]);
    }
    setIsModalOpen(false);
  };

  // --- PHOTO METRICS EVENTS ---
  const handleAddPhoto = (newPhotoData: Omit<FamilyPhoto, 'id' | 'dateAdded'>) => {
    const newPhoto: FamilyPhoto = {
      ...newPhotoData,
      id: `photo-${Date.now()}`,
      dateAdded: new Date().toLocaleDateString('ku-IQ', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
    };
    handlePhotosChange([...photos, newPhoto]);
  };

  const handleDeletePhoto = (photoId: string) => {
    const nextPhotos = photos.filter((p) => p.id !== photoId);
    handlePhotosChange(nextPhotos);
  };

  // --- RE-PARENTING ASSIGNER (Backup tool if needed) ---
  const rootMemberCount = useMemo(() => {
    return members.filter((m) => !m.parentId).length;
  }, [members]);

  // --- IMPORT / EXPORT UTILITIES ---
  
  // Download standard JSON file
  const handleExportJSON = () => {
    const payload: TreeData = {
      projectName,
      authorName,
      phoneNumber,
      whatsappNumber,
      lastSavedAt: lastSaved,
      members,
      photos: sanitizePhotos(photos),
    };
    
    const token = JSON.stringify(payload, null, 2);
    const blob = new Blob([token], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${projectName.replace(/\s+/g, '_')}_backup_${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Upload JSON backup restorative
  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const contents = event.target?.result as string;
          const parsed = JSON.parse(contents) as TreeData;
          
          if (Array.isArray(parsed.members)) {
            const sanitizedImportPhotos = sanitizePhotos(parsed.photos);
            setProjectName(parsed.projectName || 'شێجەرەی هاوردەکراو');
            setMembers(parsed.members);
            setPhotos(sanitizedImportPhotos);
            setLastSaved(new Date().toLocaleTimeString());
            saveDataToDisk(
              parsed.members,
              sanitizedImportPhotos,
              parsed.projectName || 'شێجەرەی هاوردەکراو',
              new Date().toLocaleTimeString()
            );
            alert(isRtl ? '✓ پڕۆژەکە بە سەرکەوتوویی بارکرا و گۆڕدرا!' : '✓ Space database restored successfully from file!');
          } else {
            alert(isRtl ? 'فۆرماتی فایلەکە تەواو نییە!' : 'Invalid file format structure!');
          }
        } catch (err: any) {
          alert((isRtl ? 'هەڵە ڕوویدا لە خوێندنەوەی فایل: ' : 'Failed to parse JSON file: ') + err.message);
        }
      };
      
      reader.readAsText(file);
    }
  };

  // Export current tree as high-res JPG image (Per user request: 'وینەکە کوالیتی بەرزتربیت + JPG')
  const handleExportImage = () => {
    exportTreeAsImage(members, projectName, authorName, phoneNumber, isRtl, 'jpg');
  };

  // Export current tree as infinite vector SVG (Per user request: 'سەیفکردن svg بکریت')
  const handleExportSVG = () => {
    exportTreeAsSVG(members, projectName, authorName, phoneNumber, isRtl);
  };

  // Export current list to printer
  const handlePrintOutline = () => {
    window.print();
  };

  // --- KEYBOARD SHORTCUTS ENGAGEMENTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleForceSave();
      }
      // Ctrl + O
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleImportJSONClick();
      }
      // Ctrl + E
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleExportImage();
      }
      // Ctrl + P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrintOutline();
      }
      // Ctrl + Z (Undo last action)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
      // F11 Workspace toggle
      if (e.key === 'F11') {
        // We handle a pseudo-fullscreen that hide/shows sidebar elements
        e.preventDefault();
        setIsWorkspaceFullScreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [members, photos, projectName, isRtl]);

  // Workspace Right Click context triggers
  const handleWorkspaceContextMenu = (e: React.MouseEvent, person: Person | null) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      person,
    });
  };

  return (
    <div 
      className={`min-h-screen bg-[#F8FAFC] flex flex-col text-[#1F2937] antialiased print:bg-white print:text-black ${
        isRtl ? 'font-sans' : 'font-sans'
      }`}
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      id="main-app"
    >
      {/* HIDDEN FILE INPUT FOR IMPORT RESTORES */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
        onChange={handleImportJSONFile}
      />

       {/* --- PREMIUM TOP HEADER BRANDING BAR --- */}
      {!isWorkspaceFullScreen && (
        <header className="bg-white border-b border-slate-200 py-3.5 px-6 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40 print:hidden shadow-sm">
          {/* Logo & Project Editable Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-[#24B1B1] flex items-center justify-center text-white font-black text-xl shadow-md cursor-pointer animate-pulse">
              ف
            </div>
            <div className="flex-1 md:flex-none">
              <div className="flex items-center gap-2">
                <input
                  id="project-name-input"
                  type="text"
                  value={projectName}
                  onChange={handleProjectNameChange}
                  className="font-black text-lg md:text-xl text-slate-800 bg-transparent focus:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#24B1B1] rounded-lg px-2 py-0.5 max-w-[280px]"
                  title={isRtl ? 'کلیک بکە بۆ گۆڕینی ناوی شێجەرە' : 'Click to rename tree'}
                />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 px-2">
                <Clock size={11} className="text-[#24B1B1]" />
                <span>
                  {isRtl ? 'دوا گۆڕانکاری:' : 'Auto Saved:'} {lastSaved || 'کات تەمام نییە'}
                </span>
                <span className="hidden md:inline text-slate-250">•</span>
                <span className="hidden md:inline text-[10px] text-[#24B1B1] bg-[#24B1B1]/10 font-bold px-1.5 rounded">
                  {isRtl ? 'مۆبایلی گەشەپێدەر: 07515470405' : 'Dev: Shivan Haji'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#24B1B1]"></span>
              <div>
                <p className="font-bold text-slate-700">{members.length}</p>
                <p className="text-[10px] text-slate-400">{isRtl ? 'پیاوانی بەشداربوو' : 'Total Males'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <div>
                <p className="font-bold text-slate-700">{photos.length}</p>
                <p className="text-[10px] text-slate-400">{isRtl ? 'وێنەکان بارکراون' : 'Family Photos'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <div>
                <p className="font-bold text-slate-700">{rootMemberCount}</p>
                <p className="text-[10px] text-slate-400">{isRtl ? 'باوانی یەکەم (Roots)' : 'Roots Count'}</p>
              </div>
            </div>
          </div>

          {/* System Control Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Bilingual RTL/LTR toggle */}
            <button
              onClick={() => setIsRtl(!isRtl)}
              className="px-3 py-1.5 text-xs font-bold border border-slate-200 hover:border-[#24B1B1]/40 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              {isRtl ? 'English ⇆' : 'کۆردی ⇆'}
            </button>

            {/* Quick backup JSON */}
            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
              <button
                onClick={handleExportJSON}
                title={isRtl ? 'پاشەکەوتکردن هەموو نووسراو' : 'Backup JSON'}
                className="p-1.5 hover:bg-slate-150 text-slate-600 transition-colors border-r border-slate-205 cursor-pointer text-xs font-semibold flex items-center gap-1"
              >
                <Download size={14} />
                <span className="hidden sm:inline text-[11px] font-bold">JSON</span>
              </button>
              <button
                onClick={handleImportJSONClick}
                title={isRtl ? 'هاوردەکردنی پڕۆژە لە فایل' : 'Import JSON Restore'}
                className="p-1.5 hover:bg-slate-150 text-slate-600 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
              >
                <Upload size={14} />
                <span className="hidden sm:inline text-[11px] font-bold">{isRtl ? 'هاوردەکردنی' : 'Import'}</span>
              </button>
            </div>

            {/* Interactive Text JSON Copier/Paster Area */}
            <button
              onClick={() => setIsJsonModalOpen(true)}
              className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl transition-colors cursor-pointer border border-teal-200 flex items-center gap-1.5"
              title={isRtl ? 'دەستکاریکردن، نوسین و کۆپی/پەیستی ڕاستەوخۆ' : 'Direct JSON Write, Copy and Paste Area'}
            >
              <FileJson size={14} className="text-teal-600" />
              <span className="hidden md:inline text-xs font-bold">{isRtl ? 'نووسینی JSON' : 'Interactive JSON'}</span>
            </button>

            {/* Save manually */}
            <button
              onClick={handleForceSave}
              className="p-2 bg-[#24B1B1]/5 hover:bg-[#24B1B1]/10 text-[#24B1B1] rounded-xl transition-colors cursor-pointer border border-[#24B1B1]/20 flex items-center gap-1.5"
              title={isRtl ? 'بپارێزە لە مێمۆری' : 'Save memory offline'}
            >
              <Save size={14} />
              <span className="hidden md:inline text-xs font-bold">{isRtl ? 'پاشەکەوت' : 'Save'}</span>
            </button>

            {/* Absolute Undo / Restore last change */}
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 ${
                historyStack.length > 0
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200 cursor-pointer shadow-xs'
                  : 'bg-slate-50 text-slate-350 border-slate-100 cursor-not-allowed opacity-60'
              }`}
              title={
                isRtl
                  ? `بگەڕێوە بۆ پێشوو (Ctrl+Z) - گۆڕانکارییەکانی پێشوو: ${historyStack.length}`
                  : `Undo last action (Ctrl+Z) - ${historyStack.length} in history`
              }
            >
              <Undo2 size={14} className={historyStack.length > 0 ? "animate-pulse" : ""} />
              <span className="hidden md:inline text-xs font-bold">{isRtl ? 'بگەڕێوە (Undo)' : 'Undo'}</span>
              {historyStack.length > 0 && (
                <span className="text-[10px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full font-mono">
                  {historyStack.length}
                </span>
              )}
            </button>

            {/* Quick reset option */}
            <button
              onClick={() => {
                if (confirm(isRtl ? 'ئایا دڵنیایت لە ڕێستکردنی فەزای ناوەکی بۆ سیستەمی سەرەتا؟' : 'Are you sure you want to reset workspace database to sample seed tree?')) {
                  seedInitialTree();
                }
              }}
              title={isRtl ? 'دووبارە دامەزراندنەوەی نمونەی سەرەتا' : 'Reset to seed data'}
              className="p-2 text-slate-400 hover:text-indigo-500 rounded-xl hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} />
            </button>

            {/* Clear/Delete entire tree/project option */}
            <button
              onClick={() => {
                if (confirm(isRtl ? '⚠️ ئایا دڵنیایت لە سڕینەوەی تەواوی درەختەکە و خاوێنکردنەوەی هەموو پڕۆژەکە؟ ئەم کردارە ناگەڕێتەوە!' : '⚠️ Are you sure you want to delete the entire tree and clear the whole project? This action cannot be undone!')) {
                  updateTreeData([], []);
                }
              }}
              title={isRtl ? 'سڕینەوەی تەواوی پڕۆژەکە' : 'Clear entire project'}
              className="p-2 text-red-500 hover:text-red-700 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>

            <button
              onClick={() => setIsShortcutsHelpOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
              title={isRtl ? 'یارمەتی کورتکراوەکان' : 'Shortcuts guide'}
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </header>
      )}

      {/* --- MAIN ADOBE XD STYLE WORKSPACE LAYOUT --- */}
      <main className="flex-1 flex flex-col lg:flex-row print:flex-col overflow-hidden max-w-[1700px] w-full mx-auto p-4 md:p-6 gap-6 relative">
        


        {/* Right Side: The Interactive Visual Workspace canvas / Spreadsheets */}
        <section className="flex-1 flex flex-col gap-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden min-w-0">
          
          {/* Workspace mode selector and Canvas exports panel */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
            
            {/* View Mode Switcher buttons */}
            <div className="flex items-center bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 w-full md:w-auto">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'tree'
                    ? 'bg-[#24B1B1] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers size={13} />
                <span>{isRtl ? 'درەختی خێزان (Tree View)' : 'Tree View Layout'}</span>
              </button>
              
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#24B1B1] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TableIcon size={13} />
                <span>{isRtl ? 'خشتەی ناوەکان (Table View)' : 'Spreadsheet Table'}</span>
              </button>
            </div>

            {/* Live canvas search or table quick-filter */}
            {viewMode === 'tree' && (
              <div className="relative w-full md:w-64 max-w-sm">
                <input
                  type="text"
                  placeholder={isRtl ? 'ناوی دیاریکراو گڵۆپ بکە...' : 'Glow and find node...'}
                  value={canvasSearchQuery}
                  onChange={(e) => setCanvasSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 focus:border-[#24B1B1] focus:outline-none bg-slate-50 rounded-lg"
                />
                {canvasSearchQuery && (
                  <button
                    onClick={() => setCanvasSearchQuery('')}
                    className="absolute inset-y-0 left-2.5 flex items-center text-slate-400 hover:text-slate-600 font-bold text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Design Space Exports */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              
              {/* Full Monitor Screen Mode (Adobe Illustrator Sandbox target) */}
              <button
                onClick={() => setIsWorkspaceFullScreen(!isWorkspaceFullScreen)}
                className={`p-2 rounded-xl transition-all cursor-pointer border ${
                  isWorkspaceFullScreen
                    ? 'bg-[#24B1B1]/10 border-[#24B1B1]/20 text-[#24B1B1]'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700'
                }`}
                title={isWorkspaceFullScreen ? (isRtl ? 'دەرچوون لە فول سکرین' : 'Exit Screen Mode') : (isRtl ? 'فول سکرین (Illustrator Mode)' : 'Illustrator Screen Mode')}
              >
                {isWorkspaceFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Primary Add root patriarch button */}
              <button
                onClick={handleAddPatriarchTrigger}
                className="px-3.5 py-1.5 bg-[#24B1B1] hover:bg-[#1E9E9E] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} />
                <span>{isRtl ? 'سەرقافڵەیەکی نوێ زیادبکە' : 'Add Family Root Patriarch'}</span>
              </button>

              <button
                onClick={handlePrintOutline}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
                title={isRtl ? 'بۆ چاپکردن و ئۆتۆ-PDF' : 'PDF Export'}
              >
                <Printer size={15} />
              </button>

              <button
                onClick={handleExportImage}
                className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={isRtl ? 'هەناردنی درەخت بە جۆری JPG و کوالیتی بەرز' : 'Export high-res JPG image'}
              >
                <ImageIcon size={14} className="text-amber-600" />
                <span>{isRtl ? 'وێنەی درەخت (JPG)' : 'Export JPG'}</span>
              </button>

              <button
                onClick={handleExportSVG}
                className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title={isRtl ? 'هەناردن وەک ڤێکتەری بێ سنوور' : 'Export vector SVG'}
              >
                <Download size={14} className="text-teal-600" />
                <span>{isRtl ? 'درەختی ڤێکتەر (SVG)' : 'Export SVG'}</span>
              </button>
            </div>
          </div>

          {/* ACTIVE WORKSPACE AREA */}
          <div className="flex-1 min-h-0 min-w-0" id="print-area">
            {viewMode === 'tree' ? (
              <TreeView
                members={members}
                onAddSon={handleAddSonTrigger}
                onEdit={handleEditTrigger}
                onDelete={handleDeleteTrigger}
                onContextMenu={handleWorkspaceContextMenu}
                highlightQuery={canvasSearchQuery}
                isRtl={isRtl}
              />
            ) : (
              <TableView
                members={members}
                onAddSon={handleAddSonTrigger}
                onEdit={handleEditTrigger}
                onDelete={handleDeleteTrigger}
                isRtl={isRtl}
              />
            )}
          </div>
        </section>
      </main>

      {/* --- WORKSPACE SUB-FOOTER BRAND BAR --- */}
      {!isWorkspaceFullScreen && (
        <footer className="bg-slate-900 text-slate-400 py-6 px-6 mt-12 border-t border-slate-800 print:hidden text-center md:text-right">
          <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-right">
              <p className="text-sm font-bold text-slate-200">
                {isRtl ? 'درەختی بەدیجیتالکراوی خێزانی کورد (Family Kurd)' : 'Family Kurd - Patrilineal System'}
              </p>
              <p className="text-xs text-slate-500">
                {isRtl 
                  ? 'پاراستنی تەمەنی باوان و بنەچەکان بە بژارەی خێرا. پشتاوپشتی و زنجیرەی پاشایەتی باوکان بە کەرستەی جیهانی.'
                  : 'Preserving valuable historical lineage records without server exposure. Full compliance with local privacy boundaries.'}
              </p>
            </div>

            {/* Contact signatures */}
            <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 text-xs font-mono">
              <span className="text-slate-500">
                {isRtl ? 'گەشەپێدەر: شێوان حاجی هۆزان' : 'Author: Shivan Haji'}
              </span>
              <span className="text-slate-700">|</span>
              <a href="tel:07515470405" className="hover:text-teal-400 font-bold transition-all flex items-center gap-1 text-teal-500">
                <Phone size={11} />
                <span>07515470405</span>
              </a>
              <span className="text-slate-700">|</span>
              <a href="https://wa.me/9647515470405" className="hover:text-emerald-400 font-bold transition-all flex items-center gap-1 text-emerald-500">
                <MessageCircle size={11} className="fill-emerald-500 text-slate-900" />
                <span>WhatsApp: 07515470405</span>
              </a>
            </div>
          </div>
        </footer>
      )}

      {/* --- DIALOGS, CONTEXTS AND MODAL LAYERS --- */}

      {/* Biography modal (CRUD additions/edits) */}
      <PersonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPersonToEdit(null);
          setParentPerson(null);
        }}
        onSubmit={handleModalSubmit}
        onDelete={(id) => {
          setIsModalOpen(false);
          setPersonToEdit(null);
          setParentPerson(null);
          handleDeleteTrigger(id);
        }}
        personToEdit={personToEdit}
        parentPerson={parentPerson}
        isRtl={isRtl}
      />

      {/* Interactive JSON workspace copier/paster */}
      <JsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        currentData={{
          projectName,
          authorName,
          phoneNumber,
          whatsappNumber,
          lastSavedAt: lastSaved,
          members,
          photos: sanitizePhotos(photos),
        }}
        onImport={(parsed) => {
          if (Array.isArray(parsed.members)) {
            const sanitizedImportPhotos = sanitizePhotos(parsed.photos);
            setProjectName(parsed.projectName || 'شێجەرەی هاوردەکراو');
            setMembers(parsed.members);
            setPhotos(sanitizedImportPhotos);
            setLastSaved(new Date().toLocaleTimeString());
            saveDataToDisk(
              parsed.members,
              sanitizedImportPhotos,
              parsed.projectName || 'شێجەرەی هاوردەکراو',
              new Date().toLocaleTimeString()
            );
            alert(
              isRtl
                ? '✓ پڕۆژەکە بە سەرکەوتوویی لە ڕێگەی دەستکاری ڕاستەوخۆوە بارکرا!'
                : '✓ Tree database successfully imported from interactive JSON!'
            );
          }
        }}
        isRtl={isRtl}
      />

      {/* Dual Mode Deletion Modal (یەکناو یان زنجیرەی کوڕەکان بە تەواوی بسڕەوە) */}
      {deletePersonTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
          >
            {/* Header */}
            <div className="bg-red-600 px-6 py-4 text-white flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider">
                {isRtl ? 'بژاردەی سڕینەوە' : 'Deletion Methods'}
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">
                  {isRtl ? 'خەریکە سڕینەوە دەکەیت بۆ ناوی:' : 'You are deleting the name of:'}
                </p>
                <p className="text-base font-extrabold text-red-600">
                  {deletePersonTarget.name}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed pt-1 animate-pulse">
                  {isRtl 
                    ? 'تکایە شێوازی گونجاو هەڵبژێرە بۆ بەردەوامبوون لە پاککردنەوە یان ڕێکخستنی درەختەکە:' 
                    : 'Please select from the two options below to finalize your action:'}
                </p>
              </div>

              {/* Both Custom Options */}
              <div className="space-y-3 pt-2">
                
                {/* Method 1 Button Block */}
                <button
                  type="button"
                  onClick={() => executeSingleDelete(deletePersonTarget.id)}
                  className="w-full text-right hover:border-teal-500 border border-slate-200 bg-[#24B1B1]/5 p-3.5 rounded-xl transition-all flex flex-col justify-between items-start gap-1 cursor-pointer group hover:shadow-md"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                >
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 group-hover:text-teal-600">
                    <span className="w-4 h-4 rounded-full bg-teal-500 text-white text-[9px] flex items-center justify-center font-bold font-mono">1</span>
                    {isRtl ? 'سڕینەوەی تەنها ئەم کەسە (یەکناو)' : 'Delete only this person'}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-2">
                    {isRtl 
                      ? 'منداڵ و نەوەکانی ئەم ناوە ناخەورێن، بەڵکو پەیوەست دەکرێن بە باوکی ئەم کەسە.' 
                      : 'Removes only this card; his direct sons/descendants will safely move to his parent.'}
                  </span>
                </button>

                {/* Method 2 Button Block */}
                <button
                  type="button"
                  onClick={() => executeCascadeDelete(deletePersonTarget.id)}
                  className="w-full text-right hover:border-red-500 border border-slate-200 bg-red-50/50 p-3.5 rounded-xl transition-all flex flex-col justify-between items-start gap-1 cursor-pointer group hover:shadow-md"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                >
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 group-hover:text-red-100 text-red-600">
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold font-mono">2</span>
                    {isRtl ? 'سڕینەوەی خۆی و سەرجەم نەوەکانی (سوکاو)' : 'Delete person and all descendants'}
                  </span>
                  <span className="text-[10px] text-slate-500 line-clamp-2">
                    {isRtl 
                      ? 'ئەم ناوە و هەموو منداڵان و نەوەکانی لە پلەی پاشکۆدا بە یەکجاری دەسڕێنەوە.' 
                      : 'Cascade deletion: permanently deletes this person and all of his sons/descendants line.'}
                  </span>
                </button>

              </div>
            </div>

            {/* Footer and cancel action */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletePersonTarget(null)}
                className="px-4 py-2 hover:bg-slate-150 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'پاشەکشە / هەڵوەشاندنەوە' : 'Cancel Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tree Canvas Context Menu triggers */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          person={contextMenu.person}
          onClose={() => setContextMenu(null)}
          onAddSon={handleAddSonTrigger}
          onEdit={handleEditTrigger}
          onDelete={handleDeleteTrigger}
          onCenterView={() => {
            // Emits centered coordinate signal to canvas
            const reloadBtn = document.body.querySelector('[title*="Center View"], [title*="گونجاندن"]');
            if (reloadBtn) (reloadBtn as HTMLElement).click();
          }}
          isRtl={isRtl}
        />
      )}

      {/* Keyboard Shortcuts informational drawer */}
      {isShortcutsHelpOpen && (
        <KeyboardShortcutsHelp
          onClose={() => setIsShortcutsHelpOpen(false)}
          isRtl={isRtl}
        />
      )}
    </div>
  );
}
