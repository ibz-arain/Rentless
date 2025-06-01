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