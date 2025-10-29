# 🧠 V-Meet – Virtual Machine Provisioning Platform for Education

**V-Meet** is a cloud-based web platform that allows teachers to create classes and request Azure-based Virtual Machines for students dynamically.  
Students can then access their assigned VMs directly from their dashboards.

---

## 🚀 Features

### 👩‍🏫 Teacher Portal
- Create and manage courses.
- Add or remove students.
- Request virtual machines (Python, Node.js, Chrome).
- View VM request history.

### 👨‍🎓 Student Portal
- View active virtual machines.
- Copy RDP connection commands.
- Live countdown until VM auto-deletion.

### 🧑‍💻 Admin Portal
- Approve or reject VM requests.
- Trigger automated VM provisioning via Azure SDK.
- View all VM request logs.

---

## 🏗️ Tech Stack

| Layer | Technology |
|--------|-------------|
| Frontend | React.js + Tailwind CSS |
| Backend | Node.js + Express |
| Database | Microsoft SQL Server (Azure SQL) |
| Cloud | Microsoft Azure |
| Authentication | Cookies (JWT planned) |
| API Communication | REST (JSON) |

---

---

## 🔑 Environment Variables (`.env`)

> ⚠️ **Never commit this file to GitHub.**

Create a `.env` file in your backend root with:
```

DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_SERVER=vmeetserver.database.windows.net
DB_DATABASE=V-Meet
DB_PORT=1433

AZURE_SUBSCRIPTION_ID=your_subscription_id
AZURE_TENANT_ID=your_tenant_id
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_RESOURCE_GROUP=Cloud-VMeet
AZURE_LOCATION=southeastasia
```

---

## 🧩 Database Schema (Core Tables)

### `user_registration`
| Field | Type | Description |
|--------|------|-------------|
| id | int | Primary key |
| fullname | nvarchar | User full name |
| email | nvarchar | Unique email |
| password | nvarchar | Hashed password |
| isTeacher | bit | Role flag |

### `StudentVMs`
| Field | Type | Description |
|--------|------|-------------|
| id | int (PK) | Unique record |
| studentEmail | nvarchar | Student’s registered email |
| courseName | nvarchar | Linked course name |
| vmType | nvarchar | VM type (Python, NodeJS, Chrome) |
| vmIp | nvarchar | Public IP of the VM |
| vmUsername | nvarchar | Login username |
| vmPassword | nvarchar | Login password |
| created_at | datetime | Creation timestamp |
| autoDeleteAt | datetime | Auto-termination time |

---

## 🧠 API Endpoints

### 👩‍🏫 Teacher
| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/teacher/courses/add` | POST | Create new course |
| `/api/teacher/students/add` | POST | Add student to course |
| `/api/teacher/vm/request` | POST | Request new VM for course |

### 👨‍🎓 Student
| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/student/vm/list` | POST | List active VMs for student |

### 🧑‍💻 Admin
| Endpoint | Method | Description |
|-----------|---------|-------------|
| `/api/admin/vm/requests` | GET | View all VM requests |
| `/api/admin/vm/approve` | POST | Approve & provision VM |

---

## 🧰 Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/V-Meet.git
cd V-Meet
