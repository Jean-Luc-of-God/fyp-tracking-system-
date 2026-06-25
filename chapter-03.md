## CHAPTER 3

## REQUIREMENT ANALYSIS AND DESIGN OF THE NEW SYSTEM

### Introduction

Developing an effective, data-driven solution to address operational inefficiencies requires a comprehensive approach to both system analysis and design. This process can be likened to building a strong foundation, which is essential for creating a resilient and functional framework. System analysis and system design serve as the fundamental pillars of the system development life cycle, guiding the project from understanding needs to delivering a working solution.

System analysis involves systematically gathering and evaluating user requirements, identifying challenges, and breaking down the system into core components. The primary goal is to fully understand the system's objectives and ensure that the proposed solution effectively resolves identified inefficiencies in final year project management. By thoroughly analyzing these challenges, the system's overall performance and functionality are enhanced, ensuring all components work seamlessly together toward achieving the platform's goals. This phase also helps prioritize features based on user needs and technical feasibility, laying the groundwork for successful implementation.

Conversely, system design focuses on defining the structure, architecture, components, and interactions necessary to meet the system requirements identified during analysis. It builds on the insights gathered to fill gaps and address unmet needs, producing detailed specifications that clarify both functional and operational aspects of the FYP Tracking & Accountability System. The main objective of system design is to establish clear methods and strategies to achieve the desired system outcomes. A well-executed design phase ensures the platform is scalable, maintainable, and adaptable to evolving technologies and user demands, ultimately leading to a more robust and user-centric final year project management system.

### Description of the New System

The FYP Tracking & Accountability System is a comprehensive digital project-management platform designed to address operational inefficiencies in traditional final year project administration through a data-driven, user-centered approach. By integrating state tracking, supervision management, proposal-attempt recording, and panel coordination modules, the system enables precise oversight and automated administrative processes that optimize departmental operations while strengthening accountability. Built on a modular and scalable architecture, the FYP Tracking & Accountability System supports transparent management by adapting to varying operational scales and user requirements.

Unified Modeling Language (UML) diagrams are used to visually represent system components, user interactions, and data flows, ensuring clear communication among developers, stakeholders, and end-users throughout the development process. The system's design emphasizes intuitive user interfaces for all roles, ensuring accessibility for users with varying levels of technical expertise. Through its integrated approach, the platform provides a complete solution that transforms traditional final year project operations into modern, efficient, and transparent digital processes.

##### Unified Modeling Language (UML)

In research projects involving the development and implementation of technological systems such as the FYP Tracking & Accountability System it is crucial to communicate system functionality in a clear and structured manner. One of the most effective ways to achieve this is through the use of Unified Modeling Language (UML). UML is a standardized visual modeling language that facilitates the design, documentation, and analysis of system components, user interactions, and data flows. It is widely adopted in software and systems engineering to provide a structured representation of how a system is constructed and operates.

##### Benefits of Using UML in Software Development

In the development of a digital final year project management system for efficient academic operations, various stakeholders, system components, and processes must work together seamlessly to record, process, and respond to operational data. Unified Modeling Language (UML) plays a crucial role in this process by providing clear visual representations of the system architecture and workflows. First, UML diagrams help clarify project requirements and establish well-defined system boundaries, ensuring the final solution remains aligned with its core objectives of operational efficiency and accountability.

Beyond planning, these diagrams serve as valuable technical documentation that demonstrates rigorous system design, adding credibility and professionalism to research publications and project reports. Additionally, UML acts as a universal communication tool that bridges understanding between developers, departmental staff, and project supervisors, enabling more productive discussions about system features, design choices, and implementation strategies.

By standardizing how system elements like the state-tracking engine, supervision module, and notification system interact, UML facilitates efficient collaboration while reducing potential misunderstandings throughout the development lifecycle. The use of UML in the FYP Tracking & Accountability System project ensures that all stakeholders share a common understanding of the system's structure and behavior, leading to more accurate implementation and easier maintenance of the final product.

#### Use Case Diagram

