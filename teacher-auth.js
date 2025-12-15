// Simple Teacher Authentication System
class TeacherAuth {
    constructor() {
        this.teachersKey = 'scienceHub_teachers';
        this.currentTeacherKey = 'scienceHub_currentTeacher';
        this.verificationCodes = {}; // Store verification codes temporarily
        
        // Email configuration (using EmailJS or similar)
        this.emailConfig = {
            serviceId: 'service_lpp4sg4', // Set up at https://www.emailjs.com/
            templateId: 'template_lhkmjek',
            userId: 'GmYMd9XWmUkzvS_uV',
            publicKey: 'GmYMd9XWmUkzvS_uV'
        };
    }

    // Register a new teacher
    async registerTeacher(email, name, school, password) {
        // Validate input
        if (!this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }
        
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        // Check if email already exists
        const teachers = this.getAllTeachers();
        if (teachers.find(t => t.email === email)) {
            throw new Error('Email already registered');
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        this.verificationCodes[email] = {
            code: verificationCode,
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            data: { email, name, school, password }
        };

        // Send verification email
        await this.sendVerificationEmail(email, verificationCode, name);

        return {
            success: true,
            message: 'Verification code sent to your email'
        };
    }

    // Verify email with code
    async verifyEmail(email, code) {
        const verification = this.verificationCodes[email];
        
        if (!verification) {
            throw new Error('No verification request found');
        }
        
        if (Date.now() > verification.expires) {
            delete this.verificationCodes[email];
            throw new Error('Verification code expired');
        }
        
        if (verification.code !== code) {
            throw new Error('Invalid verification code');
        }

        // Create teacher account
        const { name, school, password } = verification.data;
        const teacher = this.createTeacherAccount(email, name, school, password);

        // Clean up verification code
        delete this.verificationCodes[email];

        return {
            success: true,
            teacher: teacher,
            message: 'Account verified successfully'
        };
    }

    // Create teacher account
    createTeacherAccount(email, name, school, password) {
        const teacher = {
            id: this.generateId(),
            email: email,
            name: name,
            school: school,
            passwordHash: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            status: 'active',
            uploads: [],
            lastLogin: null
        };

        // Save to localStorage
        const teachers = this.getAllTeachers();
        teachers.push(teacher);
        localStorage.setItem(this.teachersKey, JSON.stringify(teachers));

        // Also save to session for immediate login
        this.loginTeacher(email, password);

        return teacher;
    }

    // Login teacher
    loginTeacher(email, password) {
        const teachers = this.getAllTeachers();
        const teacher = teachers.find(t => t.email === email);
        
        if (!teacher) {
            throw new Error('Teacher not found');
        }
        
        if (teacher.passwordHash !== this.hashPassword(password)) {
            throw new Error('Invalid password');
        }
        
        if (teacher.status !== 'active') {
            throw new Error('Account is not active');
        }

        // Update last login
        teacher.lastLogin = new Date().toISOString();
        this.saveTeacher(teacher);

        // Store in session
        const sessionTeacher = { ...teacher };
        delete sessionTeacher.passwordHash; // Don't store password hash
        localStorage.setItem(this.currentTeacherKey, JSON.stringify(sessionTeacher));

        return sessionTeacher;
    }

    // Logout teacher
    logoutTeacher() {
        localStorage.removeItem(this.currentTeacherKey);
    }

    // Get current teacher
    getCurrentTeacher() {
        const teacher = localStorage.getItem(this.currentTeacherKey);
        return teacher ? JSON.parse(teacher) : null;
    }

    // Check if teacher is logged in
    isLoggedIn() {
        return this.getCurrentTeacher() !== null;
    }

    // Send verification email (using EmailJS)
    async sendVerificationEmail(email, code, name) {
        // For demo purposes - in production, use EmailJS or similar service
        console.log(`Verification code for ${email}: ${code}`);
        alert(`DEMO: Verification code sent to ${email}: ${code}`);
        
        // Uncomment and configure for real email sending:
        /*
        try {
            await emailjs.send(
                this.emailConfig.serviceId,
                this.emailConfig.templateId,
                {
                    to_email: email,
                    to_name: name,
                    verification_code: code,
                    website_name: 'Science Hub'
                },
                this.emailConfig.userId
            );
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error('Failed to send verification email');
        }
        */
    }

    // Send password reset email
    async sendPasswordResetEmail(email) {
        const teacher = this.getAllTeachers().find(t => t.email === email);
        if (!teacher) {
            throw new Error('Teacher not found');
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        this.verificationCodes[email] = {
            code: resetCode,
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            type: 'password_reset'
        };

        // Send reset email (demo)
        console.log(`Password reset code for ${email}: ${resetCode}`);
        alert(`DEMO: Password reset code sent to ${email}: ${resetCode}`);

        return {
            success: true,
            message: 'Password reset code sent to your email'
        };
    }

    // Reset password
    resetPassword(email, code, newPassword) {
        const verification = this.verificationCodes[email];
        
        if (!verification || verification.type !== 'password_reset') {
            throw new Error('Invalid reset request');
        }
        
        if (Date.now() > verification.expires) {
            delete this.verificationCodes[email];
            throw new Error('Reset code expired');
        }
        
        if (verification.code !== code) {
            throw new Error('Invalid reset code');
        }

        // Update password
        const teachers = this.getAllTeachers();
        const teacherIndex = teachers.findIndex(t => t.email === email);
        
        if (teacherIndex === -1) {
            throw new Error('Teacher not found');
        }

        teachers[teacherIndex].passwordHash = this.hashPassword(newPassword);
        localStorage.setItem(this.teachersKey, JSON.stringify(teachers));

        // Clean up verification code
        delete this.verificationCodes[email];

        return {
            success: true,
            message: 'Password reset successful'
        };
    }

    // Helper methods
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    hashPassword(password) {
        // Simple hash for demo - in production, use bcrypt or similar
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    generateId() {
        return 'teacher_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getAllTeachers() {
        const teachers = localStorage.getItem(this.teachersKey);
        return teachers ? JSON.parse(teachers) : [];
    }

    saveTeacher(teacher) {
        const teachers = this.getAllTeachers();
        const index = teachers.findIndex(t => t.id === teacher.id);
        
        if (index !== -1) {
            teachers[index] = teacher;
            localStorage.setItem(this.teachersKey, JSON.stringify(teachers));
        }
    }

    getTeacherById(id) {
        const teachers = this.getAllTeachers();
        return teachers.find(t => t.id === id);
    }

    updateTeacherProfile(teacherId, updates) {
        const teacher = this.getTeacherById(teacherId);
        if (!teacher) throw new Error('Teacher not found');

        // Update fields
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'passwordHash') {
                teacher[key] = updates[key];
            }
        });

        this.saveTeacher(teacher);
        return teacher;
    }
}

// Initialize auth system
window.TeacherAuth = new TeacherAuth();