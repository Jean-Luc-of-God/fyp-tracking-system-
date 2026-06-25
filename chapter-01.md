Adventist University of Central Africa

FYP Tracking & Accountability System

(Final Year Project Tracking & Accountability Platform)

#### Case study: AUCA Final Year Project Department

A Final Year Project Presented in partial fulfillment of the requirements for the degree of BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY

Major in

Software Engineering

By MANISHIMWE KWIZERA Jean Luc — June, 2026

---

## ABSTRACT

A final year project for the Bachelor's Degree of Science in Information Technology Emphasis in Software Engineering

Adventist University of Central Africa

TITLE: FYP Tracking & Accountability System

Name of the Researcher: MANISHIMWE KWIZERA Jean Luc

Name of faculty Advisor: ISHIMWE M. Prince

Date Completed: June, 2026

The FYP Tracking & Accountability System is a web-based platform developed to modernize the management of the final year project journey at the Adventist University of Central Africa. It replaces fragmented manual and semi-digital procedures with a single, auditable system that records every stage a student passes through, from registration to final defense. The platform provides a centralized solution that improves coordination, transparency, and accountability among students, supervisors, examiners, facilitators, and the Head of Department, creating a more organized and evidence-driven academic environment.

The current process keeps good records at the start of the project journey (registration and case-letter approval) and near the end (book submission and defense scheduling), but has little visibility during prototype review and supervision. These blind spots are where students are most often disadvantaged and where responsibility is assigned by assumption rather than by evidence. Departmental staff face difficulties in tracking supervision meetings, counting prototype and proposal attempts, and proving which notifications were actually sent. The absence of a continuous, timestamped record limits accountability and weakens the resolution of disputes.

Data were collected through documentation review, direct observation of the departmental workflow, and interviews with academic staff who coordinate final year projects. System design followed an object-oriented approach using UML diagrams. The system was implemented using React with TypeScript on the front end, Spring Boot on the back end, and PostgreSQL for data storage, with Redis for caching and JSON Web Tokens for authentication, ensuring a scalable and maintainable architecture.

This integrated tracking system centralizes student state management, supervision scheduling, proposal-attempt tracking, panel assignment, notification logging, and audit recording into a single secure platform. It improves operational efficiency, enhances data accuracy, and supports the transition from undocumented manual coordination to a modern, fully digital, and well-coordinated final year project management environment.

---

## DECLARATION

I, MANISHIMWE KWIZERA Jean Luc, Student ID Number 26972, a student at the Adventist University of Central Africa in the Faculty of Information Technology, Department of Software Engineering, do hereby declare that this final year project report entitled "FYP Tracking & Accountability System" is entirely the real reflection of my own original work and experience to the best of my knowledge. It has never been either partially or wholly presented in any university or any higher learning institution for the award of a degree or any other qualification.

Signature: ………………………….

Date: …………/…………/….……...

---

## APPROVAL

I, ISHIMWE M. Prince, hereby certify that student MANISHIMWE KWIZERA Jean Luc, with registration number 26972, in the Faculty of Information Technology, Department of Software Engineering, has completed this Final Year Project report under my supervision and is hereby submitted with my approval.

Signature: ………………………………….

Date: …………/…………/…………………

---

## DEDICATION

To my parents,

To my beloved sisters and brothers, To my classmates, friends, and relatives,

To my supervisor for his guidance I dedicate this final report

---

## LIST OF FIGURES

Figure 1 Current System model

Figure 2 Use case diagram

Figure 3 Class diagram

Figure 4 Sequence Diagram

Figure 5 Prediction sequence diagram

Figure 6 User signup and login activity diagram

Figure 7 Student journey activity diagram

Figure 8 Database schema

Figure 9 System architecture

---

## LIST OF TABLES

Table 1 Adding users Use Case Table

Table 2 HOD Use Case Table

Table 3 Backend side Table

Table 4 Sequence diagram Table

---

# LIST OF ABBREVIATION

