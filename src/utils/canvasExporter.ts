import { Person } from '../types';
import { computeTreeLayout } from './treeLayout';

export function exportTreeAsImage(
  members: Person[],
  projectName: string,
  developerName: string,
  developerPhone: string,
  isRtl: boolean = true,
  format: 'jpg' | 'png' = 'jpg'
) {
  if (members.length === 0) return;

  // Compute Layout with all nodes expanded for export
  const expanded = new Set(members.map((m) => m.id));
  const { nodes, connectors, width, height } = computeTreeLayout(members, expanded);

  // Create Canvas element
  const canvas = document.createElement('canvas');
  // Use scale of 3x for extremely high resolution and crisp text rendering
  const scale = 3;
  canvas.width = width * scale;
  canvas.height = (height + 140) * scale; // Add bottom space for logo signature

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(scale, scale);

  // 1. Draw elegant solid white background (Per user request: 'سیەم باکرەوندەکە سپیبیت')
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height + 140);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 0.5;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height + 140);
    ctx.stroke();
  }
  for (let y = 0; y < height + 140; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Draw connector lines
  ctx.strokeStyle = '#24B1B1';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const conn of connectors) {
    const midY = (conn.fromY + conn.toY) / 2;
    ctx.beginPath();
    ctx.moveTo(conn.fromX, conn.fromY);
    ctx.lineTo(conn.fromX, midY);
    ctx.lineTo(conn.toX, midY);
    ctx.lineTo(conn.toX, conn.toY);
    ctx.stroke();

    // Draw little circles at connector endpoints
    ctx.fillStyle = '#24B1B1';
    ctx.beginPath();
    ctx.arc(conn.fromX, conn.fromY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Draw Nodes (Cards)
  const cardWidth = 200;
  const cardHeight = 80;

  for (const node of nodes) {
    // Draw card background
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#24B1B1';
    ctx.lineWidth = 2.5;

    // Draw rounded rect helper
    drawRoundedRect(ctx, node.x, node.y, cardWidth, cardHeight, 10);
    ctx.fill();
    ctx.stroke();

    // Draw card header accent band
    ctx.fillStyle = '#F0FDFA';
    drawRoundedRectTopOnly(ctx, node.x + 1.5, node.y + 1.5, cardWidth - 3, 20, 8);
    ctx.fill();

    // Draw ID and BirthYear
    ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94A3B8';
    const idStr = `#${node.id.substring(0, 4)}`;
    ctx.fillText(idStr, node.x + 12, node.y + 14);

    if (node.person.birthYear) {
      const yearStr = node.person.birthYear;
      ctx.fillStyle = '#0D9488';
      ctx.fillText(yearStr, node.x + cardWidth - 45, node.y + 14);
    }

    // Name text
    ctx.font = 'bold 12px "Vazirmatn", sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.fillText(node.person.name, node.x + cardWidth / 2, node.y + 44);

    // Generation label or small subtitle
    if (node.person.birthPlace) {
      ctx.font = '500 8.5px "Vazirmatn", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(node.person.birthPlace, node.x + cardWidth / 2, node.y + 64);
    } else {
      ctx.font = 'bold 8px "Vazirmatn", sans-serif';
      ctx.fillStyle = '#0E7490';
      ctx.fillText('شێجەرەی کوڕانە', node.x + cardWidth / 2, node.y + 64);
    }
    // reset align
    ctx.textAlign = 'left';
  }

  // 4. Draw Header banner and Footer Signature at the bottom of the exported image
  const signatureY = height + 40;

  // Divider line
  ctx.strokeStyle = '#24B1B1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, signatureY);
  ctx.lineTo(width - 40, signatureY);
  ctx.stroke();

  // Draw signature card info
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 15px "Vazirmatn", sans-serif';
  ctx.fillText(projectName, 45, signatureY + 36);

  ctx.fillStyle = '#475569';
  ctx.font = '500 11px "Vazirmatn", sans-serif';
  ctx.fillText(
    `بەرهەمی پێشکەوتووی دروستکردنی شێجەرەی خێزانی کورد (Family Kurd)`,
    45,
    signatureY + 54
  );

  // Developer contact info in English / Kurdish
  ctx.textAlign = 'right';
  ctx.fillStyle = '#24B1B1';
  ctx.font = 'bold 13px "Vazirmatn", sans-serif';
  ctx.fillText(`گەشەپێدەر: ${developerName}`, width - 45, signatureY + 36);

  ctx.fillStyle = '#475569';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillText(`مۆبایل / وەتسئەپ: ${developerPhone}`, width - 45, signatureY + 54);

  // Timestamp
  ctx.font = '500 9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`کاتی دروستکردن: ${new Date().toLocaleString()}`, width - 45, signatureY + 76);

  // Trigger export download link with high-quality JPG or PNG
  try {
    const dataUrl = format === 'jpg' ? canvas.toDataURL('image/jpeg', 1.0) : canvas.toDataURL('image/png');
    const ext = format === 'jpg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.download = `${projectName.replace(/\s+/g, '_')}_Family_Tree_${Date.now()}.${ext}`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Image export failed:', err);
  }
}

