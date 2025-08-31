# Adding Reservation Collection and Indexes

This migration adds a new slot-based reservation system to prevent concurrent double-bookings in the lecture theatre booking system.

## New Collection: `reservations`

The `reservations` collection stores slot-based reservations for each hall, date, and time slot combination.

### Schema Fields:
- `hallId`: ObjectId reference to Hall
- `date`: String in 'YYYY-MM-DD' format
- `slot`: Number representing 15-minute time slot index
- `bookingId`: ObjectId reference to Booking (null until linked)
- `createdAt`: Date with TTL for temporary holds

## Required Indexes

### 1. Unique Compound Index (REQUIRED)
```javascript
db.reservations.createIndex(
  { hallId: 1, date: 1, slot: 1 }, 
  { unique: true }
);
```

This index prevents two users from booking the same hall, date, and time slot simultaneously.

### 2. Performance Indexes (OPTIONAL)
```javascript
// For efficient querying by date and slots
db.reservations.createIndex({ date: 1, slot: 1 });

// For cleanup operations
db.reservations.createIndex({ bookingId: 1 });

// TTL index for temporary holds (120 seconds)
db.reservations.createIndex({ createdAt: 1 }, { expireAfterSeconds: 120 });
```

## How to Apply

### Option 1: Automatic (Recommended)
The indexes are automatically created when the application starts up, as they're defined in the Mongoose schema.

### Option 2: Manual Creation
If you need to create indexes manually, run these commands in MongoDB shell:

```bash
# Connect to your database
use your_database_name

# Create the unique compound index
db.reservations.createIndex(
  { hallId: 1, date: 1, slot: 1 }, 
  { unique: true }
);

# Create performance indexes
db.reservations.createIndex({ date: 1, slot: 1 });
db.reservations.createIndex({ bookingId: 1 });
db.reservations.createIndex({ createdAt: 1 }, { expireAfterSeconds: 120 });
```

### Option 3: Using MongoDB Compass
1. Open MongoDB Compass
2. Navigate to your database
3. Select the `reservations` collection
4. Go to the "Indexes" tab
5. Click "Create Index"
6. Add the fields: `hallId: 1, date: 1, slot: 1`
7. Check "Unique" option
8. Click "Create"

## Verification

To verify the indexes are created correctly:

```javascript
// Check all indexes on the collection
db.reservations.getIndexes();

// Verify the unique constraint works
db.reservations.insertOne({
  hallId: ObjectId("your_hall_id"),
  date: "2024-12-25",
  slot: 36, // 9:00 AM slot
  bookingId: null
});

// This should fail with duplicate key error
db.reservations.insertOne({
  hallId: ObjectId("your_hall_id"),
  date: "2024-12-25",
  slot: 36, // Same hall, date, slot
  bookingId: null
});
```

## Rollback

If you need to rollback this migration:

```javascript
// Drop the collection (WARNING: This will delete all reservation data)
db.reservations.drop();

// Or drop specific indexes
db.reservations.dropIndex("hallId_1_date_1_slot_1");
```

## Benefits

1. **Prevents Double-Booking**: Database-level enforcement prevents race conditions
2. **Atomic Operations**: `insertMany` with `ordered: true` ensures all-or-nothing slot reservation
3. **Performance**: Efficient slot-based queries instead of complex overlap calculations
4. **Scalability**: Handles concurrent requests without performance degradation
5. **Reliability**: Unique index guarantees data integrity

## Testing

Use the provided test script to verify the system works:

```bash
cd tools
npm install axios
node test-concurrency.js
```

The test should show that only one of two concurrent booking attempts succeeds, while the other fails with a 409 Conflict error.
