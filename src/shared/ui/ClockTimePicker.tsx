import { UnstyledButton } from '@mantine/core';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from '@/i18n';
import classes from './ClockTimePicker.module.css';

export type ClockMode = 'hours' | 'minutes';

export interface ClockTimePickerProps {
  /** `HH:mm` (24-hour). */
  value: string;
  onChange: (value: string) => void;
  format?: '12h' | '24h';
  /** Minute snapping for taps and drags (keyboard always moves by this step). */
  minuteStep?: number;
  /** Dial diameter in px. */
  size?: number;
}

const pad = (value: number) => String(value).padStart(2, '0');

const parse = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  return { hours: Number.isFinite(hours) ? hours % 24 : 0, minutes: Number.isFinite(minutes) ? minutes % 60 : 0 };
};

const polar = (center: number, radius: number, angleDeg: number) => {
  const radians = (angleDeg * Math.PI) / 180;
  return { left: center + radius * Math.sin(radians), top: center - radius * Math.cos(radians) };
};

const HOUR_POSITIONS = Array.from({ length: 12 }, (_, index) => index);

/**
 * Material / Microsoft To Do style analog time picker: tap or drag on the dial,
 * hours first (inner ring = 13–00 in 24-hour mode), then it jumps to minutes.
 */
export const ClockTimePicker = ({ value, onChange, format = '24h', minuteStep = 5, size = 248 }: ClockTimePickerProps) => {
  const { t } = useTranslation();
  const { hours, minutes } = parse(value);
  const [mode, setMode] = useState<ClockMode>('hours');
  const dialRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const is12h = format === '12h';
  const isPm = hours >= 12;
  const center = size / 2;
  const outerRadius = center - 24;
  const innerRadius = center - 60;

  const emit = (nextHours: number, nextMinutes: number) => {
    const next = `${pad(((nextHours % 24) + 24) % 24)}:${pad(((nextMinutes % 60) + 60) % 60)}`;
    if (next !== value) onChange(next);
  };

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = dialRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const angle = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    const scale = rect.width / size;

    if (mode === 'hours') {
      const index = Math.round(angle / 30) % 12;
      if (is12h) emit((index === 0 ? 0 : index) + (isPm ? 12 : 0), minutes);
      else {
        const inner = Math.hypot(dx, dy) / scale < (outerRadius + innerRadius) / 2;
        emit(inner ? (index === 0 ? 0 : index + 12) : index === 0 ? 12 : index, minutes);
      }
    } else {
      const raw = Math.round(angle / 6);
      emit(hours, (Math.round(raw / minuteStep) * minuteStep) % 60);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    fromPointer(event);
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => dragging.current && fromPointer(event);
  const handlePointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (mode === 'hours') setMode('minutes');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key];
    if (delta) {
      event.preventDefault();
      if (mode === 'hours') emit(hours + delta, minutes);
      else emit(hours, minutes + delta * minuteStep);
    } else if (event.key === 'Enter' && mode === 'hours') {
      event.preventDefault();
      setMode('minutes');
    }
  };

  // Selected position on the dial.
  const selectedInner = mode === 'hours' && !is12h && (hours === 0 || hours > 12);
  const handAngle = mode === 'hours' ? (hours % 12) * 30 : minutes * 6;
  const handLength = selectedInner ? innerRadius : outerRadius;
  const displayHours = is12h ? hours % 12 || 12 : hours;

  const renderNumber = (label: string, angle: number, radius: number, selected: boolean, inner = false) => (
    <span
      key={`${radius}-${label}`}
      className={classes.number}
      data-selected={selected || undefined}
      data-inner={inner || undefined}
      style={polar(center, radius, angle)}
    >
      {label}
    </span>
  );

  return (
    <div className={classes.root}>
      <div className={classes.display}>
        <UnstyledButton
          className={classes.segment}
          data-active={mode === 'hours' || undefined}
          onClick={() => setMode('hours')}
          aria-label={t('ui.clock.selectHours')}
        >
          {is12h ? displayHours : pad(displayHours)}
        </UnstyledButton>
        <span className={classes.colon}>:</span>
        <UnstyledButton
          className={classes.segment}
          data-active={mode === 'minutes' || undefined}
          onClick={() => setMode('minutes')}
          aria-label={t('ui.clock.selectMinutes')}
        >
          {pad(minutes)}
        </UnstyledButton>
        {is12h && (
          <div className={classes.period}>
            <UnstyledButton data-active={!isPm || undefined} onClick={() => isPm && emit(hours - 12, minutes)}>
              {t('ui.clock.am')}
            </UnstyledButton>
            <UnstyledButton data-active={isPm || undefined} onClick={() => !isPm && emit(hours + 12, minutes)}>
              {t('ui.clock.pm')}
            </UnstyledButton>
          </div>
        )}
      </div>

      <div
        ref={dialRef}
        className={classes.dial}
        style={{ width: size, height: size }}
        role="slider"
        tabIndex={0}
        aria-label={mode === 'hours' ? t('ui.clock.hours') : t('ui.clock.minutes')}
        aria-valuemin={0}
        aria-valuemax={mode === 'hours' ? 23 : 59}
        aria-valuenow={mode === 'hours' ? hours : minutes}
        aria-valuetext={`${pad(hours)}:${pad(minutes)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className={classes.hand} style={{ height: handLength, transform: `translateX(-50%) rotate(${handAngle}deg)` }}>
          <span className={classes.knob} data-dot={(mode === 'minutes' && minutes % 5 !== 0) || undefined} />
        </div>
        <span className={classes.center} />

        {mode === 'hours'
          ? HOUR_POSITIONS.flatMap((index) => {
              const outerHour = index === 0 ? 12 : index;
              const outerSelected = is12h ? hours % 12 === index : !selectedInner && hours === outerHour;
              const numbers = [renderNumber(String(outerHour), index * 30, outerRadius, outerSelected)];
              if (!is12h) {
                const innerHour = index === 0 ? 0 : index + 12;
                numbers.push(renderNumber(pad(innerHour), index * 30, innerRadius, hours === innerHour, true));
              }
              return numbers;
            })
          : HOUR_POSITIONS.map((index) => renderNumber(pad(index * 5), index * 30, outerRadius, minutes === index * 5))}
      </div>
    </div>
  );
};