Use case diagrams are visual tools within UML that illustrate the interactions between a system and its external environment, capturing the essential business requirements for system operation. These diagrams represent a business entity or software system, its external stakeholders (known as actors), and a set of tasks (use cases) that users are expected or authorized to perform when interacting with the system. They are particularly useful for defining the system's functionality from the viewpoint of its users.

By providing a clear, concise overview of how users interact with the system, use case diagrams help both developers and stakeholders better understand the system requirements. Additionally, they serve as an effective communication tool, allowing project teams to visually map out the roles and actions involved in achieving system goals.

The four elements of a use case diagram are:

System: The FYP Tracking & Accountability System boundary

Actors: External entities interacting with the system (Student, Supervisor, Facilitator, HOD, Examiner, Superadmin)

Use Cases: Specific functionalities the system provides

Relationships: Connections between actors and use cases

These diagrams utilize the following symbols:

##### Actor

A stick figure symbol represents an external entity that interacts with the system. When directly interacting with a system, an external entity takes on a designated role defined by an actor. This role might represent a user's function (such as Supervisor or Student) or a role fulfilled by another system that engages with the given system.

actor Name

##### Use case

The use case entails detailing the sequence of actions that a system can undertake while interacting with external actors. It encompasses tasks that the system should perform in response to an actor's request and is visually depicted as follows.

##### Relationship

Genuine associations illustrate the direct interactions between actors and use cases in a system. These are represented using the UML association symbol, indicating a meaningful connection within the system's functionality. This helps ensure that all user interactions are clearly defined and properly linked to the system's operations.

##### System boundary

A box is drawn around the use case diagram to visually represent the system's boundary. This defines the scope of the modeled system and distinguishes internal functionalities from external interactions. It helps stakeholders clearly identify what is included within the system and what lies outside its operational scope.

#### Use Case Diagram of the System

The use case diagram represents the main interactions between users and the FYP Tracking & Accountability System. The system has six primary actors: Student, Supervisor, Facilitator, Head of Department (HOD), Examiner, and Superadmin, together with two external systems — the prototype-review system and the email provider.

**Figure 2. Use case diagram**

*[Figure placeholder — a UML use-case diagram with the system boundary "FYP Tracking & Accountability System". Actors and their use cases: Student (Log in, View own state and timeline, Submit case-study letter, Submit proposal, View supervisor and meetings, Receive notifications); Supervisor (Log in, Post availability, Confirm meeting, Record attendance, Sign off book); Facilitator (Log in, View all students and timelines, Assign pre-defense/defense examiners, Coordinate workflow, Maintain WhatsApp links); HOD (Log in, Upload student list, Approve case letter, Issue requirements, Assign supervisor, Review proposal, Read prototype data); Examiner (Log in, View assigned panels, Record pre-defense/defense outcome); Superadmin (Manage users and roles, Reset passwords, Monitor logs, Configure system, Act anywhere). External: Prototype Review System (read-only API) connected to the prototype use case; Email provider connected to the notification use case.]*

##### Use Case Description

A Use Case description specifies what a use case accomplishes, and what it requires to be properly performed. Each use case is documented using the following structure:

Name: A unique identifier for the use case

Description: A brief explanation of what the system aims to accomplish through this use case

Actor: The primary participant(s) involved in the use case

Precondition: The system state required before the use case may start

Post-condition: The system state after the use case is successfully completed

Normal Flow: The primary sequence of steps describing the standard scenario

Alternative Flow: Variations or exception conditions that could occur during execution

**Table 1: Adding users Use Case Table**

| Field | Description |
|---|---|
| Use Case Number | UC-01 |
| Use Case Name | User Authentication and Access |
| Actor | Student, Supervisor, Facilitator, HOD, Examiner, Superadmin |
| Description | Logging into the FYP Tracking & Accountability System and accessing role-specific functionality |
| Pre-condition | A user must have an account provisioned by the Superadmin, and students must have a verified email imported from the registrar's list |
| Post-condition | A user gains secure, token-based access to the system with appropriate role-based permissions |
| Normal Flow | **Login:** User enters credentials (email and password). System verifies credentials and issues a session token. **View Profile:** User can view and verify their account information. **Access Dashboard:** User views a role-specific dashboard with relevant information. **Perform Role Activities:** Students view their state and timeline; supervisors post availability and confirm meetings; examiners record outcomes; HOD and facilitator coordinate the workflow. **View Records:** Access timelines, notifications, and relevant logs. |
| Alternative Flow | If login credentials are invalid, the system displays an error message and allows retry. If the account is disabled, the system denies access and notifies the user. If a user attempts an action outside their role, the system rejects it. If the system encounters an error, the transaction is rolled back and the user is notified. |

