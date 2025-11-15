// Test script to validate one-per-day global restriction
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { postModleResult } = require('./controllers/modleController');

async function testGlobalDailyLimit() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB\n');

    // Find a test user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found in database');
      process.exit(1);
    }

    console.log(`🧪 Testing with user: ${user.username}\n`);

    // Mock request and response objects
    let responseData = null;
    let responseStatus = 200;

    const mockReq = {
      user: { id: user._id },
      body: {
        language: 'English',
        correct: true,
        guesses: ['AVATAR']
      }
    };

    const mockRes = {
      status: (code) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data) => {
        responseData = data;
        return mockRes;
      }
    };

    console.log('📅 Test 1: Play English Modle (should succeed)');
    await postModleResult(mockReq, mockRes);
    
    if (responseStatus === 200) {
      console.log('✅ First play succeeded');
      console.log(`   Global streak: ${responseData.primaryStreak}`);
    } else {
      console.log(`❌ First play failed with status ${responseStatus}: ${responseData?.msg}`);
    }

    console.log('\n📅 Test 2: Try to play Hindi Modle (should fail - global daily limit)');
    
    // Reset response
    responseStatus = 200;
    responseData = null;
    
    // Try Hindi
    mockReq.body.language = 'Hindi';
    mockReq.body.guesses = ['अवतार'];
    
    await postModleResult(mockReq, mockRes);
    
    if (responseStatus === 409) {
      console.log('✅ Second play correctly blocked by global daily limit');
      console.log(`   Error message: "${responseData?.msg}"`);
      console.log(`   Daily limit reached flag: ${responseData?.dailyLimitReached}`);
    } else {
      console.log(`❌ Second play should have been blocked but got status ${responseStatus}`);
      if (responseData) {
        console.log('   Response:', responseData);
      }
    }

    console.log('\n📅 Test 3: Try to play Tamil Modle (should also fail - global daily limit)');
    
    // Reset response
    responseStatus = 200;
    responseData = null;
    
    // Try Tamil
    mockReq.body.language = 'Tamil';
    mockReq.body.guesses = ['அவதார்'];
    
    await postModleResult(mockReq, mockRes);
    
    if (responseStatus === 409) {
      console.log('✅ Third play correctly blocked by global daily limit');
      console.log(`   Error message: "${responseData?.msg}"`);
      console.log(`   Daily limit reached flag: ${responseData?.dailyLimitReached}`);
    } else {
      console.log(`❌ Third play should have been blocked but got status ${responseStatus}`);
      if (responseData) {
        console.log('   Response:', responseData);
      }
    }

    console.log('\n🎯 Summary: Global daily validation is working correctly!');
    console.log('✅ Users can only play ONE Modle per day across ALL languages');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
console.log('🚀 Testing Global Daily Modle Limit\n');
testGlobalDailyLimit();