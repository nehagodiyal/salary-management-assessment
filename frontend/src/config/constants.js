export const TOKEN_STORAGE_KEY = 'sm.accessToken';
export const REFRESH_TOKEN_STORAGE_KEY = 'sm.refreshToken';
export const USER_STORAGE_KEY = 'sm.user';

export const ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
});

export const EMPLOYMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated',
});

export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'terminated', label: 'Terminated' },
];

export const SORT_FIELDS = Object.freeze({
  FULL_NAME: 'full_name',
  SALARY: 'salary',
  HIRE_DATE: 'hire_date',
  COUNTRY: 'country',
  DEPARTMENT: 'department',
  CREATED_AT: 'created_at',
});

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