##### Use case description for the HOD

**Table 2: HOD Use Case Table**

| Field | Description |
|---|---|
| Use Case Number | UC-02 |
| Use Case Name | Manage Student Journey |
| Actor | Head of Department (HOD) |
| Description | Managing student records and academic decisions within the FYP Tracking & Accountability System |
| Pre-condition | HOD must be logged into the system and must have the appropriate academic privileges |
| Post-condition | Student records, approvals, and assignments are correctly created or updated, and all changes are recorded in the audit trail |
| Normal Flow | **Upload Student List:** HOD imports the registered-student list with verified emails. **Approve Case Letter:** HOD reviews and approves case-study letters and issues preliminary requirements. **Review Proposal:** HOD records the accept or reject decision with a reason. **Assign Supervisor:** HOD assigns a supervisor to a student once the proposal is accepted. **Read Prototype Data:** HOD queries the external prototype system by student ID. **Monitor:** HOD views student states, timelines, and records. |
| Alternative Flow | If an imported record is incomplete, the system highlights the missing fields and prevents submission. If an invalid state transition is attempted, the system rejects it and explains why. If a proposal has reached the maximum number of rejected attempts, the system locks resubmission until unlocked. If a database error occurs, changes are rolled back and the HOD is notified. |

##### Use case description for Backend side

**Table 3: Backend side Table**

| Field | Description |
|---|---|
| Use Case Number | UC-03 |
| Use Case Name | Automated State Transition and Notification |
| Actor | Backend (System) |
| Description | Automatically validating state transitions, counting attempts, and dispatching notifications based on defined business rules |
| Pre-condition | Student records are loaded and current; the state machine and notification templates are configured; the email queue is available |
| Post-condition | Valid transitions are applied and recorded; attempts are counted; notifications are queued, sent, and logged with delivery status |
| Normal Flow | **Receive Action:** System receives a transition or event request from an authorized actor. **Validate Transition:** The state machine confirms the requested transition is allowed from the current state. **Apply Business Rules:** Increment prototype or proposal attempt counters; enforce the maximum-attempt limit; keep panel assignments independent of supervision. **Persist and Record:** Update the student state, write a state-transition record, and append to the immutable audit log. **Dispatch Notification:** Render the milestone email template, queue it, send it asynchronously, and write to the notification log with delivery status. |
| Alternative Flow | If the transition is invalid, the system raises an InvalidStateTransitionException and rejects the action. If the actor is not authorized, the action is denied and logged. If an email send fails, the notification is retried and the failure is recorded. If a database error occurs, the transaction is rolled back and the error is logged for technical review. |

### Class Diagram

A class diagram serves as a fundamental component of software modeling and design in the field of software engineering. It provides a visual representation of the building blocks of the FYP Tracking & Accountability System, aiding in the understanding and planning of the software architecture. Within a class diagram, each class typically consists of three key elements: attributes, operations (methods), and associations. Attributes represent the properties or data members of a class, while operations define the behaviors or functions that the class can perform. Associations illustrate the relationships and connections between classes, allowing designers to depict how different classes interact within the system and influence one another's behavior.

In UML, class diagrams play a crucial role in modeling the static structure of the FYP Tracking & Accountability System. They not only reveal the relationships between classes but also showcase source code dependencies, inheritance hierarchies, and interface implementations. This makes class diagrams an indispensable tool for both high-level architectural design and low-level coding details, bridging the gap between abstract design and concrete implementation while ensuring consistency and traceability throughout the development process.

