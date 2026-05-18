# ChatApp — Пълно ръководство за защита

## Кратко описание на проекта

ChatApp е уеб базирано приложение за обмен на съобщения в реално време (instant messenger), подобно на Discord или Slack. Потребителите могат да се регистрират, да влизат в канали и да изпращат текстови съобщения, снимки и файлове. Всичко се случва без презареждане на страницата — чрез WebSocket технология.

---

## Архитектура (как е наредено)

```
┌─────────────────────┐         ┌─────────────────────┐         ┌──────────────┐
│      FRONTEND        │  HTTP/  │       BACKEND        │  SQL   │   DATABASE   │
│   React + Vite       │◄──WS──►│  Express + Socket.io │◄──────►│  PostgreSQL  │
│   (порт 5173)        │         │    (порт 3001)        │         │  (Supabase)  │
└─────────────────────┘         └─────────────────────┘         └──────────────┘
```

**Frontend** — това, което потребителят вижда. Написано с React.  
**Backend** — сървърът, който обработва логиката. Написан с Node.js/Express.  
**Database** — съхранява данните (потребители, канали, съобщения).

---

## Използвани технологии

### Frontend (папка `/frontend`)
| Технология | Версия | За какво се използва |
|---|---|---|
| **React** | 19 | Изграждане на потребителски интерфейс с компоненти |
| **TypeScript** | 5 | JavaScript с типове — по-малко грешки |
| **Vite** | 6 | Dev сървър и build инструмент |
| **Tailwind CSS** | v4 | CSS utility класове за стилизиране |
| **Socket.io-client** | 4 | WebSocket връзка към сървъра за real-time |
| **emoji-picker-react** | 4 | Готов компонент за избор на emoji |
| **lucide-react** | latest | SVG икони |

### Backend (папка `/backend`)
| Технология | Версия | За какво се използва |
|---|---|---|
| **Node.js** | 20+ | JavaScript на сървъра |
| **Express** | 5 | HTTP сървър и REST API |
| **Socket.io** | 4 | WebSocket сървър за real-time съобщения |
| **Prisma** | 7.8 | ORM — работа с базата данни чрез TypeScript |
| **PostgreSQL** | - | Релационна база данни |
| **bcrypt** | - | Хеширане на пароли (безопасно съхранение) |
| **jsonwebtoken** | - | JWT токени за удостоверяване |
| **multer** | - | Обработка на качени файлове |
| **dotenv** | - | Четене на конфигурационни переменливи от .env |

---

## База данни — модели (schema.prisma)

Базата данни има 3 таблици:

### User (потребители)
```
id          — уникален UUID идентификатор
username    — потребителско име (уникално)
password    — bcrypt хеш на паролата
passwordKey — SHA-256 хеш (предотвратява дублирани пароли)
avatar      — URL на аватара (незадължително)
messages    — връзка към съобщенията на потребителя
createdAt   — кога е създаден акаунтът
```

### Channel (канали)
```
id          — уникален UUID идентификатор
name        — название на канала (например: general, random)
description — описание на канала (незадължително)
messages    — всички съобщения в канала
createdAt   — кога е създаден каналът
```

### Message (съобщения)
```
id        — уникален UUID идентификатор
text      — текст на съобщението
fileUrl   — URL на качен файл (незадължително)
fileName  — оригинално название на файла (незадължително)
fileType  — тип: "image" или "file" (незадължително)
senderId  — кой е изпратил (връзка към User)
channelId — в кой канал е (връзка към Channel)
createdAt — кога е изпратено
```

**Релации:** Един потребител може да има много съобщения. Един канал съдържа много съобщения. Всяко съобщение принадлежи на точно един потребител и точно един канал.

---

## API Endpoints (HTTP заявки)

### Автентикация
```
POST /api/auth/register    — регистрация на нов потребител
POST /api/auth/login       — вход в акаунта
```

