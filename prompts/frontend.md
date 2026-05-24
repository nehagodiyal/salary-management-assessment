
# FRONTEND REASONS

# Requirements
- Login authentication with JWT
- Employee CRUD pages
- Analytics dashboard
- Search/filter/pagination
- Responsive design
- Reusable UI components
- Error handling
- Protected routes

# Tech Stack
- React.js
- Vite
- Material UI
- Axios
- React Query
- React Router
- Formik + Yup
- Recharts

# Folder Structure

src/
├── api/
├── assets/
├── components/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── store/
├── styles/
├── utils/
└── tests/

# MVC Mapping
- View -> components/pages
- Controller -> hooks/services
- Model -> DTOs/types

# Pages
- LoginPage
- DashboardPage
- EmployeesPage
- EmployeeCreatePage
- EmployeeEditPage
- AnalyticsPage

# Components
- EmployeeTable
- EmployeeForm
- SalaryCards
- CountryChart
- SalaryTrendChart
- Pagination
- Header
- Sidebar
- ProtectedRoute

# API Integration
- JWT token stored in memory/localStorage
- Axios interceptor for auth
- Automatic token attach
- Refresh token strategy

# State Management
- React Query
- Local component state

# Validation Rules
- Name required
- Salary > 0
- Country required
- Email unique

# Performance
- Pagination
- Debounced search
- Memoized components
- Lazy routes

# Frontend Test Cases

## Authentication
- Login success
- Invalid credentials
- Token storage
- Protected route redirect

## Employee
- Add employee
- Edit employee
- Delete employee
- Validation errors
- Pagination rendering

## Analytics
- Average salary rendering
- Country filtering
- Chart rendering

# TDD Rules
- Write failing test first
- Implement minimal logic
- Refactor after passing

# Safeguards
- No business logic in UI
- No direct fetch calls in components
- Reusable hooks mandatory