| Abbreviation | Meaning |
|---|---|
| API | Application Programming Interface |
| AUCA | Adventist University of Central Africa |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| CSV | Comma-Separated Values |
| DBMS | Database Management System |
| FYP | Final Year Project |
| HOD | Head of Department |
| HTTP | Hypertext Transfer Protocol |
| ICT | Information and Communication Technology |
| IT | Information Technology |
| JPA | Java Persistence API |
| JWT | JSON Web Token |
| NCSA | National Cyber Security Authority |
| NST | National Strategy for Transformation |
| ORM | Object-Relational Mapping |
| REST | Representational State Transfer |
| SDLC | Software Development Life Cycle |
| SQL | Structured Query Language |
| UI | User Interface |
| UML | Unified Modeling Language |

---

## ACKNOWLEDGMENTS

First and foremost, I would like to express my sincere gratitude to the Almighty God for His blessings, wisdom, and unwavering guidance throughout the journey of this project. His grace has been my strength and inspiration in every phase of this work, and I am eternally thankful for His divine presence in my life.

I would like to express my sincere appreciation to AUCA and its entire administration and academic staff for their support and guidance throughout my studies. Special thanks go to the Faculty of Information Technology, particularly the Department of Software Engineering, for their valuable knowledge, resources, and academic support. The high-quality education I received at AUCA has been instrumental in my academic growth and has greatly contributed to the successful completion of this project.

I wish to extend my heartfelt thanks to my project supervisor, ISHIMWE M. Prince, for his invaluable mentorship, expert guidance, and immense patience. His insightful feedback, constant encouragement, and scholarly advice were crucial in shaping the "FYP Tracking & Accountability System" from a concept into a realized project.

I am profoundly grateful to my beloved parents for their unconditional love, endless support, and steadfast encouragement. Your belief in my abilities and the countless sacrifices you have made form the bedrock of my achievements. Thank you for always being my pillars of strength.

I am also thankful to my friends and classmates at AUCA for their camaraderie, collaborative spirit, and moral support throughout our studies. The stimulating discussions and shared experiences have made this academic journey both memorable and rewarding.

Finally, I would like to sincerely thank everyone who contributed to this work, directly or indirectly. Your support, guidance, and encouragement were invaluable, and I am deeply grateful.

May God bless you all abundantly

MANISHIMWE KWIZERA Jean Luc

---

## CHAPTER 1 GENERAL INTRODUCTION

### Introduction

Advancements in information technology have changed how institutions manage their operations, encouraging the adoption of digital systems that improve efficiency, accuracy, and service delivery. Despite this progress, many academic departments still rely heavily on manual and semi-digital procedures for handling essential activities such as registering students for their final year projects, approving case-study letters, tracking supervision meetings, recording proposal submissions, and assigning examination panels. These paper-based and ad-hoc methods often result in slow processes, difficulties in tracking records, limited transparency, and challenges in maintaining accurate academic and administrative data.

Departmental coordinators frequently encounter problems when trying to monitor a student's current stage, verify how many times a prototype or proposal was presented, or confirm whether a required notification was actually delivered. At the same time, students may experience uncertainty about what step comes next, lack timely confirmation after submitting their work, and have limited access to up-to-date information regarding their supervision schedule or panel assignment. Such inefficiencies not only affect the daily administration of final year projects but can also lead to disputes, missed milestones, and reduced trust between students and the department.

To overcome these challenges, the FYP Tracking & Accountability System is introduced as a digital platform designed to automate and simplify the management of the final year project journey. The system provides a centralized environment where the Head of Department and facilitators can oversee every student's state efficiently, supervisors can post availability and confirm meetings, examiners can record panel outcomes, and every transition is captured with the actor who performed it and the time it occurred. Students benefit from the ability to follow their own progress online, receive instant email notifications at each milestone, and access the contact details and meeting schedule of their assigned supervisor.

The adoption of this system is expected to reduce manual workload, improve data accuracy, and strengthen transparency in final year project administration. With real-time access to reliable, timestamped information, departmental staff will be able to make more informed decisions, resolve complaints from a documented record, and respond quickly to operational needs.

### Background of the Study