### Канали и съобщения
```
GET  /api/channels                        — списък с всички канали
GET  /api/channels/:name/messages         — всички съобщения в канал
DELETE /api/messages/:messageId           — изтриване на съобщение
```

### Файлове
```
POST /api/upload                          — качване на файл
```

---

## Socket.io Events (реално-временни съобщения)

| Event | Посока | Описание |
|---|---|---|
| `join_channel` | клиент → сървър | Влизане в канал (след connect) |
| `send_message` | клиент → сървър | Изпращане на ново съобщение |
| `receive_message` | сървър → клиент | Получаване на ново съобщение |
| `message_deleted` | сървър → клиент | Уведомление за изтрито съобщение |

---

## Функционалности — детайлно обяснение

---

### 1. Регистрация и вход (Authentication)

**Как работи:**
1. Потребителят попълва потребителско име и парола в `LoginModal`
2. Паролата НИКОГА не се записва директно — минава през **bcrypt** (алгоритъм за хеширане)
3. Bcrypt добавя случайна "сол" (salt) и хешира → дори еднакви пароли изглеждат различно в базата
4. При успешен вход сървърът генерира **JWT токен** и го изпраща обратно
5. Токенът се записва в `localStorage` на браузъра

**JWT (JSON Web Token):**
- Структура: `header.payload.signature` (кодиран в Base64)
- Payload съдържа: `{ userId, username, iat, exp }`
- Сървърът подписва токена с тайния ключ (`JWT_SECRET`)
- При следваща заявка клиентът изпраща токена → сървърът го верифицира без да пита базата

**passwordKey:**
- Допълнителна защита — SHA-256 хеш на паролата
- Уникален в базата → не могат двама потребители да имат еднаква парола
- Предотвратява слаби пароли, използвани от много хора

**Код (LoginModal.tsx):**
```typescript
// Изпращаме username + password към сървъра
const res = await fetch(`${VITE_API_URL}/api/auth/login`, {
  method: 'POST',
  body: JSON.stringify({ username, password })
});
const { token, ...user } = await res.json();
localStorage.setItem('messenger_token', token);
localStorage.setItem('messenger_user', JSON.stringify(user));
```

---

### 2. Real-time съобщения (WebSocket / Socket.io)

**Защо не е просто HTTP?**
- При обикновен HTTP клиентът трябва постоянно да пита сървъра "има ли нови съобщения?" (polling)
- WebSocket отваря постоянна двупосочна връзка — сървърът може сам да "бутне" данни към клиента
- Резултат: съобщенията се появяват моментално без забавяне

**Как работи:**
1. При отваряне на канал, frontend се свързва към Socket.io сървъра
2. Emit `join_channel` с `channelId` → сървърът добавя socket-а в "стая" (room)
3. При изпращане на съобщение → emit `send_message` с данните
4. Сървърът записва в базата данни и emit `receive_message` към всички в стаята
5. Всеки клиент в канала получава съобщението и го добавя към списъка

**Код (ChatWindow.tsx):**
```typescript
const socket = io(VITE_API_URL);
socket.on('connect', () => socket.emit('join_channel', channel.id));
socket.on('receive_message', (newMessage) => {
  setMessages(prev => [...prev, newMessage]);
});
// При изпращане:
socket.emit('send_message', { channelId, senderId, text });
```

---

### 3. Качване на файлове (File Upload)

**Как работи:**
1. Потребителят натиска иконата кламер (📎) и избира файл
2. Файлът се показва като preview преди изпращане (за снимки — thumbnail)
3. При натискане "изпрати", файлът се качва чрез `POST /api/upload` (multipart/form-data)
4. Сървърът го записва в папка `/uploads` на диска чрез **multer**
5. Backend връща `fileUrl`, `fileName`, `fileType`
6. Тези данни се включват в Socket.io `send_message` event-а
7. Получателят вижда снимката или линк към файла директно в чата

**Multer (backend):**
```typescript
const storage = multer.diskStorage({
  destination: uploadsDir,  // папка uploads/
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB лимит
```

