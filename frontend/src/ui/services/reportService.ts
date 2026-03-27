import api from '../../api'
import type { Student } from './studentService'

export interface ReportResponse {
  report_name: string
  students: Student[]
  filters?: Record<string, any>
}

export interface CustomReportFilters {
  skills?: string
  min_gpa?: number
  course_id?: number
  year_level?: number
  no_violations?: boolean
  min_height?: number
}

class ReportService {
  async getBasketballTryouts(): Promise<ReportResponse> {
    const response = await api.get('/api/reports/basketball-tryouts')
    return response.data
  }

  async getProgrammingContest(): Promise<ReportResponse> {
    const response = await api.get('/api/reports/programming-contest')
    return response.data
  }

  async getLeadershipSkills(): Promise<ReportResponse> {
    const response = await api.get('/api/reports/leadership-skills')
    return response.data
  }

  async getNoViolations(): Promise<ReportResponse> {
    const response = await api.get('/api/reports/no-violations')
    return response.data
  }

  async getTopPerforming(): Promise<ReportResponse> {
    const response = await api.get('/api/reports/top-performing')
    return response.data
  }

  async getCustomReport(filters: CustomReportFilters): Promise<ReportResponse> {
    const response = await api.post('/api/reports/custom', filters)
    return response.data
  }
}

export default new ReportService()
