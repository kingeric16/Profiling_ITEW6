# Member B Implementation Plan

## Student Grades & Transcript Page

**Assigned to:** Member B  
**Status:** 🔄 In Progress  
**Estimated Time:** 3-4 days

---

## 📋 What You're Building

Create a **Grades & Transcript Page** where students can:

- View all their past grades organized by school year and semester
- See their GPA for each semester
- View their overall GPA trend
- Export their transcript (optional enhancement)

---

## ✅ What's Already Done (You Can Use These)

### Backend API Endpoint

- **Endpoint:** `GET /api/students/{student}/academic-history`
- **Already exists and working!** ✅
- Returns all grade records for a student

### Sample Data Available

- Jane Student (test account) has **8 grade records**
- Covers Year 1 and Year 2
- Grades range from 1.5 to 2.0
- Includes semester and school year information

### Test Account

- **Email:** `student@ccs.edu`
- **Password:** `password`

---

## 🎯 Step-by-Step Implementation Guide

### Step 1: Create the New Page File

**File to create:** `frontend/src/ui/pages/student/StudentGrades.tsx`

**What to include:**

```typescript
import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../DashboardLayout';
import { api } from '../../../api';
import { pageCache } from '../../pageCache';

// Define your data types
interface AcademicRecord {
  subject_name: string;
  grade: number;
  semester: string;
  school_year: string;
  units?: number;
}

export function StudentGrades() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AcademicRecord[]>([]);

  // Your code here...

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Grades & Transcript</h1>
        <p>View your academic performance history</p>
      </div>

      {/* Your content here */}
    </DashboardLayout>
  );
}
```

---

### Step 2: Fetch the Data

**Add this inside your component:**

```typescript
useEffect(() => {
  const fetchGrades = async () => {
    try {
      setLoading(true);

      // Check cache first
      const cached = pageCache.get("student-grades");
      if (cached) {
        setRecords(cached);
        setLoading(false);
        return;
      }

      // Get current student ID
      const meResponse = await api.get("/students/me");
      const studentId = meResponse.data.student.id;

      // Fetch academic history
      const response = await api.get(`/students/${studentId}/academic-history`);
      const data = response.data.academicHistory || [];

      setRecords(data);
      pageCache.set("student-grades", data, 120); // Cache for 2 minutes
    } catch (error) {
      console.error("Failed to fetch grades:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchGrades();
}, []);
```

---

### Step 3: Organize Data by School Year and Semester

**Add this helper function:**

```typescript
// Group records by school year and semester
const groupedRecords = records.reduce(
  (acc, record) => {
    const key = `${record.school_year}-${record.semester}`;
    if (!acc[key]) {
      acc[key] = {
        schoolYear: record.school_year,
        semester: record.semester,
        records: [],
      };
    }
    acc[key].records.push(record);
    return acc;
  },
  {} as Record<
    string,
    { schoolYear: string; semester: string; records: AcademicRecord[] }
  >,
);

// Convert to array and sort (newest first)
const sortedGroups = Object.values(groupedRecords).sort((a, b) => {
  if (a.schoolYear !== b.schoolYear) {
    return b.schoolYear.localeCompare(a.schoolYear);
  }
  return b.semester.localeCompare(a.semester);
});
```

---

### Step 4: Calculate GPA per Semester

**Add this helper function:**

```typescript
const calculateGPA = (records: AcademicRecord[]) => {
  if (records.length === 0) return 0;
  const sum = records.reduce((acc, r) => acc + Number(r.grade), 0);
  return (sum / records.length).toFixed(2);
};
```

---

### Step 5: Display the Data

**Create an expandable accordion layout:**

```typescript
return (
  <DashboardLayout>
    <div className="page-header">
      <h1>Grades & Transcript</h1>
      <p>View your academic performance history</p>
    </div>

    {loading ? (
      <div>Loading grades...</div>
    ) : (
      <div className="content-grid">
        {/* Overall GPA Card */}
        <div className="card">
          <div className="card-header">
            <h2>Overall GPA</h2>
          </div>
          <div className="card-body">
            <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#16a34a' }}>
              {calculateGPA(records)}
            </div>
            <p>Based on {records.length} subjects</p>
          </div>
        </div>

        {/* Grades by Semester */}
        {sortedGroups.map((group, idx) => (
          <div key={idx} className="card">
            <div className="card-header">
              <h3>{group.semester} - {group.schoolYear}</h3>
              <span className="badge-soft green">
                GPA: {calculateGPA(group.records)}
              </span>
            </div>
            <div className="card-body">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.records.map((record, i) => (
                    <tr key={i}>
                      <td>{record.subject_name}</td>
                      <td>{Number(record.grade).toFixed(2)}</td>
                      <td>
                        <span className={`badge-soft ${Number(record.grade) >= 3.0 ? 'red' : 'green'}`}>
                          {Number(record.grade) >= 3.0 ? 'Failed' : 'Passed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    )}
  </DashboardLayout>
);
```

