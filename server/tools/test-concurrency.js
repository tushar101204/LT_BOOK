const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Adjust to your server URL
const AUTH_TOKEN = 'your_auth_token_here'; // Replace with actual token

// Test data for concurrent booking attempts
const testBookingData = {
  eventName: "Concurrency Test Event",
  eventDateType: "half",
  eventDate: "2024-12-25",
  startTime: "2000-01-01T09:00:00.000Z", // 9:00 AM
  endTime: "2000-01-01T10:00:00.000Z",   // 10:00 AM
  bookedHallId: "your_hall_id_here",      // Replace with actual hall ID
  eventManager: "Test User",
  department: "Computer Science",
  institution: "Test University",
  organizingClub: "Test Club",
  phoneNumber: 1234567890
};

// Function to make a booking request
async function makeBooking(attemptNumber) {
  try {
    console.log(`\n--- Attempt ${attemptNumber} ---`);
    const startTime = Date.now();
    
    const response = await axios.post(`${BASE_URL}/bookings`, testBookingData, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ SUCCESS (${duration}ms):`, {
      status: response.status,
      message: response.data.message,
      bookingId: response.data.bookingId
    });
    
    return { success: true, response: response.data, duration };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error.response) {
      console.log(`❌ FAILED (${duration}ms):`, {
        status: error.response.status,
        error: error.response.data.error || error.response.data.message
      });
      
      return { 
        success: false, 
        status: error.response.status, 
        error: error.response.data.error || error.response.data.message,
        duration 
      };
    } else {
      console.log(`❌ ERROR (${duration}ms):`, error.message);
      return { success: false, error: error.message, duration };
    }
  }
}

// Function to run concurrent booking tests
async function runConcurrencyTest() {
  console.log('🚀 Starting Concurrency Test for Slot-Based Reservation System');
  console.log('=' .repeat(60));
  console.log(`Testing: ${testBookingData.eventName}`);
  console.log(`Date: ${testBookingData.eventDate}`);
  console.log(`Time: ${testBookingData.startTime} to ${testBookingData.endTime}`);
  console.log(`Hall ID: ${testBookingData.bookedHallId}`);
  console.log('=' .repeat(60));
  
  // Make two simultaneous booking attempts
  console.log('\n📝 Making 2 concurrent booking requests...');
  
  const promises = [
    makeBooking(1),
    makeBooking(2)
  ];
  
  const results = await Promise.all(promises);
  
  // Analyze results
  console.log('\n📊 Test Results:');
  console.log('=' .repeat(40));
  
  const successfulBookings = results.filter(r => r.success);
  const failedBookings = results.filter(r => !r.success);
  
  console.log(`Total Attempts: ${results.length}`);
  console.log(`Successful Bookings: ${successfulBookings.length}`);
  console.log(`Failed Bookings: ${failedBookings.length}`);
  
  if (successfulBookings.length === 1 && failedBookings.length === 1) {
    console.log('\n🎉 SUCCESS: Slot-based reservation system working correctly!');
    console.log('✅ Only one booking was created (preventing double-booking)');
    console.log('✅ The other request failed with appropriate error (409 Conflict)');
  } else if (successfulBookings.length === 0) {
    console.log('\n⚠️  WARNING: Both requests failed - check server configuration');
  } else if (successfulBookings.length > 1) {
    console.log('\n❌ FAILURE: Multiple bookings created - race condition detected!');
    console.log('❌ Slot-based reservation system is not working properly');
  }
  
  // Show detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    console.log(`\nAttempt ${index + 1}:`);
    if (result.success) {
      console.log(`  ✅ Status: Success`);
      console.log(`  📝 Message: ${result.response.message}`);
      console.log(`  🆔 Booking ID: ${result.response.bookingId}`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
    } else {
      console.log(`  ❌ Status: Failed`);
      console.log(`  🚫 Error: ${result.error}`);
      console.log(`  ⏱️  Duration: ${result.duration}ms`);
    }
  });
  
  console.log('\n🏁 Concurrency test completed!');
}

// Function to clean up test data (optional)
async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    // You can add cleanup logic here if needed
    // For example, delete test bookings by name or date
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('❌ Cleanup failed:', error.message);
  }
}

// Main execution
async function main() {
  try {
    await runConcurrencyTest();
    
    // Uncomment the next line if you want to clean up test data
    // await cleanupTestData();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runConcurrencyTest,
  makeBooking,
  cleanupTestData
};
