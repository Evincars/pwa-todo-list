import { Button, Group, Stack, Switch, Text } from '@mantine/core';
import { DatePicker, TimeGrid } from '@mantine/dates';
import { IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';
import { formatTime, TIME_PRESETS } from '@/lib/dates';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { ClockTimePicker } from '@/shared/ui';

export interface DateTimeSelection {
  /** `YYYY-MM-DD` */
  date: string;
  /** `HH:mm`, `null` for all-day. */
  time: string | null;
}

export interface DateTimeSelectorProps {
  initial: DateTimeSelection;
  /** Lets the user switch the time off (all-day due dates). Reminders always need a time. */
  timeOptional?: boolean;
  /** Returns an error message to block saving. */
  validate?: (selection: DateTimeSelection) => string | null;
  onSubmit: (selection: DateTimeSelection) => void;
  onCancel: () => void;
}

/** "Pick a date & time" step: calendar + common times, "Other time…" opens the clock dial. */
export const DateTimeSelector = ({ initial, timeOptional = false, validate, onSubmit, onCancel }: DateTimeSelectorProps) => {
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const [date, setDate] = useState(initial.date);
  const [withTime, setWithTime] = useState(!timeOptional || initial.time !== null);
  const [time, setTime] = useState(initial.time ?? '09:00');
  const [step, setStep] = useState<'date' | 'clock'>('date');

  const selection: DateTimeSelection = { date, time: withTime ? time : null };
  const error = validate?.(selection) ?? null;
  const isPreset = TIME_PRESETS.includes(time as (typeof TIME_PRESETS)[number]);
  const timeLabel = formatTime(dayjs(`2000-01-01T${time}`), timeFormat);

  if (step === 'clock') {
    return (
      <Stack gap="md">
        <ClockTimePicker value={time} onChange={setTime} format={timeFormat} />
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={() => setStep('date')}>
            Back
          </Button>
          <Button
            onClick={() => {
              setWithTime(true);
              setStep('date');
            }}
          >
            Set {timeLabel}
          </Button>
        </Group>
      </Stack>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="center">
        <DatePicker
          value={date}
          onChange={(next) => next && setDate(next)}
          minDate={dayjs().format('YYYY-MM-DD')}
          size="sm"
          highlightToday
        />
      </Group>

      {timeOptional && <Switch label="Set time" checked={withTime} onChange={(event) => setWithTime(event.currentTarget.checked)} />}

      {withTime && (
        <Stack gap="xs">
          <TimeGrid
            data={[...TIME_PRESETS]}
            value={isPreset ? time : null}
            onChange={(next) => next && setTime(next.slice(0, 5))}
            format={timeFormat}
            simpleGridProps={{ cols: 3, spacing: 6 }}
            size="xs"
          />
          <Button
            variant={isPreset ? 'default' : 'light'}
            size="xs"
            leftSection={<IconClock size={14} />}
            onClick={() => setStep('clock')}
          >
            {isPreset ? 'Other time…' : `Time: ${timeLabel}`}
          </Button>
        </Stack>
      )}

      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}

      <Group justify="flex-end" gap="xs" mt="xs">
        <Button variant="default" onClick={onCancel}>
          Back
        </Button>
        <Button disabled={!!error} onClick={() => onSubmit(selection)}>
          Save
        </Button>
      </Group>
    </Stack>
  );
};
