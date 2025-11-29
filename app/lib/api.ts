const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Export the base URL for direct fetch calls
export const getApiUrl = (endpoint: string) => `${API_URL}${endpoint}`;

// Helper to convert relative document URLs to full backend URLs
export const getDocumentUrl = (url: string) => {
  // If URL already includes http/https, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If relative path, prepend backend URL
  return `${API_URL}${url}`;
};

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_URL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return { response, data };
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async investorLogin(email: string, password: string) {
    return this.request('/api/auth/investor-login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Investors
  async getInvestors() {
    return this.request('/api/investors');
  }

  async getInvestor(id: string | number) {
    return this.request(`/api/investors/${id}`);
  }

  async createInvestor(data: any) {
    return this.request('/api/investors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvestor(id: string | number, data: any) {
    return this.request(`/api/investors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvestor(id: string | number) {
    return this.request(`/api/investors/${id}`, {
      method: 'DELETE',
    });
  }

  async changePassword(id: string | number, newPassword: string) {
    return this.request(`/api/investors/${id}/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    });
  }

  // Documents
  async getDocuments(investorId: string | number) {
    return this.request(`/api/investors/${investorId}/documents`);
  }

  async addDocument(investorId: string | number, data: any) {
    return this.request(`/api/investors/${investorId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(investorId: string | number, documentId: string | number) {
    return this.request(`/api/investors/${investorId}/documents?documentId=${documentId}`, {
      method: 'DELETE',
    });
  }

  // Upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}/api/upload`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type, let browser set it with boundary
    });

    const data = await response.json();
    return { response, data };
  }

  // Newsletter
  async sendNewsletter(data: any) {
    return this.request('/api/newsletter/send', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNewsletterHistory() {
    return this.request('/api/newsletter/history');
  }

  async getNewsletter(id: string | number) {
    return this.request(`/api/newsletter/${id}`);
  }
}

export const api = new ApiService();
export default api;
