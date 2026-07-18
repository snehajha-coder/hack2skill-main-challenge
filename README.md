# HabitCurb 🌿

> **Interactive Companion Website:** [https://habitcurb.ai.studio/](https://habitcurb.ai.studio/)

HabitCurb is a fun, gamified carbon footprint companion and smart habit coach. Built with a premium, high-contrast dark theme, vibrant mint-green accents, and a fluid card-based layout, it completely breaks away from corporate dashboards to feel like an engaging consumer gaming or fitness application. 

HabitCurb helps you overcome suboptimal habits (like midnight screen scrolling, caffeine overdosing, or sedentary behavior) while simultaneously tracking and celebrating the real-world carbon footprint reductions that result from a healthier lifestyle.

---

## 🚀 Core Features & Capabilities

### 1. Smart Indian Regional AI Coach (Gemini 3.5)
* **Intelligent Nudges:** Features a warm, supportive, and direct AI Coach powered by the cutting-edge **Gemini 3.5 Flash** model. It analyzes your unique onboarding profile (profession, native state, current state, diet) and suggests hyper-localized, sustainable alternatives (such as replacing processed snacks with local roasted Makhana or switching to ginger-infused buttermilk).
* **AI Interactive Chat:** Engage in a real-time conversational thread with your companion to discuss cravings, local wellness solutions, and carbon footprint tips.

### 2. Gamified Target Metrics & Local Carbon Calculations
HabitCurb tracks six daily lifestyle parameters designed to align personal health with environmental wellness:
* **Screen Time Limit:** Keep screen time under 6 hours to reduce cognitive strain and lower device/data-center electrical carbon emissions.
* **Restful Sleep Target:** Log at least 7 hours of sleep to support cellular recovery and automatically curb late-night device power consumption.
* **Clean Eating Target:** Avoid processed foods, supporting local agriculture and lowering packaging/transport footprint.
* **Sugar & Caffeine Limit:** Swap high-sugar energy drinks or excessive tea/coffee for local, hydrating alternatives.
* **Tobacco-Free Living:** Monitor respiratory health and minimize agricultural/manufacturing chain pollution.
* **Desk Stretch Target:** Break sedentary loops with quick, active posture resets.

### 3. Visual Carbon Reduction Analytics
* Powered by highly interactive **Recharts** visualizations that dynamically render trendlines as you submit daily logs.
* See your cumulative carbon savings grow based on reduced screen usage, cleaner diet choices, and active wellness streaks.

### 4. Fully Local & Secure Storage Sandbox
* Designed to protect user privacy above all. Every single onboarding preference, daily log, sleep stat, active goal checklist, and chat history is persisted directly in your browser's **internal LocalStorage sandbox**.
* **Zero cloud database dependency** means your personal data never leaves your device, and the application remains accessible to anyone with a browser link without requiring a complex external login setup.

---

## 🛠️ Technology Stack & Architecture

* **Frontend:** React 18 with Vite, designed with mobile-first responsiveness.
* **Styling:** Tailwind CSS with a customized premium dark theme (`bg-slate-950`), custom mint-green accents (`text-emerald-400`, `bg-emerald-950`), and crisp, high-contrast typography.
* **Icons:** Streamlined visual system powered by `lucide-react`.
* **Backend:** Express proxy with native TypeScript execution (`tsx`) to safely sign and handle backend communication with the server-side Gemini API without exposing credentials to the client.

---

## 🏃‍♂️ Quick Start for Developers

### Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your secret key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

5. **Start Production Server:**
   ```bash
   npm run start
   ```

---

*HabitCurb is A Product of the **Keep Smiling Organization**, created with care to make carbon footprint tracking accessible, rewarding, and fun for everyone.*
