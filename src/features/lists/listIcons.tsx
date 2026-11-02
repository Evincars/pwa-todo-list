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

/** Group keys map to `icons.groups.<key>` translations, glyph ids to `icons.glyphs.<id>`. */
export type IconGroupKey = 'everyday' | 'dark' | 'metal' | 'hazard';

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

const glyph = <const Id extends string>(id: Id, icon: TablerIcon) => ({ id, icon });

const GLYPH_GROUPS = [
  {
    key: 'dark',
    items: [
      glyph('skull', IconSkull),
      glyph('pentagram', IconPentagram),
      glyph('coffin', IconCoffin),
      glyph('grave', IconGrave2),
      glyph('bat', IconBat),
      glyph('spider', IconSpiderFilled),
      glyph('ghost', IconGhostFilled),
      glyph('pumpkin', IconPumpkinScary),
      glyph('crystal-ball', IconCrystalBall),
      glyph('moon', IconMoonFilled),
      glyph('eye', IconEyeFilled),
      glyph('candle', IconCandleFilled),
      glyph('sword', IconSword),
      glyph('axe', IconAxe),
    ],
  },
  {
    key: 'metal',
    items: [
      glyph('horns', IconHandLoveYou),
      glyph('electric-guitar', IconElectricGuitar),
      glyph('guitar-pick', IconGuitarPickFilled),
      glyph('vinyl', IconVinyl),
      glyph('flame', IconFlameFilled),
      glyph('bolt', IconBoltFilled),
      glyph('microphone', IconMicrophone2),
      glyph('headphones', IconHeadphonesFilled),
      glyph('crown', IconCrownFilled),
      glyph('swords', IconSwords),
      glyph('piano', IconPiano),
      glyph('music', IconMusic),
    ],
  },
  {
    key: 'hazard',
    items: [
      glyph('radioactive', IconRadioactiveFilled),
      glyph('biohazard', IconBiohazardFilled),
      glyph('bomb', IconBombFilled),
      glyph('virus', IconVirus),
      glyph('flask', IconFlaskFilled),
      glyph('atom', IconAtom),
      glyph('dna', IconDna2),
      glyph('ufo', IconUfo),
      glyph('alien', IconAlien),
      glyph('rocket', IconRocket),
    ],
  },
  {
    key: 'everyday',
    items: [
      glyph('home', IconHome),
      glyph('briefcase', IconBriefcase),
      glyph('cart', IconShoppingCart),
      glyph('book', IconBook),
      glyph('code', IconCode),
      glyph('barbell', IconBarbell),
      glyph('plane', IconPlane),
      glyph('heart', IconHeartFilled),
      glyph('gift', IconGift),
      glyph('bulb', IconBulb),
      glyph('coffee', IconCoffee),
      glyph('paw', IconPaw),
      glyph('leaf', IconLeaf),
      glyph('trophy', IconTrophy),
      glyph('star', IconStarFilled),
      glyph('kitchen', IconToolsKitchen2),
      glyph('tools', IconTools),
      glyph('cash', IconCash),
    ],
  },
] as const satisfies readonly { key: IconGroupKey; items: readonly { id: string; icon: TablerIcon }[] }[];

export type ListGlyphId = (typeof GLYPH_GROUPS)[number]['items'][number]['id'];

const GLYPHS = new Map<string, { id: ListGlyphId; icon: TablerIcon }>(
  GLYPH_GROUPS.flatMap((group) => group.items.map((item) => [item.id, item] as const)),
);

export const EMOJI_GROUPS = [
  { key: 'everyday', items: ['📝', '✅', '🛒', '🏠', '💼', '🎯', '📚', '💪', '✈️', '🎉', '🍳', '💡', '🧹', '🎁', '🌱', '❤️'] },
  { key: 'dark', items: ['🖤', '💀', '☠️', '🦇', '🕷️', '🕸️', '🌑', '⚰️', '🪦', '🔮', '🗡️', '👁️', '🐍', '🩸', '😈', '👹', '🧛', '🐺', '🌋', '🥀'] },
  { key: 'metal', items: ['🤘', '🎸', '🥁', '🎤', '🎧', '🔊', '⛓️', '🔥', '⚡', '🐐', '🪓', '💿', '🎶', '🎹', '🔱', '🏴'] },
  { key: 'hazard', items: ['☢️', '☣️', '⚠️', '🧪', '⚛️', '🧬', '💣', '🚀', '🛸', '👽', '🤖', '💻', '🔬', '🧲', '🌡️', '🛢️'] },
] as const;

export const DEFAULT_LIST_ICON: ListIcon = '📝';

export const glyphIcon = (id: ListGlyphId): ListIcon => `${GLYPH_PREFIX}${id}`;

export type ResolvedListIcon = { kind: 'emoji'; emoji: string } | { kind: 'glyph'; id: ListGlyphId; icon: TablerIcon };

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
