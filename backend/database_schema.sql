-- DATABASE SCHEMA FOR GEOLINK PROJECT
-- Equivalent SQL structure for reporting purposes

-- 1. Users Table: Stores basic profile information
CREATE TABLE users (
    uid VARCHAR(128) PRIMARY KEY, -- Firebase Auth UID
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    is_ghost_mode BOOLEAN DEFAULT FALSE,
    battery_level INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Friendships Table: Manages many-to-many relationship between users
CREATE TABLE friendships (
    id VARCHAR(255) PRIMARY KEY, -- Format: uid1_uid2
    user1_id VARCHAR(128) NOT NULL,
    user2_id VARCHAR(128) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(uid),
    FOREIGN KEY (user2_id) REFERENCES users(uid)
);

-- 3. Locations Table: Stores real-time location (Equivalent to RTDB /locations)
CREATE TABLE locations (
    user_id VARCHAR(128) PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20), -- 'moving', 'still', 'running'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid)
);

-- 4. Locations History Table: Stores footprints (Equivalent to Firestore locations_history)
CREATE TABLE locations_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(uid)
);

-- 5. Messages Table: Real-time chat (Equivalent to Firestore messages)
CREATE TABLE messages (
    id VARCHAR(128) PRIMARY KEY,
    sender_id VARCHAR(128) NOT NULL,
    receiver_id VARCHAR(128), -- NULL if group message
    group_id VARCHAR(128),    -- NULL if direct message
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'emoji'
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(uid)
);

-- 6. Groups Table: For group chat features
CREATE TABLE groups (
    id VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(uid)
);
