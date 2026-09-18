// 12 базовых модулей MVP — единый словарь для фронта и YOLO-модели
export const MODULES = [
  { id: "arduino_uno", name: "Arduino UNO", icon: "◈", desc: "База проекта", pins: "—" },
  { id: "esp32", name: "ESP32", icon: "⬢", desc: "Wi-Fi / BT", pins: "3V3 · GND · GPIO" },
  { id: "hcsr04", name: "HC-SR04", icon: "◉", desc: "Ультразвук", pins: "VCC · Trig · Echo · GND" },
  { id: "sg90", name: "Servo SG90", icon: "↻", desc: "Сервопривод", pins: "VCC · GND · Signal" },
  { id: "dht11", name: "DHT11", icon: "≋", desc: "Темп. + влажн.", pins: "VCC · Data · GND" },
  { id: "oled_ssd1306", name: "OLED SSD1306", icon: "▦", desc: "Дисплей I2C", pins: "VCC · GND · SCL · SDA" },
  { id: "neopixel", name: "NeoPixel strip", icon: "✦", desc: "Адресные LED", pins: "5V · DIN · GND" },
  { id: "buzzer", name: "Buzzer", icon: "♪", desc: "Зуммер", pins: "+ · −" },
  { id: "button", name: "Button", icon: "○", desc: "Кнопка", pins: "2-pin" },
  { id: "ldr", name: "LDR / Фоторезистор", icon: "☼", desc: "Свет", pins: "Analog" },
  { id: "pir", name: "PIR HC-SR501", icon: "◐", desc: "Движение", pins: "VCC · OUT · GND" },
  { id: "dcmotor_l293d", name: "DC Motor + L293D", icon: "⚙", desc: "Мотор + драйвер", pins: "IN1 · IN2 · EN" },
];

export const PROJECT_TEMPLATE = {
  title: "Умный барьер: ультразвук + серво",
  problem: "Шлагбаум вручную — медленно и скучно. Сделаем автоматический барьер, который видит объект и поднимается сам.",
  goal: "Понять работу HC-SR04, ШИМ сервопривода и конечный автомат OPEN/CLOSE.",
  algorithm: ["INIT серво на 0°", "LOOP: измерить distance", "IF distance < 15 см → OPEN 90°", "ELSE → CLOSE 0°", "Пауза 200 мс"],
  code: `#include <Servo.h>\nServo barrier;\nconst int TRIG = 5, ECHO = 18, SERVO = 13;\n\nvoid setup() {\n  pinMode(TRIG, OUTPUT);\n  pinMode(ECHO, INPUT);\n  barrier.attach(SERVO);\n  barrier.write(0);\n}\n\nlong readCm() {\n  digitalWrite(TRIG, LOW); delayMicroseconds(2);\n  digitalWrite(TRIG, HIGH); delayMicroseconds(10);\n  digitalWrite(TRIG, LOW);\n  return pulseIn(ECHO, HIGH) / 58;\n}\n\nvoid loop() {\n  long d = readCm();\n  barrier.write(d < 15 ? 90 : 0);\n  delay(200);\n}`,
  challenge: "Добавь OLED: показывай дистанцию live. Бонус: зуммер при открытии.",
  assessment: "Барьер открывается < 15 см · код читается · схема повторяется без ошибок.",
};
