// Upload Manager with GitHub Integration
class UploadManager {
    constructor() {
        this.uploadsKey = 'scienceHub_uploads';
        this.pendingUploadsKey = 'scienceHub_pendingUploads';
        
        // GitHub Configuration - YOU NEED TO SET THESE
        this.githubConfig = {
            username: '1DeadGrex', // Change this
            repo: 'SciTech',     // Create this repo
            branch: 'uploaded',
            token: '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'       // Generate at GitHub Settings > Developer Settings > Personal Access Tokens
        };
    }

    // Submit new upload
    async submitUpload(uploadData, file) {
        const teacher = window.TeacherAuth.getCurrentTeacher();
        if (!teacher) throw new Error('Teacher not logged in');

        const uploadId = this.generateUploadId();
        
        // Create upload metadata
        const metadata = {
            id: uploadId,
            teacherId: teacher.id,
            teacherName: teacher.name,
            teacherEmail: teacher.email,
            title: uploadData.title,
            description: uploadData.description,
            subject: uploadData.subject,
            class: uploadData.class,
            year: uploadData.year,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            },
            status: 'pending',
            submittedAt: new Date().toISOString(),
            adminNotes: '',
            approvedAt: null,
            cloudLink: null
        };

        try {
            // 1. Save to local storage
            this.saveUploadToLocal(metadata);
            
            // 2. Convert file to Base64
            const fileBase64 = await this.fileToBase64(file);
            
            // 3. Create GitHub issue for admin review
            const issueUrl = await this.createGitHubIssue(metadata, fileBase64);
            
            // 4. Save issue URL
            metadata.githubIssue = issueUrl;
            this.saveUploadToLocal(metadata);

            // 5. Add to teacher's uploads
            this.addToTeacherUploads(teacher.id, uploadId);

            return {
                success: true,
                uploadId: uploadId,
                issueUrl: issueUrl,
                message: 'Upload submitted for review! Admin will contact you via email.'
            };

        } catch (error) {
            console.error('Upload error:', error);
            throw new Error('Upload failed: ' + error.message);
        }
    }

    // Create GitHub issue for admin review
    async createGitHubIssue(metadata, fileBase64) {
        const issueTitle = `[UPLOAD REVIEW] ${metadata.title}`;
        
        const issueBody = `
## Upload Details

**Teacher:** ${metadata.teacherName}
**Email:** ${metadata.teacherEmail}
**Title:** ${metadata.title}
**Subject:** ${metadata.subject}
**Class:** ${metadata.class}
**Year:** ${metadata.year}

**Description:**
${metadata.description}

**File Info:**
- Name: ${metadata.fileInfo.name}
- Size: ${(metadata.fileInfo.size / 1024 / 1024).toFixed(2)} MB
- Type: ${metadata.fileInfo.type}

**Upload ID:** ${metadata.id}
**Submitted:** ${new Date(metadata.submittedAt).toLocaleString()}

## File Preview:
\`\`\`
${fileBase64.substring(0, 500)}...
\`\`\`

## Admin Actions:
- [ ] Download and review file
- [ ] Approve upload
- [ ] Upload to cloud storage
- [ ] Update metadata with cloud link
- [ ] Notify teacher
        `;

        try {
            // Create GitHub issue
            const response = await fetch('https://api.github.com/repos/' + 
                `${this.githubConfig.username}/${this.githubConfig.repo}/issues`, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${this.githubConfig.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: issueTitle,
                    body: issueBody,
                    labels: ['upload-review', 'pending']
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                return data.html_url;
            } else {
                throw new Error(data.message || 'Failed to create issue');
            }

        } catch (error) {
            console.error('GitHub API error:', error);
            // Fallback: Save to local storage for manual processing
            this.saveToPendingUploads(metadata, fileBase64);
            return 'local-pending';
        }
    }

    // Get teacher's uploads
    getTeacherUploads() {
        const teacher = window.TeacherAuth.getCurrentTeacher();
        if (!teacher) return [];

        const allUploads = this.getAllUploads();
        return allUploads.filter(upload => upload.teacherId === teacher.id);
    }

    // Get upload by ID
    getUploadById(id) {
        const uploads = this.getAllUploads();
        return uploads.find(upload => upload.id === id);
    }

    // Update upload status (for admin)
    updateUploadStatus(uploadId, status, adminNotes = '', cloudLink = '') {
        const uploads = this.getAllUploads();
        const uploadIndex = uploads.findIndex(u => u.id === uploadId);
        
        if (uploadIndex === -1) {
            throw new Error('Upload not found');
        }

        uploads[uploadIndex].status = status;
        uploads[uploadIndex].adminNotes = adminNotes;
        uploads[uploadIndex].cloudLink = cloudLink;
        
        if (status === 'approved') {
            uploads[uploadIndex].approvedAt = new Date().toISOString();
        }

        localStorage.setItem(this.uploadsKey, JSON.stringify(uploads));
        
        // Notify teacher via email (in real implementation)
        this.notifyTeacher(uploads[uploadIndex], status);

        return uploads[uploadIndex];
    }

    // Helper methods
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data URL prefix
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    saveUploadToLocal(metadata) {
        const uploads = this.getAllUploads();
        const existingIndex = uploads.findIndex(u => u.id === metadata.id);
        
        if (existingIndex >= 0) {
            uploads[existingIndex] = metadata;
        } else {
            uploads.push(metadata);
        }
        
        localStorage.setItem(this.uploadsKey, JSON.stringify(uploads));
    }

    saveToPendingUploads(metadata, fileBase64) {
        const pendingUploads = this.getPendingUploads();
        
        const pendingUpload = {
            metadata: metadata,
            fileBase64: fileBase64,
            createdAt: new Date().toISOString()
        };
        
        pendingUploads.push(pendingUpload);
        localStorage.setItem(this.pendingUploadsKey, JSON.stringify(pendingUploads));
    }

    addToTeacherUploads(teacherId, uploadId) {
        const teachers = window.TeacherAuth.getAllTeachers();
        const teacherIndex = teachers.findIndex(t => t.id === teacherId);
        
        if (teacherIndex !== -1) {
            if (!teachers[teacherIndex].uploads) {
                teachers[teacherIndex].uploads = [];
            }
            
            teachers[teacherIndex].uploads.push(uploadId);
            localStorage.setItem('scienceHub_teachers', JSON.stringify(teachers));
        }
    }

    getAllUploads() {
        const uploads = localStorage.getItem(this.uploadsKey);
        return uploads ? JSON.parse(uploads) : [];
    }

    getPendingUploads() {
        const uploads = localStorage.getItem(this.pendingUploadsKey);
        return uploads ? JSON.parse(uploads) : [];
    }

    generateUploadId() {
        return 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    notifyTeacher(upload, status) {
        // In production, send email notification
        console.log(`Teacher ${upload.teacherEmail} notified about upload ${upload.id}: ${status}`);
        
        // For demo, show alert
        if (status === 'approved') {
            alert(`Upload "${upload.title}" has been approved!`);
        } else if (status === 'rejected') {
            alert(`Upload "${upload.title}" was rejected. Check admin notes for details.`);
        }
    }

    // Admin functions
    getStats() {
        const uploads = this.getAllUploads();
        
        return {
            total: uploads.length,
            pending: uploads.filter(u => u.status === 'pending').length,
            approved: uploads.filter(u => u.status === 'approved').length,
            rejected: uploads.filter(u => u.status === 'rejected').length
        };
    }
}

// Initialize upload manager
window.UploadManager = new UploadManager();