Final year projects have historically played a central role in higher education, particularly in information technology programmes where they represent the culmination of a student's academic training and a major source of practical, demonstrable competence. These projects provide opportunities for students to apply theoretical knowledge to real-world problems while also allowing the institution to assess readiness for graduation. Because of their academic and professional importance, effective management of the final year project journey is necessary to maintain order, ensure fair treatment of every student, and support accountable academic decision-making. However, in many institutions, the administration of final year projects still relies heavily on traditional manual systems that were originally designed for smaller cohorts and less complex supervision arrangements.

Manual final year project management typically involves paper-based registration, handwritten approval of case-study letters, informal scheduling of supervision meetings, and physical or scattered storage of records relating to prototype and proposal attempts. While these practices may appear simple, they often lead to a range of operational challenges. Records can easily be misplaced or contradicted, updating information requires significant time and effort, and verifying the accuracy of data becomes difficult when multiple records are handled manually across several actors. As cohorts grow and the number of students increases, these challenges become more pronounced, leading to delays in coordination, inconsistencies in oversight, and difficulties in tracking each student's true progress. In addition, the absence of a centralized digital record limits the ability of administrators to generate timely and reliable reports, which are essential for planning, monitoring performance, and resolving disputes.

The rapid advancement of information and communication technologies (ICT) has introduced new opportunities for improving administrative systems across different sectors. Around the world, organizations and academic institutions are adopting digital platforms to automate routine processes, enhance data accuracy, and improve communication between stakeholders. Electronic management systems allow real-time monitoring of activities, automated record keeping, and faster generation of analytical reports. Such systems not only reduce administrative workload but also increase transparency and accountability by ensuring that information is stored securely and can be accessed whenever needed.

In Rwanda, the government has demonstrated a strong commitment to promoting digital transformation through national initiatives such as Vision 2050, the National Strategy for Transformation (NST), and the Smart Rwanda Master Plan. These initiatives emphasize the use of technology to enhance service delivery, strengthen governance, and support sustainable development. Significant progress has already been made in sectors such as banking, education, healthcare, and public administration, where digital systems are increasingly being used to manage services and transactions. Despite these advancements, some areas of academic administration, including the management of final year projects, still rely on manual or semi-digital processes that limit efficiency and transparency.

From the students' perspective, manual systems can also create inconveniences. Following up on the status of a case letter may require repeated visits to departmental offices, confirmation of supervision meetings may depend on informal messages, and accessing updated information about prototype outcomes, proposal decisions, or panel schedules may not always be straightforward. Such challenges can affect a student's ability to plan their work, reduce confidence in the fairness of the process, and create unnecessary delays. As cohorts continue to expand and the demand for accountable academic services increases, the need for a more reliable and technology-driven management approach becomes increasingly evident.

It is within this context that the FYP Tracking & Accountability System is proposed as a comprehensive digital solution aimed at improving the management of the final year project journey. The system is designed to provide an integrated platform where the Head of Department and facilitators can oversee every stage of the workflow, supervisors can post availability and confirm meetings, examiners can record pre-defense and defense outcomes, and students can follow their own progress and receive timely notifications. Each transition is recorded with the actor and a timestamp, and every email the system sends is stored in a notification log so that claims of "I was never told" can be checked against what the system actually sent.

By replacing fragmented manual procedures with an automated and centralized system, the FYP Tracking & Accountability System is expected to significantly enhance operational efficiency, data accuracy, and transparency in final year project administration. The system will help reduce paperwork, minimize human errors, and ensure that reliable, timestamped information is readily available for students, supervisors, examiners, facilitators, and the Head of Department alike.

### Statement of Problem

Current final year project management methods are largely inefficient, relying on manual and semi-digital processes for registration, supervision tracking, prototype and proposal recording, and panel coordination, leading to operational delays, accountability gaps, and poor resource utilization. The department keeps adequate records at the start of the journey and near the end, but has little visibility during prototype review and supervision, which are precisely the stages where students are most often disadvantaged and where responsibility is today assigned by assumption rather than by evidence. These outdated practices are inadequate for modern academic demands, especially in growing programmes where efficiency and transparency are crucial. The main challenges that characterize the existing approach include:

