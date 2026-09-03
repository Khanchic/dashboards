# Prompts: Google Flow (Veo Production Engine)

## 🎯 Purpose & Standards
База проверенных промптов, кинематографических пайплайнов и сценариев для генерации 10-секундных видеороликов через **Google Flow (Veo)**.

* **Формат кадра**: Вертикальный `9:16` (Facebook Reels, Stories, Discord Highlights).
* **Хронометраж**: 10 секунд (Loop-ready, плавное зацикливание).
* **Стиль**: Кинематографичный 3D в эстетике Disney / Pixar Animation, теплое освещение Golden Hour, глубина резкости (shallow depth of field).

---

## 🏆 Кейс 1: Scarlet Sands (SCS) — Конкурс «Lucky Chest 3-Way Choice»

### 📁 Связанные файлы генераций:
* [Explorer_and_cat_open_chest_202609011629.mp4](file:///c:/Users/User.LT-PD-PROD-0073/Desktop/ANTIgravity%20+gemini/AI_LAB/Explorer_and_cat_open_chest_202609011629.mp4) — Тест №1 (базовое взаимодействие персонажей).
* [Explorer_and_mummy_opening_chest_202609011651.mp4](file:///c:/Users/User.LT-PD-PROD-0073/Desktop/ANTIgravity%20+gemini/AI_LAB/Explorer_and_mummy_opening_chest_202609011651.mp4) — Тест №2 (добавление мумии, выбор сундука, финал со смехом).

---

### ⚠️ Ошибки генерации и решения (Production Learnings):
1. **Проблема летающих букв («Hovering Letters»)**:
   * *Баг*: Термин *«hovering letters»* нейросеть трактует как парящие воздушные шарики. В тесте №2 буквы «A» и «C» улетели в небо при взрыве монет, а на правом сундуке появилась дублированная «C».
   * *Решение*: Запретить парение. Описывать буквы строго как **массивные латунные металлические таблички, намертво прибитые/прикрепленные к деревянным доскам сундука** (*«solid embossed golden metal letters firmly attached flat onto its front wooden plank»*).
2. **Композиция переднего плана**:
   * *Баг*: Если кот находится спереди или сбоку, он перекрывает сундуки и мешает четкому считыванию букв A, B, C.
   * *Решение*: **Поставить кота СЗАДИ среднего сундука (B)**. Кот опирается лапками на заднюю часть крышки и толкает её вперед, открывая фонтан монет навстречу камере. Передний план остается 100% чистым.
3. **Negative Prompt**:
   * Обязательно передавать стоп-слова для блокировки текста в воздухе и субтитров.

---

### 🎬 Финальный мастер-промпт (Lucky Chest — 9:16 Locked Camera):

```text
Vertical 9:16 framing, warm cinematic 3D Pixar-style animation. A fixed camera angle in a sun-drenched ancient Egyptian desert tomb excavation during golden hour. 

In the foreground on the red sand dunes sit three identical, equal-sized antique wooden treasure chests in a straight horizontal row. Each chest has a large, solid embossed golden metal letter firmly attached flat onto its front wooden plank: the letter "A" on the left chest, the letter "B" on the middle chest, and the letter "C" on the right chest (no floating letters, strictly solid metal plates attached to the chests).

Characters:
- On the left stands the young female explorer (auburn ponytail, green bandana, khaki safari vest).
- On the right stands the friendly cartoon mummy in black sunglasses.
- Standing directly behind the middle chest "B" is the cute orange tabby cat in a safari pith helmet, resting its front paws on the top lid of chest B.

0-2.5s: 9:16 vertical shot. The mummy in sunglasses gestures with open arms presenting chests A, B, and C. The explorer girl taps her chin, smiling thoughtfully as she looks at the chests. The cat peeks over the top of chest B curiously.

2.5-4.5s: The explorer girl confidently points her index finger at chest "B". The cat standing behind chest "B" pushes the lid open from behind with its paws.

4.5-7.5s: Chest "B" flips open wide! A brilliant radiant fountain of sparkling ancient gold coins, floating ruby gems, and glowing amber dust erupts forward into the air out of chest B. Chests A and C remain completely closed on the sand.

7.5-9.2s: Joyful celebration and laughter! The girl laughs with delight and claps her hands. The cool mummy throws its wrapped arms up in a victory cheer. The cat behind the chest purrs excitedly, peeking happily through the shower of falling gold coins.

9.2-10.0s: The sparkling coin shower settles softly into the red sand, all three chests A, B, and C remain clearly visible and grounded, and all characters smile warmly at the camera, ready to loop seamlessly.

Camera: Locked static vertical 9:16 framing, 35mm lens, shallow depth of field, warm sunset golden-hour lighting. Sound: Wooden lid creak and pop, grand magical coin explosion crescendo, joyful group laughter ambience, no spoken words, no speech bubbles, no subtitles, no floating text on screen.
```

### 🚫 Negative Prompt:
```text
floating letters, airborne alphabet, text in the sky, speech bubbles, subtitles, duplicate characters, blurry, 2D flat drawing, dark lighting, multiple cats, warped faces
```
