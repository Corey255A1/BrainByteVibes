import { useState, useEffect } from 'preact/hooks';
import type { Course, CourseNode } from '../../types';
import { db } from '../../db/database';
import { LessonTimeModal } from './LessonTimeModal';
import { ArrowLeft, Lock, CheckCircle2, Play, Tag, Sparkles, BookOpen, Layers, ExternalLink, Trash2 } from 'lucide-react';

interface Props {
  course: Course;
  onBack: () => void;
  onSelectNodeForReading: (node: CourseNode, timeMinutes: number) => void;
  onDeleteCourse?: (courseId: string) => void;
}

export function CourseDetailView({ course, onBack, onSelectNodeForReading, onDeleteCourse }: Props) {
  const [nodes, setNodes] = useState<CourseNode[]>([]);
  const [selectedNodeForTime, setSelectedNodeForTime] = useState<CourseNode | null>(null);

  useEffect(() => {
    loadNodes();
  }, [course.id]);

  const loadNodes = async () => {
    const list = await db.courseNodes.where('courseId').equals(course.id).toArray();
    setNodes(list);
  };

  const nextAvailableNode = nodes.find(n => n.status === 'available');

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 pt-4">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all"
        >
          <ArrowLeft size={18} /> Back to Courses
        </button>

        <div className="flex items-center gap-2">
          {onDeleteCourse && (
            <button
              onClick={() => onDeleteCourse(course.id)}
              title="Delete / Cancel Course"
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:border-rose-500/50 hover:bg-rose-950/30 transition-all text-xs font-semibold flex items-center gap-1"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Delete Course</span>
            </button>
          )}

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              course.status === 'completed'
                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                : 'bg-teal-950 text-teal-400 border-teal-500/30'
            }`}
          >
            {course.status === 'completed' ? '🎉 Course Completed' : '⚡ In Progress'}
          </span>
        </div>
      </div>

      {/* Course Overview Banner */}
      <div className="mb-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
          <Sparkles size={16} />
          <span>Knowledge Graph Curriculum</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          {course.title}
        </h1>
        <p className="text-xs text-slate-400 mb-4">Prompt: "{course.topicPrompt}"</p>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-slate-300">Curriculum Progress</span>
            <span className="text-emerald-400">{course.progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${course.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Next Lesson Callout Action */}
        {nextAvailableNode && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                Recommended Next Step
              </span>
              <p className="text-sm font-bold text-white">{nextAvailableNode.title}</p>
            </div>
            <button
              onClick={() => setSelectedNodeForTime(nextAvailableNode)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Play size={16} className="fill-current" />
              <span>Start Next Lesson</span>
            </button>
          </div>
        )}
      </div>

      {/* DAG Node Graph / Learning Path Roadmap */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Layers size={20} className="text-emerald-400" />
          <span>Curriculum Directed Acyclic Graph (DAG)</span>
        </h2>

        <div className="flex flex-col gap-4 relative">
          {nodes.map((node, index) => {
            const isCompleted = node.status === 'completed';
            const isAvailable = node.status === 'available';
            const isLocked = node.status === 'locked';

            return (
              <div key={node.id} className="relative flex items-start gap-4 group">
                {/* Vertical connecting line in graph */}
                {index < nodes.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                )}

                {/* Node Status Node Indicator */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-md transition-all z-10 ${
                    isCompleted
                      ? 'bg-emerald-950 border-emerald-500/50 text-emerald-400'
                      : isAvailable
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-emerald-500/20 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={22} />
                  ) : isAvailable ? (
                    <Play size={20} className="fill-current ml-0.5" />
                  ) : (
                    <Lock size={18} />
                  )}
                </div>

                {/* Node Info Card */}
                <div
                  onClick={() => {
                    if (isAvailable || isCompleted) {
                      setSelectedNodeForTime(node);
                    }
                  }}
                  className={`flex-1 p-4 rounded-2xl border transition-all ${
                    isAvailable
                      ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/5'
                      : isCompleted
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-base text-white">{node.title}</h3>
                    {isCompleted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0">
                        Completed
                      </span>
                    )}
                    {isAvailable && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                        Ready to Start
                      </span>
                    )}
                    {isLocked && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 shrink-0">
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-3">{node.description}</p>

                  {/* Node Prerequisites badge if any */}
                  {node.prerequisites.length > 0 && (
                    <div className="text-[10px] text-slate-500 mb-2 font-mono">
                      Prereqs: {node.prerequisites.join(', ')}
                    </div>
                  )}

                  {/* Node Topic Tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag size={11} className="text-slate-500" />
                    {node.tags.map(t => (
                      <span
                        key={t}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/50"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Actions for Review or Start */}
                  <div className="mt-3 pt-2 border-t border-slate-800/40 flex justify-end">
                    {isCompleted && (
                      <span className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                        <BookOpen size={14} /> Review Past Lesson & Tags →
                      </span>
                    )}
                    {isAvailable && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        Start Lesson →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compiled Course Resources & References */}
      {(() => {
        const compiledMap = new Map<string, { title: string; url: string; lessonTitle?: string }>();
        for (const n of nodes) {
          if (n.sources) {
            for (const s of n.sources) {
              if (!compiledMap.has(s.url)) {
                compiledMap.set(s.url, { ...s, lessonTitle: n.title });
              }
            }
          }
        }
        const compiledResources = Array.from(compiledMap.values());
        if (compiledResources.length === 0) return null;

        return (
          <div className="mt-10 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={18} className="text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Compiled Course Resources & References ({compiledResources.length})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              A deduplicated combination of all sources and external links compiled across all lessons in this course.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {compiledResources.map((res) => (
                <a
                  key={res.url}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 line-clamp-2 transition-colors">
                      {res.title}
                    </span>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400 shrink-0 mt-0.5" />
                  </div>
                  {res.lessonTitle && (
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 self-start">
                      Lesson: {res.lessonTitle}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Lesson Time Selection Modal */}
      {selectedNodeForTime && (
        <LessonTimeModal
          node={selectedNodeForTime}
          onClose={() => setSelectedNodeForTime(null)}
          onStartLesson={(timeMinutes) => {
            const target = selectedNodeForTime;
            setSelectedNodeForTime(null);
            onSelectNodeForReading(target, timeMinutes);
          }}
        />
      )}
    </div>
  );
}

