Chat Application with User Authentication
This project is a full-stack real-time chat application .It implements secure user authentication, public chat rooms, and private messaging, using a modern Java backend and a simple, responsive web UI.
 
1. Project Overview
The application allows users to:
•	Register and log in with a unique username and email.
•	Join public chat rooms and exchange messages in real time.
•	Send private messages to specific users.
•	View chat history for rooms and private conversations.
The focus is on demonstrating full-stack skills: frontend (HTML/CSS/JS), backend (Spring Boot), database design (MySQL + JPA/Hibernate), REST APIs, real-time communication with WebSockets, and secure authentication using JWT + Spring Security.
 
2. Tech Stack
Backend
•	Java 17+
•	Spring Boot 3 (Web, Security, WebSocket, Spring Data JPA)
•	MySQL as relational database
•	Hibernate / JPA for ORM
•	JWT for stateless authentication and authorization
Frontend
•	HTML5
•	CSS3 (custom, responsive with Flexbox)
•	Vanilla JavaScript (no framework)
•	SockJS + STOMP for WebSocket communication
 
3. Features vs Assignment Requirements
Below is how this project maps to the internship assignment points.

3.1 User Interface (HTML/CSS/JS)
•	Login & Registration Page (index.html)
o	Contains separate sections for registration and login, with simple tab-like buttons to switch between them.
o	Uses clean HTML forms, semantic labels, and a shared stylesheet (style.css) for layout and styling.
•	Chat Page (chat.html)
o	Layout split into sidebar (room list + private message section) and main chat area (current room title, history, message input).
o	Responsive design using CSS flexbox and media queries; adjusts to smaller screens by stacking sections vertically.


3.2 Responsive and Accessible Design
•	Uses a centered card-style container with clear typography and contrast.
•	Layout degrades gracefully on smaller screens using media queries (sidebar moves above chat area).
•	Basic accessibility practices: label–input pairs, consistent font size, and no complex custom widgets.


3.3 Real-Time Messaging (WebSockets)
•	Real-time communication implemented using Spring WebSocket with STOMP.
•	Server exposes a STOMP endpoint at /ws.
•	Clients connect using SockJS + STOMP and:
o	Send messages to /app/chat.send.
o	Subscribe to /topic/room.{roomId} for public room updates.
o	Subscribe to /queue/user.{userId} for private messages.


3.4 Server-Side Logic (Java + Spring Boot)
•	Backend built on Spring Boot with layered architecture:
o	entity for JPA entities (User, ChatRoom, Message).
o	repository for Spring Data JPA repositories.
o	service for business logic (auth, chat, message handling).
o	controller for REST endpoints and WebSocket controllers.


3.5 RESTful APIs
Key REST endpoints:
•	Auth
o	POST /api/auth/register – user registration.
o	POST /api/auth/login – user login, returns JWT token and user info.
•	User
o	GET /api/users/me – current user info (JWT-protected).
o	GET /api/users/online – returns IDs of users marked as online (simple tracker).
•	Rooms & Messages
o	GET /api/rooms – list of chat rooms (public and, internally, private if used).
o	GET /api/rooms/{roomId}/messages – history for a specific room.
o	POST /api/rooms/messages – send a message via REST (stored and then can be fetched).
o	GET /api/rooms/private/{otherUserId}/messages – 1‑to‑1 conversation history between current user and another user.


3.6 Authentication & Authorization (JWT + Spring Security)
•	User passwords are hashed using BCrypt (PasswordEncoder).
•	On login, a JWT token is generated containing user id and username, with a finite expiration time.
•	Spring Security is configured with a stateless SecurityFilterChain and a custom JwtAuthenticationFilter that:
o	Extracts token from Authorization: Bearer <token>.
o	Validates token and sets the authentication in the security context.
•	REST APIs under /api/** (except /api/auth/** and static assets) require a valid JWT.


3.7 Relational Database Design (MySQL)
Entities and schema:
•	User
o	id, username, email, password, createdAt.
•	ChatRoom
o	id, name, type (PUBLIC, PRIVATE), createdAt.
•	Message
o	id, sender (FK to User), receiver (FK to User, nullable for public), room (FK to ChatRoom or nullable depending on configuration), content, timestamp.
The schema is created/updated via JPA/Hibernate (ddl-auto=update) during development.


3.8 JPA / Hibernate Usage
•	Repositories use Spring Data JPA interfaces, e.g.:
o	UserRepository with findByUsername, existsByEmail, etc.
o	MessageRepository with methods for fetching room history and user-to-user history (ordered by timestamp).
•	Entities use standard JPA annotations (@Entity, @Id, @GeneratedValue, @ManyToOne, etc.) and Lombok to reduce boilerplate.
3.9 Real-Time Notifications / In-App Alerts
•	Real-time “notification” behavior is provided via WebSocket subscriptions:
o	When a new message arrives in a room, all clients subscribed to that room’s topic immediately see the update in the chat area.
o	When a new private message is sent, both the sender and receiver get it in their personal queues (subscribed at /queue/user.{userId}).
3.10 Data Security
•	Passwords are hashed with BCrypt; plain passwords are never stored.
•	All authenticated API calls use JWT, and access to protected endpoints is controlled by Spring Security.
•	For deployment, the app is intended to run behind HTTPS so WebSocket and REST traffic are encrypted in transit (this is mentioned as a recommendation in documentation; local dev uses HTTP).
 


5. Setup & Running Locally
4.1 Prerequisites
•	Java 17+
•	Maven
•	MySQL running locally (or accessible connection)

4.2 Database Setup
1.	Create a database:
CREATE DATABASE chat_app;
2.	Update application.yml (or application.properties) to match your MySQL credentials:
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chat_app
    username: your_mysql_user
    password: your_mysql_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

4.3 Run the Application

  mvn spring-boot:run

The app will start on http://localhost:8080.



4.4 Using the App
•	Open http://localhost:8080/index.html in a browser.
•	Register a new user, then log in.
•	On successful login, you are redirected to chat.html.
•	On chat.html:
o	Select a room from the room list (pre-seeded rooms can be inserted via SQL or created via code).
o	Type messages in the main input to send public messages to that room.
o	Use the “Private (debug)” section: enter another user’s userId and send a private message (visible only to the sender and receiver).
 


5. Assumptions & Simplifications
   
Protocol and environment

The application is developed and run over plain HTTP on localhost for this assignment.
The JWT secret and other configuration values are kept directly in application config files for simplicity.

Error handling

Error responses are simple, mostly using generic messages and default Spring error formats.
Detailed error codes, localization, and custom error pages are not implemented.

Private messaging and rooms

Private messages are modeled as messages with a sender and a receiver; the room field for these messages may be null or mapped in a simple way, and is not used to distinguish different private conversations.
The private messaging UI uses a minimal “debug” style, where the user enters the numeric userId of the receiver manually.

Online users tracking

Online users are tracked in memory only, using an OnlineUserTracker component, and are identified by their numeric user IDs.
Persistence of online status or advanced status handling (idle/away) is not implemented.

Frontend scope

The frontend uses only plain HTML, CSS, and vanilla JavaScript, without any frameworks.
UI focuses on clarity and basic responsiveness rather than on advanced design or animations.

Testing

Manual testing is used to verify flows such as registration, login, public chat, private chat, and message history.
Automated tests (unit/integration) are not included in this version.

