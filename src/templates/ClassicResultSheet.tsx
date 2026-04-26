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

export const ClassicResultSheet: React.FC<Props> = ({
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

  const getPsychLabel = (skillId: string): string => {
    const score = getPsychScore(skillId);
    if (score === null) return '—';
    return `${score} — ${PSYCHOMETRIC_RATING_LABELS[score] ?? ''}`;
  };

  // Dot rating helper (filled dots out of 5)
  const DotRating = ({ skillId }: { skillId: string }) => {
    const score = getPsychScore(skillId) ?? 0;
    return (
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: '8px', height: '8px',
              borderRadius: '2px',
              backgroundColor: i <= score ? '#00113a' : '#e1e3e4',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      width: '210mm',
      minHeight: '297mm',
      backgroundColor: '#ffffff',
      color: '#191c1d',
      fontSize: '10px',
      padding: '12mm 14mm',
      boxSizing: 'border-box',
      position: 'relative',
    }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: '2.5px solid #00113a', paddingBottom: '10px', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {school.logo ? (
            <img src={school.logo} alt="Logo" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '56px', height: '56px', backgroundColor: '#00113a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fed65b', fontWeight: 900, fontSize: '20px' }}>S</span>
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '16px', fontWeight: 900, color: '#00113a', textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {school.name}
            </div>
            {school.motto && (
              <div style={{ fontFamily: "'Noto Serif', serif", fontStyle: 'italic', fontSize: '9px', color: '#444650', marginTop: '3px' }}>
                "{school.motto}"
              </div>
            )}
            <div style={{ fontSize: '8px', color: '#757682', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {school.address} &nbsp;·&nbsp; Tel: {school.phoneNumber}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ backgroundColor: '#00113a', color: '#fed65b', fontSize: '8px', fontWeight: 700, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px', display: 'inline-block' }}>
            Terminal Report Sheet
          </div>
          <div style={{ fontSize: '9px', color: '#00113a', fontWeight: 700 }}>{academicYear} Academic Session</div>
          <div style={{ fontSize: '8px', color: '#757682' }}>{getTermName(term)} Term</div>
        </div>
      </div>

      {/* ── STUDENT INFO ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '10px', backgroundColor: '#f3f4f5', padding: '8px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
          {[
            ['Student Name', studentFullName.toUpperCase()],
            ['Admission No.', student.admissionNumber],
            ['Class', student.classId],
            ['Gender', student.gender === 'male' ? 'Male' : 'Female'],
            ['Term', `${getTermName(term)} Term`],
            ['Session', academicYear],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '7.5px', textTransform: 'uppercase', color: '#757682', fontWeight: 700, letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#00113a', marginTop: '1px' }}>{value}</div>
            </div>
          ))}
        </div>
        <div style={{ width: '60px', height: '75px', border: '0.5px solid #c5c6d2', backgroundColor: '#edeeef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {student.passportPhoto ? (
            <img src={student.passportPhoto} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '24px', color: '#c5c6d2' }}>👤</span>
          )}
        </div>
      </div>

      {/* ── CLASS STATS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '10px' }}>
        {[
          ['Position', `${formatPosition(position)} of ${totalStudents}`],
          ['Total Score', `${totalScore} / ${totalPossible}`],
          ['Percentage', `${percentage.toFixed(1)}%`],
          ['Class Highest', `${classHighest?.toFixed(1) ?? '—'}%`],
        ].map(([label, value]) => (
          <div key={label} style={{ backgroundColor: '#00113a', padding: '5px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '7px', color: '#b3c5ff', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: '11px', color: '#fed65b', fontWeight: 900, marginTop: '2px', fontFamily: "'Noto Serif', serif" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── ACADEMIC PERFORMANCE ── */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ borderLeft: '3px solid #fed65b', paddingLeft: '8px', marginBottom: '6px' }}>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '11px', fontWeight: 700, color: '#00113a', textTransform: 'uppercase', letterSpacing: '1px' }}>
            I. Academic Performance
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr style={{ backgroundColor: '#edeeef' }}>
              {['Subject', 'CA1 (20)', 'CA2 (20)', 'Exam (60)', 'Total (100)', 'Grade', 'Remark'].map((h) => (
                <th key={h} style={{ padding: '4px 6px', textAlign: h === 'Subject' ? 'left' : 'center', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', color: '#444650', letterSpacing: '0.3px', borderBottom: '1px solid #c5c6d226' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scores.map((score, idx) => (
              <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f3f4f5' }}>
                <td style={{ padding: '3.5px 6px', fontWeight: 600, color: '#00113a' }}>{score.subjectId}</td>
                <td style={{ padding: '3.5px 6px', textAlign: 'center' }}>{score.ca1}</td>
                <td style={{ padding: '3.5px 6px', textAlign: 'center' }}>{score.ca2}</td>
                <td style={{ padding: '3.5px 6px', textAlign: 'center' }}>{score.exam}</td>
                <td style={{ padding: '3.5px 6px', textAlign: 'center', fontWeight: 700, color: '#00113a' }}>{score.total}</td>
                <td style={{ padding: '3.5px 6px', textAlign: 'center' }}>
                  <span style={{ backgroundColor: score.total >= 75 ? '#fed65b' : score.total >= 50 ? '#dbe1ff' : '#edeeef', color: '#00113a', padding: '1px 5px', fontSize: '8px', fontWeight: 700 }}>
                    {score.grade}
                  </span>
                </td>
                <td style={{ padding: '3.5px 6px', textAlign: 'center', color: '#444650', fontStyle: 'italic' }}>{score.remark}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#00113a' }}>
              <td colSpan={4} style={{ padding: '4px 6px', color: '#b3c5ff', fontSize: '8px', fontWeight: 700, textAlign: 'right', textTransform: 'uppercase' }}>Total / Average</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', color: '#fed65b', fontWeight: 900 }}>{totalScore}</td>
              <td colSpan={2} style={{ padding: '4px 6px', textAlign: 'center', color: '#fed65b', fontWeight: 700 }}>{percentage.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PSYCHOMETRIC ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {[
          { title: 'II. Affective Domain', skills: affectiveSkills },
          { title: 'III. Psychomotor Domain', skills: psychomotorSkills },
        ].map(({ title, skills }) => (
          <div key={title}>
            <div style={{ borderLeft: '3px solid #fed65b', paddingLeft: '8px', marginBottom: '6px' }}>
              <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '10px', fontWeight: 700, color: '#00113a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {title}
              </div>
            </div>
            <div style={{ backgroundColor: '#f3f4f5', padding: '8px' }}>
              {skills.map((skill) => (
                <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5px 0', borderBottom: '0.5px solid #c5c6d220' }}>
                  <span style={{ fontSize: '8.5px', color: '#444650' }}>{skill.name}</span>
                  <DotRating skillId={skill.id} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: '7.5px', color: '#757682', marginTop: '3px' }}>
              ■■■■■ = Excellent &nbsp; ■■■■□ = V. Good &nbsp; ■■■□□ = Good &nbsp; ■■□□□ = Fair &nbsp; ■□□□□ = Poor
            </div>
          </div>
        ))}
      </div>

      {/* ── GRADING SCALE ── */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ borderLeft: '3px solid #fed65b', paddingLeft: '8px', marginBottom: '5px' }}>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '10px', fontWeight: 700, color: '#00113a', textTransform: 'uppercase', letterSpacing: '1px' }}>
            IV. Grading Scale
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
          <thead>
            <tr style={{ backgroundColor: '#edeeef' }}>
              {gradingScale.map((g) => (
                <th key={g.id} style={{ padding: '3px 4px', textAlign: 'center', fontWeight: 700, color: '#00113a' }}>{g.grade}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {gradingScale.map((g) => (
                <td key={g.id} style={{ padding: '2px 4px', textAlign: 'center', color: '#444650' }}>{g.minPercentage}–{g.maxPercentage}%</td>
              ))}
            </tr>
            <tr style={{ backgroundColor: '#f3f4f5' }}>
              {gradingScale.map((g) => (
                <td key={g.id} style={{ padding: '2px 4px', textAlign: 'center', color: '#444650', fontStyle: 'italic' }}>{g.remark}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── COMMENTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div style={{ backgroundColor: '#f3f4f5', padding: '8px' }}>
          <div style={{ fontSize: '7.5px', textTransform: 'uppercase', color: '#757682', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '5px' }}>
            Class Teacher's Comment
          </div>
          <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#191c1d', minHeight: '30px', lineHeight: 1.5 }}>
            {comment?.teacherComment || '—'}
          </div>
          <div style={{ borderTop: '0.5px solid #c5c6d2', marginTop: '10px', paddingTop: '5px', fontSize: '7.5px', color: '#757682' }}>
            Signature: ___________________
          </div>
        </div>
        <div style={{ backgroundColor: '#f3f4f5', padding: '8px' }}>
          <div style={{ fontSize: '7.5px', textTransform: 'uppercase', color: '#757682', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '5px' }}>
            {school.principalName ? `${school.principalName}'s Comment` : "Principal's Comment"}
          </div>
          <div style={{ fontSize: '9px', fontStyle: 'italic', color: '#191c1d', minHeight: '30px', lineHeight: 1.5 }}>
            {comment?.principalComment || '—'}
          </div>
          <div style={{ borderTop: '0.5px solid #c5c6d2', marginTop: '10px', paddingTop: '5px', fontSize: '7.5px', color: '#757682', display: 'flex', justifyContent: 'space-between' }}>
            <span>Signature: ___________________</span>
            <span>[School Stamp]</span>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: '2px solid #00113a', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '8px', color: '#757682' }}>
          Next Term Begins: ___________________
        </div>
        <div style={{ textAlign: 'center', fontSize: '8px', color: '#00113a', fontWeight: 700, fontFamily: "'Noto Serif', serif" }}>
          {school.name} · {academicYear} {getTermName(term)} Term Report
        </div>
        <div style={{ fontSize: '8px', color: '#757682' }}>
          Generated by Skora RMS
        </div>
      </div>

    </div>
  );
};