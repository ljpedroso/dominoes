import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Round = {
  id: number;
  rawA: number;
  rawB: number;
  appliedA: number;
  appliedB: number;
  isDouble: boolean;
};

type PersistedState = {
  onboardingDone: boolean;
  teamAName: string;
  teamBName: string;
  doubleFirstHand: boolean;
  rounds: Round[];
  winsA: number;
  winsB: number;
};

const STORAGE_KEY = 'dominoes-score-tracker-v3';
const TARGET_SCORE = 150;

const defaultState: PersistedState = {
  onboardingDone: false,
  teamAName: '',
  teamBName: '',
  doubleFirstHand: false,
  rounds: [],
  winsA: 0,
  winsB: 0
};


function isValidState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<PersistedState>;
  return (
    typeof v.onboardingDone === 'boolean' &&
    typeof v.teamAName === 'string' &&
    typeof v.teamBName === 'string' &&
    typeof v.doubleFirstHand === 'boolean' &&
    Array.isArray(v.rounds) &&
    typeof v.winsA === 'number' &&
    typeof v.winsB === 'number'
  );
}

function loadInitialState(): PersistedState {
  if (typeof window === 'undefined') return defaultState;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    const parsed = JSON.parse(raw);
    return isValidState(parsed) ? parsed : defaultState;
  } catch {
    return defaultState;
  }
}

function DominoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`inline-flex flex-col border-2 border-current rounded-[2px] p-0.5 gap-0.5 ${className}`}>
      <div className="domino-pips">
        <div className="pip" /> <div className="pip" /> <div className="pip" />
        <div className="pip invisible" /> <div className="pip" /> <div className="pip invisible" />
        <div className="pip" /> <div className="pip" /> <div className="pip" />
      </div>
      <div className="h-[2px] bg-current w-full opacity-50" />
      <div className="domino-pips">
        <div className="pip" /> <div className="pip invisible" /> <div className="pip" />
        <div className="pip invisible" /> <div className="pip" /> <div className="pip invisible" />
        <div className="pip" /> <div className="pip invisible" /> <div className="pip" />
      </div>
    </div>
  );
}

