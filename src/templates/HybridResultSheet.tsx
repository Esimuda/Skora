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
  watermarked?: boolean;
}

export const HybridResultSheet: React.FC<Props> = ({
  result,
  school,
  gradingScale = DEFAULT_NIGERIAN_GRADING.map((g, i) => ({ ...g, id: `${i}`, schoolId: school.id })),
  watermarked = false,
}) => {
  const {
    student, scores, psychometricAssessment, comment,
    totalScore, totalPossible, percentage, position,
    totalStudents, classHighest, classAverage, term, academicYear,
    attendance, teacherName, principalName,
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

  // Shared style so every total/score cell sits perfectly centered, both axes.
  const cellStyle: React.CSSProperties = {
    padding: '4px 6px',
    textAlign: 'center',
    verticalAlign: 'middle',
    borderBottom: '0.5px solid rgba(197,198,210,0.3)',
  };
  const cellStyleLeft: React.CSSProperties = {
    padding: '4px 8px',
    textAlign: 'left',
    verticalAlign: 'middle',
    borderBottom: '0.5px solid rgba(197,198,210,0.3)',
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
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── WATERMARK ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {school.logo ? (
          <img
            src={school.logo}
            alt=""
            style={{
              width: '520px',
              height: '520px',
              objectFit: 'contain',
              opacity: 0.07,
              filter: 'grayscale(100%)',
              userSelect: 'none',
            }}
          />
        ) : (
          <div style={{
            fontSize: '340px',
            fontWeight: 900,
            color: '#00113a',
            opacity: 0.05,
            fontFamily: "'Noto Serif', serif",
            userSelect: 'none',
            lineHeight: 1,
          }}>
            {(school.name ?? 'S')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* All content sits above watermark */}
      <div style={{ position: 'relative', zIndex: 1 }}>

      {/* ── HEADER ── */}
      <div style={{ padding: '14px 16mm 10px', backgroundColor: '#ffffff', borderBottom: '2px solid #00113a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {school.logo ? (
            <img src={school.logo} alt="Logo" style={{ width: '72px', height: '72px', objectFit: 'contain', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '72px', height: '72px', backgroundColor: '#f3f4f5', border: '0.5px solid #c5c6d2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#00113a' }}>{(school.name ?? 'S')[0].toUpperCase()}</span>
            </div>
          )}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '22px', fontWeight: 900, color: '#00113a', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {school.name}
            </div>
            {school.motto && (
              <div style={{ fontSize: '7.5px', color: '#735c00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '3px' }}>
                {school.motto}
              </div>
            )}
            <div style={{ fontSize: '7.5px', color: '#757682', marginTop: '4px' }}>
              {school.address} &nbsp;·&nbsp; Tel: {school.phoneNumber}
            </div>
          </div>
          <div style={{ width: '72px', flexShrink: 0 }} />
        </div>
      </div>

      {/* ── TERM BAND — below divider ── */}
      <div style={{ backgroundColor: '#00113a', padding: '5px 16mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '8px', color: '#fed65b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Terminal Academic Record
        </div>
        <div style={{ fontSize: '8px', color: '#ffffff', fontWeight: 600 }}>
          {academicYear} Academic Session &nbsp;·&nbsp; {getTermName(term)}
        </div>
      </div>

      {/* ── STUDENT PARTICULARS ── */}
      <div style={{ padding: '10px 16mm', backgroundColor: '#f3f4f5', marginBottom: '2px' }}>
        <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#735c00', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '6px' }}>
          Student Particulars
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 16px' }}>
            {[
              ['Full Name', studentFullName.toUpperCase()],
              ['Admission No.', student.admissionNumber],
              ['Class / Level', (student as any).className ?? student.classId],
              ['Term', getTermName(term)],
              ['Session', academicYear],
              ['Gender', student.gender === 'male' ? 'Male' : 'Female'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '7px', color: '#757682', marginBottom: '1px' }}>{label}</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#00113a' }}>{value}</div>
              </div>
            ))}
          </div>
          {/* ── PASSPORT PHOTO ── */}
          <div style={{ flexShrink: 0, width: '60px', height: '72px', border: '1.5px solid #c5c6d2', backgroundColor: '#e8e9ed', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="Passport" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            ) : (
              <span style={{ fontSize: '7px', color: '#9a9ba8', textAlign: 'center', lineHeight: 1.3, padding: '4px' }}>No Photo</span>
            )}
          </div>
        </div>
      </div>

      {/* ── PERFORMANCE INDEX ── */}
      <div style={{ padding: '8px 16mm', display: 'grid', gridTemplateColumns: attendance ? '1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '2px' }}>
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
        {attendance && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '4px', padding: '8px 10px', border: '0.5px solid rgba(197,198,210,0.5)' }}>
            <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#757682', letterSpacing: '0.5px', fontWeight: 700 }}>Attendance</div>
            <div style={{ fontFamily: "'Noto Serif', serif", fontSize: '14px', fontWeight: 700, color: '#00113a', marginTop: '3px' }}>{attendance.daysPresent}</div>
            <div style={{ fontSize: '7.5px', color: '#757682', marginTop: '1px' }}>of {attendance.daysSchoolOpened} days</div>
          </div>
        )}
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
              <th style={{ padding: '5px 8px', textAlign: 'left', verticalAlign: 'middle', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', color: '#444650', letterSpacing: '0.5px', backgroundColor: '#f3f4f5', borderRadius: '2px 0 0 2px' }}>Subject</th>
              {['CA1', 'CA2', 'Exam', 'Total', 'Grade', 'Remark'].map((h, i) => (
                <th key={h} style={{ padding: '5px 6px', textAlign: 'center', verticalAlign: 'middle', fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', color: '#444650', letterSpacing: '0.3px', backgroundColor: '#f3f4f5', borderRadius: i === 5 ? '0 2px 2px 0' : 0 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scores.map((score, idx) => (
              <tr key={idx}>
                <td style={{ ...cellStyleLeft, fontWeight: 600, color: '#00113a' }}>{(score as any).subjectName ?? score.subjectId}</td>
                <td style={cellStyle}>{score.ca1}</td>
                <td style={cellStyle}>{score.ca2}</td>
                <td style={cellStyle}>{score.exam}</td>
                <td style={{ ...cellStyle, fontWeight: 700, color: '#00113a' }}>{score.total}</td>
                <td style={cellStyle}>
                  <span style={{
                    backgroundColor: score.total >= 75 ? 'rgba(115,92,0,0.12)' : score.total >= 50 ? 'rgba(0,35,102,0.08)' : '#f3f4f5',
                    color: score.total >= 75 ? '#735c00' : score.total >= 50 ? '#002366' : '#444650',
                    padding: '1px 5px', borderRadius: '2px', fontSize: '8px', fontWeight: 700,
                  }}>
                    {score.grade}
                  </span>
                </td>
                <td style={{ ...cellStyle, color: '#757682', fontStyle: 'italic' }}>{score.remark}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f3f4f5' }}>
              <td colSpan={4} style={{ ...cellStyle, borderBottom: 'none', textAlign: 'right', fontWeight: 700, color: '#444650', fontSize: '8px', textTransform: 'uppercase' }}>Summary</td>
              <td style={{ ...cellStyle, borderBottom: 'none', fontWeight: 900, color: '#00113a' }}>{totalScore}</td>
              <td colSpan={2} style={{ ...cellStyle, borderBottom: 'none', fontWeight: 700, color: '#735c00' }}>{percentage.toFixed(1)}%</td>
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
          <div>
            <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#735c00', fontWeight: 700, letterSpacing: '0.8px', marginBottom: '3px' }}>Class Teacher's Comment</div>
            <div style={{ fontSize: '8.5px', fontStyle: 'italic', color: '#191c1d', lineHeight: 1.5, minHeight: '22px' }}>{comment?.teacherComment || '—'}</div>
            <div style={{ borderTop: '0.5px solid rgba(197,198,210,0.5)', marginTop: '5px', paddingTop: '3px', fontSize: '7.5px', color: '#757682' }}>
              {teacherName && <div style={{ fontWeight: 700, color: '#00113a', marginBottom: '2px' }}>{teacherName}</div>}
              Class Teacher's Signature: ___________________
            </div>
          </div>
          <div>
            <div style={{ fontSize: '7px', textTransform: 'uppercase', color: '#735c00', fontWeight: 700, letterSpacing: '0.8px', marginBottom: '3px' }}>Principal's Comment</div>
            <div style={{ fontSize: '8.5px', fontStyle: 'italic', color: '#191c1d', lineHeight: 1.5, minHeight: '22px' }}>{comment?.principalComment || '—'}</div>
            <div style={{ borderTop: '0.5px solid rgba(197,198,210,0.5)', marginTop: '5px', paddingTop: '3px', fontSize: '7.5px', color: '#757682', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                {principalName && <div style={{ fontWeight: 700, color: '#00113a', marginBottom: '2px' }}>{principalName}</div>}
                <span>Principal's Signature: ___________________</span>
              </div>
              <span>[School Stamp]</span>
            </div>
          </div>
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
          {academicYear} · {getTermName(term)} · Powered by Skora RMS
        </div>
      </div>

      </div>{/* end zIndex wrapper */}

      {/* ── UNOFFICIAL COPY overlays (only when watermarked=true) ── */}
      {watermarked && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
          {[
            { top: '15%', left: '50%', rotate: '-35deg' },
            { top: '35%', left: '20%', rotate: '-35deg' },
            { top: '35%', left: '80%', rotate: '-35deg' },
            { top: '60%', left: '50%', rotate: '-35deg' },
            { top: '80%', left: '30%', rotate: '-35deg' },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              transform: `translate(-50%, -50%) rotate(${pos.rotate})`,
              fontSize: '38px',
              fontWeight: 900,
              color: 'rgba(180,0,0,0.13)',
              letterSpacing: '4px',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              fontFamily: "'Inter', sans-serif",
            }}>
              UNOFFICIAL COPY
            </div>
          ))}
        </div>
      )}
    </div>
  );
};