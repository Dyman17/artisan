"""FastAPI-инференс. Фронт шлет POST /detect с фото -> получает боксы."""
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
model = YOLO("runs/detect/artisan_yolo/weights/best.pt")  # после train.py

LABELS = ["arduino_uno","esp32","hcsr04","sg90","dht11","oled_ssd1306",
          "neopixel","buzzer","button","ldr","pir","dcmotor_l293d"]

@app.post("/detect")
async def detect(f: UploadFile, conf: float = 0.45):
    img = await f.read()
    r = model.predict(img, conf=conf, verbose=False)[0]
    out = []
    for b in r.boxes:
        cls = int(b.cls[0]); x1, y1, x2, y2 = [float(v) for v in b.xyxy[0]]
        w, h = r.orig_shape[1], r.orig_shape[0]
        out.append({"id": LABELS[cls], "conf": round(float(b.conf[0]), 3),
                    "box": {"x": round(x1/w*100,1), "y": round(y1/h*100,1),
                            "w": round((x2-x1)/w*100,1), "h": round((y2-y1)/h*100,1)}})
    return {"detections": out}

# uvicorn app:app --port 8000
