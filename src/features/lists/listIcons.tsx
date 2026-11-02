import {
  createReactComponent,
  IconAlien,
  IconAtom,
  IconAxe,
  IconBarbell,
  IconBat,
  IconBiohazardFilled,
  IconBoltFilled,
  IconBombFilled,
  IconBook,
  IconBriefcase,
  IconBulb,
  IconCandleFilled,
  IconCash,
  IconCode,
  IconCoffee,
  IconCoffin,
  IconCrownFilled,
  IconCrystalBall,
  IconDna2,
  IconEyeFilled,
  IconFlameFilled,
  IconFlaskFilled,
  IconGhostFilled,
  IconGift,
  IconGrave2,
  IconGuitarPickFilled,
  IconHandLoveYou,
  IconHeadphonesFilled,
  IconHeartFilled,
  IconHome,
  IconLeaf,
  IconMicrophone2,
  IconMoonFilled,
  IconMusic,
  IconPaw,
  IconPentagram,
  IconPiano,
  IconPlane,
  IconPumpkinScary,
  IconRadioactiveFilled,
  IconRocket,
  IconShoppingCart,
  IconSkull,
  IconSpiderFilled,
  IconStarFilled,
  IconSword,
  IconSwords,
  IconTools,
  IconToolsKitchen2,
  IconTrophy,
  IconUfo,
  IconVinyl,
  IconVirus,
  type TablerIcon,
} from '@tabler/icons-react';
import type { ListColor, ListIcon } from '@/domain/types';

/** Tabler has no electric guitar – drawn in the same 24px / 2px-stroke style. */
const IconElectricGuitar = createReactComponent('outline', 'electric-guitar', 'ElectricGuitar', [
  ['path', { d: 'M17.5 4.5l2 -2l2 2l-2 2z', key: 'head' }],
  ['path', { d: 'M18.5 5.5l-7 7', key: 'neck' }],
  [
    'path',
    {
      d: 'M12.5 11.5c-1.2 -1.5 -3.3 -1.4 -4.2 .2c-.5 .9 -1.4 1.2 -2.3 1.4c-2.6 .6 -3.4 3.9 -1.4 5.9s5.3 1.2 5.9 -1.4c.2 -.9 .5 -1.8 1.4 -2.3c1.6 -.9 1.7 -3 .6 -3.8z',
      key: 'body',
    },
  ],
  ['path', { d: 'M7 15.5l1.5 1.5', key: 'pickup' }],
]);

const GLYPH_PREFIX = 'glyph:';

const glyph = <const Id extends string>(id: Id, label: string, icon: TablerIcon) => ({ id, label, icon });

