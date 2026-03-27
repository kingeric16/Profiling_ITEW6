import api from '../../api'

export interface Student {
  id: number
  student_number: string
  first_name: string
  middle_name?: string
  last_name: string
  gender: 'male' | 'female' | 'other'
  birthdate: string
  email: string
  contact_number: string
  guardian_name: string
  guardian_contact: string
  height?: number
  weight?: number
  bmi?: number
  course_id: number
  section_id: number
  year_level: number
  overall_gpa?: number
  course?: {
    id: number
    course_code: string
    course_name: string
    department: string
  }
  section?: {
    id: number
    section_name: string
    year_level: number
  }
  skills?: StudentSkill[]
  affiliations?: StudentAffiliation[]
  violations?: StudentViolation[]
  medicalHistory?: StudentMedicalHistory[]
  academicHistory?: StudentAcademicHistory[]
  nonAcademicHistory?: StudentNonAcademicHistory[]
}

export interface StudentSkill {
  id: number
  student_id: number
  skill_id: number
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  skill?: {
    id: number
    skill_name: string
    skill_category: string
  }
}

export interface StudentAffiliation {
  id: number
  student_id: number
  organization_name: string
  role: string
  status: 'active' | 'inactive' | 'graduated'
}

export interface StudentViolation {
  id: number
  student_id: number
  violation_type: string
  severity_level: 'minor' | 'major' | 'critical'
  violation_date: string
  clearance_status: 'pending' | 'cleared' | 'revoked'
  description?: string
}

export interface StudentMedicalHistory {
  id: number
  student_id: number
  medical_condition?: string
  allergies?: string
  medications?: string
  last_checkup_date?: string
  notes?: string
}

export interface StudentAcademicHistory {
  id: number
  student_id: number
  subject_id: number
  grade: number
  semester: 'first' | 'second' | 'summer'
  school_year: string
  subject?: {
    id: number
    subject_code: string
    subject_name: string
    units: number
  }
}

export interface StudentNonAcademicHistory {
  id: number
  student_id: number
  event_id: number
  role: string
  result: 'participated' | 'winner' | 'finalist' | 'participant'
  achievements?: string
  event?: {
    id: number
    event_name: string
    category: 'sports' | 'academic' | 'cultural'
    event_date: string
    location: string
  }
}

export interface CreateStudentRequest {
  student_number: string
  first_name: string
  middle_name?: string
  last_name: string
  gender: 'male' | 'female' | 'other'
  birthdate: string
  email: string
  contact_number: string
  guardian_name: string
  guardian_contact: string
  height?: number
  weight?: number
  course_id: number
  section_id: number
  year_level: number
  overall_gpa?: number
}

export interface StudentFilters {
  course_id?: number
  year_level?: number
  skill?: string
  min_gpa?: number
  no_violations?: boolean
}

class StudentService {
  async getStudents(filters?: StudentFilters): Promise<{ students: Student[] }> {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }

    const response = await api.get(`/api/students?${params.toString()}`)
    return response.data
  }

  async getStudent(id: number): Promise<{ student: Student }> {
    const response = await api.get(`/api/students/${id}`)
    return response.data
  }

  async createStudent(student: CreateStudentRequest): Promise<{ student: Student; message: string }> {
    const response = await api.post('/api/students', student)
    return response.data
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<{ student: Student; message: string }> {
    const response = await api.put(`/api/students/${id}`, student)
    return response.data
  }

  async deleteStudent(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/students/${id}`)
    return response.data
  }
}

export default new StudentService()
