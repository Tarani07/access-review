import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  FileText,
  Receipt,
  Settings,
  HelpCircle,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Calendar,
  Users as UsersIcon,
  Link2,
  Circle
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  assignee: {
    name: string;
    avatar: string;
  };
  comments: number;
  attachments: number;
  status: 'In Progress' | 'Pending' | 'Completed';
}

interface DashboardStats {
  timeSaved: number;
  projectsCompleted: number;
  projectsInProgress: number;
  hoursSpent: number;
  weeklyHours: { day: string; hours: number }[];
  incompleteTasks: {
    total: number;
    completed: number;
    inProgress: number;
    yetToStart: number;
  };
}

interface ModernDashboardProps {
  onNavigate?: (section: string) => void;
}

export default function ModernDashboard({ onNavigate }: ModernDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNav, setActiveNav] = useState('dashboard');
  const [stats] = useState<DashboardStats>({
    timeSaved: 12,
    projectsCompleted: 24,
    projectsInProgress: 7,
    hoursSpent: 24.9,
    weeklyHours: [
      { day: 'Mo', hours: 3 },
      { day: 'Tu', hours: 4 },
      { day: 'We', hours: 2 },
      { day: 'Th', hours: 5.5 },
      { day: 'Fr', hours: 4.5 },
      { day: 'Sa', hours: 5.9 }
    ],
    incompleteTasks: {
      total: 20,
      completed: 10,
      inProgress: 100,
      yetToStart: 10
    }
  });

  const [projects] = useState<Project[]>([
    { id: '1', name: 'Event Planning', color: '#A78BFA' },
    { id: '2', name: 'Breakfast Plan', color: '#10B981' }
  ]);

  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Help DStudio get more customers',
      assignee: { name: 'Ajeet Cyrus', avatar: '👤' },
      comments: 21,
      attachments: 8,
      status: 'In Progress'
    },
    {
      id: '2',
      title: 'Schedule me an appointment with my en...',
      assignee: { name: 'Ajeet Cyrus', avatar: '👤' },
      comments: 21,
      attachments: 8,
      status: 'Pending'
    }
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const maxHours = Math.max(...stats.weeklyHours.map(d => d.hours));

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#252525] flex flex-col">
        {/* Logo */}
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold">Mondays</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'dashboard'
                ? 'bg-[#5B5FED] text-white'
                : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveNav('projects')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'projects'
                ? 'bg-[#5B5FED] text-white'
                : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
            }`}
          >
            <FolderKanban className="h-5 w-5" />
            <span className="font-medium">Projects</span>
          </button>

          <button
            onClick={() => setActiveNav('tasks')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeNav === 'tasks'
                ? 'bg-[#5B5FED] text-white'
                : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
            }`}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="font-medium">My Task</span>
          </button>

          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Chats</span>
          </button>

          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Documents</span>
          </button>

          <button
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
          >
            <Receipt className="h-5 w-5" />
            <span className="font-medium">Receipts</span>
          </button>

          {/* Projects Section */}
          <div className="pt-6">
            <div className="flex items-center justify-between px-4 mb-3">
              <span className="text-sm font-semibold text-gray-400">Projects</span>
              <button className="text-gray-400 hover:text-white">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map(project => (
                <button
                  key={project.id}
                  className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="text-sm">{project.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="px-4 py-4 space-y-1 border-t border-[#2a2a2a]">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors">
            <Receipt className="h-5 w-5" />
            <span className="font-medium">Receipts</span>
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors">
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">Help & Support</span>
            </div>
            <span className="bg-[#10B981] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              8
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-[#252525] px-8 py-4 flex items-center justify-between border-b border-[#2a2a2a]">
          {/* Search */}
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search or type a command"
              className="w-full bg-[#2a2a2a] text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B5FED] placeholder-gray-500"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-gray-500 text-sm">
              <span>⌘</span>
              <span>F</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 ml-8">
            <button className="bg-[#FF6B35] hover:bg-[#FF8E72] text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors">
              <Plus className="h-5 w-5" />
              <span>New Project</span>
              <ChevronDown className="h-4 w-4" />
            </button>

            <button className="relative p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors">
              <Bell className="h-6 w-6 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6B35] rounded-full"></span>
            </button>

            <button className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8E72] flex items-center justify-center text-white font-semibold">
              J
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {/* Greeting */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm mb-2">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
            <h2 className="text-4xl font-bold">{getGreeting()}! John,</h2>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-[#252525] rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Time Saved</p>
              <p className="text-5xl font-bold">{stats.timeSaved} <span className="text-2xl">hrs</span></p>
            </div>
            <div className="bg-[#252525] rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Projects Completed</p>
              <p className="text-5xl font-bold">{stats.projectsCompleted}</p>
            </div>
            <div className="bg-[#252525] rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">Projects In-progress</p>
              <p className="text-5xl font-bold">{stats.projectsInProgress}</p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Hours Spent Chart */}
            <div className="bg-[#252525] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Hours Spent</h3>
                <button className="flex items-center space-x-2 text-gray-400 hover:text-white text-sm">
                  <span>This Week</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-4xl font-bold mb-1">{stats.hoursSpent}</div>
                <div className="text-sm text-gray-400">Hours Spent</div>
              </div>

              {/* Bar Chart */}
              <div className="relative h-48">
                <div className="absolute inset-0 flex items-end justify-between space-x-4">
                  {stats.weeklyHours.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
                        style={{
                          height: `${(data.hours / maxHours) * 100}%`,
                          background: 'linear-gradient(to top, #FF6B35, #FF8E72)'
                        }}
                      />
                      <span className="text-xs text-gray-400 mt-2">{data.day}</span>
                    </div>
                  ))}
                </div>
                
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500">
                  <span>6</span>
                  <span>4</span>
                  <span>2</span>
                  <span>0</span>
                </div>
              </div>
            </div>

            {/* Incomplete Tasks Chart */}
            <div className="bg-[#252525] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Incomplete Tasks</h3>
                <button className="flex items-center space-x-2 text-gray-400 hover:text-white text-sm">
                  <span>This Week</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center space-x-8">
                {/* Donut Chart */}
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 200 200" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#2a2a2a"
                      strokeWidth="20"
                    />
                    {/* Orange segment (In Progress) */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth="20"
                      strokeDasharray={`${(stats.incompleteTasks.inProgress / stats.incompleteTasks.total) * 502} 502`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Purple segment (Completed) */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#A78BFA"
                      strokeWidth="20"
                      strokeDasharray={`${(stats.incompleteTasks.completed / stats.incompleteTasks.total) * 502} 502`}
                      strokeDashoffset={`-${(stats.incompleteTasks.inProgress / stats.incompleteTasks.total) * 502}`}
                      strokeLinecap="round"
                    />
                    {/* Green segment (Yet to Start) */}
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="20"
                      strokeDasharray={`${(stats.incompleteTasks.yetToStart / stats.incompleteTasks.total) * 502} 502`}
                      strokeDashoffset={`-${((stats.incompleteTasks.inProgress + stats.incompleteTasks.completed) / stats.incompleteTasks.total) * 502}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold">14</div>
                    <div className="text-sm text-gray-400">out of 20</div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
                    <div>
                      <div className="font-semibold">{stats.incompleteTasks.inProgress}</div>
                      <div className="text-sm text-gray-400">In Progress Task</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-[#A78BFA]" />
                    <div>
                      <div className="font-semibold">{stats.incompleteTasks.completed}</div>
                      <div className="text-sm text-gray-400">Completed Task</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                    <div>
                      <div className="font-semibold">{stats.incompleteTasks.yetToStart}</div>
                      <div className="text-sm text-gray-400">Yet to Start Task</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* My Projects Table */}
          <div className="bg-[#252525] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5" />
                <h3 className="text-xl font-semibold">My Projects</h3>
                <button className="flex items-center space-x-2 text-gray-400 hover:text-white text-sm">
                  <span>This Week</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <button className="text-gray-400 hover:text-white text-sm">
                See All
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Task Name</span>
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      <div className="flex items-center space-x-2">
                        <UsersIcon className="h-4 w-4" />
                        <span>Assign</span>
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                      <div className="flex items-center space-x-2">
                        <Circle className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-600 bg-transparent"
                          />
                          <span className="text-gray-300">{task.title}</span>
                          <div className="flex items-center space-x-3 text-gray-500 text-sm">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{task.comments}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Link2 className="h-4 w-4" />
                              <span>{task.attachments}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8E72] flex items-center justify-center text-sm">
                            {task.assignee.avatar}
                          </div>
                          <span className="text-gray-300 text-sm">{task.assignee.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            task.status === 'In Progress'
                              ? 'bg-[#10B981] text-white'
                              : task.status === 'Pending'
                              ? 'bg-[#A78BFA] text-white'
                              : 'bg-gray-600 text-gray-300'
                          }`}
                        >
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

