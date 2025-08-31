# Slot-Based Reservation System

This document describes the new slot-based reservation system implemented to prevent concurrent double-bookings in the lecture theatre booking system.

## Overview

The system has been upgraded from a simple overlap-checking approach to a robust slot-based reservation system that prevents race conditions at the database level.

## How It Works

### 1. **Slot Calculation**
- Time is divided into 15-minute slots (configurable via `SLOT_MINUTES` constant)
- Each slot has a unique index (e.g., 9:00 AM = slot 36, 9:15 AM = slot 37)
- Slots are calculated using UTC time to avoid timezone issues

### 2. **Reservation Process**
1. **Check Availability**: Convert requested time to slot numbers
2. **Reserve Slots**: Atomically insert reservation documents for all required slots
3. **Create Booking**: If slots are reserved successfully, create the booking
4. **Link Reservations**: Update reservations with the booking ID
5. **Cleanup**: If any step fails, cleanup reserved slots

### 3. **Concurrency Protection**
- **Unique Index**: `{ hallId: 1, date: 1, slot: 1 }` prevents duplicate reservations
- **Atomic Operations**: `insertMany` with `ordered: true` ensures all-or-nothing slot reservation
- **Database-Level Enforcement**: MongoDB enforces uniqueness, preventing race conditions

## Key Components

### Models
- **`models/reservation.js`**: New reservation schema with unique indexes
- **`utils/slots.js`**: Utility functions for slot calculations and date formatting

### Updated Controllers
- **`createBooking`**: Now uses slot-based reservation system
- **`getalllt`**: Availability check using reservations instead of overlap queries
- **`deleteBooking`**: Cleans up associated reservations
- **`upload`**: Excel bulk upload with reservation support
- **`updateBooking`**: TODO: Implement reservation update logic

## API Changes

### New Endpoint
- **`POST /debug-overlap`**: Debug endpoint for testing slot reservations

### Response Changes
- **409 Conflict**: Returned when slots are already reserved
- **Slot Information**: Added to availability responses

## Benefits

1. **Prevents Double-Booking**: Database-level enforcement eliminates race conditions
2. **Better Performance**: Slot-based queries are more efficient than complex overlap calculations
3. **Scalability**: Handles concurrent requests without performance degradation
4. **Reliability**: Unique index guarantees data integrity
5. **Maintainability**: Cleaner, more predictable code

## Testing

### Concurrency Test
Run the provided test script to verify the system works:

```bash
cd tools
npm install axios
node test-concurrency.js
```

**Expected Result**: Only one of two concurrent booking attempts should succeed, while the other fails with a 409 Conflict error.

### Manual Testing
1. Try to book the same hall/time from two different browser tabs
2. Verify only one booking is created
3. Check that the second request returns a 409 error

## Migration Notes

### Automatic Setup
- Indexes are created automatically when the application starts
- No manual database changes required

### Manual Setup (if needed)
```javascript
// Create unique index manually
db.reservations.createIndex(
  { hallId: 1, date: 1, slot: 1 }, 
  { unique: true }
);
```

## Configuration

### Slot Duration
- Default: 15 minutes
- Configurable via `SLOT_MINUTES` constant in the controller

### TTL for Temporary Holds
- Default: 120 seconds
- Configurable in the reservation schema

## Error Handling

### 409 Conflict
- **Cause**: Requested slots are already reserved
- **Action**: Client should show "Slot already reserved" message
- **Recovery**: User must choose different time or hall

### 422 Validation Error
- **Cause**: Invalid time range or missing required fields
- **Action**: Client should validate input before sending
- **Recovery**: Fix input data and retry

## Future Enhancements

1. **Reservation Updates**: Handle time/date changes in existing bookings
2. **Slot Flexibility**: Support for variable slot durations
3. **Advanced Scheduling**: Recurring bookings and pattern matching
4. **Analytics**: Track slot utilization and availability patterns

## Troubleshooting

### Common Issues

1. **Index Creation Failed**
   - Check MongoDB version (requires 3.4+ for compound unique indexes)
   - Verify database permissions

2. **Slots Not Reserved**
   - Check if `SLOT_MINUTES` constant is set correctly
   - Verify time format in client requests

3. **Performance Issues**
   - Ensure all indexes are created
   - Check MongoDB query performance

### Debug Commands
```javascript
// Check reservation collection
db.reservations.find().pretty()

// Check indexes
db.reservations.getIndexes()

// Test slot calculation
db.reservations.insertOne({
  hallId: ObjectId("test"),
  date: "2024-12-25",
  slot: 36,
  bookingId: null
})
```

## Support

For issues or questions about the reservation system:
1. Check the debug endpoint for detailed information
2. Review MongoDB logs for database errors
3. Verify all indexes are created correctly
4. Test with the concurrency test script
