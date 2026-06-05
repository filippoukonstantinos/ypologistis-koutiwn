import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Copy,
  Download,
  FileDown,
  FileUp,
  FolderOpen,
  Moon,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Search,
  Sun,
  Trash2,
} from 'lucide-react';
import './styles.css';

const boxTypes = [
  { value: 'base', label: 'Βάσεως' },
  { value: 'wall', label: 'Κρεμαστό' },
  { value: 'wardrobe', label: 'Ντουλάπα' },
  { value: 'wardrobeDrawer', label: 'Συρταριέρα με κρυφό μηχανισμό' },
  { value: 'simpleDrawer', label: 'Συρταριέρα απλή' },
  { value: 'externalDrawer', label: 'Συρταριέρα εξωτερική' },
];

const baseLayouts = [
  { value: 'simple', label: 'Ανοιγόμενο' },
  { value: 'drawerDoor', label: '1 συρτάρι + 1 ντουλάπι' },
  { value: 'twoDrawersPullout', label: '2 συρτάρια + 1 βαγονέτο' },
  { value: 'twoPullouts', label: '2 βαγονέτα' },
  { value: 'fourDrawers', label: '4 συρτάρια' },
  { value: 'oven', label: 'Φούρνου' },
  { value: 'blind', label: 'Τυφλό' },
  { value: 'corner', label: 'Γωνιακό' },
];

const wallLayouts = [
  { value: 'simple', label: 'Ανοιγόμενο' },
  { value: 'blind', label: 'Τυφλό' },
  { value: 'corner', label: 'Γωνιακό' },
];

const wardrobeLayouts = [
  { value: 'simple', label: 'Ανοιγόμενο' },
];

const melamine16 = 'Μελαμίνη Λευκή 16mm';
const melamine18 = 'Μελαμίνη Λευκή 18mm';
const melamine8 = 'Μελαμίνη Λευκή 8mm';
const defaultFrontMaterial = 'Πρόσοψη χωρίς κωδικό';
const today = formatGreekDate(new Date());
const storageKey = 'kitchen-projects-v1';

function getPageFromPath(pathname) {
  if (pathname === '/projects') {
    return 'projects';
  }

  if (pathname === '/sheet-optimizer' || pathname === '/material-optimizer') {
    return 'sheetOptimizer';
  }

  return 'calculator';
}

const initialCabinet = {
  name: '',
  boxType: 'base',
  height: 72,
  width: 60,
  widthB: 90,
  depth: 56,
  shelves: 1,
  quantity: 1,
  frontType: 'simple',
  frontMaterial: '',
  noFronts: false,
};

const initialProject = {
  documentType: 'order',
  customerName: '',
  documentCode: '',
  date: today,
};

const initialSideAddition = {
  height: 72,
  width: 60,
  quantity: 1,
  material: '',
};

const initialCustomPiece = {
  name: '',
  height: 72,
  width: 60,
  quantity: 1,
  materialType: melamine18,
  frontMaterial: '',
  pvcHeight: 0,
  pvcWidth: 0,
};

const defaultSheetSettings = {
  length: 280,
  width: 207,
  allowRotation: true,
  keepGrain: false,
};
const initialSheetSettings = {};

const customMaterialTypes = [
  melamine18,
  melamine8,
  'Πρόσοψη / Πορτάκι',
];

