const admin = require('firebase-admin');

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '');
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  privateKey: privateKey,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const fcm = admin.messaging(app);

const verifyToken = async (token) => {
  try {
    await fcm.send({ token }, true);
    return true;
  } catch (err) {
    console.log(err.message);
    return false;
  }
};

const sendNotification = async (
  token,
  { title = '', body = '', type = '', image = '' }
) => {
  const isValid = await verifyToken(token);

  if (!isValid) return;

  const message = {
    notification: {
      title,
      body,
      image
    },
    token
  };

  try {
    const response = await fcm.send(message);
    console.log('[firebase] successfully sent message:', response);
    return response;
  } catch (err) {
    console.log('[firebase] error sending message:', err.message);
    return err;
  }
};

module.exports = {
  verifyToken,
  sendNotification
};