// Escapes special XML characters for secure SVG templates
function escapeSvg(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Export family tree dynamically to vector-graphic SVG format (Per user request: 'سەیفکردن svg بکریت')
export function exportTreeAsSVG(
  members: Person[],
  projectName: string,
  developerName: string,
  developerPhone: string,
  isRtl: boolean = true
) {
  if (members.length === 0) return;

  // Compute Layout with all nodes expanded for export
  const expanded = new Set(members.map((m) => m.id));
  const { nodes, connectors, width, height } = computeTreeLayout(members, expanded);

  const totalHeight = height + 140;

  // Build grid
  let gridLines = '';
  for (let x = 0; x < width; x += 40) {
    gridLines += `    <line x1="${x}" y1="0" x2="${x}" y2="${totalHeight}" stroke="#E2E8F0" stroke-width="0.5" />\n`;
  }
  for (let y = 0; y < totalHeight; y += 40) {
    gridLines += `    <line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#E2E8F0" stroke-width="0.5" />\n`;
  }

  // Connectors
  let connectorSvg = '';
  for (const conn of connectors) {
    const midY = (conn.fromY + conn.toY) / 2;
    connectorSvg += `    <path d="M ${conn.fromX} ${conn.fromY} L ${conn.fromX} ${midY} L ${conn.toX} ${midY} L ${conn.toX} ${conn.toY}" fill="none" stroke="#24B1B1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />\n`;
    connectorSvg += `    <circle cx="${conn.fromX}" cy="${conn.fromY}" r="4" fill="#24B1B1" />\n`;
  }

  // Nodes
  const cardWidth = 200;
  const cardHeight = 80;
  let nodesSvg = '';
  for (const node of nodes) {
    const nameEscaped = escapeSvg(node.person.name);
    const birthPlaceEscaped = node.person.birthPlace ? escapeSvg(node.person.birthPlace) : '';
    const idStr = `#${node.id.substring(0, 4)}`;
    const birthYearStr = node.person.birthYear || '';

    nodesSvg += `
    <g class="node-card" id="node-${node.id}">
      <!-- Outer Card -->
      <rect x="${node.x}" y="${node.y}" width="${cardWidth}" height="${cardHeight}" rx="10" ry="10" fill="#FFFFFF" stroke="#24B1B1" stroke-width="2.5" />
      
      <!-- Top Accent band (rounded top corners) -->
      <path d="M ${node.x + 1.5} ${node.y + 11.5} L ${node.x + 1.5} ${node.y + 21.5} L ${node.x + cardWidth - 1.5} ${node.y + 21.5} L ${node.x + cardWidth - 1.5} ${node.y + 11.5} A 8 8 0 0 0 ${node.x + cardWidth - 9.5} ${node.y + 1.5} L ${node.x + 9.5} ${node.y + 1.5} A 8 8 0 0 0 ${node.x + 1.5} ${node.y + 9.5} Z" fill="#F0FDFA" />

      <!-- ID -->
      <text x="${node.x + 12}" y="${node.y + 16}" font-family="JetBrains Mono, monospace" font-size="8.5" font-weight="bold" fill="#94A3B8">${idStr}</text>
      
      <!-- Birth Year -->
      ${birthYearStr ? `<text x="${node.x + cardWidth - 45}" y="${node.y + 16}" font-family="JetBrains Mono, monospace" font-size="8.5" font-weight="bold" fill="#0D9488">${birthYearStr}</text>` : ''}
      
      <!-- Name -->
      <text x="${node.x + cardWidth / 2}" y="${node.y + 44}" font-family="Vazirmatn, sans-serif" font-size="12" font-weight="bold" fill="#111827" text-anchor="middle">${nameEscaped}</text>
      
      <!-- Subtitle/BirthPlace -->
      <text x="${node.x + cardWidth / 2}" y="${node.y + 64}" font-family="Vazirmatn, sans-serif" font-size="${node.person.birthPlace ? '8.5' : '8'}" font-weight="${node.person.birthPlace ? '500' : 'bold'}" fill="${node.person.birthPlace ? '#64748B' : '#0E7490'}" text-anchor="middle">
        ${node.person.birthPlace ? birthPlaceEscaped : 'شێجەرەی کوڕانە'}
      </text>
    </g>
    `;
  }

  // Footer
  const signatureY = height + 40;
  const projectEscaped = escapeSvg(projectName);
  const devNameEscaped = escapeSvg(developerName);
  const devPhoneEscaped = escapeSvg(developerPhone);

  const footerSvg = `
  <g class="footer-signature">
    <line x1="40" y1="${signatureY}" x2="${width - 40}" y2="${signatureY}" stroke="#24B1B1" stroke-width="3" />
    <text x="45" y="${signatureY + 36}" font-family="Vazirmatn, sans-serif" font-size="15" font-weight="bold" fill="#111827">${projectEscaped}</text>
    <text x="45" y="${signatureY + 54}" font-family="Vazirmatn, sans-serif" font-size="11" font-weight="500" fill="#475569">بەرهەمی پێشکەوتووی دروستکردنی شێجەرەی خێزانی کورد (Family Kurd)</text>
    
    <text x="${width - 45}" y="${signatureY + 36}" font-family="Vazirmatn, sans-serif" font-size="13" font-weight="bold" fill="#24B1B1" text-anchor="end">گەشەپێدەر: ${devNameEscaped}</text>
    <text x="${width - 45}" y="${signatureY + 54}" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#475569" text-anchor="end">مۆبایل / وەتسئەپ: ${devPhoneEscaped}</text>
    <text x="${width - 45}" y="${signatureY + 76}" font-family="JetBrains Mono, monospace" font-size="9" font-weight="500" fill="#94A3B8" text-anchor="end">کاتی دروستکردن: ${new Date().toLocaleString()}</text>
  </g>
  `;

  // Combine whole SVG definition (Pure absolute White background is explicitly embedded)
  const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&amp;family=JetBrains+Mono:wght@500;700;800&amp;display=swap');
    text {
      direction: ${isRtl ? 'rtl' : 'ltr'};
    }
  </style>
  <!-- Background (Specified pure white color as requested) -->
  <rect width="100%" height="100%" fill="#FFFFFF" />
  
  <!-- Subtle Grid -->
  <g class="grid-layer">
    ${gridLines}
  </g>
  
  <!-- Connectors -->
  <g class="connector-layer">
    ${connectorSvg}
  </g>
  
  <!-- Node Cards -->
  <g class="node-layer">
    ${nodesSvg}
  </g>
  
  <!-- Footer -->
  ${footerSvg}
</svg>`;

  try {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${projectName.replace(/\s+/g, '_')}_Family_Tree_${Date.now()}.svg`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (err) {
    console.error('SVG export failed:', err);
  }
}

// Rounded rectangle drawers
function drawRoundedRect(
  ctx: CanvasRenderingContext25D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRoundedRectTopOnly(
  ctx: CanvasRenderingContext25D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type CanvasRenderingContext25D = CanvasRenderingContext2D;
