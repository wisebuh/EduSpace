export type UserProfile = {
  name: string;
  email: string;
  role: string;
};

export type DashboardActivity = {
  title: string;
  category: string;
  progress: number;
  color: string;
  time: string;
};

export type AssignmentItem = {
  id: number;
  title: string;
  course: string;
  due: string;
  status: "Pending" | "In progress" | "Submitted" | "Graded";
  marks: string;
};

export type CourseItem = {
  id: number;
  title: string;
  category: string;
  instructor: string;
  progress: number;
  lessons: number;
  duration: string;
  color: string;
};

export type ClassItem = {
  id: number;
  title: string;
  instructor: string;
  date: string;
  time: string;
  type: string;
  students: number;
  status: "Upcoming" | "Completed";
  color: string;
};

export type ResourceItem = {
  title: string;
  course: string;
  type: "Video" | "Lesson" | "Document";
  duration: string;
  icon: string;
  color: string;
};

export type PlatformData = {
  user: UserProfile;
  dashboard: { stats: { title: string; value: string; detail: string; icon: string; color: string }[]; activities: DashboardActivity[] };
  assignments: AssignmentItem[];
  courses: CourseItem[];
  classes: ClassItem[];
  resources: ResourceItem[];
  settings: {
    emailNotifications: boolean;
    assignmentReminders: boolean;
    classReminders: boolean;
  };
};

export const initialPlatformData: PlatformData = {
  user: {
    name: "Wise",
    email: "wise@example.com",
    role: "Student account",
  },
  dashboard: {
    stats: [
      { title: "Enrolled courses", value: "08", detail: "Courses in your library", icon: "BookOpen", color: "blue" },
      { title: "Active classes", value: "04", detail: "Classes this semester", icon: "Users", color: "violet" },
      { title: "Pending assignments", value: "06", detail: "Remember your deadlines", icon: "ClipboardCheck", color: "orange" },
      { title: "Learning progress", value: "72%", detail: "Across your active courses", icon: "TrendingUp", color: "green" },
    ],
    activities: [
      { title: "Introduction to UI/UX Design", category: "Design", progress: 75, color: "bg-blue-600", time: "2h 30m remaining" },
      { title: "Modern Web Development", category: "Development", progress: 48, color: "bg-violet-600", time: "4h remaining" },
      { title: "Data Analysis with Python", category: "Data Science", progress: 30, color: "bg-emerald-600", time: "6h remaining" },
    ],
  },
  assignments: [
    { id: 1, title: "Mobile App Wireframe", course: "UI/UX Design", due: "Oct 06, 2026", status: "Pending", marks: "—" },
    { id: 2, title: "Build a REST API", course: "Web Development", due: "Oct 07, 2026", status: "In progress", marks: "—" },
    { id: 3, title: "Python Data Analysis", course: "Data Science", due: "Oct 08, 2026", status: "Pending", marks: "—" },
    { id: 4, title: "Design Principles Quiz", course: "UI/UX Design", due: "Sep 25, 2026", status: "Submitted", marks: "85/100" },
    { id: 5, title: "JavaScript Fundamentals", course: "Web Development", due: "Sep 22, 2026", status: "Graded", marks: "92/100" },
  ],
  courses: [
    { id: 1, title: "UI/UX Design Fundamentals", category: "Design", instructor: "Sarah Johnson", progress: 75, lessons: 24, duration: "8 hours", color: "bg-blue-600" },
    { id: 2, title: "Full Stack Web Development", category: "Development", instructor: "David Miller", progress: 48, lessons: 36, duration: "14 hours", color: "bg-violet-600" },
    { id: 3, title: "Python for Data Analysis", category: "Data Science", instructor: "Michael Chen", progress: 30, lessons: 28, duration: "10 hours", color: "bg-emerald-600" },
    { id: 4, title: "Product Design Essentials", category: "Design", instructor: "Sarah Johnson", progress: 90, lessons: 18, duration: "6 hours", color: "bg-orange-500" },
    { id: 5, title: "React and Next.js", category: "Development", instructor: "Daniel James", progress: 15, lessons: 32, duration: "12 hours", color: "bg-cyan-600" },
    { id: 6, title: "Data Visualization", category: "Data Science", instructor: "Mary Adams", progress: 0, lessons: 20, duration: "7 hours", color: "bg-pink-600" },
  ],
  classes: [
    { id: 1, title: "UI/UX Design Workshop", instructor: "Sarah Johnson", date: "Oct 05, 2026", time: "10:00 AM – 11:30 AM", type: "Live online", students: 28, status: "Upcoming", color: "bg-blue-600" },
    { id: 2, title: "Advanced React Development", instructor: "Daniel James", date: "Oct 06, 2026", time: "1:00 PM – 2:30 PM", type: "Live online", students: 35, status: "Upcoming", color: "bg-violet-600" },
    { id: 3, title: "Introduction to Data Science", instructor: "Michael Chen", date: "Oct 08, 2026", time: "9:00 AM – 10:00 AM", type: "Classroom", students: 22, status: "Upcoming", color: "bg-emerald-600" },
    { id: 4, title: "Product Design Review", instructor: "Sarah Johnson", date: "Sep 28, 2026", time: "11:00 AM – 12:00 PM", type: "Live online", students: 18, status: "Completed", color: "bg-orange-500" },
  ],
  resources: [
    { title: "Introduction to User Research", course: "UI/UX Design", type: "Video", duration: "18 min", icon: "Video", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400" },
    { title: "Wireframing Fundamentals", course: "UI/UX Design", type: "Lesson", duration: "25 min", icon: "PlayCircle", color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400" },
    { title: "React Components Handbook", course: "Web Development", type: "Document", duration: "PDF resource", icon: "FileText", color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400" },
    { title: "Working with Python DataFrames", course: "Data Science", type: "Video", duration: "32 min", icon: "Video", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { title: "Design Systems and Components", course: "UI/UX Design", type: "Document", duration: "Study notes", icon: "FileText", color: "text-pink-600 bg-pink-50 dark:bg-pink-500/10 dark:text-pink-400" },
    { title: "API Development Basics", course: "Web Development", type: "Lesson", duration: "40 min", icon: "PlayCircle", color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-500/10 dark:text-cyan-400" },
  ],
  settings: {
    emailNotifications: true,
    assignmentReminders: true,
    classReminders: false,
  },
};

let platformData: PlatformData = structuredClone(initialPlatformData);

export function getPlatformData(): PlatformData {
  return structuredClone(platformData);
}

export function updatePlatformData(partial: Partial<PlatformData>): PlatformData {
  platformData = {
    ...platformData,
    ...partial,
    dashboard: {
      ...platformData.dashboard,
      ...partial.dashboard,
    },
    settings: {
      ...platformData.settings,
      ...partial.settings,
    },
    user: {
      ...platformData.user,
      ...partial.user,
    },
  };

  return structuredClone(platformData);
}
