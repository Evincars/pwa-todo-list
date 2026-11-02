import { Button, Group, Stack, Switch, Text } from '@mantine/core';
import { DatePicker, TimeGrid, TimePicker } from '@mantine/dates';
import dayjs from 'dayjs';
import { useState } from 'react';
import { combineDateTime, TIME_PRESETS, type DueValue } from '@/lib/dates';
import { useSettingsStore } from '@/features/settings/settingsStore';

export interface DateTimeSelectorProps {
  value: DueValue;
  onSubmit: (value: DueValue) => void;
  onCancel: () => void;
}

/** Calendar + time chips + precise time input ("Pick a date & time" step). */
export const DateTimeSelector = ({ value, onSubmit, onCancel }: DateTimeSelectorProps) => {
  const timeFormat = useSettingsStore((state) => state.timeFormat);
  const initial = value.dueAt ? dayjs(value.dueAt) : dayjs().add(1, 'day');
  const [date, setDate] = useState<string>(initial.format('YYYY-MM-DD'));
  const [withTime, setWithTime] = useState(value.dueHasTime || !value.dueAt);
  const [time, setTime] = useState<string>(value.dueHasTime ? initial.format('HH:mm') : '09:00');

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

      <Switch label="Set time" checked={withTime} onChange={(event) => setWithTime(event.currentTarget.checked)} />

      {withTime && (
        <Stack gap="xs">
          <TimeGrid
            data={[...TIME_PRESETS]}
            value={TIME_PRESETS.includes(time as (typeof TIME_PRESETS)[number]) ? time : null}
            onChange={(next) => next && setTime(next.slice(0, 5))}
            format={timeFormat}
            simpleGridProps={{ cols: 3, spacing: 6 }}
            size="xs"
          />
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" c="dimmed">
              Custom
            </Text>
            <TimePicker
              value={time}
              onChange={(next) => next && setTime(next.slice(0, 5))}
              format={timeFormat}
              withDropdown
              minutesStep={5}
              size="sm"
              style={{ flex: 1 }}
              aria-label="Custom time"
            />
          </Group>
        </Stack>
      )}

      <Group justify="flex-end" gap="xs" mt="xs">
        <Button variant="default" onClick={onCancel}>
          Back
        </Button>
        <Button onClick={() => onSubmit(combineDateTime(date, withTime ? time : null))}>Save</Button>
      </Group>
    </Stack>
  );
};
