const VERIFICATION_COMMAND = 'join';
const VERIFICATION_HOST = 'http://localhost'
const VERIFICATION_PORT = '3010'
const VERICICATION_BASE_URL = `${VERIFICATION_HOST}${VERIFICATION_PORT.length > 0 ? ':' : ''}${VERIFICATION_PORT}/verification-page`;
const VERIFICATION_TIMEOUT_MINUTES = 30;
const SESSION_SECRET = 'mouse-bot-discord-aXk1PxlAxLpwXl!2098x'

module.exports = {
    VERIFICATION_COMMAND,
    VERIFICATION_HOST,
    VERIFICATION_PORT,
    VERICICATION_BASE_URL,
    VERIFICATION_TIMEOUT_MINUTES,
    SESSION_SECRET
}