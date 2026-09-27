import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** Everything the app remembers lives on the device; there is no account or backend. */
export const deviceStorage = createJSONStorage(() => AsyncStorage);
