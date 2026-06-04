import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Edit3, Trash2, ChevronDown, ChevronRight, Download, Sliders, Calendar } from 'lucide-react';
import { Person } from '../types';

interface TableViewProps {
  members: Person[];
  onAddSon: (parentId: string) => void;
  onEdit: (person: Person) => void;
  onDelete: (personId: string) => void;
  isRtl?: boolean;
}

export default function TableView({
  members,
  onAddSon,
  onEdit,
  onDelete,
  isRtl = true,
}: TableViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [birthPlaceFilter, setBirthPlaceFilter] = useState('');
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());

  // Track parent map
  const personMap = useMemo(() => {
    const map = new Map<string, Person>();
    for (const m of members) {
      map.set(m.id, m);
    }
    return map;
  }, [members]);

  // Track offspring map
  const childrenMap = useMemo(() => {
    const map = new Map<string, Person[]>();
    for (const m of members) {
      if (m.parentId) {
        const list = map.get(m.parentId) || [];
        list.push(m);
        map.set(m.parentId, list);
      }
    }
    return map;
  }, [members]);

  // Get active roots
  const roots = useMemo(() => {
    return members.filter((m) => !m.parentId || !personMap.has(m.parentId));
  }, [members, personMap]);

  // Toggle branch collapse
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(collapsedBranches);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCollapsedBranches(next);
  };

  // Helper to collect all descendant IDs of a collection of nodes
  const isHiddenByParentCollapse = (person: Person): boolean => {
    let current = person;
    while (current.parentId && personMap.has(current.parentId)) {
      if (collapsedBranches.has(current.parentId)) {
        return true;
      }
      current = personMap.get(current.parentId)!;
    }
    return false;
  };

  // Traverse the tree recursively in depth-first order to construct formatted list
  const structuredList = useMemo(() => {
    const list: { person: Person; depth: number; hasChildren: boolean; isHidden: boolean }[] = [];

    function traverse(person: Person, currentDepth: number) {
      const children = childrenMap.get(person.id) || [];
      const hasChildren = children.length > 0;
      const isHidden = isHiddenByParentCollapse(person);

      list.push({
        person,
        depth: currentDepth,
        hasChildren,
        isHidden,
      });

      for (const child of children) {
        traverse(child, currentDepth + 1);
      }
    }

    for (const root of roots) {
      traverse(root, 0);
    }

    return list;
  }, [roots, childrenMap, collapsedBranches, members]);

  // List of unique birth places for filter dropdown
  const uniqueBirthPlaces = useMemo(() => {
    const places = new Set<string>();
    for (const m of members) {
      if (m.birthPlace?.trim()) {
        places.add(m.birthPlace.trim());
      }
    }
    return Array.from(places);
  }, [members]);

  // Apply search query and filters
  const filteredList = useMemo(() => {
    return structuredList.filter(({ person, isHidden }) => {
      // If hidden by parent expand/collapse toggle, hide it
      if (isHidden) return false;

      // Search matching Name, Birthplace or notes
      const matchesSearch =
        searchQuery.trim() === '' ||
        person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.birthYear?.includes(searchQuery) ||
        person.notes?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlace =
        birthPlaceFilter === '' ||
        person.birthPlace?.trim() === birthPlaceFilter.trim();

      return matchesSearch && matchesPlace;
    });
  }, [structuredList, searchQuery, birthPlaceFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* Search and Filters Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 gap-3 flex flex-col sm:flex-row items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 right-3 flex items-center pr-3 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={isRtl ? 'بگەڕێ بۆ ناوی ئەندامان یان ساڵ...' : 'Search members name or notes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Sliders className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={birthPlaceFilter}
            onChange={(e) => setBirthPlaceFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none bg-white font-medium text-slate-700"
          >
            <option value="">{isRtl ? 'هەموو شوێنەکان (ناوەند)' : 'All Birthplaces'}</option>
            {uniqueBirthPlaces.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-right border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-16">#</th>
              <th className="py-3 px-4 min-w-[240px] text-right">{isRtl ? 'ڕیزبەندی ناوی کوریاتی (شێجەرە)' : 'Patrilineal Tree Lineage'}</th>
              <th className="py-3 px-4 text-right">{isRtl ? 'ناوی باپیری ڕاستەوخۆ' : 'Direct Parent'}</th>
              <th className="py-3 px-4 text-right">{isRtl ? 'ساڵی لەدایکبوون' : 'Birth Year'}</th>
              <th className="py-3 px-4 text-right">{isRtl ? 'زادگا (شوێن)' : 'Place of Origin'}</th>
              <th className="py-3 px-4 text-right">{isRtl ? 'نەوەی چەندەم' : 'Generation'}</th>
              <th className="py-3 px-4 text-center w-40">{isRtl ? 'کردارەکان' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-slate-700 text-sm">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400">
                  {isRtl ? 'هیچ ئەندامێک نەدۆزرایەوە بەم ناوەڕۆکەوە' : 'No family tree members found matching the filters'}
                </td>
              </tr>
            ) : (
              filteredList.map(({ person, depth, hasChildren }) => {
                const isCollapsed = collapsedBranches.has(person.id);
                const father = person.parentId ? personMap.get(person.parentId) : null;
                
                return (
                  <tr 
                    key={person.id}
                    className="hover:bg-slate-50 transition-colors group align-middle"
                  >
                    {/* Index or custom serial marker */}
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-400">
                      {person.id.substring(0, 4)}
                    </td>

                    {/* Indented lineage and toggle controls */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5" style={{ paddingRight: `${depth * 24}px` }}>
                        {hasChildren ? (
                          <button
                            onClick={(e) => toggleCollapse(person.id, e)}
                            className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-500 cursor-pointer"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="w-6 h-6 flex items-center justify-center text-slate-350 font-mono">
                            •
                          </span>
                        )}

                        {/* Dynamic color circle theme indicator */}
                        <span 
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-xs ring-1 ring-black/5"
                          style={{
                            backgroundColor: person.colorTheme === 'blue' ? '#3B82F6' :
                                             person.colorTheme === 'emerald' ? '#10B981' :
                                             person.colorTheme === 'amber' ? '#F59E0B' :
                                             person.colorTheme === 'rose' ? '#EE466E' : '#24B1B1'
                          }}
                          title={person.colorTheme || 'teal'}
                        />

                        <span className="text-slate-900 font-bold">{person.name}</span>
                      </div>
                    </td>

                    {/* Parent details */}
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {father ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                            {isRtl ? 'باوکی:' : 'Father:'}
                          </span>
                          <span className="font-semibold text-slate-700">{father.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">
                          {isRtl ? 'سەرقافڵە / یەکەم باوان' : 'Patriarch / Root Ancestor'}
                        </span>
                      )}
                    </td>

                    {/* Birth info */}
                    <td className="py-3 px-4 font-mono text-[13px] text-slate-600">
                      {person.birthYear || '-'}
                    </td>
                    
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {person.birthPlace || '-'}
                    </td>

                    {/* Generation calculation */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {isRtl ? `نەوەی ${depth + 1}` : `Gen ${depth + 1}`}
                      </span>
                    </td>

                    {/* CRUD action buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onAddSon(person.id)}
                          title={isRtl ? 'کورتە زیادکردنی کوڕ' : 'Quick Add Son'}
                          className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <UserPlus size={14} />
                        </button>
                        <button
                          onClick={() => onEdit(person)}
                          title={isRtl ? 'دەستکاری زانیاری' : 'Edit info'}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(person.id)}
                          title={isRtl ? 'سڕینەوەی نەوە' : 'Delete Member'}
                          className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
