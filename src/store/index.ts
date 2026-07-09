import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee' | 'manager';
  status: 'active' | 'inactive';
}

export interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

export interface AttendanceRecord {
  id: string;
  personName: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
}

export interface AttendanceStore {
  records: AttendanceRecord[];
  stats: any | null;
  setRecords: (records: AttendanceRecord[]) => void;
  setStats: (stats: any) => void;
  addRecord: (record: AttendanceRecord) => void;
  updateRecord: (id: string, record: Partial<AttendanceRecord>) => void;
  clear: () => void;
}

export const useAttendanceStore = create<AttendanceStore>((set) => ({
  records: [],
  stats: null,
  setRecords: (records) => set({ records }),
  setStats: (stats) => set({ stats }),
  addRecord: (record) =>
    set((state) => ({
      records: [record, ...state.records],
    })),
  updateRecord: (id, updates) =>
    set((state) => ({
      records: state.records.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      ),
    })),
  clear: () => set({ records: [], stats: null }),
}));

export interface UIStore {
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  toggleDarkMode: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (message: string | null) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDarkMode: false,
      isLoading: false,
      error: null,
      success: null,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setSuccess: (success) => set({ success }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    },
  ),
);
