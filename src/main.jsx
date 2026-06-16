import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Clock,
  Crown,
  Lock,
  Maximize2,
  Minimize2,
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
import { isFirebaseConfigured, saveRemoteMatch, subscribeToRemoteMatches } from './firebase';

const ADMIN_PASSWORD = '20265';
const SET_LABELS = ['남성', '여성', '혼성A', '혼성B'];
const setCompositionTable = {
  caption: '세트별 선수 구성',
  headers: ['세트', '구성', '비고'],
  rows: [
    ['1세트', '여학생 경기', '해당 성별 학생 수에 맞추어 운영'],
    ['2세트', '남학생 경기', '해당 성별 학생 수에 맞추어 운영'],
    ['3세트', '남녀 혼합 A 12명', '내야 9명, 외야 3명으로 시작'],
    ['4세트', '남녀 혼합 B 12명', '내야 9명, 외야 3명으로 시작']
  ]
};
const scheduleTable = {
  caption: '경기 일정',
  headers: ['날짜', '1코트 경기', '2코트 경기'],
  rows: [
    ['6월 8일(월)', '1반 vs 2반', '3반 vs 4반'],
    ['6월 11일(목)', '5반 vs 6반', '7반 vs 1반'],
    ['6월 15일(월)', '2반 vs 3반', '4반 vs 5반'],
    ['6월 19일(금)', '6반 vs 7반', '1반 vs 3반'],
    ['6월 22일(월)', '2반 vs 4반', '5반 vs 7반'],
    ['6월 25일(목)', '6반 vs 1반', '3반 vs 5반'],
    ['6월 29일(월)', '4반 vs 6반', '2반 vs 5반'],
    ['7월 3일(금)', '7반 vs 3반', '1반 vs 4반'],
    ['7월 6일(월)', '2반 vs 6반', '7반 vs 4반'],
    ['7월 10일(금)', '1반 vs 5반', '2반 vs 7반'],
    ['7월 13일(월)', '6반 vs 3반', '—']
  ]
};
const STATUS = {
  pending: '대기',
  done: '완료'
};

const initialMatches = [
  { id: 1, date: '6월 8일(월)', dateValue: '2026-06-08', court: '1코트', teamA: '1반', teamB: '2반' },
  { id: 2, date: '6월 8일(월)', dateValue: '2026-06-08', court: '2코트', teamA: '3반', teamB: '4반' },
  { id: 3, date: '6월 11일(목)', dateValue: '2026-06-11', court: '1코트', teamA: '5반', teamB: '6반' },
  { id: 4, date: '6월 11일(목)', dateValue: '2026-06-11', court: '2코트', teamA: '7반', teamB: '1반' },
  { id: 5, date: '6월 15일(월)', dateValue: '2026-06-15', court: '1코트', teamA: '2반', teamB: '3반' },
  { id: 6, date: '6월 15일(월)', dateValue: '2026-06-15', court: '2코트', teamA: '4반', teamB: '5반' },
  { id: 7, date: '6월 19일(금)', dateValue: '2026-06-19', court: '1코트', teamA: '6반', teamB: '7반' },
  { id: 8, date: '6월 19일(금)', dateValue: '2026-06-19', court: '2코트', teamA: '1반', teamB: '3반' },
  { id: 9, date: '6월 22일(월)', dateValue: '2026-06-22', court: '1코트', teamA: '2반', teamB: '4반' },
  { id: 10, date: '6월 22일(월)', dateValue: '2026-06-22', court: '2코트', teamA: '5반', teamB: '7반' },
  { id: 11, date: '6월 25일(목)', dateValue: '2026-06-25', court: '1코트', teamA: '6반', teamB: '1반' },
  { id: 12, date: '6월 25일(목)', dateValue: '2026-06-25', court: '2코트', teamA: '3반', teamB: '5반' },
  { id: 13, date: '6월 29일(월)', dateValue: '2026-06-29', court: '1코트', teamA: '4반', teamB: '6반' },
  { id: 14, date: '6월 29일(월)', dateValue: '2026-06-29', court: '2코트', teamA: '2반', teamB: '5반' },
  { id: 15, date: '7월 3일(금)', dateValue: '2026-07-03', court: '1코트', teamA: '7반', teamB: '3반' },
  { id: 16, date: '7월 3일(금)', dateValue: '2026-07-03', court: '2코트', teamA: '1반', teamB: '4반' },
  { id: 17, date: '7월 6일(월)', dateValue: '2026-07-06', court: '1코트', teamA: '2반', teamB: '6반' },
  { id: 18, date: '7월 6일(월)', dateValue: '2026-07-06', court: '2코트', teamA: '7반', teamB: '4반' },
  { id: 19, date: '7월 10일(금)', dateValue: '2026-07-10', court: '1코트', teamA: '1반', teamB: '5반' },
  { id: 20, date: '7월 10일(금)', dateValue: '2026-07-10', court: '2코트', teamA: '2반', teamB: '7반' },
  { id: 21, date: '7월 13일(월)', dateValue: '2026-07-13', court: '1코트', teamA: '6반', teamB: '3반' }
].map((match) => ({ ...match, status: STATUS.pending, sets: [0, 0, 0, 0] }));

