/**
 * Local Storage Utility for Offline Data Persistence
 * All data is stored locally on device to support offline result input
 */

const STORAGE_PREFIX = 'skora_';

export const localStorageService = {
  save<T>(key: string, data: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  get<T>(key: string): T | null {
    try {
      const serialized = localStorage.getItem(STORAGE_PREFIX + key);
      if (serialized === null) return null;
      return JSON.parse(serialized) as T;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  exists(key: string): boolean {
    return localStorage.getItem(STORAGE_PREFIX + key) !== null;
  },

  // ── Scores ──────────────────────────────────────────────────────────────
  autoSaveScores(classId: string, subjectId: string, scores: unknown[]): void {
    this.save(`scores_${classId}_${subjectId}`, {
      scores,
      lastSaved: new Date().toISOString(),
      synced: false,
    });
  },

  getSavedScores(classId: string, subjectId: string): { scores: unknown[]; lastSaved: string; synced: boolean } | null {
    return this.get(`scores_${classId}_${subjectId}`);
  },

  markSynced(classId: string, subjectId: string): void {
    const key = `scores_${classId}_${subjectId}`;
    const data = this.get(key);
    if (data) this.save(key, { ...(data as object), synced: true });
  },

  getUnsyncedData(): string[] {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX + 'scores_'))
      .filter((k) => {
        const data = this.get(k.replace(STORAGE_PREFIX, '')) as { synced?: boolean } | null;
        return data && !data.synced;
      });
  },

  // ── Psychometric Assessments ─────────────────────────────────────────────
  savePsychometric(classId: string, studentId: string, ratings: Record<string, string>): void {
    this.save(`psychometric_${classId}_${studentId}`, {
      ratings,
      lastSaved: new Date().toISOString(),
      synced: false,
    });
  },

  getPsychometric(classId: string, studentId: string): { ratings: Record<string, string>; lastSaved: string } | null {
    return this.get(`psychometric_${classId}_${studentId}`);
  },

  // ── Behavioral (legacy) ──────────────────────────────────────────────────
  saveBehavioral(classId: string, studentId: string, ratings: unknown): void {
    this.save(`behavioral_${classId}_${studentId}`, {
      ratings,
      lastSaved: new Date().toISOString(),
      synced: false,
    });
  },

  getBehavioral(classId: string, studentId: string): unknown {
    return this.get(`behavioral_${classId}_${studentId}`);
  },

  // ── Comments ─────────────────────────────────────────────────────────────
  saveComment(classId: string, studentId: string, comment: string, type: 'teacher' | 'principal'): void {
    this.save(`comment_${type}_${classId}_${studentId}`, {
      comment,
      lastSaved: new Date().toISOString(),
      synced: false,
    });
  },

  getComment(classId: string, studentId: string, type: 'teacher' | 'principal'): { comment: string; lastSaved: string } | null {
    return this.get(`comment_${type}_${classId}_${studentId}`);
  },

  saveAllComments(classId: string, comments: Record<string, { teacher: string; principal?: string }>): void {
    this.save(`comments_all_${classId}`, { comments, lastSaved: new Date().toISOString() });
  },

  getAllComments(classId: string): { comments: Record<string, { teacher: string; principal?: string }>; lastSaved: string } | null {
    return this.get(`comments_all_${classId}`);
  },

  // ── Class Results / Workflow ──────────────────────────────────────────────
  saveClassResult(classId: string, term: string, result: unknown): void {
    this.save(`class_result_${classId}_${term}`, result);
  },

  getClassResult(classId: string, term: string): unknown {
    return this.get(`class_result_${classId}_${term}`);
  },

  saveNotifications(userId: string, notifications: unknown[]): void {
    this.save(`notifications_${userId}`, notifications);
  },

  getNotifications(userId: string): unknown[] {
    return this.get(`notifications_${userId}`) || [];
  },

  // ── School info ────────────────────────────────────────────────────────
  saveSchoolInfo(school: unknown): void {
    this.save('school_info', school);
  },

  getSchoolInfo(): unknown {
    return this.get('school_info');
  },

  // ── All class data for offline ──────────────────────────────────────────
  saveClassScores(classId: string, allScores: unknown): void {
    this.save(`all_scores_${classId}`, { data: allScores, lastSaved: new Date().toISOString() });
  },

  getClassScores(classId: string): unknown {
    return this.get(`all_scores_${classId}`);
  },
};