Class diagrams are applicable to various object-oriented programming languages and paradigms, such as Java, C++, and Python. They offer a blueprint for creating, maintaining, and understanding the FYP Tracking & Accountability System by presenting a clear hierarchy of classes and their associations, improving both development efficiency and collaboration among diverse project team members and stakeholders across the software development lifecycle.

### Class Diagram

The class diagram represents the static structure of the FYP Tracking & Accountability System, showing its main classes, attributes, and relationships.

**Figure 3: Class diagram**

*[Figure placeholder — a UML class diagram with the following classes and key associations. **User** (id, email, fullName, phone, role, passwordHash, enabled, eligibleExaminer, createdAt). **Student** (id, regNumber, organisation, projectTopic, groupLabel, state, stateEnteredAt, bookSignedOff, protoAttempts, proposalLocked, flagged, note) — Student 1—1 User; Student *—1 User (supervisor). **StateTransition** (id, fromState, toState, actorId, reason, createdAt) — Student 1—* StateTransition. **AvailabilitySlot** (id, dayOfWeek, startTime, endTime, location, active) — User(supervisor) 1—* AvailabilitySlot. **Meeting** (id, scheduledAt, confirmed, confirmedAt, attended, topic, notes, meetingType, location, meetLink) — Student 1—* Meeting; Supervisor 1—* Meeting. **ProposalAttempt** (id, attemptNumber, status, rejectionReason, reviewedBy, submittedAt, reviewedAt) — Student 1—* ProposalAttempt. **PanelAssignment** (id, panelType, scheduledAt, outcome, outcomeNote, outcomeRecordedAt, assignedBy, assignedAt) — Student 1—* PanelAssignment; Examiner 1—* PanelAssignment. **NotificationLog** (id, templateKey, recipientEmail, subject, status, errorMessage, retryCount, sentAt, createdAt). **AuditLog** (id, actorEmail, actorRole, action, entityType, entityId, detail, ipAddress, createdAt). **WhatsAppGroup** (id, team, link, number) — Supervisor 1—* WhatsAppGroup. Enumerations: Role, StudentState, ProposalStatus, PanelType, PanelOutcome, NotificationStatus.]*

##### Sequence Diagram

A sequence diagram is a type of interaction diagram that depicts objects as lifelines running down the page, with messages rendered as arrows from the source lifeline to the target lifeline, representing their interactions through time. Object interactions are arranged in temporal sequence in a sequence diagram.

In UML, the stages required to perform an operation are described in sequence diagrams, which are interaction diagrams. They show how objects interact when operating within a cooperative system. Sequence Diagrams are time-focused and use the vertical axis of the diagram to indicate time, what messages are received when, and how the interaction is organized graphically.

##### The notations and their definitions that are used in sequence diagram

**Table 4: Sequence diagram Table**

| Term and Definition | Symbol |
|---|---|
| **Actor:** Could be a person or external system that interacts with but is not part of the system. Participates in interactions by sending and/or receiving messages. Positioned at the top of the diagram. | (stick figure) |
| **Object Lifeline:** Represents an object that participates in a sequence by sending and/or receiving messages. Shows the lifespan of the object during the interaction. Placed vertically in the diagram with object name at top. | (vertical dashed line) |
| **Activation Box:** A narrow rectangle positioned on top of a lifeline. Indicates when an object is active and performing an operation. Shows the period of message transmission and reception. | (narrow rectangle) |
| **Message:** Synchronous Message: solid arrow with filled head → carries information and waits for response. Asynchronous Message: solid arrow with line head → sends message without waiting. Return Message: dashed arrow → indicates response or return value. Creation Message: dashed arrow with "new" → object instantiation. Destruction Message: solid arrow with X → object deletion. | (arrows) |

##### User Signup and Login Process

The FYP Tracking & Accountability System provides a secure and streamlined process for user authentication. Accounts are provisioned by the Superadmin, and students are imported from the registrar's verified list. During login, users enter their credentials, which are verified against stored records secured with BCrypt hashing. Upon successful authentication, the system issues a JSON Web Token and grants access to role-specific functionalities: the HOD approves letters, reviews proposals, and assigns supervisors; facilitators coordinate and assign panels; supervisors post availability and confirm meetings; examiners record outcomes; and students view their state, timeline, supervisor, and notifications. This process ensures secure access, protects sensitive data, and directs users to the appropriate interface based on their role.

