import * as Yup from 'yup';
import { EMPLOYMENT_STATUS } from '@/config/constants';

const SALARY_MIN = 1;
const SALARY_MAX = 100_000_000;

export const employeeValidationSchema = Yup.object({
  full_name: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters')
    .required('Full name is required'),
  email: Yup.string()
    .trim()
    .email('Enter a valid email')
    .required('Email is required'),
  phone: Yup.string().nullable().max(32, 'Phone is too long'),
  country: Yup.string().trim().min(1).max(100).required('Country is required'),
  department: Yup.string().trim().min(1).max(100).required('Department is required'),
  job_title: Yup.string().trim().min(1).max(150).required('Job title is required'),
  salary: Yup.number()
    .typeError('Salary must be a number')
    .integer('Salary must be a whole number')
    .min(SALARY_MIN, `Salary must be at least ${SALARY_MIN}`)
    .max(SALARY_MAX, 'Salary is too large')
    .required('Salary is required'),
  hire_date: Yup.string().required('Hire date is required'),
  status: Yup.string()
    .oneOf(Object.values(EMPLOYMENT_STATUS))
    .required('Status is required'),
});

export const employeeInitialValues = {
  full_name: '',
  email: '',
  phone: '',
  country: '',
  department: '',
  job_title: '',
  salary: '',
  hire_date: '',
  status: EMPLOYMENT_STATUS.ACTIVE,
};

export const toFormValues = (employee) => ({
  full_name: employee?.full_name || '',
  email: employee?.email || '',
  phone: employee?.phone || '',
  country: employee?.country || '',
  department: employee?.department || '',
  job_title: employee?.job_title || '',
  salary: employee?.salary ?? '',
  hire_date: employee?.hire_date || '',
  status: employee?.status || EMPLOYMENT_STATUS.ACTIVE,
});

export const toApiPayload = (values) => ({
  ...values,
  phone: values.phone || null,
  salary: Number(values.salary),
});
