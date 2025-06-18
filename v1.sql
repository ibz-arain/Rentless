CREATE TABLE properties (
    property_id INTEGER PRIMARY KEY AUTOINCREMENT,
    landlord_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL DEFAULT 0,
    longitude REAL NOT NULL DEFAULT 0,
    monthly_rent DECIMAL(10, 2) NOT NULL,
    bedrooms INT NOT NULL,
    bathrooms DECIMAL(3, 1) NOT NULL,
    square_footage INT,
    amenities JSON,
    available_from DATE NOT NULL,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
    images JSON,
    FOREIGN KEY (landlord_id) REFERENCES users(user_id)
);

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    email_verified BOOLEAN NOT NULL DEFAULT 0,
    phone_verified BOOLEAN NOT NULL DEFAULT 0,
    date_of_birth DATE,
    profile_picture TEXT,
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE favorites (
    user_id INTEGER NOT NULL,
    property_id INTEGER NOT NULL,
    added_at DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (user_id, property_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id)
);

CREATE TABLE conversations (
    conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    tenant_id INTEGER NOT NULL,
    landlord_id INTEGER NOT NULL,
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, tenant_id, landlord_id),
    FOREIGN KEY (property_id) REFERENCES properties(property_id),
    FOREIGN KEY (tenant_id) REFERENCES users(user_id),
    FOREIGN KEY (landlord_id) REFERENCES users(user_id)
);

CREATE TABLE messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT 0,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id),
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
); 