const GLYPH_GROUPS = [
  {
    label: 'Dark',
    items: [
      glyph('skull', 'Skull', IconSkull),
      glyph('pentagram', 'Pentagram', IconPentagram),
      glyph('coffin', 'Coffin', IconCoffin),
      glyph('grave', 'Grave', IconGrave2),
      glyph('bat', 'Bat', IconBat),
      glyph('spider', 'Spider', IconSpiderFilled),
      glyph('ghost', 'Ghost', IconGhostFilled),
      glyph('pumpkin', 'Scary pumpkin', IconPumpkinScary),
      glyph('crystal-ball', 'Crystal ball', IconCrystalBall),
      glyph('moon', 'Moon', IconMoonFilled),
      glyph('eye', 'Eye', IconEyeFilled),
      glyph('candle', 'Candle', IconCandleFilled),
      glyph('sword', 'Sword', IconSword),
      glyph('axe', 'Axe', IconAxe),
    ],
  },
  {
    label: 'Metal & music',
    items: [
      glyph('horns', 'Horns up', IconHandLoveYou),
      glyph('electric-guitar', 'Electric guitar', IconElectricGuitar),
      glyph('guitar-pick', 'Guitar pick', IconGuitarPickFilled),
      glyph('vinyl', 'Vinyl', IconVinyl),
      glyph('flame', 'Flame', IconFlameFilled),
      glyph('bolt', 'Lightning', IconBoltFilled),
      glyph('microphone', 'Microphone', IconMicrophone2),
      glyph('headphones', 'Headphones', IconHeadphonesFilled),
      glyph('crown', 'Crown', IconCrownFilled),
      glyph('swords', 'Crossed swords', IconSwords),
      glyph('piano', 'Piano', IconPiano),
      glyph('music', 'Music', IconMusic),
    ],
  },
  {
    label: 'Hazard & science',
    items: [
      glyph('radioactive', 'Radioactive', IconRadioactiveFilled),
      glyph('biohazard', 'Biohazard', IconBiohazardFilled),
      glyph('bomb', 'Bomb', IconBombFilled),
      glyph('virus', 'Virus', IconVirus),
      glyph('flask', 'Flask', IconFlaskFilled),
      glyph('atom', 'Atom', IconAtom),
      glyph('dna', 'DNA', IconDna2),
      glyph('ufo', 'UFO', IconUfo),
      glyph('alien', 'Alien', IconAlien),
      glyph('rocket', 'Rocket', IconRocket),
    ],
  },
  {
    label: 'Everyday',
    items: [
      glyph('home', 'Home', IconHome),
      glyph('briefcase', 'Work', IconBriefcase),
      glyph('cart', 'Shopping', IconShoppingCart),
      glyph('book', 'Book', IconBook),
      glyph('code', 'Code', IconCode),
      glyph('barbell', 'Workout', IconBarbell),
      glyph('plane', 'Travel', IconPlane),
      glyph('heart', 'Heart', IconHeartFilled),
      glyph('gift', 'Gift', IconGift),
      glyph('bulb', 'Idea', IconBulb),
      glyph('coffee', 'Coffee', IconCoffee),
      glyph('paw', 'Pets', IconPaw),
      glyph('leaf', 'Garden', IconLeaf),
      glyph('trophy', 'Goal', IconTrophy),
      glyph('star', 'Star', IconStarFilled),
      glyph('kitchen', 'Cooking', IconToolsKitchen2),
      glyph('tools', 'Repairs', IconTools),
      glyph('cash', 'Money', IconCash),
    ],
  },
] as const;

export type ListGlyphId = (typeof GLYPH_GROUPS)[number]['items'][number]['id'];

const GLYPHS = new Map<string, { label: string; icon: TablerIcon }>(
  GLYPH_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item] as const)),
);

export const EMOJI_GROUPS = [
  { label: 'Everyday', items: ['📝', '✅', '🛒', '🏠', '💼', '🎯', '📚', '💪', '✈️', '🎉', '🍳', '💡', '🧹', '🎁', '🌱', '❤️'] },
  { label: 'Dark', items: ['🖤', '💀', '☠️', '🦇', '🕷️', '🕸️', '🌑', '⚰️', '🪦', '🔮', '🗡️', '👁️', '🐍', '🩸', '😈', '👹', '🧛', '🐺', '🌋', '🥀'] },
  { label: 'Metal & music', items: ['🤘', '🎸', '🥁', '🎤', '🎧', '🔊', '⛓️', '🔥', '⚡', '🐐', '🪓', '💿', '🎶', '🎹', '🔱', '🏴'] },
  { label: 'Hazard & science', items: ['☢️', '☣️', '⚠️', '🧪', '⚛️', '🧬', '💣', '🚀', '🛸', '👽', '🤖', '💻', '🔬', '🧲', '🌡️', '🛢️'] },
] as const;

export const DEFAULT_LIST_ICON: ListIcon = '📝';

export const glyphIcon = (id: ListGlyphId): ListIcon => `${GLYPH_PREFIX}${id}`;

export type ResolvedListIcon = { kind: 'emoji'; emoji: string } | { kind: 'glyph'; label: string; icon: TablerIcon };

/** Unknown glyphs (e.g. written by a newer app version) fall back to the default emoji. */
export const resolveListIcon = (icon: ListIcon): ResolvedListIcon => {
  if (!icon.startsWith(GLYPH_PREFIX)) return { kind: 'emoji', emoji: icon || DEFAULT_LIST_ICON };
  const entry = GLYPHS.get(icon.slice(GLYPH_PREFIX.length));
  return entry ? { kind: 'glyph', ...entry } : { kind: 'emoji', emoji: DEFAULT_LIST_ICON };
};

export const isGlyphIcon = (icon: ListIcon) => icon.startsWith(GLYPH_PREFIX);

export const listColorVar = (color: ListColor | undefined) =>
  color ? `var(--mantine-color-${color}-filled)` : 'var(--mantine-primary-color-filled)';

export { GLYPH_GROUPS };
