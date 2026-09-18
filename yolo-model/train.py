"""YOLOv8n для 12 Arduino-модулей. Запуск: pip install ultralytics && python train.py"""
from ultralytics import YOLO

model = YOLO("yolov8n.pt")  # nano — быстро, хватит для демо
model.train(
    data="data.yaml",
    epochs=120,
    imgsz=640,
    batch=16,
    patience=20,
    augment=True,
    hsv_h=0.015, hsv_s=0.5, hsv_v=0.4,  # свет в школе разный
    degrees=15, translate=0.1, scale=0.3,
    name="artisan_yolo",
)
print("Export ONNX...")
model.export(format="onnx")  # -> best.onnx для браузера / FastAPI
