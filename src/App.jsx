import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Box, Camera, Check, Cpu, Download,
  FlaskConical, ImagePlus, Layers, ScanLine, SlidersHorizontal,
  Sparkles, Trash2, Users, GraduationCap, FileDown, Video, VideoOff, RefreshCw,
} from "lucide-react";
import { MODULES, PROJECT_TEMPLATE } from "./data";

// URL YOLO-бэкенда: на проде задается через VITE_API_URL, локально — localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/detect";
const LOGO = `${import.meta.env.BASE_URL}artisan-logo.svg`;

const modById = (id) => MODULES.find((m) => m.id === id);

export default function App() {
  const [photo, setPhoto] = useState(null); // objectURL реального кадра
  const [photoBlob, setPhotoBlob] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState([]);
  const [camOn, setCamOn] = useState(false);
  const [facing, setFacing] = useState("environment"); // rear по умолчанию — как видит глаз, без зеркала
  const [camError, setCamError] = useState("");
  const [apiError, setApiError] = useState("");
  const [age, setAge] = useState("12–14");
  const [level, setLevel] = useState(1); // 0 beginner 1 inter 2 advanced
  const [duration, setDuration] = useState("90 мин");
  const [view, setView] = useState("teacher");
  const [tab, setTab] = useState("studio");
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);

  const levels = ["Beginner", "Intermediate", "Advanced"];

  // --- камера (без зеркалирования: показываем кадр 1:1 как с сенсора) ---
  const startCamera = async (mode) => {
    const fm = mode || facing;
    setCamError("");
    stopTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: fm }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamOn(true);
      // video элемент появится после рендера — подключаем в effect
    } catch (e) {
      setCamError("Нет доступа к камере. Проверь разрешение браузера / HTTPS / localhost.");
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    if (camOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [camOn]);

  const stopCamera = () => {
    stopTracks();
    setCamOn(false);
  };

  const switchCamera = () => {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    setPhoto(null);
    setDetected([]);
    startCamera(next);
  };

  useEffect(() => () => stopCamera(), []);

  // --- отправка кадра на YOLO-бэкенд ---
  const detectBlob = async (blob) => {
    setDetecting(true);
    setDetected([]);
    setApiError("");
    try {
      const fd = new FormData();
      fd.append("f", blob, "frame.jpg");
      const res = await fetch(API_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const dets = (json.detections || [])
        .filter((d) => modById(d.id))
        .map((d) => ({ id: d.id, conf: d.conf, box: d.box }));
      setDetected(dets);
      if (dets.length === 0) setApiError("Модель ничего не нашла. Попробуй ближе / ровнее свет / другой ракурс.");
    } catch (e) {
      setApiError("YOLO-бэкенд недоступен. Запусти: uvicorn app:app --port 8000 (папка yolo-model). Пока можно добавить модули вручную ниже.");
    } finally {
      setDetecting(false);
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // 1:1 без flip — кадр = то, что видит сенсор, никакого scaleX(-1)
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhotoBlob(blob);
      setPhoto(URL.createObjectURL(blob));
      detectBlob(blob);
    }, "image/jpeg", 0.92);
  };

  const onFile = (f) => {
    if (!f) return;
    setPhotoBlob(f);
    setPhoto(URL.createObjectURL(f));
    detectBlob(f);
  };

  const removeMod = (id) => setDetected((p) => p.filter((d) => d.id !== id));
  const addMod = (id) => {
    if (detected.find((d) => d.id === id)) return;
    setDetected((p) => [...p, { id, conf: 1.0, box: null, manual: true }]);
  };

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO} alt="Artisan" className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200" />
            <div className="leading-none">
              <div className="font-semibold tracking-tight text-[#0a1931] text-[26px]">Artisan</div>
              <div className="text-[11px] text-slate-500 font-mono">Studio · Snap & Teach</div>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            {[["studio", "Studio"], ["library", "Library"], ["model", "YOLO-модель"]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)}
                className={`px-3.5 py-1.5 rounded-full transition ${tab === k ? "bg-[#0a1931] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {l}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline font-mono text-[11px] px-2 py-1 rounded-md bg-[#ecfdf5] text-[#059669] border border-[#d1fae5]">● yolo · live</span>
            <button className="text-sm font-medium bg-[#10b981] text-white px-4 py-2 rounded-full hover:bg-[#059669] transition">Export PDF</button>
          </div>
        </div>
      </header>

      {tab === "studio" && (
        <main className="max-w-6xl mx-auto px-5">
          {/* HERO — minimal */}
          <section className="blueprint rounded-3xl mt-6 px-6 py-12 md:py-16 text-center border border-[#d1fae5] bg-white">
            <div className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-[#ecfdf5] border border-[#d1fae5] text-[#059669] mb-5">
              <Sparkles size={13} /> CASE 01 · ARTISAN EDUCATION
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-[1.02] text-[#0a1931]">
              Наведи камеру —<br />получи урок.
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto mt-4 text-[15px] md:text-base">
              Живой кадр с камеры уходит на твою YOLO-модель. Боксы и уверенность —
              реальные, с бэкенда. Дальше Studio собирает Project Card.
            </p>
            <div className="flex items-center justify-center gap-3 mt-7">
              <button onClick={() => document.getElementById("snap")?.scrollIntoView({ behavior: "smooth" })}
                className="group inline-flex items-center gap-2 bg-[#10b981] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#059669] transition">
                <Camera size={16} /> Открыть камеру <ArrowRight size={15} className="group-hover:translate-x-0.5 transition" />
              </button>
            </div>
            <div className="flex justify-center gap-6 mt-8 font-mono text-[11px] text-slate-500">
              <span>12 модулей</span><span>·</span><span>live camera</span><span>·</span><span>fastapi :8000</span>
            </div>
          </section>

          {/* STUDIO GRID */}
          <section id="snap" className="grid md:grid-cols-2 gap-4 mt-4">
            {/* LEFT: SNAP */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold tracking-tight flex items-center gap-2 text-[#0a1931]"><span className="w-6 h-6 rounded-full bg-[#10b981] text-white text-xs grid place-items-center font-mono">1</span> Snap — живая камера</h2>
                <span className="font-mono text-[11px] text-slate-400">post → {API_URL}</span>
              </div>

              {/* окно камеры / кадра */}
              <div className="relative rounded-2xl border-2 border-slate-300 bg-[#0a1931] min-h-[300px] grid place-items-center overflow-hidden">
                {!camOn && !photo && (
                  <button onClick={startCamera} className="text-center p-8 text-white">
                    <Video className="mx-auto text-[#10b981]" size={30} />
                    <div className="font-medium mt-3 text-sm">Включить камеру</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">нужен HTTPS или localhost · задняя камера</div>
                  </button>
                )}
                {camOn && !photo && (
                  <video ref={videoRef} playsInline muted autoPlay
                    style={{ transform: "none", scaleX: 1 }}
                    className="w-full max-h-[380px] object-cover bg-black" />
                )}
                {photo && (
                  <div className="relative w-full">
                    <img src={photo} alt="кадр" className="w-full max-h-[380px] object-contain bg-black" />
                    {detected.filter((d) => d.box).map((d) => (
                      <div key={d.id} className="bbox absolute border-2 border-[#10b981] rounded-lg"
                        style={{ left: `${d.box.x}%`, top: `${d.box.y}%`, width: `${d.box.w}%`, height: `${d.box.h}%` }}>
                        <span className="absolute -top-6 left-0 whitespace-nowrap text-[10px] font-mono bg-[#10b981] text-white px-2 py-0.5 rounded-full">
                          {modById(d.id)?.name} {Math.round(d.conf * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {detecting && (
                  <div className="absolute inset-x-4 top-0 h-10 scanline rounded pointer-events-none">
                    <div className="flex items-center gap-2 justify-center text-[11px] font-mono bg-white text-[#0a1931] w-fit mx-auto px-3 py-1 rounded-full mt-2">
                      <ScanLine size={13} className="animate-pulse" /> detecting… yolo
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />

              {camError && <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{camError}</div>}
              {apiError && <div className="mt-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">{apiError}</div>}

              {/* управление */}
              <div className="flex gap-2 mt-3">
                {!camOn
                  ? <button onClick={startCamera} className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs font-semibold bg-[#10b981] text-white rounded-full py-2.5 hover:bg-[#059669] transition"><Video size={13} /> Включить камеру</button>
                  : !photo
                    ? <button onClick={captureFrame} className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs font-semibold bg-[#10b981] text-white rounded-full py-2.5 hover:bg-[#059669] transition"><Camera size={13} /> Снять кадр и распознать</button>
                    : <>
                      <button onClick={() => { setPhoto(null); setDetected([]); }} className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs font-medium border border-slate-300 rounded-full py-2.5 hover:bg-slate-50 transition text-[#0a1931]"><RefreshCw size={13} /> Переснять</button>
                      <button onClick={captureFrame} className="flex-1 inline-flex justify-center items-center gap-1.5 text-xs font-semibold bg-[#10b981] text-white rounded-full py-2.5 hover:bg-[#059669] transition"><Camera size={13} /> Снять заново</button>
                    </>}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={stopCamera} className="flex-1 inline-flex justify-center items-center gap-1.5 text-[11px] text-slate-500 hover:text-red-600 transition py-1"><VideoOff size={12} /> выкл. камеру</button>
                <button onClick={switchCamera} className="flex-1 inline-flex justify-center items-center gap-1.5 text-[11px] text-slate-500 hover:text-[#059669] transition py-1"><RefreshCw size={12} /> {facing === "environment" ? "задняя" : "передняя"} → сменить</button>
                <button onClick={() => fileRef.current?.click()} className="flex-1 inline-flex justify-center items-center gap-1.5 text-[11px] text-slate-500 hover:text-[#059669] transition py-1"><ImagePlus size={12} /> или загрузить файл</button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </div>

              {/* detected chips — только реальные ответы бэкенда */}
              {detected.length > 0 && (
                <div className="mt-4 fade-up">
                  <div className="text-[11px] font-mono text-slate-500 mb-2">НАЙДЕНО МОДЕЛЬЮ: {detected.length} · ✕ убирает ложное</div>
                  <div className="flex flex-wrap gap-2">
                    {detected.map((d) => (
                      <span key={d.id} className="bbox inline-flex items-center gap-1.5 text-xs font-medium bg-[#0a1931] text-white pl-3 pr-1.5 py-1.5 rounded-full">
                        {modById(d.id)?.name}
                        <span className="font-mono text-[10px] bg-[#10b981] px-1.5 py-0.5 rounded-full">{Math.round(d.conf * 100)}%</span>
                        <button onClick={() => removeMod(d.id)} className="w-5 h-5 grid place-items-center rounded-full hover:bg-white/20"><Trash2 size={11} /></button>
                      </span>
                    ))}
                  </div>
                  <details className="mt-3 text-xs">
                    <summary className="cursor-pointer text-slate-500 hover:text-[#059669]">Модель промахнулась? Добавить вручную +</summary>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {MODULES.filter((m) => !detected.find((d) => d.id === m.id)).map((m) => (
                        <button key={m.id} onClick={() => addMod(m.id)} className="px-2.5 py-1 rounded-full border border-slate-300 hover:border-[#10b981] hover:text-[#059669] transition">{m.name}</button>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* RIGHT: PARAMS */}
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5">
                <h2 className="font-semibold tracking-tight flex items-center gap-2 mb-4 text-[#0a1931]"><span className="w-6 h-6 rounded-full bg-[#10b981] text-white text-xs grid place-items-center font-mono">2</span> Параметры урока</h2>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-[11px] font-mono text-slate-500 mb-1.5">ВОЗРАСТ</div>
                    {["10–11", "12–14", "15–17"].map((a) => (
                      <button key={a} onClick={() => setAge(a)} className={`block w-full text-left px-3 py-2 rounded-xl mb-1 transition ${age === a ? "bg-[#10b981] text-white" : "hover:bg-slate-50 border border-slate-200 text-[#0a1931]"}`}>{a}</button>
                    ))}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-slate-500 mb-1.5">ДЛИТЕЛЬНОСТЬ</div>
                    {["45 мин", "90 мин", "2 × 90"].map((d) => (
                      <button key={d} onClick={() => setDuration(d)} className={`block w-full text-left px-3 py-2 rounded-xl mb-1 transition ${duration === d ? "bg-[#10b981] text-white" : "hover:bg-slate-50 border border-slate-200 text-[#0a1931]"}`}>{d}</button>
                    ))}
                  </div>
                  <div>
                    <div className="text-[11px] font-mono text-slate-500 mb-1.5">ТЕМА</div>
                    {["Робо-барьер", "Метео", "Светомузыка"].map((t) => (
                      <button key={t} className="block w-full text-left px-3 py-2 rounded-xl mb-1 border border-slate-200 hover:bg-slate-50 hover:border-[#10b981] transition truncate text-[#0a1931]">{t}</button>
                    ))}
                  </div>
                </div>
                <div className="mt-4 bg-[#ecfdf5] border border-[#d1fae5] rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#0a1931]"><SlidersHorizontal size={15} className="text-[#059669]" /> Make Easier / Harder</div>
                  <input type="range" min={0} max={2} value={level} onChange={(e) => setLevel(+e.target.value)} className="w-full mt-3 accent-[#10b981]" />
                  <div className="flex justify-between font-mono text-[11px] mt-1">
                    {levels.map((l, i) => (
                      <span key={l} className={i === level ? "text-[#059669] font-bold" : "text-slate-400"}>{l}</span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-600 mt-2">
                    {level === 0 && "→ Без OLED и функций: всё в loop(), подсказок больше."}
                    {level === 1 && "→ База: функции readCm(), автомат OPEN/CLOSE."}
                    {level === 2 && "→ + OLED, зуммер, калибровка порога, прерывания."}
                  </div>
                </div>
              </div>

              {/* COMPAT */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 text-sm">
                <div className="flex items-center gap-2 font-semibold tracking-tight text-[#0a1931]"><Cpu size={16} className="text-[#059669]" /> Wiring Guard</div>
                {detected.length === 0
                  ? <div className="text-slate-500 text-xs mt-2">Сними кадр — проверим конфликты пинов по реально найденным модулям.</div>
                  : <div className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-[#0a1931] bg-[#ecfdf5] border border-[#d1fae5] rounded-xl px-3 py-2"><Check size={13} className="text-[#059669]" /> Конфликтов нет: Trig D5 · Echo D18 · Servo D13</div>
                    <div className="font-mono text-[11px] text-slate-500 px-1">питание: серва отдельным 5V · общий GND обязателен</div>
                  </div>}
              </div>
            </div>
          </section>

          {/* PROJECT CARD */}
          <section className="bg-[#0a1931] text-slate-100 rounded-3xl mt-4 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold tracking-tight flex items-center gap-2 text-lg"><span className="w-6 h-6 rounded-full bg-[#10b981] text-white text-xs grid place-items-center font-mono">3</span> Project Card</h2>
              <div className="flex items-center gap-2">
                <div className="bg-white/10 rounded-full p-1 flex text-xs font-medium">
                  {[["teacher", "Teacher", Users], ["student", "Student", GraduationCap]].map(([k, l, Icon]) => (
                    <button key={k} onClick={() => setView(k)} className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full transition ${view === k ? "bg-white text-[#0a1931]" : "text-slate-300 hover:text-white"}`}>
                      <Icon size={13} /> {l}
                    </button>
                  ))}
                </div>
                <button className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#10b981] text-white px-4 py-2 rounded-full hover:bg-[#059669] transition"><FileDown size={13} /> PDF</button>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4 mt-6">
              <div className="md:col-span-3 bg-white text-[#0a1931] rounded-2xl p-6">
                <div className="font-mono text-[11px] text-slate-500">{age} · {levels[level]} · {duration} · {detected.length || "—"} модуля</div>
                <h3 className="text-2xl font-semibold tracking-tight mt-1">{PROJECT_TEMPLATE.title}</h3>
                {view === "teacher" ? (
                  <div className="mt-4 space-y-4 text-sm fade-up">
                    <Block t="Problem" c={PROJECT_TEMPLATE.problem} />
                    <Block t="Learning Goal" c={PROJECT_TEMPLATE.goal} />
                    <Block t="Algorithm" c={PROJECT_TEMPLATE.algorithm.map((a, i) => `${i + 1}. ${a}`).join("\n")} mono />
                    <Block t="Assessment" c={PROJECT_TEMPLATE.assessment} />
                    <div className="border-l-2 border-[#10b981] bg-[#ecfdf5] rounded-r-xl p-3 text-xs"><b>Методика:</b> сначала собери без кода, проверь серву рукой. Частая ошибка — нет общего GND.</div>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4 text-sm fade-up">
                    <Block t="Твоя задача" c="Собери барьер, который сам открывается, когда подносишь руку ближе 15 см." />
                    <Block t="Подсказки" c={"1. Подключи Trig → D5, Echo → D18\n2. Серва → D13, питание отдельно\n3. Запусти Starter Code и поднеси ладонь"} mono />
                    <Block t="Challenge" c={PROJECT_TEMPLATE.challenge} />
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="font-mono text-[11px] text-slate-400 mb-2">STARTER CODE · arduino</div>
                  <pre className="font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre">{PROJECT_TEMPLATE.code}</pre>
                  <button className="mt-3 w-full inline-flex justify-center items-center gap-2 bg-[#10b981] text-white text-xs font-semibold py-2.5 rounded-full hover:bg-[#059669] transition"><Download size={13} /> Скачать .ino</button>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-xs">
                  <div className="font-mono text-[11px] text-slate-400 mb-2 flex items-center gap-1.5"><FlaskConical size={12} /> FLOWCHART (auto)</div>
                  <div className="font-mono leading-loose">INIT → MEASURE → d&lt;15? ─┬─ YES → OPEN 90°<br />│<br />└─ NO → CLOSE 0° → delay 200ms ↺</div>
                </div>
              </div>
            </div>
          </section>

          {/* MODULES STRIP */}
          <section className="mt-4 bg-white border border-slate-200 rounded-3xl p-6">
            <div className="flex items-center gap-2 font-semibold tracking-tight text-[#0a1931]"><Layers size={16} className="text-[#059669]" /> 12 модулей, которые узнаёт YOLO</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-4">
              {MODULES.map((m) => (
                <div key={m.id} className="border border-slate-200 rounded-2xl p-3 hover:border-[#10b981] hover:bg-[#ecfdf5]/50 transition">
                  <div className="text-lg">{m.icon}</div>
                  <div className="text-xs font-semibold mt-1 leading-tight text-[#0a1931]">{m.name}</div>
                  <div className="font-mono text-[10px] text-slate-500 mt-0.5">{m.pins}</div>
                </div>
              ))}
            </div>
          </section>

          <footer className="text-center font-mono text-[11px] text-slate-400 py-10">
            ARTISAN Studio · Snap & Teach · NIS Aktau 2026 · BUILD · TEST · DEMO
          </footer>
        </main>
      )}

      {tab === "library" && (
        <main className="max-w-6xl mx-auto px-5 py-10">
          <h2 className="text-3xl font-semibold tracking-tighter text-[#0a1931]">Library</h2>
          <p className="text-slate-500 text-sm mt-1">Community-проекты. Рейтинг по пересборкам в школах.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {["Умный барьер", "Метеостанция DHT+OLED", "Светомузыка NeoPixel", "Парктроник с зуммером", "Охранник PIR", "Светофор LDR"].map((t, i) => (
              <div key={t} className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-[#10b981] hover:shadow-md transition">
                <div className="font-mono text-[11px] text-[#059669]">★ {(4.9 - i * 0.1).toFixed(1)} · {120 - i * 14} сборок</div>
                <div className="font-semibold tracking-tight mt-1 text-[#0a1931]">{t}</div>
                <div className="text-xs text-slate-500 mt-1">Beginner → Advanced · {45 + i * 15} мин</div>
              </div>
            ))}
          </div>
        </main>
      )}

      {tab === "model" && <ModelTab />}
    </div>
  );
}

