import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  LogOut,
  Calendar,
  Tv,
  Moon,
  Frown,
  CheckCircle,
  PlusCircle,
  AlertCircle,
  Clock,
  CheckSquare,
  Coffee,
  HelpCircle,
  User,
  MapPin,
  Utensils,
  MessageSquare,
  Send,
  RefreshCw,
  Award,
  Activity
} from "lucide-react";
import { HabitGoal, DailyLog, HabitCurbData, OnboardingProfile } from "../types";
import CustomChart from "./CustomChart";

interface DashboardScreenProps {
  userEmail: string;
  onboardingData: OnboardingProfile;
  goals: HabitGoal[];
  outcomeNote: string;
  logs: DailyLog[];
  onLogout: () => void;
  onSaveData: (updatedGoals: HabitGoal[], updatedLogs: DailyLog[]) => Promise<void>;
}

export default function DashboardScreen({
  userEmail,
  onboardingData,
  goals,
  outcomeNote,
  logs,
  onLogout,
  onSaveData,
}: DashboardScreenProps) {
  // Tab Switching state
  const [activeTab, setActiveTab] = useState<"log" | "chat">("log");

  // State for AI Coach Chat Room
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content: `Namaste! I'm your HabitCurb AI Companion. Based on your profile as a ${onboardingData.profession} from ${onboardingData.nativeState} currently in ${onboardingData.currentState}, I am here to support you in reducing your carbon footprint, overcoming bad habits, and finding local, sustainable wellness alternatives. How can I help you today?`
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // State for adding a log
  const [screenHours, setScreenHours] = useState<number>(8.5);
  const [sleepHours, setSleepHours] = useState<number>(6);
  const [selectedSlips, setSelectedSlips] = useState<string[]>([]);
  const [logNotes, setLogNotes] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  // Intelligent Nudge state
  const [nudgeText, setNudgeText] = useState<string>("");
  const [isLoadingNudge, setIsLoadingNudge] = useState(false);

  // Interactive goals state
  const [currentGoals, setCurrentGoals] = useState<HabitGoal[]>(goals);

  // Synchronize state with goals prop on changes
  useEffect(() => {
    setCurrentGoals(goals);
  }, [goals]);

  // Load today's log if it exists, or set baselines
  useEffect(() => {
    const todayString = new Date().toISOString().split("T")[0];
    const todaysLog = logs.find((l) => l.date === todayString);
    if (todaysLog) {
      setScreenHours(todaysLog.screenHours);
      setSleepHours(todaysLog.sleepHours);
      setSelectedSlips(todaysLog.habitSlips || []);
      setLogNotes(todaysLog.notes || "");
    } else {
      // Set baseline suboptimal values so user is motivated to log and improve
      setScreenHours(8.5);
      setSleepHours(6);
      setSelectedSlips([]);
      setLogNotes("");
    }
  }, [logs]);

  // Available slip pills matching all habits
  const availableSlips = [
    { id: "midnight_scrolling", label: "Midnight Scrolling" },
    { id: "late_night_junk", label: "Late Night Junk Food" },
    { id: "sugary_tea", label: "Sugary Tea Overdose" },
    { id: "stayed_up_late", label: "Stayed Up Past 12" },
    { id: "tobacco_slip", label: "Tobacco Slip" },
    { id: "desk_sitting", label: "Desk Couch Potato Slip" },
  ];

  // Fetch initial Nudge on mount or when logs change
  useEffect(() => {
    fetchIntelligentNudge();
  }, []);

  const fetchIntelligentNudge = async (customRecentSlip?: string) => {
    setIsLoadingNudge(true);
    try {
      // Find the last slip or default
      const lastLog = logs[logs.length - 1];
      const slipToSend = customRecentSlip || 
        (lastLog && lastLog.habitSlips && lastLog.habitSlips.length > 0
          ? lastLog.habitSlips.join(", ")
          : "None");

      const screenHoursToSend = lastLog ? lastLog.screenHours : 8.5;
      const sleepHoursToSend = lastLog ? lastLog.sleepHours : 6;

      const response = await fetch("/api/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentSlip: slipToSend,
          screenHours: screenHoursToSend,
          sleepHours: sleepHoursToSend,
          currentState: onboardingData.currentState,
          dietType: onboardingData.dietType,
          profession: onboardingData.profession,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNudgeText(data.nudge || "Keep moving forward! Consistency is the key to breaking negative behavioral patterns.");
      } else {
        setNudgeText("Let's focus on staying consistent today. Swap processed snacks with local foods like roasted Makhana (fox nuts) for sustainable energy.");
      }
    } catch (error) {
      console.error("Error fetching intelligent nudge:", error);
      setNudgeText("Curb cravings naturally with roasted chickpeas (Chana) or regional herbal tea instead of scrolling tonight.");
    } finally {
      setIsLoadingNudge(false);
    }
  };

  const handleSlipToggle = (slipLabel: string) => {
    if (selectedSlips.includes(slipLabel)) {
      setSelectedSlips(selectedSlips.filter((s) => s !== slipLabel));
    } else {
      setSelectedSlips([...selectedSlips, slipLabel]);
    }
  };

  const handleGoalToggle = async (goalId: string) => {
    // Optimistic UI update
    const updatedGoals = currentGoals.map((g) =>
      g.id === goalId ? { ...g, completed: !g.completed } : g
    );
    setCurrentGoals(updatedGoals);

    // Save back to local storage
    try {
      await onSaveData(updatedGoals, logs);
    } catch (err) {
      console.error("Failed to save checked goals:", err);
    }
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    setLogSuccess(false);

    const todayString = new Date().toISOString().split("T")[0];

    const newLog: DailyLog = {
      date: todayString,
      screenHours,
      sleepHours,
      habitSlips: selectedSlips,
      notes: logNotes.trim() || undefined,
    };

    // Filter logs to replace today's log if it already exists, or append
    const cleanedLogs = logs.filter((l) => l.date !== todayString);
    const updatedLogs = [...cleanedLogs, newLog];

    try {
      // Save updated parameters locally
      await onSaveData(currentGoals, updatedLogs);
      
      setLogSuccess(true);
      setLogNotes("");

      // Trigger automatic GenAI nudge analysis based on new log
      const primarySlip = selectedSlips.length > 0 ? selectedSlips.join(", ") : "None";
      await fetchIntelligentNudge(primarySlip);

      setTimeout(() => {
        setLogSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Log submission failed:", err);
      alert("Failed to save today's logging parameters. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMessage = { role: "user" as const, content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          onboarding: onboardingData,
          goals: currentGoals,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setChatMessages([...updatedMessages, { role: "assistant", content: result.text }]);
      } else {
        setChatMessages([...updatedMessages, { role: "assistant", content: "I'm sorry, I am having trouble connecting to my cognitive hub right now. Keep smiling and remember your goal to curb bad habits!" }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages([...updatedMessages, { role: "assistant", content: "Oops, I encountered a network error. Please try again shortly!" }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const computeTargets = () => {
    const list = [];
    const todayString = new Date().toISOString().split("T")[0];
    const isTodayLogged = logs.some((l) => l.date === todayString);
    
    // 1. Screen Time Target
    const isScreenTargetMet = screenHours <= 6;
    const hasScreenHabit = onboardingData.habits.some((h) => h.toLowerCase().includes("screen") || h.toLowerCase().includes("screentime"));
    list.push({
      id: "screen",
      name: "Screen Time Limit",
      status: !isTodayLogged ? "warning" : (isScreenTargetMet ? "achieved" : "warning"),
      criteria: "Limit screen time under 6 hours",
      current: !isTodayLogged ? "Pending Log" : `${screenHours} hrs`,
      isCore: hasScreenHabit,
      feedback: !isTodayLogged
        ? "📝 Log today's screen hours to check target status."
        : isScreenTargetMet 
        ? "🎯 Screen target met! You avoided toxic screen emission & digital fatigue. Keep Smiling!"
        : "⚠️ Screen time exceeded! Shut down devices and take a posture break."
    });

    // 2. Restful Sleep Target
    const isSleepTargetMet = sleepHours >= 7;
    const hasSleepHabit = onboardingData.habits.some((h) => h.toLowerCase().includes("sleep"));
    list.push({
      id: "sleep",
      name: "Restful Sleep Target",
      status: !isTodayLogged ? "warning" : (isSleepTargetMet ? "achieved" : "warning"),
      criteria: "Sleep at least 7.0 hours",
      current: !isTodayLogged ? "Pending Log" : `${sleepHours} hrs`,
      isCore: hasSleepHabit,
      feedback: !isTodayLogged
        ? "🌙 Log today's sleep hours to see recovery status."
        : isSleepTargetMet
        ? "🌙 Deep sleep target met! High cellular repair is active."
        : "⚠️ Sleep deprivation! Turn off screens by 10:30 PM for melatonin release."
    });

    // 3. Junk Food Target
    const hasJunkSlip = selectedSlips.includes("Late Night Junk Food");
    const isJunkTargetMet = !hasJunkSlip;
    const hasJunkHabit = onboardingData.habits.some((h) => h.toLowerCase().includes("junk") || h.toLowerCase().includes("food"));
    list.push({
      id: "junk",
      name: "Clean Eating Target",
      status: !isTodayLogged ? "warning" : (isJunkTargetMet ? "achieved" : "warning"),
      criteria: "Avoid processed & oily junk food",
      current: !isTodayLogged ? "Pending Log" : (isJunkTargetMet ? "No Slips" : "Slip Logged"),
      isCore: hasJunkHabit,
      feedback: !isTodayLogged
        ? "🍏 Log today's diet to verify clean eating."
        : isJunkTargetMet
        ? "🍏 Clean eating met! You skipped junk foods. Try roasting some local Makhana (fox nuts)!"
        : "⚠️ Junk food slip logged! Avoid ordering greasy fast food or eating late night snacks."
    });

    // 4. Sugar & Caffeine Target
    const hasSugarSlip = selectedSlips.includes("Sugary Tea Overdose");
    const isSugarTargetMet = !hasSugarSlip;
    const hasSugarHabit = onboardingData.habits.some((h) => h.toLowerCase().includes("sugar") || h.toLowerCase().includes("tea"));
    list.push({
      id: "sugar",
      name: "Sugar & Caffeine Limit",
      status: !isTodayLogged ? "warning" : (isSugarTargetMet ? "achieved" : "warning"),
      criteria: "Limit high-sugar tea, coffee or energy drinks",
      current: !isTodayLogged ? "Pending Log" : (isSugarTargetMet ? "No Slips" : "Slip Logged"),
      isCore: hasSugarHabit,
      feedback: !isTodayLogged
        ? "☕ Log today's caffeine or sugary beverage intake."
        : isSugarTargetMet
        ? "☕ Stable sugar levels! Avoided crashing. Try local turmeric water or ginger buttermilk."
        : "⚠️ Overdose warning! Excess sugar/caffeine harms gut lining. Drink warm plain water."
    });

    // 5. Tobacco Target
    const hasTobaccoSlip = selectedSlips.includes("Tobacco Slip");
    const isTobaccoTargetMet = !hasTobaccoSlip;
    const hasTobaccoHabit = onboardingData.habits.some((h) => h.toLowerCase().includes("tobacco") || h.toLowerCase().includes("smoking"));
    list.push({
      id: "tobacco",
      name: "Tobacco-Free Living",
      status: !isTodayLogged ? "warning" : (isTobaccoTargetMet ? "achieved" : "warning"),
      criteria: "Zero tobacco/nicotine intake",
      current: !isTodayLogged ? "Pending Log" : (isTobaccoTargetMet ? "Clean" : "Slip Logged"),
      isCore: hasTobaccoHabit,
      feedback: !isTodayLogged
        ? "🫁 Log today's respiratory wellness status."
        : isTobaccoTargetMet
        ? "🫁 Tobacco-free day! Protecting respiratory tissue from inflammation."
        : "⚠️ Tobacco slip logged! Sip warm herbal infusion (tulsi/ginger) to beat the craving."
    });

    // 6. Sedentary Target
    const hasSedentarySlip = selectedSlips.includes("Desk Couch Potato Slip");
    const isSedentaryTargetMet = !hasSedentarySlip;
    const hasSedentaryHabit = onboardingData.habits.some((h) => h.toLowerCase().includes("sedentary"));
    list.push({
      id: "sedentary",
      name: "Desk Stretch Target",
      status: !isTodayLogged ? "warning" : (isSedentaryTargetMet ? "achieved" : "warning"),
      criteria: "Take hourly desk stretching breaks",
      current: !isTodayLogged ? "Pending Log" : (isSedentaryTargetMet ? "Active" : "Slip Logged"),
      isCore: hasSedentaryHabit,
      feedback: !isTodayLogged
        ? "🏃‍♂️ Log today's movement parameter."
        : isSedentaryTargetMet
        ? "🏃‍♂️ Active movement target met! Posture aligned and circulation optimal."
        : "⚠️ Sedentary warning! Get up right now and do 5 calf raises or shoulder stretches."
    });

    // 7. Micro-Habits Target
    const completedGoalsCount = currentGoals.filter((g) => g.completed).length;
    const totalGoalsCount = currentGoals.length;
    const isGoalsTargetMet = completedGoalsCount === totalGoalsCount && totalGoalsCount > 0;
    list.push({
      id: "microgoals",
      name: "AI Micro-Habits Target",
      status: !isTodayLogged ? "warning" : (isGoalsTargetMet ? "achieved" : (completedGoalsCount > 0 ? "partial" : "warning")),
      criteria: "Check off all daily personalized micro-goals",
      current: `${completedGoalsCount}/${totalGoalsCount} Met`,
      isCore: true,
      feedback: isGoalsTargetMet
        ? "🏆 100% micro-goals met! You fully satisfied your customized AI wellness directives."
        : completedGoalsCount > 0
        ? `⚡ In Progress: ${completedGoalsCount} of ${totalGoalsCount} micro-goals completed.`
        : "⚠️ No micro-goals checked off yet! Action your goals checklist in the left panel."
    });

    return list;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/80 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-md">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white block">
              Eco<span className="text-emerald-400">Vibe</span>
            </span>
            <span className="text-[9px] tracking-wider text-slate-500 font-bold uppercase block -mt-1">
              Keep Smiling Organization Product
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-semibold text-slate-400">
            <User size={12} className="text-emerald-400" />
            <span>{userEmail}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-900 hover:text-red-400 transition-all cursor-pointer"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Dashboard Body Grid */}
      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT COLUMN: User Context, Warning Forecast & Goals Checklist (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* User Profile Context Bar */}
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex flex-wrap items-center gap-5 justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Profession & Diet</p>
                <p className="text-sm font-bold text-slate-200">
                  {onboardingData.profession} &bull; <span className="text-emerald-400">{onboardingData.dietType}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Regional Context</p>
                <p className="text-xs font-bold text-slate-200">
                  Native: <span className="text-slate-400">{onboardingData.nativeState}</span> &rarr; Current: <span className="text-emerald-400">{onboardingData.currentState}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Today's Target Scorecard & Appreciation Panel */}
          {(() => {
            const targets = computeTargets();
            const achievedCount = targets.filter((t) => t.status === "achieved").length;
            const totalCount = targets.length;
            const percentageMet = Math.round((achievedCount / totalCount) * 100);

            // Determine appreciation or warnings
            let feedbackTitle = "";
            let feedbackDesc = "";
            let feedbackColorClass = "";

            if (percentageMet === 100) {
              feedbackTitle = "🏆 Perfect 100% Target Appreciation!";
              feedbackDesc = "Sensational effort! You have hit every single wellness target today. Your carbon footprint is minimal, your mind is in equilibrium, and your body is functioning beautifully. Keep Smiling, you are setting a brilliant example!";
              feedbackColorClass = "bg-emerald-950/40 border-emerald-500/50 text-emerald-300";
            } else if (percentageMet >= 70) {
              feedbackTitle = "🌟 Highly Commendable Progress!";
              feedbackDesc = "Wonderful discipline! You met the majority of your targets. Just a small warning or habit slip stands in your way. Swap any remaining stress tonight with regional alternatives like chamomile or roasted chana, and Keep Smiling!";
              feedbackColorClass = "bg-teal-950/40 border-teal-500/40 text-teal-300";
            } else {
              feedbackTitle = "⚠️ Active Wellness Warnings Detected";
              feedbackDesc = "Several triggers or slips are currently active. Do not worry—beating corporate stress is a gradual process. Accept these slips as data points, curb screens early, snack on some native Makhana, and Keep Smiling!";
              feedbackColorClass = "bg-amber-950/30 border-amber-500/30 text-amber-300";
            }

            return (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Award size={20} className="text-emerald-400" />
                      Today's Real-Time Target Scorecard
                    </h3>
                    <p className="text-xs text-slate-500">Live target tracking of selected bad habits and wellness parameters</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-xl border border-slate-900">
                    <div className="text-right">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Score</p>
                      <p className="text-sm font-black text-emerald-400">{achievedCount}/{totalCount} Met</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-950 flex items-center justify-center text-xs font-black text-emerald-400 border border-emerald-500/20">
                      {percentageMet}%
                    </div>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Daily Target Completion</span>
                    <span className="text-emerald-400">{percentageMet}% Achieved</span>
                  </div>
                  <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900 p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${percentageMet}%` }}
                    />
                  </div>
                </div>

                {/* Dynamic Appreciation & Warning Block */}
                <div className={`p-4 rounded-xl border leading-relaxed text-xs transition-all ${feedbackColorClass}`}>
                  <p className="font-extrabold uppercase text-[10px] tracking-wider mb-1.5">{feedbackTitle}</p>
                  <p className="font-medium italic">"{feedbackDesc}"</p>
                </div>

                {/* Targets Grid */}
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Target Parameters Breakdown</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {targets.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                          t.status === "achieved"
                            ? "bg-slate-950/50 border-slate-900/60"
                            : t.status === "partial"
                            ? "bg-slate-950/80 border-slate-800"
                            : "bg-red-950/10 border-red-950/40"
                        }`}
                      >
                        {/* Target Title & Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              {t.name}
                              {t.isCore && (
                                <span className="inline-block px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase rounded-md bg-rose-950/60 border border-rose-900/50 text-rose-300 animate-pulse">
                                  🔥 Focus
                                </span>
                              )}
                            </h4>
                            <p className="text-[10px] text-slate-500">{t.criteria}</p>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0 ${
                              t.status === "achieved"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-900/40"
                                : t.status === "partial"
                                ? "bg-cyan-950 text-cyan-400 border border-cyan-900/40"
                                : "bg-red-950 text-red-400 border border-red-900/40"
                            }`}
                          >
                            {t.status === "achieved" ? "Met" : t.status === "partial" ? "Partial" : "Slip"}
                          </span>
                        </div>

                        {/* Current Parameter and Specific Supportive feedback */}
                        <div className="pt-2 border-t border-slate-900/60">
                          <p className="text-[10px] text-slate-400 leading-normal font-medium">
                            <span className="font-extrabold text-slate-500 uppercase text-[9px]">Status:</span> {t.feedback}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* AI Behavioral Forecast & Danger Box */}
          <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <AlertCircle size={100} className="text-red-500" />
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-950 text-red-400 rounded-xl mt-0.5">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-red-300">⚠️ AI-Generated Behavioral Forecast Warning</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed italic">
                  "{outcomeNote}"
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Checklist Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-extrabold text-white">Your Personalized Daily Goals</h3>
                <p className="text-xs text-slate-500">Formulated by Gemini AI based on your lifestyle commentary</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-900/60 text-emerald-400 text-xs font-bold">
                Daily Micro-Habits
              </div>
            </div>

            <div className="space-y-3">
              {currentGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                    goal.completed
                      ? "bg-slate-900/30 border-slate-800/40 text-slate-500"
                      : "bg-slate-900/90 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${
                      goal.completed ? "bg-emerald-400 text-slate-950" : "border-2 border-slate-700"
                    }`}
                  >
                    {goal.completed && <CheckSquare size={14} className="stroke-[3]" />}
                  </div>
                  <span className={`text-sm font-medium leading-normal ${goal.completed ? "line-through text-slate-600" : "text-slate-200"}`}>
                    {goal.text}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Progress Graph */}
          <CustomChart logs={logs} />
        </div>

        {/* RIGHT COLUMN: Daily Logging Parameters & AI Nudges (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Intelligent Nudge Banner */}
          <div className="bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl p-5 shadow-lg shadow-emerald-500/5 relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none animate-pulse" />
            
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-xl mt-0.5 shadow-md ring-1 ring-emerald-800">
                <Coffee size={20} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={14} />
                    Intelligent Nudge
                  </h3>
                  {isLoadingNudge && (
                    <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                  {isLoadingNudge ? (
                    <span className="text-slate-500 italic">GenAI coach formulating state-specific alternatives...</span>
                  ) : (
                    nudgeText
                  )}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] text-slate-500 font-bold uppercase">
                    Tailored for {onboardingData.currentState}
                  </span>
                  <button
                    type="button"
                    onClick={() => fetchIntelligentNudge()}
                    disabled={isLoadingNudge}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer disabled:opacity-50"
                  >
                    Refresh Nudge &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Logging Form / AI Chat Tabbed Widget */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            {/* Tab Header Buttons */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900/80 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("log")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "log"
                    ? "bg-slate-900 text-emerald-400 border border-slate-800/60 shadow-md"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Clock size={13} />
                Logs & Triggers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-slate-900 text-emerald-400 border border-slate-800/60 shadow-md"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <MessageSquare size={13} />
                AI Coach Chat
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>

            {activeTab === "log" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Daily Log Tracker</h3>
                    <p className="text-xs text-slate-500">Record parameters to identify triggers and monitor trends</p>
                  </div>
                  <div>
                    {logs.some((l) => l.date === new Date().toISOString().split("T")[0]) ? (
                      <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-900/50">
                        ✅ Logged
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-amber-950/80 text-amber-400 border border-amber-900/40 animate-pulse">
                        📝 Pending Log
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleLogSubmit} className="space-y-4">
                  {/* Screen Hours Slider */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Tv size={14} className="text-emerald-400" />
                        Screen Hours
                      </label>
                      <span className={`text-sm font-black ${screenHours > 6 ? "text-red-400" : "text-emerald-400"}`}>
                        {screenHours} hours
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      step="0.5"
                      value={screenHours}
                      onChange={(e) => setScreenHours(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold mt-1">
                      <span>0h (Ideal)</span>
                      <span>6h (Target)</span>
                      <span>16h</span>
                    </div>
                  </div>

                  {/* Sleep Hours Slider */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Moon size={14} className="text-cyan-400" />
                        Sleep Hours
                      </label>
                      <span className={`text-sm font-black ${sleepHours < 6 ? "text-red-400" : "text-cyan-400"}`}>
                        {sleepHours} hours
                      </span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 font-bold mt-1">
                      <span>3h (Danger)</span>
                      <span>7-8h (Target)</span>
                      <span>12h</span>
                    </div>
                  </div>

                  {/* Habit Slips Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                      <Frown size={14} className="text-red-400" />
                      Today's Habit Slips (If Any)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlips.map((slip) => {
                        const isSelected = selectedSlips.includes(slip.label);
                        return (
                          <button
                            type="button"
                            key={slip.id}
                            onClick={() => handleSlipToggle(slip.label)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left truncate flex items-center justify-between ${
                              isSelected
                                ? "bg-red-950/40 text-red-400 border-red-500/40"
                                : "bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800"
                            }`}
                          >
                            <span>{slip.label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Brief Log Comment (Optional)
                    </label>
                    <input
                      type="text"
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder="e.g. Scrolled after midnight due to stress"
                      className="w-full bg-slate-950 border border-slate-900 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-700 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Submit Log Button */}
                  <button
                    type="submit"
                    disabled={isLogging}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 font-black py-3.5 rounded-xl shadow-lg hover:from-emerald-350 hover:to-emerald-450 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLogging ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Saving to local storage...
                      </div>
                    ) : (
                      <>
                        Log Today's Parameters
                        <PlusCircle size={16} />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {logSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-emerald-950/60 border border-emerald-900/60 rounded-xl flex items-center gap-2.5 text-xs text-emerald-400 font-bold"
                      >
                        <CheckCircle size={16} className="shrink-0" />
                        <span>Parameters securely saved in local storage. GenAI coach updated!</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            ) : (
              <div className="flex flex-col h-[520px] justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <MessageSquare size={18} className="text-emerald-400" />
                    AI Coach Chat Room
                  </h3>
                  <p className="text-xs text-slate-500">Receive compassionate guidance on craving mitigation & local Indian ingredient swaps</p>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-900 overflow-y-auto space-y-3.5 max-h-[340px] flex flex-col">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === "assistant"
                          ? "bg-slate-900 border border-slate-800/50 text-slate-200 self-start rounded-tl-none"
                          : "bg-emerald-950/70 border border-emerald-900/40 text-emerald-300 self-end rounded-tr-none"
                      }`}
                    >
                      <p className="font-extrabold uppercase text-[9px] tracking-wider mb-1 text-slate-500">
                        {msg.role === "assistant" ? "AI Coach" : "You"}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                  {isSendingChat && (
                    <div className="bg-slate-900 border border-slate-850 p-3 rounded-2xl rounded-tl-none text-xs text-slate-400 self-start flex items-center gap-2">
                      <div className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span>Formulating compassionate response...</span>
                    </div>
                  )}
                </div>

                {/* Message Input box */}
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about stress, cravings, or regional wellness alternatives..."
                    className="flex-1 bg-slate-950 border border-slate-900 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatInput.trim()}
                    className="p-3 rounded-xl bg-emerald-400 text-slate-950 hover:bg-emerald-350 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Historical Log list */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-xl max-h-[280px] overflow-y-auto">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Historical Logs</h4>
            <div className="space-y-2.5">
              {[...logs]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((log, i) => {
                  const slipCount = log.habitSlips ? log.habitSlips.length : 0;
                  return (
                    <div key={i} className="bg-slate-950/80 p-3 rounded-xl border border-slate-900 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-200">
                          {new Date(log.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Screen: <span className="text-slate-300 font-medium">{log.screenHours}h</span> &bull; Sleep: <span className="text-slate-300 font-medium">{log.sleepHours}h</span>
                        </p>
                        {log.notes && <p className="text-[10px] text-slate-400 italic mt-1 font-medium">"{log.notes}"</p>}
                      </div>
                      <div>
                        {slipCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/60 border border-red-900/50 text-red-400 font-bold text-[9px]">
                            {slipCount} Slips
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-900/50 text-emerald-400 font-bold text-[9px]">
                            Perfect Day
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              {logs.length === 0 && (
                <p className="text-slate-500 text-xs italic text-center py-4">No daily logs found. Start logging above!</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer Layout with co-branding */}
      <footer className="w-full text-center py-8 border-t border-slate-900/60 mt-12 mb-16">
        <p className="text-xs text-slate-500 font-medium">
          EcoVibe is A Product of <strong className="text-slate-400">Keep Smiling Organization</strong>.
        </p>
        <p className="text-[10px] text-slate-600 mt-1.5">
          All data stored securely and privately in your browser's local sandbox storage.
        </p>
      </footer>
    </div>
  );
}
