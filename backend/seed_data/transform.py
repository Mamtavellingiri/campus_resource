"""
Transform Kaggle Students/Teachers data into an engineering-college
booking-system schema:
    years, subjects, students, teachers, teacher_subject_year

Run:
    python3 transform.py
Outputs (in ./output/):
    students.csv, teachers.csv, subjects.csv, years.csv,
    teacher_subject_year.csv, seed_data.sql
"""

import csv
import os

IN_DIR = "."
OUT_DIR = "./output"
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------------------------------------------------------------
# 1. YEARS (four-year engineering program)
# ---------------------------------------------------------------------
YEARS = [
    {"year_id": 1, "year_name": "1st Year"},
    {"year_id": 2, "year_name": "2nd Year"},
    {"year_id": 3, "year_name": "3rd Year"},
    {"year_id": 4, "year_name": "4th Year"},
]

# ---------------------------------------------------------------------
# 2. ENGINEERING SUBJECTS, grouped by year
#    (replaces the generic Kaggle Mathematics/English/Science/etc.)
# ---------------------------------------------------------------------
SUBJECTS_BY_YEAR = {
    1: [
        "Engineering Mathematics",
        "Engineering Physics",
        "Basic Electrical Engineering",
        "Programming in C",
        "Engineering Chemistry",
    ],
    2: [
        "Data Structures",
        "Digital Logic Design",
        "Object Oriented Programming",
        "Discrete Mathematics",
        "Electronic Devices and Circuits",
    ],
    3: [
        "Operating Systems",
        "Database Management Systems",
        "Computer Networks",
        "Software Engineering",
        "Compiler Design",
    ],
    4: [
        "Artificial Intelligence",
        "Cloud Computing",
        "Cyber Security",
        "Machine Learning",
        "Major Project",
    ],
}

subjects = []
subject_id = 1
subject_id_by_name = {}
for yr, names in SUBJECTS_BY_YEAR.items():
    for name in names:
        subjects.append({"subject_id": subject_id, "subject_name": name})
        subject_id_by_name[name] = subject_id
        subject_id += 1

# ---------------------------------------------------------------------
# 3. STUDENTS -- read Kaggle Students_raw.csv, keep name/email,
#    assign year_id (round-robin across 3 years) and a section
# ---------------------------------------------------------------------
students = []
with open(os.path.join(IN_DIR, "Students_raw.csv"), newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        year_id = (i % 4) + 1          # distribute evenly across 4 years
        section = "A" if (i % 8) < 4 else "B"   # split each year into A/B
        students.append({
            "student_id": row["StudentID"],
            "name": f'{row["FirstName"]} {row["LastName"]}',
            "email": row["Email"],
            "contact_number": row["ContactNumber"],
            "year_id": year_id,
            "section": section,
        })

# ---------------------------------------------------------------------
# 4. TEACHERS -- read Kaggle Teachers_raw.csv, keep name/email,
#    assign department, and give each teacher 2-3 (year, subject) pairs
# ---------------------------------------------------------------------
teachers = []
teacher_subject_year = []
tsy_id = 1

with open(os.path.join(IN_DIR, "Teachers_raw.csv"), newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    teacher_rows = list(reader)

for i, row in enumerate(teacher_rows):
    teachers.append({
        "teacher_id": row["TeacherID"],
        "name": f'{row["FirstName"]} {row["LastName"]}',
        "email": row["Email"],
        "contact_number": row["ContactNumber"],
        "department": "Computer Science Engineering",
    })

    # Assign this teacher ONE subject per year for all 4 years,
    # cycling through that year's subject list so every subject
    # eventually gets a teacher. Mirrors the "Dr. Sasikala" example:
    # one teacher, different subject each year.
    for yr in (1, 2, 3, 4):
        subj_list = SUBJECTS_BY_YEAR[yr]
        subj_name = subj_list[i % len(subj_list)]
        teacher_subject_year.append({
            "id": tsy_id,
            "teacher_id": row["TeacherID"],
            "subject_id": subject_id_by_name[subj_name],
            "year_id": yr,
        })
        tsy_id += 1

# ---------------------------------------------------------------------
# 5. WRITE CSV OUTPUTS
# ---------------------------------------------------------------------
def write_csv(filename, rows, fieldnames):
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"Wrote {path} ({len(rows)} rows)")

write_csv("years.csv", YEARS, ["year_id", "year_name"])
write_csv("subjects.csv", subjects, ["subject_id", "subject_name"])
write_csv("students.csv", students,
          ["student_id", "name", "email", "contact_number", "year_id", "section"])
write_csv("teachers.csv", teachers,
          ["teacher_id", "name", "email", "contact_number", "department"])
write_csv("teacher_subject_year.csv", teacher_subject_year,
          ["id", "teacher_id", "subject_id", "year_id"])

# ---------------------------------------------------------------------
# 6. WRITE SQL INSERT STATEMENTS (adjust table/column names to match
#    your actual project schema before running)
# ---------------------------------------------------------------------
def esc(val):
    return str(val).replace("'", "''")

sql_lines = []

sql_lines.append("-- YEARS")
for y in YEARS:
    sql_lines.append(
        f"INSERT INTO years (year_id, year_name) VALUES "
        f"({y['year_id']}, '{esc(y['year_name'])}');"
    )

sql_lines.append("\n-- SUBJECTS")
for s in subjects:
    sql_lines.append(
        f"INSERT INTO subjects (subject_id, subject_name) VALUES "
        f"({s['subject_id']}, '{esc(s['subject_name'])}');"
    )

sql_lines.append("\n-- TEACHERS")
for t in teachers:
    sql_lines.append(
        f"INSERT INTO teachers (teacher_id, name, email, contact_number, department) VALUES "
        f"({t['teacher_id']}, '{esc(t['name'])}', '{esc(t['email'])}', "
        f"'{esc(t['contact_number'])}', '{esc(t['department'])}');"
    )

sql_lines.append("\n-- STUDENTS")
for s in students:
    sql_lines.append(
        f"INSERT INTO students (student_id, name, email, contact_number, year_id, section) VALUES "
        f"({s['student_id']}, '{esc(s['name'])}', '{esc(s['email'])}', "
        f"'{esc(s['contact_number'])}', {s['year_id']}, '{esc(s['section'])}');"
    )

sql_lines.append("\n-- TEACHER_SUBJECT_YEAR (teacher's booking-eligible year+subject pairs)")
for ts in teacher_subject_year:
    sql_lines.append(
        f"INSERT INTO teacher_subject_year (id, teacher_id, subject_id, year_id) VALUES "
        f"({ts['id']}, {ts['teacher_id']}, {ts['subject_id']}, {ts['year_id']});"
    )

sql_path = os.path.join(OUT_DIR, "seed_data.sql")
with open(sql_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))
print(f"Wrote {sql_path} ({len(sql_lines)} lines)")