function App() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [teamAInput, setTeamAInput] = useState(state.teamAName);
  const [teamBInput, setTeamBInput] = useState(state.teamBName);
  const [doubleInput, setDoubleInput] = useState(state.doubleFirstHand);
  const [roundA, setRoundA] = useState('');
  const [roundB, setRoundB] = useState('');
  const [error, setError] = useState('');
  const [winnerBanner, setWinnerBanner] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const totals = useMemo(() => {
    return state.rounds.reduce(
      (acc, round) => {
        acc.a += round.appliedA;
        acc.b += round.appliedB;
        return acc;
      },
      { a: 0, b: 0 }
    );
  }, [state.rounds]);

  function saveOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const a = teamAInput.trim();
    const b = teamBInput.trim();

    if (!a || !b) {
      setError('Escribe el nombre de ambos equipos.');
      return;
    }

    if (a.toLowerCase() === b.toLowerCase()) {
      setError('Los nombres de los equipos deben ser distintos.');
      return;
    }

    setState((prev) => ({
      ...prev,
      onboardingDone: true,
      teamAName: a,
      teamBName: b,
      doubleFirstHand: doubleInput,
      rounds: prev.rounds.length > 0 ? prev.rounds : []
    }));
    setError('');
  }

  function saveSettings() {
    const a = teamAInput.trim();
    const b = teamBInput.trim();

    if (!a || !b) {
      setError('Escribe el nombre de ambos equipos.');
      return;
    }

    if (a.toLowerCase() === b.toLowerCase()) {
      setError('Los nombres de los equipos deben ser distintos.');
      return;
    }

    setState((prev) => ({
      ...prev,
      teamAName: a,
      teamBName: b,
      doubleFirstHand: doubleInput
    }));
    setError('');
    setSettingsOpen(false);
  }

  function addRound(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const rawA = roundA === '' ? 0 : Number(roundA);
    const rawB = roundB === '' ? 0 : Number(roundB);

    if (!Number.isInteger(rawA) || !Number.isInteger(rawB) || rawA < 0 || rawB < 0) {
      setError('Ingresa números enteros para ambos puntajes.');
      return;
    }

    if (rawA === 0 && rawB === 0) {
      setError('Al menos un equipo debe tener puntos.');
      return;
    }

    const isDouble = state.doubleFirstHand && state.rounds.length === 0;

    const nextRound: Round = {
      id: Date.now(),
      rawA,
      rawB,
      appliedA: isDouble ? rawA * 2 : rawA,
      appliedB: isDouble ? rawB * 2 : rawB,
      isDouble
    };

    const nextRounds = [...state.rounds, nextRound];
    const nextTotals = nextRounds.reduce(
      (acc, round) => {
        acc.a += round.appliedA;
        acc.b += round.appliedB;
        return acc;
      },
      { a: 0, b: 0 }
    );

    const aWon = nextTotals.a >= TARGET_SCORE && nextTotals.a > nextTotals.b;
    const bWon = nextTotals.b >= TARGET_SCORE && nextTotals.b > nextTotals.a;

    if (aWon || bWon) {
      const winnerName = aWon ? state.teamAName : state.teamBName;
      setState((prev) => ({
        ...prev,
        winsA: aWon ? prev.winsA + 1 : prev.winsA,
        winsB: bWon ? prev.winsB + 1 : prev.winsB,
        rounds: []
      }));
      setWinnerBanner(`${winnerName} ganó la partida! 🏆`);
    } else {
      setState((prev) => ({ ...prev, rounds: nextRounds }));
    }

    setRoundA('');
    setRoundB('');
  }

  function undoRound() {
    setState((prev) => ({ ...prev, rounds: prev.rounds.slice(0, -1) }));
  }

  function resetCurrentGame() {
    setState((prev) => ({ ...prev, rounds: [] }));
    setWinnerBanner('');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'dominoes-score-backup.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  async function importData(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!isValidState(parsed)) {
        setError('El formato del respaldo no es válido.');
        return;
      }

      setState(parsed);
      setTeamAInput(parsed.teamAName);
      setTeamBInput(parsed.teamBName);
      setDoubleInput(parsed.doubleFirstHand);
      setError('');
      setWinnerBanner('');
    } catch {
      setError('No se pudo leer el archivo de respaldo.');
    } finally {
      event.currentTarget.value = '';
    }
  }

  if (!state.onboardingDone) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-10 text-[#0b1f4f] animate-slide-up">
        <header className="rounded-[2.5rem] bg-[#0f3b9e] p-10 shadow-2xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-2 h-full flex flex-col">
             <div className="flex-1 bg-[#0f3b9e]" />
             <div className="flex-1 bg-white" />
             <div className="flex-1 bg-[#cc102d]" />
             <div className="flex-1 bg-white" />
             <div className="flex-1 bg-[#0f3b9e]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-white/50 mb-4 ml-4">
              <DominoIcon className="w-6 h-8 text-white/40" />
              <span className="text-[10px] font-black tracking-[0.5em] uppercase">Tracker Oficial</span>
            </div>
            <h1 className="text-6xl font-black text-white italic tracking-tighter leading-none font-display ml-4">
              DOMINÓ<br />
              <span className="text-[#cc102d] not-italic">CUBANO</span>
            </h1>
            <p className="mt-6 text-white/70 font-medium text-sm max-w-[260px] leading-relaxed ml-4">Configura los equipos y prepárate para dar agua.</p>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none rotate-12">
            <svg width="280" height="280" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </header>

        <form onSubmit={saveOnboarding} className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 space-y-8 animate-slide-up">
          <div className="space-y-6">
            <div className="relative group">
              <label className="absolute -top-2.5 left-5 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-[#0f3b9e] z-10">
                Equipo A (Casa)
              </label>
              <input
                value={teamAInput}
                onChange={(event) => setTeamAInput(event.target.value)}
                className="w-full rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 px-6 py-5 text-lg font-bold text-slate-800 focus:border-[#0f3b9e] focus:bg-white transition-all outline-none"
                placeholder="Ej: Los Galanes"
              />
            </div>

            <div className="relative group">
              <label className="absolute -top-2.5 left-5 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-[#cc102d] z-10">
                Equipo B (Visita)
              </label>
              <input
                value={teamBInput}
                onChange={(event) => setTeamBInput(event.target.value)}
                className="w-full rounded-[1.5rem] border-2 border-slate-50 bg-slate-50 px-6 py-5 text-lg font-bold text-slate-800 focus:border-[#cc102d] focus:bg-white transition-all outline-none"
                placeholder="Ej: Los Maestros"
              />
            </div>
          </div>

          <div className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-blue-50/50 border border-blue-100 cursor-pointer group hover:bg-blue-50 transition-all">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={doubleInput}
                onChange={(event) => setDoubleInput(event.target.checked)}
                className="peer h-7 w-7 appearance-none rounded-xl border-2 border-blue-200 checked:bg-[#0f3b9e] checked:border-[#0f3b9e] transition-all cursor-pointer"
              />
              <svg className="absolute h-7 w-7 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none p-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#0f3b9e] uppercase tracking-wider">Regla Especial</span>
              <span className="text-sm font-bold text-slate-500">Doblar primera mano (x2)</span>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl bg-red-50 border-l-4 border-red-500 px-5 py-4 text-red-700 font-bold text-sm flex items-center gap-4">
              <span className="text-xl">⚠️</span> {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-[2rem] bg-[#cc102d] hover:bg-black active:scale-[0.97] py-6 text-2xl font-black text-white shadow-2xl shadow-red-500/20 transition-all uppercase tracking-widest"
          >
            ¡Empezar Partida!
          </button>
        </form>
      </main>
    );
  }

  const leadingTeam = totals.a > totals.b ? 'a' : totals.b > totals.a ? 'b' : null;
  const progressA = Math.min((totals.a / TARGET_SCORE) * 100, 100);
  const progressB = Math.min((totals.b / TARGET_SCORE) * 100, 100);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-5 text-[#0b1f4f] animate-slide-up">
      <header className="rounded-[2rem] bg-[#0f3b9e] px-6 py-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Mesa de Juego</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-lg font-black text-white uppercase italic tracking-tighter">Data Activa</h1>
              <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Meta</span>
            <span className="text-xl font-black text-white leading-none tabular-nums">{TARGET_SCORE} <span className="text-[10px] text-white/50">PTS</span></span>
          </div>
        </div>
      </header>

      {winnerBanner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#cc102d] rounded-[3rem] p-10 text-center shadow-2xl border-4 border-white max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="text-7xl mb-6">🏆</div>
            <div className="text-white/60 font-black text-[10px] uppercase tracking-[0.5em] mb-3">¡Mesa Cerrada!</div>
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight">{winnerBanner}</h3>
            <button 
              onClick={resetCurrentGame}
              className="w-full bg-white text-[#cc102d] px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
            >
              Nueva Partida
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className={`group rounded-[2rem] bg-white p-5 shadow-md shadow-slate-200/60 border border-slate-100 relative overflow-hidden transition-all hover:shadow-lg ${leadingTeam === 'a' ? 'ring-2 ring-[#0f3b9e]/20' : ''}`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 truncate">{state.teamAName}</p>
              {leadingTeam === 'a' && <span className="text-[9px] font-black text-[#0f3b9e] bg-blue-50 px-2 py-0.5 rounded-full">GANA</span>}
            </div>
            <div className="text-6xl font-black text-[#0f3b9e] tabular-nums font-display tracking-tighter leading-none">{totals.a}</div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#0f3b9e] rounded-full transition-all duration-500 ease-out" style={{ width: `${progressA}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 tabular-nums">{totals.a}/{TARGET_SCORE}</span>
              <span className="text-[10px] font-black text-[#0f3b9e]/60 tabular-nums">
                {state.winsA}G
              </span>
            </div>
          </div>
        </div>

        <div className={`group rounded-[2rem] bg-white p-5 shadow-md shadow-slate-200/60 border border-slate-100 relative overflow-hidden transition-all hover:shadow-lg ${leadingTeam === 'b' ? 'ring-2 ring-[#cc102d]/20' : ''}`}>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 truncate">{state.teamBName}</p>
              {leadingTeam === 'b' && <span className="text-[9px] font-black text-[#cc102d] bg-red-50 px-2 py-0.5 rounded-full">GANA</span>}
            </div>
            <div className="text-6xl font-black text-[#cc102d] tabular-nums font-display tracking-tighter leading-none">{totals.b}</div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#cc102d] rounded-full transition-all duration-500 ease-out" style={{ width: `${progressB}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 tabular-nums">{totals.b}/{TARGET_SCORE}</span>
              <span className="text-[10px] font-black text-[#cc102d]/60 tabular-nums">
                {state.winsB}G
              </span>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <form className="space-y-5" onSubmit={addRound}>
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#0f3b9e] ml-1">
                {state.teamAName}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={roundA}
                onChange={(event) => setRoundA(event.target.value)}
                className="w-full text-center text-4xl font-black py-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-[#0f3b9e] focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all outline-none tabular-nums"
              />
            </div>

            <div className="pb-6">
              <span className="text-slate-200 font-black text-lg">vs</span>
            </div>

            <div className="flex-1 space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#cc102d] ml-1 text-right">
                {state.teamBName}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={roundB}
                onChange={(event) => setRoundB(event.target.value)}
                className="w-full text-center text-4xl font-black py-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:border-[#cc102d] focus:bg-white focus:ring-4 focus:ring-red-100/50 transition-all outline-none tabular-nums"
              />
            </div>
          </div>

          {error ? (
            <p className="text-center text-xs font-bold text-red-500 flex items-center justify-center gap-2 bg-red-50 rounded-xl py-2.5 px-4">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#0f3b9e] hover:bg-[#0b2e7d] active:scale-[0.98] py-4 text-base font-black text-white shadow-lg shadow-blue-900/15 transition-all uppercase tracking-widest leading-none"
          >
            Guardar Mano
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={undoRound}
              disabled={state.rounds.length === 0}
              className="group flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-20"
            >
              <span className="text-base">←</span> Deshacer
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('¿Empezar nueva partida?')) resetCurrentGame();
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
            >
              <span className="text-base">↺</span> Reiniciar
            </button>
          </div>
        </form>
      </section>

      {state.rounds.length > 0 && (
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-600">Historial</h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {state.rounds.length} {state.rounds.length === 1 ? 'Mano' : 'Manos'}
            </span>
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              {[...state.rounds].reverse().map((round, idx) => {
                const actualIdx = state.rounds.length - idx;
                const isTeamAWinner = round.appliedA > round.appliedB;
                const isTeamBWinner = round.appliedB > round.appliedA;

                return (
                  <div key={round.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 w-6 text-center tabular-nums">
                      {actualIdx}
                    </span>

                    <div className="flex-1 flex items-center justify-between">
                      <span className={`text-lg tabular-nums text-[#0f3b9e] ${isTeamAWinner ? 'font-black' : 'font-bold opacity-50'}`}>
                        {round.appliedA}
                      </span>

                      <span className="text-[10px] font-bold text-slate-300">—</span>

                      <span className={`text-lg tabular-nums text-[#cc102d] ${isTeamBWinner ? 'font-black' : 'font-bold opacity-50'}`}>
                        {round.appliedB}
                      </span>
                    </div>

                    {round.isDouble && (
                      <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">x2</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <details
        open={settingsOpen}
        onToggle={(event) => setSettingsOpen(event.currentTarget.open)}
        className="group"
      >
        <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 bg-white rounded-2xl font-black text-slate-600 uppercase tracking-[0.3em] text-[10px] shadow-sm border border-slate-100 hover:text-slate-800 transition-all">
          <span>Opciones de Mesa</span>
          <span className="transition-transform group-open:rotate-180 text-lg leading-none">▾</span>
        </summary>
        <div className="mt-3 bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4 animate-slide-up">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Equipo A</label>
              <input value={teamAInput} onChange={(e) => setTeamAInput(e.target.value)} className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-slate-200 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Equipo B</label>
              <input value={teamBInput} onChange={(e) => setTeamBInput(e.target.value)} className="w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-slate-200 transition-all" />
            </div>
          </div>

          <label className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/50 border border-slate-100 cursor-pointer hover:bg-slate-50 transition-all">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={doubleInput}
                onChange={(e) => setDoubleInput(e.target.checked)}
                className="peer h-5 w-5 appearance-none rounded-lg border-2 border-slate-200 checked:bg-[#0f3b9e] checked:border-[#0f3b9e] transition-all cursor-pointer"
              />
              <svg className="absolute h-5 w-5 text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none p-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Doblar primera mano (x2)</span>
          </label>

          <button
            onClick={saveSettings}
            className="w-full rounded-xl bg-slate-800 text-white py-3 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-colors"
          >
            Actualizar Mesa
          </button>

          <div className="flex gap-3 pt-3 border-t border-slate-50">
            <button onClick={exportData} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-black text-[10px] uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors">
              Respaldar
            </button>
            <button onClick={() => importInputRef.current?.click()} className="flex-1 rounded-xl border border-slate-200 py-2.5 font-black text-[10px] uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors">
              Importar
            </button>
          </div>
          <input ref={importInputRef} type="file" accept="application/json" onInput={importData} className="hidden" />
        </div>
      </details>

      <footer className="pb-6 pt-2 text-center">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Hecho en 🇨🇺</span>
      </footer>
    </main>
  );
}

export default App;
