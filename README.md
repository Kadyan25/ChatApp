# ChatApp – Real-Time Chat with User Authentication

ChatApp is a full‑stack real‑time chat application that demonstrates secure user authentication, public chat rooms, private messaging, and online presence using a modern Java backend and a simple, responsive web UI [web:54][web:277].

---

## 1. Project Overview

The application allows users to:

- Register and log in with a unique username and email.
- Join public chat rooms and exchange messages in real time.
- Send private messages to specific users.
- View chat history for rooms and private conversations.
- See which users are currently online (simple in‑memory tracking).

The focus is on showcasing full‑stack skills: frontend (HTML/CSS/JS), backend (Spring Boot), relational database design (MySQL + JPA/Hibernate), REST APIs, real‑time communication with WebSockets, and secure authentication using JWT + Spring Security [web:54][web:62].

---

## 2. Tech Stack

### Backend

- Java 17+
- Spring Boot 3
  - Spring Web
  - Spring Security
  - Spring WebSocket (STOMP over SockJS)
  - Spring Data JPA
- MySQL (local profile) and H2 in‑memory (render profile)
- Hibernate / JPA for ORM
- JWT for stateless authentication and authorization [web:191][web:272]

### Frontend

- HTML5
- CSS3 (custom, responsive with Flexbox)
- Vanilla JavaScript (no framework)
- SockJS + STOMP for WebSocket communication [web:54][web:277]

### Infrastructure

- Maven for build and dependency management
- Docker for containerization
- Profiles via `SPRING_PROFILES_ACTIVE` for environment‑specific configuration (local vs render) [web:282][web:288]

---

## 3. Features and Architecture

### 3.1 User Interface (HTML/CSS/JS)

- **Login & Registration (`index.html`)**
  - Single page with sections for registration and login.
  - Simple tab‑like buttons switch between the two forms.
  - Shared stylesheet (`style.css`) for layout, typography, and responsive design.

- **Room Chat (`chat.html`)**
  - Sidebar: list of public rooms and a minimal “Private (debug)” area to send a private message by receiver userId.
  - Main area: shows current room name, message history, and message input at the bottom.
  - Responsive layout using flexbox; sidebar stacks above the chat area on smaller screens [web:63].

- **Private Chat (`private.html`)**
  - Dedicated UI for one‑to‑one conversations.
  - Sidebar: input for peer userId and “Load history” button, plus an online users section.
  - Main area: conversation header, message history, and input box for private messages.

The UI prioritizes clarity and basic responsiveness over advanced styling or animations [web:63][web:137].

### 3.2 Real-Time Messaging (WebSockets)

- WebSocket endpoint at `/ws` configured via Spring WebSocket with SockJS fallback.
- STOMP used as the messaging protocol:
  - Clients **send** messages to `/app/chat.send`.
  - Clients **subscribe** to:
    - `/topic/room.{roomId}` – public room broadcasts.
    - `/queue/user.{userId}` – private messages to individual users [web:13][web:277].
- Room and private messages are persisted in the database and delivered in real time to connected clients.

### 3.3 Backend Structure (Spring Boot)

Package‑level architecture:

- `entity` – JPA entities:
  - `User` – id, username, email, password (BCrypt hash), createdAt.
  - `ChatRoom` – id, name, type (`PUBLIC`, `PRIVATE`), createdAt.
  - `Message` – id, sender (User), optional receiver (User for private messages), optional room (ChatRoom), content, timestamp.
- `repository` – Spring Data JPA repositories:
  - `UserRepository` – `findByUsername`, `findByEmail`, `existsByUsername`, `existsByEmail`.
  - `ChatRoomRepository` – `findByType(ChatRoomType.PUBLIC)`.
  - `MessageRepository` – methods to fetch:
    - Room history ordered by timestamp.
    - Bidirectional private conversation between two users ordered by timestamp.
- `service` – business logic:
  - `UserService` – registration and authentication.
  - `ChatService` – room listing, message persistence, room/private history, user ID lookup.
- `controller` – REST and WebSocket controllers:
  - `AuthController` – `/api/auth/**` for register/login.
  - `ChatController` – `/api/rooms/**` for room and private histories, REST message send.
  - `ChatWebSocketController` – STOMP endpoints (`/app/chat.send`) for live messaging.
  - `UserController` – `/api/users/**` for current user info and online users.

This layered structure follows standard Spring Boot chat application patterns [web:54][web:289].

### 3.4 RESTful APIs

Key REST endpoints:

- **Auth**
  - `POST /api/auth/register` – user registration.
  - `POST /api/auth/login` – user login, returns JWT token and user info.

- **User**
  - `GET /api/users/me` – current user info, derived from JWT.
  - `GET /api/users/online` – IDs of users currently tracked as online by `OnlineUserTracker`.

- **Rooms & Messages**
  - `GET /api/rooms` – list of public chat rooms.
  - `GET /api/rooms/{roomId}/messages` – message history for a specific room.
  - `POST /api/rooms/messages` – send a message via REST (public or private depending on payload).
  - `GET /api/rooms/private/{otherUserId}/messages` – private conversation history between current user and another user.