const dates = [...new Set(initialMatches.map((match) => match.date))];
const classes = ['1반', '2반', '3반', '4반', '5반', '6반', '7반'];
const tabs = [
  { id: 'standings', label: '순위', icon: Trophy },
  { id: 'schedule', label: '일정', icon: CalendarDays },
  { id: 'rules', label: '규칙', icon: BookOpen },
  { id: 'timer', label: '타이머', icon: Timer }
];

const rules = [
  {
    icon: ShieldAlert,
    tone: 'indigo',
    title: '1. 경기 기본 원칙',
    items: [
      '경기는 학급 대항으로 실시한다.',
      '모든 선수는 안전을 우선으로 하며, 고의적인 강한 공격이나 비신사적인 행동을 하지 않는다.',
      '모든 아웃, 파울, 공격권 판단은 주심의 판정을 우선으로 한다.',
      '애매한 상황에서는 학생 안전과 경기 흐름을 우선하여 판정한다.'
    ]
  },
  {
    icon: Users,
    tone: 'emerald',
    title: '2. 선수 구성',
    items: [
      '남녀 혼합 경기는 12인제로 운영한다.',
      '12인제 경기는 내야 9명, 외야 3명으로 시작한다.',
      '경기 시작 후 3분이 지나면 처음 외야에 있던 3명은 내야로 들어온다.',
      '학급별 남녀 학생 수가 맞지 않는 경우에 적은 쪽에 마지막 목숨에 어드밴티지를 부족한 학생 수 만큼 준다.',
      '한 학생이 3세트와 4세트에 중복참여 할 수는 있지만, 사전에 합의된 특별한 사유가 없다면, 모든 학생이 3세트나 4세트 중 한 경기에 참여해야 한다.'
    ],
    table: setCompositionTable
  },
  {
    icon: Clock,
    tone: 'amber',
    title: '3. 경기 시간과 승패',
    items: [
      '한 세트는 6분으로 운영한다.',
      '경기 시간 안에 상대 팀 내야 선수를 모두 아웃시키면 해당 세트에서 승리한다.',
      '경기 시간이 끝났을 때는 내야에 남은 선수가 많은 팀이 승리한다.',
      '내야에 남은 선수 수가 같으면 해당 세트는 무승부로 한다.',
      '세트가 끝날 때마다 양 팀은 코트를 바꾼다.'
    ]
  },
  {
    icon: Trophy,
    tone: 'rose',
    title: '4. 점수',
    items: ['각 세트 결과에 따라 승리 3점, 무승부 2점, 패배 1점을 부여한다.', '리그전의 모든 경기의 총점을 합산하여 순위를 정한다.']
  },
  {
    icon: AlertCircle,
    tone: 'indigo',
    title: '5. 경기 시작',
    items: [
      '경기는 센터서클에서 점프볼로 시작한다.',
      '점프볼이 가장 높은 지점에 오르기 전에 공을 건드리면 플라잉 탭 파울이다.',
      '점프볼한 선수는 공을 두 번 이상 터치할 수 없다.',
      '점프볼한 선수는 공을 직접 잡거나 첫 번-째 패스를 받을 수 없다.',
      '점프볼 후 첫 번째 공격으로 점프볼한 선수를 맞히면 점프어택 파울이다.'
    ]
  },
  {
    icon: AlertCircle,
    tone: 'rose',
    title: '6. 공격과 아웃',
    items: [
      '상대 팀 선수가 던진 공을 잡으면 공격권을 가져온다.',
      '상대 팀이 던진 공에 노바운드로 맞고 그 공이 바닥에 떨어지면 맞은 선수는 아웃된다.',
      '한 번 던진 공에 여러 명이 연속해서 맞고 바닥에 떨어지면 맞은 선수는 모두 아웃된다.',
      '상대 팀 선수가 파울을 범하며 던진 공에 맞은 경우에는 아웃되지 않는다.',
      '공이 옷, 머리카락 등에 스친 경우에도 아웃된다.'
    ],
    noteTitle: '헤드어택 규정',
    noteItems: [
      '머리를 직접 맞힌 공격은 원칙적으로 아웃이 아니다. 다만 다음 경우에는 아웃으로 판정할 수 있다.',
      '수비자가 무릎 높이 아래에서 머리에 맞은 경우',
      '손, 팔, 어깨 등 다른 신체 부위에 먼저 맞고 머리에 맞은 경우',
      '공이 머리카락을 스친 경우',
      '수비자가 고의로 머리에 공을 맞은 경우',
      '한 손 또는 두 손이 바닥에 닿은 상태에서 머리에 맞은 경우',
      '단, 고의가 아닌, 공을 피하다가 머리에 공이 맞은 경우는 아웃이 아니다.'
    ]
  },
  {
    icon: Clock,
    tone: 'emerald',
    title: '7. 패스',
    items: [
      '같은 팀의 내야 선수끼리는 패스할 수 없다.',
      '같은 팀의 외야 선수끼리는 패스할 수 없다.',
      '내야와 외야 사이의 패스는 가능하다.',
      '상대 선수에게 공격하지 않고 같은 팀에게 보내는 공은 패스로 본다.',
      '머리 위 높이로 던지면 패스로 보고, 머리 아래 높이로 던지면 공격으로 본다.',
      '패스는 연속 3회까지 허용한다.',
      '4번째 패스는 포 패스 파울로 처리하며, 공격권은 상대 팀에게 넘어간다.',
      '경기 지연을 목적으로 한 지나친 패스는 주심 판단에 따라 테크니컬 파울을 줄 수 있다.'
    ]
  },
  {
    icon: ShieldAlert,
    tone: 'amber',
    title: '8. 주요 파울 규정',
    subsections: [
      {
        title: '1) 라인 파울',
        items: [
          '선수가 경기 중 라인을 밟거나 넘어가 플레이에 관여한 경우 라인 파울을 적용한다.',
          '라인 파울이 발생하면 공격권은 상대 팀에게 넘어간다.',
          '수비 선수가 공과 상관없이 라인을 밟거나 넘었고 경기 흐름에 큰 영향을 주지 않는 경우, 주심은 어드밴티지를 적용하여 경기를 계속 진행할 수 있다.',
          '반복적으로 라인 파울을 할 경우 경고를 줄 수 있다.',
          '경고가 3회 누적되면 내야 선수는 아웃, 외야 선수는 퇴장 처리한다.'
        ]
      },
      {
        title: '2) 홀딩 파울',
        items: [
          '상대 코트 안에 멈춰 있거나 구르고 있는 공을 손으로 가져오면 홀딩 파울이다.',
          '가져올 수 있는 경우: 공이 라인 위에 걸쳐 있는 경우',
          '파울인 경우: 상대 코트 안에 멈춘 공을 가져오는 경우, 상대 코트 안에서 구르는 공을 가져오는 경우, 공을 일부러 상대 코트에 바운드시켜 가져오는 경우'
        ]
      },
      {
        title: '3) 5초 룰',
        items: [
          '공을 가진 선수가 경기 진행 의사 없이공을 들고 있으면 5초 룰을 적용한다.',
          '경기 진행 의사가 없다고 주심이 판단한 이후, 5초룰을 적용한다. 주심은 오른쪽 손가락을 하나씩 접으면서 5초를 카운트 한다.',
          '5초 룰이 적용되면 공격권은 상대 팀에게 넘어간다.'
        ]
      },
      {
        title: '4) 재개 위반 파울',
        items: [
          '경기 중단 후 다시 시작할 때는 심판의 신호를 받은 뒤  공을 던진다.',
          '심판의 신호 전에 공을 던지면 재개 위반 파울로 처리하고, 공격권은 상대 팀에게 넘어간다.',
          '신호를 받지 않고 던진 공이 바로 상대 팀의 공이 된 경우에는 주심이 어드밴티지를 적용하여, 상대팀이 공격권을 가지고 경기를 계속 진행할 수 있다.'
        ]
      },
      {
        title: '5) 더블 패스 파울',
        items: [
          '경기 중 같은 팀의 내야끼리 또는 외야끼리 패스하면 더블 패스 파울이다.',
          '이 경우 상대 팀 내야 볼로 경기를 재개한다.',
          '외야에서 내야를 공격했을 때 상대 팀이 아무도 맞지 않고 같은 팀 외야가 잡은 경우도 더블 패스 파울이다.',
          '내야 선수 A가 공을 잡으려다 공이 몸이나 손에 맞고 튀었고 같은 팀 내야 선수 B가 우연히 잡은 경우는 더블 패스로 보지 않는다.',
          '단, A가 의도적으로 B에게 공을 보내려고 튕긴 경우에는 더블 패스 파울로 볼 수 있다.'
        ]
      },
      {
        title: '6) 인터페어 파울',
        items: [
          '아웃된 선수가 고의로 공을 잡거나, 공의 진행을 막거나, 경기 진행을 방해하면 인터페어 파울이다.',
          '아웃된 선수가 무의식적으로 공을 잡은 경우에는 공을 발밑에 내려놓고 즉시 밖으로 나가면 파울로 보지 않는다.'
        ]
      },
      {
        title: '7) 보디 터치 파울',
        items: [
          '경기 중 상대 선수를 밀거나 잡거나 부딪히는 등 신체 접촉이 발생하면 보디 터치 파울이다.',
          '센터라인 부근 또는 외야로 나가려는 공을 잡으려는 도중 신체접촉이 발생되면 공이 있는 코트에 우선권을 부여한다.'
        ]
      },
      {
        title: '8) 데드존 파울',
        items: ['아웃된 선수가 이동 중 상대 팀 내야 또는 외야 경기장을 밟고 나가면 데드존 파울이다.', '아웃된 선수는 정해진 이동 경로로 빠르게 나가야 한다.']
      },
      {
        title: '9) 점프볼 관련 파울',
        items: [
          '점프어택 파울: 점프볼 후 첫 번째 공격에서 점프볼한 선수를 맞히는 행위',
          '플라잉 탭 파울: 점프볼이 정점에 오르기 전에 공을 터치하는 행위',
          '더블 탭 파울: 점프볼한 선수가 공을 두 번 이상 터치하는 행위',
          '점프 캐치 파울: 점프볼한 선수가 공을 직접 잡는 행위'
        ]
      },
      {
        title: '10) 테크니컬 파울',
        items: [
          '다음과 같은 행동은 테크니컬 파울로 처리할 수 있다.',
          '심판 판정에 지나치게 항의하는 행동',
          '고의로 경기를 지연시키는 행동',
          '상대 팀을 놀리거나 위협하는 행동',
          '스포츠맨십에 어긋나는 행동',
          '반복적으로 같은 파울을 하는 행동',
          '주심은 상황에 따라 경고, 퇴장, 팀 경고, 몰수패를 줄 수 있다.'
        ]
      }
    ]
  },
  {
    icon: CalendarDays,
    tone: 'indigo',
    title: '9. 경기 재개와 공격권',
    items: [
      '파울이 발생하면 원칙적으로 상대 팀에게 공격권을 준다.',
      '주심이 어드밴티지를 적용한 경우에는 경기를 중단하지 않고 계속 진행할 수 있다.',
      '경기 중단 후 재개할 때는 주심의 신호를 확인한 뒤 정해진 재개 동작을 한다.'
    ]
  },
  {
    icon: Users,
    tone: 'emerald',
    title: '10. 심판 판정 및 태도',
    items: [
      '모든 파울과 아웃 여부는 주심의 판단을 우선으로 한다.',
      '선수는 심판 판정에 따르며, 경기 중 직접적인 항의를 하지 않는다.',
      '판정에 대한 의견은 팀 대표 또는 담임교사를 통해 정중하게 전달한다.',
      '상대 팀을 존중하고, 경기 전후 인사를 한다.'
    ]
  },
  {
    icon: CalendarDays,
    tone: 'indigo',
    title: scheduleTable.caption,
    table: scheduleTable
  }
];

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [activeTab, setActiveTab] = useState('standings');
  const [selectedDate, setSelectedDate] = useState(getNearestMatchDate());
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [scoreDrafts, setScoreDrafts] = useState({});
  const [timeLeft, setTimeLeft] = useState(360);
  const [isRunning, setIsRunning] = useState(false);
  const [matches, setMatches] = useState(initialMatches);
  const [storageStatus, setStorageStatus] = useState(isFirebaseConfigured() ? 'connecting' : 'error');

  const selectedMatch = matches.find((match) => match.id === selectedMatchId) ?? null;
  const tempSets = selectedMatch ? scoreDrafts[selectedMatch.id] ?? selectedMatch.sets : [0, 0, 0, 0];

  useEffect(() => {
    if (!isFirebaseConfigured()) return undefined;

    return subscribeToRemoteMatches(
      (remoteMatches) => {
        setMatches(mergeSavedMatches(remoteMatches));
        setStorageStatus('synced');
      },
      (error) => {
        console.error('Failed to subscribe to Firebase matches', error);
        setStorageStatus('error');
      }
    );
  }, []);

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
      if (match.status !== STATUS.done) return;
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

    return table
      .sort((a, b) => b.points - a.points || b.win - a.win || a.name.localeCompare(b.name, 'ko'))
      .map((team, index, sortedTable) => {
        const previousTeam = sortedTable[index - 1];
        const rank = previousTeam && previousTeam.points === team.points
          ? sortedTable.findIndex((rankedTeam) => rankedTeam.points === team.points) + 1
          : index + 1;
        return { ...team, rank };
      });
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
    setSelectedMatchId(match.id);
    setSelectedDate(match.date);
    setScoreDrafts((current) => ({ ...current, [match.id]: current[match.id] ?? [...match.sets] }));
  };

  const updateTempSet = (setIndex, value) => {
    if (!selectedMatch) return;
    setScoreDrafts((current) => ({
      ...current,
      [selectedMatch.id]: (current[selectedMatch.id] ?? selectedMatch.sets).map((set, index) => (index === setIndex ? value : set))
    }));
  };

  const persistMatch = async (nextMatch) => {
    if (!isFirebaseConfigured()) {
      setStorageStatus('error');
      window.alert('Firebase 설정이 없어 결과를 저장할 수 없습니다. 관리자에게 Firebase 환경변수 설정을 요청하세요.');
      return false;
    }

    setStorageStatus('saving');
    try {
      await saveRemoteMatch(nextMatch);
      setStorageStatus('synced');
      return true;
    } catch (error) {
      console.error('Failed to save match to Firebase', error);
      setStorageStatus('error');
      window.alert('Firebase 저장에 실패했습니다. 네트워크나 Firestore 권한 설정을 확인하세요.');
      return false;
    }
  };

  const saveScore = async () => {
    if (!selectedMatch) return;
    if (tempSets.includes(0) && !window.confirm('입력하지 않은 세트가 있습니다. 그래도 저장할까요?')) return;
    const nextMatch = { ...selectedMatch, sets: tempSets, status: STATUS.done };
    setMatches((current) => current.map((match) => (match.id === selectedMatch.id ? nextMatch : match)));
    const saved = await persistMatch(nextMatch);
    if (!saved) setMatches((current) => current.map((match) => (match.id === selectedMatch.id ? selectedMatch : match)));
    setScoreDrafts((current) => {
      const next = { ...current };
      delete next[selectedMatch.id];
      return next;
    });
  };

  const resetMatch = async (matchId) => {
    if (!window.confirm('이 경기 결과를 초기화할까요?')) return;
    const previousMatch = matches.find((match) => match.id === matchId);
    if (!previousMatch) return;
    const nextMatch = { ...previousMatch, sets: [0, 0, 0, 0], status: STATUS.pending };
    setMatches((current) => current.map((match) => (match.id === matchId ? nextMatch : match)));
    const saved = await persistMatch(nextMatch);
    if (!saved) setMatches((current) => current.map((match) => (match.id === matchId ? previousMatch : match)));
    setScoreDrafts((current) => {
      const next = { ...current };
      delete next[matchId];
      return next;
    });
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <h1>가능초 5학년 피구 리그</h1>
          {isAdmin && <span className="admin-badge">관리자 모드</span>}
          <StorageBadge status={storageStatus} />
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
            onSaveScore={saveScore}
            onUpdateTempSet={updateTempSet}
            selectedMatch={selectedMatch}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            tempSets={tempSets}
          />
        )}
        {activeTab === 'rules' && <Rules />}
        {activeTab === 'timer' && (
          <GameTimer isRunning={isRunning} setIsRunning={setIsRunning} setTimeLeft={setTimeLeft} timeLeft={timeLeft} />
        )}
      </main>

      {showLogin && <LoginModal handleLogin={handleLogin} onClose={() => setShowLogin(false)} />}
    </div>
  );
}

