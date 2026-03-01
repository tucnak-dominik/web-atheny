import type { PackingItem } from '../lib/types';

export const packingItems = [
  // Doklady
  { item: 'Cestovní pas', category: 'Doklady', packed: false, notes: 'Platnost alespoň 6 měsíců' },
  { item: 'Průkaz pojišťovny (EHIC)', category: 'Doklady', packed: false, notes: '' },
  { item: 'Letenky + jízdenky na vlak (vytištěné / v mobilu)', category: 'Doklady', packed: false, notes: '' },
  { item: 'Rezervace hotelu', category: 'Doklady', packed: false, notes: '' },
  { item: 'Vstupenky Akropolis', category: 'Doklady', packed: false, notes: 'odysseus.culture.gr' },

  // Elektronika
  { item: 'Telefon + nabíječka', category: 'Elektronika', packed: false, notes: '' },
  { item: 'Power banka', category: 'Elektronika', packed: false, notes: '' },
  { item: 'Sluchátka', category: 'Elektronika', packed: false, notes: '' },
  { item: 'Fotoaparát', category: 'Elektronika', packed: false, notes: '' },
  { item: 'Redukce zástrčky (typ F / Schuko)', category: 'Elektronika', packed: false, notes: 'Řecko: 230V / 50Hz, zástrčka F' },

  // Oblečení
  { item: 'Tričká (4×)', category: 'Oblečení', packed: false, notes: '' },
  { item: 'Kalhoty / kraťasy (2×)', category: 'Oblečení', packed: false, notes: '' },
  { item: 'Společenské oblečení (1×)', category: 'Oblečení', packed: false, notes: 'Michelinská restaurace den 3' },
  { item: 'Plavky', category: 'Oblečení', packed: false, notes: '' },
  { item: 'Pohodlné boty na chůzi', category: 'Oblečení', packed: false, notes: 'Dlažba na Akropoli — ne podpatky' },
  { item: 'Sandály', category: 'Oblečení', packed: false, notes: '' },
  { item: 'Lehká bunda / mikina', category: 'Oblečení', packed: false, notes: 'Večery mohou být chladnější' },
  { item: 'Šátek / šál (pro vstup do kostelů)', category: 'Oblečení', packed: false, notes: '' },

  // Hygiena & zdraví
  { item: 'Opalovací krém (SPF 50+)', category: 'Zdraví', packed: false, notes: '' },
  { item: 'Repelent', category: 'Zdraví', packed: false, notes: '' },
  { item: 'Léky na průjem', category: 'Zdraví', packed: false, notes: '' },
  { item: 'Ibalgin / Paralen', category: 'Zdraví', packed: false, notes: '' },
  { item: 'Náplasti', category: 'Zdraví', packed: false, notes: '' },
  { item: 'Sluneční brýle', category: 'Zdraví', packed: false, notes: '' },
  { item: 'Toaletní taška', category: 'Zdraví', packed: false, notes: '' },

  // Finance
  { item: 'Hotovost (€)', category: 'Finance', packed: false, notes: 'Doporučeno ~150 € v hotovosti' },
  { item: 'Platební karta (bez poplatků v zahraničí)', category: 'Finance', packed: false, notes: '' },
] as const satisfies PackingItem[];
