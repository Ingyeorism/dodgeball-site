import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Clock,
  Crown,
  Lock,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Timer,
  Trophy,
  Unlock,
  Users,
  Volume2,
  X
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'dodgeballReunionMatches';
const ADMIN_PASSWORD = '1234';

const initialMatches = [
  { id: 1, date: '6월 8일 월', court: '1코트', teamA: '1반', teamB: '2반' },
  { id: 2, date: '6월 8일 월', court: '2코트', teamA: '3반', teamB: '4반' },
  { id: 3, date: '6월 11일 목', court: '1코트', teamA: '5반', teamB: '6반' },
  { id: 4, date: '6월 11일 목', court: '2코트', teamA: '7반', teamB: '1반' },
  { id: 5, date: '6월 15일 월', court: '1코트', teamA: '2반', teamB: '3반' },
  { id: 6, date: '6월 15일 월', court: '2코트', teamA: '4반', teamB: '5반' },
  { id: 7, date: '6월 19일 금', court: '1코트', teamA: '6반', teamB: '7반' },
  { id: 8, date: '6월 19일 금', court: '2코트', teamA: '1반', teamB: '3반' },
  { id: 9, date: '6월 22일 월', court: '1코트', teamA: '2반', teamB: '4반' },
  { id: 10, date: '6월 22일 월', court: '2코트', teamA: '5반', teamB: '7반' },
  { id: 11, date: '6월 25일 목', court: '1코트', teamA: '6반', teamB: '1반' },
  { id: 12, date: '6월 25일 목', court: '2코트', teamA: '3반', teamB: '5반' },
  { id: 13, date: '6월 29일 월', court: '1코트', teamA: '4반', teamB: '6반' },
  { id: 14, date: '6월 29일 월', court: '2코트', teamA: '2반', teamB: '5반' },
  { id: 15, date: '7월 3일 금', court: '1코트', teamA: '7반', teamB: '3반' },
  { id: 16, date: '7월 3일 금', court: '2코트', teamA: '1반', teamB: '4반' },
  { id: 17, date: '7월 6일 월', court: '1코트', teamA: '2반', teamB: '6반' },
  { id: 18, date: '7월 6일 월', court: '2코트', teamA: '7반', teamB: '4반' },
  { id: 19, date: '7월 10일 금', court: '1코트', teamA: '1반', teamB: '5반' },
  { id: 20, date: '7월 10일 금', court: '2코트', teamA: '2반', teamB: '7반' },
  { id: 21, date: '7월 13일 월', court: '1코트', teamA: '6반', teamB: '3반' }
].map((match) => ({ ...match, status: '대기', sets: [0, 0, 0, 0] }));

