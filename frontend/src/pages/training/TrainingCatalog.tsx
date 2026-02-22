import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, Badge, Button } from '@/components/ui';
import { trainingService } from '@/services/api';
import type { TrainingModule, TrainingProgress } from '@/services/api/training';
import {
  BookOpen, Play, CheckCircle, Clock, Award, Filter,
} from 'lucide-react';

export default function TrainingCatalog() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mods, prog, cats] = await Promise.all([
          trainingService.getCatalog(category !== 'all' ? { category } : undefined),
          trainingService.getProgress(),
          trainingService.getCategories(),
        ]);
        setModules(mods);
        setProgress(prog);
        setCategories(cats);
      } catch {
        toast.error('Failed to load training catalog');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category]);

  const isCompleted = (moduleId: number) =>
    progress?.completions.some(c => c.module_id === moduleId && c.completed_at) ?? false;

  const isStarted = (moduleId: number) =>
    progress?.completions.some(c => c.module_id === moduleId && !c.completed_at) ?? false;

  const startOrContinue = async (mod: TrainingModule) => {
    if (!isStarted(mod.id) && !isCompleted(mod.id)) {
      await trainingService.startModule(mod.id);
    }
    // In a real app, navigate to module content
    const updatedProgress = await trainingService.getProgress();
    setProgress(updatedProgress);
  };

  const completeModule = async (moduleId: number) => {
    try {
      await trainingService.completeModule(moduleId, { score: 100 });
      toast.success('Training module completed!');
      const updatedProgress = await trainingService.getProgress();
      setProgress(updatedProgress);
    } catch {
      toast.error('Failed to complete training module');
    }
  };

  const contentTypeIcons: Record<string, string> = {
    video: '🎬',
    article: '📄',
    quiz: '❓',
    interactive: '🖱️',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Training Center</h1>
          <p className="text-slate-500 mt-1">Build your skills with courses and certifications</p>
        </div>
      </div>

      {/* Progress overview */}
      {progress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-shield-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-shield-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Completed</p>
                <p className="text-xl font-bold text-slate-900">{progress.completed_modules}/{progress.total_modules}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Score</p>
                <p className="text-xl font-bold text-slate-900">{progress.avg_score ? `${progress.avg_score}%` : 'N/A'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Required Left</p>
                <p className="text-xl font-bold text-slate-900">{progress.required_remaining}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Play className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Time Spent</p>
                <p className="text-xl font-bold text-slate-900">{Math.round(progress.total_time_spent_minutes / 60)}h</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Progress bar */}
      {progress && progress.total_modules > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Progress</span>
            <span className="text-sm text-slate-500">{Math.round((progress.completed_modules / progress.total_modules) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-shield-500 rounded-full h-3 transition-all"
              style={{ width: `${(progress.completed_modules / progress.total_modules) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <button
          onClick={() => setCategory('all')}
          className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
            category === 'all' ? 'bg-shield-50 text-shield-700 font-medium' : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`text-sm px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              category === cat ? 'bg-shield-50 text-shield-700 font-medium' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modules grid */}
      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-8 h-8 border-4 border-shield-200 border-t-shield-600 rounded-full animate-spin mx-auto" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(mod => {
            const completed = isCompleted(mod.id);
            const started = isStarted(mod.id);
            return (
              <Card key={mod.id} className={`p-5 transition-all hover:shadow-md ${completed ? 'border-green-200 bg-green-50/30' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{contentTypeIcons[mod.content_type] || '📚'}</span>
                    <Badge variant={mod.is_required ? 'danger' : 'default'}>
                      {mod.is_required ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                  {completed && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{mod.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{mod.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {mod.duration_minutes}min</span>
                  <span className="capitalize">{mod.content_type}</span>
                  <span>{mod.category}</span>
                </div>
                {completed ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => startOrContinue(mod)}>
                    Review Again
                  </Button>
                ) : started ? (
                  <div className="space-y-2">
                    <Button variant="shield" size="sm" className="w-full" onClick={() => startOrContinue(mod)}>
                      Continue
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => completeModule(mod.id)}>
                      Mark Complete
                    </Button>
                  </div>
                ) : (
                  <Button variant="shield" size="sm" className="w-full" onClick={() => startOrContinue(mod)}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Start
                  </Button>
                )}
              </Card>
            );
          })}
          {modules.length === 0 && (
            <Card className="p-12 text-center col-span-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No training modules available</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
