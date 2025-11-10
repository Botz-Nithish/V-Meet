CREATE TABLE VMRequests (
  id INT IDENTITY(1,1) PRIMARY KEY,
  teacherEmail VARCHAR(255),
  courseName VARCHAR(255),
  vmType VARCHAR(255),
  isApproved BIT,
  created_at DATETIME DEFAULT GETDATE()
);