const dates = [...new Set(initialMatches.map((match) => match.date))];
const classes = ['1반', '2반', '3반', '4반', '5반', '6반', '7반'];
const tabs = [
  { id: 'standings', label: '순위', icon: Trophy },
  { id: 'schedule', label: '일정', icon: CalendarDays },
  { id: 'rules', label: '규칙', icon: BookOpen },
  { id: 'timer', label: '타이머', icon: Timer }
];

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [activeTab, setActiveTab] = useState('standings');
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [tempSets, setTempSets] = useState([0, 0, 0, 0]);
  const [timeLeft, setTimeLeft] = useState(360);
  const [isRunning, setIsRunning] = useState(false);
  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialMatches;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    if (!isRunning || timeLeft === 0) return undefined;
    const intervalId = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous === 181) playSound('switch');
        if (previous === 1) playSound('finish');
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) setIsRunning(false);
  }, [timeLeft]);

  const standings = useMemo(() => {
    const table = classes.map((name) => ({ name, points: 0, win: 0, draw: 0, lose: 0, played: 0 }));

    matches.forEach((match) => {
      if (match.status !== '종료') return;
      const winsA = match.sets.filter((set) => set === 1).length;
      const winsB = match.sets.filter((set) => set === 3).length;
      const teamA = table.find((team) => team.name === match.teamA);
      const teamB = table.find((team) => team.name === match.teamB);

      teamA.played += 1;
      teamB.played += 1;

      if (winsA > winsB) {
        teamA.win += 1;
        teamA.points += 3;
        teamB.lose += 1;
        teamB.points += 1;
      } else if (winsA < winsB) {
        teamB.win += 1;
        teamB.points += 3;
        teamA.lose += 1;
        teamA.points += 1;
      } else {
        teamA.draw += 1;
        teamB.draw += 1;
        teamA.points += 2;
        teamB.points += 2;
      }
    });

    return table.sort((a, b) => b.points - a.points || b.win - a.win || a.name.localeCompare(b.name));
  }, [matches]);

  const handleLogin = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get('password') === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
    } else {
      window.alert('비밀번호가 맞지 않습니다.');
    }
  };

  const openScoreModal = (match) => {
    setSelectedMatch(match);
    setTempSets([...match.sets]);
    setShowScoreModal(true);
  };

  const saveScore = () => {
    if (tempSets.includes(0) && !window.confirm('입력하지 않은 세트가 있습니다. 그래도 저장할까요?')) return;
    setMatches((current) =>
      current.map((match) => (match.id === selectedMatch.id ? { ...match, sets: tempSets, status: '종료' } : match))
    );
    setShowScoreModal(false);
  };

  const resetMatch = (matchId) => {
    if (!window.confirm('이 경기 결과를 초기화할까요?')) return;
    setMatches((current) =>
      current.map((match) => (match.id === matchId ? { ...match, sets: [0, 0, 0, 0], status: '대기' } : match))
    );
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>피구 재회 리그</h1>
          {isAdmin && <span className="admin-badge">Admin Mode</span>}
        </div>
        <button
          aria-label={isAdmin ? '관리자 로그아웃' : '관리자 로그인'}
          className="icon-button"
          type="button"
          onClick={() => (isAdmin ? setIsAdmin(false) : setShowLogin(true))}
        >
          {isAdmin ? <Unlock size={18} /> : <Lock size={18} />}
        </button>
      </header>

      <nav className="tabs" aria-label="주요 메뉴">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button className={activeTab === id ? 'active' : ''} key={id} type="button" onClick={() => setActiveTab(id)}>
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <main>
        {activeTab === 'standings' && <Standings standings={standings} />}
        {activeTab === 'schedule' && (
          <Schedule
            isAdmin={isAdmin}
            matches={matches}
            onOpenScore={openScoreModal}
            onReset={resetMatch}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}
        {activeTab === 'rules' && <Rules />}
        {activeTab === 'timer' && (
          <GameTimer isRunning={isRunning} setIsRunning={setIsRunning} setTimeLeft={setTimeLeft} timeLeft={timeLeft} />
        )}
      </main>

      {showLogin && <LoginModal handleLogin={handleLogin} onClose={() => setShowLogin(false)} />}
      {showScoreModal && selectedMatch && (
        <ScoreModal
          onClose={() => setShowScoreModal(false)}
          onSave={saveScore}
          selectedMatch={selectedMatch}
          setTempSets={setTempSets}
          tempSets={tempSets}
        />
      )}
    </div>
  );
}

function Standings({ standings }) {
  return (
    <section className="view">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>순위</th>
              <th>학급</th>
              <th>총점</th>
              <th>전적</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, index) => (
              <tr key={team.name} className={index === 0 ? 'leader' : ''}>
                <td>
                  {index < 3 && <Crown className={`crown rank-${index + 1}`} size={18} />}
                  <strong>{index + 1}</strong>
                </td>
                <td>{team.name}</td>
                <td className="points">{team.points}</td>
                <td>
                  {team.played}전 {team.win}승 {team.draw}무 {team.lose}패
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="info-panel indigo">
        <h2>순위 산정 규칙</h2>
        <p>경기 승리 3점, 무승부 2점, 패배 1점입니다. 총점이 같으면 승수가 많은 학급을 위에 둡니다.</p>
      </aside>
    </section>
  );
}

