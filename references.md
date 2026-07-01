# References

---

## Books

Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design patterns: Elements of reusable object-oriented software*. Addison-Wesley.
> State machine pattern used in the 13-state student lifecycle (Chapter 3).

Martin, R. C. (2008). *Clean code: A handbook of agile software craftsmanship*. Prentice Hall.
> Guided service layer design and single-responsibility principle applied across StudentService, ProposalService, and StudentStateService.

Pressman, R. S., & Maxim, B. R. (2014). *Software engineering: A practitioner's approach* (8th ed.). McGraw-Hill Education.
> Foundation for requirements analysis (Chapter 2), use case modelling (Chapter 3), and testing strategy (Chapter 4).

Walls, C. (2022). *Spring in action* (6th ed.). Manning Publications.
> Primary reference for Spring Boot auto-configuration, Spring Data JPA repositories, and Spring Security integration used throughout the backend.

Schildt, H. (2021). *Java: The complete reference* (12th ed.). McGraw-Hill Education.
> Reference for Java 17 language features, generics, and collections used in the backend.

Richardson, L., & Ruby, S. (2007). *RESTful web services*. O'Reilly Media.
> REST design principles applied to all API endpoints (resource naming, HTTP verbs, status codes) documented in Chapter 4.

Date, C. J. (2003). *An introduction to database systems* (8th ed.). Addison-Wesley.
> Relational database theory behind the 10-table PostgreSQL schema — normalisation, foreign key constraints, and indexing strategy.

Banks, A., & Porcello, E. (2020). *Learning React* (2nd ed.). O'Reilly Media.
> React component architecture, hooks (useState, useEffect, useCallback, useContext) used across all five role dashboards in the frontend.

Fowler, M. (2018). *Refactoring: Improving the design of existing code* (2nd ed.). Addison-Wesley.
> Applied during iterative development of AppContext and the proposal service to eliminate duplication and reduce coupling.

---

## Standards and Technical Specifications

Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)*. RFC 7519. Internet Engineering Task Force (IETF). https://www.rfc-editor.org/rfc/rfc7519
> Formal specification for the JWT tokens issued by the backend (HMAC-SHA384, 24-hour expiry, claims structure).

Grassi, P. A., Garcia, M. E., & Fenton, J. L. (2017). *Digital identity guidelines: Authentication and lifecycle management*. NIST Special Publication 800-63B. National Institute of Standards and Technology. https://pages.nist.gov/800-63-3/sp800-63b.html
> Justification for BCrypt cost-12 password hashing and the login rate-limiting policy (5 attempts per 15 minutes).

---

## Websites and Online Documentation

Apache Software Foundation. (2024). *Apache POI — the Java API for Microsoft documents*. https://poi.apache.org/
> Library used to parse the Excel (.xlsx) student import file in StudentService.importFromExcel().

Bucket4j Contributors. (2024). *Bucket4j: Java rate-limiting library based on token-bucket algorithm*. https://github.com/bucket4j/bucket4j
> Rate limiter used to enforce the 5-login-attempt-per-IP-per-15-minute rule in LoginRateLimiter.java.

Flyway by Redgate. (2024). *Flyway database migrations*. https://documentation.red-gate.com/flyway
> Tool used to manage all five versioned SQL migrations (V1–V5) applied to the PostgreSQL database on startup.

Hibernate. (2024). *Hibernate ORM documentation*. https://hibernate.org/orm/documentation/
> JPA provider used for all entity mapping, lazy/eager loading strategy, and the @EntityGraph fix for LazyInitializationException.

JSON Web Tokens. (2024). *Introduction to JSON Web Tokens*. https://jwt.io/introduction
> Practical reference for implementing JWT generation and validation using the jjwt 0.12.6 library.

OWASP Foundation. (2023). *OWASP Top 10*. https://owasp.org/www-project-top-ten/
> Security checklist used to verify the system against injection, broken authentication, and security misconfiguration risks.

PostgreSQL Global Development Group. (2024). *PostgreSQL 16 documentation*. https://www.postgresql.org/docs/16/
> Reference for SQL syntax, UUID generation (uuid_generate_v4), constraints, and Flyway-managed migrations.

React. (2024). *React documentation*. https://react.dev/
> Official reference for React 19 hooks, context API (AppContext), and component lifecycle used in all role dashboards.

Redis. (2024). *Redis documentation*. https://redis.io/docs/latest/
> Reference for Redis 7 data structures used to implement the JWT logout blacklist in JwtBlacklistService.java.

Spring. (2024). *Spring Boot reference documentation*. https://docs.spring.io/spring-boot/docs/current/reference/html/
> Primary reference for Spring Boot 3.2.5 auto-configuration, application.yml settings, and Actuator health endpoint.

Spring. (2024). *Spring Security reference documentation*. https://docs.spring.io/spring-security/reference/
> Reference for JWT filter chain configuration, @PreAuthorize role-based access control, and HTTP security headers (HSTS, X-Frame-Options, XSS Protection).

TypeScript. (2024). *The TypeScript handbook*. https://www.typescriptlang.org/docs/handbook/intro.html
> Reference for TypeScript strict typing applied across all frontend API types, component props, and the AppContext interface.

Vite. (2024). *Vite documentation*. https://vitejs.dev/
> Build tool for the React frontend — used for development server (port 5173), hot module replacement, and production bundling.