**Figure 4: Sequence Diagram**

*[Figure placeholder — a sequence diagram for login: User → Login Page (enter credentials) → Auth Controller (validate format) → User Repository (find by email) → verify BCrypt password → if valid, JWT Util (generate token) → return token and role to the user and redirect to the role-specific dashboard; if invalid, return an authentication error with a retry option.]*

##### Process Interpretation:

The authentication process begins with the user submitting login credentials, whose format is validated before the system checks them against stored records.

If the credential format is incorrect, an error message is shown to the user. If the account is disabled or does not exist, a corresponding error message is displayed.

For valid credentials, the password is verified against the stored BCrypt hash, a JSON Web Token is issued, and the system redirects the user to their role-specific dashboard.

The session token is then included with each subsequent request, validating the user's identity and role for every protected operation until the session expires.

##### State transition sequence diagram:

**Figure 5: State transition sequence diagram**

*[Figure placeholder — a sequence diagram for an authorized state transition. Actor (HOD/Facilitator/Supervisor) → Controller (request transition) → Student State Service (load current state) → State Machine (validate the requested transition against allowed transitions). If invalid, return InvalidStateTransitionException. If valid: apply business rules (increment prototype or proposal attempt counters, enforce the maximum-attempt limit), persist the new state, write a StateTransition record, append to the AuditLog, then call the Notification Service to render and queue the milestone email, which is sent asynchronously and recorded in the NotificationLog with its delivery status.]*

The system begins with login and role validation, where user credentials are verified, and the actor's role is determined.

It proceeds to transition validation, ensuring the requested change is allowed from the student's current state. If the transition is invalid, the system rejects it and raises an InvalidStateTransitionException.

A business-rule check follows, confirming attempt counters and limits — for example, locking proposal resubmission after the third rejection. Error notifications are displayed if rules are violated.

Once validations are complete, the system persists the new state, writes the state-transition record, and appends to the immutable audit log.

The Notification Service then renders the appropriate milestone email, queues it for asynchronous delivery to the relevant recipient(s), and records it in the notification log.

Finally, the database updates all relevant records, including the student state, transition history, and notification status for future tracking and dispute resolution.

##### Activity Diagram

An activity diagram is a type of UML diagram that illustrates the workflow of the FYP Tracking & Accountability System processes. It shows the sequence of activities, decision points, and parallel processes, highlighting the flow of control from one task to another. Activity diagrams help visualize final year project management processes, clarify responsibilities among actors, and identify potential improvements by providing a detailed view of the system's behavior.

##### Key Elements in FYP Tracking & Accountability Context:

Activities:

Definition: Final year project management tasks or operations performed in the workflow

Notation: Rounded rectangles

##### Actions:

Definition: A single step within an activity that cannot be broken down further

Notation: Rounded rectangles

##### Initial Node (Start Node):

Definition: The starting point of the project-management workflow

Notation: Filled black circle

##### Final Node (End Node):

Definition: The end point of the workflow

Notation: Filled black circle inside a larger unfilled circle

##### Decision Nodes:

Definition: Points where the workflow branches based on conditions

Notation: Diamond shape

##### Merge Nodes:

Definition: Points where multiple branches converge back into a single flow

Notation: Diamond shape

##### Fork Nodes:

Definition: Points where a single flow splits into multiple concurrent flows

Notation: Thick horizontal or vertical bar with multiple outgoing arrows

##### Join Nodes:

Definition: Points where multiple concurrent flows synchronize back into a single flow

Notation: Thick horizontal or vertical bar with multiple incoming arrows

##### Swim lanes:

Definition: Partition the activity diagram to represent different actors (Student, Supervisor, HOD, System)

Notation: Vertical or horizontal sections

##### Transitions (Edges):

Definition: Arrows that show the flow of control from one activity or action to another

Notation: Arrows connecting elements

##### Signals and Events:

Definition: Represent asynchronous triggers or external inputs affecting the workflow

Notation: Special icons or symbols

##### User Account Creation and Login Process