Supervision blind spot: There is no systematic record of supervisor availability, confirmed meeting dates and times, attendance, or book sign-off, making it impossible to verify whether supervision actually took place as required.

Lack of real-time state visibility: Departmental staff lack access to up-to-date information on each student's current stage and history, hindering effective coordination, follow-up, and decision-making.

Untracked prototype and proposal attempts: The number of times a student presented a prototype, or submitted and had a proposal rejected, is not reliably recorded with reasons, so a student's true history cannot be proven when a dispute arises.

Administrative inefficiency: The reliance on manual processes creates significant administrative overhead, delays in moving students between stages, and difficulties in maintaining accurate records across multiple actors.

Poor communication and notification evidence: Students often miss important updates regarding approvals, supervisor assignment, or panel schedules, and the department cannot prove which messages were sent, leading to disputes that cannot be resolved from a record.

Difficulty in monitoring and reporting: Without a digital system, tracking how long students spend at each stage, which panels are assigned, and which actions were taken by whom requires extensive manual effort, making it hard for the department to identify bottlenecks, ensure accountability, or generate timely reports for decision-making.

### Choice and Motivation of the Study

The motivation behind the FYP Tracking & Accountability System is to provide a comprehensive digital platform that streamlines final year project management by integrating real-time state tracking, supervision scheduling, proposal-attempt recording, and panel coordination into one auditable timeline. By doing so, the FYP Tracking & Accountability System aims to reduce administrative burdens, enhance transparency, and improve resource utilization, addressing the fundamental challenges of traditional final year project management while promoting an accountable and evidence-driven academic environment.

To AUCA: Developing the FYP Tracking & Accountability System provides a practical opportunity to apply the knowledge and skills I have gained during my Bachelor of Science in Information Technology studies at the Adventist University of Central Africa (AUCA). This project integrates system design, full-stack web development, and secure data management, aligning with AUCA's mission of nurturing innovative professionals who leverage technology to solve real-world problems and promote efficient, community-centered digital transformation.

To the AUCA FYP Department: The FYP Tracking & Accountability System directly supports the department's effort to modernize academic administration and ensure fair, accountable treatment of every final year student. By providing a centralized digital platform for state tracking, supervision, proposal recording, panel assignment, communication, and audit, the system improves operational efficiency, transparency, and accountability across the entire project journey.

The platform also aligns with Rwanda's Vision 2050 and the National Strategy for Transformation (NST) by promoting inclusive digital innovation, data-driven management, and stronger institutional governance. Furthermore, it contributes to the Smart Rwanda Master Plan by leveraging ICT to strengthen academic service delivery, streamline departmental operations, and improve the overall management of the final year project process.

To the Student: This project represents both an academic and personal commitment to applying technology for practical impact. As a student specializing in Software Engineering, I was inspired by the real challenges faced in managing the final year project journey efficiently and fairly. The FYP Tracking & Accountability System enabled me to transform theoretical knowledge into a real-world solution that promotes accountability, streamlines academic processes, and supports Rwanda's innovation and development agenda.

### Objectives of the Study

#### General Objective

To develop a digital platform that streamlines final year project management by automating state tracking, supervision scheduling, proposal-attempt recording, and panel coordination through real-time data integration. The system will provide the department with tools for efficient operations, transparency, and accountability, using a relational database and caching to deliver reliable, timestamped records. Automated notifications and milestone updates will guide students, supervisors, and examiners, reducing delays and disputes. Accessible through a responsive web application, the platform aims to lower administrative costs, improve student satisfaction, and create a more organized and accountable final year project process.

#### Specific Objectives:

To develop a secure, web-based, and responsive platform that enables the department, supervisors, examiners, and students to manage registration, state transitions, supervision, and panels in real time, reducing reliance on manual and paper-based processes.

To design an intuitive and user-friendly interface that accommodates all roles — student, supervisor, facilitator, HOD, examiner, and superadmin — ensuring ease of use, accessibility, and wider adoption across different users.

To build a robust database system for securely storing and managing student profiles, state transitions, supervision records, proposal attempts, panel assignments, notification logs, and audit logs efficiently.

