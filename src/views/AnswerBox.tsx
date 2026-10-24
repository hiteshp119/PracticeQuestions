import { useState } from 'preact/hooks';
import type { QFull } from '../lib/types';
import { check, type CheckResult } from '../lib/answer';

const MSG: Record<CheckResult, string> = {
  right: 'Correct.',
  wrong: 'Not quite. Try a hint, or reveal the answer.',
  invalid: 'Type a number (1/2, 0.5, 50%) or a formula like n/(n+1).',
};

/** Answer box for number/formula answers. Calls onResult with true/false once checked. */
export function AnswerBox({ q, id, onResult }: { q: QFull; id: string; onResult?: (ok: boolean) => void }) {
  const [val, setVal] = useState('');
  const [res, setRes] = useState<CheckResult | null>(null);
  if (q.answer.type === 'text') return null;
  const vars = q.answer.vars?.join(', ');
  const doCheck = () => {
    const r = check(val, q.answer.type, q.answer.value, q.answer.vars, q.answer.tol);
    setRes(r);
    if (r !== 'invalid') onResult?.(r === 'right');
  };
  return (
    <div style="display:flex;flex-direction:column;gap:6px">
      <div class="answer-row">
        <label class="sr-only" for={id}>Your answer</label>
        <input
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="off"
          spellcheck={false}
          placeholder={q.answer.type === 'expr' ? `Your answer in terms of ${vars}` : 'Your answer, e.g. 1/2'}
          value={val}
          class={res === 'right' ? 'right' : res === 'wrong' ? 'wrong' : ''}
          onInput={(e) => { setVal((e.target as HTMLInputElement).value); setRes(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); doCheck(); } e.stopPropagation(); }}
        />
        <button type="button" class="btn" onClick={doCheck}>Check</button>
      </div>
      {res && <span class={`check-msg ${res}`} role="status">{MSG[res]}</span>}
    </div>
  );
}
