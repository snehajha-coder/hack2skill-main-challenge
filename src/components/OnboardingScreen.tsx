import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ArrowLeft, Send, CheckSquare, Heart, AlertTriangle } from "lucide-react";
import { INDIAN_STATES } from "../states";
import { HabitGoal, OnboardingProfile } from "../types";

interface OnboardingScreenProps {
  onSubmitOnboarding: (
    profile: OnboardingProfile,
    onboardingResult: { dailyGoals: { id: string; text: string }[]; outcomeNote: string }
  ) => Promise<void>;
}

export default function OnboardingScreen({ onSubmitOnboarding }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form states
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("");
  const [dietType, setDietType] = useState("Vegetarian");
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [nativeState, setNativeState] = useState("Delhi");
  const [currentState, setCurrentState] = useState("Karnataka");
  const [otherComments, setOtherComments] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableHabits = [
    { id: "screentime", label: "Excessive Screen Time / Scrolling", desc: "Mindless scrolling on devices, wasting electricity & digital focus" },
    { id: "junkfood", label: "Eating High-Carbon Junk Food", desc: "Consuming processed, heavily packaged fast food with a high carbon footprint" },
    { id: "sugar_tea", label: "Sugary Tea / Coffee Overdose", desc: "Excessive cups of tea/coffee, raising sugar dependency & dairy footprint" },
    { id: "sleep", label: "Irregular Sleep Cycle", desc: "Staying up past midnight regularly, keeping high-power appliances/lights on" },
    { id: "smoking", label: "Tobacco / Smoking / Vaping", desc: "Stress-induced tobacco use, emitting toxic waste & air emissions" },
    { id: "sedentary", label: "Sedentary Desk / No Walking", desc: "Sitting at a desk 8+ hours without active standing breaks or local walking" },
  ];

  const handleHabitToggle = (habitLabel: string) => {
    if (selectedHabits.includes(habitLabel)) {
      setSelectedHabits(selectedHabits.filter((h) => h !== habitLabel));
    } else {
      setSelectedHabits([...selectedHabits, habitLabel]);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!profession.trim()) {
        setError("Please specify your working profession.");
        return;
      }
    }
    if (step === 2 && selectedHabits.length === 0) {
      setError("Please select at least one core target habit to curb.");
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const profile: OnboardingProfile = {
      name,
      profession,
      dietType,
      habits: selectedHabits,
      nativeState,
      currentState,
      otherComments,
      completed: true,
    };

    try {
      // 1. Submit to Gemini proxy
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to analyze onboarding profile");
      }

      const onboardingResult = await res.json();

      if (!onboardingResult.dailyGoals || !onboardingResult.outcomeNote) {
        throw new Error("Invalid response format received from Gemini AI.");
      }

      // 2. Pass data back to parent which saves it to Google Drive & sends Gmail
      await onSubmitOnboarding(profile, onboardingResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while designing your custom goals.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden font-sans">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-[-10%] right-[-15%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Organization Attribution */}
      <header className="w-full flex justify-between items-center py-4 border-b border-slate-900/60 z-10">
        <div>
          <span className="text-xl font-black text-white tracking-tight">
            Eco<span className="text-emerald-400">Vibe</span>
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-wider text-slate-500 font-bold uppercase">
            A Product of Keep Smiling Organization
          </p>
        </div>
      </header>

      {/* Onboarding Wizard Form Container */}
      <main className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full z-10 py-10">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Step {step} of {totalSteps}
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-8 bg-emerald-400"
                      : s < step
                      ? "w-4 bg-emerald-700"
                      : "w-2 bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Tell us about <span className="text-emerald-400">yourself</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      We personalize your eco-habits based on your work environment and dietary vibe.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="e.g. Sneha"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-2">
                        Working Profession
                      </label>
                      <input
                        type="text"
                        value={profession}
                        onChange={(e) => {
                          setProfession(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="e.g. Software Engineer, Doctor, Consultant..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-2">
                        Diet Type
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        {["Vegetarian", "Non-Vegetarian", "Eggitarian"].map((diet) => (
                          <button
                            type="button"
                            key={diet}
                            onClick={() => setDietType(diet)}
                            className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                              dietType === diet
                                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/80 shadow-md shadow-emerald-500/5"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            {diet}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Target <span className="text-emerald-400">habits to curb</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Select which behavioral cycles you want to disrupt and gamify.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {availableHabits.map((habit) => {
                      const isSelected = selectedHabits.includes(habit.label);
                      return (
                        <button
                          type="button"
                          key={habit.id}
                          onClick={() => handleHabitToggle(habit.label)}
                          className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${
                            isSelected
                              ? "bg-emerald-950/40 text-slate-200 border-emerald-500/80 shadow-md shadow-emerald-500/5"
                              : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                              isSelected ? "bg-emerald-400 text-slate-950" : "border-2 border-slate-700"
                            }`}
                          >
                            {isSelected && <CheckSquare size={14} className="stroke-[3]" />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-300"}`}>
                              {habit.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{habit.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">
                      Indian Regional <span className="text-emerald-400">Context</span>
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">
                      Helps Gemini analyze geographical climate shifts, local dietary alternatives, and stressors.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-2">
                          Native State
                        </label>
                        <select
                          value={nativeState}
                          onChange={(e) => setNativeState(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none transition-all font-medium appearance-none cursor-pointer"
                        >
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-2">
                          Current State
                        </label>
                        <select
                          value={currentState}
                          onChange={(e) => setCurrentState(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none transition-all font-medium appearance-none cursor-pointer"
                        >
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-300 tracking-wider mb-2">
                        Other Comments / Struggles
                      </label>
                      <textarea
                        value={otherComments}
                        onChange={(e) => setOtherComments(e.target.value)}
                        placeholder="Type any custom bad habits or lifestyle stressors (e.g. constant midnight cravings, coffee dependency, junk food at night, excessive desk sitting)..."
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-medium resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-950/60 border border-red-900/60 rounded-xl flex items-center gap-3 text-xs text-red-400"
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Navigation Controls */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold py-3.5 px-5 rounded-2xl transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )
            }

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-white font-bold py-3.5 px-5 rounded-2xl transition-all active:scale-98 cursor-pointer"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 font-black py-3.5 px-5 rounded-2xl shadow-lg shadow-emerald-500/10 hover:from-emerald-350 hover:to-emerald-450 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Analyzing Bio-Habits...
                  </div>
                ) : (
                  <>
                    Curb My Habits
                    <Send size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer co-branding */}
      <footer className="w-full text-center py-4 border-t border-slate-900/40 z-10">
        <p className="text-[10px] text-slate-600">
          Powered by <strong className="text-slate-500">Keep Smiling Organization</strong> &bull; Securely persisted locally via EcoVibe Private Storage.
        </p>
      </footer>
    </div>
  );
}
