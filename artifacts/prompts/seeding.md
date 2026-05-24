
# SEEDING REASONS

# Goal
Generate 10,000 employees efficiently.

# Files
scripts/
├── seed.py
├── first_names.txt
├── last_names.txt
├── countries.txt
└── job_titles.txt

# Seeding Flow
1. Load txt files
2. Generate random combinations
3. Create bulk payload
4. Batch insert
5. Commit transaction

# Generated Fields
- full_name
- email
- country
- salary
- department
- job_title

# Performance Rules
- Batch inserts
- Avoid row inserts
- Commit every 1000 records

# Batch Strategy
Chunk Size = 1000

# Randomization
- Faker optional
- Country distribution
- Salary range by role

# Sample Salary Range
- Engineer -> 50k - 120k
- Manager -> 100k - 200k

# Seeder Test Cases
- 10k records inserted
- Unique emails
- Execution time validation
- Rollback test

# Safeguards
- Prevent duplicate email
- Transaction rollback on failure
