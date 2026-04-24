# GeoLink Backend (Firebase API & Database)

## Overview
This repository contains the backend configuration and database schema for the **GeoLink** application. 

The project utilizes a **Backend-as-a-Service (BaaS)** architecture powered by **Firebase** to ensure real-time performance, scalability, and security for location tracking and social interactions.

## 🏗 Backend Architecture
- **Authentication:** Firebase Authentication (Email/Password).
- **Primary Database:** Google Cloud Firestore (NoSQL) for user profiles, friendships, and chat history.
- **Real-time Engine:** Firebase Realtime Database (RTDB) for low-latency location synchronization.
- **Object Storage:** Supabase Storage (via CDN) for high-resolution images and user moments.
- **Security:** Implement server-side Security Rules to enforce data access control.

## 📂 Contents
- `api_specification.md`: Detailed documentation of the Firebase SDK service layer acting as the API.
- `database_schema.sql`: Equivalent Relational Database schema (ERD) used for system design and reporting.
- `firestore.rules`: Security rules for Firestore collections.
- `database.rules.json`: Security rules for Realtime Database.
- `storage.rules`: Security rules for Firebase Storage buckets.

## 📊 Database Design (Equivalent SQL)
Although the application uses NoSQL, the data model follows a structured relational approach:
1. **Users**: Identifiers, profiles, and device status.
2. **Friendships**: Many-to-many relationship management.
3. **Locations**: Real-time GPS coordinates.
4. **History**: Footprint/Trail tracking.
5. **Messaging**: Chat logs and group management.

## 🚀 Deployment
The backend logic is deployed as **Serverless Security Rules** and **SDK-side services**. 
To replicate this environment:
1. Create a Firebase Project.
2. Enable Authentication, Firestore, and Realtime Database.
3. Apply the rules files provided in this directory.
4. Configure the environment variables in the App Client.

---
Developed by **GeoLink Team**
