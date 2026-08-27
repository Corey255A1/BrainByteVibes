import { useState, useEffect } from 'preact/hooks';
import type { Profile, Course, CourseNode, GamePayload, SourceLink } from '../../types';
import { geminiService } from '../../services/gemini';
import { db } from '../../db/database';
import { extractSourcesFromMarkdown } from '../../utils/sources';
import { MarkdownRenderer } from '../reader/MarkdownRenderer';
import { GameRunner } from '../games/GameRunner';
import { ArrowLeft, RefreshCw, CheckCircle, Tag, Clock, FolderCheck, ExternalLink, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  profile: Profile;
  course: Course;
  node: CourseNode;
  timeMinutes: number;
  onBack: () => void;
  onLessonCompleted: () => void;
}

export function CourseLessonReader({
  profile,
  course,
  node,
  timeMinutes,
  onBack,
  onLessonCompleted
}: Props) {
  const [markdownContent, setMarkdownContent] = useState(node.markdownContent || '');
  const [gamePayload, setGamePayload] = useState<GamePayload | null>(node.gamePayload || null);
  const [isGenerating, setIsGenerating] = useState(!node.markdownContent);
  const [streamingText, setStreamingText] = useState('');
  const [gameDone, setGameDone] = useState(node.status === 'completed');
  const [savedPath, setSavedPath] = useState<string | null>(node.savedFilePath || null);
  const [sources, setSources] = useState<SourceLink[]>(node.sources || []);

  useEffect(() => {
    if (!node.markdownContent) {
      generateLessonContent();
    } else {
      const extracted = extractSourcesFromMarkdown(node.markdownContent, node.title);
      setSources(extracted);
    }
  }, [node.id]);

  const generateLessonContent = async () => {
    setIsGenerating(true);
    setStreamingText('');

    try {
      const { markdown, gamePayload: extractedGame } = await geminiService.generateCourseLesson(
        course.title,
        node.title,
        node.description,
        node.tags,
        timeMinutes,
        profile.preferredModel || 'gemini-1.5-flash',
        (partial) => setStreamingText(partial)
      );

      setMarkdownContent(markdown);
      setGamePayload(extractedGame);

      const extractedSources = extractSourcesFromMarkdown(markdown, node.title);
      setSources(extractedSources);

      // Save lesson markdown file on backend disk: courses/{folder_name}/{filename}.md
      const saveRes = await geminiService.saveCourseLesson({
        username: profile.name,
        folder_name: course.folderName,
        lesson_id: node.id,
        lesson_title: node.title,
        content: markdown,
        tags: node.tags,
        read_minutes: timeMinutes,
        course_title: course.title
      });

      const relPath = saveRes?.saved_path || `courses/${course.folderName}/${node.title.replace(/\s+/g, '')}.md`;
      setSavedPath(relPath);

      // Update node in Dexie DB
      await db.courseNodes.update(node.id, {
        markdownContent: markdown,
        gamePayload: extractedGame,
        savedFilePath: relPath,
        timeSpentMinutes: timeMinutes,
        sources: extractedSources
      });
    } catch (e) {
      console.error('Error generating course lesson:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteLesson = async () => {
    setGameDone(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    const extractedSources = extractSourcesFromMarkdown(markdownContent, node.title);

    // Mark current node as completed
    await db.courseNodes.update(node.id, {
      status: 'completed',
      completedAt: new Date(),
      sources: extractedSources
    });

    // Check dependent nodes and unlock them if all prerequisites are fulfilled
    const allNodes = await db.courseNodes.where('courseId').equals(course.id).toArray();
    const completedNodeIds = new Set(
      allNodes.filter(n => n.id === node.id || n.status === 'completed').map(n => n.id)
    );

    for (const currNode of allNodes) {
      if (currNode.status === 'locked' && currNode.id !== node.id) {
        const reqsSatisfied = currNode.prerequisites.every(prereqId => completedNodeIds.has(prereqId));
        if (reqsSatisfied) {
          await db.courseNodes.update(currNode.id, { status: 'available' });
        }
      }
    }

    // Compile all unique sources from all completed nodes for the course
    const updatedAllNodes = await db.courseNodes.where('courseId').equals(course.id).toArray();
    const completedCount = updatedAllNodes.filter(n => n.status === 'completed').length;
    const progress = Math.round((completedCount / updatedAllNodes.length) * 100);

    const compiledResources: SourceLink[] = [];
    for (const n of updatedAllNodes) {
      const nSources = n.sources || (n.markdownContent ? extractSourcesFromMarkdown(n.markdownContent, n.title) : []);
      for (const s of nSources) {
        if (!compiledResources.some(existing => existing.url === s.url)) {
          compiledResources.push({ ...s, lessonTitle: n.title });
        }
      }
    }

    await db.courses.update(course.id, {
      progressPercentage: progress,
      status: progress >= 100 ? 'completed' : 'active',
      compiledResources,
      updatedAt: new Date()
    });

    onLessonCompleted();
  };


  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-slate-300">
        <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <RefreshCw size={24} className="animate-spin text-emerald-400 flex-shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">Generating Course Lesson ({timeMinutes} Min)</h3>
            <p className="text-xs text-slate-400">Course: {course.title} • Lesson: {node.title}</p>
          </div>
        </div>

        {streamingText && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {streamingText}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 pt-4">
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-semibold text-sm transition-all"
        >
          <ArrowLeft size={18} /> Back to Course
        </button>

        {savedPath && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-lg border border-slate-800">
            <FolderCheck size={14} className="text-emerald-400" />
            <span className="font-mono truncate max-w-[180px]" title={savedPath}>{savedPath}</span>
          </div>
        )}
      </div>

      {/* Lesson Header Banner */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800/80 shadow-xl">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            {course.title}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock size={12} /> {timeMinutes} min read
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
          {node.title}
        </h1>
        <p className="text-xs text-slate-300 mb-3">{node.description}</p>

        {/* Lesson Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/60">
          <Tag size={12} className="text-slate-400" />
          {node.tags.map(t => (
            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Markdown Content */}
      <MarkdownRenderer content={markdownContent} />

      {/* Lesson Sources & References Card */}
      {sources.length > 0 && (
        <div className="mt-8 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-2">
            <BookOpen size={14} />
            <span>Sources for this Lesson ({sources.length})</span>
          </h3>
          <div className="flex flex-col gap-2">
            {sources.map((s) => (
              <a
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-300 hover:text-emerald-400 font-medium flex items-center gap-1.5 transition-colors group"
              >
                <ExternalLink size={12} className="text-slate-500 group-hover:text-emerald-400 shrink-0" />
                <span>{s.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}


      {/* Quiz / Mini-Game Section */}
      {gamePayload && (
        <div className="mt-10 pt-8 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              🎯 Lesson Mastery Check
            </h3>
            {gameDone && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <CheckCircle size={14} /> Completed
              </span>
            )}
          </div>
          <GameRunner payload={gamePayload} onComplete={handleCompleteLesson} />
        </div>
      )}

      {/* Manual Complete Action if no quiz or quiz done */}
      {(!gamePayload || gameDone) && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleCompleteLesson}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            <span>Mark Lesson Completed & Unlock Next</span>
          </button>
        </div>
      )}
    </div>
  );
}