**Поддържани формати:** снимки (image/*), PDF, Word документи, TXT, ZIP

---

### 4. Emoji Picker

**Как работи:**
1. Натискане на иконата 😊 отваря `EmojiPicker` компонент
2. При избор на emoji → добавя се към текста в input полето
3. Picker-ът се затваря автоматично

**Компонент:**
```typescript
import EmojiPicker, { Theme } from 'emoji-picker-react';
<EmojiPicker
  onEmojiClick={(emojiData) => setInputValue(prev => prev + emojiData.emoji)}
  theme={Theme.LIGHT}
  width={320}
  height={400}
/>
```

**Emoji-only съобщения:** Ако съобщението съдържа само emoji символи (без обикновен текст), те се показват като голям текст (font-size: 3rem / text-5xl) без балон около тях — по-естетично.

---

### 5. Изтриване на съобщения

**Как работи:**
1. При hover върху съобщение се появява бутон с 3 точки (⋮)
2. Натискане отваря меню с "Copy" и "Delete" (Delete само за собствени съобщения)
3. При натискане "Delete" → **Optimistic UI update**: съобщението веднага изчезва от екрана
4. Едновременно се изпраща `DELETE /api/messages/:id` към backend
5. Backend верифицира, че `senderId` съвпада и изтрива от базата
6. Socket.io `message_deleted` уведомява всички останали в канала да премахнат съобщението

**Защо Optimistic UI?**
- Потребителят веднага вижда резултата без да чака сървъра (~0ms усещане)
- Ако сървърът върне грешка, може да се върне обратно (rollback)

```typescript
// Optimistic — веднага премахваме от state
setMessages(prev => prev.filter(m => m.id !== messageId));
// После изпращаме към сървъра
await fetch(`/api/messages/${messageId}`, { method: 'DELETE', ... });
```

---

### 6. Копиране на съобщения

При натискане "Copy" от контекстното меню (3 точки):
1. `navigator.clipboard.writeText(text)` копира в клипборда
2. Иконата се сменя на ✓ (Check) и текста на "Copied!" за 1 секунда
3. Менюто се затваря автоматично

---

### 7. Търсене в канал

**Как работи:**
1. Натискане на иконата лупа в хедъра показва search input
2. При въвеждане на текст → всички съобщения се filtrират
3. Съвпадащите части се маркират с цветен highlight (`<mark>` елемент)
4. Показва се броячът "1/5", "2/5" и т.н.
5. Стрелките нагоре/надолу (ChevronUp/ChevronDown) навигират между съвпаденията
6. Активното съвпадение се маркира по-ярко (amber/оранжево) и страницата scroll-ва до него

```typescript
const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
// Маркиране на съвпадащия текст с <mark>
```

---

## Компоненти — обяснение

### `App.tsx`
- Главен компонент — управлява цялото приложение
- Съхранява текущия потребител (`user`) и активния канал (`activeChannel`)
- Зарежда каналите от API при стартиране
- Показва `LoginModal` ако потребителят не е влязъл
- Рендерира `Sidebar` + `ChatWindow`

### `LoginModal.tsx`
- Форма за вход/регистрация
- Два режима: `login` и `register` (превключват с един бутон)
- Валидация: непразни полета, парола мин. 6 символа, паролите да съвпадат
- При успех записва user + token в localStorage

### `Sidebar.tsx`
- Показва списъка с канали
- Маркира активния канал
- Показва информация за текущия потребител (потребителско име, аватар)
- Бутон за изход с confirmation диалог ("Are you sure?")

### `ChatWindow.tsx`
- Основният компонент — показва съобщенията в канала
- Управлява WebSocket връзката чрез Socket.io
- Зарежда историята на съобщенията от API при смяна на канала
- Съдържа всички функции: изпращане, файлове, emoji, търсене, изтриване
- Автоматично скролва до последното съобщение при нови съобщения

### `MessageBubble.tsx`
- Един балон с едно съобщение
- Различен вид за собствени (вдясно) и чужди (вляво) съобщения
- Показва: текст, снимка, файл линк, или emoji (в зависимост от типа)
- Хover меню с Copy и Delete действия
- Highlight на намерения текст при търсене

---

## Стилизиране (Tailwind CSS v4)

Проектът използва **custom цветова палитра** дефинирана в `index.css`:

| Цвят | Стойност | Използва се за |
|---|---|---|
| `--color-surface` | #fcfcfb | фон на балоните (бял) |
| `--color-background` | #f4f3ee | фон на приложението |
| `--color-primary` | #534b52 | акцентен цвят (бутони) |
| `--color-border` | #e0ddcf | рамки |
| `--color-text-main` | #0e0d0e | основен текст |
| `--color-text-muted` | #6c676d | второстепенен текст |

Класът `telegram-bg` добавя деликатен SVG pattern върху фона на чата (подобно на Telegram).

Дизайнът е **pill/rounded** — почти всичко е с `rounded-full` или `rounded-[2rem]` за меки ъгли.

---

## Как се стартира приложението

```bash
# 1. Стартиране на backend
cd backend
npm install
npm run dev       # слуша на порт 3001

# 2. Стартиране на frontend (в отделен терминал)
cd frontend
npm install
npm run dev       # слуша на порт 5173

# 3. Отваряне в браузър
http://localhost:5173
```

### Необходим .env файл в /backend:
```
DATABASE_URL="postgresql://..."
JWT_SECRET="supersecretjwtkey2026instantmessenger"
PORT=3001
```

---

## Поток на данни — пример с изпращане на съобщение

```
Потребителят пише "Здравей!" и натиска Send
         │
         ▼
ChatWindow.handleSendMessage()
  → socket.emit('send_message', { channelId, senderId, text: "Здравей!" })
         │
         ▼  (WebSocket)
Backend socket.on('send_message')
  → prisma.message.create({ data: { text, senderId, channelId } })
  → io.to(channelId).emit('receive_message', savedMessage)
         │
         ▼  (WebSocket broadcast)
Всички клиенти в канала
  → socket.on('receive_message', newMessage)
  → setMessages(prev => [...prev, newMessage])
  → React ре-рендерира → съобщението се появява в чата
```

---

## Поток на данни — регистрация

```
Потребителят попълва username + password → Register
         │
         ▼
POST /api/auth/register
  → SHA-256(password) → проверка за uniqueness (дали паролата вече се използва)
  → bcrypt.hash(password, 10) → password hash
  → prisma.user.create({ username, password: hash, passwordKey })
  → jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' })
  → response: { id, username, token }
         │
         ▼
Frontend
  → localStorage.setItem('messenger_token', token)
  → localStorage.setItem('messenger_user', JSON.stringify(user))
  → setUser(user) → LoginModal се затваря → приложението се зарежда
```

---

## Сигурност

| Мярка | Обяснение |
|---|---|
| **Bcrypt пароли** | Паролите са хеширани с salt — дори при изтичане на базата, паролите не могат да се прочетат |
| **JWT токени** | Краткотрайни токени (7 дни) вместо session cookies — stateless автентикация |
| **senderId верификация** | При изтриване сървърът проверява, че `senderId` от заявката съвпада с автора на съобщението |
| **SQL Injection защита** | Prisma ORM използва prepared statements — потребителски вход никога не е директно в SQL |
| **File type validation** | Multer приема само определени MIME types и разширения |
| **10MB файлов лимит** | Защита срещу DoS чрез огромни файлове |

---

## Честни въпроси при защита

**В: Защо избрахте WebSocket вместо REST API за съобщенията?**  
О: REST изисква polling (постоянно питане на сървъра), което е бавно и натоварва сървъра. WebSocket осигурява двупосочна push комуникация — съобщенията пристигат моментално при всички потребители без unnecessary заявки.

**В: Как е гарантирана сигурността на паролите?**  
О: Паролите се хешират с bcrypt преди запис в базата. Bcrypt добавя уникален salt към всяка парола, така че дори еднакви пароли дават различни хешове. При вход bcrypt.compare() проверява хеша без да разшифрова оригиналната парола.

**В: Какво е JWT и защо го използвате?**  
О: JSON Web Token е подписан токен, съдържащ информация за потребителя. Сървърът подписва токена с таен ключ — при всяка заявка проверява подписа без да пита базата данни. Това прави удостоверяването по-бързо и scalable.

**В: Какво е Prisma ORM?**  
О: Prisma е инструмент, позволяващ ни да работим с базата данни чрез TypeScript код вместо директен SQL. Дефинираме моделите в schema.prisma файл, и Prisma генерира типизиран клиент. Предотвратява SQL injection автоматично.

**В: Как работи real-time функционалността при множество канали?**  
О: Socket.io организира връзките в "rooms" (стаи). При влизане в канал, socket-ът се добавя в room с id на канала. При emit `receive_message`, сървърът го изпраща само до room-а на канала — само хора, гледащи него, го получават.

**В: Какво е Optimistic UI и защо го използвате?**  
О: Optimistic UI означава, че интерфейсът се актуализира веднага (без да чака сървъра). При изтриване — съобщението изчезва мигновено, след което изпращаме DELETE заявката. Ако сървърът върне грешка, показваме съобщението обратно. Прави приложението да се чувства по-бързо.

**В: Защо PostgreSQL, а не MongoDB?**  
О: Данните имат ясни релации (потребители → съобщения → канали), което е идеално за релационна база. PostgreSQL осигурява ACID транзакции и referential integrity — ако изтрием потребител, можем да каскадно изтрием съобщенията му.

**В: Какво е Supabase?**  
О: Supabase е managed PostgreSQL услуга в облака (хостинг на базата данни). Не трябва да инсталираме и управляваме PostgreSQL сами — получаваме connection string и базата е достъпна от всякъде.

---

## Речник на термините

| Термин | Обяснение |
|---|---|
| **API** | Application Programming Interface — набор от endpoints, чрез които frontend говори с backend |
| **REST API** | Архитектурен стил — HTTP методи (GET, POST, DELETE) за CRUD операции |
| **WebSocket** | Протокол за постоянна двупосочна TCP връзка между клиент и сървър |
| **Socket.io** | Библиотека, обвиваща WebSocket с допълнителни функции (rooms, reconnect, fallback) |
| **JWT** | JSON Web Token — криптографски подписан токен за автентикация |
| **bcrypt** | Алгоритъм за хеширане на пароли, устойчив на brute-force |
| **ORM** | Object-Relational Mapper — работа с SQL база чрез обектно-ориентиран код |
| **Prisma** | TypeScript ORM за Node.js |
| **React** | JavaScript библиотека за изграждане на потребителски интерфейси чрез компоненти |
| **State** | Данни, съхранявани в React компонент, чиято промяна предизвиква ре-рендериране |
| **Hook** | Специална React функция (useState, useEffect) за работа с state и lifecycle |
| **TypeScript** | Надстройка на JavaScript с типове — открива грешки по време на разработка |
| **Vite** | Бърз build инструмент за frontend проекти |
| **Tailwind CSS** | CSS framework с utility класове директно в HTML/JSX |
| **Multer** | Node.js middleware за обработка на multipart/form-data (file upload) |
| **Optimistic UI** | UI се актуализира веднага, без да чака потвърждение от сървъра |
| **Hash** | Еднопосочна функция — трансформира данни в фиксиран стринг, необратимо |
| **Salt** | Случайна стойност, добавена преди хеширане, за да са различни хешовете |
| **CORS** | Cross-Origin Resource Sharing — сигурностна политика на браузъра за заявки между домейни |
| **Middleware** | Функция, изпълнявана между получаването на заявката и изпращането на отговора |
