const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${sessionStorage.getItem("token") || ""}`,
});

// ─────────────── Admin Dashboard ───────────────────────────────────────────
export const fetchAdminDashboard = async () => {
    const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

// ─────────────── Admin Management ──────────────────────────────────────────
export const fetchAllAdmins = async () => {
    const res = await fetch(`${API_BASE}/admin/admins`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const requestAdminDeleteOtp = async (adminId: string) => {
    const res = await fetch(`${API_BASE}/admin/admins/delete-otp`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ adminId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const deleteAdminWithOtp = async (adminId: string, otp: string) => {
    const res = await fetch(`${API_BASE}/admin/admins/${adminId}`, {
        method: "DELETE",
        headers: getHeaders(),
        body: JSON.stringify({ otp }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

// ─────────────── Student Management ────────────────────────────────────────
export const fetchAllStudents = async (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    const url = `${API_BASE}/admin/students${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    // Return the full response with pagination + stats
    if (data.students && data.pagination) {
        return data;
    }
    // Legacy fallback
    return { students: Array.isArray(data) ? data : [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }, stats: { totalAll: 0, verifiedCount: 0, suspendedCount: 0 } };
};

export const fetchStudentProfile = async (id: string) => {
    const res = await fetch(`${API_BASE}/profile/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const updateStudentProfile = async (id: string, data: any) => {
    const res = await fetch(`${API_BASE}/profile/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};


export const verifyStudent = async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}/verify`, {
        method: "PUT",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const unverifyStudent = async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}/unverify`, {
        method: "PUT",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const suspendStudent = async (id: string, reason?: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}/suspend`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const unsuspendStudent = async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}/unsuspend`, {
        method: "PUT",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const deleteStudent = async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const permanentlyDeleteStudent = async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}/permanent`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const restoreStudent = async (id: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}/restore`, {
        method: "PUT",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const assignStudentToBatch = async (id: string, batchId: string, batchName: string) => {
    const res = await fetch(`${API_BASE}/admin/students/${id}/batch`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ batchId, batchName }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const broadcastNotification = async (title: string, message: string, type?: string) => {
    const res = await fetch(`${API_BASE}/admin/notify`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title, message, type }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

// ─────────────── Enrollments ───────────────────────────────────────────────
export const fetchMyEnrollments = async () => {
    const res = await fetch(`${API_BASE}/enrollments/my`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const enrollInBatch = async (batchId: string, courseId?: string) => {
    const res = await fetch(`${API_BASE}/enrollments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ batchId, courseId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const unenroll = async (enrollmentId: string) => {
    const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

// ─────────────── Notifications ─────────────────────────────────────────────
export const fetchMyNotifications = async () => {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchUnreadCount = async () => {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, { headers: getHeaders() });
    if (!res.ok) return { unreadCount: 0 };
    return res.json();
};

export const markAllNotificationsRead = async () => {
    const res = await fetch(`${API_BASE}/notifications/mark-read`, {
        method: "PUT",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};


// ─────────────── Fees ──────────────────────────────────────────────────────
export const fetchMyFees = async () => {
    const res = await fetch(`${API_BASE}/fees/my`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchStudentFees = async (userId: string) => {
    const res = await fetch(`${API_BASE}/fees/student/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const createFee = async (data: {
    userId: string; amount: number; description: string; dueDate: string; category?: string;
}) => {
    const res = await fetch(`${API_BASE}/fees`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const payFee = async (feeId: string) => {
    const res = await fetch(`${API_BASE}/fees/${feeId}/pay`, {
        method: "PUT",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const waiveFee = async (feeId: string) => {
    const res = await fetch(`${API_BASE}/fees/${feeId}/waive`, {
        method: "PUT",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchUnreadChatCount = async () => {
    const res = await fetch(`${API_BASE}/chat/unread-count`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchCourses = async () => {
    const res = await fetch(`${API_BASE}/courses`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchSelectedStudents = async () => {
    const res = await fetch(`${API_BASE}/selected-students`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchAboutInfo = async () => {
    const res = await fetch(`${API_BASE}/about`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchTerms = async () => {
    const res = await fetch(`${API_BASE}/terms`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const requestTermsUpdateOtp = async () => {
    const res = await fetch(`${API_BASE}/terms/update-otp`, {
        method: "POST",
        headers: getHeaders()
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const updateTerms = async (termsData: any, otp: string) => {
    const res = await fetch(`${API_BASE}/terms`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ ...termsData, otp })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchMyAnnouncements = async () => {
    const res = await fetch(`${API_BASE}/announcements/my`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const markAnnouncementRead = async (id: string) => {
    const res = await fetch(`${API_BASE}/announcements/${id}/read`, {
        method: "POST",
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const updateAboutInfo = async (data: any) => {
    const res = await fetch(`${API_BASE}/about`, {
        method: "PUT",
        headers: {
            ...getHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};
export const fetchStudentEnrollments = async (userId: string) => {
    const res = await fetch(`${API_BASE}/enrollments/student/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const adminEnrollStudent = async (data: { userId: string, courseId: string, batchId?: string }) => {
    const res = await fetch(`${API_BASE}/enrollments/admin/enroll`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchCourseStudents = async (courseId: string) => {
    const res = await fetch(`${API_BASE}/enrollments/course/${courseId}/students`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchStudentResults = async (userId: string) => {
    const res = await fetch(`${API_BASE}/results/student/${userId}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchTestById = async (testId: string, review?: boolean) => {
    const url = review ? `${API_BASE}/tests/${testId}?review=true` : `${API_BASE}/tests/${testId}`;
    const res = await fetch(url, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchMyResults = async () => {
    const res = await fetch(`${API_BASE}/results/my-results`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const requestDeleteAccountOtp = async (email: string) => {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, purpose: "Account Deletion" }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const confirmDeleteAccount = async (otp: string) => {
    const res = await fetch(`${API_BASE}/profile/delete-account`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ otp }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};
