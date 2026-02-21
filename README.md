# ChatApp

A real-time chat application built with Spring Boot and vanilla HTML/CSS/JS.

## Features

- JWT-based authentication (register + login)
- Public room chat over WebSocket/STOMP
- Private one-to-one chat by selecting a user
- Online/offline user presence in private chat
- Search in room list and user list
- Unread badges for rooms and private conversations
- Mobile-first responsive UI with sidebar drawers
- Optimistic message rendering
- Logout action in authenticated pages (`chat.html`, `private.html`)

## Tech Stack

### Backend

- Java 17
- Spring Boot 3
- Spring Web
- Spring Security
- Spring WebSocket (SockJS + STOMP)
- Spring Data JPA
- MySQL (local profile)
- H2 in-memory DB (render profile)

### Frontend

- HTML
- CSS
- Vanilla JavaScript

## Project Structure

- `src/main/java/com/example/ChatApp/controller` - REST + WebSocket controllers
- `src/main/java/com/example/ChatApp/service` - business logic
- `src/main/java/com/example/ChatApp/repository` - JPA repositories
- `src/main/java/com/example/ChatApp/entity` - database entities
- `src/main/resources/static` - frontend pages/assets
- `src/main/resources/application.yaml` - profile config

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Rooms and Messages

- `GET /api/rooms`
- `GET /api/rooms/{roomId}/messages`
- `GET /api/rooms/private/{otherUserId}/messages`
- `POST /api/rooms/messages` (REST send, optional path)

### Users

- `GET /api/users/me`
- `GET /api/users/online`
- `GET /api/users/presence` (list users with `online` status)

## WebSocket

- Endpoint: `/ws`
- Client send destination: `/app/chat.send`
- Public room topic: `/topic/room.{roomId}`
- Private queue: `/queue/user.{userId}`

## UI Flow

### Auth page (`index.html`)

- Shows one form at a time:
  - Login form by default
  - Register form via link
- Register form includes link back to login
- Login form includes link to register

### Room chat (`chat.html`)

- Room list with search and unread badges
- Real-time room messages
- Button to open private chat page
- Logout button in top bar

### Private chat (`private.html`)

- User list with online/offline status
- User search and unread badges
- Select a user to load/send private messages
- Logout button in top bar

## Run Locally

### Option 1: Run with local profile (MySQL)

1. Ensure MySQL is running and `application.yaml` credentials are valid.
2. Start the app:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

### Option 2: Run with render profile (H2 in-memory)

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=render"
```

Open:

- `http://localhost:8080/index.html`

## Build and Test

```powershell
.\mvnw.cmd -q test
.\mvnw.cmd clean package
```

## Manual Test Checklist

1. Login/register works with form switching links.
2. Room messages appear instantly on send.
3. Private messages appear instantly on send.
4. Room unread badges increase when inactive rooms receive messages.
5. Private unread badges increase when non-active users send messages.
6. User presence updates online/offline across two browser sessions.
7. Logout from chat/private clears session and returns to auth page.

## Notes

- Presence tracking is in-memory (not distributed across multiple app instances).
- JWT secret and DB credentials are currently configured in code/config for local development.