To enforce a clear state machine and role-based business rules that govern valid transitions, count prototype and proposal attempts, and prevent invalid or unauthorized actions across the project journey.

To implement an automated communication and notification system that alerts students, supervisors, and examiners about approvals, supervisor assignment, meetings, and panel schedules, and records every message in a notification log.

To provide oversight and reporting tools that allow the department to monitor each student's state and timeline, track panel assignments, and review immutable audit and notification records to support data-driven decisions.

To ensure data security, privacy, and system reliability by implementing authentication, authorization, and encryption mechanisms to protect sensitive student information in line with Rwanda's personal data protection law.

### Scope of the Study

The FYP Tracking & Accountability System will focus on the final year project administration of an academic department, providing a comprehensive digital management platform that integrates state tracking, supervision scheduling, proposal-attempt recording, panel assignment, and communication features. By optimizing existing departmental operations, the platform will help the Head of Department and facilitators coordinate the journey efficiently and make evidence-based decisions regarding each student's progress. In addition to providing operational visibility, the system will track prototype attempts, proposal rejection reasons, supervision events, and panel outcomes, promoting transparent and accountable project management without requiring significant infrastructure changes.

Rather than replacing the institution's existing registrar or prototype-review systems, the primary goal of the FYP Tracking & Accountability System is to enhance operational efficiency and accountability using digital solutions. By leveraging real-time data, a clear state machine, and automated workflows, the platform will support the department in adopting modern management practices, ultimately reducing administrative burdens and improving student satisfaction. This approach ensures accessibility and practicality for departments managing roughly 500 to 1000 students per cycle while contributing to long-term institutional sustainability.

The study will concentrate on developing the core software platform and its essential modules, including:

State tracking and per-student timeline management

Supervision module: availability, supervisor-confirmed meetings, and book sign-off

Proposal-attempt tracking with rejection reasons and attempt limits

Panel assignment for pre-defense and defense, with outcome recording

Automated milestone notifications and a notification log

Role-based access control, authentication, and an immutable audit log

The implementation will utilize existing technological infrastructure commonly available in academic environments, focusing on web accessibility to ensure broad usability across the department's roles.

### Methodology and Techniques used in the Study

The research methodology for the FYP Tracking & Accountability System will adopt a systematic approach to analyzing and improving final year project management processes. This will include both qualitative and quantitative techniques, such as literature review, direct observation of departmental operations, interviews with academic staff, and case studies of existing digital management systems. These methods will help gain a comprehensive understanding of current project management practices, identify operational inefficiencies, and develop solutions to optimize departmental operations through digital transformation.

#### Documentation

Documentation is a research method that involves the systematic collection, review, and analysis of existing records, reports, and written materials relevant to the study topic. It allows researchers to understand background information, identify operational challenges, and gather evidence to support research objectives.

In this study, I used documentation review to examine existing records, forms, and guidelines used by the department to manage final year projects. This included analyzing student registration records, case-letter approval forms, supervision arrangements, prototype and proposal records, and the requirements brief prepared for the system, in order to understand the journey, the actors, and the data each stage must capture.

#### Observation

Observation is a qualitative research method that involves directly monitoring and recording behaviors, processes, and interactions in a real-world setting without interference. In the context of the FYP Tracking & Accountability System, observation was used to study how the department currently manages registration, supervision, prototype and proposal review, and panel coordination. This method allowed the collection of objective data on administrative workflows, decision-making patterns, and operational challenges affecting the efficiency and fairness of final year project management.

#### Interview

Interviews are a qualitative research method used to gather in-depth insights from individuals with relevant knowledge and experience. They involve structured, semi-structured, or open-ended discussions to explore perspectives, challenges, and potential solutions related to a specific topic. In the context of the FYP Tracking & Accountability System, interviews were conducted with departmental staff who coordinate final year projects.

I, MANISHIMWE KWIZERA Jean Luc, a finalist in the Faculty of Information Technology, Department of Software Engineering at the Adventist University of Central Africa (AUCA), conducted this research to design and develop the FYP Tracking & Accountability System, specifically addressing inefficiencies in state tracking, supervision, proposal recording, and panel coordination.