---

### Step 6: Add Route to App.tsx

**File to modify:** `frontend/src/ui/App.tsx`

**Add these lines:**

1. Import the component (around line 21):

```typescript
import { StudentGrades } from "./pages/student/StudentGrades";
```

2. Add the route (around line 47):

```typescript
<Route path="/student/grades" element={<StudentGrades />} />
```

---

### Step 7: Add Sidebar Link

**File to modify:** `frontend/src/ui/DashboardLayout.tsx`

**Find the student sidebar links (around line 62) and add:**

```typescript
{ key: 'grades', label: 'Grades', to: '/student/grades', icon: '📊' }
```

---

## 🎨 Styling Tips

Use existing CSS classes from `style.css`:

- `.page-header` - Page title section
- `.content-grid` - Grid layout for cards
- `.card` - Card container
- `.card-header` - Card title section
- `.card-body` - Card content
- `.data-table` - Table styling
- `.badge-soft` with `green`, `amber`, or `red` - Status badges

---

## 🧪 Testing Checklist

### Test 1: Page Loads

- [ ] Navigate to `/student/grades`
- [ ] Page loads without errors
- [ ] Loading state shows briefly
- [ ] Data appears after loading

### Test 2: Data Display

- [ ] Overall GPA shows correctly
- [ ] Grades are grouped by semester
- [ ] Each semester shows its own GPA
- [ ] Grades are sorted (newest first)
- [ ] All 8 grade records appear

### Test 3: Grade Status

- [ ] Grades below 3.0 show "Passed" (green badge)
- [ ] Grades 3.0 and above show "Failed" (red badge)
- [ ] Grade numbers show 2 decimal places

### Test 4: Navigation

- [ ] Sidebar link works
- [ ] Can navigate back to dashboard
- [ ] Page caching works (fast reload)

---

## 🚀 Optional Enhancements (If You Have Time)

### 1. GPA Trend Chart

Add a simple line chart showing GPA over time:

- Use a library like `recharts` or `chart.js`
- X-axis: Semesters
- Y-axis: GPA

### 2. Export to PDF

Add a button to download transcript:

- Use `jspdf` library
- Format as official transcript
- Include student info and all grades

### 3. Filter by Year

Add dropdown to filter by specific year level

### 4. Search Subjects

Add search box to find specific subjects

---

## 📁 Files You'll Work With

### New Files (Create These)

- `frontend/src/ui/pages/student/StudentGrades.tsx` - Main page component

### Modified Files (Edit These)

- `frontend/src/ui/App.tsx` - Add route
- `frontend/src/ui/DashboardLayout.tsx` - Add sidebar link

---

## 🔍 Common Issues & Solutions

### Issue: "Cannot read property 'id' of undefined"

**Solution:** Make sure to check if data exists before accessing:

```typescript
const studentId = meResponse.data?.student?.id;
if (!studentId) return;
```

### Issue: Grades not showing

**Solution:** Check the API response structure:

```typescript
console.log("API Response:", response.data);
```

### Issue: GPA calculation wrong

**Solution:** Make sure to convert grades to numbers:

```typescript
const sum = records.reduce((acc, r) => acc + Number(r.grade), 0);
```

---

## 💡 Tips for Success

1. **Start Simple** - Get basic display working first, then add features
2. **Test Often** - Check your work in the browser after each step
3. **Use Console Logs** - Debug by logging data to see what you're getting
4. **Copy Patterns** - Look at `StudentSchedule.tsx` for similar patterns
5. **Ask Questions** - If stuck, check the Member A summary or ask for help

---

## 📞 Need Help?

- Check `StudentSchedule.tsx` for similar implementation patterns
- Review `StudentDashboard.tsx` for data fetching examples
- Look at `style.css` for available CSS classes
- Test with the student account: `student@ccs.edu` / `password`

---

## ✅ Definition of Done

Your implementation is complete when:

- [ ] Page loads without errors
- [ ] All grades display correctly
- [ ] GPA calculations are accurate
- [ ] Grades are grouped by semester
- [ ] Navigation works from sidebar
- [ ] Page follows existing design patterns
- [ ] Code is clean and commented
- [ ] All tests pass

---

**Good luck! You've got this! 🚀**

**Estimated completion time:** 3-4 days  
**Last Updated:** March 27, 2026