**Figure 6: User signup and login activity diagram**

*[Figure placeholder — an activity diagram for account access: Start → Superadmin provisions account / registrar list imported → User opens login page → User enters credentials → Decision: credentials valid? → No: show error, return to login → Yes: issue JWT → Decision: role? → branch to Student / Supervisor / Facilitator / HOD / Examiner / Superadmin dashboard → End.]*

**Figure 7: Student journey activity diagram**

*[Figure placeholder — an activity diagram of the 13-state student journey with swim lanes (Student, Supervisor, HOD/Facilitator, Examiner, System): Start → Registered → Case Letter Submitted → Decision: HOD approves? → Case Letter Approved → Prototype Review → Decision: granted? (No: re-present, attempt counted, loop back) → Prototype Granted → Proposal Under Review → Decision: accepted? (No: record reason, increment attempt; if attempts = 3, lock; loop back) → Proposal Accepted → Supervision (post availability, confirm meetings, sign off book) → Book Submitted → Pre-Defense (examiner records outcome) → Defense (panel records result) → Completed → End. A side path from any non-terminal state leads to Withdrawn (terminal).]*

#### Database Schema Diagram

A database schema diagram describes how data is organized to create a blueprint for how a database will be constructed and is the database management system's supporting formal language used to define the structure of a database system (DBMS). Formally speaking, a database schema is a set of rules (sentences referred to as integrity constraints) applied to a database. The compatibility of the schema's components is ensured by these integrity requirements.

**Figure 8 Database schema**

*[Figure placeholder — an entity-relationship schema for the PostgreSQL database showing tables and foreign keys: users (PK id) ←→ students (PK id, FK user_id → users, FK supervisor_id → users); state_transitions (PK id, FK student_id → students, FK actor_id → users); availability_slots (PK id, FK supervisor_id → users); meetings (PK id, FK student_id → students, FK supervisor_id → users); proposal_attempts (PK id, FK student_id → students, FK reviewed_by → users); panel_assignments (PK id, FK student_id → students, FK examiner_id → users, FK assigned_by → users); notification_logs (PK id, FK recipient_id → users, FK student_id → students); audit_logs (PK id); whatsapp_groups (PK id, FK supervisor_id → users).]*

#### Data Dictionary

A data dictionary serves as a vital component in the field of data management and database design. Its role extends beyond assisting programmers and includes supporting a wide range of stakeholders, from data analysts to database administrators, and even end-users. When designing or evaluating a system that involves user-interactive objects, the initial phase requires a comprehensive understanding of each object's attributes and its relationships with other objects.

This understanding helps in creating a clear and accurate data model that serves as the foundation for effective system design. A well-maintained data dictionary acts as a living document that evolves with the system. It serves as a reference point throughout the entire software development lifecycle, aiding in system maintenance, troubleshooting, and future enhancements. As systems grow in complexity, the data dictionary plays a pivotal role in managing data consistency and ensuring that all stakeholders share a common understanding of the data's meaning and usage.

##### User account

The figure above shows:

The User account Data Dictionary provides detailed descriptions of the attributes stored within the users database table.

| Field Name | Data Type | Description |
|---|---|---|
| id | UUID, Primary Key | Unique identifier for each user |
| email | VARCHAR(255), Unique | User's login email address |
| full_name | VARCHAR(255) | User's full name |
| password_hash | VARCHAR(60) | BCrypt-hashed password for security |
| phone | VARCHAR(20) | User's contact number |
| role | ENUM('STUDENT','SUPERVISOR','FACILITATOR','HOD','EXAMINER','SUPERADMIN') | Role of the user in the system |
| eligible_examiner | BOOLEAN, Default: FALSE | Indicates if the user can be assigned as an examiner |
| enabled | BOOLEAN, Default: TRUE | Indicates if the user account is active |
| created_at | TIMESTAMP | Account creation timestamp |

**Students Table**

