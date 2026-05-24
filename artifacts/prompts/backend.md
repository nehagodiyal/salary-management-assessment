
# BACKEND REASONS

# Requirements
- JWT authentication
- Employee CRUD APIs
- Analytics APIs
- Validation
- Repository pattern
- Service layer
- Fast queries for 10k employees

# Stack
- FastAPI
- SQLAlchemy
- PostgreSQL
- Pydantic
- Alembic
- PyJWT
- Passlib

# Folder Structure

backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── middleware/
│   ├── models/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   ├── utils/
│   └── tests/

# MVC Mapping
- Controller -> api/
- Service -> services/
- Repository -> repositories/
- Model -> models/

# Authentication

## JWT Flow
1. User login
2. Validate credentials
3. Generate access token
4. Generate refresh token
5. Return token pair

# JWT Claims
- user_id
- email
- role
- exp

# APIs

## Auth
POST /auth/login
POST /auth/refresh

## Employees
GET /employees
POST /employees
PUT /employees/{id}
DELETE /employees/{id}

## Analytics
GET /analytics/dashboard
GET /analytics/country
GET /analytics/job-title

# Analytics Metrics
- Avg salary
- Min salary
- Max salary
- Median salary
- Employee count
- Highest paying country
- Highest paying role

# Repository Pattern

EmployeeRepository
- create()
- update()
- delete()
- get_by_id()
- get_all()

AnalyticsRepository
- avg_salary_by_country()
- avg_salary_by_title()

# Services
- AuthService
- EmployeeService
- AnalyticsService

# Middleware
- Logging
- Error handling
- JWT auth middleware

# Performance
- DB indexing
- Pagination
- Aggregation queries
- Batch inserts

# Backend Test Cases

## Auth
- Valid login
- Invalid login
- Expired JWT
- Unauthorized route access

## Employee APIs
- Create employee
- Update employee
- Delete employee
- Invalid salary validation
- Pagination test

## Analytics APIs
- Average salary test
- Country aggregation test
- Job title aggregation test

## Repository Tests
- CRUD operations
- Query correctness

## Service Tests
- Business logic validation
- Exception handling

# TDD Workflow
1. Create test
2. Fail test
3. Minimal implementation
4. Refactor

# Safeguards
- No SQL in routes
- Service layer mandatory
- Repository abstraction required
