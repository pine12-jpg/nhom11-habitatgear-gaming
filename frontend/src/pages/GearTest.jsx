import { useEffect, useRef, useState } from "react";

/* ---------- Bố cục bàn phím 75% (mỗi hàng tổng 15 đơn vị) ---------- */
const k = (code, label, w = 1) => ({ code, label, w });
const KEY_ROWS = [
  [k("Escape", "Esc"), ...Array.from({ length: 12 }, (_, i) => k(`F${i + 1}`, `F${i + 1}`)), k("Delete", "Del", 2)],
  [k("Backquote", "`"), ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => k(`Digit${d}`, d)), k("Minus", "-"), k("Equal", "="), k("Backspace", "⌫", 2)],
  [k("Tab", "Tab", 1.5), ..."QWERTYUIOP".split("").map((c) => k(`Key${c}`, c)), k("BracketLeft", "["), k("BracketRight", "]"), k("Backslash", "\\", 1.5)],
  [k("CapsLock", "Caps", 1.75), ..."ASDFGHJKL".split("").map((c) => k(`Key${c}`, c)), k("Semicolon", ";"), k("Quote", "'"), k("Enter", "Enter", 2.25)],
  [k("ShiftLeft", "Shift", 2.25), ..."ZXCVBNM".split("").map((c) => k(`Key${c}`, c)), k("Comma", ","), k("Period", "."), k("Slash", "/"), k("ShiftRight", "Shift", 1.75), k("ArrowUp", "↑")],
  [k("ControlLeft", "Ctrl", 1.25), k("MetaLeft", "Win", 1.25), k("AltLeft", "Alt", 1.25), k("Space", "Space", 6.25), k("AltRight", "Alt"), k("ControlRight", "Ctrl"), k("ArrowLeft", "←"), k("ArrowDown", "↓"), k("ArrowRight", "→")],
];
const ALL_CODES = KEY_ROWS.flat().map((x) => x.code);

const BUTTONS = [
  { id: 0, label: "Chuột trái" },
  { id: 2, label: "Chuột phải" },
  { id: 1, label: "Nút giữa (lăn)" },
  { id: 3, label: "Nút bên (Lùi)" },
  { id: 4, label: "Nút bên (Tiến)" },
];

