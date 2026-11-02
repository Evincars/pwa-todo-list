import { highlightSegments } from '@/lib/fuzzy';
import classes from './HighlightedText.module.css';

export interface HighlightedTextProps {
  text: string;
  /** UTF-16 indices of characters to highlight (e.g. from `fuzzyMatch`). */
  indices?: readonly number[];
}

/** Text with matched characters marked in the theme's primary color. */
export const HighlightedText = ({ text, indices }: HighlightedTextProps) => {
  if (!indices?.length) return <>{text}</>;
  return (
    <>
      {highlightSegments(text, indices).map((segment, index) =>
        segment.match ? (
          <mark key={index} className={classes.mark}>
            {segment.text}
          </mark>
        ) : (
          segment.text
        ),
      )}
    </>
  );
};
