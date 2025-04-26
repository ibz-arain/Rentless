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
    images JSON,
    FOREIGN KEY (landlord_id) REFERENCES users(user_id)
);