const pvcOptions = [
  { value: 0, label: 'χωρίς PVC' },
  { value: 1, label: '1 πλευρά (-)' },
  { value: 2, label: '2 πλευρές (=)' },
];

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatGreekDate(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('el-GR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatNumber(value) {
  return Number(value.toFixed(2)).toLocaleString('el-GR');
}

function pvcMark(count) {
  if (count === 1) {
    return ' (-)';
  }

  if (count === 2) {
    return ' (=)';
  }

  return '';
}

function dimensionPart(value, pvcCount = 0) {
  return `${formatNumber(value)}${pvcMark(pvcCount)}`;
}

function dimensions(a, b, pvc = [0, 0]) {
  return `${dimensionPart(a, pvc[0])} × ${dimensionPart(b, pvc[1])} cm`;
}

function getBoxTypeLabel(value) {
  return boxTypes.find((type) => type.value === value)?.label || value;
}

function getFrontMaterial(cabinet) {
  return cabinet.frontMaterial?.trim() || defaultFrontMaterial;
}

function cabinetSizeLabel(cabinet) {
  if (cabinet.frontType === 'corner') {
    return `${formatNumber(cabinet.height)} x ${formatNumber(cabinet.width)} x ${formatNumber(cabinet.widthB)} x ${formatNumber(cabinet.depth)} cm`;
  }

  return `${formatNumber(cabinet.height)} x ${formatNumber(cabinet.width)} x ${formatNumber(cabinet.depth)} cm`;
}

function materialRank(group) {
  if (group === melamine16) {
    return 0;
  }

  if (group === melamine18) {
    return 1;
  }

  if (group === melamine8) {
    return 2;
  }

  return 3;
}

function normalizeProject(project) {
  return {
    documentType: project.documentType || 'order',
    customerName: project.customerName || '',
    documentCode: project.documentCode || project.projectName || '',
    date: formatGreekDate(project.date || today),
  };
}

function documentTypeLabel(type) {
  return type === 'quote' ? 'Προσφορά' : 'Παραγγελία';
}

function documentCodeLabel(type) {
  return type === 'quote' ? 'Κωδικός προσφοράς' : 'Κωδικός παραγγελίας';
}

function documentPrintLabel(type) {
  return type === 'quote' ? 'Προσφορά Νο.' : 'Παραγγελία Νο.';
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeFileName(value) {
  return String(value || 'supplier-order')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'supplier-order';
}

function docParagraph(text, options = {}) {
  const { bold = false, color = '1f2937', size = 22, spacingAfter = 120 } = options;

  return `
    <w:p>
      <w:pPr><w:spacing w:after="${spacingAfter}"/></w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>
          <w:color w:val="${color}"/>
          <w:sz w:val="${size}"/>
          ${bold ? '<w:b/>' : ''}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
}

function buildSupplierDocumentXml(project, supplierResults, totals) {
  const groups = supplierResults.filter((group) => group.pieces.length > 0);
  const body = [
    docParagraph('ΕΚΤΥΠΩΣΗ ΠΡΟΜΗΘΕΥΤΗ', { bold: true, color: '15803d', size: 20, spacingAfter: 220 }),
    docParagraph(`Πελάτης: ${project.customerName || '-'}`, { bold: true }),
    docParagraph(`${documentPrintLabel(project.documentType)} ${project.documentCode || '-'}`, { bold: true }),
    docParagraph(`Ημερομηνία: ${project.date || '-'}`, { bold: true, spacingAfter: 300 }),
    ...groups.flatMap((group) => [
      docParagraph(group.group, { bold: true, color: '111827', size: 24, spacingAfter: 90 }),
      ...group.pieces.map((piece) => docParagraph(`${piece.quantity} τεμ.  ${piece.dimensions}`, { spacingAfter: 70 })),
      docParagraph('', { spacingAfter: 130 }),
    ]),
    docParagraph('Σύνολο κουτιών:', { bold: true, color: '111827', size: 24, spacingAfter: 90 }),
    docParagraph(`Βάσεως: ${totals.base} κουτιά`, { spacingAfter: 70 }),
    docParagraph(`Κρεμαστά: ${totals.wall} κουτιά`, { spacingAfter: 70 }),
    docParagraph(`Ντουλάπες: ${totals.wardrobe} κουτιά`, { spacingAfter: 70 }),
    docParagraph(`Συρταριέρες με κρυφό μηχανισμό: ${totals.wardrobeDrawer} κουτιά`, { spacingAfter: 70 }),
    docParagraph(`Συρταριέρες απλές: ${totals.simpleDrawer} κουτιά`, { spacingAfter: 70 }),
    docParagraph(`Συρταριέρες εξωτερικές: ${totals.externalDrawer} κουτιά`, { spacingAfter: 70 }),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="900" w:right="900" w:bottom="900" w:left="900" w:header="450" w:footer="450" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function crc32(bytes) {
  let crc = -1;

  for (let index = 0; index < bytes.length; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ -1) >>> 0;
}

function writeUint16(output, value) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output, value) {
  output.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function createZip(files) {
  const encoder = new TextEncoder();
  const output = [];
  const centralDirectory = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);
    const checksum = crc32(dataBytes);
    const localHeaderOffset = offset;
    const localHeader = [];

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0x0800);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint32(localHeader, checksum);
    writeUint32(localHeader, dataBytes.length);
    writeUint32(localHeader, dataBytes.length);
    writeUint16(localHeader, nameBytes.length);
    writeUint16(localHeader, 0);

    output.push(...localHeader, ...nameBytes, ...dataBytes);
    offset += localHeader.length + nameBytes.length + dataBytes.length;

    const centralHeader = [];
    writeUint32(centralHeader, 0x02014b50);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 0x0800);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, checksum);
    writeUint32(centralHeader, dataBytes.length);
    writeUint32(centralHeader, dataBytes.length);
    writeUint16(centralHeader, nameBytes.length);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, 0);
    writeUint32(centralHeader, localHeaderOffset);

    centralDirectory.push(...centralHeader, ...nameBytes);
  });

  const centralOffset = output.length;
  output.push(...centralDirectory);

  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, files.length);
  writeUint16(output, files.length);
  writeUint32(output, centralDirectory.length);
  writeUint32(output, centralOffset);
  writeUint16(output, 0);

  return new Uint8Array(output);
}

function createSupplierDocx(project, supplierResults, totals) {
  return createZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    },
    {
      name: 'word/document.xml',
      content: buildSupplierDocumentXml(project, supplierResults, totals),
    },
  ]);
}

function usesFrontMaterial(boxType) {
  return ['base', 'wall', 'wardrobe', 'externalDrawer'].includes(boxType);
}

function getLayouts(boxType) {
  if (['wardrobe', 'wardrobeDrawer', 'simpleDrawer', 'externalDrawer'].includes(boxType)) {
    return wardrobeLayouts;
  }

  return boxType === 'wall' ? wallLayouts : baseLayouts;
}

function migrateCabinetType(cabinet) {
  if (cabinet.boxType === 'ovenBase') {
    return { boxType: 'base', frontType: 'oven' };
  }

  if (cabinet.boxType === 'blindBase') {
    return { boxType: 'base', frontType: 'blind' };
  }

  if (cabinet.boxType === 'blindWall') {
    return { boxType: 'wall', frontType: 'blind' };
  }

  return {
    boxType: cabinet.boxType || 'base',
    frontType: cabinet.frontType || 'simple',
  };
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readSavedProjects() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSavedProjects(projects) {
  window.localStorage.setItem(storageKey, JSON.stringify(projects));
}

function parseProjectsBackup(value) {
  const projects = Array.isArray(value) ? value : value?.projects;

  if (!Array.isArray(projects)) {
    throw new Error('Το αρχείο δεν περιέχει έγκυρη λίστα έργων.');
  }

  return projects.map((savedProject, index) => {
    if (!savedProject || typeof savedProject !== 'object' || !savedProject.project) {
      throw new Error(`Το έργο ${index + 1} δεν έχει έγκυρη μορφή.`);
    }

    return {
      ...savedProject,
      id: savedProject.id || createId(),
      project: normalizeProject(savedProject.project),
      sideAdditions: Array.isArray(savedProject.sideAdditions) ? savedProject.sideAdditions : [],
      customPieces: Array.isArray(savedProject.customPieces) ? savedProject.customPieces : [],
      cabinets: Array.isArray(savedProject.cabinets) ? savedProject.cabinets : [],
      sheetSettings: savedProject.sheetSettings || initialSheetSettings,
      createdAt: savedProject.createdAt || new Date().toISOString(),
      updatedAt: savedProject.updatedAt || savedProject.createdAt || new Date().toISOString(),
    };
  });
}

function row(cabinet, name, quantity, width, height, group, material = group, pvc = [0, 0]) {
  const cabinetQuantity = Math.max(1, Math.floor(numberValue(cabinet.quantity || 1)));

  return {
    id: `${cabinet.id}-${name}-${quantity}-${width}-${height}-${group}-${pvc.join('-')}`,
    source: cabinet.name,
    boxType: getBoxTypeLabel(cabinet.boxType),
    name,
    quantity: quantity * cabinetQuantity,
    rawWidth: width,
    rawHeight: height,
    dimensions: dimensions(width, height, pvc),
    group,
    material,
  };
}

function addOpeningFronts(pieces, cabinet, frontMaterial) {
  if (cabinet.width <= 60) {
    pieces.push(row(cabinet, 'Πρόσοψη', 1, cabinet.height - 0.3, cabinet.width - 0.3, frontMaterial, frontMaterial, [2, 2]));
    return;
  }

  pieces.push(row(cabinet, 'Πρόσοψη', 2, cabinet.height - 0.3, cabinet.width / 2 - 0.3, frontMaterial, frontMaterial, [2, 2]));
}

function addBlindOpeningFronts(pieces, cabinet, blindWidth, frontMaterial) {
  const openingWidth = cabinet.width - blindWidth;

  if (openingWidth <= 60) {
    pieces.push(row(cabinet, 'Πρόσοψη', 1, cabinet.height - 0.3, openingWidth - 0.3, frontMaterial, frontMaterial, [2, 2]));
    return;
  }

  pieces.push(row(cabinet, 'Πρόσοψη', 2, cabinet.height - 0.3, openingWidth / 2 - 0.3, frontMaterial, frontMaterial, [2, 2]));
}

function normalizeCabinet(cabinet, index = 0) {
  const migrated = migrateCabinetType(cabinet);
  const layouts = getLayouts(migrated.boxType);
  const frontType = layouts.some((layout) => layout.value === migrated.frontType) ? migrated.frontType : 'simple';

  return {
    ...cabinet,
    id: cabinet.id || createId(),
    name: cabinet.name.trim() || `Κουτί ${index + 1}`,
    boxType: migrated.boxType,
    height: Math.max(0, numberValue(cabinet.height)),
    width: Math.max(0, numberValue(cabinet.width)),
    widthB: Math.max(0, numberValue(cabinet.widthB || cabinet.width)),
    depth: Math.max(0, numberValue(cabinet.depth)),
    shelves: Math.max(0, Math.floor(numberValue(cabinet.shelves))),
    quantity: Math.max(1, Math.floor(numberValue(cabinet.quantity || 1))),
    frontType,
    frontMaterial: cabinet.frontMaterial || '',
    noFronts: migrated.boxType === 'externalDrawer' ? false : Boolean(cabinet.noFronts),
  };
}

function calculatePieces(cabinet) {
  const height = cabinet.height;
  const width = cabinet.width;
  const widthB = cabinet.widthB;
  const depth = cabinet.depth;
  const innerWidth = width - 3.6;
  const shelfWidth = width - 3.8;
  const shelfDepth = depth - 3;
  const frontMaterial = getFrontMaterial(cabinet);
  const pieces = [];

  if ((cabinet.boxType === 'base' || cabinet.boxType === 'wall') && cabinet.frontType === 'corner') {
    const cornerPanelWidth = width - 1.8;
    const cornerPanelDepth = widthB - 1.8;
    const cornerShelfWidth = width - 3.8;
    const cornerShelfDepth = widthB - 3.8;

    pieces.push(row(cabinet, 'Πλαϊνά', 2, height, depth, melamine18, melamine18, [1, 2]));
    pieces.push(row(cabinet, 'Καπάκι', 1, cornerPanelWidth, cornerPanelDepth, melamine18));
    pieces.push(row(cabinet, 'Πάτος', 1, cornerPanelWidth, cornerPanelDepth, melamine18));

    if (cabinet.shelves > 0) {
      pieces.push(row(cabinet, 'Ράφι', cabinet.shelves, cornerShelfWidth, cornerShelfDepth, melamine18));
    }

    pieces.push(row(cabinet, 'Τραβέρσα στήριξης', 1, height - 3.6, 10, melamine18));
    pieces.push(row(cabinet, 'Πλάτη Α', 1, height - 2, width - 1, melamine8));
    pieces.push(row(cabinet, 'Πλάτη Β', 1, height - 2, widthB - 1, melamine8));
    if (!cabinet.noFronts) {
      pieces.push(row(cabinet, 'Πορτάκι Α', 1, height - 0.3, width - 58.5, frontMaterial, frontMaterial, [2, 2]));
      pieces.push(row(cabinet, 'Πορτάκι Β', 1, height - 0.3, widthB - 58.5, frontMaterial, frontMaterial, [2, 2]));
    }

    return pieces;
  }

  if (cabinet.boxType === 'wardrobeDrawer') {
    const drawerCount = Math.max(0, Math.floor(numberValue(cabinet.shelves)));

    pieces.push(row(cabinet, 'Πλαϊνά', 2, height, depth, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Πάτος', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Τραβέρσες', 2, innerWidth, 10, melamine18, melamine18, [1, 0]));

    if (drawerCount > 0) {
      pieces.push(row(cabinet, 'Κουτέλο', drawerCount, width - 0.3, 17.5, melamine18, melamine18, [2, 2]));
      pieces.push(row(cabinet, 'Πλαϊνά συρταριού', drawerCount * 2, 50, 14, melamine18, melamine18, [2, 0]));
      pieces.push(row(cabinet, 'Μπροστινό', drawerCount, width - 8.5, 11, melamine18, melamine18, [1, 0]));
      pieces.push(row(cabinet, 'Πίσω', drawerCount, width - 8.5, 12.5, melamine18, melamine18, [1, 0]));
      pieces.push(row(cabinet, 'Πάτος συρταριού', drawerCount, 50, width - 6.2, melamine8));
    }

    return pieces;
  }

  if (cabinet.boxType === 'simpleDrawer') {
    const drawerCount = Math.max(0, Math.floor(numberValue(cabinet.shelves)));
    const simpleInnerWidth = width - 3.2;
    const drawerInnerWidth = width - 6.5;

    pieces.push(row(cabinet, 'Πλαϊνά', 2, height, depth, melamine16, melamine16, [1, 0]));
    pieces.push(row(cabinet, 'Πάτος', 1, simpleInnerWidth, depth, melamine16, melamine16, [1, 0]));
    pieces.push(row(cabinet, 'Τραβέρσες', 2, simpleInnerWidth, 10, melamine16, melamine16, [1, 0]));

    if (drawerCount > 0) {
      pieces.push(row(cabinet, 'Πάτος συρταριού', drawerCount, drawerInnerWidth, 50, melamine16));
      pieces.push(row(cabinet, 'Πίσω', drawerCount, drawerInnerWidth, 13.5, melamine16));
      pieces.push(row(cabinet, 'Μέτωπο', drawerCount, width - 0.3, 16, melamine16, melamine16, [2, 2]));
    }

    return pieces;
  }

  if (cabinet.boxType === 'externalDrawer') {
    const drawerCount = Math.max(0, Math.floor(numberValue(cabinet.shelves)));
    const drawerInnerWidth = width - 6.5;

    pieces.push(row(cabinet, 'Πλαϊνά', 2, height, depth, melamine18, melamine18, [1, 2]));
    pieces.push(row(cabinet, 'Πάτος / Καπάκι', 2, innerWidth, depth, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Πλάτη', 1, height - 2, width - 2, melamine8));

    if (drawerCount > 0) {
      pieces.push(row(cabinet, 'Πάτος συρταριού', drawerCount, drawerInnerWidth, depth - 4, melamine18));
      pieces.push(row(cabinet, 'Πίσω', drawerCount, drawerInnerWidth, 13.5, melamine18, melamine18, [1, 0]));
      pieces.push(row(cabinet, 'Μπροστά', drawerCount, drawerInnerWidth, 13.5, melamine18, melamine18, [1, 0]));
      pieces.push(row(
        cabinet,
        'Πρόσοψη',
        drawerCount,
        height / drawerCount - 0.3,
        width - 0.3,
        frontMaterial,
        frontMaterial,
        [2, 2],
      ));
    }

    return pieces;
  }

  pieces.push(row(cabinet, 'Πλαϊνά', 2, height, depth, melamine18, melamine18, [1, 2]));

  if (cabinet.boxType === 'wardrobe') {
    pieces.push(row(cabinet, 'Καπάκι', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Πάτος', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));

    if (cabinet.shelves > 0) {
      pieces.push(row(cabinet, 'Ράφια', cabinet.shelves, shelfWidth, shelfDepth, melamine18, melamine18, [2, 2]));
    }

    pieces.push(row(cabinet, 'Πλάτη', 1, height - 2, width - 2, melamine8));

    if (!cabinet.noFronts) {
      addOpeningFronts(pieces, cabinet, frontMaterial);
    }

    return pieces;
  }

  if (cabinet.boxType === 'base' && cabinet.frontType === 'oven') {
    pieces.push(row(cabinet, 'Πάτος', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Χώρισμα', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
    if (!cabinet.noFronts) {
      pieces.push(row(cabinet, 'Πρόσοψη', 1, 11.7, width - 0.3, frontMaterial, frontMaterial, [2, 2]));
    }
    return pieces;
  }

  if (cabinet.boxType === 'base' && cabinet.frontType === 'blind') {
    pieces.push(row(cabinet, 'Τραβέρσες', 2, innerWidth, 10, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Πάτος', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));

    if (cabinet.shelves > 0) {
      pieces.push(row(cabinet, 'Ράφια', cabinet.shelves, shelfWidth, shelfDepth, melamine18, melamine18, [2, 2]));
    }

    pieces.push(row(cabinet, 'Επιπλέον κομμάτι', 1, 72, 60, melamine18));
    if (!cabinet.noFronts) {
      addBlindOpeningFronts(pieces, cabinet, 60, frontMaterial);
      pieces.push(row(cabinet, 'Πρόσοψη τυφλού', 1, height - 0.3, 20, frontMaterial, frontMaterial, [2, 2]));
    }
    pieces.push(row(cabinet, 'Πλάτη', 1, height - 2, width - 2, melamine8));
    return pieces;
  }

  if (cabinet.boxType === 'wall' && cabinet.frontType === 'blind') {
    pieces.push(row(cabinet, 'Καπάκι', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Πάτος', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));

    if (cabinet.shelves > 0) {
      pieces.push(row(cabinet, 'Ράφια', cabinet.shelves, shelfWidth, shelfDepth, melamine18, melamine18, [2, 2]));
    }

    pieces.push(row(cabinet, 'Επιπλέον κομμάτι', 1, 72, 40, melamine18));
    if (!cabinet.noFronts) {
      addBlindOpeningFronts(pieces, cabinet, 40, frontMaterial);
      pieces.push(row(cabinet, 'Πρόσοψη τυφλού', 1, height - 0.3, 20, frontMaterial, frontMaterial, [2, 2]));
    }
    pieces.push(row(cabinet, 'Πλάτη', 1, height - 2, width - 2, melamine8));
    return pieces;
  }

  if (cabinet.boxType === 'base') {
    pieces.push(row(cabinet, 'Τραβέρσες', 2, innerWidth, 10, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Πάτος', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
  } else {
    pieces.push(row(cabinet, 'Καπάκι', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
    pieces.push(row(cabinet, 'Πάτος', 1, innerWidth, depth, melamine18, melamine18, [1, 0]));
  }

  if (cabinet.shelves > 0) {
    pieces.push(row(cabinet, 'Ράφια', cabinet.shelves, shelfWidth, shelfDepth, melamine18, melamine18, [2, 2]));
  }

  pieces.push(row(cabinet, 'Πλάτη', 1, height - 2, width - 2, melamine8));

  if (usesFrontMaterial(cabinet.boxType) && !cabinet.noFronts) {
    if (cabinet.frontType === 'simple') {
      addOpeningFronts(pieces, cabinet, frontMaterial);
    }

    if (cabinet.frontType === 'drawerDoor') {
      pieces.push(row(cabinet, 'Πρόσοψη', 1, 17.7, width - 0.3, frontMaterial, frontMaterial, [2, 2]));
      pieces.push(row(cabinet, 'Πρόσοψη', 1, 53.7, width - 0.3, frontMaterial, frontMaterial, [2, 2]));
    }

    if (cabinet.frontType === 'twoDrawersPullout') {
      pieces.push(row(cabinet, 'Πρόσοψη', 2, 17.7, width - 0.3, frontMaterial, frontMaterial, [2, 2]));
      pieces.push(row(cabinet, 'Πρόσοψη', 1, 35.7, width - 0.3, frontMaterial, frontMaterial, [2, 2]));
    }

    if (cabinet.frontType === 'twoPullouts') {
      pieces.push(row(cabinet, 'Πρόσοψη', 2, 35.7, width - 0.3, frontMaterial, frontMaterial, [2, 2]));
    }

    if (cabinet.frontType === 'fourDrawers') {
      pieces.push(row(cabinet, 'Πρόσοψη', 4, 17.7, width - 0.3, frontMaterial, frontMaterial, [2, 2]));
    }
  }

  return pieces;
}

function groupPieces(cabinets, sideAdditions, customPieces) {
  const allPieces = getAllPieces(cabinets, sideAdditions, customPieces);
  const groupNames = Array.from(new Set(allPieces.map((piece) => piece.group))).sort(
    (a, b) => materialRank(a) - materialRank(b) || a.localeCompare(b, 'el'),
  );

  return groupNames.map((group) => ({
    group,
    pieces: allPieces.filter((piece) => piece.group === group),
  }));
}

function supplierGroups(cabinets, sideAdditions, customPieces) {
  const allPieces = getAllPieces(cabinets, sideAdditions, customPieces);
  const groupNames = Array.from(new Set(allPieces.map((piece) => piece.group))).sort(
    (a, b) => materialRank(a) - materialRank(b) || a.localeCompare(b, 'el'),
  );

  return groupNames.map((group) => {
    const grouped = new Map();

    allPieces
      .filter((piece) => piece.group === group)
      .forEach((piece) => {
        const key = `${piece.material}|${piece.dimensions}`;
        const current = grouped.get(key);

        if (current) {
          current.quantity += piece.quantity;
          return;
        }

        grouped.set(key, {
          id: key,
          material: piece.material,
          dimensions: piece.dimensions,
          quantity: piece.quantity,
        });
      });

    return {
      group,
      pieces: Array.from(grouped.values()),
    };
  });
}

function getFrontMaterials(cabinets) {
  const materials = cabinets
    .map((cabinet) => getFrontMaterial(cabinet))
    .filter(Boolean);

  return Array.from(new Set(materials)).sort((a, b) => a.localeCompare(b, 'el'));
}

function calculateSideAdditionPieces(sideAdditions) {
  return sideAdditions.map((addition) => {
    const material = addition.material?.trim() || defaultFrontMaterial;

    return row(
      { id: addition.id, name: 'Πλαϊνά / Καταφραγές', boxType: 'sideAddition' },
      'Πλαϊνό / Καταφραγή',
      Math.max(0, Math.floor(numberValue(addition.quantity))),
      Math.max(0, numberValue(addition.height)),
      Math.max(0, numberValue(addition.width)),
      material,
      material,
      [2, 2],
    );
  }).filter((piece) => piece.quantity > 0);
}

function getCustomPieceMaterial(piece) {
  if (piece.materialType === 'Πρόσοψη / Πορτάκι') {
    return piece.frontMaterial?.trim() || defaultFrontMaterial;
  }

  return piece.materialType;
}

function calculateCustomPieces(customPieces) {
  return customPieces.map((piece) => {
    const material = getCustomPieceMaterial(piece);

    return row(
      { id: piece.id, name: 'Custom κομμάτια', boxType: 'custom' },
      piece.name?.trim() || 'Custom κομμάτι',
      Math.max(0, Math.floor(numberValue(piece.quantity))),
      Math.max(0, numberValue(piece.height)),
      Math.max(0, numberValue(piece.width)),
      material,
      material,
      [numberValue(piece.pvcHeight), numberValue(piece.pvcWidth)],
    );
  }).filter((piece) => piece.quantity > 0);
}

function getAllPieces(cabinets, sideAdditions, customPieces) {
  return [
    ...cabinets.flatMap((cabinet) => calculatePieces(cabinet)),
    ...calculateSideAdditionPieces(sideAdditions),
    ...calculateCustomPieces(customPieces),
  ];
}

function sketchSections(cabinets) {
  return [
    { id: 'wall', title: 'Κρεμαστά', cabinets: cabinets.filter((cabinet) => cabinet.boxType === 'wall') },
    { id: 'base', title: 'Βάσεως', cabinets: cabinets.filter((cabinet) => cabinet.boxType === 'base') },
    { id: 'wardrobe', title: 'Ντουλάπες', cabinets: cabinets.filter((cabinet) => cabinet.boxType === 'wardrobe') },
    { id: 'wardrobeDrawer', title: 'Συρταριέρες με κρυφό μηχανισμό', cabinets: cabinets.filter((cabinet) => cabinet.boxType === 'wardrobeDrawer') },
    { id: 'simpleDrawer', title: 'Συρταριέρες απλές', cabinets: cabinets.filter((cabinet) => cabinet.boxType === 'simpleDrawer') },
    { id: 'externalDrawer', title: 'Συρταριέρες εξωτερικές', cabinets: cabinets.filter((cabinet) => cabinet.boxType === 'externalDrawer') },
  ];
}

function cabinetTotals(cabinets) {
  return {
    base: cabinets
      .filter((cabinet) => cabinet.boxType === 'base')
      .reduce((sum, cabinet) => sum + Math.max(1, Math.floor(numberValue(cabinet.quantity || 1))), 0),
    wall: cabinets
      .filter((cabinet) => cabinet.boxType === 'wall')
      .reduce((sum, cabinet) => sum + Math.max(1, Math.floor(numberValue(cabinet.quantity || 1))), 0),
    wardrobe: cabinets
      .filter((cabinet) => cabinet.boxType === 'wardrobe')
      .reduce((sum, cabinet) => sum + Math.max(1, Math.floor(numberValue(cabinet.quantity || 1))), 0),
    wardrobeDrawer: cabinets
      .filter((cabinet) => cabinet.boxType === 'wardrobeDrawer')
      .reduce((sum, cabinet) => sum + Math.max(1, Math.floor(numberValue(cabinet.quantity || 1))), 0),
    simpleDrawer: cabinets
      .filter((cabinet) => cabinet.boxType === 'simpleDrawer')
      .reduce((sum, cabinet) => sum + Math.max(1, Math.floor(numberValue(cabinet.quantity || 1))), 0),
    externalDrawer: cabinets
      .filter((cabinet) => cabinet.boxType === 'externalDrawer')
      .reduce((sum, cabinet) => sum + Math.max(1, Math.floor(numberValue(cabinet.quantity || 1))), 0),
  };
}

function totalCabinetCount(cabinets) {
  const totals = cabinetTotals(cabinets);
  return totals.base + totals.wall + totals.wardrobe + totals.wardrobeDrawer + totals.simpleDrawer + totals.externalDrawer;
}

function isFrontPiece(piece) {
  return piece.group !== melamine18 && piece.group !== melamine8;
}

function containsRect(outer, inner) {
  return inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height;
}

function pruneFreeRects(freeRects) {
  return freeRects.filter((rect, index) => !freeRects.some((other, otherIndex) => (
    index !== otherIndex && containsRect(other, rect)
  )));
}

function placeOnSheet(sheet, piece, allowRotation) {
  let best = null;

  sheet.freeRects.forEach((freeRect, freeIndex) => {
    const orientations = [
      { width: piece.width, height: piece.height },
    ];

    if (allowRotation && piece.width !== piece.height) {
      orientations.push({ width: piece.height, height: piece.width });
    }

    orientations.forEach((orientation) => {
      if (orientation.width > freeRect.width || orientation.height > freeRect.height) {
        return;
      }

      const leftoverArea = (freeRect.width * freeRect.height) - (orientation.width * orientation.height);
      const shortSideWaste = Math.min(freeRect.width - orientation.width, freeRect.height - orientation.height);
      const score = leftoverArea * 1000 + shortSideWaste;

      if (!best || score < best.score) {
        best = {
          freeIndex,
          freeRect,
          width: orientation.width,
          height: orientation.height,
          rotated: orientation.width !== piece.width || orientation.height !== piece.height,
          score,
        };
      }
    });
  });

  if (!best) {
    return false;
  }

  const placed = {
    x: best.freeRect.x,
    y: best.freeRect.y,
    width: best.width,
    height: best.height,
    rotated: best.rotated,
    name: piece.name,
    source: piece.source,
    labelWidth: piece.width,
    labelHeight: piece.height,
  };
  const nextFreeRects = sheet.freeRects.filter((_, index) => index !== best.freeIndex);
  const rightWidth = best.freeRect.width - best.width;
  const bottomHeight = best.freeRect.height - best.height;

  if (rightWidth > 0) {
    nextFreeRects.push({
      x: placed.x + best.width,
      y: placed.y,
      width: rightWidth,
      height: best.height,
    });
  }

  if (bottomHeight > 0) {
    nextFreeRects.push({
      x: placed.x,
      y: placed.y + best.height,
      width: best.freeRect.width,
      height: bottomHeight,
    });
  }

  sheet.freeRects = pruneFreeRects(nextFreeRects);
  sheet.usedArea += piece.area;
  sheet.placements.push(placed);
  return true;
}

function calculateSheetUsage(pieces, settings) {
  const groups = Array.from(new Set(pieces.map((piece) => piece.group))).sort(
    (a, b) => materialRank(a) - materialRank(b) || a.localeCompare(b, 'el'),
  );

  return groups.map((group) => {
    const groupSettings = getSheetSettings(settings, group);
    const sheetLength = Math.max(1, numberValue(groupSettings.length));
    const sheetWidth = Math.max(1, numberValue(groupSettings.width));
    const allowRotation = Boolean(groupSettings.allowRotation && !groupSettings.keepGrain);
    const sheetArea = sheetLength * sheetWidth;
    const expandedPieces = pieces
      .filter((piece) => piece.group === group)
      .flatMap((piece) => Array.from({ length: Math.max(0, Math.floor(numberValue(piece.quantity))) }, (_, index) => ({
        id: `${piece.id}-${index}`,
        name: piece.name,
        source: piece.source,
        width: Math.max(0, numberValue(piece.rawWidth)),
        height: Math.max(0, numberValue(piece.rawHeight)),
        area: Math.max(0, numberValue(piece.rawWidth)) * Math.max(0, numberValue(piece.rawHeight)),
      })))
      .filter((piece) => piece.width > 0 && piece.height > 0)
      .sort((a, b) => b.area - a.area || Math.max(b.width, b.height) - Math.max(a.width, a.height));
    const sheets = [];
    const oversized = [];

    expandedPieces.forEach((piece) => {
      const fitsNormal = piece.width <= sheetLength && piece.height <= sheetWidth;
      const fitsRotated = allowRotation && piece.height <= sheetLength && piece.width <= sheetWidth;

      if (!fitsNormal && !fitsRotated) {
        oversized.push(piece);
        return;
      }

      const placed = sheets.some((sheet) => placeOnSheet(sheet, piece, allowRotation));

      if (!placed) {
        const sheet = {
          freeRects: [{ x: 0, y: 0, width: sheetLength, height: sheetWidth }],
          usedArea: 0,
          placements: [],
        };
        placeOnSheet(sheet, piece, allowRotation);
        sheets.push(sheet);
      }
    });

    const usedArea = sheets.reduce((sum, sheet) => sum + sheet.usedArea, 0);
    const capacity = Math.max(1, sheets.length * sheetArea);
    const usage = sheets.length > 0 ? Math.round((usedArea / capacity) * 100) : 0;

    return {
      group,
      settings: groupSettings,
      sheets: sheets.length,
      sheetLayouts: sheets.map((sheet, index) => ({
        id: `${group}-sheet-${index + 1}`,
        number: index + 1,
        usedArea: sheet.usedArea,
        placements: sheet.placements,
      })),
      usage,
      waste: Math.max(0, 100 - usage),
      pieces: expandedPieces.length,
      oversized: oversized.length,
    };
  });
}

function getSheetSettings(settings, group) {
  if (settings?.[group]) {
    return {
      ...defaultSheetSettings,
      ...settings[group],
    };
  }

  if (settings?.length || settings?.width) {
    return {
      ...defaultSheetSettings,
      ...settings,
    };
  }

  return defaultSheetSettings;
}

function SheetLayoutPreview({ result, layout }) {
  const sheetLength = Math.max(1, numberValue(result.settings.length));
  const sheetWidth = Math.max(1, numberValue(result.settings.width));
  const previewWidth = 330;
  const previewHeight = 230;
  const scale = Math.min(previewWidth / sheetLength, previewHeight / sheetWidth);
  const drawingWidth = sheetLength * scale;
  const drawingHeight = sheetWidth * scale;
  const offsetX = (previewWidth - drawingWidth) / 2 + 12;
  const offsetY = 18;
  const viewWidth = previewWidth + 24;
  const viewHeight = previewHeight + 50;

  return (
    <article className="sheetLayout">
      <h5>Φύλλο {layout.number}</h5>
      <svg className="sheetLayoutSvg" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={`${result.group} φύλλο ${layout.number}`}>
        <rect className="sheetOutline" x={offsetX} y={offsetY} width={drawingWidth} height={drawingHeight} />
        {layout.placements.map((placement, index) => {
          const pieceX = offsetX + placement.x * scale;
          const pieceY = offsetY + placement.y * scale;
          const pieceWidth = placement.width * scale;
          const pieceHeight = placement.height * scale;
          const canShowFullText = pieceWidth > 62 && pieceHeight > 32;
          const canShowSmallText = pieceWidth > 42 && pieceHeight > 22;
          const label = `${placement.name} ${formatNumber(placement.labelWidth)}x${formatNumber(placement.labelHeight)}`;

          return (
            <g key={`${layout.id}-${placement.name}-${index}`}>
              <rect className="sheetPiece" x={pieceX} y={pieceY} width={pieceWidth} height={pieceHeight} />
              {canShowFullText && (
                <>
                  <text className="sheetPieceText" x={pieceX + pieceWidth / 2} y={pieceY + pieceHeight / 2 - 4} textAnchor="middle">
                    {placement.name}
                  </text>
                  <text className="sheetPieceText small" x={pieceX + pieceWidth / 2} y={pieceY + pieceHeight / 2 + 10} textAnchor="middle">
                    {formatNumber(placement.labelWidth)}x{formatNumber(placement.labelHeight)}
                  </text>
                </>
              )}
              {!canShowFullText && canShowSmallText && (
                <text className="sheetPieceText small" x={pieceX + pieceWidth / 2} y={pieceY + pieceHeight / 2 + 3} textAnchor="middle">
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </article>
  );
}

function CornerCabinetSketch({ cabinet }) {
  const planMaxWidth = Math.max(1, cabinet.width, cabinet.widthB || cabinet.width);
  const planScale = Math.min(1.75, 150 / planMaxWidth);
  const planDepth = Math.max(42, Math.min(72, cabinet.depth * 1.08));
  const planA = Math.max(planDepth + 32, Math.min(170, cabinet.width * planScale));
  const planB = Math.max(planDepth + 32, Math.min(170, (cabinet.widthB || cabinet.width) * planScale));
  const planX = 58;
  const planY = 76;
  const shelfCount = Math.max(0, Math.floor(numberValue(cabinet.shelves)));
  const shelfText = shelfCount === 1 ? '1 ράφι' : `${shelfCount} ράφια`;
  const horizontalShelfArea = (planA - planDepth) * planDepth;
  const verticalShelfArea = planDepth * (planB - planDepth);
  const shelfTextX = horizontalShelfArea >= verticalShelfArea
    ? planX + planDepth + (planA - planDepth) / 2
    : planX + planDepth / 2;
  const shelfTextY = horizontalShelfArea >= verticalShelfArea
    ? planY + planDepth / 2 + 4
    : planY + planDepth + (planB - planDepth) / 2 + 4;

  return (
    <article className="sketchCabinet">
      <div className="sketchName">{cabinet.name}</div>
      <svg className="sketchSvg" viewBox="0 0 290 300" role="img" aria-label={`Σκαρίφημα ${cabinet.name}`}>
        <text className="dimensionText" x={planX + planA / 2} y={34} textAnchor="middle">
          Ύψος: {formatNumber(cabinet.height)}
        </text>

        <line className="dimensionLine" x1={planX} y1={planY - 16} x2={planX + planA} y2={planY - 16} />
        <line className="dimensionLine" x1={planX - 16} y1={planY} x2={planX - 16} y2={planY + planB} />
        <line className="dimensionLine" x1={planX + planA + 16} y1={planY} x2={planX + planA + 16} y2={planY + planDepth} />

        <text className="dimensionText" x={planX + planA / 2} y={planY - 24} textAnchor="middle">
          ΠΑ {formatNumber(cabinet.width)}
        </text>
        <text className="dimensionText" x={planX - 28} y={planY + planB / 2} textAnchor="middle" transform={`rotate(-90 ${planX - 28} ${planY + planB / 2})`}>
          ΠΒ {formatNumber(cabinet.widthB)}
        </text>
        <text className="dimensionText" x={planX + planA + 34} y={planY + planDepth / 2} textAnchor="middle" transform={`rotate(-90 ${planX + planA + 34} ${planY + planDepth / 2})`}>
          Β {formatNumber(cabinet.depth)}
        </text>

        <polygon
          className="sketchFront"
          points={`${planX},${planY} ${planX + planA},${planY} ${planX + planA},${planY + planDepth} ${planX + planDepth},${planY + planDepth} ${planX + planDepth},${planY + planB} ${planX},${planY + planB}`}
        />
        {shelfCount > 0 && (
          <text className="sketchShelfText" x={shelfTextX} y={shelfTextY} textAnchor="middle">
            {shelfText}
          </text>
        )}
      </svg>
    </article>
  );
}

function CabinetSketch({ cabinet }) {
  if (cabinet.frontType === 'corner') {
    return <CornerCabinetSketch cabinet={cabinet} />;
  }

  const sketchFrontType = ['wardrobeDrawer', 'simpleDrawer', 'externalDrawer'].includes(cabinet.boxType) ? 'fourDrawers' : cabinet.noFronts ? 'simple' : cabinet.frontType;
  const isCorner = false;
  const cornerMaxWidth = Math.max(1, cabinet.width, cabinet.widthB || cabinet.width);
  const drawingWidth = Math.max(60, Math.min(182, cabinet.width * 1.38));
  const drawingHeight = Math.max(64, Math.min(178, cabinet.height * 1.38));
  const drawingDepth = Math.max(24, Math.min(56, cabinet.depth * 0.84));
  const x = 40;
  const y = 28 + (178 - drawingHeight);
  const frontTop = y + drawingDepth;
  const frontRight = x + drawingWidth;
  const frontBottom = frontTop + drawingHeight;
  const sideRight = frontRight + drawingDepth;
  const topY = y;
  const shelfCount = Math.max(0, Math.floor(numberValue(cabinet.shelves)));
  const panelThickness = Math.max(4, Math.min(8, Math.min(drawingWidth, drawingHeight) * 0.07));
  const innerLines = [];
  const cornerWidthA = isCorner ? Math.max(48, drawingWidth * (cabinet.width / cornerMaxWidth)) : drawingWidth;
  const cornerWidthB = isCorner ? Math.max(48, drawingWidth * ((cabinet.widthB || cabinet.width) / cornerMaxWidth)) : drawingWidth;
  const cornerX = x + cornerWidthA;
  const cornerBRight = x + cornerWidthB;
  const cornerSideRight = cornerBRight + drawingDepth;
  const cornerY = frontTop + drawingHeight * 0.43;

  if (sketchFrontType === 'simple') {
    const innerLeft = x + panelThickness;
    const innerRight = frontRight - panelThickness;
    const innerTop = frontTop + panelThickness;
    const innerBottom = frontBottom - panelThickness;

    innerLines.push(
      <line className="sketchCarcassLine" x1={innerLeft} y1={frontTop} x2={innerLeft} y2={frontBottom} key="left-panel-thickness" />,
      <line className="sketchCarcassLine" x1={innerRight} y1={frontTop} x2={innerRight} y2={frontBottom} key="right-panel-thickness" />,
      <line className="sketchCarcassLine" x1={x} y1={innerTop} x2={frontRight} y2={innerTop} key="top-panel-thickness" />,
      <line className="sketchCarcassLine" x1={x} y1={innerBottom} x2={frontRight} y2={innerBottom} key="bottom-panel-thickness" />,
    );

    for (let index = 1; index <= shelfCount; index += 1) {
      const shelfY = innerTop + ((innerBottom - innerTop) / (shelfCount + 1)) * index;

      innerLines.push(
        <rect
          className="sketchShelfPanel"
          x={innerLeft}
          y={shelfY - panelThickness / 2}
          width={Math.max(12, innerRight - innerLeft)}
          height={panelThickness}
          key={`shelf-${index}`}
        />,
      );
    }
  }

  if (sketchFrontType === 'drawerDoor') {
    const drawerY = frontTop + drawingHeight * 0.26;
    innerLines.push(<line className="sketchInnerLine" x1={x} y1={drawerY} x2={frontRight} y2={drawerY} key="drawer-door-split" />);
    innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={frontTop + drawingHeight * 0.13} x2={x + drawingWidth * 0.62} y2={frontTop + drawingHeight * 0.13} key="drawer-door-handle" />);
    innerLines.push(<line className="sketchInnerLine" x1={x + drawingWidth / 2} y1={drawerY} x2={x + drawingWidth / 2} y2={frontBottom} key="door-center" />);
  }

  if (sketchFrontType === 'twoDrawersPullout') {
    const firstY = frontTop + drawingHeight * 0.22;
    const secondY = frontTop + drawingHeight * 0.44;
    innerLines.push(<line className="sketchInnerLine" x1={x} y1={firstY} x2={frontRight} y2={firstY} key="drawer-1" />);
    innerLines.push(<line className="sketchInnerLine" x1={x} y1={secondY} x2={frontRight} y2={secondY} key="drawer-2" />);
    innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={frontTop + drawingHeight * 0.11} x2={x + drawingWidth * 0.62} y2={frontTop + drawingHeight * 0.11} key="drawer-handle-1" />);
    innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={frontTop + drawingHeight * 0.33} x2={x + drawingWidth * 0.62} y2={frontTop + drawingHeight * 0.33} key="drawer-handle-2" />);
    innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={frontTop + drawingHeight * 0.68} x2={x + drawingWidth * 0.62} y2={frontTop + drawingHeight * 0.68} key="pullout-handle" />);
  }

  if (sketchFrontType === 'twoPullouts') {
    innerLines.push(<line className="sketchInnerLine" x1={x} y1={frontTop + drawingHeight / 2} x2={frontRight} y2={frontTop + drawingHeight / 2} key="two-pullouts" />);
    innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={frontTop + drawingHeight * 0.25} x2={x + drawingWidth * 0.62} y2={frontTop + drawingHeight * 0.25} key="pullout-handle-1" />);
    innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={frontTop + drawingHeight * 0.75} x2={x + drawingWidth * 0.62} y2={frontTop + drawingHeight * 0.75} key="pullout-handle-2" />);
  }

  if (sketchFrontType === 'fourDrawers') {
    const drawerCount = ['wardrobeDrawer', 'simpleDrawer', 'externalDrawer'].includes(cabinet.boxType) ? Math.max(1, Math.floor(numberValue(cabinet.shelves))) : 4;

    for (let index = 1; index <= drawerCount - 1; index += 1) {
      const drawerY = frontTop + (drawingHeight / drawerCount) * index;
      innerLines.push(<line className="sketchInnerLine" x1={x} y1={drawerY} x2={frontRight} y2={drawerY} key={`drawer-${index}`} />);
    }
    for (let index = 0; index < drawerCount; index += 1) {
      const handleY = frontTop + (drawingHeight / drawerCount) * index + drawingHeight / (drawerCount * 2);
      innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={handleY} x2={x + drawingWidth * 0.62} y2={handleY} key={`drawer-handle-${index}`} />);
    }
  }

  if (sketchFrontType === 'oven') {
    const ovenHeight = drawingHeight * 0.72;
    const drawerY = frontTop + ovenHeight;
    const drawerHandleY = drawerY + (frontBottom - drawerY) / 2;
    innerLines.push(<rect className="sketchInnerRect" x={x + 10} y={frontTop + 10} width={Math.max(24, drawingWidth - 20)} height={Math.max(28, ovenHeight - 18)} key="oven-box" />);
    innerLines.push(<circle className="sketchInnerCircle" cx={x + drawingWidth / 2} cy={frontTop + ovenHeight / 2} r={Math.max(8, Math.min(18, drawingWidth * 0.12))} key="oven-symbol" />);
    innerLines.push(<line className="sketchInnerLine" x1={x} y1={drawerY} x2={frontRight} y2={drawerY} key="oven-drawer" />);
    innerLines.push(<line className="sketchHandle" x1={x + drawingWidth * 0.38} y1={drawerHandleY} x2={x + drawingWidth * 0.62} y2={drawerHandleY} key="oven-drawer-handle" />);
  }

  if (sketchFrontType === 'blind') {
    const blindRatio = cabinet.boxType === 'wall' ? 40 / Math.max(cabinet.width, 1) : 60 / Math.max(cabinet.width, 1);
    const blindX = x + Math.min(drawingWidth * 0.7, Math.max(28, drawingWidth * blindRatio));
    innerLines.push(<line className="sketchInnerLine" x1={blindX} y1={frontTop} x2={blindX} y2={frontBottom} key="blind-split" />);
    innerLines.push(<line className="sketchInnerLine dashed" x1={x + 8} y1={frontTop + 8} x2={blindX - 8} y2={frontBottom - 8} key="blind-mark-1" />);
    innerLines.push(<line className="sketchInnerLine dashed" x1={blindX - 8} y1={frontTop + 8} x2={x + 8} y2={frontBottom - 8} key="blind-mark-2" />);
  }

  if (isCorner) {
    const planMaxWidth = Math.max(1, cabinet.width, cabinet.widthB || cabinet.width);
    const planScale = Math.min(1.75, 150 / planMaxWidth);
    const planDepth = Math.max(32, Math.min(58, cabinet.depth * 0.9));
    const planA = Math.max(planDepth + 32, Math.min(170, cabinet.width * planScale));
    const planB = Math.max(planDepth + 32, Math.min(170, (cabinet.widthB || cabinet.width) * planScale));
    const planX = 58;
    const planY = 76;

    return (
      <article className="sketchCabinet">
        <div className="sketchName">{cabinet.name}</div>
        <svg className="sketchSvg" viewBox="0 0 290 300" role="img" aria-label={`Σκαρίφημα ${cabinet.name}`}>
          <text className="dimensionText" x={planX + planA / 2} y={34} textAnchor="middle">
            Ύψος: {formatNumber(cabinet.height)}
          </text>

          <line className="dimensionLine" x1={planX} y1={planY - 16} x2={planX + planA} y2={planY - 16} />
          <line className="dimensionLine" x1={planX - 16} y1={planY} x2={planX - 16} y2={planY + planB} />
          <line className="dimensionLine" x1={planX + planA + 16} y1={planY} x2={planX + planA + 16} y2={planY + planDepth} />

          <text className="dimensionText" x={planX + planA / 2} y={planY - 24} textAnchor="middle">
            ΠΑ {formatNumber(cabinet.width)}
          </text>
          <text className="dimensionText" x={planX - 28} y={planY + planB / 2} textAnchor="middle" transform={`rotate(-90 ${planX - 28} ${planY + planB / 2})`}>
            ΠΒ {formatNumber(cabinet.widthB)}
          </text>
          <text className="dimensionText" x={planX + planA + 34} y={planY + planDepth / 2} textAnchor="middle" transform={`rotate(-90 ${planX + planA + 34} ${planY + planDepth / 2})`}>
            Β {formatNumber(cabinet.depth)}
          </text>

          <polygon
            className="sketchFront"
            points={`${planX},${planY} ${planX + planA},${planY} ${planX + planA},${planY + planDepth} ${planX + planDepth},${planY + planDepth} ${planX + planDepth},${planY + planB} ${planX},${planY + planB}`}
          />
        </svg>
      </article>
    );
  }

  return (
    <article className="sketchCabinet">
      <div className="sketchName">{cabinet.name}</div>
      <svg className="sketchSvg" viewBox="0 0 290 300" role="img" aria-label={`Σκαρίφημα ${cabinet.name}`}>
        <line className="dimensionLine" x1={x} y1={frontBottom + 14} x2={isCorner ? cornerX : frontRight} y2={frontBottom + 14} />
        <line className="dimensionLine" x1={x - 14} y1={frontTop} x2={x - 14} y2={frontBottom} />
        <line className="dimensionLine" x1={(isCorner ? cornerBRight : frontRight) + 8} y1={frontTop - 8} x2={(isCorner ? cornerSideRight : sideRight) + 8} y2={topY - 8} />
        {isCorner && (
          <line className="dimensionLine" x1={x + drawingDepth} y1={topY + 16} x2={cornerBRight + drawingDepth} y2={topY + 16} />
        )}

        <text className="dimensionText" x={x + (isCorner ? cornerWidthA : drawingWidth) / 2} y={frontBottom + 30} textAnchor="middle">
          {isCorner ? 'ΠΑ' : 'Π'} {formatNumber(cabinet.width)}
        </text>
        {isCorner && (
          <text className="dimensionText" x={x + drawingDepth + cornerWidthB / 2} y={topY + 10} textAnchor="middle">
            ΠΒ {formatNumber(cabinet.widthB)}
          </text>
        )}
        <text className="dimensionText" x={x - 24} y={frontTop + drawingHeight / 2} textAnchor="middle" transform={`rotate(-90 ${x - 24} ${frontTop + drawingHeight / 2})`}>
          Υ {formatNumber(cabinet.height)}
        </text>
        <text className="dimensionText" x={(isCorner ? cornerBRight : frontRight) + drawingDepth / 2 + 16} y={topY - 14} textAnchor="middle">
          Β {formatNumber(cabinet.depth)}
        </text>

        {isCorner ? (
          <>
            <polygon
              className="sketchTop"
              points={`${x},${frontTop} ${x + drawingDepth},${topY} ${cornerSideRight},${topY} ${cornerBRight},${frontTop}`}
            />
            <polygon
              className="sketchSide"
              points={`${cornerBRight},${frontTop} ${cornerSideRight},${topY} ${cornerSideRight},${cornerY - drawingDepth} ${cornerBRight},${cornerY}`}
            />
            <polygon
              className="sketchSide"
              points={`${cornerX},${cornerY} ${cornerX + drawingDepth},${cornerY - drawingDepth} ${cornerX + drawingDepth},${frontBottom - drawingDepth} ${cornerX},${frontBottom}`}
            />
            <polygon
              className="sketchFront"
              points={`${x},${frontTop} ${cornerBRight},${frontTop} ${cornerBRight},${cornerY} ${cornerX},${cornerY} ${cornerX},${frontBottom} ${x},${frontBottom}`}
            />
          </>
        ) : (
          <>
            <polygon
              className="sketchTop"
              points={`${x},${frontTop} ${x + drawingDepth},${topY} ${sideRight},${topY} ${frontRight},${frontTop}`}
            />
            <polygon
              className="sketchSide"
              points={`${frontRight},${frontTop} ${sideRight},${topY} ${sideRight},${topY + drawingHeight} ${frontRight},${frontBottom}`}
            />
            <polygon
              className="sketchFront"
              points={`${x},${frontTop} ${frontRight},${frontTop} ${frontRight},${frontBottom} ${x},${frontBottom}`}
            />
          </>
        )}
        {innerLines}
      </svg>
    </article>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(getPageFromPath(window.location.pathname));
  const [project, setProject] = useState(normalizeProject(initialProject));
  const [sideAdditionForm, setSideAdditionForm] = useState(initialSideAddition);
  const [sideAdditions, setSideAdditions] = useState([]);
  const [customPieceForm, setCustomPieceForm] = useState(initialCustomPiece);
  const [customPieces, setCustomPieces] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [savedProjects, setSavedProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [pendingProjectImport, setPendingProjectImport] = useState(null);
  const projectImportInputRef = useRef(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [cabinetForm, setCabinetForm] = useState(initialCabinet);
  const [cabinets, setCabinets] = useState([]);
  const [sheetSettings, setSheetSettings] = useState(initialSheetSettings);
  const [editingId, setEditingId] = useState(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [printMode, setPrintMode] = useState('detailed');

  useEffect(() => {
    setSavedProjects(readSavedProjects());
  }, []);

  useEffect(() => {
    function handlePopState() {
      setCurrentPage(getPageFromPath(window.location.pathname));
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const normalizedCabinets = useMemo(
    () => cabinets.map((cabinet, index) => normalizeCabinet(cabinet, index)),
    [cabinets],
  );

  const groupedResults = useMemo(
    () => groupPieces(normalizedCabinets, sideAdditions, customPieces),
    [normalizedCabinets, sideAdditions, customPieces],
  );

  const supplierResults = useMemo(
    () => supplierGroups(normalizedCabinets, sideAdditions, customPieces),
    [normalizedCabinets, sideAdditions, customPieces],
  );

  const detailedPieces = useMemo(
    () => getAllPieces(normalizedCabinets, sideAdditions, customPieces),
    [normalizedCabinets, sideAdditions, customPieces],
  );

  const sheetResults = useMemo(
    () => calculateSheetUsage(detailedPieces, sheetSettings),
    [detailedPieces, sheetSettings],
  );

  const frontMaterialOptions = useMemo(
    () => getFrontMaterials(normalizedCabinets),
    [normalizedCabinets],
  );

  const cabinetSketchSections = useMemo(
    () => sketchSections(normalizedCabinets),
    [normalizedCabinets],
  );

  const cabinetCategoryTotals = useMemo(
    () => cabinetTotals(normalizedCabinets),
    [normalizedCabinets],
  );

  const totalPieces = groupedResults.reduce(
    (sum, group) => sum + group.pieces.reduce((groupSum, piece) => groupSum + piece.quantity, 0),
    0,
  );
  const totalCabinets = totalCabinetCount(normalizedCabinets);
  const hasLiveResults = detailedPieces.length > 0;

  const filteredProjects = useMemo(() => {
    const term = projectSearch.trim().toLocaleLowerCase('el-GR');

    return savedProjects
      .filter((savedProject) => {
        if (!term) {
          return true;
        }

        return savedProject.project.customerName.toLocaleLowerCase('el-GR').includes(term);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [projectSearch, savedProjects]);

  function updateField(field, value) {
    setCabinetForm((current) => {
      if (field === 'boxType') {
        const layouts = getLayouts(value);
        const hasCurrentLayout = layouts.some((layout) => layout.value === current.frontType);

        return {
          ...current,
          boxType: value,
          frontType: hasCurrentLayout ? current.frontType : 'simple',
          noFronts: value === 'externalDrawer' ? false : current.noFronts,
        };
      }

      return { ...current, [field]: value };
    });
  }

  function updateProject(field, value) {
    setProject((current) => ({ ...current, [field]: value }));
  }

  function updateSheetSettings(group, field, value) {
    setSheetSettings((current) => ({
      ...current,
      [group]: {
        ...getSheetSettings(current, group),
        [field]: value,
      },
    }));
  }

  function navigateTo(page) {
    const path = page === 'projects' ? '/projects' : page === 'sheetOptimizer' ? '/sheet-optimizer' : '/';
    window.history.pushState({}, '', path);
    setCurrentPage(page);
  }

  function updateSideAddition(field, value) {
    setSideAdditionForm((current) => ({ ...current, [field]: value }));
    setHasCalculated(false);
  }

  function addSideAddition(event) {
    event.preventDefault();
    const material = sideAdditionForm.material || frontMaterialOptions[0] || defaultFrontMaterial;

    setSideAdditions((current) => [
      ...current,
      {
        ...sideAdditionForm,
        id: createId(),
        material,
      },
    ]);
    setSideAdditionForm((current) => ({
      ...initialSideAddition,
      material: current.material || material,
    }));
    setHasCalculated(false);
  }

  function deleteSideAddition(id) {
    setSideAdditions((current) => current.filter((addition) => addition.id !== id));
    setHasCalculated(false);
  }

  function updateCustomPiece(field, value) {
    setCustomPieceForm((current) => ({ ...current, [field]: value }));
    setHasCalculated(false);
  }

  function addCustomPiece(event) {
    event.preventDefault();
    setCustomPieces((current) => [
      ...current,
      {
        ...customPieceForm,
        id: createId(),
      },
    ]);
    setCustomPieceForm((current) => ({
      ...initialCustomPiece,
      materialType: current.materialType,
      frontMaterial: current.frontMaterial,
      pvcHeight: current.pvcHeight,
      pvcWidth: current.pvcWidth,
    }));
    setHasCalculated(false);
  }

  function deleteCustomPiece(id) {
    setCustomPieces((current) => current.filter((piece) => piece.id !== id));
    setHasCalculated(false);
  }

  function showSaveMessage(message) {
    setSaveMessage(message);
    window.setTimeout(() => setSaveMessage(''), 2200);
  }

  function persistProject({ showMessage = false, updateProjectState = false } = {}) {
    const now = new Date().toISOString();
    const id = activeProjectId || createId();
    const documentCode = project.documentCode.trim() || 'Χωρίς κωδικό';
    const customerName = project.customerName.trim() || 'Χωρίς πελάτη';
    const savedProject = {
      id,
      project: {
        ...normalizeProject(project),
        documentCode,
        customerName,
      },
      sideAdditions,
      customPieces,
      sheetSettings,
      cabinets: normalizedCabinets,
      results: {
        groupedResults,
        supplierResults,
        detailedPieces,
        totalPieces,
      },
      updatedAt: now,
      createdAt: now,
    };

    setSavedProjects((currentProjects) => {
      const existing = currentProjects.find((item) => item.id === id);
      const nextProject = {
        ...savedProject,
        createdAt: existing?.createdAt || now,
      };
      const nextProjects = [
        nextProject,
        ...currentProjects.filter((item) => item.id !== id),
      ];

      writeSavedProjects(nextProjects);
      return nextProjects;
    });

    if (!activeProjectId) {
      setActiveProjectId(id);
    }

    if (updateProjectState) {
      setProject(savedProject.project);
    }

    if (showMessage) {
      showSaveMessage('Το έργο αποθηκεύτηκε.');
    }
  }

  useEffect(() => {
    const hasContent = activeProjectId
      || project.customerName.trim()
      || project.documentCode.trim()
      || normalizedCabinets.length > 0
      || sideAdditions.length > 0
      || customPieces.length > 0;

    if (!['calculator', 'sheetOptimizer'].includes(currentPage) || !hasContent) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      persistProject();
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [activeProjectId, currentPage, project, normalizedCabinets, sideAdditions, customPieces, sheetSettings, groupedResults, supplierResults, detailedPieces, totalPieces]);

  function newProject() {
    setProject(normalizeProject({ ...initialProject, date: formatGreekDate(new Date()) }));
    setSideAdditionForm(initialSideAddition);
    setSideAdditions([]);
    setCustomPieceForm(initialCustomPiece);
    setCustomPieces([]);
    setSheetSettings(initialSheetSettings);
    setCabinets([]);
    setCabinetForm(initialCabinet);
    setEditingId(null);
    setActiveProjectId(null);
    setHasCalculated(false);
    showSaveMessage('Ξεκίνησε νέο έργο.');
  }

  function saveProject() {
    persistProject({ showMessage: true, updateProjectState: true });
    setHasCalculated(true);
  }

  function openProject(savedProject) {
    setProject(normalizeProject(savedProject.project));
    setSideAdditions(savedProject.sideAdditions || []);
    setSideAdditionForm(initialSideAddition);
    setCustomPieces(savedProject.customPieces || []);
    setSheetSettings(savedProject.sheetSettings || initialSheetSettings);
    setCustomPieceForm(initialCustomPiece);
    setCabinets(savedProject.cabinets || []);
    setCabinetForm(initialCabinet);
    setEditingId(null);
    setActiveProjectId(savedProject.id);
    setHasCalculated(Boolean(savedProject.results));
    navigateTo('calculator');
    showSaveMessage('Το έργο άνοιξε.');
  }

  function deleteProject(id) {
    const nextProjects = savedProjects.filter((item) => item.id !== id);
    writeSavedProjects(nextProjects);
    setSavedProjects(nextProjects);

    if (activeProjectId === id) {
      newProject();
    } else {
      showSaveMessage('Το έργο διαγράφηκε.');
    }
  }

  function exportProjectsBackup() {
    const backup = {
      format: 'kitchen-projects-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: savedProjects,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    const datePart = new Date().toISOString().slice(0, 10);

    link.href = URL.createObjectURL(blob);
    link.download = `kitchen-projects-backup-${datePart}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showSaveMessage(`Εξήχθησαν ${savedProjects.length} έργα.`);
  }

  function commitProjectsImport(importedProjects, mode = 'replaceDuplicates') {
    const existingIds = new Set(savedProjects.map((savedProject) => savedProject.id));
    let nextProjects;

    if (mode === 'addDuplicates') {
      nextProjects = [
        ...importedProjects.map((savedProject) => (
          existingIds.has(savedProject.id)
            ? { ...savedProject, id: createId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : savedProject
        )),
        ...savedProjects,
      ];
    } else {
      const importedIds = new Set(importedProjects.map((savedProject) => savedProject.id));
      nextProjects = [
        ...importedProjects,
        ...savedProjects.filter((savedProject) => !importedIds.has(savedProject.id)),
      ];
    }

    writeSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setPendingProjectImport(null);
    showSaveMessage(`Εισήχθησαν ${importedProjects.length} έργα.`);
  }

  async function importProjectsBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const parsedBackup = JSON.parse(await file.text());
      const importedProjects = parseProjectsBackup(parsedBackup);
      const existingIds = new Set(savedProjects.map((savedProject) => savedProject.id));
      const duplicateCount = importedProjects.filter((savedProject) => existingIds.has(savedProject.id)).length;

      if (duplicateCount > 0) {
        setPendingProjectImport({
          projects: importedProjects,
          duplicateCount,
          fileName: file.name,
        });
        return;
      }

      commitProjectsImport(importedProjects, 'replaceDuplicates');
    } catch (error) {
      showSaveMessage(error instanceof Error ? error.message : 'Η εισαγωγή του αρχείου απέτυχε.');
    }
  }

  function createNextCabinetForm(previousForm = cabinetForm) {
    const layouts = getLayouts(previousForm.boxType);
    const hasLayout = layouts.some((layout) => layout.value === previousForm.frontType);

    return {
      ...initialCabinet,
      boxType: previousForm.boxType,
      frontType: hasLayout ? previousForm.frontType : 'simple',
      frontMaterial: previousForm.frontMaterial,
      noFronts: previousForm.noFronts,
      height: previousForm.height,
      width: previousForm.width,
      widthB: previousForm.widthB,
      depth: previousForm.depth,
      shelves: previousForm.shelves,
      quantity: previousForm.quantity,
    };
  }

  function clearForm({ keepLastSelection = false } = {}) {
    setCabinetForm((current) => (keepLastSelection ? createNextCabinetForm(current) : initialCabinet));
    setEditingId(null);
  }

  function saveCabinet(event) {
    event.preventDefault();
    const nextCabinet = normalizeCabinet(
      { ...cabinetForm, id: editingId || createId() },
      cabinets.length,
    );

    if (editingId) {
      setCabinets((current) => current.map((cabinet) => (cabinet.id === editingId ? nextCabinet : cabinet)));
    } else {
      setCabinets((current) => [...current, nextCabinet]);
    }

    setHasCalculated(false);
    clearForm({ keepLastSelection: true });
  }

  function editCabinet(cabinet) {
    setCabinetForm({ ...cabinet });
    setEditingId(cabinet.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteCabinet(id) {
    setCabinets((current) => current.filter((cabinet) => cabinet.id !== id));
    if (editingId === id) {
      clearForm();
    }
    setHasCalculated(false);
  }

  function duplicateCabinet(cabinet) {
    setCabinets((current) => [
      ...current,
      {
        ...cabinet,
        id: createId(),
        name: `${cabinet.name} αντίγραφο`,
      },
    ]);
    setHasCalculated(false);
  }

  function calculateAll() {
    setHasCalculated(true);
  }

  function printPage(mode = 'detailed') {
    setPrintMode(mode);
    setHasCalculated(true);
    window.setTimeout(() => window.print(), 50);
  }

  function exportSupplierWord() {
    setHasCalculated(true);
    const docxBytes = createSupplierDocx(project, supplierResults, cabinetCategoryTotals);
    const blob = new Blob([docxBytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const link = document.createElement('a');
    const fileCode = project.documentCode ? `-${project.documentCode}` : '';
    const fileName = sanitizeFileName(`word-promithefti-${project.customerName || 'project'}${fileCode}`);

    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function renderSheetOptimizerContent() {
    return (
      <section className="panel sheetOptimizerPage">
        <div className="resultsHeader">
          <div>
            <p className="eyebrow">Υπολογισμός φύλλων</p>
            <h2>Βελτιστοποίηση υλικών</h2>
            <p className="sectionHint">Χρησιμοποιεί όλα τα κομμάτια του τρέχοντος έργου ανά υλικό/κωδικό.</p>
          </div>
          <span>{sheetResults.length} υλικά</span>
        </div>
        {hasLiveResults ? (
          <div className="sheetResults">
            {sheetResults.map((result) => (
              <article className="sheetResult" key={`sheet-${result.group}`}>
                <h4>{result.group}</h4>
                <div className="sheetMaterialSettings">
                  <label>
                    <span>Μήκος φύλλου</span>
                    <input type="number" min="1" step="0.1" value={result.settings.length} onChange={(event) => updateSheetSettings(result.group, 'length', event.target.value)} />
                  </label>
                  <label>
                    <span>Πλάτος φύλλου</span>
                    <input type="number" min="1" step="0.1" value={result.settings.width} onChange={(event) => updateSheetSettings(result.group, 'width', event.target.value)} />
                  </label>
                  <label className="checkOption">
                    <input type="checkbox" checked={result.settings.allowRotation} onChange={(event) => updateSheetSettings(result.group, 'allowRotation', event.target.checked)} />
                    <span>Περιστροφή 90°</span>
                  </label>
                  <label className="checkOption">
                    <input type="checkbox" checked={result.settings.keepGrain} onChange={(event) => updateSheetSettings(result.group, 'keepGrain', event.target.checked)} />
                    <span>Φορά νερών</span>
                  </label>
                </div>
                <p><strong>Χρειάζονται:</strong> {result.sheets} φύλλα</p>
                <p><strong>Χρήση:</strong> {result.usage}%</p>
                <p><strong>Υπόλοιπο:</strong> {result.waste}%</p>
                {result.oversized > 0 && (
                  <p className="sheetWarning">{result.oversized} κομμάτια δεν χωρούν στις διαστάσεις φύλλου.</p>
                )}
                {result.sheetLayouts.length > 0 && (
                  <div className="sheetLayouts">
                    {result.sheetLayouts.map((layout) => (
                      <SheetLayoutPreview result={result} layout={layout} key={layout.id} />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="emptyState resultsEmpty">Δεν υπάρχουν κομμάτια στο τρέχον έργο για υπολογισμό φύλλων.</p>
        )}
      </section>
    );
  }

  if (currentPage === 'projects') {
    return (
      <main className={darkMode ? 'app dark' : 'app'}>
        <section className="shell">
          <header className="topbar">
            <div>
              <p className="eyebrow">Αποθηκευμένα έργα</p>
              <h1>Αρχείο έργων</h1>
            </div>
            <div className="actions">
              <button className="secondary navButton" type="button" onClick={() => navigateTo('calculator')}>
                Υπολογιστής κουζίνας
              </button>
              <button className="iconButton" type="button" onClick={() => setDarkMode((value) => !value)} title="Dark mode">
                {darkMode ? <Sun size={19} /> : <Moon size={19} />}
              </button>
            </div>
          </header>

          <section className="panel savedProjectsPage">
            <div className="savedProjectsHeader">
              <div>
                <p className="eyebrow">Αρχείο έργων</p>
                <h2>Αποθηκευμένες δουλειές</h2>
              </div>
              <div className="savedProjectsTools">
                <div className="backupActions">
                  <button className="smallAction" type="button" onClick={exportProjectsBackup}>
                    <Download size={17} />
                    Εξαγωγή έργων
                  </button>
                  <button className="smallAction" type="button" onClick={() => projectImportInputRef.current?.click()}>
                    <FileUp size={17} />
                    Εισαγωγή έργων
                  </button>
                  <input
                    ref={projectImportInputRef}
                    className="visuallyHidden"
                    type="file"
                    accept=".json,application/json"
                    onChange={importProjectsBackup}
                  />
                </div>
                <label className="searchBox">
                  <Search size={18} />
                  <input
                    type="search"
                    aria-label="Αναζήτηση πελάτη"
                    placeholder="Αναζήτηση πελάτη"
                    value={projectSearch}
                    onChange={(event) => setProjectSearch(event.target.value)}
                  />
                </label>
              </div>
            </div>
            {saveMessage && <p className="saveMessage archiveMessage">{saveMessage}</p>}
            <div className="savedProjectsList">
              {filteredProjects.length === 0 && (
                <p className="emptyState">Δεν υπάρχουν αποθηκευμένα έργα.</p>
              )}

              {filteredProjects.map((savedProject) => {
                const savedProjectInfo = normalizeProject(savedProject.project);

                return (
                  <article className={activeProjectId === savedProject.id ? 'savedProject active' : 'savedProject'} key={savedProject.id}>
                    <div>
                      <h3>{savedProjectInfo.customerName}</h3>
                      <p>
                        {documentTypeLabel(savedProjectInfo.documentType)} Νο. {savedProjectInfo.documentCode}
                        {' · '}
                        {savedProjectInfo.date}
                        {' · '}
                        {totalCabinetCount((savedProject.cabinets || []).map((cabinet, cabinetIndex) => normalizeCabinet(cabinet, cabinetIndex)))} κουτιά
                      </p>
                    </div>
                    <div className="itemActions">
                      <button type="button" onClick={() => openProject(savedProject)} title="Άνοιγμα έργου">
                        <FolderOpen size={17} />
                      </button>
                      <button type="button" onClick={() => deleteProject(savedProject.id)} title="Διαγραφή έργου">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          {pendingProjectImport && (
            <div className="modalBackdrop" role="presentation">
              <section className="importDialog" role="dialog" aria-modal="true" aria-labelledby="import-dialog-title">
                <div>
                  <p className="eyebrow">Εισαγωγή έργων</p>
                  <h2 id="import-dialog-title">Βρέθηκαν ίδια έργα</h2>
                </div>
                <p>
                  Το αρχείο <strong>{pendingProjectImport.fileName}</strong> περιέχει{' '}
                  <strong>{pendingProjectImport.duplicateCount}</strong> έργα που υπάρχουν ήδη.
                </p>
                <p>
                  Η αντικατάσταση ενημερώνει μόνο τα ίδια έργα. Η προσθήκη κρατά και τις δύο εκδόσεις.
                </p>
                <div className="importDialogActions">
                  <button className="secondary" type="button" onClick={() => setPendingProjectImport(null)}>
                    Ακύρωση
                  </button>
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => commitProjectsImport(pendingProjectImport.projects, 'addDuplicates')}
                  >
                    <Plus size={17} />
                    Προσθήκη
                  </button>
                  <button
                    className="primary"
                    type="button"
                    onClick={() => commitProjectsImport(pendingProjectImport.projects, 'replaceDuplicates')}
                  >
                    <RotateCcw size={17} />
                    Αντικατάσταση
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (currentPage === 'sheetOptimizer') {
    return (
      <main className={darkMode ? 'app dark' : 'app'}>
        <section className="shell">
          <header className="topbar">
            <div>
              <p className="eyebrow">Υλικά / φύλλα</p>
              <h1>Υπολογισμός φύλλων</h1>
            </div>
            <div className="actions">
              <button className="secondary navButton" type="button" onClick={() => navigateTo('calculator')}>
                Υπολογιστής κουζίνας
              </button>
              <button className="secondary navButton" type="button" onClick={() => navigateTo('projects')}>
                Αρχείο έργων
              </button>
              <button className="iconButton" type="button" onClick={() => setDarkMode((value) => !value)} title="Dark mode">
                {darkMode ? <Sun size={19} /> : <Moon size={19} />}
              </button>
            </div>
          </header>
          {renderSheetOptimizerContent()}
        </section>
      </main>
    );
  }

  return (
    <main className={`${darkMode ? 'app dark' : 'app'} print-${printMode}`}>
      <section className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Έργο / Παραγγελία</p>
            <h1>Υπολογιστής κουζίνας</h1>
          </div>
          <div className="actions">
            <button className="secondary navButton" type="button" onClick={() => navigateTo('projects')}>
              Αρχείο έργων
            </button>
            <button className="secondary navButton" type="button" onClick={() => navigateTo('sheetOptimizer')}>
              Υπολογισμός φύλλων
            </button>
            <button className="iconButton" type="button" onClick={() => setDarkMode((value) => !value)} title="Dark mode">
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="iconButton" type="button" onClick={() => printPage('detailed')} title="Αναλυτική εκτύπωση">
              <Printer size={19} />
            </button>
          </div>
        </header>

        <section className="panel projectPanel">
          <div className="projectPanelHeader">
            <div>
            <p className="eyebrow">Στοιχεία έργου</p>
            <h2>Πελάτης και παραγγελία</h2>
            </div>
            <div className="projectActions">
              <button className="secondary" type="button" onClick={newProject}>
                <Plus size={18} />
                Νέο έργο
              </button>
              <button className="primary" type="button" onClick={saveProject}>
                <Save size={18} />
                Αποθήκευση
              </button>
            </div>
          </div>
          <div className="projectGrid">
            <label>
              <span>Τύπος</span>
              <select
                value={project.documentType}
                onChange={(event) => updateProject('documentType', event.target.value)}
              >
                <option value="order">Παραγγελία</option>
                <option value="quote">Προσφορά</option>
              </select>
            </label>
            <label>
              <span>Όνομα πελάτη</span>
              <input
                type="text"
                placeholder="π.χ. Παπαδόπουλος"
                value={project.customerName}
                onChange={(event) => updateProject('customerName', event.target.value)}
              />
            </label>
            <label>
              <span>{documentCodeLabel(project.documentType)}</span>
              <input
                type="text"
                placeholder="π.χ. 425"
                value={project.documentCode}
                onChange={(event) => updateProject('documentCode', event.target.value)}
              />
            </label>
            <label>
              <span>Ημερομηνία</span>
              <input
                type="text"
                placeholder="ΗΗ/MM/ΕΕΕΕ"
                value={project.date}
                onChange={(event) => updateProject('date', event.target.value)}
                onBlur={(event) => updateProject('date', formatGreekDate(event.target.value))}
              />
            </label>
          </div>
          {saveMessage && <p className="saveMessage">{saveMessage}</p>}
        </section>

        <div className="workspace projectWorkspace">
          <section className="leftStack">
            <form className="panel controls" onSubmit={saveCabinet}>
              <div className="formHeader">
                <div>
                  <p className="eyebrow">Κουτί</p>
                  <h2>{editingId ? 'Επεξεργασία κουτιού' : 'Νέο κουτί'}</h2>
                </div>
              </div>

              <label className="fieldGroup">
                <span>Όνομα κουτιού</span>
                <input
                  type="text"
                  placeholder="π.χ. Κάτω νεροχύτη"
                  value={cabinetForm.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </label>

              <div className="fieldGroup">
                <label>Τύπος κουτιού</label>
                <div className="segmented">
                  {boxTypes.map((type) => (
                    <button
                      className={cabinetForm.boxType === type.value ? 'active' : ''}
                      key={type.value}
                      type="button"
                      onClick={() => updateField('boxType', type.value)}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="inputGrid">
                <label>
                  <span>Ύψος</span>
                  <input type="number" min="0" step="0.1" value={cabinetForm.height} onChange={(event) => updateField('height', event.target.value)} />
                </label>
                <label>
                  <span>{cabinetForm.frontType === 'corner' ? 'Πλάτος Α' : 'Πλάτος'}</span>
                  <input type="number" min="0" step="0.1" value={cabinetForm.width} onChange={(event) => updateField('width', event.target.value)} />
                </label>
                {cabinetForm.frontType === 'corner' && (
                  <label>
                    <span>Πλάτος Β</span>
                    <input type="number" min="0" step="0.1" value={cabinetForm.widthB} onChange={(event) => updateField('widthB', event.target.value)} />
                  </label>
                )}
                <label>
                  <span>Βάθος</span>
                  <input type="number" min="0" step="0.1" value={cabinetForm.depth} onChange={(event) => updateField('depth', event.target.value)} />
                </label>
                <label>
                  <span>{['wardrobeDrawer', 'simpleDrawer', 'externalDrawer'].includes(cabinetForm.boxType) ? 'Αριθμός συρταριών' : 'Ράφια'}</span>
                  <input type="number" min="0" step="1" value={cabinetForm.shelves} onChange={(event) => updateField('shelves', event.target.value)} />
                </label>
                <label>
                  <span>Ποσότητα</span>
                  <input type="number" min="1" step="1" value={cabinetForm.quantity} onChange={(event) => updateField('quantity', event.target.value)} />
                </label>
              </div>

              {usesFrontMaterial(cabinetForm.boxType) && (
                <>
                  {cabinetForm.boxType !== 'externalDrawer' && (
                    <div className="fieldGroup">
                      <label htmlFor="frontType">Τύπος πρόσοψης / διάταξης</label>
                      <select id="frontType" value={cabinetForm.frontType} onChange={(event) => updateField('frontType', event.target.value)}>
                        {getLayouts(cabinetForm.boxType).map((type) => (
                          <option value={type.value} key={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <label className="fieldGroup">
                    <span>Κωδικός / υλικό πρόσοψης</span>
                    <input
                      type="text"
                      placeholder="π.χ. AKRILIKO WHITE"
                      value={cabinetForm.frontMaterial}
                      onChange={(event) => updateField('frontMaterial', event.target.value)}
                    />
                  </label>
                  {cabinetForm.boxType !== 'externalDrawer' && (
                    <label className="checkOption standaloneCheck">
                      <input
                        type="checkbox"
                        checked={cabinetForm.noFronts}
                        onChange={(event) => updateField('noFronts', event.target.checked)}
                      />
                      <span>Χωρίς πορτάκια / χωρίς πρόσοψη</span>
                    </label>
                  )}
                </>
              )}

              <div className="buttonRow">
                <button className="secondary" type="button" onClick={clearForm}>
                  <RotateCcw size={18} />
                  Καθαρισμός
                </button>
                <button className="primary" type="submit">
                  <Plus size={18} />
                  {editingId ? 'Αποθήκευση' : 'Προσθήκη κουτιού'}
                </button>
              </div>
            </form>

            <section className="panel cabinetList">
              <div className="resultsHeader compactHeader">
                <div>
                  <p className="eyebrow">Λίστα κουτιών</p>
                  <h2>Παραγγελία</h2>
                </div>
                <span>{totalCabinets} κουτιά</span>
              </div>

              <div className="cabinetItems">
                {normalizedCabinets.length === 0 && (
                  <p className="emptyState">Δεν έχει προστεθεί ακόμη κουτί.</p>
                )}

                {normalizedCabinets.map((cabinet) => (
                  <article className="cabinetItem" key={cabinet.id}>
                    <div>
                      <h3>{cabinet.name}</h3>
                      <p>
                        {boxTypes.find((type) => type.value === cabinet.boxType)?.label}
                        {' · '}
                        {cabinetSizeLabel(cabinet)}
                        {' · '}
                        Ποσότητα: {cabinet.quantity}
                        {cabinet.noFronts && ' · Χωρίς πρόσοψη'}
                      </p>
                    </div>
                    <div className="itemActions">
                      <button type="button" onClick={() => editCabinet(cabinet)} title="Επεξεργασία">
                        <Pencil size={17} />
                      </button>
                      <button className="textIconButton" type="button" onClick={() => duplicateCabinet(cabinet)} title="Αντιγραφή">
                        <Copy size={17} />
                        Αντιγραφή
                      </button>
                      <button type="button" onClick={() => deleteCabinet(cabinet.id)} title="Διαγραφή">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="calculateBar">
                <button className="primary wideButton" type="button" onClick={calculateAll} disabled={!hasLiveResults}>
                  Ενημέρωση αποτελεσμάτων
                </button>
              </div>
            </section>

            <section className="panel sideAdditionsPanel">
              <form className="sideAdditionsForm" onSubmit={addSideAddition}>
                <div>
                  <p className="eyebrow">Προσθήκη πλαϊνών / καταφραγών</p>
                  <h2>Χειροκίνητα κομμάτια</h2>
                </div>
                <div className="sideAdditionsGrid">
                  <label>
                    <span>Ύψος</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={sideAdditionForm.height}
                      onChange={(event) => updateSideAddition('height', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Πλάτος</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={sideAdditionForm.width}
                      onChange={(event) => updateSideAddition('width', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Ποσότητα</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={sideAdditionForm.quantity}
                      onChange={(event) => updateSideAddition('quantity', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Κωδικός / υλικό</span>
                    <input
                      list="side-material-options"
                      placeholder="π.χ. PET WHITE 101"
                      value={sideAdditionForm.material}
                      onChange={(event) => updateSideAddition('material', event.target.value)}
                    />
                    <datalist id="side-material-options">
                      {frontMaterialOptions.map((material) => (
                        <option value={material} key={material} />
                      ))}
                    </datalist>
                  </label>
                </div>
                <button className="primary wideButton" type="submit">
                  <Plus size={18} />
                  Προσθήκη
                </button>
              </form>

              <div className="sideAdditionsList">
                {sideAdditions.length === 0 && (
                  <p className="emptyState">Δεν έχουν προστεθεί πλαϊνά ή καταφραγές.</p>
                )}

                {sideAdditions.map((addition) => (
                  <article className="sideAdditionItem" key={addition.id}>
                    <div>
                      <h3>{addition.material}</h3>
                      <p>
                        {addition.quantity} τεμ. {formatNumber(numberValue(addition.height))} (=) × {formatNumber(numberValue(addition.width))} (=) cm
                      </p>
                    </div>
                    <button type="button" onClick={() => deleteSideAddition(addition.id)} title="Διαγραφή">
                      <Trash2 size={17} />
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel customPiecesPanel">
              <form className="customPiecesForm" onSubmit={addCustomPiece}>
                <div>
                  <p className="eyebrow">Custom κομμάτι</p>
                  <h2>Χειροκίνητη προσθήκη κομματιού</h2>
                </div>
                <label className="fieldGroup">
                  <span>Όνομα κομματιού</span>
                  <input
                    type="text"
                    placeholder="π.χ. Καπάκι ειδικό"
                    value={customPieceForm.name}
                    onChange={(event) => updateCustomPiece('name', event.target.value)}
                  />
                </label>
                <div className="customPiecesGrid">
                  <label>
                    <span>Ύψος</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={customPieceForm.height}
                      onChange={(event) => updateCustomPiece('height', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Πλάτος</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={customPieceForm.width}
                      onChange={(event) => updateCustomPiece('width', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Ποσότητα</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={customPieceForm.quantity}
                      onChange={(event) => updateCustomPiece('quantity', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Υλικό</span>
                    <select
                      value={customPieceForm.materialType}
                      onChange={(event) => updateCustomPiece('materialType', event.target.value)}
                    >
                      {customMaterialTypes.map((material) => (
                        <option value={material} key={material}>{material}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {customPieceForm.materialType === 'Πρόσοψη / Πορτάκι' && (
                  <label className="fieldGroup">
                    <span>Κωδικός / όνομα υλικού</span>
                    <input
                      list="custom-front-material-options"
                      placeholder="π.χ. PET WHITE"
                      value={customPieceForm.frontMaterial}
                      onChange={(event) => updateCustomPiece('frontMaterial', event.target.value)}
                    />
                    <datalist id="custom-front-material-options">
                      {frontMaterialOptions.map((material) => (
                        <option value={material} key={material} />
                      ))}
                    </datalist>
                  </label>
                )}

                <div className="customPiecesGrid">
                  <label>
                    <span>PVC στο ύψος</span>
                    <select value={customPieceForm.pvcHeight} onChange={(event) => updateCustomPiece('pvcHeight', Number(event.target.value))}>
                      {pvcOptions.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>PVC στο πλάτος</span>
                    <select value={customPieceForm.pvcWidth} onChange={(event) => updateCustomPiece('pvcWidth', Number(event.target.value))}>
                      {pvcOptions.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <button className="primary wideButton" type="submit">
                  <Plus size={18} />
                  Προσθήκη custom κομματιού
                </button>
              </form>

              <div className="customPiecesList">
                {customPieces.length === 0 && (
                  <p className="emptyState">Δεν έχουν προστεθεί custom κομμάτια.</p>
                )}

                {customPieces.map((piece) => (
                  <article className="customPieceItem" key={piece.id}>
                    <div>
                      <h3>{piece.name || 'Custom κομμάτι'}</h3>
                      <p>
                        {piece.quantity} τεμ. {formatNumber(numberValue(piece.height))}{pvcMark(numberValue(piece.pvcHeight))} × {formatNumber(numberValue(piece.width))}{pvcMark(numberValue(piece.pvcWidth))} cm · {getCustomPieceMaterial(piece)}
                      </p>
                    </div>
                    <button type="button" onClick={() => deleteCustomPiece(piece.id)} title="Διαγραφή">
                      <Trash2 size={17} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </section>

          <section className="panel results printArea">
            <div className="resultsHeader">
              <div>
                <p className="eyebrow">Αποτελέσματα</p>
                <h2>Ενιαία λίστα κοπής</h2>
              </div>
              <div className="resultActions">
                <span>{totalPieces} τεμάχια</span>
                <button className="smallAction" type="button" onClick={() => printPage('detailed')}>
                  <Printer size={17} />
                  PDF αναλυτικής λίστας
                </button>
                <button className="smallAction accent" type="button" onClick={() => printPage('supplier')}>
                  <FileDown size={17} />
                  PDF προμηθευτή
                </button>
                <button className="smallAction" type="button" onClick={exportSupplierWord}>
                  <FileDown size={17} />
                  Word προμηθευτή
                </button>
                <button className="smallAction" type="button" onClick={() => printPage('sketch')}>
                  <FileDown size={17} />
                  PDF σκαριφήματος
                </button>
              </div>
            </div>

            {!hasLiveResults && (
              <p className="emptyState resultsEmpty">Προσθέστε κουτιά ή χειροκίνητα κομμάτια για να εμφανιστεί η λίστα κοπής.</p>
            )}

            {hasLiveResults && groupedResults.map((group) => (
              <section className="materialSection" key={group.group}>
                <div className="materialTitle">
                  <h3>{group.group}</h3>
                  <span>{group.pieces.reduce((sum, piece) => sum + piece.quantity, 0)} τεμάχια</span>
                </div>
                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Κουτί</th>
                        <th>Τύπος</th>
                        <th>Όνομα κομματιού</th>
                        <th>Ποσότητα</th>
                        <th>Διαστάσεις</th>
                        <th>Υλικό</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.pieces.map((piece) => (
                        <tr className={isFrontPiece(piece) ? 'frontPieceRow' : ''} key={piece.id}>
                          <td>{piece.source}</td>
                          <td>{piece.boxType}</td>
                          <td>{piece.name}</td>
                          <td>{piece.quantity}</td>
                          <td>{piece.dimensions}</td>
                          <td>{piece.material}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </section>

          <section className="panel sketchPreview">
            <div className="resultsHeader">
              <div>
                <p className="eyebrow">Σκαρίφημα</p>
                <h2>Προεπισκόπηση κουζίνας</h2>
              </div>
            </div>
            <div className="sketchSections">
              {cabinetSketchSections.filter((section) => section.cabinets.length > 0).map((section) => (
                <section className="sketchSection" key={section.id}>
                  <h3>{section.title}</h3>
                  <div className="sketchGrid">
                    {section.cabinets.map((cabinet) => (
                      <CabinetSketch cabinet={cabinet} key={`screen-sketch-${cabinet.id}`} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        </div>

        <section className="printDocument detailedDocument">
          <div className="printTitle">
            <p>Αναλυτική εκτύπωση</p>
            <h2>Λίστα εργαστηρίου</h2>
          </div>
          <div className="printMeta">
            <span><strong>Πελάτης:</strong> {project.customerName || '-'}</span>
            <span><strong>{documentPrintLabel(project.documentType)}</strong> {project.documentCode || '-'}</span>
            <span><strong>Ημερομηνία:</strong> {project.date || '-'}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Κουτί</th>
                <th>Τύπος κουτιού</th>
                <th>Κομμάτι</th>
                <th>Ποσότητα</th>
                <th>Διαστάσεις / PVC</th>
                <th>Υλικό</th>
              </tr>
            </thead>
            <tbody>
              {detailedPieces.map((piece) => (
                <tr className={isFrontPiece(piece) ? 'frontPieceRow' : ''} key={`print-${piece.id}`}>
                  <td>{piece.source}</td>
                  <td>{piece.boxType}</td>
                  <td>{piece.name}</td>
                  <td>{piece.quantity}</td>
                  <td>{piece.dimensions}</td>
                  <td>{piece.material}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="printDocument supplierDocument">
          <div className="supplierHeader">
            <p>Εκτύπωση προμηθευτή</p>
            <div className="supplierMeta">
              <span><strong>Πελάτης:</strong> {project.customerName || '-'}</span>
              <span><strong>{documentPrintLabel(project.documentType)}</strong> {project.documentCode || '-'}</span>
              <span><strong>Ημερομηνία:</strong> {project.date || '-'}</span>
            </div>
          </div>
          {supplierResults.filter((group) => group.pieces.length > 0).map((group) => (
            <section className="supplierGroup" key={`supplier-${group.group}`}>
              <h3>{group.group}</h3>
              <div className="supplierLines">
                {group.pieces.map((piece) => (
                  <p key={piece.id}>
                    <strong>{piece.quantity} τεμ.</strong>
                    <span>{piece.dimensions}</span>
                  </p>
                ))}
              </div>
            </section>
          ))}
          <section className="supplierTotals">
            <h3>Σύνολο κουτιών:</h3>
            <p><strong>Βάσεως:</strong> {cabinetCategoryTotals.base} κουτιά</p>
            <p><strong>Κρεμαστά:</strong> {cabinetCategoryTotals.wall} κουτιά</p>
            <p><strong>Ντουλάπες:</strong> {cabinetCategoryTotals.wardrobe} κουτιά</p>
            <p><strong>Συρταριέρες με κρυφό μηχανισμό:</strong> {cabinetCategoryTotals.wardrobeDrawer} κουτιά</p>
            <p><strong>Συρταριέρες απλές:</strong> {cabinetCategoryTotals.simpleDrawer} κουτιά</p>
            <p><strong>Συρταριέρες εξωτερικές:</strong> {cabinetCategoryTotals.externalDrawer} κουτιά</p>
          </section>
        </section>

        <section className="printDocument sketchDocument">
          <div className="printTitle">
            <p>Σκαρίφημα / Προεπισκόπηση κουζίνας</p>
          </div>
          <div className="printMeta">
            <span><strong>Πελάτης:</strong> {project.customerName || '-'}</span>
            <span><strong>{documentPrintLabel(project.documentType)}</strong> {project.documentCode || '-'}</span>
            <span><strong>Ημερομηνία:</strong> {project.date || '-'}</span>
          </div>
          <div className="sketchPrintSections">
            {cabinetSketchSections.filter((section) => section.cabinets.length > 0).map((section) => (
              <section className="sketchSection" key={`print-sketch-${section.id}`}>
                <h3>{section.title}</h3>
                <div className="sketchGrid">
                  {section.cabinets.map((cabinet) => (
                    <CabinetSketch cabinet={cabinet} key={`print-sketch-cabinet-${cabinet.id}`} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