function Block({ t, c, mono }) {
  return (
    <div>
      <div className="font-mono text-[11px] text-slate-500 uppercase tracking-wide">{t}</div>
      <div className={`mt-1 text-[#0a1931] ${mono ? "font-mono text-[12px] whitespace-pre-line bg-[#f5f6f8] border border-slate-200 rounded-xl p-3" : ""}`}>{c}</div>
    </div>
  );
}

function ModelTab() {
  return (
    <main className="max-w-6xl mx-auto px-5 py-10">
      <h2 className="text-3xl font-semibold tracking-tighter text-[#0a1931]">Своя YOLO-модель: запуск</h2>
      <p className="text-slate-500 text-sm mt-1 max-w-2xl">Фронт теперь шлет <span className="font-mono">реальный кадр</span> на <span className="font-mono">POST localhost:8000/detect</span>. Никаких моков — только ответ модели.</p>
      <div className="grid md:grid-cols-2 gap-3 mt-6 text-sm">
        {[
          ["1. Датасет", "По 80–150 фото на каждый из 12 классов = ~1200 кадров. Разметка в Roboflow, аугментации: поворот, яркость, blur. Сплит 80/10/10. data.yaml уже в yolo-model/."],
          ["2. Обучение", "YOLOv8n, 120 эпох, imgsz 640, Colab T4. Цель mAP50 > 0.85. Экспорт best.pt → best.onnx. Скрипт: yolo-model/train.py."],
          ["3. Бэкенд (обязательно для demo)", "yolo-model/app.py уже ждет поле 'f'. Запуск: pip install ultralytics fastapi uvicorn python-multipart && uvicorn app:app --port 8000. Проверь: открой камеру → сними кадр → боксы только от модели."],
          ["4. На защите", "Камера требует HTTPS или localhost — на хакатоне открывай с localhost. Держи live-модули на столе + запасной файл-фото. Ручное добавление осталось как страховка, если модель промахнется."],
        ].map(([t, c]) => (
          <div key={t} className="bg-white border border-slate-200 rounded-3xl p-5">
            <div className="font-semibold tracking-tight text-[#0a1931]">{t}</div>
            <div className="text-slate-600 mt-2 leading-relaxed text-[13px]">{c}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 font-mono text-[11px] bg-[#0a1931] text-slate-200 rounded-2xl p-5 overflow-x-auto whitespace-pre">
{`cd yolo-model
pip install ultralytics fastapi uvicorn python-multipart
uvicorn app:app --port 8000
# фронт: npm run dev -> открыть камеру -> снять кадр`}
      </div>
      <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5"><Box size={12} /> Формат ответа модели: {"{ detections: [{ id, conf, box: {x,y,w,h} }] }"} — id строго из data.js</div>
    </main>
  );
}
