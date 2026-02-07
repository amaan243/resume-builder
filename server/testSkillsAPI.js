import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

// Test functions
const tests = [
  {
    name: 'Search for "react"',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/skills/search?query=react`);
      if (response.data.length > 0 && response.data[0].name.toLowerCase().includes('react')) {
        log.success(`Found ${response.data.length} skills matching "react"`);
        console.log(`   First result: ${response.data[0].name} (${response.data[0].category})`);
        return true;
      }
      return false;
    }
  },
  {
    name: 'Search for "python"',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/skills/search?query=python`);
      if (response.data.length > 0 && response.data[0].name.toLowerCase().includes('python')) {
        log.success(`Found ${response.data.length} skills matching "python"`);
        console.log(`   First result: ${response.data[0].name} (${response.data[0].category})`);
        return true;
      }
      return false;
    }
  },
  {
    name: 'Search with short query (1 char)',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/skills/search?query=r`);
      if (response.data.length === 0) {
        log.success('Correctly returned empty array for short query');
        return true;
      }
      return false;
    }
  },
  {
    name: 'Get popular skills',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/skills/popular?limit=5`);
      if (response.data.length === 5 && response.data[0].popularity >= response.data[4].popularity) {
        log.success(`Retrieved ${response.data.length} popular skills, sorted by popularity`);
        console.log(`   Top skill: ${response.data[0].name} (popularity: ${response.data[0].popularity})`);
        return true;
      }
      return false;
    }
  },
  {
    name: 'Get all skills',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/skills`);
      if (response.data.length >= 300) {
        log.success(`Retrieved ${response.data.length} total skills`);
        return true;
      } else if (response.data.length > 0) {
        log.warning(`Only ${response.data.length} skills found. Did you run the seed script?`);
        return false;
      }
      return false;
    }
  },
  {
    name: 'Search case-insensitive',
    test: async () => {
      const response1 = await axios.get(`${BASE_URL}/skills/search?query=REACT`);
      const response2 = await axios.get(`${BASE_URL}/skills/search?query=react`);
      if (response1.data.length > 0 && response1.data.length === response2.data.length) {
        log.success('Case-insensitive search working correctly');
        return true;
      }
      return false;
    }
  },
  {
    name: 'Test result limit (max 10)',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/skills/search?query=e`);
      if (response.data.length <= 10) {
        log.success(`Results limited to ${response.data.length} (max 10)`);
        return true;
      }
      return false;
    }
  },
  {
    name: 'Search returns category',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/skills/search?query=react`);
      if (response.data.length > 0 && response.data[0].category) {
        log.success(`Category included: ${response.data[0].category}`);
        return true;
      }
      return false;
    }
  }
];

// Run all tests
const runTests = async () => {
  console.log('\n🧪 Running API Tests...\n');
  
  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    log.info(`Testing: ${name}`);
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
        log.error(`Test failed: ${name}`);
      }
    } catch (error) {
      failed++;
      log.error(`Test failed with error: ${name}`);
      console.log(`   Error: ${error.message}`);
    }
    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:\n`);
  log.success(`Passed: ${passed}/${tests.length}`);
  if (failed > 0) {
    log.error(`Failed: ${failed}/${tests.length}`);
  }
  console.log('\n' + '='.repeat(50) + '\n');

  if (failed === 0) {
    log.success('All tests passed! 🎉');
    console.log('\n✨ The Skill Autocomplete API is working perfectly!\n');
  } else {
    log.warning('Some tests failed. Please check the errors above.');
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running (npm run server)');
    console.log('   2. Database is seeded (npm run seed)');
    console.log('   3. MongoDB is connected\n');
  }
};

// Check if server is running first
const checkServer = async () => {
  try {
    await axios.get('http://localhost:3000');
    return true;
  } catch (error) {
    return false;
  }
};

// Main execution
(async () => {
  log.info('Checking if server is running...');
  
  const isRunning = await checkServer();
  
  if (!isRunning) {
    log.error('Backend server is not running!');
    console.log('\n💡 Start the server first:');
    console.log('   cd server');
    console.log('   npm run server\n');
    process.exit(1);
  }
  
  log.success('Server is running!');
  console.log('');
  
  await runTests();
})();