All non‑auth API endpoints are protected by JWT‑based authentication [web:191][web:272].

### 3.5 Authentication & Authorization (JWT + Spring Security)

- Passwords are hashed with BCrypt (`PasswordEncoder`).
- On login, a JWT is generated containing:
  - Subject: user ID.
  - Claim: username.
  - Issued and expiration times.
- A custom `JwtAuthenticationFilter`:
  - Extracts the token from the `Authorization: Bearer <token>` header.
  - Validates the token and loads the corresponding user.
  - Populates `SecurityContext` with a `UsernamePasswordAuthenticationToken`.
- `SecurityConfig`:
  - Disables CSRF for simplicity.
  - Permits access to:
    - `/api/auth/**`
    - `/ws/**`
    - Static assets (`index.html`, `chat.html`, `private.html`, JS, CSS, images, `/webjars/**`, `/h2-console/**`).
  - Requires authentication for all other API endpoints.

This setup provides stateless authentication suitable for SPAs and WebSocket‑based UIs [web:193][web:208].

### 3.6 Database Design and JPA

- **Local profile (MySQL)**:
  - `spring.jpa.hibernate.ddl-auto=update` during development.
  - Messages and users persist across restarts.

- **Render profile (H2 in‑memory)**:
  - `ddl-auto=create` – schema created on each start.
  - `data.sql` seeds initial rooms (e.g., General, Random, TechTalk).
  - `spring.jpa.defer-datasource-initialization=true` ensures schema is created before `data.sql` runs [web:19][web:289].

Entities use standard JPA annotations and Lombok to reduce boilerplate (`@Entity`, `@Id`, `@GeneratedValue`, `@ManyToOne`, `@Getter`, `@Setter`, etc.) [web:84].

### 3.7 Online Users Tracking

- `OnlineUserTracker` uses an in‑memory concurrent `Set<Long>` to track which user IDs are currently connected.
- WebSocket STOMP connect/disconnect events are used to mark users online/offline (via headers containing the JWT).
- `/api/users/online` returns the current set of online user IDs for use in the UI.

This provides a simple presence mechanism appropriate for demos and small deployments [web:233][web:236].

---

## 4. Setup & Running

### 4.1 Prerequisites

- Java 17+
- Maven
- MySQL running locally (for `local` profile) or access to a MySQL instance

### 4.2 Local Run with MySQL (`local` profile)

1. **Create database** (example):

CREATE DATABASE ChatApp;

text

2. **Configure `application.yml`** (local section) with your MySQL credentials:

spring:
datasource:
url: jdbc:mysql://localhost:3306/ChatApp?createDatabaseIfNotExist=true
username: your_mysql_user
password: your_mysql_password
driver-class-name: com.mysql.cj.jdbc.Driver

text
 jpa:
   hibernate:
     ddl-auto: update
   show-sql: true
   properties:
     hibernate:
       format_sql: true
text

3. **Build and run**:

mvn clean package -DskipTests
java -jar target/ChatApp-0.0.1-SNAPSHOT.jar

text

4. **Use the app**:

- Open `http://localhost:8080/index.html`.
- Register a new user, then log in.
- After login, you are redirected to `chat.html`:
  - Select a public room, send messages.
  - Use the “Private (debug)” section to send a private message by entering another user’s numeric userId.

### 4.3 Running with Docker

1. **Build JAR and Docker image**:

mvn clean package -DskipTests
docker build -t kadyan25/chatapp:latest .

text

2. **Run container**:

- With MySQL (`local` profile, assuming DB is reachable):

  ```
  docker run -p 8080:8080 kadyan25/chatapp:latest
  ```

- With H2 (`render` profile, in‑memory DB):

  ```
  docker run -e "SPRING_PROFILES_ACTIVE=render" -p 8080:8080 kadyan25/chatapp:latest
  ```

3. **Access the UI**:

- `http://localhost:8080/index.html` – auth.
- `http://localhost:8080/chat.html` – rooms.
- `http://localhost:8080/private.html` – private chat.

---

## 5. Assumptions & Simplifications

- **Protocol & config**
- Local development uses plain HTTP on `localhost`.
- JWT secret and related values are stored in application configuration for simplicity; in production they should come from environment variables or a secrets manager [web:191].

- **Error handling**
- Error responses are mostly generic, using default Spring error formats.
- No custom error pages or localization are implemented.

- **Private messaging model**
- Private messages are represented as `Message` entities with sender and receiver set, and room typically left null.
- The private messaging UI in `chat.html` is a minimal debug helper; the main private experience is on `private.html`.

- **Online status**
- Online users are tracked only in memory, identified by numeric user IDs.
- Persistence of online status and advanced presence states (idle/away) are not implemented [web:233].

- **Frontend scope**
- Plain HTML, CSS, and vanilla JS; no frontend frameworks or component libraries.
- Design focuses on clarity and readability rather than advanced animations or themes.

- **Testing**
- Manual testing is used to verify flows: registration, login, room chat, private chat, and history.
- Automated tests (unit/integration) are not included in this version [web:252].

---