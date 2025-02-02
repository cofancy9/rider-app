const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = require('../../config/service-account-key.json');
} catch (error) {
  serviceAccount = null;
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  }
}

module.exports = admin;