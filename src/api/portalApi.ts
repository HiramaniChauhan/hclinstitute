const API_BASE = "http://localhost:5001/api";

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

// ─────────────── Student Management ────────────────────────────────────────
export const fetchAllStudents = async () => {
    const res = await fetch(`${API_BASE}/admin/students`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
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

// ─────────────── Attendance ───────────────────────────────────────────────
export const fetchMyAttendance = async () => {
    const res = await fetch(`${API_BASE}/attendance/my`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchBatchAttendance = async (batchId: string) => {
    const res = await fetch(`${API_BASE}/attendance/batch/${batchId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const fetchStudentAttendance = async (userId: string) => {
    const res = await fetch(`${API_BASE}/attendance/student/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
};

export const markAttendance = async (data: {
    userId: string; batchId: string; date: string; status: string; lectureId?: string; notes?: string;
}) => {
    const res = await fetch(`${API_BASE}/attendance`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
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
