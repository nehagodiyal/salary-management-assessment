
# SQLITE REASONS

# Database Design

## employees

| Column | Type |
|---|---|
| id | UUID |
| first_name | TEXT |
| last_name | TEXT |
| full_name | TEXT |
| email | TEXT |
| phone | TEXT |
| country | TEXT |
| department | TEXT |
| job_title | TEXT |
| salary | INTEGER |
| created_at | DATETIME |
| updated_at | DATETIME |

## users

| Column | Type |
|---|---|
| id | UUID |
| email | TEXT |
| password_hash | TEXT |
| role | TEXT |

# Indexes

CREATE INDEX idx_country ON employees(country);
CREATE INDEX idx_job_title ON employees(job_title);
CREATE INDEX idx_salary ON employees(salary);

# Constraints
- Email unique
- Salary > 0
- Country NOT NULL

# Query Optimization
- Indexed fields
- Aggregation queries
- Bulk inserts

# Analytics Queries

## Average Salary
SELECT AVG(salary) FROM employees;

## Country Metrics
SELECT country, AVG(salary), MIN(salary), MAX(salary)
FROM employees
GROUP BY country;

## Job Title Metrics
SELECT country, job_title, AVG(salary)
FROM employees
GROUP BY country, job_title;

# Migration
- Alembic migrations
- Version controlled schema

# Database Test Cases
- Constraint validation
- Index validation
- Query performance
- Transaction rollback
