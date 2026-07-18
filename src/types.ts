export interface HabitGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface OnboardingProfile {
  name: string;
  profession: string;
  dietType: string;
  habits: string[];
  nativeState: string;
  currentState: string;
  otherComments: string;
  completed: boolean;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  screenHours: number;
  sleepHours: number;
  habitSlips: string[];
  notes?: string;
}

export interface HabitCurbData {
  onboarding: OnboardingProfile | null;
  goals: HabitGoal[];
  outcomeNote: string;
  logs: DailyLog[];
}
