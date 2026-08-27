import { useState, useEffect } from 'preact/hooks';
import type { Profile, Course, CourseNode } from '../types';
import { db } from '../db/database';
import { geminiService } from '../services/gemini';
import { NewCourseModal } from '../components/courses/NewCourseModal';
import { CourseDetailView } from '../components/courses/CourseDetailView';
import { CourseLessonReader } from '../components/courses/CourseLessonReader';
import { ModalDialog, type ModalDialogProps } from '../components/common/ModalDialog';
import {
  GraduationCap,
  Plus,
  Search,
  Sparkles,
  ChevronRight,
  Trash2
} from 'lucide-react';

interface Props {
  profile: Profile;
}

export function CoursesPage({ profile }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ node: CourseNode; timeMinutes: number } | null>(null);
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [searchTag, setSearchTag] = useState('');
  const [searchResults, setSearchResults] = useState<{ course: Course; node: CourseNode }[]>([]);
  const [modalConfig, setModalConfig] = useState<ModalDialogProps | null>(null);


  useEffect(() => {
    loadCourses();
  }, [profile.id]);

  useEffect(() => {
    if (searchTag.trim()) {
      performTagSearch(searchTag.trim().toLowerCase());
    } else {
      setSearchResults([]);
    }
  }, [searchTag]);

  const loadCourses = async () => {
    const list = await db.courses
      .where('profileId')
      .equals(profile.id)
      .reverse()
      .sortBy('updatedAt');
    setCourses(list);
  };

  const performTagSearch = async (query: string) => {
    const userNodes = await db.courseNodes.where('profileId').equals(profile.id).toArray();
    const matches = userNodes.filter(
      n =>
        n.tags.some(t => t.toLowerCase().includes(query)) ||
        n.title.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query)
    );

    const results: { course: Course; node: CourseNode }[] = [];
    for (const node of matches) {
      const c = await db.courses.get(node.courseId);
      if (c) {
        results.push({ course: c, node });
      }
    }
    setSearchResults(results);
  };

  const handleCreateCourse = async (topicPrompt: string) => {
    setIsGeneratingCourse(true);
    try {
      const dagData = await geminiService.fetchCourseDag(
        topicPrompt,
        profile.preferredModel || 'gemini-1.5-flash'
      );

      const courseId = `course-${Date.now()}`;
      const folderName = `${dagData.course_title.toLowerCase().replace(/[^\w]/g, '_')}_${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}`;

      const newCourse: Course = {
        id: courseId,
        profileId: profile.id,
        title: dagData.course_title,
        topicPrompt,
        folderName,
        status: 'active',
        progressPercentage: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const courseNodes: CourseNode[] = dagData.nodes.map((nodeData) => {
        // First nodes with empty prerequisites are available, others locked initially
        const isInitial = !nodeData.prerequisites || nodeData.prerequisites.length === 0;
        const scopedNodeId = `${courseId}-${nodeData.id}`;
        const scopedPrereqs = (nodeData.prerequisites || []).map(pId => `${courseId}-${pId}`);

        return {
          id: scopedNodeId,
          courseId,
          profileId: profile.id,
          title: nodeData.title,
          description: nodeData.description,
          prerequisites: scopedPrereqs,
          tags: nodeData.tags || [],
          status: isInitial ? 'available' : 'locked'
        };
      });

      await db.courses.add(newCourse);
      await db.courseNodes.bulkAdd(courseNodes);

      setShowNewCourseModal(false);
      await loadCourses();
      setSelectedCourse(newCourse);
    } catch (e) {
      console.error('Error generating course:', e);
      setModalConfig({
        isOpen: true,
        title: 'Course Generation Failed',
        message: 'Failed to generate course curriculum. Please verify your Gemini API key in Settings or try again.',
        variant: 'warning',
        confirmLabel: 'Got It',
        onConfirm: () => setModalConfig(null)
      });
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const handleDeleteCourse = (courseId: string, e?: Event) => {
    if (e) e.stopPropagation();
    const courseToDelete = courses.find(c => c.id === courseId) || selectedCourse;
    const title = courseToDelete ? `Delete "${courseToDelete.title}"?` : 'Delete Course?';

    setModalConfig({
      isOpen: true,
      title,
      message: 'Are you sure you want to delete this course? This will remove all its generated lessons from your library.',
      variant: 'danger',
      confirmLabel: 'Delete Course',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        setModalConfig(null);
        await performDeleteCourse(courseId);
      },
      onCancel: () => setModalConfig(null)
    });
  };

  const performDeleteCourse = async (courseId: string) => {
    try {
      await db.courses.delete(courseId);
      const nodeKeys = await db.courseNodes.where('courseId').equals(courseId).primaryKeys();
      await db.courseNodes.bulkDelete(nodeKeys);

      if (selectedCourse?.id === courseId) {
        setSelectedCourse(null);
      }
      await loadCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
    }
  };


  // If reading a course lesson
  if (selectedCourse && selectedNode) {
    return (
      <CourseLessonReader
        profile={profile}
        course={selectedCourse}
        node={selectedNode.node}
        timeMinutes={selectedNode.timeMinutes}
        onBack={() => setSelectedNode(null)}
        onLessonCompleted={async () => {
          setSelectedNode(null);
          await loadCourses();
          // Reload course object in state
          const updatedCourse = await db.courses.get(selectedCourse.id);
          if (updatedCourse) setSelectedCourse(updatedCourse);
        }}
      />
    );
  }

  // If viewing course details & DAG roadmap
  if (selectedCourse) {
    return (
      <CourseDetailView
        course={selectedCourse}
        onBack={() => {
          setSelectedCourse(null);
          loadCourses();
        }}
        onSelectNodeForReading={(node, timeMinutes) => {
          setSelectedNode({ node, timeMinutes });
        }}
        onDeleteCourse={handleDeleteCourse}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-24 flex flex-col gap-6">
      {/* Header & Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="text-emerald-400" size={24} />
            <span>Learning Courses</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Master subjects step-by-step with DAGs</p>
        </div>

        <button
          onClick={() => setShowNewCourseModal(true)}
          className="py-2 px-3.5 rounded-xl font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus size={16} />
          <span>New Course</span>
        </button>
      </div>

      {/* Tag Search & Filter Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={searchTag}
          onInput={(e) => setSearchTag((e.target as HTMLInputElement).value)}
          placeholder="Search lessons by topic tag (e.g. #qubits, #rust)..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-xs transition-all"
        />
        {searchTag && (
          <button
            onClick={() => setSearchTag('')}
            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search Results if query active */}
      {searchTag.trim() !== '' ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tag Search Results ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 text-xs">
              No lessons matching "{searchTag}"
            </div>
          ) : (
            searchResults.map(({ course, node }) => (
              <div
                key={node.id}
                onClick={() => {
                  setSearchTag('');
                  setSelectedCourse(course);
                  if (node.status === 'available' || node.status === 'completed') {
                    setSelectedNode({ node, timeMinutes: node.timeSpentMinutes || 5 });
                  }
                }}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    {course.title}
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1">{node.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{node.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {node.tags.map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-500 shrink-0" />
              </div>
            ))
          )}
        </div>
      ) : (
        /* Active Courses List */
        <div className="flex flex-col gap-4">
          {courses.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col items-center gap-3">
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Sparkles size={32} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">No Active Courses Yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Start a new course on any topic like Calculus, Physics, Qt Widgets, LVGL, Music Theory, or Rust.
                </p>
              </div>
              <button
                onClick={() => setShowNewCourseModal(true)}
                className="mt-2 py-2.5 px-5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Create Your First Course</span>
              </button>
            </div>
          ) : (
            courses.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCourse(c)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer shadow-lg transition-all group relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">Prompt: "{c.topicPrompt}"</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDeleteCourse(c.id, e)}
                      title="Delete / Cancel Course"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={20} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center text-xs font-semibold mb-1">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-emerald-400 font-bold">{c.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${c.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}


      {/* New Course Prompt Modal */}
      {showNewCourseModal && (
        <NewCourseModal
          onClose={() => setShowNewCourseModal(false)}
          onCreateCourse={handleCreateCourse}
          isLoading={isGeneratingCourse}
        />
      )}

      {/* Reusable Modal Dialog for confirmations & alerts */}
      {modalConfig && <ModalDialog {...modalConfig} />}
    </div>
  );
}