function Schedule({ isAdmin, matches, onOpenScore, onReset, selectedDate, setSelectedDate }) {
  return (
    <section className="view">
      <div className="date-strip">
        {dates.map((date) => (
          <button className={selectedDate === date ? 'selected' : ''} key={date} type="button" onClick={() => setSelectedDate(date)}>
            {date}
          </button>
        ))}
      </div>
      <div className="match-list">
        {matches
          .filter((match) => match.date === selectedDate)
          .map((match) => (
            <article className={`match-card ${match.status === '종료' ? 'done' : ''}`} key={match.id}>
              <div className="match-meta">
                <span>{match.court}</span>
                <span className={match.status === '종료' ? 'status done' : 'status'}>{match.status === '종료' ? '종료됨' : '진행 대기'}</span>
              </div>
              <div className="versus">
                <strong>{match.teamA}</strong>
                <div>
                  <span>VS</span>
                  {match.status === '종료' && (
                    <b>
                      {match.sets.filter((set) => set === 1).length} : {match.sets.filter((set) => set === 3).length}
                    </b>
                  )}
                </div>
                <strong>{match.teamB}</strong>
              </div>
              {match.status === '종료' && <SetDots sets={match.sets} />}
              {isAdmin && (
                <div className="admin-actions">
                  <button type="button" onClick={() => onOpenScore(match)}>
                    점수 입력 / 수정
                  </button>
                  {match.status === '종료' && (
                    <button className="secondary" type="button" onClick={() => onReset(match.id)}>
                      초기화
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
      </div>
    </section>
  );
}

function SetDots({ sets }) {
  return (
    <div className="set-dots">
      {sets.map((set, index) => (
        <span className={`set-dot set-${set}`} key={`${set}-${index}`}>
          {set === 1 ? 'A승' : set === 3 ? 'B승' : set === 2 ? '무' : '-'}
        </span>
      ))}
    </div>
  );
}

function Rules() {
  const groups = [
    {
      icon: Users,
      title: '선수 구성과 시간',
      tone: 'indigo',
      items: ['1세트는 여학생, 2세트는 남학생, 3세트와 4세트는 연합 경기로 운영합니다.', '각 세트는 6분이며, 3분이 지나면 내야와 외야를 교체합니다.', '연합 경기는 내야 9명, 외야 3명으로 시작합니다.']
    },
    {
      icon: AlertCircle,
      title: '공격과 아웃',
      tone: 'rose',
      items: ['상대 공에 직접 맞고 공이 바닥에 떨어지면 아웃입니다.', '옷, 머리카락, 신체 일부에 닿은 공도 아웃으로 인정합니다.', '헤드어택은 고의가 아니면 자동 아웃으로 보지 않습니다.']
    },
    {
      icon: Clock,
      title: '패스 규칙',
      tone: 'emerald',
      items: ['패스는 내야와 외야 사이에서만 가능합니다.', '내야끼리 또는 외야끼리 패스하면 더블 패스 파울입니다.', '패스는 연속 3회까지 허용하며, 4번째는 파울입니다.']
    },
    {
      icon: ShieldAlert,
      title: '주요 파울',
      tone: 'amber',
      items: ['라인 파울, 5초 룰, 더블 패스, 보디 터치 파울을 확인합니다.', '파울이 발생하면 기본적으로 상대 팀에게 공격권이 넘어갑니다.', '애매한 판정은 심판의 판단을 최우선으로 합니다.']
    }
  ];

  return (
    <section className="view rule-list">
      {groups.map(({ icon: Icon, items, title, tone }) => (
        <article className="rule-card" key={title}>
          <h2>
            <span className={tone}>
              <Icon size={20} />
            </span>
            {title}
          </h2>
          <ul>
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

function GameTimer({ isRunning, setIsRunning, setTimeLeft, timeLeft }) {
  return (
    <section className="view timer-view">
      <div className="timer-panel">
        <h2>
          <Timer size={24} />
          경기 진행 타이머
        </h2>
        <p>
          <Volume2 size={14} />
          3분 교대 / 종료 알림음
        </p>
        <div className={`time-readout ${timeLeft <= 10 ? 'danger' : timeLeft <= 180 ? 'switch' : ''}`}>{formatTime(timeLeft)}</div>
        <div className="progress-bar">
          <span style={{ width: `${(timeLeft / 360) * 100}%` }} />
        </div>
        <div className="timer-actions">
          <button className={isRunning ? 'pause' : ''} type="button" onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? '일시정지' : '시작'}
          </button>
          <button className="reset" type="button" onClick={() => { setIsRunning(false); setTimeLeft(360); }}>
            <RotateCcw size={20} />
            리셋
          </button>
        </div>
      </div>
    </section>
  );
}

function LoginModal({ handleLogin, onClose }) {
  return (
    <div className="modal-backdrop">
      <form className="login-modal" onSubmit={handleLogin}>
        <div className="modal-head">
          <h2>관리자 로그인</h2>
          <button aria-label="닫기" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <input autoComplete="off" autoFocus name="password" placeholder="비밀번호 (기본: 1234)" type="password" />
        <button type="submit">인증하기</button>
      </form>
    </div>
  );
}

function ScoreModal({ onClose, onSave, selectedMatch, setTempSets, tempSets }) {
  const resultText = getTempResultText(selectedMatch, tempSets);
  const setLabels = [
    ['1세트', '여학생'],
    ['2세트', '남학생'],
    ['3세트', '연합 A'],
    ['4세트', '연합 B']
  ];

  return (
    <div className="modal-backdrop score-backdrop">
      <section className="score-sheet">
        <div className="sheet-handle" />
        <div className="modal-head">
          <div>
            <h2>경기 결과 입력</h2>
            <p>
              {selectedMatch.date} · {selectedMatch.court}
            </p>
          </div>
          <button aria-label="닫기" type="button" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="score-teams">
          <strong>{selectedMatch.teamA}</strong>
          <span>VS</span>
          <strong>{selectedMatch.teamB}</strong>
        </div>
        <div className="set-inputs">
          {setLabels.map(([name, desc], index) => (
            <article className="set-input" key={name}>
              <div>
                <strong>{name}</strong>
                <span>{desc}</span>
              </div>
              <div className="segmented">
                {[
                  [1, 'A승'],
                  [2, '무승부'],
                  [3, 'B승']
                ].map(([value, label]) => (
                  <button
                    className={tempSets[index] === value ? 'picked' : ''}
                    key={value}
                    type="button"
                    onClick={() => setTempSets((current) => current.map((set, setIndex) => (setIndex === index ? value : set)))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="save-area">
          <div>최종 결과: {resultText}</div>
          <button type="button" onClick={onSave}>결과 저장 및 순위 반영</button>
        </div>
      </section>
    </div>
  );
}

function getTempResultText(match, sets) {
  const winsA = sets.filter((set) => set === 1).length;
  const winsB = sets.filter((set) => set === 3).length;
  if (winsA > winsB) return `${match.teamA} 승리`;
  if (winsA < winsB) return `${match.teamB} 승리`;
  return '무승부';
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`;
}

function playSound(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const tone = (frequency, wave, start, duration) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + start);
      gain.gain.setValueAtTime(0.4, context.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + start);
      oscillator.stop(context.currentTime + start + duration);
    };

    if (type === 'switch') {
      tone(880, 'square', 0, 0.18);
      tone(880, 'square', 0.28, 0.18);
      tone(880, 'square', 0.56, 0.35);
    } else {
      tone(660, 'sine', 0, 1.4);
    }
  } catch {
    // Audio support varies by browser and user gesture state.
  }
}

createRoot(document.getElementById('root')).render(<App />);
