// Admin Data Management
class AdminDataManager {
    constructor() {
        this.submissionsKey = 'scienceHub_submissions';
        this.initializeSampleData();
    }

    // Initialize with sample data for testing
    initializeSampleData() {
        let submissions = this.getAllSubmissions();
        
        if (submissions.length === 0) {
            submissions = [
                {
                    id: 'sample_1',
                    teacherName: 'Dr. John Smith',
                    teacherEmail: 'john.smith@example.com',
                    materialTitle: 'Physics Class 12 Complete Notes',
                    materialDescription: 'Complete physics notes for class 12 covering all chapters with diagrams and solved examples.',
                    materialSubject: 'physics',
                    materialClass: '12',
                    materialYear: '2024',
                    materialLanguage: 'english',
                    resourceType: 'pdf',
                    cloudLink: 'https://drive.google.com/file/sample1',
                    submittedAt: '2024-01-15T10:30:00Z',
                    status: 'pending',
                    fileInfo: {
                        name: 'physics_12_notes.pdf',
                        size: 15800000,
                        sizeFormatted: '15.1 MB',
                        type: 'application/pdf'
                    },
                    pages: 85
                },
                {
                    id: 'sample_2',
                    teacherName: 'Prof. Sarah Johnson',
                    teacherEmail: 'sarah.j@example.com',
                    materialTitle: 'Chemistry Organic Reactions Video Series',
                    materialDescription: 'A comprehensive video series explaining organic chemistry reactions with animations.',
                    materialSubject: 'chemistry',
                    materialClass: '11',
                    materialYear: '2024',
                    materialLanguage: 'english',
                    resourceType: 'video',
                    cloudLink: 'https://youtube.com/playlist/sample',
                    submittedAt: '2024-01-14T14:20:00Z',
                    status: 'pending',
                    fileInfo: {
                        name: 'organic_chemistry_videos.zip',
                        size: 320000000,
                        sizeFormatted: '305 MB',
                        type: 'application/zip'
                    },
                    duration: '10 hours',
                    platform: 'YouTube'
                },
                {
                    id: 'sample_3',
                    teacherName: 'Dr. Robert Chen',
                    teacherEmail: 'r.chen@example.com',
                    materialTitle: 'Biology Diagrams Collection',
                    materialDescription: 'High-quality biology diagrams for class 12 students.',
                    materialSubject: 'biology',
                    materialClass: '12',
                    materialYear: '2023',
                    materialLanguage: 'english',
                    resourceType: 'notes',
                    cloudLink: null,
                    submittedAt: '2024-01-13T09:15:00Z',
                    status: 'approved',
                    fileInfo: {
                        name: 'biology_diagrams.pdf',
                        size: 8500000,
                        sizeFormatted: '8.1 MB',
                        type: 'application/pdf'
                    },
                    pages: 45,
                    adminNotes: 'Excellent quality diagrams. Approved for publishing.',
                    approvedAt: '2024-01-14T11:30:00Z',
                    githubUrl: 'https://github.com/science-hub/biology-diagrams'
                }
            ];
            
            localStorage.setItem(this.submissionsKey, JSON.stringify(submissions));
        }
    }

    getAllSubmissions() {
        const submissions = localStorage.getItem(this.submissionsKey);
        return submissions ? JSON.parse(submissions) : [];
    }

    getSubmissionsByStatus(status) {
        const submissions = this.getAllSubmissions();
        return submissions.filter(s => s.status === status);
    }

    updateSubmission(id, updates) {
        const submissions = this.getAllSubmissions();
        const index = submissions.findIndex(s => s.id === id);
        
        if (index !== -1) {
            submissions[index] = { ...submissions[index], ...updates };
            localStorage.setItem(this.submissionsKey, JSON.stringify(submissions));
            return true;
        }
        
        return false;
    }

    deleteSubmission(id) {
        const submissions = this.getAllSubmissions();
        const filtered = submissions.filter(s => s.id !== id);
        localStorage.setItem(this.submissionsKey, JSON.stringify(filtered));
        return filtered.length < submissions.length;
    }

    getStats() {
        const submissions = this.getAllSubmissions();
        
        return {
            total: submissions.length,
            pending: submissions.filter(s => s.status === 'pending').length,
            approved: submissions.filter(s => s.status === 'approved').length,
            rejected: submissions.filter(s => s.status === 'rejected').length
        };
    }

    // Get unique values for filters
    getUniqueSubjects() {
        const submissions = this.getAllSubmissions();
        const subjects = new Set(submissions.map(s => s.materialSubject));
        return Array.from(subjects).filter(Boolean);
    }

    getUniqueClasses() {
        const submissions = this.getAllSubmissions();
        const classes = new Set(submissions.map(s => s.materialClass));
        return Array.from(classes).filter(Boolean);
    }

    getUniqueTypes() {
        const submissions = this.getAllSubmissions();
        const types = new Set(submissions.map(s => s.resourceType));
        return Array.from(types).filter(Boolean);
    }
}

// Initialize admin data manager
window.AdminDataManager = new AdminDataManager();
