import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { calculateTotalScore, getGradeInfo, calculateRankings, formatPosition } from '@/lib/utils';
import { localStorageService } from '@/lib/localStorage';

interface Student {
  id: string;
  admissionNumber: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface ScoreEntry {
  studentId: string;
  subjectId: string;
  ca1: number | '';
  ca2: number | '';
  exam: number | '';
  total: number;
  grade: string;
  remark: string;
  position?: number;
}

interface BehavioralRating {
  studentId: string;
  punctuality: number;
  attentiveness: number;
  neatness: number;
  politeness: number;
  honesty: number;
  leadership: number;
  cooperation: number;
  initiative: number;
}

export const ScoreEntryPageEnhanced = () => {
  const classId = 'JSS2A'; // Would come from context/route params
  const [selectedSubject, setSelectedSubject] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [isBehavioralModalOpen, setIsBehavioralModalOpen] = useState(false);
  const [selectedStudentForBehavioral, setSelectedStudentForBehavioral] = useState<Student | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Demo data
  const students: Student[] = [
    { id: '1', admissionNumber: 'JSS2A/001', name: 'ADEYEMI OLUWASEUN DAVID' },
    { id: '2', admissionNumber: 'JSS2A/002', name: 'OKAFOR CHIDINMA' },
    { id: '3', admissionNumber: 'JSS2A/003', name: 'MUSA IBRAHIM YAKUBU' },
  ];

  const subjects: Subject[] = [
    { id: '1', name: 'Mathematics', code: 'MTH' },
    { id: '2', name: 'English Language', code: 'ENG' },
    { id: '3', name: 'Basic Science', code: 'BSC' },
  ];

  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [behavioralRatings, setBehavioralRatings] = useState<BehavioralRating[]>([]);

  // Initialize or load from local storage
  useEffect(() => {
    if (selectedSubject) {
      const savedData = localStorageService.getSavedScores(classId, selectedSubject);
      
      if (savedData && savedData.scores) {
        setScores(savedData.scores as ScoreEntry[]);
        setLastSaved(new Date(savedData.lastSaved));
      } else {
        setScores(
          students.map((student) => ({
            studentId: student.id,
            subjectId: selectedSubject,
            ca1: '',
            ca2: '',
            exam: '',
            total: 0,
            grade: '',
            remark: '',
          }))
        );
      }
    }
  }, [selectedSubject]);

  // Auto-save to local storage
  useEffect(() => {
    if (selectedSubject && scores.length > 0) {
      const timer = setTimeout(() => {
        localStorageService.autoSaveScores(classId, selectedSubject, scores);
        setLastSaved(new Date());
      }, 1000); // Save 1 second after user stops typing

      return () => clearTimeout(timer);
    }
  }, [scores, selectedSubject]);

  const handleScoreChange = (
    studentId: string,
    field: 'ca1' | 'ca2' | 'exam',
    value: string
  ) => {
    const numValue = value === '' ? '' : Number(value);
    const maxValues = { ca1: 20, ca2: 20, exam: 60 };
    
    if (numValue !== '' && (numValue < 0 || numValue > maxValues[field])) {
      return;
    }

    setScores((prev) => {
      const updated = prev.map((score) => {
        if (score.studentId !== studentId) return score;

        const updatedScore = { ...score, [field]: numValue };
        const ca1 = Number(updatedScore.ca1) || 0;
        const ca2 = Number(updatedScore.ca2) || 0;
        const exam = Number(updatedScore.exam) || 0;
        
        const total = calculateTotalScore(ca1, ca2, exam);
        const percentage = total;
        const { grade, remark } = getGradeInfo(percentage, null);

        return { ...updatedScore, total, grade, remark };
      });

      // Calculate rankings
      const studentsWithScores = updated
        .filter((s) => s.total > 0)
        .map((s) => ({ studentId: s.studentId, percentage: s.total }));
      
      const rankings = calculateRankings(studentsWithScores);

      return updated.map((score) => {
        const ranking = rankings.find((r) => r.studentId === score.studentId);
        return { ...score, position: ranking?.position };
      });
    });
  };

  const handleSaveScores = async () => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }

