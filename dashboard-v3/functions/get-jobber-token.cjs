const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://duetright-dashboard.firebaseio.com`
});

async function getJobberToken() {
  try {
    // Get Angelo's user ID
    const userRecord = await admin.auth().getUserByEmail('angelo@duetright.com');
    console.log('User ID:', userRecord.uid);

    // Get the integration document
    const integrationDoc = await admin.firestore()
      .collection('user_integrations')
      .doc(userRecord.uid)
      .get();

    if (!integrationDoc.exists) {
      console.log('No integration document found');
      return;
    }

    const data = integrationDoc.data();
    const jobberToken = data?.jobber?.access_token;

    if (jobberToken) {
      console.log('\nJobber token found!');
      console.log('Token (first 20 chars):', jobberToken.substring(0, 20) + '...');
      console.log('\nTo test the API, run:');
      console.log(`JOBBER_TOKEN="${jobberToken}" node test-jobber-api.js`);
    } else {
      console.log('No Jobber token found in integration data');
      console.log('Available fields:', data?.jobber ? Object.keys(data.jobber) : 'No jobber data');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

getJobberToken();