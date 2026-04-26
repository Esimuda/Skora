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

export const HybridResultSheet: React.FC<Props> = ({
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

  const BarRating = ({ skillId }: { skillId: string }) => {
    const score = getPsychScore(skillId) ?? 0;
    const pct = (score / 5) * 100;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
        <div style={{ flex: 1, height: '4px', backgroundColor: '#edeeef', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: score >= 4 ? '#735c00' : score >= 3 ? '#002366' : '#757682', borderRadius: '9999px' }} />
        </div>
        <span style={{ fontSize: '7.5px', color: '#444650', minWidth: '38px', textAlign: 'right' }}>
          {PSYCHOMETRIC_RATING_LABELS[score] ?? '—'}
        </span>
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
    }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '14px 16mm 10px', backgroundColor: '#ffffff', borderBottom: '1px solid rgba(197,198,210,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {school.logo ? (
              <img src={school.logo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '60px', height: '60px', backgroundColor: '#f3f4f5', border: '0.5px solid #c5c6d2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#00113a' }}>S</span>
              </div>
            )}
            <div>
              <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '17px', fontWeight: 700, color: '#00113a', lineHeight: 1.1 }}>
                {school.name}
              </div>
              <div style={{ fontSize: '7.5px', color: '#735c00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '3px' }}>
                {school.motto || 'Excellence & Integrity'}
              </div>
              <div style={{ fontSize: '7.5px', color: '#757682', marginTop: '4px' }}>
                {school.address} · {school.phoneNumber}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Noto Serif', serif", fontStyle: 'italic', fontSize: '11px', color: '#00113a', fontWeight: 700 }}>
              Office of the Registrar
            </div>
            <div style={{ fontSize: '8px', color: '#444650', marginTop: '3px' }}>Terminal Academic Record</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
              <div style={{ backgroundColor: '#f3f4f5', padding: '4px 8px', borderRadius: '2px', textAlign: 'center' }}>
                <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#757682', letterSpacing: '0.5px', fontWeight: 700 }}>Session</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#00113a' }}>{academicYear}</div>
              </div>
              <div style={{ backgroundColor: '#00113a', padding: '4px 8px', borderRadius: '2px', textAlign: 'center' }}>
                <div style={{ fontSize: '7px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', fontWeight: 700 }}>Term</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#fed65b' }}>{getTermName(term)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STUDENT PARTICULARS ── */}
      <div style={{ padding: '10px 16mm', display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', backgroundColor: '#f3f4f5', marginBottom: '2px' }}>
        <div>
          <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#735c00', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '6px' }}>
            Student Particulars
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px' }}>
            {[
              ['Full Name', studentFullName.toUpperCase()],
              ['Admission No.', student.admissionNumber],
              ['Class / Level', student.classId],
              ['Term', `${getTermName(term)} Term`],
              ['Session', academicYear],
              ['Gender', student.gender === 'male' ? 'Male' : 'Female'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '7px', color: '#757682', marginBottom: '1px' }}>{label}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#00113a' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
          <div style={{ width: '62px', height: '76px', backgroundColor: '#edeeef', border: '0.5px solid #c5c6d2', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '2px' }}>
            {student.passportPhoto ? (
              <img src={student.passportPhoto} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '26px', color: '#c5c6d2' }}>👤</span>
            )}
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE INDEX ── */}
      <div style={{ padding: '8px 16mm', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '2px' }}>
        <div style={{ backgroundColor: '#00113a', borderRadius: '4px', padding: '8px 10px' }}>
          <div style={{ fontSize: '7px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px', fontWeight: 700 }}>Position</div>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '14px', fontWeight: 700, color: '#fed65b', marginTop: '3px' }}>
            {formatPosition(position)}
          </div>
          <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.5)', marginTop: '1px' }}>of {totalStudents} students</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '8px 10px', border: '0.5px solid rgba(197,198,210,0.5)' }}>
          <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#757682', letterSpacing: '0.5px', fontWeight: 700 }}>Total Score</div>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '14px', fontWeight: 700, color: '#00113a', marginTop: '3px' }}>{totalScore}</div>
          <div style={{ fontSize: '7.5px', color: '#757682', marginTop: '1px' }}>out of {totalPossible}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '8px 10px', border: '0.5px solid rgba(197,198,210,0.5)' }}>
          <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#757682', letterSpacing: '0.5px', fontWeight: 700 }}>Percentage</div>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '14px', fontWeight: 700, color: '#00113a', marginTop: '3px' }}>{percentage.toFixed(1)}%</div>
          <div style={{ marginTop: '4px', width: '100%', height: '3px', backgroundColor: '#edeeef', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: percentage >= 75 ? '#735c00' : '#002366', borderRadius: '9999px' }} />
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '8px 10px', border: '0.5px solid rgba(197,198,210,0.5)' }}>
          <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#757682', letterSpacing: '0.5px', fontWeight: 700 }}>Class Highest</div>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '14px', fontWeight: 700, color: '#00113a', marginTop: '3px' }}>
            {classHighest?.toFixed(1) ?? '—'}%
          </div>
          <div style={{ fontSize: '7.5px', color: '#757682', marginTop: '1px' }}>
            Avg: {classAverage?.toFixed(1) ?? '—'}%
          </div>
        </div>
      </div>

      {/* ── ACADEMIC TABLE ── */}
      <div style={{ padding: '10px 16mm', backgroundColor: '#ffffff', marginBottom: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '11px', fontWeight: 700, color: '#00113a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '1.5px', backgroundColor: '#735c00', verticalAlign: 'middle' }} />
            Academic Performance Record
          </div>
          <div style={{ fontSize: '7.5px', color: '#757682', fontStyle: 'italic' }}>CA1 (20) + CA2 (20) + Exam (60) = 100</div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
          <thead>
            <tr>
              <th style={{ padding: '5px 8px', textAlign: 'left', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', color: '#444650', letterSpacing: '0.5px', backgroundColor: '#f3f4f5', borderRadius: '2px 0 0 2px' }}>Subject</th>
              {['CA1', 'CA2', 'Exam', 'Total', 'Grade', 'Remark'].map((h, i) => (
                <th key={h} style={{ padding: '5px 6px', textAlign: 'center', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', color: '#444650', letterSpacing: '0.3px', backgroundColor: '#f3f4f5', borderRadius: i === 5 ? '0 2px 2px 0' : 0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scores.map((score, idx) => (
              <tr key={idx}>
                <td style={{ padding: '4px 8px', fontWeight: 600, color: '#00113a', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>{score.subjectId}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>{score.ca1}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>{score.ca2}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>{score.exam}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#00113a', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>{score.total}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>
                  <span style={{
                    backgroundColor: score.total >= 75 ? 'rgba(115,92,0,0.12)' : score.total >= 50 ? 'rgba(0,35,102,0.08)' : '#f3f4f5',
                    color: score.total >= 75 ? '#735c00' : score.total >= 50 ? '#002366' : '#444650',
                    padding: '1px 5px', borderRadius: '2px', fontSize: '8px', fontWeight: 700,
                  }}>
                    {score.grade}
                  </span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#757682', fontStyle: 'italic', borderBottom: '0.5px solid rgba(197,198,210,0.3)' }}>{score.remark}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f3f4f5' }}>
              <td colSpan={4} style={{ padding: '4px 8px', fontWeight: 700, color: '#444650', textAlign: 'right', fontSize: '8px', textTransform: 'uppercase' }}>Summary</td>
              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 900, color: '#00113a' }}>{totalScore}</td>
              <td colSpan={2} style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#735c00' }}>{percentage.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── PSYCHOMETRIC ── */}
      <div style={{ padding: '10px 16mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', backgroundColor: '#ffffff', marginBottom: '2px' }}>
        {[
          { title: 'Affective Domain', skills: affectiveSkills },
          { title: 'Psychomotor Domain', skills: psychomotorSkills },
        ].map(({ title, skills }) => (
          <div key={title}>
            <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#735c00', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '1.5px', backgroundColor: '#735c00' }} />
              {title}
            </div>
            {skills.map((skill) => (
              <div key={skill.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2.5px 0' }}>
                <span style={{ fontSize: '8.5px', color: '#444650', minWidth: '70px' }}>{skill.name}</span>
                <BarRating skillId={skill.id} />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── COMMENTS + GRADING ── */}
      <div style={{ padding: '10px 16mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: '#ffffff', marginBottom: '2px' }}>
        {/* Comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: "Class Teacher's Comment", text: comment?.teacherComment },
            { label: school.principalName ? `${school.principalName}'s Comment` : "Principal's Comment", text: comment?.principalComment },
          ].map(({ label, text }) => (
            <div key={label}>
              <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#735c00', fontWeight: 700, letterSpacing: '0.8px', marginBottom: '3px' }}>{label}</div>
              <div style={{ fontSize: '8.5px', fontStyle: 'italic', color: '#191c1d', lineHeight: 1.5, minHeight: '22px' }}>{text || '—'}</div>
              <div style={{ borderTop: '0.5px solid rgba(197,198,210,0.5)', marginTop: '5px', paddingTop: '3px', fontSize: '7.5px', color: '#757682' }}>
                Signature: ___________________
              </div>
            </div>
          ))}
        </div>

        {/* Grading scale */}
        <div>
          <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#735c00', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '16px', height: '1.5px', backgroundColor: '#735c00' }} />
            Grading Scale
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f5' }}>
                {['Grade', 'Score Range', 'Remark'].map((h) => (
                  <th key={h} style={{ padding: '3px 6px', textAlign: 'left', fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', color: '#757682', letterSpacing: '0.3px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gradingScale.map((g) => (
                <tr key={g.id} style={{ borderBottom: '0.5px solid rgba(197,198,210,0.2)' }}>
                  <td style={{ padding: '2.5px 6px', fontWeight: 700, color: '#00113a' }}>{g.grade}</td>
                  <td style={{ padding: '2.5px 6px', color: '#444650' }}>{g.minPercentage}–{g.maxPercentage}%</td>
                  <td style={{ padding: '2.5px 6px', color: '#444650', fontStyle: 'italic' }}>{g.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '8px', backgroundColor: '#f3f4f5', borderRadius: '2px', padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '7px', color: '#757682', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Term Begins</div>
            <div style={{ borderBottom: '0.5px solid #c5c6d2', marginTop: '8px', width: '120px', display: 'inline-block' }} />
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ padding: '6px 16mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a2a37' }}>
        <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '9px', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
          {school.name}
        </div>
        <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {academicYear} · {getTermName(term)} Term · Powered by Skora RMS
        </div>
      </div>

    </div>
  );
};