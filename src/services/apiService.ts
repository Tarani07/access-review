// API Service for Sparrow Vision IGA Platform
import { apiRequest, API_ENDPOINTS } from '../config/api';

export class ApiService {
  // Authentication
  static async login(email: string, password: string) {
    return apiRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(userData: any) {
    return apiRequest(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  static async getProfile() {
    return apiRequest(API_ENDPOINTS.PROFILE);
  }

  static async updateProfile(profileData: any) {
    return apiRequest(API_ENDPOINTS.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  static async logout() {
    return apiRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  }

  static async verifyToken() {
    return apiRequest(API_ENDPOINTS.VERIFY);
  }

  // Dashboard
  static async getDashboardStats() {
    return apiRequest(API_ENDPOINTS.DASHBOARD_STATS);
  }

  static async getAuditLogs(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(API_ENDPOINTS.DASHBOARD_AUDIT_LOGS + queryString);
  }

  static async getRiskAssessment() {
    return apiRequest(API_ENDPOINTS.DASHBOARD_RISK_ASSESSMENT);
  }

  // Users
  static async getUsers(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(API_ENDPOINTS.USERS + queryString);
  }

  // Roles
  static async getRoles() {
    return apiRequest(API_ENDPOINTS.ROLES);
  }

  // Audit
  static async getAuditLogs(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(API_ENDPOINTS.AUDIT_LOGS + queryString);
  }

  // Policies
  static async getPolicies() {
    return apiRequest(API_ENDPOINTS.POLICIES);
  }

  static async getPolicyViolations(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(API_ENDPOINTS.POLICY_VIOLATIONS + queryString);
  }

  // Health
  static async getHealth() {
    return apiRequest(API_ENDPOINTS.HEALTH);
  }
}

export default ApiService;