    setSaveLoading(true);

    // Simulate API call
    setTimeout(() => {
      localStorageService.markSynced(classId, selectedSubject);
      setSaveLoading(false);
      alert('Scores saved successfully! ✅\n\nData saved locally and will sync when online.');
    }, 1000);
  };

  const openBehavioralModal = (student: Student) => {
    setSelectedStudentForBehavioral(student);
    
    // Load saved behavioral data
    const saved = localStorageService.getBehavioral(classId, student.id) as { ratings?: Record<string, number> } | null;
    if (saved && saved.ratings) {
      const existing = behavioralRatings.find((r) => r.studentId === student.id);
      if (!existing) {
        const r = saved.ratings;
        setBehavioralRatings([...behavioralRatings, {
          studentId: student.id,
          punctuality: r['punctuality'] ?? 0,
          attentiveness: r['attentiveness'] ?? 0,
          neatness: r['neatness'] ?? 0,
          politeness: r['politeness'] ?? 0,
          honesty: r['honesty'] ?? 0,
          leadership: r['leadership'] ?? 0,
          cooperation: r['cooperation'] ?? 0,
          initiative: r['initiative'] ?? 0,
        }]);
      }
    }
    
    setIsBehavioralModalOpen(true);
  };

  const handleBehavioralRatingChange = (metric: string, value: number) => {
    if (!selectedStudentForBehavioral) return;

    setBehavioralRatings((prev) => {
      const existing = prev.find((r) => r.studentId === selectedStudentForBehavioral.id);
      
      if (existing) {
        return prev.map((r) =>
          r.studentId === selectedStudentForBehavioral.id ? { ...r, [metric]: value } : r
        );
      } else {
        return [
          ...prev,
          {
            studentId: selectedStudentForBehavioral.id,
            punctuality: metric === 'punctuality' ? value : 3,
            attentiveness: metric === 'attentiveness' ? value : 3,
            neatness: metric === 'neatness' ? value : 3,
            politeness: metric === 'politeness' ? value : 3,
            honesty: metric === 'honesty' ? value : 3,
            leadership: metric === 'leadership' ? value : 3,
            cooperation: metric === 'cooperation' ? value : 3,
            initiative: metric === 'initiative' ? value : 3,
          },
        ];
      }
    });
  };

  const saveBehavioralRatings = () => {
    if (!selectedStudentForBehavioral) return;

    const rating = behavioralRatings.find((r) => r.studentId === selectedStudentForBehavioral.id);
    if (rating) {
      localStorageService.saveBehavioral(classId, selectedStudentForBehavioral.id, rating);
      alert('Behavioral ratings saved! ✅');
      setIsBehavioralModalOpen(false);
    }
  };

  const getBehavioralRating = (studentId: string, metric: string): number => {
    const rating = behavioralRatings.find((r) => r.studentId === studentId);
    return rating ? (rating as any)[metric] || 3 : 3;
  };

  const getCompletionStats = () => {
    const total = scores.length;
    const completed = scores.filter((s) => s.ca1 !== '' && s.ca2 !== '' && s.exam !== '').length;
    return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const stats = getCompletionStats();

  return (
    <DashboardLayout title="Enter Scores">
      <div className="space-y-6">
        {/* Offline Status Banner */}
        {!navigator.onLine && (
          <div className="bg-secondary-100 border border-secondary-300 p-4 rounded-lg flex items-center gap-3">
            <span className="text-2xl">📴</span>
            <div>
              <p className="font-semibold text-secondary-900">Working Offline</p>
              <p className="text-sm text-secondary-700">
                Your data is being saved locally and will sync when you're back online.
              </p>
            </div>
          </div>
        )}

        {/* Last Saved Indicator */}
        {lastSaved && (
          <div className="text-sm text-neutral-600 flex items-center gap-2">
            <span>💾</span>
            <span>
              Last saved: {lastSaved.toLocaleTimeString()} (auto-saved locally)
            </span>
          </div>
        )}

        {/* Subject Selection */}
        <div className="card">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Select Subject</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedSubject === subject.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-primary-300'
                }`}
              >
                <div className="text-2xl mb-2">📚</div>
                <h3 className="font-bold text-sm text-neutral-900">{subject.name}</h3>
                <p className="text-xs text-neutral-500 font-mono">{subject.code}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedSubject && (
          <>
            {/* Progress */}
            <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">
                    {subjects.find((s) => s.id === selectedSubject)?.name}
                  </h3>
                  <p className="text-sm opacity-90">Score Entry Progress</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">
                    {stats.completed}/{stats.total}
                  </p>
                  <p className="text-sm opacity-90">Students</p>
                </div>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-400 transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>

            {/* Scores Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Enter Scores</h2>
                <Button onClick={handleSaveScores} loading={saveLoading}>
                  💾 Save Scores
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="text-left py-3 px-4 font-semibold">Adm No.</th>
                      <th className="text-left py-3 px-4 font-semibold">Student Name</th>
                      <th className="text-center py-3 px-4 font-semibold">CA 1<br />(20)</th>
                      <th className="text-center py-3 px-4 font-semibold">CA 2<br />(20)</th>
                      <th className="text-center py-3 px-4 font-semibold">Exam<br />(60)</th>
                      <th className="text-center py-3 px-4 font-semibold bg-primary-50">Total<br />(100)</th>
                      <th className="text-center py-3 px-4 font-semibold bg-primary-50">Grade</th>
                      <th className="text-center py-3 px-4 font-semibold bg-primary-50">Position</th>
                      <th className="text-center py-3 px-4 font-semibold">Behavior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const score = scores.find((s) => s.studentId === student.id);
                      if (!score) return null;

                      return (
                        <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                          <td className="py-3 px-4 font-mono text-xs">{student.admissionNumber}</td>
                          <td className="py-3 px-4 font-medium">{student.name}</td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={score.ca1}
                              onChange={(e) => handleScoreChange(student.id, 'ca1', e.target.value)}
                              className="w-16 px-2 py-1 text-center border-2 border-neutral-200 rounded focus:border-primary-500 outline-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={score.ca2}
                              onChange={(e) => handleScoreChange(student.id, 'ca2', e.target.value)}
                              className="w-16 px-2 py-1 text-center border-2 border-neutral-200 rounded focus:border-primary-500 outline-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={score.exam}
                              onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                              className="w-16 px-2 py-1 text-center border-2 border-neutral-200 rounded focus:border-primary-500 outline-none"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-primary-700 bg-primary-50">
                            {score.total}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-primary-700 bg-primary-50">
                            {score.grade || '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-primary-700 bg-primary-50">
                            {score.position ? formatPosition(score.position) : '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => openBehavioralModal(student)}
                              className="text-xs px-3 py-1 bg-secondary-100 text-secondary-700 rounded hover:bg-secondary-200"
                            >
                              ⭐ Rate
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Behavioral Rating Modal */}
      <Modal
        isOpen={isBehavioralModalOpen}
        onClose={() => setIsBehavioralModalOpen(false)}
        title={`Behavioral Assessment - ${selectedStudentForBehavioral?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Rate the student on a scale of 1-5</p>

          {[
            'punctuality',
            'attentiveness',
            'neatness',
            'politeness',
            'honesty',
            'leadership',
            'cooperation',
            'initiative',
          ].map((metric) => (
            <div key={metric} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
              <span className="font-medium capitalize">{metric}</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleBehavioralRatingChange(metric, value)}
                    className={`w-10 h-10 rounded-lg font-bold transition-all ${
                      getBehavioralRating(selectedStudentForBehavioral?.id || '', metric) === value
                        ? 'bg-primary-500 text-white'
                        : 'bg-white border border-neutral-300 hover:border-primary-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Button onClick={saveBehavioralRatings} className="w-full">
            Save Behavioral Ratings
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default ScoreEntryPageEnhanced;