| Field Name | Data Type | Description |
|---|---|---|
| id | UUID, Primary Key | Unique identifier for each student |
| user_id | UUID, Foreign Key → users(id) | Links the student to a user account |
| reg_number | VARCHAR(50), Unique | Student registration number |
| organisation | VARCHAR(255) | Organisation or company for industry-based projects |
| project_topic | VARCHAR(255) | The student's project topic |
| group_label | VARCHAR(100) | Group or cohort label |
| state | ENUM (13 states) | Current state in the journey (e.g., SUPERVISION) |
| state_entered_at | TIMESTAMP | When the student entered the current state |
| supervisor_id | UUID, Foreign Key → users(id) | The assigned supervisor |
| book_signed_off | BOOLEAN, Default: FALSE | Whether the supervisor has signed off the book |
| proto_attempts | INT, Default: 0 | Number of prototype re-presentations |
| proposal_locked | BOOLEAN, Default: FALSE | Whether proposal resubmission is locked after three rejections |
| flagged | BOOLEAN, Default: FALSE | Whether the student is flagged for attention |

**Meetings Table**

| Field Name | Data Type | Description |
|---|---|---|
| id | UUID, Primary Key | Unique identifier for each meeting |
| student_id | UUID, Foreign Key → students(id) | The student attending the meeting |
| supervisor_id | UUID, Foreign Key → users(id) | The supervisor who scheduled the meeting |
| scheduled_at | TIMESTAMP | The date and time of the meeting |
| confirmed | BOOLEAN, Default: FALSE | Whether the supervisor confirmed the meeting |
| attended | BOOLEAN, Nullable | Attendance outcome once the meeting has passed |
| topic | VARCHAR(255) | The meeting topic |
| notes | TEXT | Notes recorded after the meeting |
| meeting_type | ENUM('ONLINE','IN_PERSON') | The mode of the meeting |
| location | VARCHAR(255) | Location or meeting link |

**Proposal Attempts Table**

| Field Name | Data Type | Description |
|---|---|---|
| id | UUID, Primary Key | Unique identifier for each proposal attempt |
| student_id | UUID, Foreign Key → students(id) | The student who submitted the proposal |
| attempt_number | INT | The sequential attempt number (1–3) |
| status | ENUM('PENDING','ACCEPTED','REJECTED') | The review outcome of the attempt |
| rejection_reason | TEXT | The reason given when an attempt is rejected |
| reviewed_by | UUID, Foreign Key → users(id) | The reviewer who recorded the decision |
| submitted_at | TIMESTAMP | When the attempt was submitted |
| reviewed_at | TIMESTAMP | When the attempt was reviewed |

**Panel Assignments Table**

| Field Name | Data Type | Description |
|---|---|---|
| id | UUID, Primary Key | Unique identifier for each panel assignment |
| student_id | UUID, Foreign Key → students(id) | The student being examined |
| examiner_id | UUID, Foreign Key → users(id) | The assigned examiner |
| panel_type | ENUM('PRE_DEFENSE','DEFENSE') | The type of panel |
| scheduled_at | TIMESTAMP | The scheduled date and time |
| outcome | ENUM('CLEARED','PASSED','REFERRED','FAILED') | The recorded panel outcome |
| outcome_note | TEXT | Notes recorded with the outcome |
| assigned_by | UUID, Foreign Key → users(id) | The facilitator who made the assignment |
| assigned_at | TIMESTAMP | When the assignment was made |

**System architecture diagram**

The system architecture of the FYP Tracking & Accountability System illustrates how the platform's components interact to deliver a seamless and efficient final year project management experience.

**Figure 9: System architecture**

*[Figure placeholder — a layered architecture diagram. Client layer: React + TypeScript single-page application (responsive web UI) running in the browser. Communication: HTTPS REST API with JWT in the Authorization header. Application layer: Spring Boot back end with Spring Security (JWT filter, role-based access), controllers, services (AuthService, StudentStateService, SupervisionService, ProposalService, PanelService, NotificationService, AuditService), and Spring Data JPA repositories. Data layer: PostgreSQL relational database (system of record) and Redis (caching of timelines and lookups, session support, and notification queue). External integrations behind thin adapters: Prototype Review System (read-only API queried by student ID, with a stub and cached last result) and the Email/notification provider (asynchronous, queued, retried, and logged). Cross-cutting: immutable audit log and notification log.]*