function StorageBadge({ status }) {
  const labels = {
    connecting: 'Firebase 연결 중',
    saving: 'Firebase 저장 중',
    synced: 'Firebase 동기화됨',
    error: 'Firebase 오류'
  };

  return <span className={`storage-badge ${status}`}>{labels[status] ?? labels.error}</span>;
}

function Standings({ standings }) {
  return (
    <section className="view standings-view">
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
              <tr key={team.name} className={team.rank === 1 ? 'leader' : ''}>
                <td>
                  {team.rank <= 3 && <Crown className={`crown rank-${team.rank}`} size={18} />}
                  <strong>{team.rank}</strong>
                </td>
                <td>{team.name}</td>
                <td className="points">{team.points}</td>
                <td>
                  {team.played}경기 · {team.win}승 {team.draw}무 {team.lose}패
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <aside className="info-panel indigo">
        <h2>순위 산정 규칙</h2>
        <p>경기 승리 3점, 무승부 2점, 패배 1점입니다.</p>
      </aside>
    </section>
  );
}

function Schedule({
  isAdmin,
  matches,
  onOpenScore,
  onReset,
  onSaveScore,
  onUpdateTempSet,
  selectedMatch,
  selectedDate,
  setSelectedDate,
  tempSets
}) {
  return (
    <section className="view schedule-view">
      <div className="date-strip">
        {dates.map((date) => (
          <button className={selectedDate === date ? 'selected' : ''} key={date} type="button" onClick={() => setSelectedDate(date)}>
            {date}
          </button>
        ))}
      </div>
      <div className={`schedule-workspace ${isAdmin && selectedMatch ? 'with-score-panel' : ''}`}>
        <div className="match-list">
          {matches
            .filter((match) => match.date === selectedDate)
            .map((match) => (
              <article className={`match-card ${match.status === STATUS.done ? 'done' : ''}`} key={match.id}>
                <div className="match-meta">
                  <span>{match.court}</span>
                  <span className={match.status === STATUS.done ? 'status done' : 'status'}>
                    {match.status === STATUS.done ? '완료' : '진행 대기'}
                  </span>
                </div>
                <div className="versus">
                  <strong>{match.teamA}</strong>
                  <div>
                    <span>VS</span>
                    {match.status === STATUS.done && (
                      <b>
                        {match.sets.filter((set) => set === 1).length} : {match.sets.filter((set) => set === 3).length}
                      </b>
                    )}
                  </div>
                  <strong>{match.teamB}</strong>
                </div>
                {match.status === STATUS.done && <SetDots sets={match.sets} teamA={match.teamA} teamB={match.teamB} />}
                {isAdmin && (
                  <div className="admin-actions">
                    <button
                      className={selectedMatch?.id === match.id ? 'selected-action' : ''}
                      type="button"
                      onClick={() => onOpenScore(match)}
                    >
                      {selectedMatch?.id === match.id ? '입력 중' : '결과 입력 / 수정'}
                    </button>
                    {match.status === STATUS.done && (
                      <button className="secondary" type="button" onClick={() => onReset(match.id)}>
                        초기화
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
        </div>
        {isAdmin && selectedMatch && (
          <ScorePanel
            onSave={onSaveScore}
            selectedMatch={selectedMatch}
            tempSets={tempSets}
            updateTempSet={onUpdateTempSet}
          />
        )}
      </div>
    </section>
  );
}

function SetDots({ sets, teamA, teamB }) {
  return (
    <div className="set-dots">
      {sets.map((set, index) => (
        <span className={`set-dot set-${set}`} key={`${set}-${index}`}>
          {SET_LABELS[index]} {set === 1 ? teamA : set === 3 ? teamB : set === 2 ? '무' : '-'}
        </span>
      ))}
    </div>
  );
}

function Rules() {
  return (
    <section className="view rule-list">
      {rules.map(({ icon: Icon, items, noteItems, noteTitle, subsections, table, title, tone }) => (
        <article className="rule-card" key={title}>
          <h2>
            <span className={tone}>
              <Icon size={20} />
            </span>
            {title}
          </h2>
          {items && <RuleItems items={items} />}
          {table && <RuleTable table={table} />}
          {noteItems && (
            <div className="rule-note">
              <strong>{noteTitle}</strong>
              <RuleItems items={noteItems} />
            </div>
          )}
          {subsections && (
            <div className="sub-rule-list">
              {subsections.map((section) => (
                <section className="sub-rule" key={section.title}>
                  <h3>{section.title}</h3>
                  <RuleItems items={section.items} />
                </section>
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

function RuleItems({ items }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function RuleTable({ table }) {
  return (
    <div className="rule-table-wrap">
      {table.caption && <strong className="rule-table-caption">{table.caption}</strong>}
      <table className="rule-table">
        <thead>
          <tr>
            {table.headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join('-')}>
              {row.map((cell) => (
                <td key={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GameTimer({ isRunning, setIsRunning, setTimeLeft, timeLeft }) {
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isRunning) {
      releaseWakeLock();
      return undefined;
    }

    requestWakeLock();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isRunning]);

  const requestWakeLock = async () => {
    if (!('wakeLock' in navigator) || wakeLockRef.current) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      wakeLockRef.current = null;
    }
  };

  const releaseWakeLock = async () => {
    if (!wakeLockRef.current) return;
    const lock = wakeLockRef.current;
    wakeLockRef.current = null;
    try {
      await lock.release();
    } catch {
      // The browser may have already released the lock.
    }
  };

  const enterFullscreen = async () => {
    if (!timerRef.current?.requestFullscreen) return;
    await timerRef.current.requestFullscreen();
  };

  const exitFullscreen = async () => {
    if (screen.orientation?.unlock) screen.orientation.unlock();
    if (document.fullscreenElement) await document.exitFullscreen();
  };

  const startTimer = async () => {
    await enterFullscreen();
    try {
      await screen.orientation?.lock?.('landscape');
    } catch {
      // Orientation lock support differs by mobile browser.
    }
    await requestWakeLock();
    setIsRunning(true);
  };

  const toggleTimer = async () => {
    if (isRunning) {
      setIsRunning(false);
      await releaseWakeLock();
      return;
    }

    await startTimer();
  };

  return (
    <section className="view timer-view">
      <div className={`timer-panel ${isFullscreen ? 'is-fullscreen' : ''}`} ref={timerRef}>
        <div className="timer-title-row">
          <h2>
            <Timer size={24} />
            경기 진행 타이머
          </h2>
          {!isFullscreen && (
            <button className="fullscreen-button" type="button" onClick={enterFullscreen}>
              <Maximize2 size={18} />
              전체화면
            </button>
          )}
        </div>
        <p>
          <Volume2 size={14} />
          3분 교대 / 종료 알림
        </p>
        <div className={`time-readout ${timeLeft <= 10 ? 'danger' : timeLeft <= 180 ? 'switch' : ''}`}>{formatTime(timeLeft)}</div>
        <div className="progress-bar">
          <span style={{ width: `${(timeLeft / 360) * 100}%` }} />
        </div>
        <div className="timer-actions">
          <button className={isRunning ? 'pause' : ''} type="button" onClick={toggleTimer}>
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? '일시정지' : '시작'}
          </button>
          <button
            className="reset"
            type="button"
            onClick={() => {
              setIsRunning(false);
              releaseWakeLock();
              setTimeLeft(360);
            }}
          >
            <RotateCcw size={20} />
            리셋
          </button>
        </div>
        {isFullscreen && (
          <button className="exit-fullscreen-button" type="button" onClick={exitFullscreen}>
            <Minimize2 size={16} />
            전체화면 해제
          </button>
        )}
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
        <input autoComplete="off" autoFocus name="password" placeholder="비밀번호" type="password" />
        <button type="submit">인증하기</button>
      </form>
    </div>
  );
}

function ScorePanel({ onSave, selectedMatch, tempSets, updateTempSet }) {
  const resultText = getTempResultText(selectedMatch, tempSets);

  return (
      <section className="score-sheet inline-score-sheet">
        <div className="modal-head">
          <div>
            <h2>경기 결과 입력</h2>
            <p>
              {selectedMatch.date} · {selectedMatch.court}
            </p>
          </div>
        </div>
        <div className="score-teams">
          <strong>{selectedMatch.teamA}</strong>
          <span>VS</span>
          <strong>{selectedMatch.teamB}</strong>
        </div>
        <div className="set-inputs">
          {SET_LABELS.map((name, index) => (
            <article className="set-input" key={name}>
              <div>
                <strong>{name}</strong>
                <span>{index < 2 ? '성별 경기' : '남녀 혼성'}</span>
              </div>
              <div className="segmented">
                {[
                  [1, `${selectedMatch.teamA} 승`],
                  [2, '무승부'],
                  [3, `${selectedMatch.teamB} 승`]
                ].map(([value, label]) => (
                  <button
                    className={tempSets[index] === value ? 'picked' : ''}
                    key={value}
                    type="button"
                    onClick={() => updateTempSet(index, value)}
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
          <button type="button" onClick={onSave}>
            결과 저장 및 순위 반영
          </button>
        </div>
      </section>
  );
}

function getNearestMatchDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = initialMatches.find((match) => new Date(`${match.dateValue}T00:00:00`) >= today);
  if (upcoming) return upcoming.date;

  return initialMatches.reduce((closest, match) => {
    const closestGap = Math.abs(new Date(`${closest.dateValue}T00:00:00`) - today);
    const matchGap = Math.abs(new Date(`${match.dateValue}T00:00:00`) - today);
    return matchGap < closestGap ? match : closest;
  }, initialMatches[0]).date;
}

function mergeSavedMatches(saved) {
  if (!Array.isArray(saved)) return initialMatches;
  const savedById = new Map(saved.map((match) => [match.id, match]));
  return initialMatches.map((match) => {
    const savedMatch = savedById.get(match.id);
    if (!savedMatch || !Array.isArray(savedMatch.sets)) return match;
    const sets = savedMatch.sets.slice(0, 4).map((set) => (Number.isInteger(set) && set >= 0 && set <= 3 ? set : 0));
    while (sets.length < 4) sets.push(0);
    const status = savedMatch.status === STATUS.done || sets.every((set) => set > 0) ? STATUS.done : STATUS.pending;
    return { ...match, sets, status };
  });
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
