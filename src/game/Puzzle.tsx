import { useEffect, useMemo, useRef, useState } from "react";
import { blip, speak, stopSpeech, unlockAudio } from "../audio/sounds";
import { cloneArticulation, NEUTRAL, SLIDERS, type Articulation, type SliderKey } from "../model/articulation";
import { DEFAULT_TIMING, playbackDuration, poseAt } from "../model/playback";
import { HINT_COPY, scoreArticulation } from "../model/score";
import { WORDS, type WordPuzzle } from "../model/targets";
import { buildMouth } from "../mouth/geometry";
import { FrontLips } from "../mouth/FrontLips";
import { SagittalMouth } from "../mouth/SagittalMouth";

type Lock = { targetIndex: number };

function emptyLocks(word: WordPuzzle): (Lock | null)[] {
  return word.steps.map(() => null);
}

export function Puzzle() {
  const [wordId, setWordId] = useState<WordPuzzle["id"]>("red");
  const [stepIndex, setStepIndex] = useState(0);
  const [sliders, setSliders] = useState<Articulation>(cloneArticulation(NEUTRAL));
  const [locks, setLocks] = useState<(Lock | null)[]>(() => emptyLocks(WORDS[0]));
  const [touched, setTouched] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playPose, setPlayPose] = useState<Articulation | null>(null);
  const [playIndex, setPlayIndex] = useState(0);
  const round = useRef(0);
  const draft = useRef<Articulation>(cloneArticulation(NEUTRAL));

  const word = WORDS.find((entry) => entry.id === wordId) ?? WORDS[0];
  const step = word.steps[stepIndex];
  const score = useMemo(() => scoreArticulation(sliders, step.targets), [sliders, step]);
  const shown = playPose ?? sliders;
  const mouth = useMemo(() => buildMouth(shown), [shown]);
  const solved = locks.every((lock) => lock !== null);
  const activeIndex = playing ? playIndex : stepIndex;
  const activeLabel = word.steps[activeIndex]?.label ?? step.label;

  useEffect(() => {
    const onPointer = () => unlockAudio();
    window.addEventListener("pointerdown", onPointer, { once: true });
    return () => window.removeEventListener("pointerdown", onPointer);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const poses = word.steps.map((sound, index) => sound.targets[locks[index]?.targetIndex ?? 0]);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timing = reduce ? { hold: 520, blend: 0 } : DEFAULT_TIMING;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const next = poseAt(poses, now - started, timing);
      setPlayPose(next.pose);
      setPlayIndex(next.index);
      if (next.done) {
        setPlaying(false);
        setPlayPose(null);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, word, locks]);

  function resetRound(nextWord: WordPuzzle, nextSliders = cloneArticulation(NEUTRAL)) {
    round.current += 1;
    stopSpeech();
    draft.current = cloneArticulation(nextSliders);
    setPlaying(false);
    setPlayPose(null);
    setWordId(nextWord.id);
    setStepIndex(0);
    setSliders(nextSliders);
    setLocks(emptyLocks(nextWord));
    setTouched(false);
  }

  function lockStep(index: number, targetIndex: number, ticket: number) {
    setLocks((current) => {
      const next = current.slice();
      next[index] = { targetIndex };
      return next;
    });
    blip();
    const othersLocked = locks.every((lock, lockIndex) => lockIndex === index || lock !== null);
    const isLast = index === word.steps.length - 1;
    window.setTimeout(() => {
      if (round.current !== ticket) return;
      if (!isLast) {
        setStepIndex(index + 1);
        return;
      }
      if (othersLocked) setPlaying(true);
    }, 700);
  }

  function onSlider(key: SliderKey, value: number) {
    if (playing || locks[stepIndex]) return;
    setTouched(true);
    const next = { ...sliders, [key]: value };
    const result = scoreArticulation(next, step.targets);
    if (!result.locked) {
      draft.current = next;
      setSliders(next);
      return;
    }
    const exact = step.targets[result.bestIndex];
    draft.current = exact;
    setSliders(exact);
    lockStep(stepIndex, result.bestIndex, round.current);
  }

  function chooseStep(index: number) {
    if (playing) return;
    const firstOpen = locks.findIndex((lock) => lock === null);
    if (!locks[index] && firstOpen !== -1 && index > firstOpen) return;
    if (!locks[stepIndex]) draft.current = sliders;
    setStepIndex(index);
    const lock = locks[index];
    setSliders(lock ? word.steps[index].targets[lock.targetIndex] : draft.current);
  }

  const hint = !touched
    ? "Say it, then trust what you feel."
    : score.locked || locks[stepIndex]
      ? step.detail
      : score.hint
        ? HINT_COPY[score.hint]
        : "Say it, then trust what you feel.";

  const percent = locks[stepIndex] ? 100 : score.percent;

  return (
    <div className="app">
      <section className="stage" aria-label="Mouth">
        <SagittalMouth mouth={mouth} soundLabel={activeLabel} />
        <figure className="front-inset">
          <figcaption>From the front</figcaption>
          <FrontLips lipRound={shown.lipRound} lipAperture={mouth.lipAperture} tongueTip={shown.tongueTip} />
        </figure>
        <p className="legend">{mouth.contact ? "The dot is the tongue touching." : "A dot appears when the tongue touches."}</p>
      </section>

      <section className="controls">
        <header className="mast">
          <p className="eyebrow">A mouth puzzle</p>
          <h1>Same Mouth</h1>
          <p className="lede">Say the word out loud. Feel your tongue and lips. Move the sliders until the drawing matches.</p>
        </header>

        <div className="word-switch" role="group" aria-label="Word">
          {WORDS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={entry.id === word.id ? "word-button is-on" : "word-button"}
              aria-pressed={entry.id === word.id}
              onClick={() => {
                if (entry.id !== word.id) resetRound(entry);
              }}
            >
              {entry.title}
            </button>
          ))}
        </div>

        <div className="word-block">
          <h2>{word.title}</h2>
          <p className="ipa">{word.ipa}</p>
        </div>

        <div className="hear-row">
          <button
            type="button"
            className="text-button"
            data-testid="hear-word"
            onClick={() => {
              unlockAudio();
              speak(word.speak);
            }}
          >
            Hear the word
          </button>
          <button
            type="button"
            className="text-button"
            data-testid="hear-sound"
            onClick={() => {
              unlockAudio();
              speak(step.speak);
            }}
          >
            Hear this sound
          </button>
        </div>

        <ol className="steps">
          {word.steps.map((sound, index) => {
            const locked = locks[index] !== null;
            const current = index === activeIndex;
            return (
              <li key={sound.id}>
                <button
                  type="button"
                  className={current ? "step is-current" : locked ? "step is-locked" : "step"}
                  aria-current={current ? "step" : undefined}
                  data-testid={`step-${sound.label}-${index}`}
                  onClick={() => chooseStep(index)}
                >
                  <span className="step-index">{index + 1}</span>
                  <span className="step-label">{sound.label}</span>
                  {locked ? <span className="step-state">Matched</span> : null}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="match" data-testid="match-percent">
          <div className="match-top">
            <span className={percent === 100 ? "percent is-done" : "percent"}>{percent}%</span>
            <span className="match-caption">{playing ? "Playing" : percent === 100 ? "Matched" : "Match"}</span>
          </div>
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>
          <p className="hint" data-testid="hint">
            {playing ? `The mouth is moving through “${word.title}”.` : hint}
          </p>
        </div>

        <div className="sliders">
          {SLIDERS.map((spec) => (
            <label key={spec.key} className="slider">
              <span className="slider-name">{spec.label}</span>
              <span className="slider-low">{spec.low}</span>
              <span className="slider-high">{spec.high}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={shown[spec.key]}
                disabled={playing || locks[stepIndex] !== null}
                data-testid={`slider-${spec.key}`}
                aria-valuetext={`${spec.label}, ${spec.low} to ${spec.high}`}
                onChange={(event) => onSlider(spec.key, Number(event.target.value))}
              />
              {spec.note ? <span className="slider-note">{spec.note}</span> : null}
            </label>
          ))}
        </div>

        <div className="actions">
          <button
            type="button"
            className="solid-button"
            data-testid="play-word"
            disabled={!solved || playing}
            onClick={() => {
              unlockAudio();
              setPlaying(true);
            }}
          >
            Play the word
          </button>
          <button type="button" className="text-button" data-testid="try-again" onClick={() => resetRound(word)}>
            Try again
          </button>
        </div>

        <p className="footnote">General American. Both tongue shapes for r count as a match. English l is the one this side view cannot show, because the air leaks over the sides.</p>
        <p className="sr-only" aria-live="polite">
          {word.title}, sound {activeLabel}, {percent} percent. {hint}
          {playing ? ` Playing for ${Math.round(playbackDuration(word.steps.length) / 100) / 10} seconds.` : ""}
        </p>
      </section>
    </div>
  );
}
