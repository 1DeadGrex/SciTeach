// GitHub Integration for Approved Materials
class GitHubIntegration {
    constructor() {
        this.config = {
            username: 'your-github-username',
            repo: 'science-hub-content',
            branch: 'main',
            token: 'your-github-token'
        };
        
        this.baseUrls = {
            pdf: '/docs/pdf/',
            notes: '/docs/handpdf/',
            video: '/docs/videos/',
            course: '/docs/courses/'
        };
    }

    // Add approved material to GitHub
    async addMaterialToRepo(materialData, fileContent) {
        const type = materialData.resourceType;
        const path = `${this.baseUrls[type]}${this.sanitizeFilename(materialData.materialTitle)}.${this.getFileExtension(type)}`;
        
        const commitMessage = `Add ${type}: ${materialData.materialTitle}`;
        
        const content = type === 'video' || type === 'course' 
            ? JSON.stringify(this.createMetadata(materialData, fileContent), null, 2)
            : fileContent;
        
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        try {
            // Create or update file
            const response = await fetch(`https://api.github.com/repos/${this.config.username}/${this.config.repo}/contents${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: commitMessage,
                    content: encodedContent,
                    branch: this.config.branch
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                return {
                    success: true,
                    url: result.content.html_url,
                    downloadUrl: result.content.download_url
                };
            } else {
                throw new Error(result.message || 'Failed to upload to GitHub');
            }
        } catch (error) {
            console.error('GitHub upload error:', error);
            throw error;
        }
    }

    // Create metadata for videos and courses
    createMetadata(materialData, content) {
        const metadata = {
            title: materialData.materialTitle,
            description: materialData.materialDescription,
            subject: materialData.materialSubject,
            class: materialData.materialClass,
            year: materialData.materialYear,
            language: materialData.materialLanguage,
            teacher: materialData.teacherName,
            email: materialData.teacherEmail,
            submittedAt: materialData.submittedAt,
            approvedAt: new Date().toISOString()
        };
        
        if (materialData.resourceType === 'video') {
            metadata.videos = content; // Should be array of video objects
            metadata.platform = materialData.platform || 'YouTube';
            metadata.duration = materialData.duration;
        } else if (materialData.resourceType === 'course') {
            metadata.courseData = content; // Should be course structure
            metadata.provider = materialData.provider;
            metadata.courseDuration = materialData.courseDuration;
            metadata.link = materialData.cloudLink;
        }
        
        return metadata;
    }

    // Helper methods
    sanitizeFilename(filename) {
        return filename
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    getFileExtension(type) {
        const extensions = {
            'pdf': 'json', // Store metadata as JSON
            'notes': 'json',
            'video': 'json',
            'course': 'json'
        };
        return extensions[type] || 'json';
    }

    // Get all materials from GitHub
    async getAllMaterials(type) {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.config.username}/${this.config.repo}/contents${this.baseUrls[type]}`, {
                headers: {
                    'Authorization': `token ${this.config.token}`
                }
            });
            
            if (response.ok) {
                const files = await response.json();
                const materials = [];
                
                for (const file of files) {
                    if (file.name.endsWith('.json')) {
                        const contentResponse = await fetch(file.download_url);
                        const content = await contentResponse.json();
                        materials.push(content);
                    }
                }
                
                return materials;
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
            return [];
        }
    }
}

// Initialize
window.GitHubIntegration = new GitHubIntegration();