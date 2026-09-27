import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { formatTimeOfDay } from '@/domain/dates';
import type { TimeOfDay } from '@/domain/types';
import { useAppTheme } from '@/theme';

import { ListRow } from './ListGroup';

interface TimeRowProps {
  label: string;
  detail?: string;
  value: TimeOfDay;
  onChange: (time: TimeOfDay) => void;
}

const toDate = ({ hour, minute }: TimeOfDay) => new Date(2000, 0, 1, hour, minute);
const toTime = (date: Date): TimeOfDay => ({ hour: date.getHours(), minute: date.getMinutes() });

/** Settings row for picking a time of day with the platform's native time picker. */
export function TimeRow({ label, detail, value, onChange }: TimeRowProps) {
  const { scheme, colors } = useAppTheme();

  if (Platform.OS === 'ios') {
    return (
      <ListRow
        label={label}
        detail={detail}
        accessory={
          <DateTimePicker
            value={toDate(value)}
            mode="time"
            display="compact"
            themeVariant={scheme}
            accentColor={colors.accent}
            onValueChange={(_event, date) => onChange(toTime(date))}
          />
        }
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <ListRow
        label={label}
        detail={detail}
        value={formatTimeOfDay(value)}
        onPress={() =>
          DateTimePickerAndroid.open({
            value: toDate(value),
            mode: 'time',
            onValueChange: (_event, date) => onChange(toTime(date)),
          })
        }
      />
    );
  }

  return <ListRow label={label} detail={detail} value={formatTimeOfDay(value)} />;
}
