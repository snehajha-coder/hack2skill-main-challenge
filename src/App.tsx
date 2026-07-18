import React, { useState, useEffect } from "react";
import { HabitCurbData, HabitGoal, DailyLog, OnboardingProfile } from "./types";
import OnboardingScreen from "./components/OnboardingScreen";
import DashboardScreen from "./components/DashboardScreen";

const LOCAL_STORAGE_KEY = "HabitCurb_KeepSmiling_Data";

export default function App() {
  const [data, setData] = useState<HabitCurbData | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [appError, setAppError] = useState<string | null>(null);

  // Initialize and check local storage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as HabitCurbData & { lastGoalsResetDate?: string };
        if (parsed && parsed.onboarding && parsed.onboarding.completed) {
          const todayString = new Date().toISOString().split("T")[0];
          if (parsed.lastGoalsResetDate !== todayString) {
            // A new day has started! Reset all daily goals to uncompleted.
            if (parsed.goals && Array.isArray(parsed.goals)) {
              parsed.goals = parsed.goals.map(g => ({ ...g, completed: false }));
            }
            parsed.lastGoalsResetDate = todayString;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
          }
          setData(parsed);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      } else {
        setNeedsOnboarding(true);
      }
    } catch (err) {
      console.error("Failed to load local storage data:", err);
      setNeedsOnboarding(true);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleSubmitOnboarding = async (
    profile: OnboardingProfile,
    onboardingResult: { dailyGoals: { id: string; text: string }[]; outcomeNote: string }
  ) => {
    setIsLoadingData(true);
    try {
      // Create HabitGoal objects with default completed: false
      const formattedGoals: HabitGoal[] = onboardingResult.dailyGoals.map((g) => ({
        id: g.id || `goal_${Math.random().toString(36).substring(2, 11)}`,
        text: g.text,
        completed: false,
      }));

      const newPayload: HabitCurbData = {
        onboarding: profile,
        goals: formattedGoals,
        outcomeNote: onboardingResult.outcomeNote,
        logs: [], // Start fresh logs
      };

      setData(newPayload);
      setNeedsOnboarding(false);

      // Save to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPayload));
    } catch (err: any) {
      console.error("Failed to submit onboarding data:", err);
      setAppError("Failed to save your onboarding goals. Please try again.");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveData = async (updatedGoals: HabitGoal[], updatedLogs: DailyLog[]) => {
    if (!data) return;

    const todayString = new Date().toISOString().split("T")[0];
    const updatedPayload: HabitCurbData & { lastGoalsResetDate?: string } = {
      ...data,
      goals: updatedGoals,
      logs: updatedLogs,
      lastGoalsResetDate: (data as any).lastGoalsResetDate || todayString,
    };

    // Optimistically update local state first
    setData(updatedPayload);

    try {
      // Save content to localStorage
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedPayload));
    } catch (err) {
      console.error("Failed to save updated parameters in localStorage:", err);
      setAppError("Your latest updates couldn't be saved locally.");
    }
  };

  const handleResetProfile = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setData(null);
    setNeedsOnboarding(true);
  };

  // UI Loading State
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="relative flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-bold text-white tracking-wide">Initializing HabitCurb...</h2>
          <p className="text-xs text-slate-500 mt-1">Retrieving your personalized carbon footprint configuration</p>
        </div>
      </div>
    );
  }

  // Route to onboarding if needed
  if (needsOnboarding || !data || !data.onboarding) {
    return (
      <>
        <OnboardingScreen onSubmitOnboarding={handleSubmitOnboarding} />
        {appError && (
          <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto p-4 bg-red-950/90 border border-red-900 rounded-2xl text-xs text-red-300 font-medium text-center z-50 shadow-2xl">
            {appError}
          </div>
        )}
      </>
    );
  }

  // Otherwise show the Dashboard directly
  return (
    <>
      <DashboardScreen
        userEmail={data.onboarding.name || "Eco Friend"}
        onboardingData={data.onboarding}
        goals={data.goals}
        outcomeNote={data.outcomeNote}
        logs={data.logs}
        onLogout={handleResetProfile} // Maps to reset profile to restart the app
        onSaveData={handleSaveData}
      />
      {appError && (
        <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto p-4 bg-red-950/90 border border-red-900 rounded-2xl text-xs text-red-300 font-medium text-center z-50 shadow-2xl">
          {appError}
        </div>
      )}
    </>
  );
}