Question 1: What challenges do you currently face in managing the final year project journey? Answer: The main challenges include limited visibility during supervision, difficulty in tracking how many times a student presented a prototype or resubmitted a proposal, lack of a single view of each student's stage, and no reliable proof of which notifications were sent. These challenges often lead to coordination delays, disputes over what happened, and unfair outcomes for some students.

Question 2: How effective are the current tools and methods used for managing final year projects? Answer: The current tools and methods are mostly manual or scattered across forms, spreadsheets, and informal messages. While they have been used for a long time, they are inefficient, prone to errors, and unable to provide a real-time, timestamped record of supervision, attempts, and communications.

Question 3: What improvements are needed to enhance final year project management? Answer: There is a strong need for a digital solution that records every state a student passes through, captures supervision and panel events with timestamps, counts prototype and proposal attempts, and stores every notification sent. Improving transparency, reducing manual workload, and enabling accountability are essential.

Question 4: What features do you expect from a new final year project management system? Answer: The expected features include real-time state tracking and per-student timelines, supervisor availability and confirmed meetings, proposal-attempt tracking with reasons, examiner panel assignment, automated milestone emails, and immutable audit and notification logs.

Question 5: How would a digital final year project management system benefit departmental operations? Answer: A digital system would improve operational efficiency, increase transparency, reduce errors, and support better decision-making and dispute resolution through real-time, timestamped data and reliable records.

#### Expected Results

The FYP Tracking & Accountability System is expected to effectively address the challenges identified in the objectives of this project. After successful implementation,

Improved State Visibility and Coordination: The system will enable real-time tracking of every student's state and timeline. This will reduce confusion about progress, eliminate inconsistent records, and ensure that the department can coordinate the journey efficiently from a single source of truth.

Closed Supervision Blind Spot: By digitizing supervisor availability, confirmed meetings, attendance, and book sign-off, the system will make supervision verifiable. All supervision events will be timestamped, turning the record into evidence neither side can later deny.

Provable Attempt and Rejection Trail: Integration of prototype-attempt visibility and proposal-attempt tracking will record how many times a student presented and the reasons for any rejection, making a student's history provable rather than anecdotal.

Faster Communication and Notification Evidence: The system will facilitate instant communication through automated milestone emails, and store every message in a notification log with delivery status. This will improve information flow and allow the department to prove what was sent and when.

Stronger Accountability and Decision Making: Immutable audit logs and per-student timelines will provide the department with reliable insight into who acted and when, supporting informed planning, fair outcomes, and dispute resolution.

Enhanced Student Satisfaction and Process Efficiency: By clarifying each student's next step, confirming supervision, and recording every decision, the system will reduce administrative burdens, improve the student experience, and contribute to a more organized and accountable final year project process.

#### Organization of the Work

This research study comprises five chapters, each serving a distinct purpose in the development and analysis of the FYP Tracking & Accountability System:

Chapter One: General Introduction, provides a general overview of the project, including the background of the study, problem statement, motivation, objectives (general and specific), scope of the system, methodology, requirements collection techniques, and expected results.

Chapter Two: Analyzes the existing manual final year project management approach, identifies its weaknesses, and defines the requirements of the proposed FYP Tracking & Accountability System. It includes functional and non-functional requirements, the current process model, the problems of the existing system, and the expected benefits.

Chapter Three: Requirement analysis and design of the new system, presents the system design, including the high-level system architecture, module descriptions, and overall solution design. It also covers process models, the database schema, class diagrams, use-case diagrams, sequence diagrams, and activity diagrams.

Chapter Four: Implementation of the FYP Tracking & Accountability System, focuses on the implementation phase of the system. It describes the tools and technologies used, system development, coding practices, database implementation, and testing procedures applied to ensure system reliability and performance.

Chapter Five: Conclusion and recommendations, summarizes the project, highlights achievements, discusses limitations encountered during development, and proposes possible future enhancements to improve the FYP Tracking & Accountability System.
