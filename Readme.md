# 🌩️ V-Meet: Automated Virtual Machine Provisioning and Management System

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)
- [API Endpoints](#api-endpoints)
- [Usage Guide](#usage-guide)
- [Key Implementation Details](#key-implementation-details)
- [Learning Outcomes](#learning-outcomes)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

**V-Meet** is a cloud-based web application that automates the complete lifecycle of virtual machine provisioning for educational institutions. The system enables teachers to request virtual machines for their courses, which are automatically created on Microsoft Azure and distributed to enrolled students. The platform eliminates manual VM setup, reduces configuration errors, and provides a scalable solution for managing virtual lab environments.

### Core Functionality
- **Automated VM Provisioning**: One-click creation of Azure VMs with pre-configured software (Python, Chrome, Node.js)
- **Role-Based Access Control**: Separate interfaces for Teachers, Students, and Admins
- **Infrastructure as Code**: Complete Azure infrastructure managed via Terraform
- **Auto-Deletion**: VMs automatically deleted after 3 hours to manage costs
- **AI-Powered Analytics**: Gemini AI integration for intelligent insights and chat assistance

---

## 🔍 Problem Statement

Traditional academic lab setups face several challenges:
- **Manual Configuration**: Time-consuming setup of virtual environments for each student
- **Inconsistency**: Different configurations lead to compatibility issues
- **Resource Management**: Difficulty tracking and managing VM usage
- **Cost Control**: Lack of automated cleanup leads to unnecessary cloud costs
- **Scalability**: Manual processes don't scale with increasing student numbers

**V-Meet** solves these problems by providing:
- Fully automated VM creation and configuration
- Consistent environments across all students
- Centralized management dashboard
- Automatic resource cleanup
- Scalable cloud infrastructure

---

## ✨ Key Features

### For Teachers
- ✅ Create and manage courses
- ✅ Add students to courses
- ✅ Request VMs for entire classes (Python, Chrome, or Node.js)
- ✅ Track VM request status
- ✅ AI-powered chat assistant for portal guidance

### For Students
- ✅ View allocated VMs with connection details
- ✅ Request individual VMs for courses
- ✅ Copy RDP connection commands
- ✅ Monitor VM expiration time
- ✅ AI chat assistant for VM usage help

### For Admins
- ✅ Approve/reject VM requests
- ✅ View all VM requests with analytics
- ✅ AI-generated insights on usage patterns
- ✅ Monitor system-wide VM activity

### System Features
- 🔄 **Automated VM Lifecycle**: Create → Deploy → Auto-delete (3 hours)
- 🔐 **Secure Authentication**: Role-based access with session management
- 📊 **Real-time Analytics**: Weekly statistics and AI-powered summaries
- 🤖 **AI Integration**: Gemini AI for chat assistance and analytics
- 🐳 **Containerized Deployment**: Docker support for easy deployment
- ☁️ **Infrastructure as Code**: Terraform-managed Azure resources

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  React.js (Vite) - Teacher | Student | Admin Portals        │
│  - Tailwind CSS for styling                                 │
│  - React Router for navigation                              │
│  - Cookie-based authentication                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS/REST API
┌──────────────────────▼──────────────────────────────────────┐
│                     Backend Layer (Node.js)                  │
│  Express.js Server                                          │
│  - Authentication & Authorization                            │
│  - Azure SDK Integration (VM Management)                     │
│  - Database Operations (Azure SQL)                           │
│  - Gemini AI API Integration                                │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
    ┌──────▼──────┐              ┌───────▼────────┐
    │ Azure SQL   │              │  Microsoft      │
    │  Database   │              │  Azure Cloud    │
    │             │              │  - VMs          │
    │ - Users     │              │  - Resource     │
    │ - Courses   │              │    Groups      │
    │ - VM Data   │              │  - Networking  │
    └──────────────┘              └─────────────────┘
```

### Infrastructure Layer
- **Terraform**: Manages Azure Resource Group, SQL Server, Database, and Service Principal
- **Auto-Generated Credentials**: `.env` file automatically created with all necessary credentials
- **SQL Initialization**: Database schema automatically created via `init_db.sql`

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| Vite | 4.5.2 | Build Tool |
| Tailwind CSS | 3.4.4 | Styling |
| React Router | 7.8.0 | Navigation |
| Framer Motion | 12.23.12 | Animations |
| Lucide React | 0.546.0 | Icons |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 5.1.0 | Web Framework |
| Azure SDK | Latest | VM Management |
| mssql | 11.0.1 | SQL Server Driver |
| dotenv | 17.2.3 | Environment Variables |

### Cloud & Infrastructure
| Service | Purpose |
|---------|---------|
| Microsoft Azure | Cloud Provider |
| Azure SQL Database | Data Storage |
| Azure Virtual Machines | Compute Resources |
| Azure AD | Authentication |
| Terraform | Infrastructure as Code |
| Docker | Containerization |

### AI Integration
| Service | Purpose |
|---------|---------|
| Google Gemini API | Chat Assistant & Analytics |

---

## 📁 Project Structure

```
V-Meet/
├── backend/                    # Node.js Backend
│   ├── index.js               # Main server file with API routes
│   ├── functions.js           # Database & business logic functions
│   ├── create-VM.js          # Azure VM creation/deletion logic
│   ├── vmConfigs.json        # VM type configurations
│   ├── server.js             # Alternative server entry (legacy)
│   ├── package.json          # Dependencies
│   ├── Dockerfile.backend    # Backend Docker image
│   └── .env                  # Environment variables (auto-generated)
│
├── frontend/                   # React Frontend
│   └── cloud-front/
│       ├── src/
│       │   ├── App.jsx       # Main app component
│       │   ├── main.jsx      # Entry point
│       │   ├── page/
│       │   │   ├── LoginPage.jsx
│       │   │   ├── Teacher.jsx
│       │   │   ├── Student.jsx
│       │   │   └── Admin.jsx
│       │   └── components/
│       │       ├── header/
│       │       ├── notify/
│       │       ├── apifetch/
│       │       └── TextType/
│       ├── package.json
│       ├── Dockerfile.frontend
│       └── vite.config.js
│
├── infra/                      # Infrastructure as Code
│   ├── main.tf                # Terraform configuration
│   └── init_db.sql            # Database schema initialization
│
├── docker-compose.yml          # Multi-container orchestration
└── README.md                   # This file
```

---

## 🗄️ Database Schema

The system uses Azure SQL Database with the following tables:

### `student`
Stores user accounts (both teachers and students)
```sql
- id (INT, Primary Key)
- fullname (VARCHAR)
- email (VARCHAR, Unique)
- password (VARCHAR)
- isTeacher (BIT)
```

### `TeacherCourses`
Tracks courses created by teachers
```sql
- TeacherName (VARCHAR)
- CourseName (VARCHAR)
- created_at (DATETIME)
```

### `TeacherClasses`
Maps students to courses
```sql
- TeacherName (VARCHAR)
- CourseName (VARCHAR)
- email (VARCHAR) -- Student email
```

### `VMRequests`
Stores VM requests from teachers/students
```sql
- id (INT, Primary Key, Identity)
- teacherEmail (VARCHAR)
- courseName (VARCHAR)
- vmType (VARCHAR) -- pythonVM, chromeVM, nodejsVM
- isApproved (BIT)
- created_at (DATETIME)
```

### `StudentVMs`
Tracks active VMs allocated to students
```sql
- studentEmail (VARCHAR)
- courseName (VARCHAR)
- vmType (VARCHAR)
- vmName (VARCHAR)
- vmIp (VARCHAR)
- vmUsername (VARCHAR)
- vmPassword (VARCHAR)
- autoDeleteAt (DATETIME)
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Azure CLI installed and logged in (`az login`)
- Terraform installed
- Docker & Docker Compose (optional, for containerized deployment)
- SQL Server Command Line Tools (`sqlcmd`) for database initialization

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd V-Meet
```

### Step 2: Infrastructure Setup (Terraform)

Navigate to the infrastructure directory:
```bash
cd infra
```

Initialize Terraform:
```bash
terraform init
```

Review the plan:
```bash
terraform plan
```

Apply the infrastructure:
```bash
terraform apply
```

**What Terraform Creates:**
- Azure Resource Group (`V-Meet-RG`)
- Azure SQL Server (`vmeetserver`)
- Azure SQL Database (`V-Meet`)
- Azure AD Application & Service Principal
- Auto-generates `.env` file in project root with all credentials

### Step 3: Database Initialization

The database schema is automatically initialized via Terraform's `null_resource` provisioner, which runs `init_db.sql`. If you need to manually initialize:

```bash
sqlcmd -S <server-name>.database.windows.net -U <username> -P <password> -d V-Meet -i init_db.sql
```

### Step 4: Backend Setup

Navigate to backend directory:
```bash
cd ../backend
```

Install dependencies:
```bash
npm install
```

The `.env` file should already be generated by Terraform. Verify it contains:
```env
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<service-principal-client-id>
AZURE_CLIENT_SECRET=<service-principal-secret>
AZURE_RESOURCE_GROUP=V-Meet-RG
AZURE_LOCATION=eastasia
DB_USER=<sql-admin-username>
DB_PASSWORD=<sql-admin-password>
DB_SERVER=<sql-server-name>.database.windows.net
DB_DATABASE=V-Meet
GEMINI_API_KEY=<your-gemini-api-key>  # Optional, for AI features
GEMINI_MODEL=gemini-2.5-flash
```

Start the backend server:
```bash
npm start
# or for development
npm run dev
```

Backend runs on `http://localhost:5000`

### Step 5: Frontend Setup

Navigate to frontend directory:
```bash
cd ../frontend/cloud-front
```

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### Step 6: Build for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
No build step required (Node.js runtime)

---

## 🐳 Docker Deployment

### Using Docker Compose

From the project root:
```bash
docker-compose up -d
```

This will:
- Build and start the backend container (port 5000)
- Build and start the frontend container (port 3000)
- Set up networking between containers

### Individual Containers

**Backend:**
```bash
cd backend
docker build -f Dockerfile.backend -t vmeet-backend .
docker run -p 5000:5000 --env-file .env vmeet-backend
```

**Frontend:**
```bash
cd frontend/cloud-front
docker build -f Dockerfile.frontend -t vmeet-frontend .
docker run -p 3000:80 vmeet-frontend
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/login` - User login
  ```json
  { "email": "user@example.com", "password": "password123" }
  ```

- `POST /api/signup` - User registration
  ```json
  { "fullname": "John Doe", "email": "user@example.com", "password": "password123" }
  ```

### Teacher Endpoints
- `POST /api/teacher/courses/list` - List teacher's courses
- `POST /api/teacher/courses/add` - Add new course
- `POST /api/teacher/students/add` - Add student to course
- `POST /api/teacher/students/list` - List students in course
- `POST /api/teacher/chat` - AI chat assistant

### Student Endpoints
- `POST /api/student/vm/request` - Request a VM
- `POST /api/student/vm/list` - List student's active VMs
- `POST /api/student/chat` - AI chat assistant

### Admin Endpoints
- `GET /api/admin/vm/requests` - Get all VM requests with AI analytics
- `POST /api/admin/vm/approve` - Approve VM request and create VMs

### Health Check
- `GET /` - Server status check

---

## 📖 Usage Guide

### For Teachers

1. **Login/Signup**: Create an account or login with existing credentials
2. **Create Course**: Navigate to "Course Management" → Enter course name → Click "Add Class"
3. **Add Students**: Enter student email → Select course → Click "Save Student"
4. **Request VM**: Navigate to "VM Management" → Select course and VM type → Click "Request VM"
5. **Track Status**: View your VM requests and their approval status
6. **AI Assistant**: Use the chat panel for help with portal features

### For Students

1. **Login**: Use your registered email and password
2. **View VMs**: See all allocated VMs with connection details
3. **Request VM**: Fill in course name and select VM type → Click "Request VM"
4. **Connect**: Copy the RDP command and paste into Windows Run (Win+R)
5. **Monitor Time**: Check remaining minutes before auto-deletion
6. **AI Assistant**: Ask questions about VM usage and connection

### For Admins

1. **Access Portal**: Navigate to `/admin` route
2. **View Requests**: See all VM requests with AI-generated analytics
3. **Approve Requests**: Click "Approve" to create VMs for all students in the course
4. **Monitor Activity**: Review weekly statistics and trends

---

## 🔧 Key Implementation Details

### VM Creation Process

1. **Request Submission**: Teacher/Student submits VM request → Stored in `VMRequests` table
2. **Admin Approval**: Admin approves request → Triggers VM creation for all enrolled students
3. **VM Provisioning** (per student):
   - Extract roll number from student email
   - Generate username (roll number) and password (last 3 digits + `@Rec#2025`)
   - Create Azure VM with selected type (Python/Chrome/Node.js)
   - Configure networking (VNet, Subnet, Public IP, NSG)
   - Install required software via PowerShell script
   - Store VM details in `StudentVMs` table
4. **Auto-Deletion**: Scheduled deletion after 3 hours (10,800,000 ms)

### VM Types & Configurations

**Python VM** (`pythonVM`):
- Installs Python 3.12.0
- Pre-configured for Python development

**Chrome VM** (`chromeVM`):
- Installs Google Chrome browser
- Ready for web testing and browsing

**Node.js VM** (`nodejsVM`):
- Installs Node.js v20.10.0
- Pre-configured for JavaScript/Node.js development

### Security Features

- **Azure AD Service Principal**: Secure authentication for Azure API calls
- **SQL Injection Prevention**: Parameterized queries throughout
- **CORS Protection**: Whitelisted origins for API access
- **Password Hashing**: (Note: Currently stored as plaintext - should be hashed in production)
- **Session Management**: Cookie-based authentication with expiration

### AI Integration

**Gemini AI** is used for:
- **Teacher Chat**: Context-aware assistance for portal features
- **Student Chat**: Help with VM connection and usage
- **Admin Analytics**: Intelligent summaries of VM request patterns

### Auto-Deletion Mechanism

VMs are automatically deleted after 3 hours using `setTimeout`:
```javascript
setTimeout(async () => {
    await deleteVM(vmInfo.vmName);
    await pool.request()
        .input("studentEmail", sql.VarChar, email)
        .query("DELETE FROM dbo.StudentVMs WHERE studentEmail=@studentEmail");
}, 10800000); // 3 hours in milliseconds
```

---

## 🎓 Learning Outcomes

This project demonstrates proficiency in:

1. **Cloud Computing Fundamentals**
   - Azure resource management (VMs, SQL, Networking)
   - Infrastructure as Code (Terraform)
   - Cloud automation and orchestration

2. **Full-Stack Development**
   - React.js frontend with modern UI/UX
   - Node.js/Express backend API
   - RESTful API design
   - Database design and management

3. **DevOps Practices**
   - Docker containerization
   - CI/CD readiness
   - Environment configuration management
   - Automated infrastructure provisioning

4. **System Architecture**
   - Three-tier architecture
   - Microservices principles
   - Scalable cloud architecture
   - Security best practices

5. **AI Integration**
   - API integration with Gemini AI
   - Context-aware chat systems
   - Data analytics and insights

---

## 🔮 Future Enhancements

- [ ] **Enhanced Security**: Implement password hashing (bcrypt)
- [ ] **VM Scheduling**: Allow custom auto-deletion times
- [ ] **Cost Tracking**: Monitor and report Azure spending
- [ ] [ ] **Email Notifications**: Send VM credentials via email
- [ ] **VM Templates**: Support for custom VM configurations
- [ ] **Monitoring Dashboard**: Real-time VM status monitoring
- [ ] **Backup & Recovery**: VM snapshot capabilities
- [ ] **Multi-Cloud Support**: Extend to AWS/GCP
- [ ] **Mobile App**: React Native mobile application
- [ ] **Advanced Analytics**: Machine learning for usage prediction

---

## 📝 Environment Variables

### Backend `.env` File (Auto-generated by Terraform)

```env
# Azure Credentials
AZURE_SUBSCRIPTION_ID=<subscription-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_ID=<client-id>
AZURE_CLIENT_SECRET=<client-secret>
AZURE_RESOURCE_GROUP=V-Meet-RG
AZURE_LOCATION=eastasia

# Database Configuration
DB_USER=<sql-admin-username>
DB_PASSWORD=<sql-admin-password>
DB_SERVER=<server-name>.database.windows.net
DB_DATABASE=V-Meet

# AI Integration (Optional)
GEMINI_API_KEY=<your-api-key>
GEMINI_MODEL=gemini-2.5-flash

# Server Configuration
PORT=5000
NODE_ENV=production
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Terraform Apply Fails**
- Ensure Azure CLI is logged in: `az login`
- Verify subscription access: `az account show`
- Check resource quotas in Azure portal

**2. Database Connection Errors**
- Verify SQL Server firewall allows your IP
- Check `.env` file has correct database credentials
- Ensure SQL Server is running

**3. VM Creation Fails**
- Verify Service Principal has Contributor role on Resource Group
- Check Azure subscription has available VM quota
- Review Azure activity logs for detailed errors

**4. Frontend Can't Connect to Backend**
- Update API base URL in `apifetch/index.jsx`
- Check CORS configuration in `backend/index.js`
- Verify backend server is running

---

## 📄 License

This project is developed for educational purposes as part of a Cloud Computing course.

---

## 👥 Contributors

Developed as a Cloud Computing project demonstrating:
- Azure cloud services integration
- Infrastructure as Code principles
- Full-stack web development
- AI-powered features
- Automated resource management

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Azure activity logs for infrastructure errors
3. Check backend console logs for API errors
4. Verify all environment variables are set correctly

---

**Built with ❤️ using Azure, React, Node.js, and Terraform**

