import React from 'react';
import {
  StudentResult, School, GradingScale, DEFAULT_NIGERIAN_GRADING,
  DEFAULT_PSYCHOMETRIC_SKILLS, PSYCHOMETRIC_RATING_LABELS,
} from '@/types';
import { formatFullName, formatPosition, getTermName } from '@/lib/utils';

interface Props {
  result: StudentResult;
  school: School;
  gradingScale?: GradingScale[];
}

export const ModernResultSheet: React.FC<Props> = ({
  result,
  school,
  gradingScale = DEFAULT_NIGERIAN_GRADING.map((g, i) => ({ ...g, id: `${i}`, schoolId: school.id })),
}) => {
  const {
    student, scores, psychometricAssessment, comment,
    totalScore, totalPossible, percentage, position,
    totalStudents, classHighest, classAverage, term, academicYear,
  } = result;

  const studentFullName = formatFullName(student.firstName, student.lastName, student.middleName);
  const affectiveSkills = DEFAULT_PSYCHOMETRIC_SKILLS.filter((s) => s.category === 'affective');
  const psychomotorSkills = DEFAULT_PSYCHOMETRIC_SKILLS.filter((s) => s.category === 'psychomotor');

  const getPsychScore = (skillId: string): number | null => {
    const raw = psychometricAssessment?.ratings?.[skillId];
    if (raw !== undefined) {
      const n = Number(raw);
      if (n >= 1 && n <= 5) return n;
    }
    return null;
  };

  const SquareRating = ({ skillId }: { skillId: string }) => {
    const score = getPsychScore(skillId) ?? 0;
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[1,2,3,4,5].map((i) => (
          <span key={i} style={{
            display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px',
            backgroundColor: i <= score ? '#002366' : '#dbe1ff',
          }} />
        ))}
      </div>
    );
  };

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#f8f9fa',
      color: '#191c1d',
      fontSize: '10px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>

      {/* ── HEADER HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #00113a 0%, #002366 100%)',
        padding: '18px 16mm',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circle */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', backgroundColor: 'rgba(254,214,91,0.08)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {school.logo ? (
            <div style={{ width: '52px', height: '52px', backgroundColor: '#ffffff', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={school.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ width: '52px', height: '52px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#fed65b' }}>S</span>
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '18px', fontWeight: 700, color: '#ffffff', lineHeight: 1.1 }}>
              {school.name}
            </div>
            {school.motto && (
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', marginTop: '3px' }}>"{school.motto}"</div>
            )}
            <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.5)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {school.address}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '14px', fontStyle: 'italic', color: '#fed65b', marginBottom: '4px' }}>
            {getTermName(term)} Term Report
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            {academicYear} Academic Session
          </div>
          <div style={{ marginTop: '8px', backgroundColor: '#fed65b', color: '#00113a', fontSize: '7.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-block' }}>
            Student Terminal Report
          </div>
        </div>
      </div>

      {/* ── STUDENT PROFILE ── */}
      <div style={{ padding: '12px 16mm', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', backgroundColor: '#ffffff', marginBottom: '2px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 16px' }}>
          {[
            ['Student Name', studentFullName.toUpperCase()],
            ['Admission No.', student.admissionNumber],
            ['Class', student.classId],
            ['Term', `${getTermName(term)} Term`],
            ['Session', academicYear],
            ['Gender', student.gender === 'male' ? 'Male' : 'Female'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#002366', fontWeight: 700, letterSpacing: '0.8px' }}>{label}</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#00113a', marginTop: '1px' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ width: '65px', height: '80px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#edeeef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {student.passportPhoto ? (
            <img src={student.passportPhoto} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '28px', color: '#c5c6d2' }}>👤</span>
          )}
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', margin: '0 0 2px 0' }}>
        {[
          { label: 'Position', value: `${formatPosition(position)} of ${totalStudents}`, accent: true },
          { label: 'Total Score', value: `${totalScore} / ${totalPossible}`, accent: false },
          { label: 'Percentage', value: `${percentage.toFixed(1)}%`, accent: true },
          { label: 'Class Highest', value: `${classHighest?.toFixed(1) ?? '—'}%`, accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{
            backgroundColor: accent ? '#002366' : '#dbe1ff',
            padding: '8px 10px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '7px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: accent ? 'rgba(255,255,255,0.6)' : '#444650' }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: accent ? '#fed65b' : '#00113a', fontFamily: "'Noto Serif', serif", marginTop: '2px' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── ACADEMIC TABLE ── */}
      <div style={{ padding: '10px 16mm', backgroundColor: '#ffffff', marginBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '4px', height: '16px', backgroundColor: '#fed65b', borderRadius: '2px' }} />
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '11px', fontWeight: 700, color: '#00113a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Academic Performance
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr style={{ backgroundColor: '#00113a' }}>
              {['Subject', 'CA1 (20)', 'CA2 (20)', 'Exam (60)', 'Total', 'Grade', 'Remark'].map((h) => (
                <th key={h} style={{ padding: '5px 8px', textAlign: h === 'Subject' ? 'left' : 'center', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', color: '#b3c5ff', letterSpacing: '0.3px' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scores.map((score, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f3f4f5', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>
                <td style={{ padding: '4px 8px', fontWeight: 600, color: '#00113a' }}>{score.subjectId}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{score.ca1}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{score.ca2}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{score.exam}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, color: '#00113a' }}>{score.total}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                  <span style={{
                    backgroundColor: score.total >= 75 ? '#fed65b' : score.total >= 50 ? '#dbe1ff' : '#f3f4f5',
                    color: '#00113a', padding: '1px 6px', borderRadius: '3px', fontSize: '8px', fontWeight: 700,
                  }}>
                    {score.grade}
                  </span>
                </td>
                <td style={{ padding: '4px 8px', textAlign: 'center', color: '#444650', fontStyle: 'italic' }}>{score.remark}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#dbe1ff' }}>
              <td colSpan={4} style={{ padding: '4px 8px', fontWeight: 700, color: '#00113a', textAlign: 'right', fontSize: '8px', textTransform: 'uppercase' }}>Overall</td>
              <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 900, color: '#00113a' }}>{totalScore}</td>
              <td colSpan={2} style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, color: '#002366' }}>{percentage.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PSYCHOMETRIC ── */}
      <div style={{ padding: '10px 16mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#ffffff', marginBottom: '2px' }}>
        {[
          { title: 'Affective Domain', skills: affectiveSkills },
          { title: 'Psychomotor Domain', skills: psychomotorSkills },
        ].map(({ title, skills }) => (
          <div key={title}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '3px', height: '14px', backgroundColor: '#fed65b', borderRadius: '2px' }} />
              <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '10px', fontWeight: 700, color: '#00113a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {title}
              </div>
            </div>
            {skills.map((skill) => (
              <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '0.5px solid rgba(197,198,210,0.25)' }}>
                <span style={{ fontSize: '8.5px', color: '#444650' }}>{skill.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <SquareRating skillId={skill.id} />
                  <span style={{ fontSize: '7.5px', color: '#757682', minWidth: '42px', textAlign: 'right' }}>
                    {PSYCHOMETRIC_RATING_LABELS[getPsychScore(skill.id) ?? 0] ?? '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── GRADING + COMMENTS ── */}
      <div style={{ padding: '10px 16mm', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px', backgroundColor: '#ffffff', marginBottom: '2px' }}>
        {/* Grading scale */}
        <div style={{ minWidth: '160px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <div style={{ width: '3px', height: '14px', backgroundColor: '#fed65b', borderRadius: '2px' }} />
            <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '10px', fontWeight: 700, color: '#00113a', textTransform: 'uppercase' }}>Grading Scale</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
            {gradingScale.map((g) => (
              <tr key={g.id} style={{ borderBottom: '0.5px solid rgba(197,198,210,0.2)' }}>
                <td style={{ padding: '2px 4px', fontWeight: 700, color: '#00113a' }}>{g.grade}</td>
                <td style={{ padding: '2px 4px', color: '#444650' }}>{g.minPercentage}–{g.maxPercentage}%</td>
                <td style={{ padding: '2px 4px', color: '#444650', fontStyle: 'italic' }}>{g.remark}</td>
              </tr>
            ))}
          </table>
        </div>

        {/* Comments */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: "Class Teacher's Comment", text: comment?.teacherComment },
            { label: school.principalName ? `${school.principalName}'s Comment` : "Principal's Comment", text: comment?.principalComment },
          ].map(({ label, text }) => (
            <div key={label} style={{ backgroundColor: '#f3f4f5', padding: '8px', borderRadius: '4px' }}>
              <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#002366', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '8.5px', fontStyle: 'italic', color: '#191c1d', minHeight: '28px', lineHeight: 1.5 }}>{text || '—'}</div>
              <div style={{ borderTop: '0.5px solid #c5c6d2', marginTop: '8px', paddingTop: '4px', fontSize: '7.5px', color: '#757682' }}>
                Signature: ___________________
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ backgroundColor: '#00113a', padding: '8px 16mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>
          Next Term Begins: ___________________
        </div>
        <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '9px', color: '#fed65b', fontWeight: 700 }}>
          {school.name}
        </div>
        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>
          Powered by Skora RMS
        </div>
      </div>

    </div>
  );
};