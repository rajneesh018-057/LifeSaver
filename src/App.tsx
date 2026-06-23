import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Bolt, 
  Coffee, 
  Plus, 
  Search, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock, 
  Trash2, 
  Calendar, 
  Inbox, 
  Target, 
  Settings as SettingsIcon, 
  TrendingUp, 
  X, 
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  Eye,
  CheckCircle,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  Sliders,
  Loader2
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import AIAssistantDrawer from "./components/AIAssistantDrawer";
import { Task, Goal, ScheduleItem, DailyInsight } from "./types";
import { initialTasks, initialGoals, initialSchedule, initialInsights } from "./data";
import { formatTime, calculateRiskLevel } from "./utils";

export default function App() {
  // Navigation & User Context
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("lifesaver_username") || "Alex Chen";
  });
  const [isPro, setIsPro] = useState<boolean>(true);
  const [darkCalmMode, setDarkCalmMode] = useState<boolean>(() => {
    return localStorage.getItem("lifesaver_dark_calm") === "true";
  });

  // Core App State (hydrated from localStorage or default static templates)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("lifesaver_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialTasks;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem("lifesaver_goals");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialGoals;
  });

  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem("lifesaver_schedule");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialSchedule;
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>("");

  // AI-Assisted Recommendation State
  const [aiAdvice, setAiAdvice] = useState<{
    suggestion: string;
    predictedLoad: string;
    alignmentScore: number;
    loading: boolean;
  }>({
    suggestion: 'AI suggests assigning "Review Q3 Financials" to your 2:00 PM deep work block.',
    predictedLoad: "High Peak Cognitive Load",
    alignmentScore: 92,
    loading: false
  });

  // Quick Triage Raw Text Inbox State
  const [inboxText, setInboxText] = useState("");
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageFeedback, setTriageFeedback] = useState<string | null>(null);

  // Focus Timer States (Deep Work & Active Rest)
  const [timerType, setTimerType] = useState<"deep-work" | "active-rest">("deep-work");
  const [timerState, setTimerState] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(90 * 60);
  const [timerTotalDuration, setTimerTotalDuration] = useState<number>(90 * 60);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [focusStreak, setFocusStreak] = useState<number>(3);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Capture Task Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskGoalProject, setNewTaskGoalProject] = useState("General");
  const [customDuration, setCustomDuration] = useState("45m");
  const [rawDumpInput, setRawDumpInput] = useState("");
  const [parserRunning, setParserRunning] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<Partial<Task> | null>(null);

  // Selected Task Accordion ID
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>("task-1");

  // Notifications State for the Bell
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; read: boolean }>>([
    { id: "noti-1", text: "Predictive Schedule Alignment available for Review Q3 Financials.", read: false },
    { id: "noti-2", text: "Attention: 2 Deep Work block configurations were automatically consolidated.", read: true },
  ]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Synchronization Indicators
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // AI Scheduling Command Center States
  const [isCalendarConnected, setIsCalendarConnected] = useState<boolean>(false);
  const [connectedSources, setConnectedSources] = useState<string[]>([]);
  const [plannerView, setPlannerView] = useState<"day" | "week" | "month">("week");
  const [appliedOptimizations, setAppliedOptimizations] = useState<string[]>([]);
  const [showConnectionMenu, setShowConnectionMenu] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Local storage synchronization
  useEffect(() => {
    localStorage.setItem("lifesaver_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("lifesaver_goals", JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem("lifesaver_schedule", JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem("lifesaver_username", userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem("lifesaver_dark_calm", String(darkCalmMode));
    if (darkCalmMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkCalmMode]);

  // Request alignment counselor recommendation on load / task edit
  const fetchAiAdvice = async () => {
    setAiAdvice(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch("/api/suggest-alignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter(t => !t.completed),
          goals: goals,
          timeOfDay: new Date().getHours() < 12 ? "morning" : "afternoon"
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAiAdvice({
          suggestion: data.suggestion,
          predictedLoad: data.predictedLoad,
          alignmentScore: data.alignmentScore,
          loading: false
        });
      } else {
        throw new Error("Failed to reach counseling API");
      }
    } catch (err) {
      console.warn("AI counsel fallback activated:", err);
      // fallback
      setTimeout(() => {
        setAiAdvice({
          suggestion: tasks.length > 0 
            ? `AI suggests finishing "${tasks[0].title}" to reach a Risk Level of Low during the next index block.` 
            : "AI suggests drafting your high-priority goals to set proper milestone targets.",
          predictedLoad: "Medium Cognitive Load",
          alignmentScore: 88,
          loading: false
        });
      }, 600);
    }
  };

  useEffect(() => {
    fetchAiAdvice();
    const interval = setInterval(() => {
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks.length]);

  // Timer interval control
  useEffect(() => {
    if (timerState === "running") {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current!);
            setTimerState("completed");
            setFocusStreak(streak => streak + 1);
            if (soundEnabled) {
              try {
                const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                oscillator.type = "sine";
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                oscillator.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 1.5);
              } catch (_) {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState, soundEnabled]);

  // AI-powered raw sentence prioritization parser
  const handleParseRawText = async (textToParse: string, fromTriageTab = false) => {
    if (!textToParse.trim()) return;
    
    if (fromTriageTab) {
      setTriageLoading(true);
      setTriageFeedback(null);
    } else {
      setParserRunning(true);
    }

    try {
      const response = await fetch("/api/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: textToParse,
          goals: goals,
          existingTasks: tasks
        })
      });

      if (response.ok) {
        const parsed = await response.json();
        
        if (fromTriageTab) {
          const newTask: Task = {
            id: `task-${Date.now()}`,
            title: parsed.title || textToParse,
            project: parsed.project || "General",
            nextStep: parsed.nextStep || "Process parsed information",
            score: parsed.score || 70,
            duration: parsed.duration || "45m",
            cognitiveLoad: parsed.cognitiveLoad || "Medium Cognitive Load",
            completed: false,
            explanation: parsed.explanation || "Dynamically sorted by Active Calm Priority engine.",
            createdAt: new Date().toISOString()
          };
          setTasks(prev => [newTask, ...prev]);
          setInboxText("");
          setTriageFeedback(`Successfully created priority task: "${newTask.title}" directly in your dashboard!`);
        } else {
          setParsedPreview({
            title: parsed.title,
            project: parsed.project,
            score: parsed.score,
            duration: parsed.duration,
            cognitiveLoad: parsed.cognitiveLoad,
            nextStep: parsed.nextStep,
            explanation: parsed.explanation
          });
          setNewTaskTitle(parsed.title || "");
          setNewTaskGoalProject(parsed.project || "General");
          setCustomDuration(parsed.duration || "45m");
        }
      } else {
        throw new Error("Server priority error");
      }
    } catch (err) {
      console.warn("Fallback parser local categorization strategy:", err);
      // dynamic locally computed fallback simulation
      const fallbackPreview: Partial<Task> = {
        title: textToParse.length > 40 ? textToParse.substring(0, 40) + "..." : textToParse,
        project: "General",
        score: Math.floor(Math.random() * 40) + 50,
        duration: "30m",
        cognitiveLoad: "Medium Cognitive Load",
        nextStep: "Calibrating details manually",
        explanation: "Parsed with local algorithm. Assign an AI Studio API secret key for full executive counselor prioritization strategy."
      };
      
      if (fromTriageTab) {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: fallbackPreview.title!,
          project: fallbackPreview.project!,
          nextStep: fallbackPreview.nextStep,
          score: fallbackPreview.score!,
          duration: fallbackPreview.duration!,
          cognitiveLoad: fallbackPreview.cognitiveLoad!,
          completed: false,
          explanation: fallbackPreview.explanation,
          createdAt: new Date().toISOString()
        };
        setTasks(prev => [newTask, ...prev]);
        setInboxText("");
        setTriageFeedback(`Task categorized locally: "${newTask.title}". Provide an API Key to activate intelligent scoring!`);
      } else {
        setParsedPreview(fallbackPreview);
        setNewTaskTitle(fallbackPreview.title || "");
        setNewTaskGoalProject(fallbackPreview.project || "General");
        setCustomDuration(fallbackPreview.duration || "30m");
      }
    } finally {
      setParserRunning(false);
      setTriageLoading(false);
    }
  };

  // Add Task manually
  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      project: newTaskGoalProject,
      nextStep: parsedPreview?.nextStep || "Review project essentials",
      score: parsedPreview?.score || 60,
      duration: customDuration,
      cognitiveLoad: parsedPreview?.cognitiveLoad || "Medium Cognitive Load",
      completed: false,
      explanation: parsedPreview?.explanation || "Created manually via capture action. Set project context details clearly to optimize scheduler.",
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);
    setIsCaptureModalOpen(false);
    setNewTaskTitle("");
    setRawDumpInput("");
    setParsedPreview(null);
  };

  // Fast direct inline task capturing on dashboard
  const handleDirectAdd = (title: string) => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      project: "General",
      nextStep: "Identify immediate milestone action",
      score: 55,
      duration: "30m",
      cognitiveLoad: "Medium Cognitive Load",
      completed: false,
      explanation: "Quick task added directly. Click to request dynamic priority scores and cognitive load matching details.",
      createdAt: new Date().toISOString()
    };
    setTasks(prev => [...prev, newTask]);
    setExpandedTaskId(newTask.id);
  };

  // Toggle tasks completion state
  const handleToggleTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed };
        }
        return t;
      })
    );
  };

  // Toggle schedule item completed
  const handleToggleScheduleItem = (itemId: string) => {
    setSchedule(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, completed: !item.completed };
        }
        return item;
      })
    );
  };

  // Delete task
  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    }
  };

  // Start Focus Block from Dash Cards
  const handleStartFocusTimer = (type: "deep-work" | "active-rest") => {
    setTimerType(type);
    const durationMins = type === "deep-work" ? 90 : 15;
    setTimerTotalDuration(durationMins * 60);
    setTimerSecondsLeft(durationMins * 60);
    setTimerState("running");
    setActiveTab("planner"); // Navigate to planner/focus screen
  };

  // Dynamic values based on active task metrics
  const activeUncompletedTasks = tasks.filter(t => !t.completed);
  const activeUncompletedCount = activeUncompletedTasks.length;
  const currentRisk = calculateRiskLevel(tasks);

  // Filter tasks with search bar query
  const filteredTasks = tasks.filter(task => {
    const matchQuery = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.nextStep && task.nextStep.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchQuery;
  });

  return (
    <div className={`min-h-screen font-sans antialiased text-[#1b1b21] transition-colors duration-300 ${darkCalmMode ? "bg-[#12121a] text-white" : "bg-[#fbf8ff] text-[#1b1b21]"}`}>
      
      {/* Sidebar - Fixed Left Rail */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // Auto close capture dialogs or temporary focus menus on tab switch
          setShowNotificationsMenu(false);
        }}
        userName={userName}
        isPro={isPro}
        tasksCount={activeUncompletedCount}
      />

      {/* Top Navigation Bar / Search / Notifications */}
      <header 
        id="top-bar"
        className={`fixed top-0 right-0 w-[calc(100%-280px)] h-16 px-8 z-20 flex justify-between items-center transition-all duration-300 border-b backdrop-blur-md ${
          darkCalmMode 
            ? "bg-[#12121a]/85 border-[#e4e1ea]/10" 
            : "bg-white/80 border-[#efecf6]"
        }`}
      >
        {/* Search Field */}
        <div className="flex items-center gap-2 max-w-sm w-full">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-full border transition-all duration-200 ${
            darkCalmMode 
              ? "bg-[#efecf6]/5 border-[#e4e1ea]/10 text-white" 
              : "bg-[#f5f2fb] border-[#efecf6] text-[#464652]"
          }`}>
            <Search className="w-4 h-4 text-[#72749b] shrink-0" />
            <input 
              id="search-input"
              type="text"
              placeholder="Search active tasks, goals, next actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-[#c7c5d4] focus:ring-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-black/10 rounded-full">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          
          {/* Theme status indicator switch */}
          <button
            id="theme-toggle"
            onClick={() => setDarkCalmMode(!darkCalmMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-mono uppercase tracking-wider transition-all border ${
              darkCalmMode 
                ? "bg-gradient-to-r from-[#5054b1] to-[#373b97] text-white border-[#5054b1]/30" 
                : "bg-white text-[#5054b1] hover:bg-[#f5f2fb] border-[#efecf6]"
            }`}
            title="Toggle Active Calm Dark mode (reduces visual cortisol strain)"
          >
            <div className={`w-2.5 h-2.5 rounded-full ${darkCalmMode ? "bg-cyan-300 animate-pulse" : "bg-[#5054b1]"}`} />
            <span>{darkCalmMode ? "Active Calm Light Mode" : "Standard Mode"}</span>
          </button>

          {/* Sync status */}
          <span className="hidden md:inline text-[10px] font-mono text-[#72749b]">
            Cloud Synced: <span className="text-[#5054b1] font-semibold">{lastSyncTime}</span>
          </span>

          {/* Inbox notifications bell */}
          <div className="relative">
            <button 
              id="notifications-bell"
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className={`p-2 rounded-xl transition-all relative ${
                darkCalmMode ? "hover:bg-white/10 text-[#bfc1ff]" : "hover:bg-[#f5f2fb] text-[#72749b] hover:text-[#010047]"
              }`}
            >
              <Bell className="w-5 h-5 text-current" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Notifications drop down visual stack */}
            {showNotificationsMenu && (
              <div className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-xl border p-4 z-50 ${
                darkCalmMode ? "bg-[#181822] border-[#bfc1ff]/10 text-white" : "bg-white border-[#efecf6] text-[#1b1b21]"
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-display font-bold text-xs text-[#010047] dark:text-white uppercase tracking-tight">System Alerts</h4>
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({...n, read: true})));
                    }}
                    className="text-[10px] text-[#5054b1] hover:underline font-mono"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.map(item => (
                    <div 
                      key={item.id}
                      className={`p-2.5 rounded-lg text-xs transition-colors ${
                        item.read 
                          ? "opacity-65" 
                          : darkCalmMode ? "bg-white/5 border border-white/5" : "bg-[#f5f2fb]"
                      }`}
                    >
                      <p className="font-sans leading-relaxed text-[11px]">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CAPTURE TASK button action */}
          <button 
            id="capture-task-btn"
            onClick={() => setIsCaptureModalOpen(true)}
            className="flex items-center gap-2 bg-[#5054b1] hover:bg-[#373b97] active:scale-95 text-white font-sans text-xs font-semibold px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Capture Task</span>
          </button>

        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="ml-[280px] pt-16 min-h-screen px-8 pb-16">
        
        {/* Dynamic global risk feedback banner if tasks grow heavy */}
        {activeUncompletedCount >= 5 && (
          <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              <div>
                <p className="font-semibold text-xs text-rose-800">Extreme cognitive load warning</p>
                <p className="text-[11px] text-rose-700 leading-tight">You have {activeUncompletedCount} active priorities today. Consider starting deep work triage blocks to offload tasks.</p>
              </div>
            </div>
            <button 
              onClick={() => handleStartFocusTimer("deep-work")}
              className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
            >
              Start Deep Focus Loop
            </button>
          </div>
        )}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* Contextual intelligent advice strip */}
            <section className="mt-4 max-w-[1200px] mx-auto">
              <div className={`glass-panel rounded-xl p-3 px-5 flex flex-wrap items-center justify-between gap-4 border-l-4 border-[#5054b1] transition-colors duration-300 ${
                darkCalmMode ? "bg-[#181822]/90" : "bg-white/80"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Sparkles className="w-5 h-5 text-[#5054b1] animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-sans">
                      <span className="font-bold text-[#5054b1] dark:text-[#bfc1ff]">Assistant Recommendation:</span>{" "}
                      {aiAdvice.loading ? (
                        <span className="text-[#72749b] italic animate-pulse">Consulting planning patterns with Gemini...</span>
                      ) : (
                        <span>{aiAdvice.suggestion}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Energy / cognitive prediction score */}
                  <div className="flex items-center gap-3 border-r border-[#efecf6] dark:border-white/10 pr-4">
                    <div className="text-right">
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-[#72749b]">
                        Cognitive Burden Index
                      </span>
                      <span className="font-mono text-xs font-bold text-[#5054b1] dark:text-[#bfc1ff]">
                        {aiAdvice.predictedLoad}
                      </span>
                    </div>
                    <div className="w-1.5 h-8 bg-[#efecf6] dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`w-full rounded-full transition-all duration-300 ${
                          aiAdvice.predictedLoad.includes("High") 
                            ? "bg-rose-500 h-4/5" 
                            : aiAdvice.predictedLoad.includes("Medium") 
                              ? "bg-amber-500 h-1/2" 
                              : "bg-emerald-500 h-1/4"
                        }`} 
                      />
                    </div>
                  </div>

                  {/* Accept Adjustment CTAs */}
                  <div className="flex items-center gap-2 text-xs">
                    <button 
                      onClick={() => {
                        // Quick add specific AI suggested target
                        handleDirectAdd("Review Q3 Financials");
                      }}
                      className="px-4 py-1.5 bg-[#4c51bb] hover:bg-[#373b97] active:scale-95 text-white rounded-lg font-sans font-medium transition-all"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={fetchAiAdvice}
                      className="p-1 px-2.5 bg-[#f5f2fb] dark:bg-white/10 text-[#72749b] hover:text-[#010047] dark:hover:text-white rounded-lg font-sans font-medium hover:bg-[#e9e7f0] transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Adjust</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Greeting Header */}
            <section className="pt-2 pb-4 max-w-[1200px] mx-auto text-left">
              <div className="flex flex-col space-y-2">
                <h2 className="font-display text-4xl font-extrabold text-[#010047] dark:text-white tracking-tight">
                  Good morning, Alex.
                </h2>
                <div className="flex items-center gap-3">
                  <p className="font-sans text-md text-[#72749b] font-medium">
                    Your schedule index indicates your day is perfectly manageable.
                  </p>
                  <div className={`flex items-center gap-1.5 px-3 py-1 border rounded-full ${currentRisk.color}`}>
                    <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold">
                      Risk Level: {currentRisk.level}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Grid Workspace */}
            <div className="max-w-[1200px] mx-auto grid grid-cols-12 gap-6">
              
              {/* Column 1: Priority Tasks Feed & Custom Quick Input */}
              <div className="col-span-12 lg:col-span-7 space-y-6 text-left">
                
                <div className={`glass-panel p-6 rounded-2xl border transition-colors ${
                  darkCalmMode ? "bg-[#181822]/40" : "bg-white"
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#010047] dark:text-white">
                        AI-Sorted Priorities
                      </h3>
                      <p className="text-[11px] text-[#72749b]">Computed sequentially based on current focus vectors</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#72749b] bg-[#f5f2fb] dark:bg-white/5 px-2.5 py-1 rounded-full border border-[#efecf6] dark:border-white/5">
                      Updated 2m ago
                    </span>
                  </div>

                  {/* Task list list structure */}
                  <div className="space-y-3">
                    {filteredTasks.length === 0 ? (
                      <div className="py-12 text-center rounded-xl border border-dashed border-[#efecf6] bg-[#fbf8ff]/30">
                        <Inbox className="w-12 h-12 text-[#c7c5d4] mx-auto mb-2" />
                        <p className="text-sm font-sans text-[#72749b]">No active priority tasks matched your search query.</p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const isExpanded = expandedTaskId === task.id;
                        return (
                          <div 
                            key={task.id}
                            className={`group relative overflow-hidden rounded-xl border transition-all duration-300 ${
                              task.completed 
                                ? "opacity-60 bg-[#fbf8ff]/50 dark:bg-black/10 border-[#efecf6]/40" 
                                : isExpanded 
                                  ? "bg-white dark:bg-[#1c1c2b] shadow-md border-[#5054b1]" 
                                  : "bg-white/50 dark:bg-[#181822]/80 hover:bg-white dark:hover:bg-[#1c1c2b] border-[#efecf6] dark:border-white/5 hover:shadow-sm"
                            }`}
                          >
                            {/* Color Tag Indicator */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                              task.score >= 90 
                                ? "bg-rose-500" 
                                : task.score >= 70 
                                  ? "bg-[#5054b1]" 
                                  : "bg-[#72749b]"
                            }`} />

                            <div 
                              onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                              className="p-4 pl-6 flex items-center gap-4 cursor-pointer select-none"
                            >
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleTask(task.id);
                                }}
                                className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                  task.completed 
                                    ? "bg-[#5054b1] border-[#5054b1] text-white" 
                                    : "border-[#72749b] hover:border-[#5054b1]"
                                }`}
                              >
                                {task.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className={`font-sans text-xs font-bold truncate ${
                                  task.completed ? "line-through text-[#72749b]" : "text-[#010047] dark:text-white"
                                }`}>
                                  {task.title}
                                </p>
                                <p className="font-sans text-[11px] text-[#72749b] truncate mt-0.5">
                                  Goal Area: <span className="font-semibold text-[#010047] dark:text-[#bfc1ff]">{task.project}</span>
                                  {task.nextStep && <> &bull; Next: <span className="text-[#5054b1] dark:text-cyan-400 font-medium">{task.nextStep}</span></>}
                                </p>
                              </div>

                              <div className="flex items-center gap-4 shrink-0 text-right font-mono font-bold">
                                <div>
                                  <span className={`block text-xs uppercase tracking-wider ${
                                    task.completed 
                                      ? "text-[#c7c5d4]" 
                                      : task.score >= 90 ? "text-rose-600" : "text-[#5054b1] dark:text-[#bfc1ff]"
                                  }`}>
                                    Score: {task.score}
                                  </span>
                                  <div className="flex items-center justify-end gap-1 text-[9px] text-[#72749b] font-medium uppercase tracking-wider mt-0.5">
                                    <Clock className="w-3 h-3 text-current" />
                                    <span>{task.duration}</span>
                                  </div>
                                </div>

                                <button 
                                  onClick={(e) => handleDeleteTask(task.id, e)}
                                  className="text-[#72749b] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-rose-50/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Accordion AI Explanation Logic */}
                            {isExpanded && (
                              <div className="px-6 pb-4 pt-1 border-t border-[#efecf6]/40 dark:border-white/5 bg-[#fbf8ff]/60 dark:bg-black/10 text-xs">
                                <div className="space-y-2 mt-2">
                                  <div className="flex gap-2 p-3 bg-white dark:bg-[#181822] rounded-xl border border-[#efecf6] dark:border-white/5 shadow-inner">
                                    <Sparkles className="w-4.5 h-4.5 text-[#5054b1] shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-mono text-[9px] uppercase tracking-wider text-[#5054b1] dark:text-cyan-400 font-bold">Priority Diagnostic Explanation</p>
                                      <p className="text-[11px] leading-relaxed text-[#464652] dark:text-gray-300 font-sans mt-0.5">
                                        {task.explanation || "No dynamic priority analysis evaluated yet. Set goal bounds and request scoring advice to unlock counselor mapping."}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-4 pt-1 text-[11px] font-mono justify-between">
                                    <div>
                                      <span className="text-[#72749b]">Cognitive Overhead Class:</span>{" "}
                                      <span className="text-[#010047] dark:text-white font-bold">{task.cognitiveLoad}</span>
                                    </div>
                                    <div>
                                      <span className="text-[#72749b]">Action Path Guidance:</span>{" "}
                                      <span className="text-[#5054b1] dark:text-cyan-300 font-bold">100% Focused Block</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Custom Inline Input Box as requested */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const target = e.currentTarget.elements.namedItem("inlineTaskName") as HTMLInputElement;
                      if (target && target.value.trim()) {
                        handleDirectAdd(target.value);
                        target.value = "";
                      }
                    }}
                    className="mt-4 flex items-center gap-2"
                  >
                    <input 
                      id="inline-task-input"
                      name="inlineTaskName"
                      type="text" 
                      placeholder="+ Quick capture custom task onto your active schedule..."
                      className={`w-full px-4 py-2 border rounded-xl text-xs placeholder:text-[#bfc1ff] focus:outline-none focus:ring-2 focus:ring-[#5054b1] transition-all ${
                        darkCalmMode 
                          ? "bg-white/5 border-white/10 text-white focus:bg-[#1c1c2b]" 
                          : "bg-[#fbf8ff] border-[#efecf6] text-[#010047] focus:bg-white"
                      }`}
                    />
                    <button 
                      type="submit"
                      className="p-2 py-2 px-3.5 bg-[#efecf6] hover:bg-[#5054b1] text-[#010047] hover:text-white rounded-xl transition-all font-sans text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsCaptureModalOpen(true)}
                      className="p-2 bg-gradient-to-tr from-[#5054b1] to-[#bfc1ff] text-white rounded-xl font-sans text-xs font-semibold"
                      title="AI Parsing Interface Builder"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </form>

                </div>

                {/* Focus Blocks Interactive Controllers */}
                <div className="grid grid-cols-2 gap-4 text-left">
                  
                  {/* Card 1: Deep Work block */}
                  <div className={`glass-panel p-5 rounded-2xl border transition-colors ${
                    darkCalmMode ? "bg-[#181822]/40" : "bg-white"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-[#f5f2fb] dark:bg-white/5 rounded-xl text-[#5054b1]">
                        <Bolt className="w-5 h-5 text-current" />
                      </div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#5054b1] bg-[#e1e0ff] dark:bg-[#5054b1]/30 dark:text-cyan-400 px-2.5 py-0.5 rounded-full font-bold">
                        Recommended Now
                      </span>
                    </div>
                    <h4 className="font-display text-base font-bold text-[#010047] dark:text-white mb-1">
                      Deep Work Session
                    </h4>
                    <p className="text-[11px] text-[#72749b] leading-relaxed mb-4">
                      Lock your environment. Silences non-urgent triggers. Optimal for complex, rigorous alignment sprints.
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#efecf6]/40 dark:border-white/5">
                      <span className="font-mono text-xs font-bold text-[#010047] dark:text-[#bfc1ff]">
                        90 Minutes Timer
                      </span>
                      <button 
                        onClick={() => handleStartFocusTimer("deep-work")}
                        className="text-xs text-[#5054b1] hover:text-[#010047] dark:text-cyan-400 font-bold hover:underline py-1"
                      >
                        Start Session &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Active Rest break */}
                  <div className={`glass-panel p-5 rounded-2xl border transition-colors ${
                    darkCalmMode ? "bg-[#181822]/40" : "bg-white"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-[#f5f2fb] dark:bg-white/5 rounded-xl text-[#72749b]">
                        <Coffee className="w-5 h-5 text-current" />
                      </div>
                    </div>
                    <h4 className="font-display text-base font-bold text-[#010047] dark:text-white mb-1">
                      Active Rest Break
                    </h4>
                    <p className="text-[11px] text-[#72749b] leading-relaxed mb-4">
                      A visual timer for deliberate physical restoration. Walk, breathe, stretch to offset cumulative cortical load.
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-[#efecf6]/40 dark:border-white/5">
                      <span className="font-mono text-xs font-bold text-[#010047] dark:text-[#bfc1ff]">
                        15 Minutes Rest
                      </span>
                      <button 
                        onClick={() => handleStartFocusTimer("active-rest")}
                        className="text-xs text-[#72749b] hover:text-[#010047] dark:text-emerald-400 font-bold hover:underline py-1"
                      >
                        Take Break &rarr;
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* Column 2: Today's Interactive Schedule */}
              <div className="col-span-12 lg:col-span-5 text-left">
                <div className={`border p-6 rounded-2xl sticky top-24 shadow-sm transition-colors ${
                  darkCalmMode ? "bg-[#181822]/90 border-white/5" : "bg-white border-[#efecf6]"
                }`}>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#010047] dark:text-white">
                        Today's Schedule
                      </h3>
                      <p className="text-[11px] text-[#72749b]">Consolidated visual agenda context</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="p-1 hover:bg-[#efecf6] dark:hover:bg-white/10 rounded-full transition-colors text-[#72749b]">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-[#efecf6] dark:hover:bg-white/10 rounded-full transition-colors text-[#72749b]">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Vertical Timeline Track */}
                  <div className="relative space-y-4">
                    <div className="absolute left-[39px] top-2 bottom-2 w-0.5 bg-[#efecf6] dark:bg-white/10" />

                    {schedule.map((item) => {
                      const isNowBlock = item.isNow;
                      return (
                        <div 
                          key={item.id} 
                          className="flex gap-6 relative group"
                        >
                          {/* Hour tag label */}
                          <div className="w-10 text-right">
                            <span className={`font-mono text-[10px] font-semibold leading-none ${
                              isNowBlock ? "text-[#5054b1] dark:text-cyan-400" : "text-[#72749b]"
                            }`}>
                              {item.time}
                            </span>
                          </div>

                          {/* Interactive bullet status */}
                          <div className="absolute left-[35px] top-1.5 z-10">
                            {isNowBlock ? (
                              <div className="w-4.5 h-4.5 rounded-full bg-white dark:bg-[#181822] border-4 border-[#5054b1] shadow-sm animate-pulse flex items-center justify-center -translate-x-1" />
                            ) : (
                              <button 
                                onClick={() => handleToggleScheduleItem(item.id)}
                                className={`w-2 h-2 rounded-full ring-4 ring-white dark:ring-[#181822] transition-all ${
                                  item.completed 
                                    ? "bg-emerald-500 hover:ring-[#efecf6]" 
                                    : "bg-[#72749b]/40 hover:bg-[#5054b1]"
                                }`} 
                              />
                            )}
                          </div>

                          {/* Content Block Container */}
                          <div className="flex-1">
                            {isNowBlock ? (
                              <div className="border-t-2 border-[#5054b1] border-dashed pt-3 pb-1">
                                <p className="font-mono text-[10px] text-[#5054b1] dark:text-cyan-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                                  <span>Now Playing: Review Focus Block</span>
                                  <Sparkles className="w-3.5 h-3.5 animate-spin text-[#5054b1]" />
                                </p>
                              </div>
                            ) : (
                              <div className={`p-4 rounded-xl border transition-all duration-200 ${
                                item.completed 
                                  ? "bg-[#fbf8ff]/60 dark:bg-black/20 border-[#efecf6] dark:border-white/5 opacity-65" 
                                  : "bg-[#f5f2fb]/50 dark:bg-white/5 border-transparent hover:border-[#efecf6]"
                              }`}>
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <p className={`font-sans text-xs font-bold leading-tight ${
                                      item.completed ? "line-through text-[#72749b]" : "text-[#010047] dark:text-white"
                                    }`}>
                                      {item.title}
                                    </p>
                                    <p className="font-sans text-[11px] text-[#72749b] leading-tight mt-1">
                                      {item.subtitle}
                                    </p>
                                  </div>
                                  <button 
                                    onClick={() => handleToggleScheduleItem(item.id)}
                                    className="p-1 rounded hover:bg-[#efecf6] text-[#72749b] dark:hover:bg-white/10"
                                  >
                                    <Check className={`w-3.5 h-3.5 transition-opacity ${item.completed ? "text-emerald-500 opacity-100" : "opacity-30 group-hover:opacity-100"}`} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}

                  </div>

                  {/* Multi-Attendee Schedule Sub-Banner */}
                  <div className="mt-6 pt-6 border-t border-[#efecf6] dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        <img 
                          className="w-7 h-7 rounded-full border-2 border-white object-cover" 
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
                          alt="Colleague profile photo" 
                        />
                        <img 
                          className="w-7 h-7 rounded-full border-2 border-white object-cover" 
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" 
                          alt="Product manager profile photo" 
                        />
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-[#efecf6] text-[9px] flex items-center justify-center font-bold text-[#72749b]">
                          +3
                        </div>
                      </div>
                      <p className="font-sans text-[11px] text-[#72749b] italic">
                        Next shared session starts in 25 minutes.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. INBOX TRIAGE VIEW */}
        {activeTab === "inbox" && (
          <div className="max-w-[800px] mx-auto text-left space-y-6 pt-4">
            <div className="flex flex-col space-y-1">
              <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Brain-Dump Triage Studio</h3>
              <p className="text-sm text-[#72749b]">
                Dump unstructured thoughts, unformatted bullet strings, or transcripts. We configure precise scores, project alignment, duration bounds, and sequence them instantly.
              </p>
            </div>

            <div className={`glass-panel p-6 rounded-2xl border ${darkCalmMode ? "bg-[#181822]/60" : "bg-white"}`}>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#5054b1] mb-2 font-bold">Unformatted Brain-Dump Dumpster</label>
              <textarea 
                className={`w-full h-44 rounded-xl p-4 text-xs font-sans border focus:outline-none focus:ring-2 focus:ring-[#5054b1] resize-none ${
                  darkCalmMode ? "bg-white/5 border-white/10 text-white" : "bg-[#fbf8ff] border-[#efecf6]"
                }`}
                placeholder="e.g. need to finish analyzing the design parameters today, probably takes about an hour under management essentials project..."
                value={inboxText}
                onChange={(e) => setInboxText(e.target.value)}
              />
              
              <div className="flex justify-between items-center mt-4">
                <span className="text-[10px] text-[#72749b] font-mono">
                  Characters typed: <span className="text-[#5054b1] font-semibold">{inboxText.length}</span>
                </span>
                
                <button
                  onClick={() => handleParseRawText(inboxText, true)}
                  disabled={triageLoading || !inboxText.trim()}
                  className="flex items-center gap-2 bg-[#5054b1] hover:bg-[#373b97] disabled:bg-gray-400 text-white text-xs font-bold font-sans py-2 px-5 rounded-xl transition-all shadow"
                >
                  {triageLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-current" />
                      <span>Gemini prioritizing task...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>Parse Priorities & Save</span>
                    </>
                  )}
                </button>
              </div>

              {triageFeedback && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="font-medium">{triageFeedback}</p>
                </div>
              )}
            </div>

            {/* Quick Inbox List stats */}
            <div className="space-y-3">
              <h4 className="font-display text-sm font-bold text-[#010047] dark:text-white">Processed Tasks Stream ({tasks.length})</h4>
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-white/40 dark:bg-white/5 border border-[#efecf6] dark:border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-[#010047] dark:text-white">{t.title}</p>
                      <p className="text-[10px] text-[#72749b] mt-0.5">Project: {t.project} &bull; Score: {t.score} &bull; Load: {t.cognitiveLoad}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#efecf6] dark:bg-white/10 font-mono text-[9px] text-[#72749b]">{t.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. FOCUS TIMER & PLANNER VIEW */}
        {activeTab === "planner" && (
          <div className="max-w-[1200px] mx-auto text-left space-y-6 pt-4">
            
            {/* PAGE HEADER */}
            <div className="flex flex-col space-y-1">
              <h2 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Your Planner</h2>
              <p className="text-sm text-[#72749b]">
                Manage tasks, deadlines, meetings, and focus sessions in one unified schedule.
              </p>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Left Column - 70% (8 cols) - Weekly Calendar View */}
              <div className="col-span-12 lg:col-span-8 space-y-4">
                
                {/* Calendar Workspace Controls */}
                <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 transition-colors ${
                  darkCalmMode ? "bg-[#181822]/90 border-white/10" : "bg-white border-[#efecf6]"
                }`}>
                  {/* View Toggles */}
                  <div className="flex bg-[#f5f2fb] dark:bg-white/5 p-1 rounded-xl">
                    {(["day", "week", "month"] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setPlannerView(view)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          plannerView === view
                            ? "bg-white dark:bg-[#1c1c2b] text-[#010047] dark:text-white shadow-sm"
                            : "text-[#72749b] hover:text-[#010047] dark:hover:text-white"
                        }`}
                      >
                        {view} View
                      </button>
                    ))}
                  </div>

                  {/* Calendar Source Indicators/Toggles */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Visible Calendars:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer font-sans text-gray-600 dark:text-gray-300">
                      <input 
                        type="checkbox" 
                        checked={!isCalendarConnected || connectedSources.includes("google")} 
                        disabled={!isCalendarConnected}
                        onChange={() => {
                          if (connectedSources.includes("google")) {
                            setConnectedSources(prev => prev.filter(s => s !== "google"));
                          } else {
                            setConnectedSources(prev => [...prev, "google"]);
                          }
                        }}
                        className="w-3.5 h-3.5 accent-[#5054b1]" 
                      />
                      <span>Google</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-sans text-gray-600 dark:text-gray-300">
                      <input 
                        type="checkbox" 
                        checked={!isCalendarConnected || connectedSources.includes("outlook")} 
                        disabled={!isCalendarConnected}
                        onChange={() => {
                          if (connectedSources.includes("outlook")) {
                            setConnectedSources(prev => prev.filter(s => s !== "outlook"));
                          } else {
                            setConnectedSources(prev => [...prev, "outlook"]);
                          }
                        }}
                        className="w-3.5 h-3.5 accent-cyan-500" 
                      />
                      <span>Outlook</span>
                    </label>
                  </div>
                </div>

                {/* Main Calendar Grid Area */}
                <div className="relative min-h-[600px] rounded-2xl overflow-hidden border border-[#efecf6] dark:border-white/5">
                  
                  {/* Background Calendar Grid (Faded when disconnected) */}
                  <div className={`p-6 w-full h-full flex flex-col transition-all duration-300 ${
                    !isCalendarConnected ? "opacity-25 blur-[1px]" : "opacity-100"
                  } ${
                    darkCalmMode ? "bg-[#181822]/40" : "bg-white"
                  }`}>
                    {plannerView === "week" && (
                      <div className="flex-1 flex flex-col space-y-4">
                        {/* Days Header */}
                        <div className="grid grid-cols-5 gap-4 border-b border-gray-100 dark:border-white/5 pb-3">
                          {["MON", "TUE", "WED", "THU", "FRI"].map((day, i) => (
                            <div key={day} className="text-center font-mono text-[10px] text-gray-400 font-bold">
                              {day}<br/>
                              <span className="text-xs font-sans text-gray-600 dark:text-gray-300 font-normal">June {22 + i}</span>
                            </div>
                          ))}
                        </div>

                        {/* Unified Timeline Grid Columns */}
                        <div className="grid grid-cols-5 gap-4 flex-1">
                          
                          {/* MONDAY COLUMN */}
                          <div className="space-y-3">
                            {connectedSources.includes("google") && (
                              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-blue-500">Google Calendar</span>
                                <span className="font-bold block mt-0.5">Strategic Alignment</span>
                                <span className="text-[10px] block mt-0.5">09:00 AM - 10:30 AM</span>
                              </div>
                            )}

                            {(!appliedOptimizations.includes("deepFocus") && !appliedOptimizations.includes("optimizeWeek")) ? (
                              <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-amber-500 font-bold">Task (Conflict Warning)</span>
                                <span className="font-bold block mt-0.5">Weekly Review</span>
                                <span className="text-[10px] block mt-0.5">10:00 AM</span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400 text-center text-[10px]">
                                Weekly Review Rescheduled
                              </div>
                            )}

                            {connectedSources.includes("outlook") && (
                              <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-cyan-500">Outlook</span>
                                <span className="font-bold block mt-0.5">Project Sync</span>
                                <span className="text-[10px] block mt-0.5">
                                  {appliedOptimizations.includes("optimizeWeek") ? "04:00 PM" : "02:00 PM"}
                                </span>
                              </div>
                            )}

                            {(appliedOptimizations.includes("deepFocus") || appliedOptimizations.includes("optimizeWeek")) && (
                              <div className="p-3 rounded-xl border border-[#5054b1]/20 bg-[#5054b1]/5 text-[#5054b1] dark:text-[#bfc1ff] text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-[#5054b1]">AI Focus Block</span>
                                <span className="font-bold block mt-0.5">Weekly Review</span>
                                <span className="text-[10px] block mt-0.5">04:00 PM</span>
                              </div>
                            )}
                          </div>

                          {/* TUESDAY COLUMN */}
                          <div className="space-y-3">
                            {(appliedOptimizations.includes("energyMismatch") || appliedOptimizations.includes("optimizeWeek")) && (
                              <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-indigo-500 font-bold">Optimized Task</span>
                                <span className="font-bold block mt-0.5">Complex Report</span>
                                <span className="text-[10px] block mt-0.5">09:00 AM</span>
                              </div>
                            )}

                            {connectedSources.includes("google") && (
                              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-blue-500">Google Calendar</span>
                                <span className="font-bold block mt-0.5">Client Feedback Review</span>
                                <span className="text-[10px] block mt-0.5">11:00 AM - 12:00 PM</span>
                              </div>
                            )}

                            {(!appliedOptimizations.includes("energyMismatch") && !appliedOptimizations.includes("optimizeWeek")) ? (
                              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-rose-500">Energy Mismatch</span>
                                <span className="font-bold block mt-0.5">Complex Report</span>
                                <span className="text-[10px] block mt-0.5">05:00 PM</span>
                              </div>
                            ) : (
                              appliedOptimizations.includes("energyMismatch") && (
                                <div className="p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-gray-400 text-center text-[10px]">
                                  Moved to peak energy block
                                </div>
                              )
                            )}
                          </div>

                          {/* WEDNESDAY COLUMN */}
                          <div className="space-y-3">
                            {(appliedOptimizations.includes("unscheduledTask") || appliedOptimizations.includes("optimizeWeek")) ? (
                              <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-purple-500 font-bold">AI Scheduled Task</span>
                                <span className="font-bold block mt-0.5">Portfolio Review</span>
                                <span className="text-[10px] block mt-0.5">10:00 AM</span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-white/5 text-gray-300 dark:text-gray-600 text-center text-[10px] italic">
                                No slots scheduled
                              </div>
                            )}

                            {connectedSources.includes("outlook") && (
                              <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-cyan-500 font-bold">Outlook</span>
                                <span className="font-bold block mt-0.5">Creative Brainstorming</span>
                                <span className="text-[10px] block mt-0.5">01:00 PM - 02:30 PM</span>
                              </div>
                            )}
                          </div>

                          {/* THURSDAY COLUMN */}
                          <div className="space-y-3">
                            {(appliedOptimizations.includes("deadlineRisk") || appliedOptimizations.includes("optimizeWeek")) ? (
                              <div className="p-3 rounded-xl border border-[#5054b1]/20 bg-[#5054b1]/5 text-[#5054b1] dark:text-[#bfc1ff] text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-[#5054b1]">AI Focus Block</span>
                                <span className="font-bold block mt-0.5">UX Audit Preparation</span>
                                <span className="text-[10px] block mt-0.5">10:00 AM - 12:00 PM</span>
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl border border-dashed border-gray-200 dark:border-white/5 text-gray-300 dark:text-gray-600 text-center text-[10px] italic">
                                No slots scheduled
                              </div>
                            )}
                          </div>

                          {/* FRIDAY COLUMN */}
                          <div className="space-y-3">
                            {(appliedOptimizations.includes("deadlineRisk") || appliedOptimizations.includes("optimizeWeek")) && (
                              <div className="p-3 rounded-xl border border-[#5054b1]/20 bg-[#5054b1]/5 text-[#5054b1] dark:text-[#bfc1ff] text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-[#5054b1]">AI Focus Block</span>
                                <span className="font-bold block mt-0.5">UX Audit Preparation</span>
                                <span className="text-[10px] block mt-0.5">11:00 AM - 01:00 PM</span>
                              </div>
                            )}

                            {appliedOptimizations.includes("recoveryBuffer") && (
                              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-emerald-500">Recovery Buffer</span>
                                <span className="font-bold block mt-0.5">Reserved Downtime</span>
                                <span className="text-[10px] block mt-0.5">02:00 PM - 03:30 PM</span>
                              </div>
                            )}

                            {connectedSources.includes("notion") && (
                              <div className="p-3 rounded-xl border border-pink-500/20 bg-pink-500/5 text-pink-600 dark:text-pink-400 text-xs">
                                <span className="text-[9px] font-mono uppercase tracking-wider block font-bold text-pink-500 font-bold">Notion Deadline</span>
                                <span className="font-bold block mt-0.5">UX Audit Due</span>
                                <span className="text-[10px] block mt-0.5">05:00 PM</span>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {plannerView === "day" && (
                      <div className="space-y-4">
                        <div className="font-bold text-sm text-[#010047] dark:text-white border-b pb-2">Monday, June 22</div>
                        <div className="space-y-2.5">
                          <div className="flex gap-4 p-3 rounded-lg bg-blue-500/5 text-blue-600 text-xs">
                            <span className="font-mono w-20 text-right">09:00 AM</span>
                            <span>Google Calendar: Strategic Alignment Meeting</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {plannerView === "month" && (
                      <div className="grid grid-cols-7 gap-2 text-center text-xs">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                          <div key={d} className="font-bold font-mono text-gray-400">{d}</div>
                        ))}
                        {Array.from({ length: 30 }).map((_, i) => (
                          <div key={i} className="p-4 border border-gray-100 dark:border-white/5 rounded-lg text-center text-gray-300">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Empty Calendar State Overlay */}
                  {!isCalendarConnected && (
                    <div className="absolute inset-0 flex items-center justify-center p-6 bg-transparent z-10">
                      <div className={`p-8 rounded-2xl border shadow-xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 ${
                        darkCalmMode 
                          ? "bg-[#181822] border-white/10 text-white" 
                          : "bg-white border-[#efecf6] text-[#010047]"
                      }`}>
                        {isConnecting ? (
                          /* Connecting State */
                          <div className="py-6 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-10 h-10 text-[#5054b1] animate-spin" />
                            <div>
                              <h4 className="font-display font-bold text-sm">Authorizing OAuth Integration...</h4>
                              <p className="text-[11px] text-gray-400 mt-1">Connecting account securely using secure callbacks</p>
                            </div>
                          </div>
                        ) : !showConnectionMenu ? (
                          /* Primary Onboarding State */
                          <>
                            <div className="w-14 h-14 rounded-full bg-[#f5f2fb] dark:bg-white/5 flex items-center justify-center text-[#72749b] mx-auto">
                              <Calendar className="w-6 h-6 text-current" />
                            </div>

                            <div className="space-y-2">
                              <h3 className="font-display font-bold text-base">Connect calendar for view</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-4">
                                Connect your Google Calendar or Outlook Calendar to view events, meetings, deadlines, and AI scheduled focus blocks.
                              </p>
                            </div>

                            <button
                              onClick={() => setShowConnectionMenu(true)}
                              className="px-6 py-2.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-xl font-sans text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px]"
                            >
                              Connect Calendar
                            </button>
                          </>
                        ) : (
                          /* Connection Submenu Options */
                          <>
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-white/5">
                              <h4 className="font-display font-bold text-sm text-[#010047] dark:text-white">Connect Calendar Service</h4>
                              <button 
                                onClick={() => setShowConnectionMenu(false)}
                                className="p-1 hover:bg-black/10 rounded-full text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-4 pt-2 text-left">
                              {/* Google Calendar option */}
                              <div className="p-4 border border-[#efecf6] dark:border-white/10 rounded-xl bg-white dark:bg-[#1f1f2e] space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="font-bold text-xs text-gray-800 dark:text-white">Google Calendar</span>
                                  </div>
                                  <span className="text-[9px] bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">OAuth 2.0</span>
                                </div>
                                <div className="space-y-1 pl-3 border-l-2 border-blue-500/20">
                                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Permissions requested:</p>
                                  <div className="space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Read Events</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Create Events</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Update Events</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setIsConnecting(true);
                                    setTimeout(() => {
                                      setIsConnecting(false);
                                      setIsCalendarConnected(true);
                                      setConnectedSources(["google"]);
                                      setShowConnectionMenu(false);
                                    }, 1200);
                                  }}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                                >
                                  <span>Connect Google Calendar</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Outlook Calendar option */}
                              <div className="p-4 border border-[#efecf6] dark:border-white/10 rounded-xl bg-white dark:bg-[#1f1f2e] space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                                    <span className="font-bold text-xs text-gray-800 dark:text-white">Outlook Calendar</span>
                                  </div>
                                  <span className="text-[9px] bg-cyan-500/10 text-cyan-600 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">OAuth 2.0</span>
                                </div>
                                <div className="space-y-1 pl-3 border-l-2 border-cyan-500/20">
                                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Permissions requested:</p>
                                  <div className="space-y-0.5 text-[11px] text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Read Events</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Create Events</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      <span>Update Events</span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setIsConnecting(true);
                                    setTimeout(() => {
                                      setIsConnecting(false);
                                      setIsCalendarConnected(true);
                                      setConnectedSources(["outlook"]);
                                      setShowConnectionMenu(false);
                                    }, 1200);
                                  }}
                                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                                >
                                  <span>Connect Outlook Calendar</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Right Column - 30% (4 cols / ~320px width) - AI suggestions panel */}
              <div className="col-span-12 lg:col-span-4 w-full max-w-[340px] space-y-6">
                
                <div className={`p-5 rounded-2xl border transition-all h-full flex flex-col ${
                  darkCalmMode ? "bg-[#181822] border-white/10" : "bg-white border-[#efecf6]"
                }`}>
                  <h4 className="font-display font-bold text-sm text-[#010047] dark:text-white border-b pb-3 mb-4 text-left">
                    AI Suggestions
                  </h4>

                  {!isCalendarConnected ? (
                    /* Suggestions Empty Onboarding State */
                    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-[#5054b1]/10 flex items-center justify-center text-[#5054b1]">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <h5 className="font-display font-bold text-xs text-gray-800 dark:text-white">AI suggestions will appear here</h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed">
                          Once your calendar is connected, AI will analyze your schedule and provide smart recommendations to optimize productivity.
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Connected Active AI Recommendations */
                    <div className="space-y-5 text-left">
                      
                      {/* Action Area CTAs */}
                      <div className="space-y-2 border-b border-gray-100 dark:border-white/5 pb-4">
                        {appliedOptimizations.includes("optimizeWeek") ? (
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                            <Check className="w-4 h-4" strokeWidth={3} />
                            <span>Week Optimized Successfully</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setAppliedOptimizations(prev => [...prev, "optimizeWeek", "deepFocus", "energyMismatch", "unscheduledTask", "deadlineRisk"]);
                            }}
                            className="w-full py-2.5 px-4 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow transition-all active:scale-95"
                          >
                            <Sparkles className="w-4 h-4 text-cyan-300" />
                            <span>Optimize My Week</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setAppliedOptimizations(prev => [...prev, "recoveryBuffer"]);
                          }}
                          className={`w-full py-2 px-4 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                            appliedOptimizations.includes("recoveryBuffer")
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                              : "border-[#efecf6] dark:border-white/10 hover:bg-black/5 text-[#5054b1] dark:text-[#bfc1ff]"
                          }`}
                        >
                          <Coffee className="w-4 h-4 text-emerald-500" />
                          <span>{appliedOptimizations.includes("recoveryBuffer") ? "Recovery Buffer Reserved" : "Create Recovery Buffer"}</span>
                        </button>
                      </div>

                      {/* Proactive recommendation cards list */}
                      <div className="space-y-4 overflow-y-auto max-h-[480px] pr-1">
                        
                        {/* 1. Deep Focus Conflict */}
                        {!appliedOptimizations.includes("deepFocus") && !appliedOptimizations.includes("optimizeWeek") && (
                          <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-rose-500/[0.02]">
                            <div className="flex items-center gap-1.5 text-rose-500 font-bold border-b border-rose-500/10 pb-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Problem: Deep Focus Conflict</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                              <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                                Your Weekly Review overlaps with a protected focus block.
                              </p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                              <span className="font-semibold block text-[#5054b1] dark:text-cyan-400">Recommendation:</span> Move Weekly Review to 4 PM.
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                              <span>Impact: +90 min focus</span>
                              <button
                                onClick={() => setAppliedOptimizations(prev => [...prev, "deepFocus"])}
                                className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded font-bold cursor-pointer font-sans"
                              >
                                Apply Change
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Energy Mismatch */}
                        {!appliedOptimizations.includes("energyMismatch") && !appliedOptimizations.includes("optimizeWeek") && (
                          <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-amber-500/[0.02]">
                            <div className="flex items-center gap-1.5 text-amber-500 font-bold border-b border-amber-500/10 pb-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Problem: Energy Mismatch</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                              <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                                Complex report scheduled at 5 PM. Historical data shows analytical performance drops after 4 PM.
                              </p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                              <span className="font-semibold block text-amber-500">Recommendation:</span> Move to tomorrow at 9 AM.
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                              <span>Impact: 18% faster speed</span>
                              <button
                                onClick={() => setAppliedOptimizations(prev => [...prev, "energyMismatch"])}
                                className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded font-bold cursor-pointer font-sans"
                              >
                                Accept Recommendation
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 3. Unscheduled Task */}
                        {!appliedOptimizations.includes("unscheduledTask") && !appliedOptimizations.includes("optimizeWeek") && (
                          <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-[#5054b1]/[0.02]">
                            <div className="flex items-center gap-1.5 text-[#5054b1] dark:text-[#bfc1ff] font-bold border-b border-[#5054b1]/10 pb-1">
                              <Sparkles className="w-4 h-4" />
                              <span>Problem: Unscheduled Task</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                              <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                                Portfolio Review has no scheduled work session.
                              </p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                              <span className="font-semibold block text-[#5054b1] dark:text-[#bfc1ff]">Recommendation:</span> Schedule Automatically for Wed 10 AM.
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                              <span>Impact: Clear focus slot</span>
                              <button
                                onClick={() => setAppliedOptimizations(prev => [...prev, "unscheduledTask"])}
                                className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded font-bold cursor-pointer font-sans"
                              >
                                Schedule Automatically
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 4. Deadline Risk */}
                        {!appliedOptimizations.includes("deadlineRisk") && !appliedOptimizations.includes("optimizeWeek") && (
                          <div className="p-4 rounded-xl border border-[#efecf6] dark:border-white/5 space-y-2.5 text-xs bg-rose-500/[0.02]">
                            <div className="flex items-center gap-1.5 text-rose-500 font-bold border-b border-rose-500/10 pb-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Problem: Deadline Risk</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-400 text-[10px] uppercase font-mono tracking-wider font-semibold">Explanation</p>
                              <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                                UX Audit due Friday. Current schedule provides only 1.5 hours of focus time.
                              </p>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-[10px] leading-tight border border-gray-100 dark:border-white/5">
                              <span className="font-semibold block text-[#5054b1] dark:text-cyan-400">Recommendation:</span> Create two additional focus blocks (4 hours total).
                            </div>
                            <div className="flex justify-between items-center text-[10px] pt-1 text-gray-400 font-mono">
                              <span>Impact: Meets deadline</span>
                              <button
                                onClick={() => setAppliedOptimizations(prev => [...prev, "deadlineRisk"])}
                                className="px-2.5 py-1.5 bg-[#5054b1] hover:bg-[#373b97] text-white rounded-lg font-bold cursor-pointer font-sans"
                              >
                                Create Schedule
                              </button>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Disconnect trigger */}
                      <button
                        onClick={() => {
                          setIsCalendarConnected(false);
                          setConnectedSources([]);
                          setAppliedOptimizations([]);
                        }}
                        className="w-full text-center text-xs text-gray-400 hover:text-rose-500 transition-colors py-2 border border-dashed border-gray-200 dark:border-white/5 rounded-xl cursor-pointer"
                      >
                        Disconnect Calendars
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </div>
          </div>
        )}


        {/* 4. GOALS VIEW */}
        {activeTab === "goals" && (
          <div className="max-w-[900px] mx-auto text-left space-y-6 pt-4">
            <div className="flex flex-col space-y-1">
              <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Active Operational Targets</h3>
              <p className="text-sm text-[#72749b]">Sync targets to balance task prioritizations against broad critical objectives.</p>
            </div>

            {/* Goal targets alignment meters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {goals.map(g => (
                <div key={g.id} className={`p-5 rounded-2xl border transition-all ${
                  darkCalmMode ? "bg-[#181822]/90" : "bg-white shadow-sm"
                }`}>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <span className="text-[10px] font-mono text-[#5054b1] bg-[#e1e0ff] dark:bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                      {g.project}
                    </span>
                    {g.targetDate && (
                      <span className="text-[10px] text-[#72749b] font-mono">{g.targetDate}</span>
                    )}
                  </div>
                  <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white leading-tight min-h-[32px]">
                    {g.name}
                  </h4>
                  
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#72749b]">Goal Progress</span>
                      <span className="text-[#5054b1] font-bold">{g.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#efecf6] dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#5054b1] rounded-full" style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>

                  {g.metric && (
                    <p className="text-[10px] font-mono text-[#72749b] uppercase tracking-wider mt-3 font-medium bg-[#f5f2fb]/50 dark:bg-black/20 p-2 rounded-lg">
                      Key Result: {g.metric}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Goal Target Section */}
            <div className={`p-6 rounded-2xl border ${
              darkCalmMode ? "bg-[#181822]/40" : "bg-white"
            }`}>
              <h4 className="font-display font-bold text-sm text-[#010047] dark:text-white mb-4">Establish New Operational Objective</h4>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const name = (target.elements.namedItem("gName") as HTMLInputElement).value;
                  const project = (target.elements.namedItem("gProj") as HTMLInputElement).value;
                  const metric = (target.elements.namedItem("gMetric") as HTMLInputElement).value;
                  const date = (target.elements.namedItem("gDate") as HTMLInputElement).value;
                  
                  if (!name.trim()) return;

                  const newGoal: Goal = {
                    id: `goal-${Date.now()}`,
                    name,
                    project: project || "General",
                    progress: 10,
                    targetDate: date || "2026-08-31",
                    metric: metric || "Milestone progress complete"
                  };
                  setGoals(prev => [...prev, newGoal]);
                  target.reset();
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans"
              >
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] text-zinc-500 font-mono">Objective Statement</label>
                  <input required name="gName" type="text" placeholder="e.g. Finish UX Evaluation Audit" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono">Goal Area Group</label>
                  <input name="gProj" type="text" placeholder="e.g. UX Audit" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono">Metric Tracking Indicator</label>
                  <input name="gMetric" type="text" placeholder="e.g. 5 interviews done" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 font-mono">Target Deadline Date</label>
                  <input name="gDate" type="date" className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6]" />
                </div>
                
                <div className="md:col-span-4 text-right pt-2">
                  <button type="submit" className="bg-[#5054b1] hover:bg-[#373b97] text-white text-xs font-semibold px-6 py-2 rounded-xl transition-all">
                    Register Goal Area
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* 5. ANALYTICS INSIGHTS VIEW */}
        {activeTab === "insights" && (
          <div className="max-w-[850px] mx-auto text-left space-y-6 pt-4">
            <div className="flex flex-col space-y-1">
              <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">Active Calm Cognitive Telemetry</h3>
              <p className="text-sm text-[#72749b]">Observe visual indicators mapping deep focus concentration blocks vs deliberate restorative active rest intervals.</p>
            </div>

            {/* Static high-accuracy customized SVG chart visualization */}
            <div className={`p-6 rounded-2xl border ${
              darkCalmMode ? "bg-[#181822]/90" : "bg-white shadow-sm"
            }`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white">Cognitive Reserve Index Mapping (Past 7 Days)</h4>
                  <p className="text-[10px] text-[#72749b]">Shows the correlation of deep work hours vs systemic cognitive recovery</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#5054b1] font-bold bg-[#e1e0ff] dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                  High alignment index
                </span>
              </div>

              {/* Vector SVG bar chart representation */}
              <div className="relative pt-4">
                <svg viewBox="0 0 700 250" className="w-full h-auto text-gray-400">
                  {/* Grid Lines */}
                  <line x1="50" y1="50" x2="650" y2="50" stroke="#efecf6" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50" y1="125" x2="650" y2="125" stroke="#efecf6" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50" y1="200" x2="650" y2="200" stroke="#efecf6" strokeWidth="1" />

                  {/* Left Axis */}
                  <text x="20" y="55" className="text-[9px] font-mono fill-zinc-400">100%</text>
                  <text x="20" y="130" className="text-[9px] font-mono fill-zinc-400">50%</text>
                  <text x="20" y="205" className="text-[9px] font-mono fill-zinc-400">0%</text>

                  {/* Render 7 Days bars */}
                  {initialInsights.map((day, idx) => {
                    const xCenter = 90 + idx * 80;
                    const maxBarHeight = 150;
                    const deepHeight = (day.deepWorkMins / 180) * maxBarHeight;
                    const restHeight = (day.activeRestMins / 90) * maxBarHeight;

                    return (
                      <g key={day.date}>
                        {/* Deep Work Bar */}
                        <rect 
                          x={xCenter - 15} 
                          y={200 - deepHeight} 
                          width="12" 
                          height={deepHeight} 
                          fill="#5054b1" 
                          className="transition-all hover:opacity-85"
                          rx="3"
                        />
                        {/* Active Rest Bar */}
                        <rect 
                          x={xCenter + 2} 
                          y={200 - restHeight} 
                          width="12" 
                          height={restHeight} 
                          fill="#10b981" 
                          className="transition-all hover:opacity-85"
                          rx="3"
                        />
                        {/* Day Text Label */}
                        <text x={xCenter} y="222" className="text-[10px] font-mono font-bold text-[#72749b] text-center" textAnchor="middle">
                          {day.date}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend Indicators */}
                <div className="flex items-center justify-center gap-6 mt-4 text-[10px] font-mono uppercase tracking-wider font-bold">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#5054b1] rounded-sm" />
                    <span>Deep Work Mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#10b981] rounded-sm" />
                    <span>Restoration Buffers Mins</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance analysis readout card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-[#5054b1] to-[#373b97] text-white space-y-2">
                <Sparkles className="w-6 h-6 text-cyan-300" />
                <h4 className="font-display font-medium text-xs">Dynamic Focus Diagnostic Alignment</h4>
                <p className="text-xs leading-relaxed opacity-90">
                  "Your active cognitive alignment indicates optimal deep focus stamina during morning blocks of mid-week, matching steady adrenaline indicators securely."
                </p>
              </div>

              <div className="p-5 rounded-2xl border bg-white space-y-2 text-[#464652]">
                <h4 className="font-sans font-bold text-xs text-[#010047]">Cortical Buffer Rest Assessment</h4>
                <p className="text-xs leading-relaxed">
                  "Buffer intervals remained steady at 35 mins. Maintaining a 1:5 ratio of active rest to deep concentration is highly recommended to eliminate executive burnouts."
                </p>
              </div>
            </div>

          </div>
        )}

        {/* 6. SETTINGS VIEW */}
        {activeTab === "settings" && (
          <div className="max-w-[700px] mx-auto text-left space-y-6 pt-4">
            <div className="flex flex-col space-y-1">
              <h3 className="font-display text-2xl font-bold text-[#010047] dark:text-white">App Settings & Customization</h3>
              <p className="text-sm text-[#72749b]">Configure profile options, default task durations, or change client settings.</p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-6 ${
              darkCalmMode ? "bg-[#181822]/90 text-white" : "bg-white"
            }`}>
              
              {/* User settings parameters */}
              <div className="space-y-4">
                <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white uppercase tracking-wider">User Identity</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Profile Username</label>
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)} 
                      className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6]"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Account Type Status</label>
                    <div className="flex items-center justify-between p-2.5 border rounded-lg border-[#efecf6] bg-[#f5f2fb]/50 dark:bg-black/20">
                      <span className="font-bold text-[#5054b1] dark:text-[#bfc1ff]">Executive Pro Account</span>
                      <Award className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Focus parameters defaults */}
              <div className="space-y-4 pt-6 border-t border-[#efecf6] dark:border-white/5">
                <h4 className="font-sans font-bold text-xs text-[#010047] dark:text-white uppercase tracking-wider">Focus Custom Parameters</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Default Work Cycle Length</label>
                    <select className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:bg-[#181822]">
                      <option className="text-black" value="45">45 Minutes</option>
                      <option className="text-black" value="60">60 Minutes</option>
                      <option className="text-black" value="90">90 Minutes (Recommended)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider block">Default Break Rest Length</label>
                    <select className="w-full p-2.5 border rounded-lg bg-transparent border-[#efecf6] dark:bg-[#181822]">
                      <option className="text-black" value="10">10 Minutes</option>
                      <option className="text-black" value="15">15 Minutes (Recommended)</option>
                      <option className="text-black" value="25">25 Minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Developer / reset control bounds */}
              <div className="space-y-4 pt-6 border-t border-rose-100">
                <h4 className="font-sans font-bold text-xs text-rose-500 uppercase tracking-wider">Experimental Recovery Actions</h4>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-xs text-[#72749b]">Reset cached local tasks metadata to return to default initial mockups.</p>
                  <button 
                    onClick={() => {
                      if (confirm("Reset current cached priority lists back to mock state?")) {
                        localStorage.removeItem("lifesaver_tasks");
                        localStorage.removeItem("lifesaver_goals");
                        localStorage.removeItem("lifesaver_schedule");
                        window.location.reload();
                      }
                    }}
                    className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs px-5 py-2 rounded-xl transition-all font-semibold font-sans"
                  >
                    Reset System Data
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 7. INTELLIGENT CAPTURE TASK MODAL OVERLAY */}
      {/* ======================================================== */}
      {isCaptureModalOpen && (
        <div className="fixed inset-0 bg-[#010047]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#181822] rounded-2xl w-full max-w-[600px] border border-[#efecf6] dark:border-white/10 shadow-2xl p-6 text-left relative transition-all animate-in zoom-in-95 duration-200">
            
            <button 
              onClick={() => setIsCaptureModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-[#efecf6] dark:hover:bg-white/10 rounded-full transition-all text-[#72749b]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#5054b1] animate-bounce" />
              <h3 className="font-display text-lg font-bold text-[#010047] dark:text-white">AI-Scored Task Capturing</h3>
            </div>

            {/* AI Parsing raw input box */}
            <div className="p-4 rounded-xl bg-gradient-to-tr from-[#f5f2fb] to-white dark:from-[#1c1c2b] dark:to-[#181822] border border-[#efecf6] dark:border-white/5 space-y-2 mb-4">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#5054b1] dark:text-cyan-400 font-bold">Unstructured Sentence priorities parsing</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. need to write a performance summary for UX Audit before Friday afternoon..."
                  value={rawDumpInput}
                  onChange={(e) => setRawDumpInput(e.target.value)}
                  className="w-full text-xs font-sans px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#5054b1] bg-white dark:bg-[#101018] dark:border-white/10 text-white"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleParseRawText(rawDumpInput);
                    }
                  }}
                />
                <button 
                  type="button" 
                  onClick={() => handleParseRawText(rawDumpInput)}
                  className="bg-[#5054b1] hover:bg-[#373b97] text-white p-2 px-4 rounded-lg font-sans text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  {parserRunning ? (
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <span>Analyze Sentence</span>
                  )}
                </button>
              </div>
            </div>

            {/* Manual adjustment attributes inputs */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider">Actionable Task Title</label>
                <input 
                  type="text" 
                  placeholder="Action Item Goal" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-transparent text-xs text-[#010047] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider">Goal / Project Bounds</label>
                  <select 
                    value={newTaskGoalProject}
                    onChange={(e) => setNewTaskGoalProject(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-transparent text-xs text-black"
                  >
                    <option value="General">General Context</option>
                    <option value="Management Essentials">Management Essentials</option>
                    <option value="UX Audit">UX Audit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[#72749b] font-mono uppercase tracking-wider">Estimated Pacing Duration</label>
                  <input 
                    type="text" 
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="e.g. 45m, 1h, 2h"
                    className="w-full p-2.5 border rounded-lg bg-transparent text-xs text-black"
                  />
                </div>
              </div>

              {/* Live Preview priority dynamic score output feedback */}
              {parsedPreview && (
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-950 text-xs flex justify-between items-center animate-in fade-in-50 duration-200">
                  <div>
                    <span className="block font-bold text-emerald-900">Computed Priority: Score {parsedPreview.score}</span>
                    <span className="text-[10px] text-zinc-600 block mt-0.5">Diagnosed Overload class: {parsedPreview.cognitiveLoad}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-700 text-white font-mono rounded-full text-[9px] uppercase tracking-wider font-bold">Awesome match</span>
                </div>
              )}

              {/* Submit triggers action container */}
              <div className="pt-4 border-t border-[#efecf6] dark:border-white/5 flex justify-end gap-3">
                <button 
                  onClick={() => setIsCaptureModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-[#efecf6] text-[#72749b] text-xs hover:bg-[#efecf6] transition-all font-semibold font-sans bg-transparent"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddNewTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-6 py-2 rounded-xl bg-[#5054b1] hover:bg-[#373b97] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs transition-all font-semibold font-sans"
                >
                  Register Scheduled Priority
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      <AIAssistantDrawer 
        tasks={tasks}
        schedule={schedule}
        setSchedule={setSchedule}
        isDark={darkCalmMode}
        onOpenCaptureModal={() => setIsCaptureModalOpen(true)}
      />

    </div>
  );
}
