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

export const ClassicResultSheet: React.FC<Props> = ({
  result,
  school,
  gradingScale = DEFAULT_NIGERIAN_GRADING.map((g, i) => ({ ...g, id: `${i}`, schoolId: school.id })),
  watermarked = false,
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

  // Shared cell style for perfect centering in every data cell
  const cellStyle: React.CSSProperties = {
    padding: '4px 6px',
    textAlign: 'center',
    verticalAlign: 'middle',
  };

  const thStyle: React.CSSProperties = {
    padding: '4px 6px',
    textAlign: 'center',
    verticalAlign: 'middle',
    fontSize: '7.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#444650',
    letterSpacing: '0.3px',
    borderBottom: '1px solid #c5c6d226',
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
            <div style={{ fontSize: '8px', color: '#757682' }}>{getTermName(term)}</div>
          </div>
        </div>

        {/* ── STUDENT INFO ── */}
        <div style={{ marginBottom: '10px', backgroundColor: '#f3f4f5', padding: '8px 10px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
            {[
              ['Student Name', studentFullName.toUpperCase()],
              ['Admission No.', student.admissionNumber],
              ['Class', (student as any).className ?? student.classId],
              ['Gender', student.gender === 'male' ? 'Male' : 'Female'],
              ['Term', getTermName(term)],
              ['Session', academicYear],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '7.5px', textTransform: 'uppercase', color: '#757682', fontWeight: 700, letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#00113a', marginTop: '1px' }}>{value}</div>
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
                <th style={{ ...thStyle, textAlign: 'left' }}>Subject</th>
                {['CA1 (20)', 'CA2 (20)', 'Exam (60)', 'Total (100)', 'Grade', 'Remark'].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scores.map((score, idx) => (
                <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f3f4f5' }}>
                  <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 600, color: '#00113a' }}>{(score as any).subjectName ?? score.subjectId}</td>
                  <td style={cellStyle}>{score.ca1}</td>
                  <td style={cellStyle}>{score.ca2}</td>
                  <td style={cellStyle}>{score.exam}</td>
                  <td style={{ ...cellStyle, fontWeight: 700, color: '#00113a' }}>{score.total}</td>
                  <td style={cellStyle}>
                    <span style={{ backgroundColor: score.total >= 75 ? '#fed65b' : score.total >= 50 ? '#dbe1ff' : '#edeeef', color: '#00113a', padding: '1px 5px', fontSize: '8px', fontWeight: 700 }}>
                      {score.grade}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, color: '#444650', fontStyle: 'italic' }}>{score.remark}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#00113a' }}>
                <td colSpan={4} style={{ ...cellStyle, textAlign: 'right', color: '#b3c5ff', fontSize: '8px', fontWeight: 700, textTransform: 'uppercase' }}>Total / Average</td>
                <td style={{ ...cellStyle, color: '#fed65b', fontWeight: 900 }}>{totalScore}</td>
                <td colSpan={2} style={{ ...cellStyle, color: '#fed65b', fontWeight: 700 }}>{percentage.toFixed(1)}%</td>
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
                  <th key={g.id} style={{ padding: '3px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 700, color: '#00113a' }}>{g.grade}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {gradingScale.map((g) => (
                  <td key={g.id} style={{ padding: '2px 4px', textAlign: 'center', verticalAlign: 'middle', color: '#444650' }}>{g.minPercentage}–{g.maxPercentage}%</td>
                ))}
              </tr>
              <tr style={{ backgroundColor: '#f3f4f5' }}>
                {gradingScale.map((g) => (
                  <td key={g.id} style={{ padding: '2px 4px', textAlign: 'center', verticalAlign: 'middle', color: '#444650', fontStyle: 'italic' }}>{g.remark}</td>
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
            {school.name} · {academicYear} {getTermName(term)} Report
          </div>
          <div style={{ fontSize: '8px', color: '#757682' }}>
            Generated by Skora RMS
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