/* ---------------------------- Kiểm tra bàn phím ---------------------------- */
function KeyboardTester() {
  const [active, setActive] = useState(false);
  const [down, setDown] = useState(() => new Set());
  const [tested, setTested] = useState(() => new Set());
  const [last, setLast] = useState(null);

  useEffect(() => {
    if (!active) return undefined;
    const onDown = (e) => {
      e.preventDefault(); // chặn phím tắt của trình duyệt (F5, Tab, Ctrl+...) khi đang test
      setDown((s) => new Set(s).add(e.code));
      setTested((s) => new Set(s).add(e.code));
      setLast({ key: e.key === " " ? "Space" : e.key, code: e.code });
    };
    const onUp = (e) => {
      e.preventDefault();
      setDown((s) => {
        const n = new Set(s);
        n.delete(e.code);
        return n;
      });
    };
    const onBlur = () => setDown(new Set());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [active]);

  const done = ALL_CODES.filter((c) => tested.has(c)).length;
  const pct = Math.round((done / ALL_CODES.length) * 100);

  return (
    <div className="gt-panel">
      <div className="gt-toolbar">
        <button type="button" className={`btn ${active ? "btn-dark" : "btn-primary"}`} onClick={() => setActive((a) => !a)}>
          {active ? "⏸ Dừng kiểm tra" : "▶ Bắt đầu kiểm tra"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { setTested(new Set()); setDown(new Set()); setLast(null); }}>↺ Làm lại</button>
        <div className="gt-progress">
          <div className="gt-progress-text">Đã thử <strong>{done}</strong>/{ALL_CODES.length} phím ({pct}%)</div>
          <div className="gt-progress-bar"><span style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <div className={`kt-board${active ? " on" : ""}`}>
        {!active && <div className="kt-overlay">Bấm “Bắt đầu kiểm tra” rồi gõ thử từng phím</div>}
        {KEY_ROWS.map((row, r) => (
          <div className="kt-row" key={r}>
            {row.map((key) => (
              <div
                key={key.code}
                className={`kt-key${down.has(key.code) ? " down" : tested.has(key.code) ? " tested" : ""}`}
                style={{ flex: key.w }}
              >
                {key.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="gt-last">
        {last ? (
          <>Phím vừa nhấn: <strong>{last.key}</strong> <span className="muted">(mã {last.code})</span></>
        ) : (
          <span className="muted">Chưa có phím nào được nhấn.</span>
        )}
      </div>
      <p className="gt-hint">💡 Phím nào <b>không sáng lên</b> khi bạn nhấn, hoặc sáng chập chờn, có thể bị liệt / chập mạch. Khi đang kiểm tra, các phím tắt của trình duyệt tạm thời bị khóa.</p>
    </div>
  );
}

/* ------------------------------ Kiểm tra chuột ------------------------------ */
function MouseTester() {
  const pad = useRef(null);
  const lastDown = useRef({});
  const [held, setHeld] = useState({});
  const [counts, setCounts] = useState({});
  const [doubles, setDoubles] = useState({});
  const [wheel, setWheel] = useState({ up: 0, down: 0, dir: 0 });

  const [cps, setCps] = useState({ state: "idle", clicks: 0, left: 5, result: null });
  const cpsRef = useRef({ state: "idle", clicks: 0, timer: null });

  useEffect(() => {
    const el = pad.current;
    if (!el) return undefined;
    // Wheel phải gắn thủ công (không passive) để chặn trang cuộn khi đang thử lăn chuột
    const onWheel = (e) => {
      e.preventDefault();
      setWheel((w) => (e.deltaY < 0 ? { ...w, up: w.up + 1, dir: -1 } : { ...w, down: w.down + 1, dir: 1 }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => () => clearInterval(cpsRef.current.timer), []);

  function onMouseDown(e) {
    e.preventDefault(); // chặn cuộn tự động của nút giữa, điều hướng của nút bên
    const b = e.button;
    const now = performance.now();
    if (lastDown.current[b] !== undefined && now - lastDown.current[b] < 40) {
      setDoubles((d) => ({ ...d, [b]: (d[b] || 0) + 1 })); // 2 lần nhấn trong < 40ms: nghi lỗi double-click
    }
    lastDown.current[b] = now;
    setHeld((h) => ({ ...h, [b]: true }));
    setCounts((c) => ({ ...c, [b]: (c[b] || 0) + 1 }));
  }
  function onMouseUp(e) {
    e.preventDefault();
    setHeld((h) => ({ ...h, [e.button]: false }));
  }

  function startCps() {
    clearInterval(cpsRef.current.timer);
    cpsRef.current = { state: "wait", clicks: 0, timer: null };
    setCps({ state: "wait", clicks: 0, left: 5, result: null });
  }
  function cpsClick() {
    const ref = cpsRef.current;
    if (ref.state === "wait") {
      ref.state = "run";
      const t0 = performance.now();
      ref.timer = setInterval(() => {
        const left = Math.max(0, 5 - (performance.now() - t0) / 1000);
        if (left <= 0) {
          clearInterval(ref.timer);
          ref.state = "done";
          setCps({ state: "done", clicks: ref.clicks, left: 0, result: (ref.clicks / 5).toFixed(1) });
        } else {
          setCps((s) => ({ ...s, left: Math.round(left * 10) / 10 }));
        }
      }, 50);
    }
    if (ref.state === "run") {
      ref.clicks += 1;
      setCps((s) => ({ ...s, state: "run", clicks: ref.clicks }));
    }
  }

  const totalDoubles = Object.values(doubles).reduce((a, b) => a + b, 0);

  return (
    <div className="gt-panel">
      <div className="mt-grid">
        <div
          ref={pad}
          className="mt-pad"
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={() => setHeld({})}
          onContextMenu={(e) => e.preventDefault()}
          onAuxClick={(e) => e.preventDefault()}
        >
          <div className="mt-pad-hint">Đặt con trỏ vào khung này rồi bấm / lăn chuột</div>
          <div className="mt-mouse" aria-hidden="true">
            <div className={`mt-btn mt-left${held[0] ? " down" : ""}`}>L</div>
            <div className={`mt-btn mt-right${held[2] ? " down" : ""}`}>R</div>
            <div className={`mt-btn mt-wheel${held[1] ? " down" : ""}${wheel.dir === -1 ? " up" : wheel.dir === 1 ? " dn" : ""}`}>{wheel.dir === -1 ? "▲" : wheel.dir === 1 ? "▼" : "●"}</div>
            <div className={`mt-btn mt-back${held[3] ? " down" : ""}`}>◀</div>
            <div className={`mt-btn mt-fwd${held[4] ? " down" : ""}`}>▶</div>
          </div>
        </div>

        <div className="mt-stats">
          <table className="mt-table">
            <tbody>
              {BUTTONS.map((b) => (
                <tr key={b.id} className={held[b.id] ? "hot" : ""}>
                  <td>{b.label}</td>
                  <td className="num">{counts[b.id] || 0} lần</td>
                  <td className="warn">{doubles[b.id] ? `⚠ ${doubles[b.id]} lần nghi double-click` : ""}</td>
                </tr>
              ))}
              <tr>
                <td>Lăn chuột</td>
                <td className="num">▲ {wheel.up} &nbsp; ▼ {wheel.down}</td>
                <td />
              </tr>
            </tbody>
          </table>
          <div className={`mt-verdict ${totalDoubles ? "bad" : "ok"}`}>
            {totalDoubles
              ? `Phát hiện ${totalDoubles} lần nhấn đúp bất thường — switch chuột có thể bị lỗi double-click.`
              : "Chưa phát hiện lỗi double-click. Hãy bấm thử từng nút nhiều lần."}
          </div>
          <button type="button" className="btn-link" onClick={() => { setCounts({}); setDoubles({}); setWheel({ up: 0, down: 0, dir: 0 }); lastDown.current = {}; }}>↺ Làm lại</button>
        </div>
      </div>

      <div className="cps-box">
        <div>
          <h3>⚡ Test tốc độ click (CPS) — 5 giây</h3>
          <p className="muted" style={{ margin: "4px 0 0" }}>Bấm “Bắt đầu”, rồi click liên tục vào ô bên phải. Đồng hồ chạy từ lần click đầu tiên.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={startCps}>{cps.state === "idle" ? "Bắt đầu" : "Thử lại"}</button>
        <button
          type="button"
          className={`cps-pad ${cps.state}`}
          onMouseDown={(e) => { if (e.button === 0) cpsClick(); }}
          disabled={cps.state === "idle" || cps.state === "done"}
        >
          {cps.state === "idle" && "Bấm “Bắt đầu” trước"}
          {cps.state === "wait" && "Click vào đây để bắt đầu!"}
          {cps.state === "run" && <><strong>{cps.clicks}</strong> click • còn {cps.left.toFixed(1)}s</>}
          {cps.state === "done" && <><strong>{cps.result} CPS</strong> ({cps.clicks} click / 5s)</>}
        </button>
      </div>
    </div>
  );
}

/** Trang công cụ kiểm tra bàn phím & chuột ngay trên trình duyệt */
export default function GearTest() {
  const [tab, setTab] = useState("keyboard");
  return (
    <div className="page container">
      <div className="gt-head">
        <span className="setup-eyebrow">🧪 Công cụ miễn phí</span>
        <h1>Kiểm tra bàn phím & chuột</h1>
        <p className="muted">Mới mua gear hoặc nghi ngờ thiết bị bị lỗi? Test ngay trên trình duyệt: phím liệt, nút kẹt, lỗi double-click, tốc độ click… không cần cài phần mềm.</p>
      </div>
      <div className="gt-tabs">
        <button type="button" className={`gt-tab${tab === "keyboard" ? " active" : ""}`} onClick={() => setTab("keyboard")}>⌨️ Bàn phím</button>
        <button type="button" className={`gt-tab${tab === "mouse" ? " active" : ""}`} onClick={() => setTab("mouse")}>🖱️ Chuột</button>
      </div>
      {tab === "keyboard" ? <KeyboardTester /> : <MouseTester />}
    </div>
  );
}
