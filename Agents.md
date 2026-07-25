# AGENTS.md

# Agentic Coding Guidelines

This document defines the coding standards, architecture, and development workflow for all AI coding agents contributing to this project.

---

# Technology Stack

| Component | Version |
|-----------|---------|
| Java | **21 (LTS)** |
| Spring Boot | **4.1.0** |
| Maven | Latest |
| Database | PostgreSQL |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security + JWT/OAuth2 |
| API | REST |
| Validation | Jakarta Validation |
| Testing | JUnit 5, Mockito |
| Build Tool | Maven |
| Containerization | Docker |
| Documentation | OpenAPI (Swagger) |

---

# General Principles

- Follow Clean Code principles.
- Follow SOLID principles.
- Prefer composition over inheritance.
- Keep methods short and focused.
- Avoid code duplication (DRY).
- Keep business logic out of controllers.
- Write production-ready code.
- Do not leave TODOs.
- Avoid commented-out code.
- Every public API should have proper validation.
- Fail fast with meaningful exceptions.

---

# Project Structure

```
src/main/java/com/example/project

├── config
├── controller
├── dto
│   ├── request
│   └── response
├── entity
├── exception
├── mapper
├── repository
├── security
├── service
│   ├── impl
│   └── interfaces
├── util
└── ProjectApplication
```

---

# Layer Responsibilities

## Controller

Responsibilities:

- Accept HTTP requests
- Validate input
- Return ResponseEntity
- Never contain business logic

Example:

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService service;

    @PostMapping
    public ResponseEntity<UserResponse> create(
            @Valid @RequestBody UserRequest request) {

        return ResponseEntity.ok(service.create(request));
    }
}
```

---

## Service

Responsibilities:

- Business logic
- Transactions
- Validation
- Repository interaction

Never expose Entity objects.

---

## Repository

Only data access.

Use Spring Data JPA.

Avoid unnecessary native SQL.

---

## DTO

Always use DTOs.

Never expose Entity objects through APIs.

Separate:

- Request DTO
- Response DTO

---

## Entity

- Use UUID as identifiers where appropriate.
- Use Jakarta Persistence annotations.
- Keep entities persistence-focused.
- Avoid business logic inside entities.

---

# Naming Conventions

Classes

```
UserController
UserService
UserServiceImpl
UserRepository
UserMapper
```

Methods

```
createUser()
updateUser()
deleteUser()
findById()
findAll()
```

Variables

```
user
order
payment
response
request
```

Constants

```
MAX_RETRY_COUNT
DEFAULT_PAGE_SIZE
```

---

# Dependency Injection

Always constructor injection.

Use Lombok:

```java
@RequiredArgsConstructor
```

Never use:

```java
@Autowired
```

---

# Exception Handling

Use global exception handler.

```
@RestControllerAdvice
```

Create custom exceptions.

Examples

- ResourceNotFoundException
- BadRequestException
- UnauthorizedException

Never return stack traces.

---

# Validation

Always validate request DTOs.

Example:

```java
@NotBlank
private String name;

@Email
private String email;

@Size(min = 8)
private String password;
```

---

# Logging

Use SLF4J.

```java
private static final Logger log =
    LoggerFactory.getLogger(UserService.class);
```

Log:

- application start
- important business events
- errors
- warnings

Never log:

- passwords
- JWT tokens
- secrets
- API keys

---

# Transactions

Use:

```java
@Transactional
```

Only in service layer.

---

# Security

Use Spring Security.

Preferred authentication:

- JWT
- OAuth2
- OpenID Connect

Never:

- Hardcode secrets
- Store passwords in plain text

Always use:

```
BCryptPasswordEncoder
```

---

# REST API Standards

Plural resource names.

Good

```
GET /users

POST /users

GET /users/{id}

PUT /users/{id}

DELETE /users/{id}
```

Bad

```
GET /getUser

POST /createUser
```

---

# HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error

---

# Pagination

Always use Spring Pageable.

Example

```
GET /users?page=0&size=20&sort=name,asc
```

---

# OpenAPI

Every endpoint should include:

- Summary
- Description
- Response codes

---

# Testing

Use

- JUnit 5
- Mockito

Test:

- Services
- Controllers
- Utilities

Aim for high coverage on business logic.

---

# Maven

Use wrapper.

```
./mvnw clean verify
```

Never commit:

```
target/
```

---

# Docker

Provide:

- Dockerfile
- docker-compose.yml

Use multi-stage builds.

---

# Database

Use Flyway or Liquibase for migrations.

Never modify production schema manually.

---

# Configuration

Use:

```
application.yml
```

Profiles:

```
application-dev.yml

application-test.yml

application-prod.yml
```

---

# Code Style

- 4-space indentation
- UTF-8 encoding
- Maximum line length around 120 characters
- One class per file
- One public class per file

---

# Java 21 Features

Prefer modern Java features where appropriate:

- Records for immutable DTOs
- Pattern Matching
- Switch Expressions
- Text Blocks
- Local Variable Type Inference (`var`)
- Sequenced Collections (where applicable)

Avoid deprecated APIs.

---

# Spring Boot 4 Best Practices

- Use Spring Boot 4.1.0 conventions.
- Use virtual threads where appropriate for I/O-bound workloads.
- Prefer constructor binding for configuration properties.
- Keep auto-configuration customisations minimal.
- Leverage Spring Boot Actuator for health and metrics.
- Use Problem Details (RFC 9457) for API error responses where applicable.

---

# Performance

- Avoid N+1 queries.
- Fetch only required data.
- Use pagination for large datasets.
- Cache expensive operations when appropriate.
- Prefer asynchronous processing for long-running tasks.

---

# Git Commit Style

Use Conventional Commits.

Examples:

```
feat: add user registration

fix: resolve JWT validation issue

refactor: simplify order service

test: add user service tests

docs: update API documentation
```

---

# Pull Request Checklist

- Builds successfully
- Tests pass
- No compiler warnings
- No duplicated code
- No commented code
- API documented
- Validation added
- Error handling implemented
- Logging reviewed
- Security considerations addressed

---

# AI Agent Rules

When generating code, the AI agent MUST:

1. Target **Java 21** and **Spring Boot 4.1.0** exclusively.
2. Produce production-ready, compilable code.
3. Follow Clean Architecture and SOLID principles.
4. Generate DTOs instead of exposing entities.
5. Use constructor injection only.
6. Add validation annotations where applicable.
7. Include meaningful exception handling.
8. Generate JavaDoc for public classes and methods where beneficial.
9. Prefer immutable objects and records for DTOs.
10. Keep methods concise and single-purpose.
11. Avoid deprecated APIs and outdated Spring patterns.
12. Follow RESTful API conventions.
13. Ensure code is secure, maintainable, and testable.
14. Generate unit tests for service-layer business logic when requested.
15. Never invent dependencies or APIs that do not exist in Java 21 or Spring Boot 4.x.

---

# Goal

Every generated contribution should be **production-ready, secure, readable, maintainable, testable, and aligned with modern Java 21 and Spring Boot 4 best practices.*